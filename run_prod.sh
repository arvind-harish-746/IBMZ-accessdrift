#!/usr/bin/env bash
# ==============================================================================
# AccessDrift: Production Launcher (Ultra-Lean 4GB RAM Optimized)
# ==============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${PROJECT_DIR}/.venv"
VENV_PYTHON="${VENV_DIR}/bin/python"
VENV_UVICORN="${VENV_DIR}/bin/uvicorn"

export PYTHONUNBUFFERED=1
export PYTHONDONTWRITEBYTECODE=1

echo "======================================================"
echo "  AccessDrift: Continuous Zero-Trust IAM Governance   "
echo "  Mode: PRODUCTION (Memory Optimized: < 60MB RAM)     "
echo "======================================================"

# 1. Verify Virtual Environment
if [ ! -f "${VENV_PYTHON}" ]; then
    echo "[ERROR] Virtual environment not found at ${VENV_DIR}."
    echo "Please set up the environment or run ./run_dev.sh first."
    exit 1
fi

# 2. Strict Pre-Flight Cryptographic & Unit Verification
echo "[*] Executing Pre-Flight Security & Cryptography Verification..."
if ! "${VENV_PYTHON}" -m unittest "${PROJECT_DIR}/backend/tests/test_backend.py" > /dev/null 2>&1; then
    echo "[FATAL] Pre-flight security verification failed. Halting production launch."
    exit 1
fi
echo "[✓] Cryptographic and mathematical integrity verified."

# 3. Host System Memory Check
TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "4194304")
TOTAL_MEM_MB=$((TOTAL_MEM_KB / 1024))
echo "[i] Host System Memory: ${TOTAL_MEM_MB} MB (Target Budget: 4096 MB)"

# 4. Launch Production Server
HOST="0.0.0.0"
PORT="8000"

echo ""
echo "[*] Launching AccessDrift Production Server on http://${HOST}:${PORT}..."
echo "[*] Ready to serve live traffic."
echo ""

exec "${VENV_UVICORN}" backend.main:app \
    --app-dir "${PROJECT_DIR}" \
    --host "${HOST}" \
    --port "${PORT}" \
    --workers 1 \
    --proxy-headers \
    --forwarded-allow-ips='*' \
    --log-level info \
    --timeout-keep-alive 30
