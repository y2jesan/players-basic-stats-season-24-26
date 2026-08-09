# Stage 1: build the frontend
FROM node:20-slim AS frontend-build
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: backend runtime, serving the built frontend
FROM python:3.14-slim AS runtime
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY backend/pyproject.toml backend/uv.lock /app/backend/
RUN cd /app/backend && uv sync --frozen --no-dev
COPY backend/ /app/backend/
COPY --from=frontend-build /src/frontend/dist /app/frontend/dist
WORKDIR /app/backend
EXPOSE 8000
CMD ["sh", "-c", ".venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
