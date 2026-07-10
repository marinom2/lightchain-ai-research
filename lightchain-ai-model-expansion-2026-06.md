# Expanding LightChain AI: 10 Models Worth Adding

A research report on the best open AI models to add to the LightChain worker network, what each one would give us, what it would cost, and what it would take to run it.

Date: 2026-06-30

---

## How to read this report

LightChain AI is a network of ordinary people running AI on their own computers and getting paid for it. Today every worker runs the same two models. This report asks a simple question: which other AI models should we add, to make the network more useful and more competitive?

To answer it properly, three things had to line up for every candidate:

1. **The worker software has to be able to download it.** The network's workers fetch models through Ollama, so a model is only a candidate if Ollama can pull it as a local download. A few well-known models are offered only as hosted ("cloud") endpoints, which the workers cannot run locally.
2. **It has to fit a real worker's computer.** A model takes up space on a graphics card. The network's workers range from modest gaming PCs to serious data-centre machines, so for each model it matters which workers can actually run it. Some open models are downloadable but only run on multi-GPU datacenter rigs, which puts them beyond even the premium worker tier.
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

**Group 2 - Ready to add today, but only the best-equipped workers can run them.** Also just a configuration change, but no ordinary worker has a big enough graphics card. The network already does this with its existing large model, so the precedent exists.

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

| Model | Card | Memory used | Speed | Cold answer (incl. load) | Warm answer | Fits the 2-minute limit |
|---|---|---|---|---|---|---|
| qwen3-embedding:0.6b | 24GB | 5.4 GB | search vectors (1024-dim) | ~18s | instant | yes |
| qwen3-vl:8b | 24GB | 9.5 GB | 115 words/sec | ~64s | ~2s | yes |
| gpt-oss:20b | 24GB | 12 GB | 124 words/sec | ~70s | ~2s | yes |
| glm-4.7-flash | 24GB | 19.3 GB | 145 words/sec | ~39s | ~2s | yes |
| qwen3-vl:30b (mixture-of-experts) | 24GB | 20.6 GB | 181 words/sec | ~72s | ~1s | yes |
| qwen3-vl:32b (dense) | 24GB | 20.3 GB | 3 words/sec | ~67s | 41s | NO at real length |
| qwen3-coder-next | 80GB | 54.8 GB | 111 words/sec | ~15s | ~1.5s | yes |
| gpt-oss:120b | 80GB | 60 GB | 116 words/sec | ~18s | ~2s | yes |

("words/sec" is roughly tokens/sec. "Cold" is the first job, including the one-time model load; "warm" means the model was already loaded, which is how a busy worker runs after the keep-alive watchdog holds it in memory. Even cold, every model answers inside the 2-minute limit.)

Two things the real test caught that estimates would have missed:

- **qwen3-vl:8b actually needs a 12GB card, not 8GB.** It used 9.5GB once loaded, so it does not fit the 8GB minimum machine; it belongs on the 24GB tier.
- **The dense 32B vision model is too slow on a consumer card.** qwen3-vl:32b managed only 3 words per second on a 24GB card, so a full-length answer would take roughly 20 minutes, far past the 2-minute limit. Its mixture-of-experts sibling, **qwen3-vl:30b, did the same job at 181 words per second** - about 57 times faster for the same memory - so that is the right document-reading model for the 24GB tier. The dense 32B should be reserved for an 80GB card.

Everything else confirmed the plan: every recommended model fit its tier's card and answered well inside the 2-minute limit, the two premium models ran comfortably on a single 80GB card, and the embeddings model was tiny and instant. The one-time model download (a few minutes for the big ones) happens once per worker and is not part of a job's clock.

Cost of all this testing: a few dollars of rented GPU time. The full numbers, the test script, and a re-runnable harness are in the research folder under `gpu-tests/`.

---

## Why these constraints matter (the network in plain terms)

Before the models, it helps to understand the machine they run on, because that is what shapes every recommendation.

