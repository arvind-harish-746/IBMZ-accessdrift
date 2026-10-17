
# ==============================================================================
# AccessDrift: Zero-Trust Continuous Identity Governance
# Multi-Architecture: linux/amd64 and linux/s390x (IBM LinuxONE)
# ==============================================================================

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System dependencies for Python packages, scientific computing and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    gfortran \
    pkg-config \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Run as a non-root user
RUN groupadd -r appgroup && \
    useradd -r -g appgroup -d /app -s /usr/sbin/nologin appuser

# Install Python dependencies first for layer caching
COPY backend/requirements.txt /app/backend/requirements.txt

RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel && \
    python -m pip install --no-cache-dir -r /app/backend/requirements.txt

# Application source and static frontend
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Pre-flight unit tests
RUN python -m unittest discover -s /app/backend/tests -v

# Ensure the application can write to its working directory if required
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/v1/system/health || exit 1

# Start FastAPI; the frontend is served by the backend
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers", "--forwarded-allow-ips=*"]