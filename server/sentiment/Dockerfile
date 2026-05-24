FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip \
 && pip install -r requirements.txt \
 && python -m spacy download en_core_web_sm \
 && python -m textblob.download_corpora

COPY main.py ./

RUN groupadd --system --gid 1001 sentiment \
 && useradd  --system --uid 1001 --gid sentiment sentiment \
 && chown -R sentiment:sentiment /app
USER sentiment

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:5001/health').status==200 else 1)"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]
