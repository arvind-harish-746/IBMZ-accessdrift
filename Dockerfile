# syntax=docker/dockerfile:1

FROM s390x/python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore \
    PORT=8000

WORKDIR /app

# System dependencies needed for native Python package builds.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       build-essential \
       python3-dev \
       pkg-config \
       libssl-dev \
       gfortran \
       libopenblas-dev \
       liblapack-dev \
    && pkg-config --modversion openssl \
    && rm -rf /var/lib/apt/lists/*

# Create an unprivileged application user.
RUN groupadd --system appgroup \
    && useradd --system \
       --gid appgroup \
       --home-dir /app \
       --no-create-home \
       --shell /usr/sbin/nologin \
       appuser

# Keep dependency resolution separate from application source code.
COPY backend/requirements.txt /tmp/requirements.txt

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip setuptools wheel \
    && python -m pip install \
       --prefer-binary \
       -r /tmp/requirements.txt

# Copy application code after dependencies so code changes can reuse
# the expensive dependency-installation layer.
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=60s \
            --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/v1/system/health || exit 1

CMD ["python", "-m", "uvicorn", "backend.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--proxy-headers", \
     "--forwarded-allow-ips=*"]