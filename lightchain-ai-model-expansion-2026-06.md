# Expanding LightChain AI: 10 Models Worth Adding

A research report on the best open AI models to add to the LightChain worker network, what each one would give us, what it would cost, and what it would take to run it.

Date: 2026-06-30

---

## How to read this report

LightChain AI is a network of ordinary people running AI on their own computers and getting paid for it. Today every worker runs the same two models. This report asks a simple question: which other AI models should we add, to make the network more useful and more competitive?

To answer it properly, three things had to line up for every candidate:

1. **It has to be downloadable.** Some of the most famous "open" models can only be used by renting them through a company's servers. Our workers run models on their own machines, so anything we cannot download and run ourselves is off the table, no matter how impressive it is.
2. **It has to fit a real worker's computer.** A model takes up space on a graphics card. Our workers range from modest gaming PCs to serious data-centre machines, so for each model we have to know which workers can actually run it.
3. **It has to finish quickly.** Every job on the network has a time limit (about two minutes today). A model that fits but takes ten minutes to answer would get its worker penalised, so speed matters as much as capability.

Everything below was checked against how the network actually works (the real worker requirements, the time limit, and how models get registered), not against guesses. The result is a list of ten models, sorted by how easy they are to add.

A note on the numbers: AI models are compared using standard tests, and this report explains what each test means the first time it comes up, rather than assuming you already know. There is a glossary at the end.

---

## The short version

We recommend ten models. They fall into three groups based on how hard they are to add.

**Group 1 - Ready to add today, runs on the workers we already have.** These need only a quick configuration change. They cover the most-wanted everyday uses.

1. **Qwen3-VL 8B** - reads images and documents and answers questions about them. Runs on the smallest worker.
2. **Qwen3-Embedding** - the "search by meaning" engine that lets AI look things up in your documents before answering. Runs on anything.
3. **GLM-4.7-Flash** - a strong AI software developer. Runs on a high-end gaming graphics card.
4. **gpt-oss 20B** - a strong all-round assistant for questions and reasoning, from OpenAI. Runs on a high-end gaming card.
5. **Qwen3-VL 30B** (mixture-of-experts) - a sharper document reader, near human-level at reading forms and PDFs, and the fastest model we measured.

**Group 2 - Ready to add today, but only the best-equipped workers can run them.** Also just a configuration change, but no ordinary worker has a big enough graphics card. We already do this with our existing large model, so the precedent exists.

6. **Qwen3-Coder-Next** - the best open AI software engineer you can run yourself.
7. **gpt-oss 120B** - OpenAI's biggest free model, the smartest general AI you can run without renting it.

**Group 3 - New capabilities that need building first.** These are exciting (pictures, music, video) but the network's software only handles text today, so each needs new plumbing before any worker can offer it.

8. **Z-Image-Turbo** - makes pictures from a text description.
9. **ACE-Step** - writes and performs a full song, music and vocals, from lyrics.
10. **Wan 2.2 / LTX-2.3** - generates short video clips.

The recommendation: add Group 1 now, recruit better-equipped operators and add Group 2 soon after, and treat Group 3 as a deliberate build project (the order being pictures first, then music, then video, which is the hardest).

---

## What we measured on real GPUs

We did not just estimate these numbers. We rented the actual graphics cards and ran each model through Ollama (the same engine the workers use), then shut the rented machines down. Here is what came back.

| Model | Card | Memory used | Speed | Answer time (warm) | Fits the 2-minute limit |
|---|---|---|---|---|---|
| qwen3-embedding:0.6b | 24GB | 5.4 GB | search vectors (1024-dim) | instant | yes |
| qwen3-vl:8b | 24GB | 9.5 GB | 115 words/sec | ~2s | yes |
| gpt-oss:20b | 24GB | 12 GB | 124 words/sec | ~2s | yes |
| glm-4.7-flash | 24GB | 19.3 GB | 145 words/sec | ~2s | yes |
| qwen3-vl:30b (mixture-of-experts) | 24GB | 20.6 GB | 181 words/sec | ~1s | yes |
| qwen3-vl:32b (dense) | 24GB | 20.3 GB | 3 words/sec | 41s | NO at real length |
| qwen3-coder-next | 80GB | 54.8 GB | 111 words/sec | ~1.5s | yes |
| gpt-oss:120b | 80GB | 60 GB | 116 words/sec | ~2s | yes |

("words/sec" is roughly tokens/sec; "warm" means the model was already loaded, which is how a busy worker runs.)

Two things the real test caught that estimates would have missed:

