# Running a Worker Under LightChain's Sortition Upgrade (2026-07-17)

*On 2026-07-14 LightChain testnet removed the off-chain dispatcher and moved worker selection to
an on-chain lottery. This guide documents the first fully verified external-operator run under
the new flow: one worker serving four whitelisted models end to end, every step proven with
on-chain transactions. It also documents the three traps that will stop any operator who follows
the old instructions.*

---

## What changed on 2026-07-14 (verified on-chain)

The team deployer (`0x7CC45156...d483`) executed the upgrade at 15:50-15:51 UTC:

| Action | Address |
|---|---|
| AIConfig upgraded (`upgradeToAndCall`) | `0xeCF4Ca5Ba6D97ae586993e170764a1E92231b67e` |
| JobRegistry upgraded, new impl | impl `0x0D0aDd7F707eC622333542c4320b8C8F19160B5c` |
| **SessionManager deployed (NEW)** | proxy `0x86AdA80864e87dE2275200FeE905b5C32b32Bf68`, impl `0xB81c4612EB0530065f7034da414A07097F61F235` |

What this means mechanically:

- **The dispatcher is gone.** The new JobRegistry has no `assignJob`, no `dispatcher()`, no
  `setDispatcher`. Nobody assigns you work anymore.
- **Workers win work by claiming it on-chain.** The gateway opens a session request on the
  SessionManager; eligible staked workers race to call `claimSession(reqId)`. First eligible
  claim wins, weighted by stake and reputation (`isEligible`, `getScore` live on the same
  contract).
- **The winning worker serves every job in that session** directly from chain events:
  `acknowledgeJob` -> fetch prompt blob -> infer -> post response blob -> `completeJob`.
- **The chain is the source of truth for answers.** The response ciphertext lives in an EIP-4844
  blob; streaming relays are best-effort UX on top.

## The recipe that actually works

Four things are required. Missing any one of them produces a worker that registers fine and then
silently never receives a single job (or refuses to start).

**1. Use the post-upgrade worker image.** `worker:latest` in the public registry
(`us-central1-docker.pkg.dev/lightchain/lightchain-testnet-public-docker/worker`) rebuilt
**2026-07-14T15:13Z**, the same day as the chain upgrade. Anything older (the previous `latest`
was 2026-06-26) contains zero `claimSession`/sortition code and waits forever for the removed
dispatcher. Verify your binary: `strings bin/worker | grep -c claimSession` must be non-zero.

**2. Enable sortition mode explicitly.** The new binary still defaults to gateway mode. Set:

```bash
SORTITION_ENABLED=true
SESSION_MANAGER_ADDRESS=0x86AdA80864e87dE2275200FeE905b5C32b32Bf68
SORTITION_STATE_DIR=/data/sortition          # optional, keeps claim state
```

The binary logs `worker sidecar running (sortition mode)` when this takes effect, and
`sortition mode takes precedence; gateway will be ignored` if both are configured.

**3. Run a local Redis.** The new build writes a health heartbeat to Redis at startup and treats
failure as **fatal** (`service init failed: initial heartbeat write failed`). The old build
tolerated missing Redis; the new one does not.

```bash
apt-get install -y redis-server
redis-server --port 6379 --save '' --appendonly no &
```

**4. Read answers from the chain, not the relay (consumer side).** The worker publishes stream
chunks to its own local Redis, which the public relay cannot see, so consumers waiting on the
relay WebSocket will time out even though the job completed. The reliable path, and the
protocol's own stated source of truth:

1. Poll `JobRegistry.getJob(jobId)` until `responseBlobHash != 0`.
2. Map execution time to a beacon slot (`slot = (block_ts - genesis_time) / 6`) and fetch
   `GET {beacon}/eth/v1/beacon/blob_sidecars/{slot}`; match the sidecar whose
   `0x01 || sha256(kzg_commitment)[1..]` equals `responseBlobHash`.
3. Unpack the blob: drop byte 0 of every 32-byte field element, concatenate the 31-byte chunks,
   read a big-endian `u32` length prefix, take that many bytes of ciphertext.
4. Verify `keccak256(ciphertext) == getJob().responseCiphertextHash`, then AES-GCM-decrypt with
   the session key.

Everything else from the pre-upgrade guide
([worker-setup-and-registration.md](worker-setup-and-registration.md): prerequisites, staking,
key import, keygen, register, model tags) is unchanged: stake 5,000 LCAI via `register`,
`keccak256(exact-tag)` model ids, the `llama3-8b` vs `llama3:8b` Ollama alias
(`ollama cp llama3:8b llama3-8b`), keygen + on-chain key binding (rotate only via
deregister + re-register).

### Complete worker environment (testnet, copy-paste)

