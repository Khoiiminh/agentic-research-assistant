# Phase 1 (Vectors + Embeddings) Runbook

## Prereqs
- Docker Desktop
- Node.js 20+

## Start services

From repo root:

```bash
docker compose up -d qdrant py-embed
```

## Dev/Test vs Demo/Prod (Qdrant)

// --- START MODIFICATION ---
For **Dev/Test**, the recommended setup is **local Qdrant** (Docker) so ingest + schema changes are fast and deterministic:

- `QDRANT_URL=http://localhost:6333`
- no `QDRANT_API_KEY`

For **Demo/Prod**, point to **Qdrant Cloud**:

- `QDRANT_URL=https://<cluster>.cloud.qdrant.io`
- `QDRANT_API_KEY=<required>`

Important: if you change the embedding model/provider, rotate to a new `QDRANT_COLLECTION` and re-ingest (embedding space mismatch).
// --- END MODIFICATION ---

## Start backend

```bash
cd agentic-research-assistant-be
npm install
npm run start:dev
```

Backend listens on `PORT` (default: `3001` via repo root `.env.development`).

## Qdrant tuning (`.env.development`)

| Variable | Role |
|----------|------|
| `QDRANT_DISTANCE` | Default `Cosine` (typical for NLP / research embeddings). |
| `QDRANT_UPSERT_WAIT` | `true` = wait for disk/index; `false` = higher ingest throughput. |
| `QDRANT_HNSW_*` | Graph index params (applied **only when the collection is first created**). |
| `QDRANT_SCALAR_QUANTIZATION=int8` | Optional scalar quantization on **new** collections. |

After changing HNSW/quantization, **recreate the collection** (or new `QDRANT_COLLECTION` name) so settings apply.

On startup, the backend ensures **payload indexes** on `category`, `source`, `credibilityWeight`, and `text` (for full-text match filters).

## Smoke tests

### 1) Embeddings

```bash
curl -X POST http://localhost:3001/api/embeddings ^
  -H "Content-Type: application/json" ^
  -d "{\"texts\":[\"hello world\"]}"
```

Expected: JSON with `dim` = `1024` (BGE-M3 dense embeddings).

### 2) Vector upsert

```bash
curl -X POST http://localhost:3001/api/vectors/upsert ^
  -H "Content-Type: application/json" ^
  -d "{\"points\":[{\"id\":\"p1\",\"vector\":[0.1,0.2,0.3],\"payload\":{\"source\":\"manual\",\"url\":\"https://example.com\",\"title\":\"Example\",\"publishedAt\":\"\",\"chunkId\":\"manual:1\",\"text\":\"hello\"}}]}"
```

Note: the vector length must match `QDRANT_VECTOR_SIZE`.

### 3) Vector search

```bash
curl -X POST http://localhost:3001/api/vectors/search ^
  -H "Content-Type: application/json" ^
  -d "{\"vector\":[0.1,0.2,0.3],\"topK\":3}"
```

Optional body fields (metadata + hybrid-style constraint):

- `category`, `source`, `minCredibility` (0–1): built into a Qdrant `filter` (indexed fields).
- `matchText`: full-text match on payload `text` (requires payload text index).
- `applyCredibilityBoost`: `true` — post-sort blend `score * (0.55 + 0.45 * credibilityWeight)`; original cosine score returned as `scoreVector` on each hit.

This is **vector search with optional text constraint**, not full dense+sparse RRF (that would need sparse vectors or Qdrant universal query fusion).

## RSS ingest (minimal)

```bash
cd agentic-research-assistant-be
npm run ingest:rss
```

This will:
- fetch RSS sources in `src/ingest/sources.ts` (concurrent fetches; override with `INGEST_RSS_CONCURRENCY`)
- clean HTML via **cheerio**, chunk with **recursive-character** splitting (sentence / newline aware)
- **idempotency**: stable point id per `(source, url, chunkIndex)`; `retrieve` + `payload.hash_content` — unchanged chunks skip embed
- embed in batches (`INGEST_EMBED_BATCH`, default `128`) via `EMBEDDING_PROVIDER`
- upsert in batches (`INGEST_UPSERT_BATCH`, default `64`), **parallel** upsert batches (`INGEST_UPSERT_PARALLEL`, default `3`) into `QDRANT_COLLECTION`

Payload includes `category`, `domain`, `credibilityWeight`, optional `expiredAt` (pubDate + 30d) for filtering / ranking later.

**Note:** point ids are **UUID-shaped** strings derived from a stable key (Qdrant-friendly). If you ingested with an older hex-id format, recreate the collection or expect duplicate logical rows until you flush.

## Switching to remote embeddings

Set in repo root `.env.development`:

```
EMBEDDING_PROVIDER=remote
EMBED_REMOTE_URL=<openai-compatible /v1/embeddings endpoint>
EMBED_REMOTE_API_KEY=<optional>
```

## Phase 2 — RAG API (`/api/research`)

### Configure LLM (OpenAI-compatible)

Set in repo root `.env.development`:

```
LLM_API_BASE_URL=http://localhost:8000
LLM_MODEL=<model-name>
LLM_API_KEY=
LLM_MAX_TOKENS=512
LLM_CONTEXT_WINDOW_TOKENS=8192
```

### Rate limit (public endpoint)

```
RESEARCH_RATE_TTL_SECONDS=60
RESEARCH_RATE_LIMIT=5
```

### Request / Response

```bash
curl -X POST http://localhost:3001/api/research ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"What happened in AI this week?\",\"topK\":5,\"applyCredibilityBoost\":true}"
```

Response fields:
- `answer`: LLM answer with citations in format `[chunkId]` (strictly validated)
- `sources[]`: stable mapping by `chunkId` (frontend renders URL/title from backend)
- `isExtractiveFallback=true`: when LLM is unavailable (snippets shown instead)

Context window policy:
- no truncation inside chunks
- drop whole low-score chunks until within token budget (heuristic: \(tokens \\approx chars/4\))

