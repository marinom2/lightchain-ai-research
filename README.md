# Expanding LightChain AI: Open Models Worth Adding

Community research on which open AI models LightChain AI should add to its worker network. Hardware fit and speed are **measured on real rented GPUs**, and the on-chain facts are **verified against the live network**.

LightChain AI is a network of people running open AI models on their own GPUs (via Ollama) and getting paid in LCAI. Today the network serves two models (`llama3-8b`, `llama3-70b`). This research recommends 10 more, sorted by how hard each is to add, and backs every hardware and latency claim with a real measurement.

The full write-up is in **[lightchain-ai-model-expansion-2026-06.md](lightchain-ai-model-expansion-2026-06.md)** (plain-English, with a technical appendix). This README is the summary.

### Guides in this repo
- **[how-lightchain-ai-works-2026-07.md](how-lightchain-ai-works-2026-07.md)** - plain-English walkthrough of the post-upgrade flow (on-chain sortition, reputation, gasless), verified live with transactions.
- **[worker-setup-and-registration.md](worker-setup-and-registration.md)** - step-by-step operator guide: stand up a worker, register on-chain with a stake, add the whitelisted models, run the daemon, verify, and rotate keys.
- **[model-benchmarks/RESULTS.md](model-benchmarks/RESULTS.md)** - measured capability + hardware benchmark for the six models, with on-chain txs.

---

## The 10 recommended models

| Model | What it does | Why add it | Specs |
|---|---|---|---|
| **Qwen3-VL 8B** | Reads images, scans, and PDFs and answers questions about them | "Understand my document" on a mid-range card | 12GB card (measured 9.5GB); vision in, text out |
| **Qwen3-Embedding** | "Search by meaning" so AI can answer from your documents instead of guessing | Tiny, instant; unlocks accurate document Q&A | 8GB card or CPU; outputs vectors, not chat |
| **GLM-4.7-Flash** | An AI that writes and fixes software code | Strong coder, most permissive licence (MIT) | 24GB card |
| **gpt-oss 20B** | A strong all-round assistant (questions, reasoning), from OpenAI | Frontier-lab quality on ordinary hardware | 16-24GB card |
| **Qwen3-VL 30B** (MoE) | A sharper document reader, near human-level on forms and PDFs | The "talk to your Word/Excel/PDF" feature; fastest model we measured | 24GB card |
| **Qwen3-Coder-Next** | The best open AI software engineer you can run yourself | Close to the best paid coding tools | 80GB data-centre card |
| **gpt-oss 120B** | OpenAI's biggest free model, the smartest general AI you can self-run | Headline: the network runs frontier-grade AI | 80GB data-centre card |
| **Z-Image-Turbo** | Makes a picture from a text description | A whole new product; fast and free-licensed | 24GB card; Group 3 build (media runtime) |
| **ACE-Step** | Writes and sings a full song from lyrics, in seconds, on a cheap card | New capability on the widest hardware base | 8GB card; Group 3 build (media runtime) |
| **Wan 2.2 / LTX-2.3** | Generates short video clips from text | Flashiest capability, best marketing | 24-80GB card; Group 3 build (runtime + longer job window) |

*On the coder scores: on a standard test of fixing 100 real software bugs unaided, GLM-4.7-Flash fixes ~59 and Qwen3-Coder-Next ~71. An older open coder of the same size manages ~22; the best paid tools score in the 70s-80s. The network has no dedicated coder today, so this fills a real gap.*

## The three groups

- **Group 1 - add now, runs on workers we already have.** Just a configuration change. → Qwen3-VL 8B, Qwen3-Embedding, GLM-4.7-Flash, gpt-oss 20B, Qwen3-VL 30B.
- **Group 2 - add now, but needs better hardware.** Also a configuration change, but only operators with an 80GB card can serve them. The network already does this with its existing large model, so the precedent exists. → Qwen3-Coder-Next, gpt-oss 120B.
- **Group 3 - new capabilities that need building first.** The worker software only handles text today, so pictures, music, and video each need new plumbing (and video needs the per-job time limit raised). → Z-Image-Turbo, ACE-Step, Wan 2.2 / LTX-2.3. The full report includes a concrete **enhancement spec** for adding this support: a second worker runtime, a media job type that returns a file, and a long-job class for video.