```bash
# network
NETWORK=testnet
RPC_URL=https://rpc.testnet.lightchain.ai
CHAIN_ID=8200
BEACON_API_URL=https://beacon.testnet.lightchain.ai
# contracts (public, same for every operator)
WORKER_REGISTRY_ADDRESS=0x0000000000000000000000000000000000001002
AI_CONFIG_ADDRESS=0xeCF4Ca5Ba6D97ae586993e170764a1E92231b67e
JOB_REGISTRY_ADDRESS=0x531b3a87c5d785441b9cf55b98169f20fd9056a7
# NEW: the on-chain lottery. This is the public SessionManager contract every worker watches
# and sends claimSession() to. Not a secret; verify it on the explorer.
SORTITION_ENABLED=true
SESSION_MANAGER_ADDRESS=0x86AdA80864e87dE2275200FeE905b5C32b32Bf68
SORTITION_STATE_DIR=/data/sortition
# runtime
OLLAMA_URL=http://localhost:11434
BLOB_MODE=beacon
KEYS_DIR=/data
SUPPORTED_MODELS=gpt-oss:120b,gpt-oss:20b,glm-4.7-flash,llama3-8b   # what YOUR card can serve
WORKER_KEYSTORE_PATH=/data/eth-keystore/<your-keystore-file>
WORKER_KEYSTORE_PASSWORD=<your-password>
ENCRYPTION_KEYSTORE_PATH=/data/worker-encryption.key
SESSION_KEY_FILE=/data/session-keys.enc
# optional: web search + metrics
SEARCH_ENABLED=true
TAVILY_API_KEY=<yours>
WORKER_METRICS_ADDR=0.0.0.0:9101
```

Startup order: redis-server, then Ollama (pull your models + the llama3-8b alias), then
`lightchain-worker register` once, then the `worker` daemon. Success looks like
`worker sidecar running (sortition mode)` in the log, followed by
`claimed session request` lines once traffic arrives.

## The proof: four models, one worker, all on-chain (2026-07-17)

Worker `0x481A847A71d131C707C20F38d9F30C8082409Baa` (5,000 LCAI staked, one A100 80GB pod)
registered all four whitelisted models and served a real consumer job on each. Sortition
selected this worker every time; every answer was decrypted from the on-chain response blob
after verifying its keccak against the on-chain `responseCiphertextHash`. Consumer wallet:
`0x52582C175c9330808E474D672638232758F3b860`. Every hash below is complete; prefix with
`https://testnet.lightscan.app/tx/` to open it.

**gpt-oss:20b, jobId 1218 (sortition 22.4s, total 75.9s)**
- session created (gasless delegate): `0x73f4c6599f738d861c9083a7f9672c4b59bd2bc7bbd49cc4cfb2d03a728fdab4`
- submitJob (gasless): `0xf766c08b765fe21f20767451f982d1ec160086f6a97bc815f13106123e93d18b`
- worker claimSession: `0x82f9611400bf5ea4c3e3d78f986fd10947008698f3111b2bc93a14a42a14b718`
- worker acknowledgeJob: `0xa5bd37c9e70b13e81be5676673743c9ae51839e28a53fcfaa47bd2da28d4244f`
- worker response blob (EIP-4844): `0xce7611722fc02fbec04468b13e2e11dcc1002c6bf34f6a75879b5b820648fea1`
- worker completeJob: `0xf0bf2438d9357ca33a4efe78531f2936b24823662517100a91321dd1f3074406`

**gpt-oss:120b, jobId 1219 (sortition 36.5s, total 92.3s)**
- session created: `0x52830b2e824ca804f6a88aa3140dc31846dc5992a10fa0ef0beab3f01543a657`
- submitJob: `0x3e38bbb6d32509ec0901c7e5071c5d86339b5ff2c950cb498f83d947ca85bd9f`
- worker claimSession: `0x1c93a9bdcfd98a41c45170221a26abff09570122110f7b5b6e2de1a9cebd9c73`
- worker acknowledgeJob: `0xaeccae71639e97155feea45a88c6869c2f7a44c9f0add438902fc612a85afebf`
- worker response blob: `0x27f6829f68c6a3e643747d3db0f0ce9b7e6e439620ef6828fa7648f05b3d2b34`
- worker completeJob: `0xf6b6a1820d81c42d71666778f841e71fa1370716b07d1647f41ff93c4f29b7a8`

