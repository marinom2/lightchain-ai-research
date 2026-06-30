#!/usr/bin/env node
/**
 * Batch real-model test on ONE rented RunPod GPU, via Ollama. Pulls each model,
 * measures cold + warm latency, tokens/sec, peak VRAM, and whether it fits the
 * 120s job budget, then ALWAYS terminates the pod. Reads RUNPOD_API_KEY from env.
 *
 *   RUNPOD_API_KEY=... node gpu-tests/run-batch.mjs <tier> <diskGb> "<gpu1>|<gpu2>" \
 *     "name,pullTag,kind;name,pullTag,kind;..."   (kind = text | embed)
 */
import { writeFileSync, mkdirSync } from "node:fs";

// Auto-load .env (Node >=22). Run from the repo root after copying .env.example to .env.
try { process.loadEnvFile(".env"); } catch { /* no .env; fall back to process.env */ }

const KEY = process.env.RUNPOD_API_KEY;
if (!KEY) { console.error("RUNPOD_API_KEY not set. Copy .env.example to .env and add your RunPod API key."); process.exit(1); }

const TIER = process.argv[2] || "tier";
const DISK = parseInt(process.argv[3] || "80", 10);
const GPUS = (process.argv[4] || "NVIDIA GeForce RTX 4090").split("|");
const MODELS = (process.argv[5] || "").split(";").filter(Boolean).map((s) => {
  const [name, pullTag, kind] = s.split(",");
  return { name, pullTag, kind: kind || "text" };
});
const PROMPT = "Write a Python function that returns the nth Fibonacci number iteratively. Only the code.";
const EMBED_INPUT = "Lightchain AI is a decentralized worker network for open AI models.";
const PORT = 11434, BUDGET = 120, ns = 1e9;
const GQL = `https://api.runpod.io/graphql?api_key=${KEY}`;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = (id) => `https://${id}-${PORT}.proxy.runpod.net`;

async function gql(q) {
  const r = await fetch(GQL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: q }) });
  const j = await r.json();
  if (j.errors) throw new Error("GraphQL: " + JSON.stringify(j.errors));
  return j.data;
}
async function listTestPods() { const d = await gql(`query { myself { pods { id name } } }`); return (d.myself?.pods || []).filter((p) => p.name?.startsWith("lc-test-")); }
async function terminate(id) { try { await gql(`mutation { podTerminate(input:{podId:"${id}"}) }`); log("terminated", id); } catch (e) { log("term err", e.message); } }

