# Which model gives the best real assessment of LightChain? (2026-07-15)

*We gave all five models the **same verified fact-brief on LightChain** (drawn from our own
on-chain research, which is more reliable than a web search for a niche project with unrelated
same-name tokens) and the **same five hard analytical questions**: what it is, the most valuable
whitepaper ideas, worker economics, the validator/security model, and exchange-listing readiness.
Grounding every model on identical facts isolates the thing that actually matters for an
assessment: reasoning quality, accuracy, prioritization, and honesty about what the brief does
not say. All five ran on the same 80GB A100 (direct Ollama).*

**One finding up front:** given a factual brief, **even llama3-8b did not hallucinate** - it
stayed on the facts. So the gap here is not about invented facts; it is about **whether the model
produces a genuine assessment (surfacing non-obvious risks, ranking them, being honest about
gaps) or just a competent summary of the brief.**

---

## Ranking for a real LightChain assessment

| Rank | Model | Verdict |
|---|---|---|
| **1** | **gpt-oss:120b** | The clear best. Deepest, most accurate, best-structured. Surfaces risks the others miss and is honest about unknowns. Use this for due-diligence-grade work. |
| **2** | **gpt-oss:20b** | ~90% of the 120B's quality at 1.4x the speed. The practical daily driver. |
| **3** | **qwen3-coder-next** | Punched above its weight: the most precise of the concise tier (it alone stated the treasury/AI-stack control distinction exactly right). |
| **4** | **glm-4.7-flash** | Fast, a few sharp lines, but shallow and made a factual slip on treasury custody plus an internal inconsistency. |
| **5** | **llama3-8b** | Accurate when spoon-fed, but a summary, not an assessment. Least insight, generic conclusions. |

---

## What separated them (with receipts)

**Depth of risk analysis.** The assessment's whole value is catching what is not obvious.
Only **gpt-oss:120b** surfaced the subtle attacks:
- *An exit within the dispute window:* "a well-funded adversary could acquire large stake, accrue
  reputation by honest jobs, then 'exit' and submit a bad result before being slashed, exploiting
  the 24h window."
- *Censoring dispute transactions via the unspecified consensus layer:* "any attack on block
  production... could prevent dispute transactions from being included, undermining the whole
  correctness guarantee."
- *Market-depth / listing angle:* "only ~5.47B LCAI are votable/transferable, potentially limiting
  market depth," plus a "legal review confirming LCAI is not classified as a security."

gpt-oss:20b caught most of the core risks (worker/attestor collusion, disputer downtime, Sybil,
unilateral upgrades) but not those three subtler ones. qwen3-coder-next was concise but sharp,
and uniquely nailed the votable-supply concentration point.

**Accuracy - the one real error.** The brief states the **treasury is Timelock-owned** while the
**bridge that funded it is an operator EOA**. **glm-4.7-flash got this wrong** in the listing
answer ("the $4.5B treasury is held by a single team-controlled EOA, not the Timelock") and also
wrote a confused line that ~5.47B votable supply is "insufficient to meet the 140k proposal
threshold" (5.47B is far above 140k). It even contradicted itself, stating the treasury *is*
Timelock-owned in a different answer. By contrast **qwen3-coder-next stated it precisely**: "The
treasury is Timelock-owned, but *control* of the AI stack isn't." gpt-oss:120b and :20b were
accurate throughout.

**Honesty about gaps.** The brief deliberately omits the base-layer consensus. A good analyst
flags that. gpt-oss:120b, gpt-oss:20b, qwen3-coder-next and glm-4.7-flash all did (glm's line was
the bluntest: "'sovereign' is currently marketing fluff" until the consensus is specified).
gpt-oss:120b went further, noting on worker economics that "the brief gives no data on gas fees,
electricity or depreciation... we cannot calculate a precise break-even point" - the rigorous
move. **llama3-8b did not proactively flag the missing consensus**; it only mentioned it when the
brief handed it the point directly.

**Summary vs assessment.** llama3-8b's answers are accurate paraphrases of the brief that end in
generic verdicts ("its unique concept... can make it an attractive listing candidate"). It does
not rank risks, model attack scenarios, or weigh trade-offs. That is the difference between a
model that *repeats* what you gave it and one that *evaluates* it.

---

## Recommendation

- **For a serious, due-diligence-grade assessment of LightChain (exchange listing, risk memo,
  investor question): use gpt-oss:120b.** It reads the same facts everyone else got and returns
  materially more insight, correctly and honestly.
- **For everyday analysis in the chat: gpt-oss:20b** gives you nearly the same quality faster.
- **llama3-8b (what the network serves today) is not adequate for this kind of work** - it will
  summarize your material competently but will not surface the risks that make an assessment worth
  reading.

This mirrors the coding and general-reasoning results: llama3-8b is fast and, when grounded,
factually safe, but it is a summarizer; the gpt-oss models are the ones that actually reason.

*Method: identical verified brief + identical five questions, temperature 0.2, same 80GB worker,
direct Ollama. Full 25 answers (5 models x 5 questions) are in
`model-comparison-lightchain-assessment-data.json`.*
