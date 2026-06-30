#!/usr/bin/env node
/**
 * Real model test on a rented RunPod GPU, via Ollama (the engine LightChain
 * workers use). Creates a pod, pulls the model, runs one inference, records
 * load time / tokens-per-second / total latency vs the 120s job budget / peak
 * VRAM / a sample answer, then ALWAYS terminates the pod.
 *
 * Reads the RunPod key from the environment only (RUNPOD_API_KEY). No secret is
 * stored in this file or in the results. Run:
 *   RUNPOD_API_KEY=... node gpu-tests/run.mjs <on-chain-name> <pull-tag> <diskGb> "<gpu1>|<gpu2>|..."
 * Example:
 *   ... node gpu-tests/run.mjs glm-4.7-flash glm-4.7-flash 40 "NVIDIA GeForce RTX 4090|NVIDIA RTX A5000"
 */
import { writeFileSync, mkdirSync } from "node:fs";

// Auto-load .env (Node >=22) so you only need to drop your key in a .env file at
// the repo root. Run these tests from the repo root.
try { process.loadEnvFile(".env"); } catch { /* no .env; fall back to process.env */ }

const KEY = process.env.RUNPOD_API_KEY;
if (!KEY) { console.error("RUNPOD_API_KEY not set. Copy .env.example to .env and add your RunPod API key."); process.exit(1); }

const NAME = process.argv[2] || "glm-4.7-flash";
const PULL = process.argv[3] || NAME;
const DISK = parseInt(process.argv[4] || "40", 10);
const GPUS = (process.argv[5] || "NVIDIA GeForce RTX 4090|NVIDIA RTX A5000|NVIDIA GeForce RTX 3090").split("|");
const PROMPT = process.env.PROMPT || "Write a Python function that returns the nth Fibonacci number iteratively. Only the code.";
const PORT = 11434;
const BUDGET_SEC = 120;
const GQL = `https://api.runpod.io/graphql?api_key=${KEY}`;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query) {
  const r = await fetch(GQL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) });
  const j = await r.json();
  if (j.errors) throw new Error("GraphQL: " + JSON.stringify(j.errors));
  return j.data;
}

async function listTestPods() {
  const d = await gql(`query { myself { pods { id name desiredStatus } } }`);
  return (d.myself?.pods || []).filter((p) => p.name?.startsWith("lc-test-"));
}
async function terminate(id) {
  try { await gql(`mutation { podTerminate(input:{podId:"${id}"}) }`); log("terminated", id); }
  catch (e) { log("terminate error", id, e.message); }
}

async function createPod() {
  for (const cloud of ["COMMUNITY", "SECURE"]) {
    for (const gpu of GPUS) {
      const m = `mutation { podFindAndDeployOnDemand(input:{
        cloudType:${cloud}, gpuCount:1, gpuTypeId:"${gpu}",
        name:"lc-test-${NAME}", imageName:"ollama/ollama:latest",
        containerDiskInGb:${DISK}, volumeInGb:0, ports:"${PORT}/http",
        env:[{key:"OLLAMA_HOST",value:"0.0.0.0"}]
      }){ id machineId } }`;
      try {
        const d = await gql(m);
        const id = d.podFindAndDeployOnDemand?.id;
        if (id) { log(`deployed ${gpu} (${cloud}) ->`, id); return { id, gpu, cloud }; }
      } catch (e) { log(`no ${gpu} (${cloud}):`, e.message.slice(0, 120)); }
    }
  }
  throw new Error("could not deploy any GPU");
}

const base = (id) => `https://${id}-${PORT}.proxy.runpod.net`;
async function waitReady(id, maxMs = 600000) {
  // The RunPod proxy can return its OWN 200 interstitial before Ollama is up,
  // so require a real Ollama JSON body with a .version field, not just status 200.
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    try {
      const r = await fetch(base(id) + "/api/version", { signal: AbortSignal.timeout(8000) });
      const txt = await r.text();
      let v; try { v = JSON.parse(txt); } catch { v = null; }
      if (r.ok && v?.version) { log("ollama up after", Math.round((Date.now() - t0) / 1000), "s, version", v.version); return; }
    } catch { /* not up yet */ }
    await sleep(5000);
  }
  throw new Error("pod/ollama not ready in time");
}

