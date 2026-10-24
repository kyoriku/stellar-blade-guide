# Stage 1: Build the client
FROM node:22-alpine AS client-builder
WORKDIR /client
# node:22-alpine bundles npm 10; the dev container, which writes package-lock.json,
# runs npm 11 (not 12: see .devcontainer/devcontainer.json).
RUN npm install -g npm@11
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Run the server
FROM python:3.14-slim
WORKDIR /server

# Install uv, pinned to the version that writes uv.lock. Bump it together with the uv
# feature in .devcontainer/devcontainer.json.
COPY --from=ghcr.io/astral-sh/uv:0.12.21 /uv /usr/local/bin/uv

# Install Python dependencies. uv sync reads .python-version, so it comes in with the lock.
# With downloads off, a pin this image's Python can't meet fails the build instead of
# fetching a Python into /root that appuser can't run. Bump FROM with .python-version.
COPY server/pyproject.toml server/uv.lock server/.python-version ./
RUN UV_PYTHON_DOWNLOADS=never uv sync --locked --no-dev --no-editable

# Copy server code
COPY server/ ./

# Head-tag copy shared by the client build and the server's SPA head injection
COPY client/src/constants/seo.json ../client/src/constants/seo.json

# Copy built client from stage 1
COPY --from=client-builder /client/dist ../client/dist

# Run as non-root user
RUN useradd --no-create-home --shell /bin/false appuser
USER appuser

EXPOSE 8000
# Railway's proxy is the only peer that reaches the container, so its X-Forwarded-For and
# X-Forwarded-Proto are trusted from any address. The flag outranks the FORWARDED_ALLOW_IPS
# and UVICORN_FORWARDED_ALLOW_IPS variables, and the quotes keep sh from globbing the *.
# A custom start command set in Railway would replace this line and drop the trust.
CMD ["/bin/sh", "-c", "/server/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips '*' --workers 2 --limit-max-requests 50000"]