FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Install build deps only in builder layer (keeps runtime slimmer)
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt

# Torch CPU wheels: avoid pulling GPU/CUDA artifacts by mistake
RUN pip install --upgrade pip \
  && pip wheel --wheel-dir /wheels torch==2.7.0 --index-url https://download.pytorch.org/whl/cpu \
  && pip wheel --wheel-dir /wheels -r /app/requirements.txt

FROM python:3.11-slim AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Cache HF models outside the image (mount a volume to /models)
ENV HF_HOME=/models
ENV TRANSFORMERS_CACHE=/models

COPY --from=builder /wheels /wheels
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --no-index --find-links=/wheels torch==2.7.0 \
  && pip install --no-cache-dir --no-index --find-links=/wheels -r /app/requirements.txt

COPY app.py /app/app.py

EXPOSE 8089

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8089"]