**glm-4.7-flash, jobId 1220 (sortition 32.5s, total 82.8s)**
- session created: `0x2b19324f25621a781c0c8ccb7b0d345126b936a8d0cb07556f188ac276dec22d`
- submitJob: `0x0b80729752d50b469df84da5d273ba34d292e9dd24da6e5b75df8835971d9069`
- worker claimSession: `0x5a3e5b66f4fb1172bcfc46571c66b29bc2ffa3f26c25ebf0f190711be6b36c3b`
- worker acknowledgeJob: `0x8a9e27befb64dbe667d3104d86a5de305d5745fe8b595a4043c0726b02d5512e`
- worker response blob: `0xc9e5ce914187797fe6483c6396b0470b0c12f7e3bbbdc7ac46a9d3f874c962f9`
- worker completeJob: `0x99f14448c9cb7b3ed61d2f35b1304d09a110a378eb479667530656c0d910e548`

**llama3-8b, jobId 1221 (sortition 26.5s, total 71.6s)**
- session created: `0xd0769d95d21b032f78d1d997b79047555ccd6185829bdc9f29d8f6e9c8f7eb99`
- submitJob: `0x34af26fe479a54c8235569e9417ff4860bb2fa12d909634f2de4e435f82bb555`
- worker claimSession: `0x30b0993709220e3a4dba34f5f68e408add56059a16911c6e9b66f07a7356765e`
- worker acknowledgeJob: `0x680a10bab8c8e0674a6bd5e26abbee2243adab8e689967a188fee86548b9f421`
- worker response blob: `0x1458d638fa3d7f75b6858765c1e260895925ac42becff200154a2a906ca1cfa6`
- worker completeJob: `0x88b4383c082d3609884b9a2b0ac226b9c965a1224377f3f6b9a5a3265740e8af`

Answers, for flavor: gpt-oss:20b introduced
itself as "ChatGPT, built on OpenAI's GPT-4 architecture"; glm-4.7-flash as "a large language
model developed by Z.ai"; llama3-8b called itself "a variant of the BERT architecture", which is
wrong, and a fitting one-line summary of why the network wants the newer models.

Notable: **the consumer gateway's `/api/models` still lists only llama3-8b, yet all four models
worked.** Sortition checks eligibility on-chain, so the protocol path does not depend on the
advertise list at all; only the chat UI's model picker does.

## Test it yourself in 2 minutes (no frontend, no worker needed)

> Newbie-friendly step-by-step version with troubleshooting: [how-to-test-the-new-models.md](how-to-test-the-new-models.md)

A ready-to-run consumer script lives in this repo: [consumer-e2e-test.mjs](consumer-e2e-test.mjs).
It performs the exact flow above (SIWE login, sortition, gasless session, encrypted prompt,
wait for completeJob, fetch + verify + decrypt the response blob) and prints the answer with
the tx links.

```bash
git clone https://github.com/marinom2/lightchain-ai-research
cd lightchain-ai-research
npm install ethers@6 lightnode-sdk

# first-time wallet only: prepay 3 LCAI + authorize the gateway delegate (one tx)
PRIVATE_KEY=0x<yourTestnetKey> SETUP=1 node consumer-e2e-test.mjs

# then test any whitelisted model (needs a live worker for it):
PRIVATE_KEY=0x<yourTestnetKey> MODEL="gpt-oss:20b" PROMPT="hello, which model are you?" node consumer-e2e-test.mjs
```

Notes: the wallet needs a little testnet LCAI (the per-job fee is 0.02 to 0.2 LCAI, drawn from
the prepaid balance; jobs themselves are gasless). If you already use the testnet chat with the
same wallet, you are already authorized and funded - skip SETUP. `MODEL` accepts the tag
(`gpt-oss:20b`, `gpt-oss:120b`, `glm-4.7-flash`, `llama3-8b`) or a raw `0x` modelId.

## The ask: the whitelisted models are proven, let's surface them to users

The hard part is already done. The team whitelisted gpt-oss:20b, gpt-oss:120b and glm-4.7-flash
on-chain, the sortition upgrade routes jobs to whichever worker serves them, and the runs above
show all of it working end to end today, with a live staked worker ready to keep serving them.
What remains is small and purely on the surfacing side:

1. **List worker-backed models in `/api/models`.** Eligibility is already on-chain
   (`isEligible`); reflecting it in the models endpoint makes gpt-oss and glm appear in the chat
   picker automatically, with no contract or protocol change. This single step turns the proven
   protocol capability into a user-visible feature.
2. **Read answers from the response blob in the chat frontend** (fallback when no stream
   arrives). External workers' stream chunks stay on their local Redis, but every answer already
   lands on-chain within seconds; a blob-read fallback gives browser users the full answer from
   any worker, exactly per the design's "chain and blobs are the source of truth."
3. *(Minor)* Reconcile fast deregister + re-register cycles in the workers dashboard so a
   re-registered worker shows as registered again.

With 1 and 2, users get a real model choice in the chat (including the far stronger gpt-oss
models) backed by capacity any external operator can add by following this guide.
