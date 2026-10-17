# ==============================================================================
# AccessDrift: Zero-Trust Continuous Identity Governance
# Multi-Architecture Dockerfile (Supports linux/amd64 and linux/s390x IBM LinuxONE)
# ==============================================================================

FROM python:3.11-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system dependencies (curl for container healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create a non-privileged user for Zero-Trust enterprise container execution
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app -s /sbin/nologin appuser

# Copy backend requirements first to leverage Docker layer caching
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python production dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend, frontend, dataset, and entrypoint files
COPY backend/ /app/backend/

# Run automated pre-flight security and unit tests during image build
RUN python -m unittest discover -s /app/backend/tests -v

# Change file ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose AccessDrift HTTP port
EXPOSE 8000

# Container healthcheck querying AccessDrift health & memory endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/system/health || exit 1

# Production command (1 worker, lean memory footprint ~50MB RAM)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers", "--forwarded-allow-ips=*"]
