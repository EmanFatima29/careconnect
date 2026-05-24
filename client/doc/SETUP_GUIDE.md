# CareConnect — Project Setup Guide

> Step-by-step guide to set up and run the CareConnect platform locally.
> **Last Updated**: 2026-03-27

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Detailed Setup](#3-detailed-setup)
4. [Environment Variables](#4-environment-variables)
5. [Running the Application](#5-running-the-application)
6. [Sentiment Microservice Setup](#6-sentiment-microservice-setup)
7. [Third-Party Service Configuration](#7-third-party-service-configuration)
8. [Troubleshooting](#8-troubleshooting)
9. [Development Workflow](#9-development-workflow)

---

## 1. Prerequisites

### Required Software

| Software    | Version        | Purpose                                 |
| ----------- | -------------- | --------------------------------------- |
| **Node.js** | 18.x or higher | JavaScript runtime                      |
| **npm**     | 9.x or higher  | Package manager                         |
| **MongoDB** | 6.x or higher  | Database (or use Docker)                |
| **Redis**   | 7.x or higher  | Caching & rate limiting (or use Docker) |
| **Python**  | 3.10+          | Sentiment analysis microservice         |
| **Git**     | Any            | Version control                         |

### Optional Software

| Software    | Purpose                                                      |
| ----------- | ------------------------------------------------------------ |
| **Docker**  | Run MongoDB/Redis in containers                              |
| **Nodemon** | Auto-restart server on file changes (included as dependency) |

### Verify Installation

```bash
node --version    # Should be >= 18.0.0
npm --version     # Should be >= 9.0.0
mongod --version  # or: docker ps (if using Docker)
redis-server --version
python3 --version # Should be >= 3.10
```

---

## 2. Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd map_and_chat

# 2. Start infrastructure (MongoDB + Redis)
# Option A: If installed locally
mongod &
redis-server &

# Option B: Using Docker
docker run -d --name mongo -p 27017:27017 mongo
docker run -d --name redis -p 6379:6379 redis

# 3. Setup server
cd server
cp example.env.example .env    # Edit with your values
npm install

# 4. Setup client
cd ../client
cp example.env.example .env.local    # Edit with your values
npm install

# 5. Setup sentiment microservice (optional)
cd ../server/sentiment
chmod +x setup.sh
./setup.sh
source venv/bin/activate
# 6. Start everything (3 terminals)
# Terminal 1: Server
cd server && npm run dev

# Terminal 2: Client
cd client && npm run dev

# Terminal 3: Sentiment (optional)
cd server/sentiment && source venv/bin/activate && python main.py
```

Open `http://localhost:3000` in your browser.

---

## 3. Detailed Setup

### 3.1 MongoDB Setup

**Local Installation:**

```bash
# Ubuntu/Debian
sudo apt install mongodb-org
sudo systemctl start mongod

# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Docker:**

```bash
docker run -d \
  --name careconnect-mongo \
  -p 27017:27017 \
  -v careconnect-mongo-data:/data/db \
  mongo:7
```

Verify: `mongosh --eval "db.runCommand({ ping: 1 })"`

### 3.2 Redis Setup

**Local Installation:**

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# macOS (Homebrew)
brew install redis
brew services start redis
```

**Docker:**

```bash
docker run -d \
  --name careconnect-redis \
  -p 6379:6379 \
  redis:7-alpine
```

Verify: `redis-cli ping` (should return `PONG`)

### 3.3 Server Setup

```bash
cd server
cp example.env.example .env
npm install
```

Edit `.env` with your values (see [Environment Variables](#4-environment-variables)).

### 3.4 Client Setup

```bash
cd client
cp example.env.example .env.local
npm install
```

Edit `.env.local` with your values.

**Important**: `NEXTAUTH_SECRET` and `INTERNAL_API_KEY` must match between server `.env` and client `.env.local`.

---

## 4. Environment Variables

### Server `.env`

```bash
# ====== REQUIRED ======
MONGODB_URI=mongodb://localhost:27017/careconnect
NEXTAUTH_SECRET=your-32-char-secret-here          # Generate: openssl rand -hex 16
PORT=8080

# Internal API key for NextAuth ↔ Express communication
INTERNAL_API_KEY=your-64-char-key-here             # Generate: openssl rand -hex 32

# ====== OAUTH (required for social login) ======
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# ====== INFRASTRUCTURE ======
NODE_ENV=development
ORIGIN_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379

# ====== CLOUDINARY (required for media uploads) ======
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ====== EMAIL (optional — falls back to Ethereal test account) ======
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="CareConnect" <noreply@careconnect.app>

# ====== ELEVENLABS (optional — for STT/TTS) ======
ELEVENLABS_API_KEY=

# ====== WEB PUSH (optional — for push notifications) ======
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@careconnect.app
# Generate VAPID keys: npx web-push generate-vapid-keys

# ====== SENTIMENT MICROSERVICE ======
SENTIMENT_API_URL=http://localhost:5001
```

### Client `.env.local`

```bash
# ====== REQUIRED ======
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32-char-secret-here           # MUST match server
INTERNAL_API_KEY=your-64-char-key-here              # MUST match server

# Backend connection
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080

# ====== OAUTH ======
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# ====== CLOUDINARY (for client-side upload preview) ======
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=careconnect
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=careconnect_uploads

# ====== WEATHER ======
OPENWEATHER_API_KEY=your-32-char-openweathermap-key
```

### Generating Secrets

```bash
# NEXTAUTH_SECRET (32 hex chars)
openssl rand -hex 16

# INTERNAL_API_KEY (64 hex chars)
openssl rand -hex 32

# VAPID keys
npx web-push generate-vapid-keys
```

---

## 5. Running the Application

### Development Mode

You need **3 terminal windows** (or use a process manager):

**Terminal 1 — Express Server:**

```bash
cd server
npm run dev
# Server starts on http://localhost:8080
# Health check: curl http://localhost:8080/health
```

**Terminal 2 — Next.js Client:**

```bash
cd client
npm run dev
# Client starts on http://localhost:3000
```

**Terminal 3 — Sentiment Microservice (Optional):**

```bash
cd server/sentiment
source venv/bin/activate
python main.py
# API starts on http://localhost:5001
# Docs: http://localhost:5001/docs
```

### Production Mode

```bash
# Server
cd server
NODE_ENV=production node index.js

# Client
cd client
npm run build
npm start
```

### Verify Everything is Running

```bash
# Check server health (should show db: connected, redis: connected)
curl http://localhost:8080/health

# Check sentiment service
curl http://localhost:5001/health

# Check client
open http://localhost:3000
```

---

## 6. Sentiment Microservice Setup

The sentiment analysis runs as a separate Python FastAPI service.

### Automated Setup

```bash
cd server/sentiment
chmod +x setup.sh
./setup.sh
```

This will:

1. Create a Python virtual environment
2. Install all dependencies (FastAPI, spaCy, TextBlob, langdetect)
3. Download the spaCy `en_core_web_sm` model
4. Download TextBlob corpora

### Manual Setup

```bash
cd server/sentiment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m textblob.download_corpora
```

### Running

```bash
cd server/sentiment
source venv/bin/activate
python main.py
# API available at http://localhost:5001
# Swagger docs at http://localhost:5001/docs
```

### Supported Languages

English, Urdu, Hindi, Bengali, Pashto, Chinese, French, German, Italian, Japanese, Korean, Russian, Spanish, Swedish, Turkish

### Testing

```bash
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a great day!", "language": "en"}'
# Expected: {"score": 0.8, "label": "positive", "language": "english", "confidence": 0.68}
```

---

## 7. Third-Party Service Configuration

### 7.1 Cloudinary

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Create an **Upload Preset** (Settings → Upload → Add upload preset)
   - Name: `careconnect_uploads`
   - Signing Mode: Unsigned (for client-side uploads)
4. Add to server `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
5. Add to client `.env.local`:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=careconnect_uploads
   ```

### 7.2 Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add Client ID and Secret to both `.env` and `.env.local`

### 7.3 Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create app → Facebook Login → Settings
3. Valid OAuth redirect URI: `http://localhost:3000/api/auth/callback/facebook`
4. Add App ID and Secret to both `.env` and `.env.local`

### 7.4 OpenWeatherMap

1. Create account at [openweathermap.org](https://openweathermap.org)
2. Go to API Keys → copy your 32-character API key
3. Add to client `.env.local`: `OPENWEATHER_API_KEY=your-key`

### 7.5 ElevenLabs (Speech)

1. Create account at [elevenlabs.io](https://elevenlabs.io)
2. Go to Profile → API Key → copy
3. Add to server `.env`: `ELEVENLABS_API_KEY=your-key`

### 7.6 Prescription Analysis Service

No API key needed — the service is free. The integration calls `https://agentcrop.com/api/detect` directly.

### 7.7 Sentinel GreenReport Plus (Diagnostic)

No API key needed — free public service from University of Kansas. The integration calls their public API endpoints.

---

## 8. Troubleshooting

### Common Issues

#### `ECONNREFUSED` to MongoDB

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Fix**: Start MongoDB: `mongod` or `docker start careconnect-mongo`

#### `ECONNREFUSED` to Redis

```
[Redis] Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Fix**: Start Redis: `redis-server` or `docker start careconnect-redis`
**Note**: The app still works without Redis — rate limiter fails open.

#### CSRF 403 on First POST Request

```
{ "error": "CSRF token validation failed" }
```

**Fix**: This is auto-handled by the axios interceptor (retries after GET /health). If persisting, clear cookies and refresh.

#### Socket Authentication Error

```
[Socket] Connection error: Authentication error
```

**Fix**: Ensure `NEXTAUTH_SECRET` matches between client and server. Clear browser session and re-login.

#### OpenWeatherMap 401

```
Invalid API key. Please see https://openweathermap.org/faq#error401
```

**Fix**: Verify your `OPENWEATHER_API_KEY` in `.env.local` is exactly 32 hex characters. New keys take up to 2 hours to activate.

#### Sentiment Service Not Responding

```
Sentiment analysis unavailable
```

**Fix**: Start the Python service: `cd server/sentiment && source venv/bin/activate && python main.py`

#### `Cannot find module` Errors

```
Error [ERR_MODULE_NOT_FOUND]
```

**Fix**: Run `npm install` in the appropriate directory (client/ or server/).

#### Port Already in Use

```
Error: listen EADDRINUSE :::8080
```

**Fix**: Kill the process: `lsof -ti:8080 | xargs kill -9`

### Health Checks

```bash
# Full system health
curl http://localhost:8080/health
# Expected: { "status": "ok", "db": "connected", "redis": "connected" }

# Sentiment service
curl http://localhost:5001/health
# Expected: { "status": "ok", "spacy_loaded": true }

# Redis
redis-cli ping
# Expected: PONG

# MongoDB
mongosh --eval "db.runCommand({ ping: 1 })"
# Expected: { ok: 1 }
```

---

## 9. Development Workflow

### Project Scripts

**Server:**

```bash
npm run dev    # Start with nodemon (auto-restart on changes)
npm start      # Start without auto-restart (production)
```

**Client:**

```bash
npm run dev    # Start Next.js dev server with hot reload
npm run build  # Production build
npm start      # Start production server
```

### Database Seeding

The application creates data through its UI. First user to register becomes the base. To create an admin:

```bash
# Connect to MongoDB and update a user's role
mongosh careconnect --eval 'db.users.updateOne({ email: "admin@example.com" }, { $set: { roles: "superadmin" } })'
```

### File Structure Conventions

| Directory                        | Convention                                             |
| -------------------------------- | ------------------------------------------------------ |
| `server/src/routes/*.js`         | One file per resource, exports Express Router          |
| `server/src/controllers/*.js`    | One file per resource, exports async handler functions |
| `server/src/services/*.js`       | Business logic, external API integrations              |
| `server/src/models/*.js`         | Mongoose schemas with indexes                          |
| `server/src/middleware/*.js`     | Express middleware functions                           |
| `client/src/app/*/page.js`       | Next.js App Router pages                               |
| `client/src/components/*/`       | Feature-grouped React components                       |
| `client/src/utils/redux/`        | Redux slices and store                                 |
| `client/src/utils/redux/thunks/` | Async thunks per resource                              |
| `client/src/lib/`                | Singleton utilities (axios, socket, cache, logger)     |

### API Testing

The sentiment microservice has built-in Swagger docs at `http://localhost:5001/docs`.

For Express endpoints, use any REST client (Postman, Insomnia, curl):

```bash
# Login and get token
# (Use the browser to login at localhost:3000, then extract the JWT from the session cookie)

# Test an authenticated endpoint
curl -H "Authorization: Bearer <JWT>" http://localhost:8080/api/users/profile
```

---

_For system architecture details, see [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md). For API endpoint details, see [API_REFERENCE.md](./API_REFERENCE.md)._
