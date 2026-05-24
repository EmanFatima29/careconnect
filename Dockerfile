# Render combined backend image:
#   - Express API (port 8080, public)
#   - Python FastAPI sentiment service (port 5001, loopback only)
#   - PM2 supervises both processes; if either dies, PM2 restarts it
# Redis is external (Upstash) — REDIS_URL is injected via Render env vars.

FROM node:20-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    NODE_ENV=production

# System deps: Python, build tools (for any wheels that need compiling), curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-pip python3-venv \
      build-essential \
      curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# PM2 process manager (runtime variant for containers)
RUN npm install -g pm2@latest

# ---- Node app ----
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev
COPY server/ ./
# Strip the nested .git that exists inside server/ — not needed in image
RUN rm -rf .git

# ---- Python sentiment app ----
WORKDIR /app/sentiment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY server/sentiment/requirements.txt ./
RUN pip install --upgrade pip \
 && pip install -r requirements.txt \
 && python -m spacy download en_core_web_sm \
 && python -m textblob.download_corpora
COPY server/sentiment/main.py ./

# ---- PM2 ecosystem ----
WORKDIR /app
COPY ecosystem.config.cjs ./

EXPOSE 8080

# pm2-runtime stays in the foreground (unlike `pm2 start`), exits if children die,
# and forwards logs to stdout/stderr — exactly what container orchestrators want.
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
