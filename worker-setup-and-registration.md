# Running a LightChain AI Worker: Setup, Registration, and Serving the Models

*A step-by-step operator guide for LightChain **testnet** (chain 8200), written from a working
setup. It covers standing up a worker, registering it on-chain with a stake, adding the
whitelisted models, running the daemon, verifying it's live, and rotating keys. Every command
here was used in practice; where something is environment- or version-specific, it's flagged.*

> Status note (2026-07-15): the register + add-models + daemon steps below are proven. After
> the 2026-07-14 upgrade, worker **selection** is on-chain (sortition, weighted by stake +
> reputation) - a registered, online worker that serves a model is eligible; that end of the
> path is being validated live and any post-upgrade specifics will be folded in here.

---

## 0. What a worker is (and needs)

A worker is a machine with a GPU that:
- runs the models locally via **Ollama**,
- is **registered on-chain** in the WorkerRegistry with a **stake** and an **encryption key**,
- runs the **worker daemon**, which connects to the worker-gateway and answers jobs.

You need three things: **a GPU**, **a funded wallet** (for the stake + a little gas), and
**the worker container image**.

---

## 1. Prerequisites

**Wallet & funds**
- An EVM wallet (private key) you control.
- **Minimum stake: 5,000 testnet LCAI** (read live from `AIConfig.getMinWorkerStake()`), plus
  a little extra for gas. The stake is locked while registered and returned on deregister.

**GPU per model** (measured; VRAM is model weights + KV cache):

| Model | Ollama tag | ~Disk | Min GPU | Fee (LCAI/job) |
|---|---|---|---|---|
| glm-4.7-flash | `glm-4.7-flash` | 19 GB | 24 GB | 0.02 |
| gpt-oss:20b | `gpt-oss:20b` | 13 GB | 16-24 GB | 0.04 |
| gpt-oss:120b | `gpt-oss:120b` | 65 GB | 80 GB | 0.2 |
| qwen3-vl:8b | `qwen3-vl:8b` | 6 GB | 8-12 GB | 0.02 |
| qwen3-vl:30b | `qwen3-vl:30b` | 18 GB | 24 GB | 0.08 |
| qwen3-embedding:0.6b | `qwen3-embedding:0.6b` | 0.6 GB | 8 GB / CPU | 0.005 |
| llama3-8b (legacy) | `llama3-8b` | 4.7 GB | 8 GB | 0.02 |

A single 24 GB card comfortably serves the first tier (all except gpt-oss:120b). gpt-oss:120b
needs an 80 GB card. One worker can serve several models (Ollama loads them on demand).

**modelId = `keccak256(exact Ollama tag)`.** Verified testnet IDs:
```
glm-4.7-flash        0x35f686ade96649d2bf47e024eca280619fc80458c5cdece4804fc3f1561bd542
gpt-oss:20b          0x812058e1dbc4b7ee2b5c8db96cd83bdc110740ae43d3fa4ee116e7e38e2ea802
gpt-oss:120b         0x7519e6b291d1e88ee9c045dce2d1e9db92a3bba4ed967be12426b3c71bbc7c98
qwen3-vl:8b          0xab5055d54803561873a25c21f4cc853371b17b69620b39b2ecca824c259b2ff3
qwen3-vl:30b         0x18db253105a3231f058bd6a14970d9230a64a9e54df29e47cc5c6c355c1a84ca
qwen3-embedding:0.6b 0xde701c92d38c91686d6f7f44f9b634b3adf16b8e79bb9094abfec66180a18f67
llama3-8b            0xf4a414fa51803433e9197f32cda96d5cb2ac8269c481eb0262fe2dd11f428848
```

**Network + image**
```
RPC_URL                 https://rpc.testnet.lightchain.ai      (CHAIN_ID 8200)
WORKER_GATEWAY_URL      https://worker-gateway.testnet.lightchain.ai
BEACON_API_URL          https://beacon.testnet.lightchain.ai
WORKER_REGISTRY_ADDRESS 0x0000000000000000000000000000000000001002   (genesis predeploy)
AI_CONFIG_ADDRESS       0xeCF4Ca5Ba6D97ae586993e170764a1E92231b67e
JOB_REGISTRY_ADDRESS    0x531b3a87c5d785441b9cf55b98169f20fd9056a7
Worker image            us-central1-docker.pkg.dev/lightchain/lightchain-testnet-public-docker/worker:latest
Explorer                https://testnet.lightscan.app
```