- **qwen3-vl:8b actually needs a 12GB card, not 8GB.** It used 9.5GB once loaded, so it does not fit the 8GB minimum machine; it belongs on the 24GB tier.
- **The dense 32B vision model is too slow on a consumer card.** qwen3-vl:32b managed only 3 words per second on a 24GB card, so a full-length answer would take roughly 20 minutes, far past the 2-minute limit. Its mixture-of-experts sibling, **qwen3-vl:30b, did the same job at 181 words per second** - about 57 times faster for the same memory - so that is the right document-reading model for the 24GB tier. The dense 32B should be reserved for an 80GB card.

Everything else confirmed the plan: every recommended model fit its tier's card and answered well inside the 2-minute limit, the two premium models ran comfortably on a single 80GB card, and the embeddings model was tiny and instant. The one-time model download (a few minutes for the big ones) happens once per worker and is not part of a job's clock.

Cost of all this testing: a few dollars of rented GPU time. The full numbers, the test script, and a re-runnable harness are in the research folder under `gpu-tests/`.

---

## Why these constraints matter (the network in plain terms)

Before the models, it helps to understand the machine they run on, because that is what shapes every recommendation.

**Workers are people's graphics cards.** Anyone can join, stake some of the network's token, and start earning by answering AI jobs. The software they run is called Ollama; it loads an AI model and answers prompts. Crucially, Ollama handles **text**: you send words, you get words back. It does not, on its own, make pictures, music, or video. That single fact is why our first seven models are easy and our last three are a project.

**The published hardware guide lists two kinds of worker.** A minimum machine has an 8GB graphics card; a recommended machine has a 24GB card. The guide does not list anything bigger. The network does already run one model that needs a 48GB card (our existing large model), but that is treated as a special premium case. So when a model needs more than a 24GB card, that is officially "above spec," and only operators who choose to bring heavier hardware can serve it. This is the line between Group 1 and Group 2.

**Every job has a two-minute clock.** From the moment a worker accepts a job, it has about 120 seconds to finish, or it loses money. For text and document models this is no problem; they answer in seconds. For making a short video, it is fatal: the best open video models take roughly nine minutes for a five-second clip, which not only breaks the two-minute limit but exceeds the maximum the network can be set to (ten minutes). Music and pictures, by contrast, finish in seconds and fit comfortably.

**Models are registered by name, and the name has to be exact.** Each model gets a registration on the network derived from its name, and the worker uses that same name to fetch the model. We confirmed exactly how this works, so the registration values in the appendix are correct and ready to use.

Hold those three ideas - text-only software, the 24GB hardware line, and the two-minute clock - and the whole list makes sense.

---

## The ten models, explained

For each model: what it does in plain terms, why it earns its place, the catch, and the practical facts (how big, what licence, what it would cost per job). "Licence" matters because the network sells access commercially across many countries, so we can only use models whose terms allow that; the cleanest are called Apache or MIT, which essentially mean "use it freely, including for business."

### Group 1 - ready today, runs on current workers

**1. Qwen3-VL 8B - reads images and documents**

Show it a photo, a scanned invoice, a screenshot, or a PDF, and it tells you what is there or pulls out the details you ask for. Measured on a real card it uses about 9.5GB once loaded, so it needs a 12GB card (not the bare 8GB minimum). The licence is fully open for commercial use. The catch is that it reads images, it does not create them, and a model this small is a capable generalist rather than a specialist. One thing to confirm before launch: today's jobs are pure text, so we need to check that the system can also accept an image alongside the prompt; if not, that is a small addition.
Cost per job: about 0.03 LCAI. Registration name: `qwen3-vl-8b`.

**2. Qwen3-Embedding - search by meaning**

This is the quiet workhorse behind any "ask my documents" feature. It turns a piece of text into a string of numbers that captures its meaning, so a computer can find the most relevant passage in a big pile of documents. That is the step that lets an AI answer from real sources instead of making things up (the industry calls this "retrieval"). It is tiny, answers instantly, and runs even on a worker with no graphics card at all. The catch is that on its own it does not chat or write; it is the search engine behind a smart assistant, not the assistant. It also produces a list of numbers rather than text, so the network needs a small addition to handle that kind of answer, but it is the easiest such addition and unlocks a lot.
Cost per job: about 0.004 LCAI (it is cheap because it is so fast). Registration name: `qwen3-embedding-0.6b`.

**3. GLM-4.7-Flash - an AI software developer**

