# Running a Worker Under LightChain's Sortition Upgrade (2026-07-17)

*On 2026-07-14 LightChain testnet removed the off-chain dispatcher and moved worker selection to
an on-chain lottery. This guide documents the first fully verified external-operator run under
the new flow: one worker serving four whitelisted models end to end, every step proven with
on-chain transactions. It also documents the three traps that will stop any operator who follows
the old instructions.*

---

## What changed on 2026-07-14 (verified on-chain)

The team deployer (`0x7CC45156...d483`) executed the upgrade at 15:50-15:51 UTC:

| Action | Address |
|---|---|
| AIConfig upgraded (`upgradeToAndCall`) | `0xeCF4Ca5Ba6D97ae586993e170764a1E92231b67e` |
| JobRegistry upgraded, new impl | impl `0x0D0aDd7F707eC622333542c4320b8C8F19160B5c` |
| **SessionManager deployed (NEW)** | proxy `0x86AdA80864e87dE2275200FeE905b5C32b32Bf68`, impl `0xB81c4612EB0530065f7034da414A07097F61F235` |

What this means mechanically:

- **The dispatcher is gone.** The new JobRegistry has no `assignJob`, no `dispatcher()`, no
  `setDispatcher`. Nobody assigns you work anymore.
- **Workers win work by claiming it on-chain.** The gateway opens a session request on the
  SessionManager; eligible staked workers race to call `claimSession(reqId)`. First eligible
  claim wins, weighted by stake and reputation (`isEligible`, `getScore` live on the same
  contract).
- **The winning worker serves every job in that session** directly from chain events:
  `acknowledgeJob` -> fetch prompt blob -> infer -> post response blob -> `completeJob`.
- **The chain is the source of truth for answers.** The response ciphertext lives in an EIP-4844
  blob; streaming relays are best-effort UX on top.

## The recipe that actually works

Four things are required. Missing any one of them produces a worker that registers fine and then
silently never receives a single job (or refuses to start).

**1. Use the post-upgrade worker image.** `worker:latest` in the public registry
(`us-central1-docker.pkg.dev/lightchain/lightchain-testnet-public-docker/worker`) rebuilt
**2026-07-14T15:13Z**, the same day as the chain upgrade. Anything older (the previous `latest`
was 2026-06-26) contains zero `claimSession`/sortition code and waits forever for the removed
dispatcher. Verify your binary: `strings bin/worker | grep -c claimSession` must be non-zero.

**2. Enable sortition mode explicitly.** The new binary still defaults to gateway mode. Set:

```bash
SORTITION_ENABLED=true
SESSION_MANAGER_ADDRESS=0x86AdA80864e87dE2275200FeE905b5C32b32Bf68
SORTITION_STATE_DIR=/data/sortition          # optional, keeps claim state
```

The binary logs `worker sidecar running (sortition mode)` when this takes effect, and
`sortition mode takes precedence; gateway will be ignored` if both are configured.

**3. Run a local Redis.** The new build writes a health heartbeat to Redis at startup and treats
failure as **fatal** (`service init failed: initial heartbeat write failed`). The old build
tolerated missing Redis; the new one does not.

```bash
apt-get install -y redis-server
redis-server --port 6379 --save '' --appendonly no &
```

**4. Read answers from the chain, not the relay (consumer side).** The worker publishes stream
chunks to its own local Redis, which the public relay cannot see, so consumers waiting on the
relay WebSocket will time out even though the job completed. The reliable path, and the
protocol's own stated source of truth:

1. Poll `JobRegistry.getJob(jobId)` until `responseBlobHash != 0`.
2. Map execution time to a beacon slot (`slot = (block_ts - genesis_time) / 6`) and fetch
   `GET {beacon}/eth/v1/beacon/blob_sidecars/{slot}`; match the sidecar whose
   `0x01 || sha256(kzg_commitment)[1..]` equals `responseBlobHash`.
3. Unpack the blob: drop byte 0 of every 32-byte field element, concatenate the 31-byte chunks,
   read a big-endian `u32` length prefix, take that many bytes of ciphertext.
4. Verify `keccak256(ciphertext) == getJob().responseCiphertextHash`, then AES-GCM-decrypt with
   the session key.

Everything else from the pre-upgrade guide is unchanged: stake 5,000 LCAI via `register`,
`keccak256(exact-tag)` model ids, the `llama3-8b` vs `llama3:8b` Ollama alias
(`ollama cp llama3:8b llama3-8b`), keygen + on-chain key binding (rotate only via
deregister + re-register).

## The proof: four models, one worker, all on-chain (2026-07-17)

Worker `0x481A847A71d131C707C20F38d9F30C8082409Baa` (5,000 LCAI staked, one A100 80GB pod)
registered all four whitelisted models and served a real consumer job on each. Sortition
selected this worker every time; every answer below was decrypted from the on-chain response
blob after verifying its keccak against the on-chain `responseCiphertextHash`.

| Model | jobId | Sortition | Total | Session tx | submitJob tx |
|---|---|---|---|---|---|
| gpt-oss:20b | 1218 | 22.4s | 75.9s | `0x73f4c6599f73...28fdab4` | `0xf766c08b765f...e93d18b` |
| gpt-oss:120b | 1219 | 36.5s | 92.3s | `0x52830b2e824c...1543a657` | `0x3e38bbb6d325...ca85bd9f` |
| glm-4.7-flash | 1220 | 32.5s | 82.8s | `0x2b19324f2562...76dec22d` | `0x0b8072975255...971d9069` |
| llama3-8b | 1221 | 26.5s | 71.6s | `0xd0769d95d21b...c8f7eb99` | `0x34af26fe479a...5f82bb555` |

All on `https://testnet.lightscan.app/tx/<hash>`. Answers, for flavor: gpt-oss:20b introduced
itself as "ChatGPT, built on OpenAI's GPT-4 architecture"; glm-4.7-flash as "a large language
model developed by Z.ai"; llama3-8b called itself "a variant of the BERT architecture", which is
wrong, and a fitting one-line summary of why the network wants the newer models.

Notable: **the consumer gateway's `/api/models` still lists only llama3-8b, yet all four models
worked.** Sortition checks eligibility on-chain, so the protocol path does not depend on the
advertise list at all; only the chat UI's model picker does.

## Open items for the team

1. **Relay streaming from external workers.** Chunks go to the worker's local Redis; the public
   relay never sees them, so browser users get no token stream from external workers (the answer
   still lands on-chain). Either give workers a publishable stream endpoint or make the frontend
   fall back to blob reads.
2. **`/api/models` advertise gap.** Whitelisted models with a live eligible worker still are not
   listed, which keeps them invisible in the chat picker even though the protocol serves them.
3. **Indexer stale state on fast deregister + re-register.** The workers dashboard showed this
   worker as "Deregistered" after a 17-second dereg/re-reg cycle even though it was registered
   on-chain; the second event was never reconciled.
4. **Announcement vs published artifacts.** The 07-14 announcement described the upgrade as
   pending re-audit while the contracts were already live on testnet and the matching worker
   image was published quietly; operators had ~3 days of a registry whose `latest` could not
   serve the live chain.
