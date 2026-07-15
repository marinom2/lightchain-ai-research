# How LightChain AI Works Now - A Plain-English Guide (July 2026 Upgrade)

*Last verified live on testnet: 2026-07-15. Everything below was confirmed by actually
running it end-to-end (real answer, real on-chain transactions), not from docs alone.*

---

## 1. What is LightChain AI? (the 30-second version)

LightChain AI is a **decentralized network for running AI models**. Instead of sending your
prompt to one company's servers (OpenAI, etc.), you send it to a **network of independent
"worker" computers** around the world, each running open models on their own GPUs. The
blockchain is the referee: it decides which worker handles your request, records that it
happened, and makes sure the worker gets paid and behaves.

Think of it as **"Uber for AI compute"**: you (the rider) want an answer; workers (the
drivers) have GPUs; the blockchain (the dispatcher app, but with no company in the middle)
matches you up, handles payment, and keeps a rating for each driver.

Two roles:
- **Consumer** - you, asking a question / running a prompt.
- **Worker** - someone running a GPU that answers prompts and earns fees.

---

## 2. What changed in the July 2026 upgrade

Before, a single piece of company-run software called the **"dispatcher"** decided which
worker got your job. That's a central point of control. The upgrade (deployed 2026-07-14,
15:50 UTC - you can see the two contract-upgrade transactions on-chain) removed it and
replaced it with three things:

| Change | In plain English |
|---|---|
| **On-chain sortition** | The blockchain itself now randomly picks a worker for you, weighted by how much they've staked and their reputation. No middleman chooses. |
| **Reputation system** | Every worker has an on-chain score. Finish jobs → score goes up. Lose a dispute → score goes down. Higher score = picked more often. |
| **Gasless consumer flow** | You no longer pay a blockchain "gas" fee for every prompt. You prepay a small balance once, authorize the gateway to act for you, and it handles all the on-chain bookkeeping. |

**Why it matters:** it's more decentralized (no company picks winners), more trustworthy
(bad workers provably lose reputation), and much easier to use (no per-prompt gas fees or
wallet pop-ups).

---

## 3. The full journey of one prompt (step by step)

Here's exactly what happens when you send a prompt, in order. Each step has a simple
explanation and a "what's really happening" note for the technically curious.

### Step 1 - Sign in with your wallet
You prove you own your wallet by signing a message (no password). The gateway gives you a
temporary access token.
> *Technical:* SIWE ("Sign-In With Ethereum", EIP-4361). You `GET /api/auth/challenge`,
> sign the message, `POST /api/auth/verify`, and get back a JWT you use as a Bearer token.

### Step 2 - Prepay + authorize (one-time setup)
The first time, you deposit a little LCAI (the network token) into an on-chain "prepaid
balance" and authorize the **gateway** to spend from it on your behalf. This is what makes
every future prompt **gasless** - the gateway pays the blockchain fees and deducts from
your prepaid balance.
> *Technical:* one transaction, `JobRegistry.depositAndAuthorize(delegate)`, where
> `delegate` is the gateway's address. After this, `prepaidBalanceOf(you)` is funded and
> `isDelegateAuthorized(you, gateway)` is true.

### Step 3 - Pick a worker (sortition)
You ask for a model (e.g. llama3-8b). The blockchain runs a **lottery weighted by stake +
reputation** and selects a worker. The worker sends back its public encryption key so you
can talk to it privately.
> *Technical:* `POST /api/sessions/sortition/request {modelId}`. Returns the chosen
> `worker`, its `workerEncryptionKey`, and a `disputerEncryptionKey` (a neutral third party
> who can arbitrate if you dispute the answer).

### Step 4 - Set up a private, encrypted session
Your device makes a fresh secret "session key" and locks it so **only the chosen worker**
(and the disputer) can open it. The gateway then creates the session on the blockchain -
**for you, gaslessly**.
> *Technical:* generate a random AES session key; wrap it to the worker's and disputer's
> ECDH-P-256 keys (`encryptSessionKey`); `POST /api/sessions/sortition/{id}/keys`. The
> gateway (as your authorized delegate) sends the on-chain `createSession` tx itself.