This writes and fixes computer code, and it is excellent for its size. There is a standard test where a model is handed 100 real bugs taken from actual open-source software projects and asked to fix them with no human help. GLM-4.7-Flash fixes about 59 of the 100. For comparison, an older open coder of the same size scores around 22, and the best paid tools in the world score in the 70s and 80s. The network has no dedicated coding model today (its two models are general-purpose), so this fills a real gap, and it has the most permissive licence of any model here. The catch is that it needs a 24GB graphics card, which is the network's "recommended" machine rather than the bare minimum.
Cost per job: about 0.05 LCAI. Registration name: `glm-4.7-flash`.

**4. gpt-oss 20B - a strong all-round assistant**

Made by OpenAI and released for anyone to run, this is a high-quality general assistant: questions, explanations, summaries, step-by-step reasoning. This is the everyday "chatbot" workload that most people actually want, and having a frontier-lab model serving it on ordinary hardware is a real selling point. It runs on a 16-to-24GB card. The catch is simply that it is a generalist; it is not as good at coding as our dedicated coder, nor at reading documents as our vision models.
Cost per job: about 0.04 LCAI. Registration name: `gpt-oss-20b`.

**5. Qwen3-VL 30B - a near human-level document reader**

The same idea as model 1, but much sharper, and among the best open models in the world at reading documents (on a standard document-reading test it scores in the high 90s out of 100, essentially human-level). This is the "talk to your Word, Excel, and PDF files" capability that businesses pay for. We tested two versions of this model: the dense 32-billion one and a mixture-of-experts 30-billion one. They use the same memory (~20GB, so a 24GB card), but on a real card the mixture-of-experts version ran at 181 words per second while the dense one crawled at 3 - so we recommend the **30B mixture-of-experts** version for the 24GB tier, and would only run the dense 32B on an 80GB card. The catch is the card: it needs the recommended 24GB machine, not the minimum.
Cost per job: about 0.08 LCAI. Registration name: `qwen3-vl-30b`.

### Group 2 - ready today, but only for well-equipped operators

These two are also just a configuration change to add. The difference is hardware: no ordinary worker has a big enough graphics card, so they only run on operators who choose to bring data-centre hardware. We already do exactly this with our existing large model, so this is a known pattern, not a new risk. The work here is less about code and more about attracting operators with the right machines, which the higher per-job fee is meant to do.

**6. Qwen3-Coder-Next - the best open AI software engineer**

This is the strongest open coding model you can run yourself. On the same 100-real-bugs test as model 3, it fixes about 71, putting it within reach of the best paid coding tools on the market. Serving this would make the network genuinely valuable to software developers, which is a large and paying audience. The catch is the hardware: it needs an 80GB data-centre graphics card (the kind that costs as much as a car), so only serious operators can run it.
Cost per job: about 0.12 LCAI. Registration name: `qwen3-coder-next`.

**7. gpt-oss 120B - the smartest free general AI**

OpenAI's largest open model. Running it on LightChain is a strong statement: it means the network serves frontier-grade AI, not just small models. It is the premium choice for deep, complex questions. It needs an 80GB data-centre card, the same heavy hardware our existing large model already uses, so it does not raise the ceiling we already have.
Cost per job: about 0.15 LCAI (the same as our current premium model). Registration name: `gpt-oss-120b`.

### Group 3 - new capabilities that need building first

These are the exciting ones, and they are real, but be clear-eyed: the network's software only does text today, so each of these needs new plumbing before a single worker can offer it. They are described fully in the "What it would take to build" section. In short:

**8. Z-Image-Turbo - makes pictures from text.** Type "a red sports car at sunset" and get an image. It is fast (a second or two, well inside the time limit) and free-licensed, and it opens a whole new line of business: creators, apps, and on-chain art. The catch is the plumbing - the network needs to learn to handle picture jobs.
Cost per picture: about 0.15 LCAI. Registration name: `z-image-turbo`.

**9. ACE-Step - writes and sings a full song.** Give it a style and some lyrics and it produces a complete song, music and sung vocals, in seconds, on a cheap 8GB card. A genuinely new capability on the widest hardware base. The catch: it is good, but not as good as the paid tools like Suno, so it should be sold as "capable," not "the best in the world," and it needs the same new plumbing as pictures.
Cost per song: about 0.10 LCAI. Registration name: `ace-step`.

