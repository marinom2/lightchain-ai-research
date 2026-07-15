# Best open model for real work (2026-07-15)

*One rigorous head-to-head, five models, three dimensions that actually matter for day-to-day
work: **hard reasoning**, **real coding**, and **real-world web research**. Scoring is objective
wherever possible - reasoning answers are numeric and auto-checked, coding is extracted and
**executed** against hidden tests. All models ran on the same worker (one A100 80GB) through
Ollama directly. Browse every prompt and full answer in the
[hosted viewer](https://marinom2.github.io/lightchain-ai-research/).*

---

## Scoreboard

| Model | Reasoning (auto) | 12-ball logic | Coding (executed) | Verdict |
|---|:--:|:--:|:--:|---|
| **gpt-oss:120b** | **3/3** | solves it | **6/6** | **Best overall.** Gets everything right. |
| **gpt-oss:20b** | **3/3** | solves it | 5/6 | **Best value.** ~120B quality, faster, smaller card. |
| **glm-4.7-flash** | **3/3** | solves it | 5/6 | **Surprise all-rounder.** A "coder" that also reasons. |
| **qwen3-coder-next** | 1/3 | solves it | 5/6 | **Coder only.** Strong code, weak general reasoning. |
| **llama3-8b** *(network default)* | 1/3 | flawed | **0/6** | **Not for real work.** Weakest on every dimension. |

*Reasoning (auto) = 3 numeric problems with one correct answer each (probability = 3/11; the
"5 machines / 5 widgets / 5 min" trap = 5; trailing zeros in 100! = 24), matched exactly. Coding =
6 hard problems, each model's code executed against hidden asserts.*

---

## What each dimension showed

**Hard reasoning (auto-scored, objective).** gpt-oss:120b, gpt-oss:20b and glm-4.7-flash each went
**3/3**. The two failures are revealing: **qwen3-coder-next** (1/3) fell for the classic
machines/widgets trap and botched the probability - a top coder that is not a careful general
reasoner. **llama3-8b** (1/3) missed the widgets trap and miscounted the factorial's factors of 5.

**12-ball logic puzzle (judged for correctness).** The four capable models all used the correct
4-vs-4 information-theoretic approach that actually solves it in three weighings. **llama3-8b used
naive halving that cannot determine heavier-vs-lighter**, so its strategy does not solve the
puzzle.

**Coding (executed, objective).** gpt-oss:120b was flawless (6/6 - the only model to solve Basic
Calculator III). gpt-oss:20b, glm-4.7-flash and qwen3-coder-next all scored 5/6 (each missing one,
mostly the full expression parser). **llama3-8b scored 0/6** - genuine logic failures, not
formatting.

**Web research (judged).** Given only live web results on a real subject (LightChain) and no brief,
all five faithfully summarized what the web says - and notably, the web is almost entirely the
project's own marketing ("Proof of Intelligence," an "AI Virtual Machine," LCAI as a governance
token), which does not match the real on-chain system. gpt-oss:120b produced the most detailed,
best-cited synthesis; llama3-8b the shallowest. None of them strongly flagged that the source
material was promotional - a useful caution about trusting any model's web summary of a niche
project.

---

## The verdict for real work

- **Use gpt-oss:120b when you want it right.** It's the only model that aced reasoning **and**
  coding, wrote the hardest parser, and gave the sharpest research. Needs an 80GB card.
- **Use gpt-oss:20b as the daily driver.** It matched the 120B on reasoning, lost only one coding
  problem, runs faster, and fits a ~24GB card. The best quality-per-cost here.
- **glm-4.7-flash is the sleeper.** People file it as "the coding model," but it went 3/3 on
  reasoning and 5/6 on coding - a genuinely strong generalist on a 24GB card.
- **qwen3-coder-next is a specialist:** excellent code, but don't rely on it for general reasoning
  (1/3).
- **llama3-8b - the model the network serves today - is not adequate for real work.** 1/3
  reasoning, a flawed logic strategy, and 0/6 coding. Fast, but wrong.

**Bottom line: moving day-to-day work from llama3-8b to gpt-oss:20b (with gpt-oss:120b for the
hardest tasks) is the single highest-impact change - it turns "fast but often wrong" into
"correct and trustworthy."**

*Every prompt and full answer for all 14 tasks x 5 models is in the
[hosted viewer](https://marinom2.github.io/lightchain-ai-research/); raw data in
`../realwork` result files.*