### Step 5 - Send your (encrypted) prompt
Your prompt is **encrypted with the session key** before it ever leaves your device, then
uploaded. The gateway submits the job on-chain (again gasless). The worker is now working.
> *Technical:* `POST /api/blobs {data: encrypted-prompt}` then
> `POST /api/sessions/{id}/messages {blobHash}`. That fires the on-chain `submitJob`.

### Step 6 - Get the answer (streamed and decrypted)
The worker's answer streams back to you in encrypted chunks over a live connection. Your
device **decrypts each chunk with the session key** and assembles the reply. Nobody in the
middle - not even the gateway - can read your prompt or the answer.
> *Technical:* `GET /api/sessions/{id}/token` for a relay token, open a WebSocket to
> `wss://relay.testnet.lightchain.ai/ws?token=...`, decrypt each `chunk` frame with the
> session key until the `complete` frame.

**End result:** you got a private answer from a randomly-selected, staked, reputation-rated
worker, and paid a tiny fee from your prepaid balance - with no gas pop-ups.

---

## 4. The worker side (how someone earns by running one)

If you have a GPU and want to earn:
1. **Register** on-chain with a stake (a deposit that can be slashed if you misbehave), and
   publish your encryption key: `registerWorker(encryptionKey)` with the stake attached.
2. **Serve models** - run the model (via Ollama) so you can answer prompts for it.
3. **Stay online** - when sortition picks you, you must respond quickly with your key and
   then the answer.
4. **Build reputation** - finishing jobs raises your score (`recordCompletion`), which makes
   sortition pick you more often. Losing disputes lowers it (`recordDisputeLoss`).

> **Gotcha we learned the hard way:** your encryption key lives *only* on the machine that
> registered. The blockchain has **no "update key" function** - only register (sets it) and
> deregister (clears it). So if that machine dies, you must **deregister and re-register**
> to publish a new key. And deregister is blocked until any in-flight job clears its 24-hour
> dispute window. Back up your worker's keys.

---

## 5. Why this is genuinely better than before

- **No central chooser.** The dispatcher is gone; the chain picks workers by transparent,
  on-chain rules (stake + reputation).
- **Bad actors are punished on-chain.** Reputation and slashing are real contract functions,
  not policy promises.
- **Gasless = normal-app feel.** Prepay once; after that it's just "type and send," no wallet
  confirmation per message.
- **Private by default.** End-to-end encryption between you and the worker; the gateway only
  routes ciphertext.
- **Faster in practice.** In a live test the *actual inference* took ~12 seconds; the
  one-time worker-selection ("sortition") took ~28 seconds, and it's paid **once per
  session** - so follow-up messages in the same chat are fast.

---

## 6. Jargon, decoded

- **LCAI** - the network's token, used for staking, fees, and prepaid balances.
- **Worker** - a computer with a GPU that answers prompts and earns fees.
- **Stake** - LCAI a worker locks up as a good-behavior deposit (can be *slashed*).
- **Sortition** - a weighted random draw the blockchain uses to pick your worker.
- **Reputation** - an on-chain score per worker; rises on good jobs, falls on lost disputes.
- **Gasless** - you don't pay per-transaction blockchain fees; you prepay a balance instead.
- **Delegate** - the gateway address you authorize to do on-chain steps for you.
- **SIWE** - "Sign-In With Ethereum"; logging in by signing a message with your wallet.
- **ECDH / session key** - the math that lets you and the worker share a secret so your
  prompt is encrypted end-to-end.
- **Relay** - the live streaming channel the worker's answer comes back through.
- **Dispute window** - a 24-hour period after a job during which the result can be
  challenged; the worker's stake for that job is locked until it passes.