> **Live on testnet (2026-07-10).** The team enabled six of these models on testnet (chain 8200): `glm-4.7-flash`, `gpt-oss:20b`, `gpt-oss:120b`, `qwen3-vl:8b`, `qwen3-vl:30b`, `qwen3-embedding:0.6b`. Each is whitelisted on WorkerRegistry and carries a fee on AIConfig, both read back on-chain by `npm test`. The `modelId` is `keccak256` of the **exact Ollama tag** (colon form for sized models), which the on-chain reads confirm. A real worker on a rented 24GB GPU registered all six via `addSupportedModel` (the call reverts until a model is whitelisted, which is how the two-step enablement was proven), authenticated to the worker-gateway, and served a **full consumer job round-trip for all four generative models** (glm-4.7-flash, gpt-oss:20b, qwen3-vl:8b, qwen3-vl:30b): each returned a correct decrypted answer, each produced a real on-chain `createSession` + `submitJob` (status 1), and the consumer paid exactly 0.16 LCAI, the exact sum of the four on-chain fees. See "Live end-to-end verification" in the report for the answers and tx hashes.

> **📊 Live capability benchmark → [`model-benchmarks/RESULTS.md`](model-benchmarks/RESULTS.md).** All six models were run on rented GPUs with model-specific, objectively-scored capability tests (coding = code executed; reasoning = exact answer; vision = facts read from real images; embeddings = retrieval precision) and measured for minimum vs. recommended hardware. The coding and reasoning results were also run **through the live gateway**, so each carries a real on-chain transaction. Includes the vision test images and a precise "what's not deliverable yet (vision, embeddings) and exactly how to fix it" section.

## What we measured on real GPUs

Each model was rented, pulled through Ollama, and run with a fixed prompt. **Cold** = the first job, including the one-time model load. **Warm** = model already resident (how a busy worker runs, since the keep-alive watchdog holds it in memory).

| Model | Card | Peak VRAM | Speed | Cold answer (incl. load) | Warm answer | Fits the 2-minute limit |
|---|---|---|---|---|---|---|
| qwen3-embedding:0.6b | 24GB | 5.4 GB | search vectors (1024-dim) | ~18s | instant | yes |
| qwen3-vl:8b | 24GB | 9.5 GB | 115 tok/s | ~64s | ~2s | yes |
| gpt-oss:20b | 24GB | 12 GB | 124 tok/s | ~70s | ~2s | yes |
| glm-4.7-flash | 24GB | 19.3 GB | 145 tok/s | ~39s | ~2s | yes |
| qwen3-vl:30b (MoE) | 24GB | 20.6 GB | **181 tok/s** | ~72s | ~1s | yes |
| qwen3-vl:32b (dense) | 24GB | 20.3 GB | **3.2 tok/s** | ~67s | 41s | **no** at real length |
| qwen3-coder-next | 80GB | 54.8 GB | 111 tok/s | ~15s | ~1.5s | yes |
| gpt-oss:120b | 80GB | 60 GB | 116 tok/s | ~18s | ~2s | yes |

Even cold, every model answers within the 2-minute limit; the cold time is mostly the one-time model load, which a worker pays once and then serves warm. Two things the real test caught that estimates missed: **qwen3-vl:8b needs a 12GB card** (it used 9.5GB), and the **dense 32B vision model is far too slow on a consumer card** (3 tok/s) - its mixture-of-experts sibling **qwen3-vl:30b does the same job ~57x faster** at the same memory, so that is the 24GB document-reading pick.

## What was left out, and why

- **The most-hyped giants (GLM-5.2, Kimi K2/K2.6/K2.7, and similar).** Their weights are open and self-hostable, but they are ~700B-1T-parameter models that need a multi-GPU datacenter rig (far beyond even the 80GB tier), and they are not available as a local download to the worker software (Ollama), only as hosted "cloud" endpoints. So a worker cannot run them. `qwen3-coder:480b`, by contrast, is a genuine ~290GB local Ollama download, so it stays on the list as a multi-GPU upgrade.
- **Top leaderboard video models (HappyHorse, Wan 2.7):** genuinely rental-only - weights not published.
- **Llama Vision / Gemma:** licences restrict commercial or cross-border use.
- **MusicGen:** non-commercial licence; **HunyuanVideo:** region-restricted licence. We preferred cleanly-licensed alternatives.

## How this was verified

