# Expanding LightChain AI: 10 Models We Should Add

LightChain AI is a network of people running AI on their own computers and getting paid for it. Today every worker runs the same two models. Here are ten worth adding, and how soon we can do each.

Three things decide whether we can add a model: it has to be **downloadable** (not rental-only), it has to **fit a worker's graphics card**, and it has to **finish fast** (every job has a ~2-minute limit). That sorts the ten into three groups.

---

## The ten models

| Model | What it does | Why add it | The catch |
|---|---|---|---|
| **Qwen3-VL 8B** | Reads images, scans, and PDFs and answers questions about them | "Understand my document" on the cheapest worker | Reads pictures, doesn't make them |
| **Qwen3-Embedding** | "Search by meaning" so AI can answer from your documents instead of guessing | Tiny, instant, runs on anything; unlocks accurate document Q&A | It's the search engine, not the chatbot |
| **GLM-4.7-Flash** | An AI that writes and fixes software code | Strong coder, most permissive licence, runs on a high-end gaming card | Needs a 24GB graphics card |
| **gpt-oss 20B** | A strong all-round assistant (questions, reasoning), from OpenAI | Frontier-lab quality on ordinary hardware; the most-wanted everyday use | A generalist, not a specialist |
| **Qwen3-VL 32B** | A sharper document reader, near human-level on forms and PDFs | The "talk to your Word/Excel/PDF" feature businesses pay for | Needs a 24GB card |
| **Qwen3-Coder-Next** | The best open AI software engineer you can run yourself | Close to the best paid coding tools; makes the network useful to developers | Needs an 80GB data-centre card |
| **gpt-oss 120B** | OpenAI's biggest free model, the smartest general AI you can self-run | Headline: the network runs frontier-grade AI | Needs an 80GB data-centre card |
| **Z-Image-Turbo** | Makes a picture from a text description | A whole new product; fast and free-licensed | Software only does text today, needs building |
| **ACE-Step** | Writes and sings a full song from lyrics, in seconds, on a cheap card | New capability on the widest hardware base | Good but not as good as Suno; needs building |
| **Wan 2.2 / LTX-2.3** | Generates short video clips from text | Flashiest capability, best marketing | A 5-second clip takes ~9 min (over the time limit); needs building, still trails Google/ByteDance |

*A note on "the best coder": on a standard test of fixing 100 real software bugs unaided, GLM-4.7-Flash fixes ~59 and Qwen3-Coder-Next ~71. An older open coder of the same size manages ~22, and the best paid tools score in the 70s-80s. The network has no dedicated coder today, so this fills a real gap.*

---

## The three groups

**Group 1 - add now, runs on workers we already have.** Just a configuration change.
→ Qwen3-VL 8B, Qwen3-Embedding, GLM-4.7-Flash, gpt-oss 20B, Qwen3-VL 32B.

**Group 2 - add now, but needs better hardware.** Also just a configuration change, but only operators with an 80GB data-centre card can run them. We already do this with our existing large model, so the precedent exists.
→ Qwen3-Coder-Next, gpt-oss 120B.

**Group 3 - new capabilities that need building first.** Pictures, music, and video. The network's software only handles text today, so each needs new plumbing (and video needs the time limit changed) before any worker can offer it.
→ Z-Image-Turbo, ACE-Step, Wan 2.2 / LTX-2.3.

---

## Rollout, in order

1. **Now:** add the five Group 1 models (document reader, coder, assistant, premium document reader). Pure configuration.
2. **Soon:** announce a premium hardware tier and add the two Group 2 models. Recruit operators with bigger cards using the higher fees.
3. **Next:** turn on "search by meaning" (embeddings) for accurate document Q&A.
4. **Then, as a build project:** pictures first, then music, then video (the hardest, needs the time-limit rules changed).

---

## What we left out, and why

The most-hyped giants (GLM-5.2, Kimi) and the top video models (HappyHorse, Wan 2.7) are **rental-only**, not downloadable, so workers cannot run them. A few popular models (Meta's MusicGen, Llama Vision, HunyuanVideo) have **licences that block commercial or cross-border use**, which does not fit an open global network. Every model we picked is downloadable, freely licensed for business, and genuinely runnable by a worker.

---

*Every model and every network detail in this summary was checked against how the network actually works and the current state of open AI models, June 2026. A full report with the technical setup details is available separately.*
