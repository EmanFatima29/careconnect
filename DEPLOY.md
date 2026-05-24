# CareConnect — Deployment Guide

## Architecture

| Layer | Service | Notes |
|-------|---------|-------|
| Client (Next.js) | Vercel | Auto-deploy on push to `main` |
| Server (Express + Python sentiment) | Render | Docker image, free Web Service |
| Database | MongoDB Atlas | Existing cluster `cluster0.sskffuf` |
| Cache | Redis | Set `DISABLE_REDIS=true` to skip, or use Upstash |
| Media | Cloudinary | Existing `geoconnect` account |

---

## Step 1 — Push to GitHub

```bash
cd /path/to/careconnect
git add .
git commit -m "feat: complete CareConnect implementation"
git push origin main
```

> `.env` and `.env.local` are gitignored — secrets stay on your machine and go into dashboards only.

---

## Step 2 — Deploy Server on Render

### 2a. Create account & connect repo
1. Sign up at [render.com](https://render.com) with a new account.
2. Dashboard → **New → Blueprint** → Connect your GitHub repo.
3. Render detects `render.yaml` and pre-fills service configuration.

### 2b. Fill in secrets
In the Render dashboard for `careconnect-api`, go to **Environment** and fill in the `sync: false` variables. See your `server/.env` and `client/.env.local` for the actual values.

Key variables to set:

| Variable | Source |
|----------|--------|
| `MONGODB_URI` | `server/.env` → `MONGODB_URI` (Atlas URI) |
| `NEXTAUTH_SECRET` | `client/.env.local` → `NEXTAUTH_SECRET` |
| `INTERNAL_API_KEY` | `client/.env.local` → `INTERNAL_API_KEY` |
| `ORIGIN_URL` | Set after Step 3 — your Vercel URL |
| `REDIS_URL` | Leave empty; set `DISABLE_REDIS=true` until you add Upstash |
| `CLOUDINARY_API_KEY` | `server/.env` → `CLOUDINARY_API_KEY` |
| `CLOUDINARY_API_SECRET` | `server/.env` → `CLOUDINARY_API_SECRET` |
| `SMTP_USER` | `server/.env` → `SMTP_USER` |
| `SMTP_PASS` | `server/.env` → `SMTP_PASS` |
| `VAPID_PUBLIC_KEY` | `server/.env` → `VAPID_PUBLIC_KEY` |
| `VAPID_PRIVATE_KEY` | `server/.env` → `VAPID_PRIVATE_KEY` |

### 2c. Deploy
Click **Save & Deploy**. First build takes 5–10 minutes.

Note your Render URL: `https://careconnect-api.onrender.com`

### 2d. Verify health
```
GET https://careconnect-api.onrender.com/health
→ { "status": "ok", "db": "connected" }
```

---

## Step 3 — Deploy Client on Vercel

### 3a. Create account & connect repo
1. Sign up at [vercel.com](https://vercel.com) with a new account.
2. Dashboard → **Add New → Project** → Import your GitHub repo.
3. Set **Root Directory** to `client`.
4. Framework auto-detected as **Next.js**.

### 3b. Fill in environment variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://careconnect-api.onrender.com` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://careconnect-api.onrender.com` |
| `NEXTAUTH_URL` | `https://<your-vercel-project>.vercel.app` |
| `NEXTAUTH_SECRET` | `client/.env.local` → `NEXTAUTH_SECRET` |
| `GOOGLE_CLIENT_ID` | `client/.env.local` → `GOOGLE_CLIENT_ID` |
| `GOOGLE_CLIENT_SECRET` | `client/.env.local` → `GOOGLE_CLIENT_SECRET` |
| `FACEBOOK_CLIENT_ID` | `client/.env.local` → `FACEBOOK_CLIENT_ID` |
| `FACEBOOK_CLIENT_SECRET` | `client/.env.local` → `FACEBOOK_CLIENT_SECRET` |
| `INTERNAL_API_KEY` | `client/.env.local` → `INTERNAL_API_KEY` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `geoconnect` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `geoconnect_uploads` |

### 3c. Deploy
Click **Deploy**. Build takes 2–4 minutes.

Note your Vercel URL: `https://<your-project>.vercel.app`

---

## Step 4 — Wire URLs together

Go back to Render → `careconnect-api` → Environment:
- Set `ORIGIN_URL` = `https://<your-project>.vercel.app`
- Click **Save Changes** → Render redeploys automatically.

---

## Step 5 — Update OAuth Redirect URIs

### Google
1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth client.
2. **Authorized redirect URIs** → add:
   ```
   https://<your-project>.vercel.app/api/auth/callback/google
   ```
3. **Authorized JavaScript origins** → add:
   ```
   https://<your-project>.vercel.app
   ```

### Facebook
1. [developers.facebook.com](https://developers.facebook.com) → App → Facebook Login → Settings.
2. **Valid OAuth Redirect URIs** → add:
   ```
   https://<your-project>.vercel.app/api/auth/callback/facebook
   ```

---

## Free Tier Notes

- **Render free**: spins down after 15 min of inactivity — first cold-start request takes ~30s.
- **Vercel hobby**: unlimited deployments, 100 GB bandwidth/month.
- **MongoDB Atlas free**: 512 MB storage.
- **Redis**: disabled by default (`DISABLE_REDIS=true`). Add Upstash later for caching.
