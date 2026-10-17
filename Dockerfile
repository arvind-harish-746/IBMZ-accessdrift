# syntax=docker/dockerfile:1

# AccessDrift - IBM LinuxONE / IBM Z deployment
# Build and run natively on the target architecture.

FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

WORKDIR /app

# Install only the system tools needed for deployment and diagnostics.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       curl \
       ca-certificates \
       build-essential \
       python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create an unprivileged application user.
RUN groupadd --system appgroup \
    && useradd --system \
       --gid appgroup \
       --home-dir /app \
       --no-create-home \
       --shell /usr/sbin/nologin \
       appuser

# Install dependencies independently for better build caching.
COPY backend/requirements.txt /tmp/requirements.txt

RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel \
    && python -m pip install \
       --no-cache-dir \
       -r /tmp/requirements.txt

# Copy backend and frontend.
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Keep application files readable by the non-root user.
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Health endpoint defined by the AccessDrift FastAPI application.
HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=60s \
            --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/v1/system/health || exit 1

# Single worker to limit memory use on the initial cloud instance.
CMD ["python", "-m", "uvicorn", "backend.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--proxy-headers", \
     "--forwarded-allow-ips=*"]