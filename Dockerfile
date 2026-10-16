# ==============================================================================
# AccessDrift: Zero-Trust Continuous Identity Governance
# Multi-arch compatible Dockerfile (x86_64, aarch64, s390x IBM Z)
# ==============================================================================
FROM python:3.11-slim

# Set environment variables for lean execution & security
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Install minimal runtime dependencies (curl for healthchecks)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root system user for zero-trust least privilege execution
RUN groupadd -g 10001 appuser && \
    useradd -u 10001 -g appuser -s /sbin/nologin -d /app appuser

# Set working directory
WORKDIR /app

# Copy dependency specification first to leverage Docker layer caching
COPY backend/requirements.txt ./backend/requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend and frontend source directories
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Run security & cryptographic verification tests at build time
RUN python -m unittest backend/tests/test_backend.py

# Set proper ownership and switch to unprivileged user
RUN chown -R appuser:appuser /app
USER appuser

# Expose web application port
EXPOSE 8000

# Container healthcheck using the system health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/api/v1/system/health || exit 1

# Launch production server with uvicorn
CMD ["uvicorn", "backend.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--proxy-headers", \
     "--forwarded-allow-ips=*", \
     "--log-level", "info", \
     "--timeout-keep-alive", "30"]
