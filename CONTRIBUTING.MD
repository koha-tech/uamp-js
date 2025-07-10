# Contributing to UAMP

Thanks for your interest in improving the **Universal Agent Messaging Protocol**!  This guide covers both repositories:

* **koha-tech/uamp** – the specification & reference implementations (monorepo).
* **koha-tech/uamp-js** – the standalone TypeScript SDK published to npm.

> **TL;DR** – Fork ➜ Branch ➜ Lint/Tests ➜ PR ➜ Review ➜ Merge.

---

## 1. Code of Conduct

We follow the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

---

## 2. Getting Started

### 2.1 Fork & Clone

```bash
git clone https://github.com/<your-user>/uamp.git
cd uamp   # or uamp-js
```

### 2.2 Branch Naming

* **Spec or docs** – `docs/<topic>`
* **Feature** – `feat/<short-desc>`
* **Bug fix** – `fix/<issue#>`

---

## 3. Development Workflow

### 3.1 Install Toolchain

* **Node ≥ 20** + pnpm / npm.
* **Python ≥ 3.12** *(root repo only)*.

```bash
# root repo (monorepo) – installs JS + Python deps
pnpm install  &&  pip install -r reference-impl/python/requirements.txt

# SDK repo
npm ci
```

### 3.2 Lint & Tests

* **ESLint** – `npm run lint`
* **Vitest** – `npm test` *(JS)*
* **Pytest** – `pytest` *(Python ref impl)*

All checks **must pass** before a PR will be reviewed.

### 3.3 Conventional Commits

Commit messages should follow the pattern:

```
<type>(scope): summary
```

Example:

```
feat(spec): add WebSocket frame length clarification
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

---

## 4. Updating the Spec

1. Edit `spec/uamp-1.0.md`.
2. Update matching JSON Schema in `spec/schema/`.
3. Provide an example message in `examples/` **and** a test in `conformance/tests/`.
4. Add an entry to `spec/changelog.md`.

> **Breaking changes** require an RFC discussion in an issue before PR.

---

## 5. Publishing npm (maintainers only)

1. `npm version <minor|patch>` – this tags `vX.Y.Z`.
2. Push – GitHub Action builds & publishes with provenance.
3. For release candidates: `npm version --preid rc prerelease` & `npm publish --tag next`.

---

## 6. Issue Tracker Etiquette

* Search existing issues first.
* One problem per ticket.
* Provide **repro steps**, logs and **version** info.

Labels: `bug`, `spec`, `enhancement`, `good first issue`, `discussion`.

---

## 7. Community Calls & Chat

* Monthly public call (Zoom) – agenda in Discussions tab.
* Discord: **#uamp-dev**.
* Twitter: [`@UAMP_project`](https://twitter.com/UAMP_project).

---

## 8. Licensing

By contributing you agree that your work is licensed under:

* **Code** – Apache‑2.0
* **Spec / Docs** – CC BY 4.0

A Developer Certificate of Origin (DCO) sign‑off (`-s` flag to `git commit`) is required.

---

## 9. Thank You!

Your contributions make UAMP better for everyone 🙏