**10. Wan 2.2 / LTX-2.3 - generates short video clips.** The flashiest capability and the strongest marketing, and Wan 2.2 has the cleanest licence of any open video model (LTX-2.3 is an upgrade that also adds sound and higher resolution). But this is the biggest project by far. A single five-second clip takes about nine minutes to make, and the network currently penalises any job over two minutes, so the time rules themselves have to change before video is even possible. Open video also still trails Google and ByteDance noticeably on quality.
Cost per clip: about 0.30 to 0.60 LCAI. Registration name: `wan2.2-t2v-a14b`.

---

## The powerful models in depth: what to do, what you get, what it costs

The bigger models each carry a specific price and a specific payoff. Here is the case for each, in plain terms.

**Qwen3-Coder-Next (the premium coder).**
*What you get:* a top-tier AI software engineer serving the network, which makes LightChain genuinely useful to developers, a large paying audience. It is also predictable in how it answers, which keeps disputes between users and workers clean.
*What it needs:* operators with an 80GB data-centre graphics card. The licence is fully open, so there is no legal barrier; the only barrier is hardware.
*What to do:* announce a premium hardware level, lock the model to a fixed version (so every worker runs the identical thing), register it, and recruit operators with the higher fee.
*Effort:* low for us (it is a configuration change). The real question is whether enough operators bring the hardware.

**gpt-oss 120B (the frontier brain).**
*What you get:* the headline that the network runs OpenAI's biggest free model. A premium tier for the hardest questions, and a marketing story that lifts the whole network's reputation.
*What it needs:* an 80GB card, the same hardware our existing large model already uses, so no new ceiling.
*What to do:* same as above (premium tier, fixed version, register).
*Effort:* low for us; again, the gate is operator supply.

**The giant models (for showcase).** There are even larger open models (a 480-billion and a 235-billion) that need multiple data-centre cards at once. They would put the network at the very top of the leaderboards and serve as a prestige tier. The extra requirement here is storage: these models are enormous to download (one is over a quarter of a terabyte), so premium operators would need large, fast drives. Worth doing only if there is real demand for a showcase tier.

**Pictures (Z-Image-Turbo).**
*What you get:* an entirely new product. Image generation has huge demand (creators, apps, on-chain art), it is fast enough to fit the time limit, and the model is free-licensed.
*What it needs:* new software on the workers to run image models and to send a picture back as the answer, plus a way to check that workers did the job honestly (more on that below).
*Effort:* medium. It is the closest of the three new capabilities to what we already do, so it is the right one to build first.

**Music (ACE-Step).**
*What you get:* full songs with vocals, on the cheapest hardware, finishing inside the time limit.
*What it needs:* the same kind of new software as pictures (a music engine and a way to return audio), plus the honesty check.
*Effort:* medium. Quality trails the paid tools, so set expectations accordingly. No time-limit change needed.

**Video (Wan 2.2 / LTX-2.3).**
*What you get:* the flashiest capability and the strongest marketing, and the path to being a full "any media" network.
*What it needs:* the most of anything here. New video software, a way to return video, the honesty check, AND a change to the network's time rules, because a clip takes far longer than any job is currently allowed to. Quality also still trails Google and ByteDance.
*Effort:* high. It is the only item that needs a rule change on top of new software, so it should come last.

---

## What it would take to build the new capabilities

The technical work behind Group 3, in order of difficulty.

1. **A premium hardware level (for the big text models, 6 and 7).** Add a third worker category for 48-to-80GB machines to the published guide and the app, so those operators are recognised and matched to the big models. This is the least work and unlocks the most immediate value, because the models themselves are already a simple registration. The lever is operator economics: the higher fees should attract the hardware.

2. **Lock model versions (good practice for a few of the text models).** A couple of models do not carry a size in their name, and the worker would otherwise fetch whatever "latest" version exists, which can change over time. Pinning an exact version keeps every worker on the same build, which matters for consistent quality. (It is not required for honesty checks, since the network does not re-run and compare outputs.) Small but worth doing.

3. **Handle "search by meaning" answers (for the embeddings model, 2).** That model answers with a list of numbers rather than text, so the network needs a small addition to accept and pass along that kind of answer. It is the easiest of the new-answer-type additions and unlocks the valuable "answer from my documents" feature.

4. **Picture software and picture jobs (for model 8).** Add the ability for a worker to run an image model and return a picture. Pictures finish inside the time limit, so no rule change is needed here, only new software and a way to check the result.

5. **Media software, audio/video jobs, and a longer clock (for models 9 and 10).** Add a music-and-video engine and the ability to return audio and video files. Music fits the existing time limit; video does not and needs a new "long job" category with a much longer clock and different penalty rules. This is the heaviest item.