---

## 7. Proof it actually works (live testnet run)

A real prompt run end-to-end through the official gateway on 2026-07-15:

- Signed in, prepaid + authorized the gateway (one tx).
- Sortition selected a real worker.
- Session created on-chain by the gasless delegate; encrypted prompt submitted (a real
  `submitJob`, jobId 1188).
- The worker's encrypted answer streamed back and decrypted locally:
  *"I am LLaMA, a large language model trained by Meta AI..."*
- **Latency:** sortition ~28s (one-time per session) + inference ~12s = ~54s total; follow-up
  messages on the same session skip sortition (~12s).

The upgrade itself is verifiable on-chain: the JobRegistry and AIConfig contracts were both
upgraded on 2026-07-14 at 15:50 UTC by the testnet owner, and a new **ReputationRegistry**
contract (with `getScore`, `recordCompletion`, `recordDisputeWin/Loss`) was deployed and
wired in.

---

## 8. Adding a new model - the enable-and-test process

Getting a model usable on LightChain AI is a chain of layers. Here's the whole thing and
where each step stands today:

1. **Whitelist it on-chain (team action).** The model gets an ID - `keccak256` of its exact
   Ollama tag, e.g. `keccak256("gpt-oss:20b")` - registered with a per-job fee. This is a
   privileged team operation. **Six models beyond llama3 are already whitelisted on testnet:**
   `glm-4.7-flash`, `gpt-oss:20b`, `gpt-oss:120b`, `qwen3-vl:8b`, `qwen3-vl:30b`,
   `qwen3-embedding:0.6b`.

2. **A worker serves it.** A registered worker pulls the model (via Ollama) and adds it to
   what it serves. **The moment a live worker serves a model, the gateway advertises it** -
   it appears in `GET /api/models`. This list is **dynamic**: it reflects what active workers
   currently support, not merely what's whitelisted. (Confirmed by the LightChain team, and
   consistent with what we see: only `llama3-8b` is listed today because it's the only model
   with a live worker.)

3. **Consumers can request it - by API today, by the chat dropdown soon.** Once advertised, a
   model runs through the exact flow in Section 3 - just put its ID in the sortition request.
   The **chat app's model-selector dropdown** is the one missing UI piece: per the team, the
   backend is already wired to advertise all worker-supported models, and the frontend needs
   a small tweak to let chat users pick them. So the other models are **one frontend change
   away, and already reachable programmatically**.

> **How to test a not-yet-in-the-dropdown model right now:** run (or wait for) a worker that
> serves it → confirm it shows up in `GET /api/models` → send a `sortition/request` with that
> `modelId` and complete the flow. That's the current way to exercise the new whitelisted
> models before the chat UI exposes them. (This is the direct answer to "how do we query
> other models to test in this phase.")

## 9. What's NOT working yet (2026-07-15) - the honest list

- **Chat model-picker:** the chat UI still only offers `llama3-8b`; selecting other models
  needs the pending frontend tweak. The backend already advertises them.
- **No live workers for the 5 new models:** they're whitelisted, but nobody is serving them
  on testnet right now, so they don't appear in `/api/models` and can't be sortition-selected.
  **Standing up a worker that serves one fixes this immediately for that model.**
- **Thin capacity:** even `llama3-8b` appears to have a single public worker; a handful of
  back-to-back requests saturate it → `504 Gateway Time-out` until it frees up.
- **Old client SDKs are broken:** the pre-upgrade login (worker-gateway bearer token) is
  retired; SDKs `401` until updated to the new SIWE→JWT + sortition + gasless flow.
- **No on-chain key update:** a worker whose machine dies must **deregister + re-register** to
  publish a new encryption key (and wait out any in-flight job's 24-hour dispute window
  first). Back up worker keys.
- **Docs/source pending:** the full technical implementation report and open-source release
  are promised *after* the security re-audit.

*This guide will be updated as the network moves toward mainnet.*