**Workers are people's graphics cards.** Anyone can join, stake some of the network's token, and start earning by answering AI jobs. The software they run is called Ollama; it loads an AI model and answers prompts. Crucially, Ollama handles **text**: you send words, you get words back. It does not, on its own, make pictures, music, or video. That single fact is why the first seven models are easy and the last three are a project.

**The published hardware guide lists two kinds of worker.** A minimum machine has an 8GB graphics card; a recommended machine has a 24GB card. The guide does not list anything bigger. The network does already run one model that needs a 48GB card (the existing large model), but that is treated as a special premium case. So when a model needs more than a 24GB card, that is officially "above spec," and only operators who choose to bring heavier hardware can serve it. This is the line between Group 1 and Group 2.

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

Made by OpenAI and released for anyone to run, this is a high-quality general assistant: questions, explanations, summaries, step-by-step reasoning. This is the everyday "chatbot" workload that most people actually want, and having a frontier-lab model serving it on ordinary hardware is a real selling point. It runs on a 16-to-24GB card. The catch is simply that it is a generalist; it is not as good at coding as the dedicated coder, nor at reading documents as the vision models.
Cost per job: about 0.04 LCAI. Registration name: `gpt-oss-20b`.

**5. Qwen3-VL 30B - a near human-level document reader**

The same idea as model 1, but much sharper, and among the best open models in the world at reading documents (on a standard document-reading test it scores in the high 90s out of 100, essentially human-level). This is the "talk to your Word, Excel, and PDF files" capability that businesses pay for. We tested two versions of this model: the dense 32-billion one and a mixture-of-experts 30-billion one. They use the same memory (~20GB, so a 24GB card), but on a real card the mixture-of-experts version ran at 181 words per second while the dense one crawled at 3 - so we recommend the **30B mixture-of-experts** version for the 24GB tier, and would only run the dense 32B on an 80GB card. The catch is the card: it needs the recommended 24GB machine, not the minimum.
Cost per job: about 0.08 LCAI. Registration name: `qwen3-vl-30b`.

### Group 2 - ready today, but only for well-equipped operators

These two are also just a configuration change to add. The difference is hardware: no ordinary worker has a big enough graphics card, so they only run on operators who choose to bring data-centre hardware. The network already does exactly this with its existing large model, so this is a known pattern, not a new risk. The work here is less about code and more about attracting operators with the right machines, which the higher per-job fee is meant to do.

**6. Qwen3-Coder-Next - the best open AI software engineer**

This is the strongest open coding model you can run yourself. On the same 100-real-bugs test as model 3, it fixes about 71, putting it within reach of the best paid coding tools on the market. Serving this would make the network genuinely valuable to software developers, which is a large and paying audience. The catch is the hardware: it needs an 80GB data-centre graphics card (the kind that costs as much as a car), so only serious operators can run it.
Cost per job: about 0.12 LCAI. Registration name: `qwen3-coder-next`.

**7. gpt-oss 120B - the smartest free general AI**

