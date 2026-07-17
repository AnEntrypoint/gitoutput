# Stage 1: Install Node dependencies
FROM node:20-slim AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

# Stage 2: Runtime image
FROM node:20-slim

ARG UID=1000
ARG GID=1000

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends git ca-certificates; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN set -eux; \
    groupadd -g "$GID" appuser; \
    useradd -m -u "$UID" -g "$GID" appuser

COPY --from=builder --chown=$UID:$GID /build/node_modules ./node_modules
COPY --chown=$UID:$GID package.json ./
COPY --chown=$UID:$GID src/ ./src/

RUN set -eux; \
    chown -R appuser:appuser /app
USER appuser

ENTRYPOINT ["node", "src/cli.js"]
CMD ["--help"]
