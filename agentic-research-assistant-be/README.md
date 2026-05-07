<!--
  // --- START MODIFICATION ---
  Polished README styling + quickstart runbook.
  // --- END MODIFICATION ---
-->

<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<h2 align="center">Agentic Research Assistant — Backend</h2>

<p align="center">
  <a href="https://nodejs.org/" target="_blank"><img alt="Node.js" src="https://img.shields.io/badge/node-20%2B-339933?logo=node.js&logoColor=white"></a>
  <a href="https://www.npmjs.com/package/@nestjs/core" target="_blank"><img alt="NestJS" src="https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white"></a>
  <a href="https://www.qdrant.tech/" target="_blank"><img alt="Qdrant" src="https://img.shields.io/badge/qdrant-vector%20db-5B3DF5"></a>
</p>

## Quickstart (dev)

### Prereqs
- Docker Desktop (for Qdrant + embedding sidecar)
- Node.js 20+

### Environment

Backend loads configuration from the repo-root file **`../.env.development`** via `@nestjs/config`.

Minimum required keys:
- **Postgres**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASWORD`, `DB_DATABASE`
- **JWT**: `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- **Qdrant**: `QDRANT_URL`, `QDRANT_COLLECTION`, `QDRANT_VECTOR_SIZE`, `QDRANT_DISTANCE`
- **Embeddings**: `EMBEDDING_PROVIDER`, `EMBED_LOCAL_URL`, `EMBED_REMOTE_URL`, `EMBED_REMOTE_API_KEY`, `EMBEDDING_MODEL`

### 1) Start dependencies (Qdrant + embedding sidecar)

From repo root:

```bash
docker compose up -d qdrant py-embed
```

### 2) Run backend

```bash
cd agentic-research-assistant-be
npm install
npm run start:dev
```

Backend URL (default): `http://localhost:3001` (via `PORT` in repo root `.env.development`).

## Phase 1 (vectors + embeddings)

See `README-PHASE1.md` for:
- API smoke tests (`/api/embeddings`, `/api/vectors/upsert`, `/api/vectors/search`)
- RSS ingestion (`npm run ingest:rss`)
- Qdrant tuning notes (HNSW, quantization, payload indexes)

## Dev/Test vs Demo/Prod (team convention)

// --- START MODIFICATION ---
This repo supports two operational modes. Pick one per environment and keep it consistent:

### Dev/Test (fast iteration, zero external dependencies)
- **Vector DB**: run **local Qdrant** via Docker Compose.
  - `QDRANT_URL=http://localhost:6333`
  - no API key required
- **Embeddings**: run **local embedding sidecar** via Docker Compose.
  - `EMBEDDING_PROVIDER=local`
  - `EMBED_LOCAL_URL=http://localhost:8089`
- **Why**: deterministic, cheap, no network flakiness; safe to experiment with ingest/chunking.

### Demo/Prod (shareable, always-on)
- **Vector DB**: use **Qdrant Cloud**.
  - `QDRANT_URL=https://<cluster>.cloud.qdrant.io`
  - `QDRANT_API_KEY=<required>`
- **Embeddings**:
  - keep `EMBEDDING_PROVIDER=local` (embed on your infra) **or**
  - switch to remote: `EMBEDDING_PROVIDER=remote` + `EMBED_REMOTE_URL` (OpenAI-compatible `/v1/embeddings`)
- **Why**: stable endpoint for demo, multi-user, production-like reliability.

Operational rule: **do not mix embedding models** between environments for the same collection.
If you switch embedding provider/model, rotate to a new `QDRANT_COLLECTION` and re-ingest.
// --- END MODIFICATION ---

## Scripts

```bash
npm run build
npm run lint
npm run test
```
