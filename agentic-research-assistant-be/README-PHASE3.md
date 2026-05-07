# Phase 3 — LangGraph A2A + AMD ROCm (Track 1)

## Overview

Phase 3 upgrades the research pipeline from a linear RAG chain to a **Multi-Agent A2A architecture** powered by **LangGraph**, running LLM inference on **AMD GPU via vLLM + ROCm**.

### Architecture

```
User → POST /api/research → ResearchService
                                │
                    ┌───────────┴───────────┐
                    │    LangGraph A2A       │
                    │                       │
                    │   ┌─────────────┐     │
                    │   │ Supervisor  │◄────┤
                    │   └──┬──────┬───┘     │
                    │      │      │         │
                    │      ▼      ▼         │
                    │ ┌────────┐ ┌───────┐  │
                    │ │Research│ │Writer │  │
                    │ │  Agent │ │ Agent │  │
                    │ └────────┘ └───────┘  │
                    │    │                  │
                    │    ├── Qdrant Search   │
                    │    ├── Web Search      │
                    │    └── Web Reader      │
                    └───────────────────────┘
                                │
                    vLLM (AMD ROCm GPU)
```

### Agent Roles

| Agent | Responsibility |
|-------|---------------|
| **Supervisor** | Evaluates query & context, routes to Researcher or Writer. Forces Writer after max steps. |
| **Researcher** | Uses tools (Qdrant, Tavily Web Search, Cheerio Web Reader) to gather context. |
| **Writer** | Synthesizes final answer with strict `[chunkId]` citations from gathered context. |

### Safety Mechanisms

1. **Step Counter**: `researchSteps` increments per Researcher invocation. At `maxResearchSteps` (default: 3), Supervisor force-routes to Writer.
2. **Recursion Limit**: LangGraph `recursionLimit: 15` kills the graph if nodes cycle excessively.
3. **Legacy Fallback**: Set `LANGGRAPH_ENABLED=false` to revert to the Phase 2 linear RAG pipeline.

---

## Setup

### 1. Environment Variables

Add to `.env.development`:

```env
# LLM (point to vLLM or any OpenAI-compatible endpoint)
LLM_API_BASE_URL=http://localhost:8000
LLM_MODEL=meta-llama/Llama-3.1-8B-Instruct
LLM_API_KEY=

# LangGraph A2A
LANGGRAPH_ENABLED=true
LANGGRAPH_MAX_RESEARCH_STEPS=3

# Tavily Web Search (get key at https://tavily.com)
TAVILY_API_KEY=tvly-xxxxx
```

### 2. Local Development (No ROCm)

```bash
# Start Qdrant + Embedding sidecar
docker compose up -d qdrant py-embed

# Start backend
cd agentic-research-assistant-be
npm run start:dev

# Test
curl -X POST http://localhost:8080/api/research \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the latest developments in AI?", "topK": 5}'
```

### 3. AMD ROCm Deployment (Track 1)

```bash
# Set your HuggingFace token for gated models
export HF_TOKEN=hf_xxxxx

# Optional: choose model and GPU config
export VLLM_MODEL=meta-llama/Llama-3.1-8B-Instruct
export VLLM_MAX_MODEL_LEN=8192
export VLLM_TP_SIZE=1  # tensor parallelism (increase for multi-GPU)

# Deploy entire stack
docker compose -f docker-compose.rocm.yml up -d

# Monitor GPU
watch -n 1 rocm-smi

# Check vLLM health
curl http://localhost:8000/health

# Test research endpoint
curl -X POST http://localhost:8080/api/research \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain transformer architecture", "topK": 5}'
```

### 4. Demo Evidence for Hackathon

```bash
# Screenshot 1: GPU utilization during inference
rocm-smi --showuse

# Screenshot 2: vLLM serving logs
docker logs research-vllm --tail 50

# Screenshot 3: Backend A2A logs showing agent routing
docker logs research-backend --tail 50
```

---

## File Structure (Phase 3 additions)

```
agentic-research-assistant-be/
├── src/research/
│   ├── graph/
│   │   ├── agent.state.ts           # Shared state schema
│   │   ├── agent.workflow.ts        # StateGraph compilation + runner
│   │   ├── supervisor.agent.ts      # Supervisor routing node
│   │   ├── researcher.agent.ts      # Researcher node (uses tools)
│   │   ├── writer.agent.ts          # Writer synthesis node
│   │   └── tools/
│   │       ├── qdrant-search.tool.ts  # Vector DB search
│   │       ├── web-search.tool.ts     # Tavily real-time web search
│   │       └── web-reader.tool.ts     # Cheerio URL content extraction
│   ├── research.service.ts          # Updated: graph + legacy fallback
│   └── llm/
│       └── openai-compatible-llm.provider.ts  # Enhanced with latency logging
├── prisma/
│   └── schema.prisma                # DRAFT — Postgres schema for Phase 4
docker-compose.rocm.yml              # AMD ROCm full-stack deployment
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| vLLM OOM | Lower `--gpu-memory-utilization` or `--max-model-len` in compose |
| Slow first request | vLLM needs ~60-120s to load model on startup |
| Infinite agent loop | Check `LANGGRAPH_MAX_RESEARCH_STEPS` and `recursionLimit` |
| Web search fails | Ensure `TAVILY_API_KEY` is set and valid |
| Fallback to legacy | Set `LANGGRAPH_ENABLED=false` in env |
