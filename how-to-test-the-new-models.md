# How to Test the New LightChain Models (Step by Step)

*The new models (gpt-oss:20b, gpt-oss:120b, glm-4.7-flash) are whitelisted on LightChain
testnet and served by workers through the decentralized protocol, but they are **not selectable
in the chat UI yet**. This page shows how to talk to them today, from zero, in about 5 minutes.
You send a real prompt through the real flow (on-chain worker selection, encrypted end to end,
gasless) and the answer comes back decrypted from the chain, with transaction links you can
verify on the explorer.*

---

## What you need

1. **Node.js 20 or newer** and **git** installed ([nodejs.org](https://nodejs.org)).
2. **A testnet wallet's private key.** Use a dedicated test wallet, never a wallet that holds
   real funds. If you already use [chat.testnet.lightchain.ai](https://chat.testnet.lightchain.ai)
   the easiest is that same wallet, because it is already funded and authorized.
3. **A little testnet LCAI** in that wallet. Each test job costs 0.02 to 0.2 LCAI, taken from a
   prepaid balance (the jobs themselves are gasless). If you use your chat wallet, your existing
   chat credit is that prepaid balance and you are ready.
4. **A live worker serving the model you test.** Model capacity on testnet depends on operators
   being online. If nobody is serving a model at that moment, the test reports "no worker
   claimed" rather than failing silently. (Anyone can add capacity: see the
   [worker guide](sortition-worker-guide-2026-07-17.md).)

## Step 1 - get the test script

Open a terminal and run:

```bash
git clone https://github.com/marinom2/lightchain-ai-research.git
cd lightchain-ai-research
npm install ethers@6 lightnode-sdk
```

That downloads this repository (the script is [consumer-e2e-test.mjs](consumer-e2e-test.mjs) in
its root) and installs the two libraries it needs.

## Step 2 - one-time wallet setup (skip if you use your chat wallet)

The gasless flow requires a one-time on-chain step: depositing a small prepaid balance and
authorizing the gateway delegate that creates sessions for you. **If your wallet already works
on chat.testnet.lightchain.ai, this is already done - skip to Step 3.** For a fresh wallet
(holding some testnet LCAI):

```bash
PRIVATE_KEY=0xYOUR_TESTNET_KEY SETUP=1 node consumer-e2e-test.mjs
```

This sends one transaction (3 LCAI deposit + delegate authorization) and prints its explorer
link. Run it once per wallet.

## Step 3 - send a prompt to a model

```bash
PRIVATE_KEY=0xYOUR_TESTNET_KEY MODEL="gpt-oss:20b" PROMPT="Explain in one sentence why the sky is blue." node consumer-e2e-test.mjs
```

Swap `MODEL` for any whitelisted model:

```
MODEL="gpt-oss:20b"      # strong all-round assistant, the recommended first test
MODEL="gpt-oss:120b"     # OpenAI's biggest open model
MODEL="glm-4.7-flash"    # coding-focused model
MODEL="llama3-8b"        # the current chat default, for comparison
```

## What you will see

The script prints each step as it happens. A successful run looks like this (real run,
2026-07-17):

```
1. authed: 0x5258...b860 | model: gpt-oss:20b ( 0x812058e1db... )
2. sortition winner: 0x481A847A71d131C707C20F38d9F30C8082409Baa ( 22.4s )
3. session created on-chain (gasless): sessionId 729 | tx: https://testnet.lightscan.app/tx/0x40f3a851...
4. job submitted (gasless): jobId 1222 | tx: https://testnet.lightscan.app/tx/0xdd17f0d6...
5. job COMPLETED on-chain by 0x481A847A71d131C707C20F38d9F30C8082409Baa
6. response blob found (slot 1246132) | keccak verified against on-chain hash

=== ANSWER (decrypted from the on-chain blob) ===
I'm ChatGPT, built on the GPT-4 architecture.

=== PROOF ===
  worker    : 0x481A847A71d131C707C20F38d9F30C8082409Baa
  session tx: https://testnet.lightscan.app/tx/0x40f3a851...
  submitJob : https://testnet.lightscan.app/tx/0xdd17f0d6... (jobId 1222)
  total     : 66.5s
```

What happened under the hood, in order: you logged in by signing a message (SIWE), the
blockchain ran a lottery and a staked worker claimed your session (`claimSession` on-chain),
the gateway created your session gaslessly, your prompt went up encrypted (only the winning
worker can decrypt it), the worker ran the model and posted the encrypted answer back on chain
as a blob, and the script fetched that blob, verified its hash against the on-chain record, and
decrypted it locally with your session key. Roughly 60 to 90 seconds end to end, and every step
has a transaction you can open on [testnet.lightscan.app](https://testnet.lightscan.app).

## Troubleshooting

| Symptom | Meaning | Fix |
|---|---|---|
| `403 from sortition` | Wallet not authorized for the gasless flow | Run Step 2 (`SETUP=1`) once |
| `sortition attempt N -> status 408/504` repeating | No live worker is claiming that model right now | Try `llama3-8b` to confirm your setup works, then retry the new model later or run a worker yourself ([guide](sortition-worker-guide-2026-07-17.md)) |
| `auth failed` | Gateway login hiccup | Re-run; check the wallet key starts with `0x` |
| `Could not locate the response blob` | Blob query raced the chain | Re-run once |
| `Job did not complete within 5 minutes` | Worker dropped mid-job | Re-run; the escrowed fee is protected by the protocol's timeout rules |

## Why the chat UI can't do this yet

Two small integration pieces are pending on the chat side: the model picker only lists what
`/api/models` returns (currently just llama3-8b), and the chat displays answers only from the
streaming relay, which external workers' streams don't reach today (their answers land on chain,
exactly where this script reads them). Until those land, this script IS the way to use the new
models, and it exercises the identical protocol the chat uses.

*Both the script and the [worker guide](sortition-worker-guide-2026-07-17.md) live in this
repository. Benchmarks showing why these models are a big upgrade over the current default:
[best-model-for-real-work-2026-07.md](best-model-for-real-work-2026-07.md), with every raw
transcript browsable [here](https://marinom2.github.io/lightchain-ai-research/).*