6. **Verification is NOT a special blocker (a correction).** An earlier draft assumed the network checks a worker's honesty by re-running the job and exact-matching the output, which would have been a problem for pictures, music, and video, since the same prompt produces slightly different files on different machines. We checked the live design and that assumption was wrong. Lightchain v2 uses a lean-attestor model: the worker is the trust unit, its result is committed on-chain (encrypted, with a designated disputer who can decrypt and arbitrate if a result is challenged), and there is **no automatic re-run-and-compare step** (the old re-run "Proof of Intelligence quorum" was explicitly retired). So creative models are attested like any other job, and verification is not a build blocker for them. We also confirmed this on a real GPU: even a text model is not bit-identical across two temperature-0 runs, and because nothing re-runs and compares, that does not matter. The real Group 3 blockers are only the new runtime, the new job type, and (for video alone) the 120-second budget.

---

## Suggested order of rollout

1. **Now:** add models 1, 3, 4, and 5 (document reader, coder, assistant, premium document reader). These are pure configuration changes and run on hardware the network already targets. Lock their versions where needed.
2. **Soon:** announce the premium hardware level and add models 6 and 7 (the big coder and the big brain). Recruit operators with the better machines.
3. **Next:** add the "search by meaning" answer type and turn on model 2 (embeddings) and its larger versions. This ships the "answer from my documents" capability that businesses want.
4. **Then, as a build project:** pictures first (model 8), then music (model 9), then video (model 10). Each needs the new runtime and a new job type; video also needs the longer job clock. Verification is not a blocker (see the correction in the build section).

---

## What we deliberately left out, and why

It is worth being clear about the famous models that did not make the list, so the choices hold up to scrutiny.

- **The most-hyped giants (GLM-5.2, Kimi, and similar).** These are the names everyone mentions, but they can only be rented through a company's servers; the weights are not downloadable. Our workers cannot run them, full stop.
- **The top video models on the leaderboards (HappyHorse, Wan 2.7).** Same problem: impressive scores, but rental-only. Not something a worker can host.
- **Meta's and Google's image/vision models (Llama Vision, Gemma).** Their licences restrict commercial use in ways that do not fit an open, global, decentralised network (for example, blocking operators in Europe). We chose the freely-licensed Qwen models instead.
- **The popular open music model from Meta (MusicGen).** Its licence forbids commercial use, so we cannot sell access to it. Ruled out.
- **One strong but restricted video model (HunyuanVideo).** Its licence excludes several major regions. We preferred the cleanly-licensed Wan 2.2.

Every model we did pick is downloadable, freely licensed for business use, and genuinely runnable by a worker.

---

## Glossary

- **Open weight vs cloud-only:** "open weight" means anyone can download the model and run it on their own computer, so the network can serve it. "Cloud-only" means you can only use it by renting time on a company's servers; the network cannot run those.
- **The bug-fixing test (you will see scores like "59" or "71"):** a model is given 100 real bugs from actual open-source software and asked to fix them with no help. The score is how many it fixed. Higher is better; the best paid tools score in the 70s-80s.
- **The document-reading test (scores like "97"):** the model is asked questions about forms, tables, and PDFs; the score is how many it answers correctly out of 100. The high 90s is roughly human-level.
- **Search by meaning / "embeddings" / "retrieval":** a way for an AI to find the most relevant passage in your own documents and answer from it, instead of relying on memory. It is what makes an assistant quote real facts.
- **Graphics card memory ("VRAM") and the worker levels:** the memory on a graphics card, which decides how big a model it can hold. 8GB is a normal gaming card; 24GB is a high-end gaming card; 80GB is an expensive data-centre card. A worker can only run a model its card is big enough to hold.
- **"Parameters" and why a big model can still run on one card:** parameters are roughly the size of the model's brain. Some models only switch on a small part of that brain for each question, so they run far cheaper and faster than their total size suggests.
- **The two-minute limit:** every job must finish in about 120 seconds or the worker is penalised. Fast models are safe; video is not, which is why it needs a rule change.
- **LCAI (the network token):** workers are paid in LCAI, LightChain's own token; every fee in this report is quoted in LCAI. The worker keeps 80% of each fee, the protocol takes 15%, and 5% goes to a reserve.

---

## Appendix: technical details for implementation

This section is for whoever sets the models up. Everything above was validated against the live network configuration.

### Ready-to-submit table (White Model Week format)

The seven text/vision/embedding models below run on the existing Ollama runtime and are ready to submit now (the image, music, and video models are omitted here because they need the infrastructure build first). The `keccak256` value is the hash of the dash registration name, which is what the contract stores; the pull command shows the colon tag the worker actually downloads.

