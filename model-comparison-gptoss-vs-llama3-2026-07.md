# gpt-oss:120b vs gpt-oss:20b vs llama3-8b: A Real Head-to-Head (2026-07-15)

*All three models run on the **same** LightChain testnet worker (one 80GB A100), through the
worker's own Ollama runtime, on the **same five hard prompts**. This is a fair fight on
identical hardware. Two of the prompts are objectively scored (a probability problem with one
correct answer, and a coding task whose output we execute); three are judged on
correctness/depth (a hard logic puzzle, a systems-analysis question, and a web-grounded
current-facts question using live Tavily search results).*

---

## The scoreboard

| Task | gpt-oss:120b | gpt-oss:20b | llama3-8b (what the network serves today) |
|---|---|---|---|
| **Hard probability** (answer = 3/11) | ✅ correct | ✅ correct | ❌ **wrong (said 1/4)** |
| **Coding** (LIS, code executed) | ✅ passes | ✅ passes | ⚠️ logic ok, but broke the "code block" instruction |
| **12-ball logic puzzle** (3 weighings) | ✅ complete, correct procedure | ✅ correct approach | ❌ **flawed strategy (3-vs-3 first weighing)** |
| **Systems analysis** (optimistic vs pessimistic locking) | ✅ structured, with mechanism + scenario | ✅ structured | ⚠️ shallow, generic |
| **Web-grounded** (ETH price + news, cited) | ✅ precise, cited | ✅ precise, cited | ⚠️ usable, but conflated two dates |
| **Speed** | 116 tok/s | **155 tok/s** | 170 tok/s |

**Bottom line: both gpt-oss models get the hard things right; llama3-8b is the fastest but is
wrong or shaky on almost everything that requires real reasoning.**

---

## What actually happened, task by task

**Hard probability.** "5 red, 3 blue, 4 green; draw 3; P(one of each)?" The answer is 3/11
(60 favorable / C(12,3)=220). Both gpt-oss models got **3/11**. llama3-8b computed the 60
favorable outcomes correctly, then divided by `5x3x4 = 60` instead of by 220 - it got the
**sample space wrong** and answered **1/4**. This is the classic small-model failure: it can
do the easy sub-steps but loses the overall structure.

**Coding (longest increasing subsequence).** We ran each model's code against hidden test
cases. Both gpt-oss models returned a clean function that **passed**. llama3-8b's DP logic was
actually fine, but it **didn't follow the "return only the function in a code block"
instruction** (it never closed the code fence), so the output wasn't cleanly usable. For a
chat/coding assistant, that instruction-following gap is a real usability problem.

**12-ball logic puzzle** (find the odd ball + heavier/lighter in 3 weighings). This is a
genuinely hard puzzle. gpt-oss:120b gave a **complete, correct step-by-step procedure**;
gpt-oss:20b laid out the **correct 4-vs-4 approach**. llama3-8b proposed a **3-vs-3 first
weighing**, which cannot solve it in 3 weighings - a **wrong strategy**.

**Systems analysis.** Both gpt-oss models produced structured, accurate explanations (version/
timestamp mechanism, a concrete lost-update scenario). llama3-8b gave correct-but-generic
definitions with less depth and no sharp scenario.

**Web-grounded answer.** We fetched live web results (Tavily) and asked each model to answer
from them and cite. gpt-oss:120b and :20b both returned **ETH ~$1,780.85 with the source URL**
plus a cited news item, cleanly. llama3-8b answered from the same context but **conflated two
dates** (quoted both a July 9 and a July 13 price), i.e. it used the material less precisely.

---

## What this means for the chat and for real work

- **llama3-8b feeling "basic" is real, not a vibe.** It's fast, but on anything needing
  correct multi-step reasoning, a precise algorithm, sound logic, or clean instruction-
  following, it is unreliable. It's fine for casual chat; it's risky for work.
- **gpt-oss:20b is the sweet spot / daily driver.** It matched the 120B on every objective
  task here, ran the **fastest of the capable pair (155 tok/s)**, and fits a ~24GB card. For
  everyday chat and coding help, this is the upgrade that makes the assistant actually
  trustworthy.
- **gpt-oss:120b is the flagship for the hardest work.** It was the most thorough and detailed
  (best logic write-up, most precise citations). It needs an 80GB card, so use it when depth
  matters most; otherwise gpt-oss:20b delivers ~the same correctness faster and cheaper.

In short: switching the chat from llama3-8b to gpt-oss:20b (with gpt-oss:120b available for
heavy lifting) turns it from "fast but often wrong" into "correct, structured, and genuinely
useful."

---

## Two important operational findings from this run

1. **One worker can serve several models at once - confirmed.** This single worker registered
   and is on-chain eligible for **all three** models simultaneously (`modelCount:3`), and
   Ollama loads whichever is requested. You do **not** need one worker per model.

2. **The gateway can't route the new models yet - this is the blocker to fix.** Even with our
   worker live and on-chain eligible for gpt-oss:20b/120b, the consumer gateway still lists
   **only llama3-8b** in `/api/models`, and sortition for the gpt-oss models **times out
   (504)**. This matches the team's own note that the "advertise all worker-supported models"
   backend change is saved locally and **not yet deployed**. Until it ships, no consumer can
   reach the new models through the gateway regardless of what a worker serves - which is why
   this comparison was run directly against the worker's runtime. (Web search: the worker has
   it enabled and Tavily works from it; because gpt-oss can't traverse the gateway yet, the
   web-grounded prompts above used the same Tavily results injected client-side.)

*Methodology: identical prompts, temperature 0, same worker/GPU, per-model timing from Ollama.
Objective tasks auto-scored (numeric match; code executed against hidden asserts).*
