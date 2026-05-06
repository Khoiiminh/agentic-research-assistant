import os
import time
from typing import List

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field


class EmbedRequest(BaseModel):
    texts: List[str] = Field(min_length=1)


class EmbedResponse(BaseModel):
    vectors: List[List[float]]
    dim: int
    model: str
    took_ms: int


app = FastAPI(title="Embedding Sidecar", version="0.1.0")

_model = None
_model_name = os.getenv("MODEL_NAME", "BAAI/bge-m3")
_device = os.getenv("DEVICE", "cpu")
_max_batch_size = int(os.getenv("MAX_BATCH_SIZE", "32"))


def _lazy_load_model():
    global _model
    if _model is not None:
        return _model

    # NOTE: FlagEmbedding provides BGE-M3 reference implementation.
    from FlagEmbedding import BGEM3FlagModel

    _model = BGEM3FlagModel(_model_name, use_fp16=False, device=_device)
    return _model


@app.get("/health")
def health():
    return {"ok": True, "model": _model_name, "device": _device}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    start = time.time()
    model = _lazy_load_model()

    texts = [t.strip() for t in req.texts if t.strip()]
    if not texts:
        return EmbedResponse(vectors=[], dim=0, model=_model_name, took_ms=int((time.time() - start) * 1000))

    vectors: List[List[float]] = []
    for i in range(0, len(texts), _max_batch_size):
        batch = texts[i : i + _max_batch_size]
        out = model.encode(batch, batch_size=len(batch), max_length=8192)

        # BGEM3FlagModel returns dict with 'dense_vecs' among others.
        dense = out["dense_vecs"]
        dense = np.asarray(dense, dtype=np.float32)
        vectors.extend(dense.tolist())

    dim = len(vectors[0]) if vectors else 0
    took_ms = int((time.time() - start) * 1000)
    return EmbedResponse(vectors=vectors, dim=dim, model=_model_name, took_ms=took_ms)
