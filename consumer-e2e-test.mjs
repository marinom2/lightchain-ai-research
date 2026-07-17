#!/usr/bin/env node
// LightChain testnet consumer test: send one prompt to a whitelisted model through the REAL
// decentralized flow (SIWE auth -> on-chain sortition -> gasless session -> encrypted prompt
// blob -> worker inference -> response blob on chain) and decrypt the answer FROM THE CHAIN.
//
// Setup (once):   npm install ethers@6 lightnode-sdk
// First-time wallets also need the gasless prepay + delegate authorization (see SETUP below).
//
// Run:
//   PRIVATE_KEY=0x<yourTestnetKey> MODEL="gpt-oss:20b" PROMPT="hello" node consumer-e2e-test.mjs
//
// MODEL accepts an Ollama-style tag (gpt-oss:20b, gpt-oss:120b, glm-4.7-flash, llama3-8b)
// or a raw 0x modelId. First-time wallet? Run once with SETUP=1 to deposit 3 LCAI and
// authorize the gateway delegate (wallet must hold a little testnet LCAI).
import { createHash } from "node:crypto";
import { ethers } from "ethers";
import { generateSessionKey, importPublicKey, encryptSessionKey, encrypt, decrypt } from "./node_modules/lightnode-sdk/dist/crypto.js";

const GW = "https://chat-api.testnet.lightchain.ai";
const BEACON = "https://beacon.testnet.lightchain.ai";
const RPC = "https://rpc.testnet.lightchain.ai";
const JOB_REGISTRY = "0x531b3a87c5d785441b9cf55b98169f20fd9056a7";
const GATEWAY_DELEGATE = "0xFDBa3B97BCc393682bf4D16A43E67B1E2059cAC8"; // opens sessions for you, gaslessly
const EX = "https://testnet.lightscan.app/tx/";

const PK = process.env.PRIVATE_KEY;
if (!PK) { console.error("Set PRIVATE_KEY=0x... (a funded testnet wallet)"); process.exit(1); }
const MODEL_IN = process.env.MODEL || "gpt-oss:20b";
const MODEL = MODEL_IN.startsWith("0x") ? MODEL_IN : ethers.id(MODEL_IN); // modelId = keccak256(exact tag)
const PROMPT = process.env.PROMPT || "In one short sentence, introduce yourself and say exactly which model you are.";

const rpc = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PK, rpc);
const toHex = (u8) => "0x" + Buffer.from(u8).toString("hex");
const b64 = (u8) => Buffer.from(u8).toString("base64");

// ---------- optional one-time setup: prepay + authorize the delegate ----------
if (process.env.SETUP) {
  const amt = ethers.parseEther(process.env.SETUP_AMOUNT || "3");
  const jr = new ethers.Contract(JOB_REGISTRY, ["function depositAndAuthorize(address delegate) payable"], wallet);
  console.log("SETUP: depositAndAuthorize(", GATEWAY_DELEGATE, ") with", ethers.formatEther(amt), "LCAI ...");
  const tx = await jr.depositAndAuthorize(GATEWAY_DELEGATE, { value: amt });
  console.log("  tx:", EX + tx.hash); await tx.wait(); console.log("  done. Re-run without SETUP.");
  process.exit(0);
}

// ---------- 1) SIWE login ----------
const csrf = (await (await fetch(GW + "/api/auth/csrf")).json()).csrfToken;
const ch = await (await fetch(GW + "/api/auth/challenge?address=" + wallet.address)).json();
const v = await (await fetch(GW + "/api/auth/verify", { method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify({ message: ch.message, signature: await wallet.signMessage(ch.message) }) })).json();
if (!v.token) { console.error("auth failed:", JSON.stringify(v).slice(0, 200)); process.exit(1); }
const H = { "content-type": "application/json", authorization: "Bearer " + v.token };
console.log("1. authed:", wallet.address, "| model:", MODEL_IN, "(", MODEL.slice(0, 12) + "... )");

// ---------- 2) on-chain sortition: a worker claims your session ----------
let sort; const t0 = Date.now();
for (let i = 0; i < 10; i++) {
  const r = await fetch(GW + "/api/sessions/sortition/request", { method: "POST", headers: H, body: JSON.stringify({ modelId: MODEL }) });
  const body = await r.text();
  if (r.status === 403) { console.error("403 from sortition: your wallet has no delegate authorization yet. Run once with SETUP=1 (needs ~3 testnet LCAI)."); process.exit(1); }
  try { sort = JSON.parse(body); } catch { sort = {}; }
  if (sort.worker && sort.workerEncryptionKey) break;
  console.log("   sortition attempt", i + 1, "-> status", r.status, "(no worker claimed yet; a live worker for this model must exist)");
  await new Promise((z) => setTimeout(z, 3000));
}
if (!sort?.worker) { console.error("No worker claimed the session. Is a worker for this model online right now?"); process.exit(1); }
console.log("2. sortition winner:", sort.worker, "(", ((Date.now() - t0) / 1000).toFixed(1) + "s )");

