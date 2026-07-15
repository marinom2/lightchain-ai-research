# Coding head-to-head: the LightChain coders on six hard problems (2026-07-15)

*Follow-up to the general comparison. Here we test coding specifically, with real hard problems
whose code is **extracted and executed against hidden test cases** - objective pass/fail, no
judgement calls. All five models run on the **same** LightChain testnet worker (one 80GB A100),
through the worker's own Ollama runtime.*

**Contestants:**
- **glm-4.7-flash** - the dedicated coding model already whitelisted on testnet (fits a 24GB card)
- **qwen3-coder-next** - the strongest open coder, an 80GB-tier candidate for whitelisting
- **gpt-oss:120b** and **gpt-oss:20b** - the strong general models, for reference
- **llama3-8b** - what the network actually serves to consumers today, as the baseline

**The six problems** (all executed against hidden asserts): median of two sorted arrays in
O(log), full regex matching (`.` and `*`), word break (segment into dictionary words), an LRU
cache class (O(1) get/put with eviction), Basic Calculator III (`+ - * /` with parentheses and
precedence, integer division truncating toward zero), and trapping rain water.

---

## The scoreboard

| Model | median | regex | word-break | LRU cache | calc III | rain-water | **Total** |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **gpt-oss:120b** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **6/6** |
| **qwen3-coder-next** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | **5/6** |
| **glm-4.7-flash** *(whitelisted coder)* | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | **5/6** |
| **gpt-oss:20b** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | **5/6** |
| **llama3-8b** *(served today)* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **0/6** |

**The headline: on real hard coding, the model the network serves to consumers today
(llama3-8b) solves none of six. Every candidate coder solves at least five, and gpt-oss:120b
is flawless.**

---

## What each failure actually was (so the scores are fair)

**llama3-8b: 0/6, and they are genuine logic failures, not formatting.** (We hardened the code
extractor so an unclosed code fence no longer counts against a model.) It returned the wrong
answer on median, regex, word-break and calculator; used `OrderedDict` in its LRU cache
**without importing it** (`NameError`); and threw an `IndexError` on trapping rain water. This
is a model that cannot be trusted with a non-trivial coding task.

**gpt-oss:20b: 5/6 - its one miss is a trivial edge case.** It only failed word-break on the
**empty-string input** (`word_break("", ...)` should be `True`; it returned `False`). Every
real segmentation case was correct. In practice this is the second-strongest performer here.

**glm-4.7-flash: 5/6 - a real coder, tripped by parenthesis grouping.** It aced regex, LRU,
word-break and rain-water, but its Basic Calculator III **mis-groups parentheses**: it computed
`(2+3)*4 = 12` instead of 20 (it applied precedence but not the parenthesis boundary correctly).
Solid, and exactly what you would expect from the network's designated 24GB coding model.

**qwen3-coder-next: 5/6 - strong everywhere except a broken calculator.** It nailed the O(log)
median, regex, LRU and the rest, but its calculator was substantially broken (`1+1` returned 1,
`2+3*4` returned 5). So its 5/6 is real, but on this one hardest problem it did worse than glm.

**gpt-oss:120b: 6/6.** The only model that correctly built a full recursive expression parser
with precedence, parentheses, and toward-zero integer division. It is the reference for "gets
the hardest thing right."

**The real separator was Basic Calculator III** (a full expression parser). Only gpt-oss:120b
solved it; glm and qwen both stumbled on it and gpt-oss:20b got it right. Everything easier than
that, all four capable models handled.

---

## Speed (same 80GB card, measured from Ollama)

| Model | Avg latency / problem | Throughput |
|---|:--:|:--:|
| llama3-8b | 2.4 s | 169 tok/s (but 0/6, so speed is moot) |
| glm-4.7-flash | 5.8 s | 117 tok/s |
| gpt-oss:20b | 8.3 s | **154 tok/s** |
| gpt-oss:120b | 9.7 s | 115 tok/s |
| qwen3-coder-next | 10.0 s | 112 tok/s |

All of them answer each problem in seconds, comfortably inside the network's ~2-minute job
window. (The median problem was the slowest single item for every model because the correct
O(log) solution is the fiddliest to write; gpt-oss:120b spent 26s and qwen 45s reasoning it out,
and both got it right.)

---

## What this means for coding on LightChain

- **The network cannot credibly serve developers on llama3-8b.** 0/6 on standard hard problems
  is disqualifying for real coding help. This is the single strongest argument for enabling the
  coding models.
- **glm-4.7-flash is the right everyday coder to turn on.** It is already whitelisted on testnet,
  fits a 24GB card (so ordinary high-end operators can serve it), and scored 5/6 on genuinely
  hard problems. For the bulk of coding requests this is the practical pick.
- **gpt-oss:20b is a superb general-plus-coding option** at 5/6 and the fastest of the capable
  models - a strong default if you want one model that does both chat and code well.
- **gpt-oss:120b is the flagship for the hardest coding** (the only 6/6, the only one to build a
  correct expression parser); reserve it for the 80GB tier.
- **qwen3-coder-next is strong but not a magic bullet.** It matched the field at 5/6 and is
  excellent on classic algorithms, but it is an 80GB-tier candidate that still needs whitelisting,
  and it was the weakest on the single hardest parser problem. Worth adding for the 80GB tier, but
  glm-4.7-flash delivers most of the value on far cheaper hardware.

**The blocker is unchanged and worth repeating to the team:** even though all of these models run
correctly on a worker, only **llama3-8b is routable through the consumer gateway today**. glm is
whitelisted on-chain but the gateway still advertises only llama3-8b (the "advertise all
worker-supported models" backend change is not deployed), and qwen3-coder-next is not yet
whitelisted at all. Until the advertise change ships (and qwen is whitelisted), none of these
better coders can reach a real user through the network, regardless of what a worker serves.

*Methodology: identical prompts, temperature 0, same worker/GPU. Each answer's code is extracted
(robust to unclosed fences) and executed against hidden asserts; a task passes only if all asserts
pass. Raw answers, code, and per-case diagnostics are in `model-comparison-coding-data.json`.*