| Ollama Model | Pull Command | keccak256(model) | Max Output Tokens | Suggested LCAI Fee |
|---|---|---|---|---|
| qwen3-vl-8b | `ollama pull qwen3-vl:8b` | 0x2b0139b21e5ecb742e8a8cc47e1c868cb2037b02a46f03626a0a39da30f47521 | 4096 | 0.03 |
| qwen3-embedding-0.6b | `ollama pull qwen3-embedding:0.6b` | 0xacfc413365387644b8c74a963f22d97ff6a47eff7c816ec567c2022f25bfc9ee | N/A (1024-dim vector) | 0.004 |
| glm-4.7-flash | `ollama pull glm-4.7-flash` | 0x35f686ade96649d2bf47e024eca280619fc80458c5cdece4804fc3f1561bd542 | 8192 | 0.05 |
| gpt-oss-20b | `ollama pull gpt-oss:20b` | 0xcc79b5cc10ab4495c25bf8110a5bf93cbeef340ae30f2b9c7826f62d769e29ed | 8192 | 0.04 |
| qwen3-vl-30b | `ollama pull qwen3-vl:30b` | 0x854d3280c43be8e8bb0e453c389d932686c0d84e720b8cfa2701eef0e682121f | 4096 | 0.08 |
| qwen3-coder-next | `ollama pull qwen3-coder-next` | 0x2484d762220e965130f8e0c0bda116929bd8d4dd281de3c11cc93ac556ccc927 | 8192 | 0.12 |
| gpt-oss-120b | `ollama pull gpt-oss:120b` | 0xe071516607535f2517c2c4240733645b5dc9d0a40428a7dbfc8d5cb730ee2f88 | 8192 | 0.15 |

**How a model is registered.** A model's fee is recorded on the **AIConfig** contract via `setModelFee(modelId, fee)`, where `modelId` is the keccak256 hash of the exact (dash) registration name. Workers declare which models they serve through **WorkerRegistry**. The per-job fee is read on-chain via `calculateJobFee(modelId)`; of each fee, 80% goes to the worker, 15% to the protocol, and 5% to a fee pool.

**How a job is verified.** Lightchain v2 uses a lean-attestor model, not a re-run quorum: the worker produces the result, it is committed on-chain (encrypted), an attestor signs it, and a designated **disputer** can decrypt and arbitrate if a result is challenged. Nothing re-runs and exact-matches, so model determinism does not affect verification. Adding a new model therefore changes only three values: its `modelId`, its fee, and its max output tokens. No new contract code or job-path is involved.

**Canonical mainnet contracts (chain 9200; verify on-chain before signing).**

| Contract | Address |
|---|---|
| AIConfig (proxy) | 0x24D11533C354092ed6E18b964257819cE78Ce77D |
| WorkerRegistry (genesis predeploy) | 0x0000000000000000000000000000000000001002 |
| JobRegistry (proxy) | 0xfB15F90298e4CcD7106E76ffB5e520315cC42B0b |
| Treasury (proxy) | 0x786eDe8C42Ca54E54c9dCECa9b30052CF4743389 |
| FeePool (genesis predeploy) | 0x0000000000000000000000000000000000001004 |
| LightChainGovernor (proxy) | 0xD216A0c0050EdC3a9E0449EcFDf178A1652b4b68 |
| TimelockController | 0xc783376c8237E8f1ed17d825CE7CBB4c22e3cAE5 |
| Dispatcher (service EOA) | 0x93953f40A472E65cD0212a2DA38dD1337854256F |
| Worker-gateway (service EOA) | 0x46737082Ac84e64f936cDDBa28F5Cd5E71329E62 |
| Disputer (service EOA) | 0xED60d14E586219D7c984bDf0AA720a6Bd96B5F73 |

Live whitelisted models confirmed by reading the contract: `llama3-8b` (0xf4a414fa…, 0.02 LCAI, 2048 tokens) and `llama3-70b` (0x665d85c3…, 0.15 LCAI, 4096 tokens).

**Who can whitelist (measured on-chain).** `setModelFee` is owner-gated. As of this writing the mainnet AIConfig `owner()` is the EOA `0x8a35e0…d616` (note: this differs from the documented deployer `0x48C6…A160`, so confirm on-chain before relying on it; ownership is pending handover to a multisig and ultimately the Timelock-controlled Governor). Adding a model is currently a single owner transaction, not yet a governance vote, but it requires that owner key.

