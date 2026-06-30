# LightChain AI - Model Expansion Research

Independent research for the LightChain AI worker network. This is a standalone research folder, separate from the lightchallenge project.

## Contents

- **lightchain-ai-model-expansion-2026-06.md** - the full report. Recommends 10 open models to add to the network (coding, document understanding, search, images, music, video), written in plain English, with per-model dossiers, infrastructure requirements, a White Model Week submission table, and a technical appendix (validated keccak256 modelIds and suggested LCAI fees).
- **lightchain-ai-model-expansion-onepager.md** - a short summary for Discord or a DAO proposal (no hashes or contract detail).
- **verify-model-expansion.mjs** - the verification test suite (39 assertions: every registration hash, the registration-name to Ollama-pull mapping, the worker spec and time limit, and a live read of the mainnet fee contract). Last run: 39/39 passing.

## Running the tests

```
npm install
npm test
```

It recomputes every hash in the report, confirms them against the live network's existing entries, checks the registration-name to Ollama-pull mapping and the worker spec, and reads the real mainnet contract to confirm the fee anchors (llama3-8b = 0.02 LCAI, llama3-70b = 0.15 LCAI). Last run: 39/39 passing.

The same suite runs automatically on GitHub (Actions workflow `verify`) on every push to `main`, and can be triggered manually from the Actions tab.

Last updated 2026-06-30.