async function createPod() {
  for (const cloud of ["COMMUNITY", "SECURE"]) for (const gpu of GPUS) {
    const m = `mutation { podFindAndDeployOnDemand(input:{ cloudType:${cloud}, gpuCount:1, gpuTypeId:"${gpu}", name:"lc-test-${TIER}", imageName:"ollama/ollama:latest", containerDiskInGb:${DISK}, volumeInGb:0, ports:"${PORT}/http", env:[{key:"OLLAMA_HOST",value:"0.0.0.0"}] }){ id } }`;
    try { const d = await gql(m); const id = d.podFindAndDeployOnDemand?.id; if (id) { log(`deployed ${gpu} (${cloud}) ->`, id); return { id, gpu, cloud }; } }
    catch (e) { log(`no ${gpu} (${cloud}):`, e.message.slice(0, 90)); }
  }
  throw new Error("no GPU deployable");
}
async function waitReady(id, maxMs = 600000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    try { const r = await fetch(base(id) + "/api/version", { signal: AbortSignal.timeout(8000) }); const v = JSON.parse(await r.text()); if (r.ok && v?.version) { log("ollama", v.version, "up after", Math.round((Date.now() - t0) / 1000), "s"); return; } } catch {}
    await sleep(5000);
  }
  throw new Error("not ready");
}
async function pull(id, tag) {
  const t0 = Date.now();
  const r = await fetch(base(id) + "/api/pull", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: tag, stream: true }), signal: AbortSignal.timeout(1800000) });
  if (!r.ok || !r.body) throw new Error("pull http " + r.status);
  const rd = r.body.getReader(); const dec = new TextDecoder(); let last = "";
  for (;;) { const { done, value } = await rd.read(); if (done) break; for (const ln of dec.decode(value).trim().split("\n")) { try { const o = JSON.parse(ln); if (o.status && o.status !== last) { last = o.status; } if (o.error) throw new Error("pull: " + o.error); } catch (e) { if (String(e.message).startsWith("pull:")) throw e; } } }
  return Math.round((Date.now() - t0) / 1000);
}
async function gen(id, tag) {
  const r = await fetch(base(id) + "/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: tag, prompt: PROMPT, stream: false, options: { temperature: 0, num_predict: 128 } }), signal: AbortSignal.timeout(300000) });
  const t = await r.text(); const j = JSON.parse(t); if (j.error) throw new Error("gen: " + j.error); return j;
}
async function embed(id, tag) {
  const t0 = Date.now();
  const r = await fetch(base(id) + "/api/embed", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: tag, input: EMBED_INPUT }), signal: AbortSignal.timeout(120000) });
  const j = JSON.parse(await r.text()); if (j.error) throw new Error("embed: " + j.error);
  const dim = j.embeddings?.[0]?.length || j.embedding?.length || 0;
  return { total_seconds: +((j.total_duration || (Date.now() - t0) * 1e6) / ns).toFixed(2), load_seconds: +((j.load_duration || 0) / ns).toFixed(2), dim };
}
async function ps(id) { try { const r = await fetch(base(id) + "/api/ps", { signal: AbortSignal.timeout(8000) }); return (await r.json()).models?.[0] || null; } catch { return null; } }
async function unload(id, tag) { try { await fetch(base(id) + "/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: tag, prompt: "", keep_alive: 0 }), signal: AbortSignal.timeout(30000) }); } catch {} }

async function testModel(id, m) {
  log(`-- ${m.name} (${m.kind}) --`);
  const pull_seconds = await pull(id, m.pullTag);
  log("pulled in", pull_seconds, "s");
  let out;
  if (m.kind === "embed") {
    const e = await embed(id, m.pullTag);
    const p = await ps(id);
    out = { model: m.name, pullTag: m.pullTag, kind: "embed", pull_seconds, total_seconds: e.total_seconds, embedding_dim: e.dim, fits_120s_budget: e.total_seconds <= BUDGET, vram_gb: p ? +(p.size_vram / 1073741824).toFixed(1) : null };
  } else {
    const g1 = await gen(id, m.pullTag); // cold
    const g2 = await gen(id, m.pullTag); // warm
    const p = await ps(id);
    out = { model: m.name, pullTag: m.pullTag, kind: m.kind, pull_seconds,
      cold_total_seconds: +(g1.total_duration / ns).toFixed(2), cold_load_seconds: +(g1.load_duration / ns).toFixed(2),
      warm_total_seconds: +(g2.total_duration / ns).toFixed(2), output_tokens: g2.eval_count,
      tokens_per_sec: +(g2.eval_count / (g2.eval_duration / ns)).toFixed(1),
      warm_fits_120s_budget: (g2.total_duration / ns) <= BUDGET, cold_fits_120s_budget: (g1.total_duration / ns) <= BUDGET,
      vram_gb: p ? +(p.size_vram / 1073741824).toFixed(1) : null };
  }
  out.gpu = GPU.gpu; out.cloud = GPU.cloud; out.tested_at = new Date().toISOString();
  mkdirSync("gpu-tests/results", { recursive: true });
  writeFileSync(`gpu-tests/results/${m.name}.json`, JSON.stringify(out, null, 2));
  log("RESULT", JSON.stringify(out));
  await unload(id, m.pullTag);
  return out;
}

let GPU;
(async () => {
  // NOTE: only ever terminate the pod THIS run creates - never a broad
  // lc-test-* sweep, which would kill a sibling run's pod.
  let pod;
  try {
    pod = await createPod(); GPU = pod;
    await waitReady(pod.id);
    for (const m of MODELS) { try { await testModel(pod.id, m); } catch (e) { log("MODEL ERROR", m.name, e.message); } }
  } catch (e) { log("FATAL", e.message); process.exitCode = 1; }
  finally { if (pod?.id) await terminate(pod.id); log("done (only this run's pod terminated)."); }
})();
