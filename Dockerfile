# Stage 1: Build the client
FROM node:22-alpine AS client-builder
WORKDIR /client
# Same npm as devcontainer.json and ci.yml; exact because npm 10 runs this install and skips min-release-age
RUN npm install -g npm@11.21.1
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Run the server
FROM python:3.14-slim
WORKDIR /server

# uv: the version that writes uv.lock, same as devcontainer.json and ci.yml. Bump tag and digest
# together; the digest wins (get it from docker buildx imagetools inspect)
# Python downloads off: they'd land in /root, out of appuser's reach. FROM follows .python-version
COPY server/pyproject.toml server/uv.lock server/.python-version ./
RUN --mount=from=ghcr.io/astral-sh/uv:0.12.21@sha256:a7aed3216253ee804de3e2d8afa5073baa1a177335345d43845cd4165e43b711,source=/uv,target=/bin/uv \
    UV_PYTHON_DOWNLOADS=never uv sync --locked --no-dev --no-editable --no-cache --compile-bytecode

COPY server/ ./

# Shared by the client build and the server's SPA head injection
COPY client/src/constants/seo.json ../client/src/constants/seo.json

COPY --from=client-builder /client/dist ../client/dist

RUN useradd --no-create-home --shell /bin/false appuser
USER appuser

# Same as the CMD's ${PORT:-8000} fallback
EXPOSE 8000
# exec: uvicorn runs as PID 1 and gets SIGTERM directly
# --no-proxy-headers: the IP comes from CF-Connecting-IP (app/core/security.py), never X-Forwarded-For
# --ws none, --no-access-log, --log-level info: keep query strings out of uvicorn's logs
# (no route uses WebSockets; the app writes its own access line)
# A custom start command in Railway replaces this line
CMD ["/bin/sh", "-c", "exec /server/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --no-proxy-headers --ws none --no-access-log --log-level info --workers 2 --limit-max-requests 50000"]