- **Model behaviour:** measured on rented RunPod GPUs (the `gpu-tests/` folder; reproduce it below).
- **On-chain facts** (contract addresses, fees, the registration-hash scheme, the 120s budget): an automated test, `npm test`, with 41 assertions including **live reads of the testnet whitelist and fees for the six enabled models** and the **mainnet fee contract**.
- **Licences and benchmark scores:** read from primary sources (model cards, licence files, public leaderboards). These should be re-checked before any submission, since model versions move.

## Repo contents

| Path | What it is |
|---|---|
| `lightchain-ai-model-expansion-2026-06.md` | The full report (recommendations, dossiers, infra requirements, technical appendix with validated hashes). |
| `verify-model-expansion.mjs` | On-chain verification suite (run with `npm test`). |
| `gpu-tests/run.mjs` | Rent one GPU, test one model, tear it down. |
| `gpu-tests/run-batch.mjs` | Rent one GPU, test several models in a row. |
| `gpu-tests/summarize.mjs` | Turn the result JSONs into `gpu-tests/RESULTS.md`. |
| `gpu-tests/results/` | Raw measured JSON, one per model. |
| `.env.example` | Template for your RunPod key (copy to `.env`). |

---

## Reproduce the on-chain checks

No account needed - it only reads public data.

```
npm install
npm test
```

Expected: `41 passed, 0 failed`, including the live testnet whitelist/fees for the six enabled models and the live mainnet fees for `llama3-8b` (0.02 LCAI) and `llama3-70b` (0.15 LCAI).

## Reproduce the GPU tests yourself

You can re-run the measurements with your own RunPod account.

**1. Get a RunPod key.** Sign in at [runpod.io](https://www.runpod.io), add funds (**~$10 is plenty** - the full run below costs under **$2** of GPU time), then **Settings → API Keys → "+ API Key"** (read/write).

**2. Set up.**
```
git clone https://github.com/marinom2/lightchain-ai-research
cd lightchain-ai-research
npm install
cp .env.example .env        # then paste your RunPod key into .env
```
`.env` is git-ignored and is never committed. Run the commands below **from the repo root** so they pick up your key.

**3. Prove the pipeline with one model** (~$0.02, a few minutes):
```
node gpu-tests/run.mjs glm-4.7-flash glm-4.7-flash 40 "NVIDIA GeForce RTX 3090|NVIDIA RTX A5000"
```

**4. Test a whole 24GB tier** (several models on one pod, ~$0.15):
```
node gpu-tests/run-batch.mjs 24gb 80 "NVIDIA GeForce RTX 4090|NVIDIA GeForce RTX 3090|NVIDIA RTX A5000" \
  "qwen3-vl-8b,qwen3-vl:8b,text;qwen3-embedding-0.6b,qwen3-embedding:0.6b,embed;gpt-oss-20b,gpt-oss:20b,text;qwen3-vl-30b,qwen3-vl:30b,text;glm-4.7-flash,glm-4.7-flash,text"
```

**5. Test the 80GB tier** (~$0.60):
```
node gpu-tests/run-batch.mjs 80gb 160 "NVIDIA A100 80GB PCIe|NVIDIA A100-SXM4-80GB|NVIDIA H100 PCIe" \
  "qwen3-coder-next,qwen3-coder-next,text;gpt-oss-120b,gpt-oss:120b,text"
```

**6. Build the results table:**
```
node gpu-tests/summarize.mjs        # writes gpu-tests/RESULTS.md
```

**How it works and the safety rules:**
- Each run rents the cheapest available GPU from the list you pass, pulls the model via Ollama, measures cold + warm latency, tokens/sec, and peak VRAM, writes a JSON to `gpu-tests/results/`, and then **always terminates the pod** - even on error.
- Pods are named `lc-test-*` and are torn down automatically. The model **download** (6-65GB) dominates the time; the compute is seconds.
- **Run one batch at a time** unless you give each a different GPU type. If a run is interrupted, check your RunPod console for a stray `lc-test-*` pod.
- The argument format is: `run.mjs <registration-name> <ollama-pull-tag> <diskGB> "<gpu1>|<gpu2>"`, and `run-batch.mjs <label> <diskGB> "<gpu list>" "name,pullTag,kind;..."` where `kind` is `text` or `embed`.

---

*Everything here was checked against the current state of open AI models and the live network in mid-2026. This is independent community research; verify addresses, licences, and model versions yourself before acting on them.*
