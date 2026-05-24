// PM2 process config for the combined Render container.
// .cjs because the rest of the server uses ES modules — PM2 needs CommonJS.
//
// Both apps run inside the same container. Sentiment binds to 127.0.0.1 only,
// so it's not reachable from outside the container — Express talks to it via loopback.
//
// We deliberately don't put REDIS_URL or any secret here — those come from
// Render's dashboard env vars and flow through to Node automatically.

module.exports = {
  apps: [
    {
      name: "sentiment",
      script: "/opt/venv/bin/uvicorn",
      args: "main:app --host 127.0.0.1 --port 5001",
      cwd: "/app/sentiment",
      interpreter: "none",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
    },
    {
      name: "server",
      script: "index.js",
      cwd: "/app/server",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      env: {
        PORT: "8080",
        SENTIMENT_API_URL: "http://127.0.0.1:5001",
      },
    },
  ],
};
