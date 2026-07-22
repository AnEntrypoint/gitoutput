# Stage 1: Install Node dependencies
FROM node:20-slim AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

# Stage 2: Runtime image
FROM node:20-slim

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends git ca-certificates; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# node:20-slim already ships a non-root "node" user (uid/gid 1000); reuse it.
COPY --from=builder --chown=node:node /build/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/

RUN mkdir -p /home/node/output && chown node:node /home/node/output

USER node
WORKDIR /home/node/output

ENTRYPOINT ["node", "/app/src/cli.js"]
CMD ["--help"]