// ---------- 3) wrap a fresh session key to the worker (end-to-end encryption) ----------
const sessionKey = await generateSessionKey();
const wrap = async (hk) => toHex(await encryptSessionKey(sessionKey, importPublicKey(ethers.getBytes(hk.startsWith("0x") ? hk : "0x" + hk))));
const keysRes = await (await fetch(GW + "/api/sessions/sortition/" + sort.reqId + "/keys", { method: "POST", headers: H, body: JSON.stringify({ encWorkerKey: await wrap(sort.workerEncryptionKey), encDisputerKey: sort.disputerEncryptionKey && sort.disputerEncryptionKey !== "0x" ? await wrap(sort.disputerEncryptionKey) : "0x" }) })).json();
console.log("3. session created on-chain (gasless): sessionId", keysRes.sessionId, "| tx:", EX + keysRes.txHash);

// ---------- 4) encrypted prompt -> blob -> job ----------
const ct = await encrypt(sessionKey, new TextEncoder().encode(PROMPT));
const blobJson = await (await fetch(GW + "/api/blobs", { method: "POST", headers: H, body: JSON.stringify({ data: b64(ct), sessionId: String(keysRes.sessionId) }) })).json();
const msg = await (await fetch(GW + "/api/sessions/" + keysRes.sessionId + "/messages", { method: "POST", headers: H, body: JSON.stringify({ blobHash: blobJson.blobHashes[0] }) })).json();
console.log("4. job submitted (gasless): jobId", msg.jobId, "| tx:", EX + msg.txHash);

// ---------- 5) the chain is the answer channel: wait for completeJob ----------
const jr = new ethers.Contract(JOB_REGISTRY, ["function getJob(uint256) view returns (tuple(uint256 sessionId,address worker,uint8 state,uint256 escrowedFee,bytes32 promptBlobHash,bytes32 responseBlobHash,uint256 submittedAt,uint256 ackTimestamp,uint256 completedAt,uint256 deadline,address disputeFiler,uint256 disputeBond,bytes32 reExecutionBlobHash,uint256 similarityScore,uint256 disputeCreatedAt,bytes32 responseCiphertextHash,uint256 submitBlockNumber))"], rpc);
let job;
for (let i = 0; i < 60; i++) {
  await new Promise((z) => setTimeout(z, 5000));
  job = await jr.getJob(msg.jobId);
  if (job.responseBlobHash !== ethers.ZeroHash) break;
  if (i % 6 === 5) console.log("   ...worker processing (job state", job.state.toString(), ")");
}
if (!job || job.responseBlobHash === ethers.ZeroHash) { console.error("Job did not complete within 5 minutes."); process.exit(1); }
console.log("5. job COMPLETED on-chain by", job.worker);

// ---------- 6) fetch the response blob from the beacon chain, verify, decrypt ----------
const genesis = parseInt((await (await fetch(BEACON + "/eth/v1/beacon/genesis")).json()).data.genesis_time);
const head = Math.floor((Date.now() / 1000 - genesis) / 6) + 2;
let answer = null;
outer:
for (let s = head; s > head - 60; s--) {
  const r = await fetch(BEACON + "/eth/v1/beacon/blob_sidecars/" + s, { signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r || !r.ok) continue;
  for (const sc of ((await r.json()).data || [])) {
    const vh = "0x01" + createHash("sha256").update(Buffer.from(sc.kzg_commitment.slice(2), "hex")).digest("hex").slice(2);
    if (vh !== job.responseBlobHash) continue;
    const raw = Buffer.from(sc.blob.slice(2), "hex");
    const chunks = []; for (let i = 0; i < raw.length; i += 32) chunks.push(raw.subarray(i + 1, i + 32));
    const stream = Buffer.concat(chunks);
    const ctxt = stream.subarray(4, 4 + stream.readUInt32BE(0));
    if (ethers.keccak256(ctxt) !== job.responseCiphertextHash) continue;
    console.log("6. response blob found (slot " + s + ") | keccak verified against on-chain hash");
    answer = new TextDecoder().decode(await decrypt(sessionKey, new Uint8Array(ctxt)));
    break outer;
  }
}
if (answer === null) { console.error("Could not locate the response blob (it may have pruned; re-run)."); process.exit(1); }
console.log("\n=== ANSWER (decrypted from the on-chain blob) ===");
console.log(answer.trim());
console.log("\n=== PROOF ===");
console.log("  worker    :", job.worker);
console.log("  session tx:", EX + keysRes.txHash);
console.log("  submitJob :", EX + msg.txHash, "(jobId " + msg.jobId + ")");
console.log("  total     :", ((Date.now() - t0) / 1000).toFixed(1) + "s");
