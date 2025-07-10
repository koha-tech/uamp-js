# uamp-js · Universal Agent Messaging Protocol SDK

[![npm](https://img.shields.io/npm/v/uamp-js?color=crimson)](https://www.npmjs.com/package/uamp-js)
[![CI](https://img.shields.io/github/actions/workflow/status/koha-tech/uamp/ci.yml?label=CI\&logo=github)](https://github.com/koha-tech/uamp/actions)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

> **Official TypeScript SDK for [UAMP 1.0](https://github.com/koha-tech/uamp).**
>
> *Zero‑trust messaging & streaming between AI‑agents, LLM tools and robots.*

---

## ✨ Features

* **Strict typings** for `Envelope`, `Delta`, `Manifest` (mirrors JSON Schemas).
* Detached **JWS (ES256)** signing & verification helpers.
* `UAMPClient` with **HTTP/2 + TLS** and automatic **SSE** handling.
* Works in **Node ≥20**; ESM‑first with CJS fallback.
* Ready‑made CLI demo & examples.

---

## 🚀 Quick Start

```bash
npm install uamp-js@1  # stable
# or next‑channel preview
npm install uamp-js@next
```

```ts
import { UAMPClient, generateKeyPairES256 } from 'uamp-js';

const { privateKey } = await generateKeyPairES256();
const client = new UAMPClient({
  baseUrl: 'https://localhost:8443',   // your agent endpoint
  key: privateKey,                    // signing key
  insecureTLS: true                   // dev‑only!
});

await client.send('Ping', 'did:web:worker.example');
```

### Streaming Example

See [`demo-app.ts`](./demo-app.ts) – starts a local agent and streams `progress`/`done` deltas.

---

## 🧩 API Surface

| Helper                      | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `generateKeyPairES256()`    | Create node‑native `CryptoKey` pair (P‑256)    |
| `signEnvelope()`            | Detached JWS signature for an envelope         |
| `verifyEnvelopeSignature()` | Validate `sig` against one or many public keys |
| `UAMPClient.send()`         | POST envelope → returns `stream_id`            |

Full typings live in **`dist/index.d.ts`** (emitted by `tsc`).

---

## 🏗️ Build & Publish

```bash
# build (ES2022 ESM + d.ts)
npm run build   # tsc -p tsconfig.json

# run unit tests (Vitest + MockAgent)
npm test

# publish next RC → npm registry
git tag v1.1.0-rc.0
npm publish --tag next
```

> **Hint for maintainers:** The release GitHub Action auto‑publishes **npm** on semver tag push (`v*`).

### package.json Highlights

```jsonc
{
  "name": "uamp-js",
  "version": "1.1.0-rc.0",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "publishConfig": { "access": "public", "tag": "next" }
}
```

---

## 📝 Contributing

Pull requests are welcome!  Please read [`CONTRIBUTING.md`](https://github.com/koha-tech/uamp/blob/main/CONTRIBUTING.md) and open an issue first for major changes.

---

## ⚖️ License

Code is **Apache 2.0**; the UAMP specification itself is **CC BY 4.0**.

— The **koha‑tech/uamp** team
