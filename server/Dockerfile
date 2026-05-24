# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---- Stage 2: Production image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
  adduser  --system --uid 1001 express

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Own everything as the non-root user
RUN chown -R express:nodejs /app
USER express

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "index.js"]