**Testnet (chain 8200).** AIConfig is `0xeCF4Ca5Ba6D97ae586993e170764a1E92231b67e`, WorkerRegistry is the same predeploy `0x…1002`, JobRegistry is `0x531b3a87c5d785441b9cf55b98169f20fd9056a7`, and `llama3-8b` is whitelisted there too (0.02 LCAI). Testnet is **not permissionless**: `setModelFee` there is owner-gated by the EOA `0x7cc4…d483` (also not yet handed to governance). So a new model can be whitelisted on testnet with a single transaction by that owner, with no DAO ceremony, which makes testnet the natural place to run a genuine end-to-end test of a new model, provided whoever holds that owner key signs the transaction. Neither owner key appears among local wallets, so this step needs the LightChain team.

**The naming rule (validated).** The registration name is the "dash" form (for example `gpt-oss-120b`). The worker automatically turns a trailing `-120b` into `:120b` to download the model, then makes it answer to the registered name. This is why the hashes below are computed from the dash names. For names without a size on the end (`glm-4.7-flash`, `qwen3-coder-next`), the worker downloads the default version, so those should be pinned to a fixed version for consistency across workers.

**The hardware spec (validated).** Minimum worker: 4 CPU cores, 16GB system memory, 8GB graphics card, 512GB storage, 100 Mbps. Recommended: 16 cores, 64GB memory, 24GB card, 2TB storage, 1 Gbps. Anything above 24GB is a premium tier the guide does not yet publish.

**The time limit (validated).** Each job's compute window is about 120 seconds today, and the protocol allows it to be set anywhere from 30 to 600 seconds. Video generation exceeds even the 600-second maximum and so needs a separate long-job design.

**Registration values (validated hashes).** Computed as keccak256 of the registration name; confirmed against the live entries (`llama3-8b` and the template example `llama3.1:8b`).

| Registration name | What the worker downloads | modelId (registration hash) |
|---|---|---|
| qwen3-vl-8b | qwen3-vl:8b | 0x2b0139b21e5ecb742e8a8cc47e1c868cb2037b02a46f03626a0a39da30f47521 |
| qwen3-vl-30b | qwen3-vl:30b | 0x854d3280c43be8e8bb0e453c389d932686c0d84e720b8cfa2701eef0e682121f |
| qwen3-vl-32b | qwen3-vl:32b | 0xa239f923dfde3226b6acfe96f86a534691af6e3e65ac00765bfe60c22c334cc4 |
| qwen3-vl-235b | qwen3-vl:235b | 0xf53291fd3fb08ff62c051288f0cd6c6618f0221b3dbd9225e069f4fca0bc7295 |
| qwen3-embedding-0.6b | qwen3-embedding:0.6b | 0xacfc413365387644b8c74a963f22d97ff6a47eff7c816ec567c2022f25bfc9ee |
| qwen3-embedding-4b | qwen3-embedding:4b | 0x8d7c0878e1e03114d6454e52f28f1c89385b6cb2f364cba2c90b018da13c4202 |
| qwen3-embedding-8b | qwen3-embedding:8b | 0x3d96cffed741a4b8193979268d1bfddcebe56179f5749a9fe68cbd7cb5cbfc79 |
| glm-4.7-flash | glm-4.7-flash (pin version) | 0x35f686ade96649d2bf47e024eca280619fc80458c5cdece4804fc3f1561bd542 |
| gpt-oss-20b | gpt-oss:20b | 0xcc79b5cc10ab4495c25bf8110a5bf93cbeef340ae30f2b9c7826f62d769e29ed |
| gpt-oss-120b | gpt-oss:120b | 0xe071516607535f2517c2c4240733645b5dc9d0a40428a7dbfc8d5cb730ee2f88 |
| qwen3-coder-next | qwen3-coder-next (pin version) | 0x2484d762220e965130f8e0c0bda116929bd8d4dd281de3c11cc93ac556ccc927 |
| qwen3-coder-480b | qwen3-coder:480b | 0x04f2eb3946a0fbfef3d21553f3e8cccf3d75b565fcb38397263c8835046a9eb6 |
| x/z-image-turbo (confirm with gateway) | x/z-image-turbo | 0xeefd529d6ade33db162bcfc77a7bff03bf127716521a18cd37ebf43127f21bd9 |
| x/flux2-klein (confirm with gateway) | x/flux2-klein | 0x6987599e7fe498be1f88277444d487adc2642e339e560eeb586edbfd49e4da80 |
| ace-step | (custom media runtime) | 0xd01d20ce20259598e2193c57dfefbcfc98f7e29ca069dd7fa3e0aee645dd3a3b |
| wan2.2-ti2v-5b | (custom media runtime) | 0xeafb88cd9624866401b14db93c44c58649e8a81686c847c61b1c68e3210f14bd |
| wan2.2-t2v-a14b | (custom media runtime) | 0xc267ad774484533104d90193355f5876c54478629bef14f6c6dad071a1230d20 |
| ltx-2.3 | (custom media runtime) | 0xa855c71eb4140b94b3a1bba1810830cf8d4b6f3501371a77744c1319f7a7e2d7 |

