# syntax=docker/dockerfile:1

ARG BASE_IMAGE=s390x/python:3.11-slim-bookworm

# =============================================================================
# Stage 1: Build & Native Compilation Stage
# =============================================================================
FROM ${BASE_IMAGE} AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore

WORKDIR /build

# Install compilation toolchain & headers genuinely required for s390x native builds:
# - build-essential (gcc, g++, make): core C/C++ compilation
# - gfortran: required for SciPy Fortran sources
# - pkg-config: required by Meson/SciPy and for locating OpenBLAS, LAPACK, and OpenSSL
# - libssl-dev: OpenSSL 3.x headers for cryptography
# - libopenblas-dev & liblapack-dev: optimized linear algebra for NumPy & SciPy
# - ninja-build: fast parallel builder used by Meson (SciPy/NumPy)
# - rustc & cargo: required for compiling cryptography from source on s390x (MSRV 1.63.0)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       build-essential \
       python3-dev \
       pkg-config \
       libssl-dev \
       gfortran \
       libopenblas-dev \
       liblapack-dev \
       ninja-build \
       rustc \
       cargo \
    && pkg-config --modversion openssl \
    && rm -rf /var/lib/apt/lists/*

# Create isolated virtual environment for production dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade packaging tools and install meson build backends into the virtual environment
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel meson-python patchelf

# Keep dependency resolution separate from application source code
COPY backend/requirements.txt /tmp/requirements.txt

# Install dependencies into the virtual environment:
# - Mount BuildKit cache for pip to persist compiled wheels across builds
# - Mount Cargo registry cache to avoid re-fetching crates on rebuilds
# - --prefer-binary: pull pre-built wheels if available on s390x (e.g. pydantic-core)
# - Fall back gracefully to native source build for NumPy, SciPy, Pandas, scikit-learn, and cryptography
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=cache,target=/root/.cargo/registry \
    pip install \
       --prefer-binary \
       -r /tmp/requirements.txt

# =============================================================================
# Stage 2: Minimal Hardened Production Runtime Stage
# =============================================================================
FROM ${BASE_IMAGE} AS runner

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install ONLY runtime shared libraries required by the compiled extensions:
# - ca-certificates: TLS verification
# - curl: needed for container HEALTHCHECK
# - libopenblas0 & liblapack3: runtime shared libraries for NumPy & SciPy
# - libgfortran5: runtime Fortran library for SciPy
# - libssl3: OpenSSL 3 runtime for hardware-accelerated crypto / CPACF
# Compilers (gcc, gfortran, rustc, cargo) and -dev headers are deliberately omitted.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       curl \
       libopenblas0 \
       liblapack3 \
       libgfortran5 \
       libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-compiled virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Create an unprivileged application user for Zero-Trust defense in depth
RUN groupadd --system --gid 10001 appgroup \
    && useradd --system \
       --uid 10001 \
       --gid appgroup \
       --home-dir /app \
       --no-create-home \
       --shell /usr/sbin/nologin \
       appuser

# Copy application source code (backend and frontend assets)
COPY --chown=appuser:appgroup backend/ /app/backend/
COPY --chown=appuser:appgroup frontend/ /app/frontend/

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