async function pull(id) {
  // warm the proxy for the POST/api path first
  try { const t = await fetch(base(id) + "/api/tags", { signal: AbortSignal.timeout(8000) }); log("tags status", t.status); } catch {}
  const t0 = Date.now();
  const r = await fetch(base(id) + "/api/pull", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: PULL, stream: true }), signal: AbortSignal.timeout(1500000),
  });
  log("pull http status", r.status);
  if (!r.ok || !r.body) { throw new Error("pull http " + r.status + ": " + (await r.text()).slice(0, 200)); }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let last = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = dec.decode(value).trim().split("\n");
    for (const ln of lines) { try { const o = JSON.parse(ln); if (o.status && o.status !== last) { last = o.status; log("pull:", o.status); } if (o.error) throw new Error("pull error: " + o.error); } catch (e) { if (e.message.startsWith("pull error")) throw e; } }
  }
  const sec = (Date.now() - t0) / 1000;
  log("pull done in", sec.toFixed(0), "s");
  return sec;
}

async function generate(id) {
  const r = await fetch(base(id) + "/api/generate", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: PULL, prompt: PROMPT, stream: false, options: { temperature: 0, num_predict: 256 } }),
    signal: AbortSignal.timeout(300000),
  });
  const txt = await r.text();
  log("generate http status", r.status, "len", txt.length);
  let j; try { j = JSON.parse(txt); } catch { throw new Error("generate non-JSON (" + r.status + "): " + txt.slice(0, 200)); }
  if (j.error) throw new Error("generate error: " + j.error);
  return j;
}

async function ps(id) {
  try { const r = await fetch(base(id) + "/api/ps", { signal: AbortSignal.timeout(8000) }); return (await r.json()).models?.[0] || null; } catch { return null; }
}

(async () => {
  // safety: clean any orphan test pods first
  for (const p of await listTestPods()) { log("orphan test pod found:", p.id, p.name); await terminate(p.id); }

  let pod;
  try {
    pod = await createPod();
    await waitReady(pod.id);
    const pullSec = await pull(pod.id);
    log("inference 1 (cold: includes one-time model load)...");
    const g1 = await generate(pod.id);
    log("inference 2 (warm: model already resident, same prompt @ temp 0)...");
    const g2 = await generate(pod.id);
    const psInfo = await ps(pod.id);

    const ns = 1e9;
    const text = (g) => ((g.response || "") + (g.thinking || "")).trim();
    const out = {
      model: NAME, pullTag: PULL,
      gpu: pod.gpu, cloud: pod.cloud,
      pull_seconds: Math.round(pullSec),
      cold_load_seconds: +(g1.load_duration / ns).toFixed(2),
      cold_total_seconds: +(g1.total_duration / ns).toFixed(2),
      warm_total_seconds: +(g2.total_duration / ns).toFixed(2), // real per-job latency on a warm worker
      warm_load_seconds: +(g2.load_duration / ns).toFixed(2),
      output_tokens: g2.eval_count,
      tokens_per_sec: +(g2.eval_count / (g2.eval_duration / ns)).toFixed(1),
      warm_fits_120s_budget: (g2.total_duration / ns) <= BUDGET_SEC,
      cold_fits_120s_budget: (g1.total_duration / ns) <= BUDGET_SEC,
      deterministic_same_worker: text(g1) === text(g2), // same output twice @ temp 0 -> exact-match verifiable
      vram_gb: psInfo ? +(psInfo.size_vram / 1073741824).toFixed(1) : null,
      sample_output: text(g2).slice(0, 600),
      tested_at: new Date().toISOString(),
    };
    mkdirSync("gpu-tests/results", { recursive: true });
    writeFileSync(`gpu-tests/results/${NAME}.json`, JSON.stringify(out, null, 2));
    log("RESULT:", JSON.stringify({ ...out, sample_output: out.sample_output.slice(0, 80) + "..." }, null, 2));
  } catch (e) {
    log("ERROR:", e.message);
    process.exitCode = 1;
  } finally {
    if (pod?.id) await terminate(pod.id);
    // double-check nothing is left running
    for (const p of await listTestPods()) { log("cleanup leftover:", p.id); await terminate(p.id); }
    log("done.");
  }
})();
