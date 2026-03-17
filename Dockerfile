# Stage 1: Build the client
FROM node:22-alpine AS client-builder
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Run the server
FROM python:3.13-slim
WORKDIR /server

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install Python dependencies
COPY server/pyproject.toml server/uv.lock ./
RUN uv sync --locked --no-dev --no-editable

# Copy server code
COPY server/ ./

# Copy built client from stage 1
COPY --from=client-builder /client/dist ../client/dist

# Run as non-root user
RUN useradd --no-create-home --shell /bin/false appuser
USER appuser

EXPOSE 8000
CMD /server/.venv/bin/uvicorn main:app --host 0.0.0.0 --port $PORT --proxy-headers