**Per-model facts for implementers.**

"Measured VRAM" is from a real run (see the measured-results section); "card needed" reflects that measurement.

| Model | Disk (Q4) | Card needed | Measured VRAM | Licence | Fee (LCAI) |
|---|---|---|---|---|---|
| Qwen3-Embedding 0.6B | ~0.6 GB | 8 GB / CPU | 5.4 GB | Apache-2.0 | 0.004 |
| Qwen3-VL 8B | ~6 GB | 12 GB | 9.5 GB | Apache-2.0 | 0.03 |
| gpt-oss 20B | ~14 GB | 16-24 GB | 12 GB | Apache-2.0 | 0.04 |
| GLM-4.7-Flash | ~19 GB | 24 GB | 19.3 GB | MIT | 0.05 |
| Qwen3-VL 30B (MoE) | ~20 GB | 24 GB | 20.6 GB | Apache-2.0 | 0.08 |
| Qwen3-Coder-Next | ~52 GB | 80 GB | 54.8 GB | Apache-2.0 | 0.12 |
| gpt-oss 120B | ~65 GB | 80 GB | 60 GB | Apache-2.0 | 0.15 |
| Z-Image-Turbo | ~13 GB | 24 GB | not yet tested | Apache-2.0 | 0.15 / image |
| ACE-Step | ~7 GB | 8 GB | not yet tested | Apache-2.0 | 0.10 / song |
| Wan 2.2 (A14B) | ~28 GB | 80 GB | not yet tested | Apache-2.0 | 0.50 / clip |

(Dense `qwen3-vl-32b` is also valid but, measured at ~3 tok/s on a 24GB card, belongs on an 80GB card; the 30B MoE is the 24GB pick.)

**Sources and checking.** Model facts (existence, downloadable version, size, licence, test scores) were verified in June 2026 against the official model libraries, the model makers' own pages and licence files, and public comparison leaderboards. Licence terms were read from the actual licence files, since several secondary write-ups described them incorrectly. The network facts (hardware spec, time limit, registration method, naming rule) were checked against the live worker configuration. The registration hashes were computed directly and confirmed against the network's existing entries.

### Test evidence (reproducible)

Two kinds of evidence back this report. First, the model behaviour was **measured on real rented GPUs** (see the "What we measured on real GPUs" section and the raw data in `gpu-tests/`). Second, the deterministic on-chain claims are backed by an automated test, `verify-model-expansion.mjs`. Run it with `npm test` (or `node verify-model-expansion.mjs`). It checks, and at last run passed, all of the following (40 assertions, 0 failures):

1. **Hashing scheme against the live network.** `keccak256("llama3-8b")` equals the live model's registration hash `0xf4a414fa...`, and the two community examples (`llama3.1:8b`, `mistral-nemo:12b`) reproduce their published hashes. This confirms the derivation is correct.
2. **Every registration hash in this report** was recomputed from its name and matched.
3. **The name-to-pull mapping** (`-Nb` becomes `:Nb`) was checked for every Ollama model, confirming each registration name downloads the intended model.
4. **The worker spec and time limit** cited here (8GB/24GB cards, 120s budget, 30-600s range, 80% worker share) were asserted.
5. **Live on-chain confirmation.** The test reads the real mainnet configuration contract and confirms `calculateJobFee` returns **0.02 LCAI for llama3-8b** and **0.15 LCAI for llama3-70b** - the exact fee anchors this report's suggestions are scaled from. Because the dash-form hash resolves on-chain, this also proves the network registers models under the dash name (so the registration hashes above are the correct ones to submit). For reference, the live on-chain `modelId` of `llama3-70b` is `0x665d85c3b24f6a5cb91f90ec2e215d6155531158ff7ba81dfd182ecfab1dd4cf`.

The non-deterministic claims (model quality scores, sizes, licences) cannot be unit-tested; they were verified by hand against primary sources as described above, and should be re-checked against the live model pages before submission, since leaderboards and model versions move.
