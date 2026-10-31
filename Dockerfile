# Stage 1: Build the client
FROM node:22-alpine AS client-builder
WORKDIR /client
# Match npm in .devcontainer/devcontainer.json and ci.yml (11, not 12); bump all three together
RUN npm install -g npm@11
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Run the server
FROM python:3.14-slim
WORKDIR /server

# uv pinned to uv.lock's writer; bump with devcontainer.json and ci.yml's setup-uv version + checksum
COPY --from=ghcr.io/astral-sh/uv:0.12.21 /uv /usr/local/bin/uv

# No Python downloads (they'd land in /root, unusable by appuser); bump FROM with .python-version
COPY server/pyproject.toml server/uv.lock server/.python-version ./
RUN UV_PYTHON_DOWNLOADS=never uv sync --locked --no-dev --no-editable

COPY server/ ./

# Shared by the client build and the server's SPA head injection
COPY client/src/constants/seo.json ../client/src/constants/seo.json

COPY --from=client-builder /client/dist ../client/dist

RUN useradd --no-create-home --shell /bin/false appuser
USER appuser

# Matches the ${PORT:-8000} fallback in CMD (for docker run/kind); change both together
EXPOSE 8000
# exec makes uvicorn PID 1 so it gets the SIGTERM directly; a shell as PID 1 won't forward it
# --no-proxy-headers so no env var can turn trust on; IP comes from CF-Connecting-IP (app/core/security.py)
# --ws none: no route takes a WebSocket, and uvicorn's handshake line logs the query string as sent;
# an upgrade is now served as plain HTTP with two fixed warnings (the "No supported WebSocket
# library detected" hint is expected)
# --no-access-log: the app writes its own access line (app/middleware/logging.py), and uvicorn's
# would hold each query string as sent
# A custom start command set in Railway replaces this line
CMD ["/bin/sh", "-c", "exec /server/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --no-proxy-headers --ws none --no-access-log --workers 2 --limit-max-requests 50000"]