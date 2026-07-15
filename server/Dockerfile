# syntax=docker/dockerfile:1
#
# Build context: server/ directory
#   cd server && docker build -t sopaan-api .
#
# For monorepo lockfile installs from repo root, use /Dockerfile instead:
#   docker build -f Dockerfile -t sopaan-api .

# -----------------------------------------------------------------------------
# Stage 1 — install production dependencies (bcrypt needs native build tools)
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev \
  && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2 — slim runtime image
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

RUN groupadd --gid 1001 sopaan \
  && useradd --uid 1001 --gid sopaan --shell /bin/sh --create-home sopaan

COPY --from=deps --chown=sopaan:sopaan /app/node_modules ./node_modules
COPY --chown=sopaan:sopaan package.json ./
COPY --chown=sopaan:sopaan src ./src
COPY --chown=sopaan:sopaan public ./public

USER sopaan

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "src/index.js"]