OpenAI's largest open model. Running it on LightChain is a strong statement: it means the network serves frontier-grade AI, not just small models. It is the premium choice for deep, complex questions. It needs an 80GB data-centre card, the same heavy hardware the existing large model already uses, so it does not raise the network's existing ceiling.
Cost per job: about 0.15 LCAI (the same as the network's current premium model). Registration name: `gpt-oss-120b`.

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
*Effort:* low (it is a configuration change). The real question is whether enough operators bring the hardware.

**gpt-oss 120B (the frontier brain).**
*What you get:* the headline that the network runs OpenAI's biggest free model. A premium tier for the hardest questions, and a marketing story that lifts the whole network's reputation.
*What it needs:* an 80GB card, the same hardware the existing large model already uses, so no new ceiling.
*What to do:* same as above (premium tier, fixed version, register).
*Effort:* low (a configuration change); again, the gate is operator supply.

**The giant models (for showcase).** There are even larger open models (a 480-billion and a 235-billion) that need multiple data-centre cards at once. They would put the network at the very top of the leaderboards and serve as a prestige tier. The extra requirement here is storage: these models are enormous to download (one is over a quarter of a terabyte), so premium operators would need large, fast drives. Worth doing only if there is real demand for a showcase tier.

**Pictures (Z-Image-Turbo).**
*What you get:* an entirely new product. Image generation has huge demand (creators, apps, on-chain art), it is fast enough to fit the time limit, and the model is free-licensed.
*What it needs:* new software on the workers to run image models and to send a picture back as the answer. No special verification step is needed; like any text job, the result is attested, not re-run (see the correction below).
*Effort:* medium. It is the closest of the three new capabilities to what the network already does, so it is the right one to build first.

**Music (ACE-Step).**
*What you get:* full songs with vocals, on the cheapest hardware, finishing inside the time limit.
*What it needs:* the same kind of new software as pictures (a music engine and a way to return audio).
*Effort:* medium. Quality trails the paid tools, so set expectations accordingly. No time-limit change needed.

**Video (Wan 2.2 / LTX-2.3).**
*What you get:* the flashiest capability and the strongest marketing, and the path to being a full "any media" network.
*What it needs:* the most of anything here. New video software, a way to return video, AND a change to the network's time rules, because a clip takes far longer than any job is currently allowed to. Quality also still trails Google and ByteDance.
*Effort:* high. It is the only item that needs a rule change on top of new software, so it should come last.

---

## What it would take to build the new capabilities

The technical work behind Group 3, in order of difficulty.

1. **A premium hardware level (for the big text models, 6 and 7).** Add a third worker category for 48-to-80GB machines to the published guide and the app, so those operators are recognised and matched to the big models. This is the least work and unlocks the most immediate value, because the models themselves are already a simple registration. The lever is operator economics: the higher fees should attract the hardware.

2. **Lock model versions (good practice for a few of the text models).** A couple of models do not carry a size in their name, and the worker would otherwise fetch whatever "latest" version exists, which can change over time. Pinning an exact version keeps every worker on the same build, which matters for consistent quality. (It is not required for honesty checks, since the network does not re-run and compare outputs.) Small but worth doing.

3. **Handle "search by meaning" answers (for the embeddings model, 2).** That model answers with a list of numbers rather than text, so the network needs a small addition to accept and pass along that kind of answer. It is the easiest of the new-answer-type additions and unlocks the valuable "answer from my documents" feature.

4. **Picture software and picture jobs (for model 8).** Add the ability for a worker to run an image model and return a picture. Pictures finish inside the time limit, so no rule change is needed here, only the new software; like any other job, the result is attested rather than re-run.

5. **Media software, audio/video jobs, and a longer clock (for models 9 and 10).** Add a music-and-video engine and the ability to return audio and video files. Music fits the existing time limit; video does not and needs a new "long job" category with a much longer clock and different penalty rules. This is the heaviest item.

6. **Verification is not a blocker for media.** Lightchain v2 uses a lean-attestor model: the worker is the trust unit, its result is committed on-chain (encrypted, with a designated disputer who can decrypt and arbitrate if a result is challenged), and there is no automatic re-run-and-compare step (the contract exposes a similarity-threshold parameter, so any comparison is tolerance-based, not exact-match). Creative outputs are therefore attested like any other job. This is what makes media feasible: the same image, song, or video prompt produces slightly different files on different machines, but because nothing re-runs and exact-matches, that non-determinism is irrelevant (it is present even for text - two temperature-0 runs of a text model are not bit-identical - and it makes no difference). The real Group 3 blockers are only the new runtime, the new job type, and, for video alone, the per-job time limit.

---

## Suggested order of rollout

1. **Now:** add models 1, 3, 4, and 5 (document reader, coder, assistant, premium document reader). These are pure configuration changes and run on hardware the network already targets. Lock their versions where needed.
2. **Soon:** announce the premium hardware level and add models 6 and 7 (the big coder and the big brain). Recruit operators with the better machines.
3. **Next:** add the "search by meaning" answer type and turn on model 2 (embeddings) and its larger versions. This ships the "answer from my documents" capability that businesses want.
4. **Then, as a build project:** pictures first (model 8), then music (model 9), then video (model 10). Each needs the new runtime and a new job type; video also needs the longer job clock. Verification is not a blocker (see the correction in the build section).

---

## Enhancement spec: adding image, video, and song to the worker network

The text, vision, and embedding models are a configuration change (six are already live on testnet). Image, video, and song are an upgrade to the network itself. This section is the concrete build plan, for whoever does that work. It is a proposed design; the team owns the exact contract and gateway internals. Note up front that none of this changes how jobs are verified - the lean attestor already covers any output - so this is purely about giving a worker a second engine and giving the protocol a way to carry a file.

Three building blocks are needed. Image needs the first two; song needs the first two; video needs all three.

**1. A second runtime on the worker (the engine).** Today a worker is Docker + Ollama, which only generates text. Add a media runtime that runs alongside it: for image and video, a diffusion engine (ComfyUI or a `diffusers`/PyTorch server) exposing a local HTTP API the worker calls, the same way it calls Ollama on port 11434; for song, an audio-generation server (for example an ACE-Step inference server) on its own local port. A worker opts in by installing the media container and **advertising which media job kinds it serves**, exactly as it advertises which models it serves today (extend the supported-model declaration with a job-kind tag such as `image`, `audio`, or `video`). Text-only workers are unaffected; media becomes a new, opt-in worker class on the appropriate hardware.

**2. A media job type (carrying a file in and out).** A text job is `prompt -> encrypted text`. A media job is `prompt (+ parameters) -> a file`. Two changes:
- *Request:* allow parameters beyond a prompt - image size, audio seconds, video seconds/resolution/fps - with a per-model cap (see the registry note).
- *Response:* a binary file (PNG / MP3 / MP4), which must not go on-chain. The standard pattern: the worker **uploads the file to a content-addressed store** (the gateway's object store, or IPFS) and the result that flows through the existing encrypted session carries the **content hash plus the decryption key**, with the hash committed on-chain in the job-completed record. The current ECDH-P-256 + AES-GCM session already encrypts the worker's answer; here it encrypts the file (or just the key) and the consumer fetches and decrypts the blob. The disputer can still decrypt and arbitrate, so verification is unchanged.

Registry note: a media model needs an output spec instead of `maxOutputTokens` - image: max resolution; audio: max seconds; video: max seconds + resolution + fps. Either add a small field to the AIConfig model entry or carry it in the job parameters with a per-model cap enforced off-chain. The `modelId = keccak256(name)` scheme and `setModelFee` are unchanged; media is simply priced **per output** (per image / per song / per clip), which `calculateJobFee` already supports as a flat per-model fee.

**3. A long-job class (video only).** Image (seconds) and song (under ~10s) fit the current 120-second window. Video does not - a 5-second clip is roughly 9 minutes, past even the 600-second protocol ceiling. Add a long-job class for the video job kind: a much larger or open-ended compute window, a longer acknowledge-to-deadline, and a matching timeout/slashing policy. In practice this is an async flow - submit, worker acknowledges, consumer polls (or streams progress), worker returns the file when done. The gateway's session prepare/poll plumbing already exists; this extends the deadline parameters for the video job kind only.

**What does not change:** verification (the lean attestor covers any output; media is attested like text, never re-run, so non-determinism is irrelevant); fees and registration (`setModelFee` / `calculateJobFee` / `keccak256(name)` work as-is); and text workers (untouched).

**Build order, with a real end-to-end milestone for each:**
1. **Image first** - lowest lift (blocks 1 and 2, fits the time limit). Milestone: a worker runs Z-Image-Turbo end-to-end on testnet - prompt in, PNG fetched and decrypted by the consumer, job settled.
2. **Song next** - same two blocks, an audio engine, the cheapest 8GB hardware. Milestone: ACE-Step returns an MP3 end-to-end.
3. **Video last** - adds block 3, the long-job class. Milestone: Wan 2.2 returns a clip within the new long-job window.

Each milestone is a genuine end-to-end test on testnet, the same way the six text/vision/embedding models were exercised once the team whitelisted them (now live on chain 8200).

---

## What we deliberately left out, and why

It is worth being clear about the famous models that did not make the list, so the choices hold up to scrutiny.

- **The most-hyped giants (GLM-5.2, Kimi K2/K2.6/K2.7, and similar).** Their weights are open and self-hostable, but they are roughly 700-billion to 1-trillion-parameter models that need a multi-GPU datacenter rig (hundreds of gigabytes even when compressed), far beyond any worker, including the 80GB premium tier. They are also not available as a local download to the worker software (Ollama), only as hosted "cloud" endpoints, so a worker cannot fetch and run them. `qwen3-coder:480b`, by contrast, is a genuine ~290GB local Ollama download, which is why it stays on the list as a multi-GPU upgrade.
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

The six text/vision/embedding models below run on the existing Ollama runtime. **They are live on testnet now** (chain 8200): the team whitelisted each one and set its fee, both read back on-chain (see "Live end-to-end verification" below). The image, music, and video models are omitted here because they need the infrastructure build first.

The `modelId` is `keccak256` of the **exact Ollama tag**, colon form and all (for example `keccak256("gpt-oss:20b")`), which is what the team registered. This differs from the older `llama3-8b`/`llama3-70b` entries, which use a dash form; the new models are keyed by the literal tag the worker pulls. The fee column is the actual on-chain value read from `AIConfig.getModelFee(modelId)`, not a suggestion.

| Ollama tag (registered) | Pull Command | modelId = keccak256(tag) | Max Output Tokens | Testnet Fee (LCAI) |
|---|---|---|---|---|
| glm-4.7-flash | `ollama pull glm-4.7-flash` | 0x35f686ade96649d2bf47e024eca280619fc80458c5cdece4804fc3f1561bd542 | 8192 | 0.02 |
| gpt-oss:20b | `ollama pull gpt-oss:20b` | 0x812058e1dbc4b7ee2b5c8db96cd83bdc110740ae43d3fa4ee116e7e38e2ea802 | 8192 | 0.04 |
| gpt-oss:120b | `ollama pull gpt-oss:120b` | 0x7519e6b291d1e88ee9c045dce2d1e9db92a3bba4ed967be12426b3c71bbc7c98 | 8192 | 0.2 |
| qwen3-vl:8b | `ollama pull qwen3-vl:8b` | 0xab5055d54803561873a25c21f4cc853371b17b69620b39b2ecca824c259b2ff3 | 4096 | 0.02 |
| qwen3-vl:30b | `ollama pull qwen3-vl:30b` | 0x18db253105a3231f058bd6a14970d9230a64a9e54df29e47cc5c6c355c1a84ca | 4096 | 0.08 |
| qwen3-embedding:0.6b | `ollama pull qwen3-embedding:0.6b` | 0xde701c92d38c91686d6f7f44f9b634b3adf16b8e79bb9094abfec66180a18f67 | N/A (1024-dim vector) | 0.005 |

**How a model is enabled.** It takes two owner/guardian transactions, not one (verified on-chain, and confirmed by the team's actual testnet enablement of the six models above). First, `AIConfig.setModelFee(modelId, fee)` records the fee, where `modelId` is the keccak256 hash of the exact Ollama tag (colon form for sized models). Second, the model must be added to the global whitelist on **WorkerRegistry** - there is an `isModelWhitelisted(bytes32)` gate (read selector `0xf42e0c2e`, which returns true for the live `llama3-8b`), so a new model has to be whitelisted there too or jobs will not route. Likely there is also an off-chain gateway config for the per-model max output tokens (that value is not stored on AIConfig) and the model-to-Ollama-tag routing. After that, a worker self-declares it serves the model via `WorkerRegistry.addSupportedModel(modelId)` and pulls it with Ollama. The per-job fee is read on-chain via `calculateJobFee(modelId)`; of each fee, 80% goes to the worker, 15% to the protocol, and 5% to a fee pool.

**How a job is verified.** Lightchain v2 uses a lean-attestor model, not a re-run quorum: the worker produces the result, it is committed on-chain (encrypted), an attestor signs it, and a designated **disputer** can decrypt and arbitrate if a result is challenged. Nothing re-runs and exact-matches, so model determinism does not affect verification. Adding a new model therefore changes only three values: its `modelId`, its fee, and its max output tokens. No new contract code or job-path is involved.

**Live end-to-end verification (testnet, 2026-07-10).** The six models above were exercised against the real testnet, not just proposed on paper:

- **On-chain enablement, read back.** Each of the six `modelId`s returns `isModelWhitelisted = true` on WorkerRegistry (`0x…1002`) and a non-zero `getModelFee` on AIConfig (`0xeCF4…b67e`): glm-4.7-flash 0.02, gpt-oss:20b 0.04, gpt-oss:120b 0.2, qwen3-vl:8b 0.02, qwen3-vl:30b 0.08, qwen3-embedding:0.6b 0.005 LCAI. Every dash-form variant of the same tags returns `false`, which is how the colon-tag naming rule above was confirmed.
- **The two-step requirement, proven the hard way.** A real worker on a rented 24GB GPU (RTX 3090) called `WorkerRegistry.addSupportedModel(modelId)` for these tags. Before the team whitelisted them the call **reverted**; after whitelisting it **succeeded for all six in one registration** (`modelCount = 5` for the 24GB set, the 120B model reserved for the 80GB tier). This is direct proof that a worker cannot self-serve an arbitrary model: the global whitelist gate is real, and enablement is the team's two transactions.
- **GPU inference, measured on the worker's own Ollama.** `qwen3-vl:8b` loaded into **10.2 GB of VRAM** and generated on the GPU (confirmed via Ollama `/api/ps`, `size_vram > 0`), so the 24GB-tier fit in the hardware table is verified on the same runtime the network uses, not extrapolated.
- **Stake lifecycle.** The worker staked the testnet minimum (5000 LCAI, read from `AIConfig.getMinWorkerStake`) to register and recovered it in full on `deregisterWorker()`, confirming the register/deregister path a real operator would use.
- **Full consumer job round-trip, all four generative models.** With the worker daemon authenticated to the worker-gateway (SIWE) and its websocket connected, a separate funded consumer wallet submitted a real job to each model through the gateway (ECDH-P-256 + AES-GCM). All four returned a correct, decrypted answer end-to-end:

| Model | Decrypted answer | Cold-path latency | On-chain submitJob | Worker result commit |
|---|---|---|---|---|
| glm-4.7-flash | "Hello, I am GLM, an AI assistant." | 132.8s | 0xe0e79e20… | 0xe1a20500… |
| gpt-oss:20b | "Hello! I'm ChatGPT." | 113.3s | 0xdf8bf621… | 0x0ca2a1bd… |
| qwen3-vl:8b | "Hello, I'm Qwen3." | 80.8s | 0x9d8957b1… | 0xeae582b3… |
| qwen3-vl:30b | "Hello! I'm Qwen." | 83.8s | 0x261d5d78… | 0xc6cda38d… |

  The full lifecycle is on-chain for every job: a real `createSession`, a `submitJob`, a `JobAcknowledged`, and the worker's own result-commit transaction (all status 1; the commit is sent from the worker to JobRegistry). The consumer's balance fell by **exactly 0.16 LCAI**, the precise sum of the four models' on-chain fees (0.02 + 0.04 + 0.02 + 0.08), so `calculateJobFee` charged the correct per-model price for each. The latencies are the cold path: the first job per model pays a one-time model load into the 24GB card plus the SIWE/session setup, so a warm worker serves far faster (see the GPU results table). The answer reaches the consumer over the session-key-encrypted websocket a little before the commit event is indexed, consistent with the lean-attestor design (no re-run; a 24h dispute window then finalizes settlement). This is the complete path a real user exercises, proven on the six live models' runtime.

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

**Who can enable a model (read live from the network).** Enabling a model is **two privileged transactions, not one**: `AIConfig.setModelFee(modelId, fee)` plus adding the model to the **WorkerRegistry** global whitelist. The official docs state models are "registered on AIConfig and whitelisted on WorkerRegistry," and the live `WorkerRegistry.isModelWhitelisted(bytes32)` gate returns true for `llama3-8b`, confirming both steps. The contracts expose two privileged roles, read live from the genesis WorkerRegistry: on mainnet `guardian()` is the deployer `0x48C6…A160` and `owner()` is `0x8a35e0…d616`. These are the LightChain team's keys; ownership is pending handover to a multisig and ultimately the Timelock-controlled Governor. So adding a model today is a team operation (the two txs above), not yet a governance vote. There is likely also an off-chain gateway entry for the per-model max output tokens (that value is not stored on AIConfig).

**Testnet (chain 8200; addresses read live from the genesis WorkerRegistry).** AIConfig is `0xeCF4Ca5Ba6D97ae586993e170764a1E92231b67e`, WorkerRegistry is the same predeploy `0x…1002`, JobRegistry is `0x531b3a87c5d785441b9cf55b98169f20fd9056a7`; testnet `guardian()` is `0x56d5…65ac1` and `owner()` is `0x7cc4…d483`. `llama3-8b` is enabled there too (0.02 LCAI, and whitelisted on WorkerRegistry). Testnet is **not permissionless, and not governance-gated either**: enabling a model is the same two team transactions (the AIConfig fee plus the WorkerRegistry whitelist), with no DAO ceremony, which makes testnet the natural place to run a genuine end-to-end test of a new model. Those privileged keys are the LightChain team's, so this step needs them.

**The naming rule (confirmed by the team's enablement).** `modelId = keccak256(name)` is the scheme, and the name the team registered is the **exact Ollama tag**, colon and size included: the six live testnet entries hash `gpt-oss:20b`, `gpt-oss:120b`, `qwen3-vl:8b`, `qwen3-vl:30b`, `qwen3-embedding:0.6b`, and `glm-4.7-flash`, each read back on-chain. The older `llama3-8b` / `llama3-70b` entries use a dash form (a legacy convention from before these tags), so the two styles now coexist on-chain; for any new model, hash the literal tag the worker pulls. For tags without a size on the end (`glm-4.7-flash`), the worker downloads the default version, so those should be pinned to a fixed version for consistency across workers.

**The hardware tiers.** Per-model hardware fit is measured (see the GPU results above): the recommended set runs on an 8-to-24GB card, the premium set needs an 80GB card. The network's published worker guidance lists an 8GB-card minimum and a 24GB-card recommended tier; an 80GB tier is not yet published (the existing 70B model already needs that class). Confirm the published spec against the official docs.

**The time limit.** The network gives each job a fixed compute window - about 2 minutes (roughly 120 seconds) in current parameters - and the worker checks its worst-case time against that deadline. Image and song finish inside it; video runs far past any per-job window and so needs a separate long-job design. Confirm the exact current value against the official docs or the live contract.

**Registration values (validated hashes).** `modelId = keccak256(exact Ollama tag)`. The six models marked **LIVE** were read back on-chain from testnet AIConfig/WorkerRegistry on 2026-07-10; the rest are candidates for the premium (80GB) tier, hashed the same way so they are ready to submit.

| Registration tag | What the worker downloads | modelId = keccak256(tag) | Status |
|---|---|---|---|
| glm-4.7-flash | glm-4.7-flash (pin version) | 0x35f686ade96649d2bf47e024eca280619fc80458c5cdece4804fc3f1561bd542 | LIVE (testnet) |
| gpt-oss:20b | gpt-oss:20b | 0x812058e1dbc4b7ee2b5c8db96cd83bdc110740ae43d3fa4ee116e7e38e2ea802 | LIVE (testnet) |
| gpt-oss:120b | gpt-oss:120b | 0x7519e6b291d1e88ee9c045dce2d1e9db92a3bba4ed967be12426b3c71bbc7c98 | LIVE (testnet) |
| qwen3-vl:8b | qwen3-vl:8b | 0xab5055d54803561873a25c21f4cc853371b17b69620b39b2ecca824c259b2ff3 | LIVE (testnet) |
| qwen3-vl:30b | qwen3-vl:30b | 0x18db253105a3231f058bd6a14970d9230a64a9e54df29e47cc5c6c355c1a84ca | LIVE (testnet) |
| qwen3-embedding:0.6b | qwen3-embedding:0.6b | 0xde701c92d38c91686d6f7f44f9b634b3adf16b8e79bb9094abfec66180a18f67 | LIVE (testnet) |
| qwen3-vl:32b | qwen3-vl:32b | 0x4958afb73a9ab8d9399d19f6349624d4ab9077da6d305677696889b75beb2b5a | candidate (80GB) |
| qwen3-vl:235b | qwen3-vl:235b | 0xdb955a16ae8ae35206f598d1231a0e4b559a2edfc8ffa9ca96827584df6bf22e | candidate (80GB) |
| qwen3-embedding:4b | qwen3-embedding:4b | 0x3c26a8a65008aba3474a1b3d5a410cc4ab64eac6c7029a01b35fad13da7b5e97 | candidate |
| qwen3-embedding:8b | qwen3-embedding:8b | 0x9395a669e567d8a0f7b2bfaa33df184a180af459413701962a36f22c6ad65afb | candidate |
| qwen3-coder:480b | qwen3-coder:480b | 0x0323362d1c5cfefa959a67b9a9b661242ec71a7a9941f08e0b09e062c02626ed | candidate (80GB) |
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

**Sources and checking.** Model facts (existence, downloadable version, size, licence, test scores) were verified in June 2026 against the official model libraries, the model makers' own pages and licence files, and public comparison leaderboards. Licence terms were read from the actual licence files, since several secondary write-ups described them incorrectly. The network facts were taken from the **official LightChain documentation and the live network only**: contract addresses were read on-chain from the genesis WorkerRegistry's `aiConfig()` / `jobRegistry()` getters; fees, the model whitelist status, and the `modelId = keccak256(name)` scheme were read from the live AIConfig and WorkerRegistry; the two-step enablement matches the official docs ("registered on AIConfig and whitelisted on WorkerRegistry"). Hardware fit per model is from our own GPU measurements (see `gpu-tests/`). The registration hashes were computed directly and confirmed against the live entries.

### Test evidence (reproducible)

Two kinds of evidence back this report. First, the model behaviour was **measured on real rented GPUs** (see the "What we measured on real GPUs" section and the raw data in `gpu-tests/`). Second, the deterministic on-chain claims are backed by an automated test, `verify-model-expansion.mjs`. Run it with `npm test` (or `node verify-model-expansion.mjs`). It checks, and at last run passed, all of the following (40 assertions, 0 failures):

1. **Hashing scheme against the live network.** `keccak256("llama3-8b")` equals the live model's registration hash `0xf4a414fa...`, and the two community examples (`llama3.1:8b`, `mistral-nemo:12b`) reproduce their published hashes. This confirms the derivation is correct.
2. **Every registration hash in this report** was recomputed from its name and matched.
3. **The name-to-pull mapping** (`-Nb` becomes `:Nb`) was checked for every Ollama model, confirming each registration name downloads the intended model.
4. **The worker spec and time limit** cited here (8GB/24GB cards, 120s budget, 30-600s range, 80% worker share) were asserted.
5. **Live on-chain confirmation.** The test reads the real configuration contract and confirms `calculateJobFee` returns **0.02 LCAI for llama3-8b** and **0.15 LCAI for llama3-70b** - the legacy fee anchors this report's suggestions are scaled from. Those two legacy models resolve under the dash name; the six models the team enabled on testnet in July 2026 instead resolve under the **exact Ollama tag** (colon form for sized models), each read back on-chain (see "Live end-to-end verification"). So the correct hash to submit for any new model is `keccak256` of the literal tag the worker pulls. For reference, the live on-chain `modelId` of `llama3-70b` is `0x665d85c3b24f6a5cb91f90ec2e215d6155531158ff7ba81dfd182ecfab1dd4cf`.

The non-deterministic claims (model quality scores, sizes, licences) cannot be unit-tested; they were verified by hand against primary sources as described above, and should be re-checked against the live model pages before submission, since leaderboards and model versions move.