---

## 2. The two binaries inside the image (important)

The worker image ships **two** programs - do not confuse them:

- **`/bin/lightchain-worker`** = the **operator CLI** (`import-key`, `keygen`, `register`,
  `add-models`, `deregister`, `status`, `balance`, `withdraw`, `drain`, `undrain`). Run it
  with no subcommand and it just prints help and exits.
- **`/bin/worker`** = the **daemon** (the image's default entrypoint). This is what actually
  serves jobs. Run *this* to go live.

So: use `lightchain-worker <subcommand>` for setup, then run `/bin/worker` (or just the image
with no arguments) for the daemon.

---

## 3. Install Ollama and pull the models

On the worker host (needs `zstd` for the installer):
```bash
sudo apt-get update && sudo apt-get install -y zstd curl
curl -fsSL https://ollama.com/install.sh | sh
export OLLAMA_HOST=0.0.0.0:11434
ollama serve &                     # keep running (systemd unit recommended)

# pull the models you intend to serve (24GB tier example):
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull qwen3-vl:8b
ollama pull qwen3-vl:30b
ollama pull qwen3-embedding:0.6b
# 80GB card only:
# ollama pull gpt-oss:120b
```
> The GPU auto-detect warning at install ("no GPU detected" when `lspci` is missing) is
> cosmetic - Ollama still uses the GPU. Verify with `curl localhost:11434/api/ps` after a
> generate: `size_vram > 0` means it's on the GPU.

---

## 4. Configure the worker environment

Create `worker.env` (secrets stay here, not in any repo):
```bash
NETWORK=testnet
RPC_URL=https://rpc.testnet.lightchain.ai
CHAIN_ID=8200
BEACON_API_URL=https://beacon.testnet.lightchain.ai
WORKER_GATEWAY_URL=https://worker-gateway.testnet.lightchain.ai
WORKER_REGISTRY_ADDRESS=0x0000000000000000000000000000000000001002
AI_CONFIG_ADDRESS=0xeCF4Ca5Ba6D97ae586993e170764a1E92231b67e
JOB_REGISTRY_ADDRESS=0x531b3a87c5d785441b9cf55b98169f20fd9056a7
OLLAMA_URL=http://localhost:11434
BLOB_MODE=beacon
KEYS_DIR=/data
# comma-separated EXACT tags this worker will serve:
SUPPORTED_MODELS=glm-4.7-flash,gpt-oss:20b,qwen3-vl:8b,qwen3-vl:30b,qwen3-embedding:0.6b
# keystore paths (created in the next steps):
WORKER_KEYSTORE_PASSWORD=change-me-strong
ENCRYPTION_KEYSTORE_PATH=/data/worker-encryption.key
SESSION_KEY_FILE=/data/session-keys.enc
# optional web search (Tavily) - both required to advertise the "search" capability:
# SEARCH_ENABLED=true
# TAVILY_API_KEY=tvly-...
# SEARCH_MAX_RESULTS=6
# SEARCH_TIMEOUT=30s
```

Run everything with the same `/data` volume and `worker.env`. In Docker:
```bash
DATA=$HOME/lc-worker-data && mkdir -p "$DATA"
run_cli() { docker run --rm --network host --entrypoint /bin/lightchain-worker \
  -v "$DATA":/data --env-file worker.env \
  us-central1-docker.pkg.dev/lightchain/lightchain-testnet-public-docker/worker:latest "$@"; }
```
> No-Docker environments (e.g. some rented pods): extract the binaries once with
> `crane export <image> - | tar -x -C /worker-fs`, then run `/worker-fs/bin/lightchain-worker`
> and `/worker-fs/bin/worker` directly with the same env. Everything else is identical.

---

## 5. Import your wallet key and generate the encryption key

```bash
# 1) import your EVM signing key (hex WITHOUT 0x prefix)
run_cli import-key --private-key <PRIVATE_KEY_NO_0x> \
  --password "$WORKER_KEYSTORE_PASSWORD" --output /data/eth-keystore
# note the printed keystore file path, then set it in worker.env:
#   WORKER_KEYSTORE_PATH=/data/eth-keystore/UTC--....--<address>

# 2) generate the ECDH-P-256 encryption keypair (users encrypt prompts to this)
run_cli keygen
# prints "ECDH Public Key: 0x04..." and writes /data/worker-encryption.key
```

> **Back up `/data` now** (the eth-keystore + `worker-encryption.key`). If you lose the
> encryption key you cannot decrypt prompts, and there is **no on-chain key-update** - you'd
> have to deregister and re-register (see Section 9).

---

## 6. Register on-chain and add the models

```bash
run_cli register
```
This single command, using the env above:
1. reads the minimum stake from AIConfig and **stakes it** (registerWorker, payable),
2. publishes your encryption public key on-chain,
3. adds every tag in `SUPPORTED_MODELS` via `addSupportedModel`.

Expected log lines: `worker registered on-chain ... stakeWei 5000...`, then
`all models registered ... modelCount N`.

> **Gotcha - addSupportedModel reverts for a non-whitelisted model.** A worker can only add a
> model the team has already whitelisted on-chain. All seven models in Section 1 are
> whitelisted on testnet, so they add fine. An unlisted tag will revert - that's expected and
> is how you can tell a model isn't enabled yet.

---

## 7. Run the daemon (go live)

```bash
docker run -d --name lc-worker --network host --gpus all \
  -v "$DATA":/data --env-file worker.env \
  us-central1-docker.pkg.dev/lightchain/lightchain-testnet-public-docker/worker:latest
# (no subcommand -> default entrypoint /bin/worker = the daemon)
docker logs -f lc-worker
```
Healthy startup logs:
```
worker registration validated - on-chain key matches local key
authenticated with worker-gateway
worker service initialized (gateway mode) ... models=N
websocket connected to gateway
```
Once you see `websocket connected to gateway`, the worker is live and eligible for jobs.

---

## 8. Verify it's actually serving

- **On-chain registered:** `isWorkerRegistered(<addr>)` on WorkerRegistry returns true;
  `getWorkerStake(<addr>)` returns your stake.
- **Daemon connected:** the log shows `websocket connected to gateway`.
- **Advertised to consumers:** once your worker is live and serving a model, that model
  appears in the gateway's model list: `curl https://chat-api.testnet.lightchain.ai/api/models`
  should now include it (the list is dynamic - it reflects models that live workers serve).
- **Health/metrics (optional):** set `WORKER_METRICS_ADDR=0.0.0.0:9101` +
  `WORKER_METRICS_ALLOW_PUBLIC=true` and hit `:9101/healthz`.

---

## 9. Keys, rotation, and leaving cleanly

**Rotating the encryption key / moving machines.** There is **no on-chain "update key"**
function - the encryption key is only set at registration. To publish a new one you must
**deregister and re-register**. Deregister is **blocked while any job is in-flight**, including
a completed job still inside its **24-hour dispute window**, so plan around that.

**Deregister (recover stake):**
```bash
run_cli deregister            # returns the stake to your wallet when no jobs are in-flight
```
> If deregister reverts `ActiveJobsExist`, you have a completed-but-unsettled job. Wait out its
> 24h dispute window, then `release`/settle it and deregister. (A stuck *acknowledged-but-never-
> completed* job clears via `claimTimeout` after its deadline.) Note: the CLI's one-shot
> deregister has under-gassed in practice; if it reverts with an out-of-gas status, resend with
> a higher gas limit (estimate x1.5).

**Reputation (post-upgrade).** A new ReputationRegistry tracks each worker: `recordCompletion`
raises your score, `recordDisputeLoss` lowers it, read via `getScore`. Higher reputation means
sortition selects you more often. New workers start at a base score. Stay online and finish
jobs to climb.

---

## 10. Quick reference (copy-paste order)

```
1. host: install zstd + Ollama; ollama serve; ollama pull <each model>
2. write worker.env (endpoints, SUPPORTED_MODELS, keystore paths)
3. run_cli import-key ...        # import EVM key -> set WORKER_KEYSTORE_PATH
4. run_cli keygen                # ECDH key -> BACK UP /data
5. run_cli register              # stake + addSupportedModel for each tag
6. run daemon (image, no args)   # /bin/worker -> "websocket connected to gateway"
7. verify: isWorkerRegistered, /api/models includes your models
8. to leave: run_cli deregister  # after in-flight/dispute windows clear
```

Serving one of the six new whitelisted models is the single most useful thing an operator can
do right now: the moment your worker serves it, it becomes reachable by consumers through the
API (and, once the chat frontend's model picker is wired, in the chat app too).
