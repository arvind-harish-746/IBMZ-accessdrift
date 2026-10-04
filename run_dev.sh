#!/usr/bin/env bash
# ==============================================================================
# AccessDrift: Development & Test Mode Launcher
# ==============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${PROJECT_DIR}/.venv"
VENV_PYTHON="${VENV_DIR}/bin/python"
VENV_UVICORN="${VENV_DIR}/bin/uvicorn"

echo "======================================================"
echo "  AccessDrift: Continuous Zero-Trust IAM Governance   "
echo "  Mode: DEVELOPMENT / TEST                            "
echo "======================================================"

# 1. Verify Virtual Environment
if [ ! -f "${VENV_PYTHON}" ]; then
    echo "[!] Virtual environment not detected at ${VENV_DIR}. Creating..."
    python3 -m venv "${VENV_DIR}"
    echo "[+] Installing backend dependencies..."
    "${VENV_DIR}/bin/pip" install --upgrade pip
    "${VENV_DIR}/bin/pip" install -r "${PROJECT_DIR}/backend/requirements.txt"
fi

# 2. Run Security & Mathematical Unit Test Suite
echo ""
echo "[*] Running Security, Cryptography & Mathematical Test Suite..."
"${VENV_PYTHON}" -m unittest "${PROJECT_DIR}/backend/tests/test_backend.py"
echo "[✓] All tests passed cleanly!"

# 3. Launch Server in Dev Mode (Hot-Reloading Enabled)
echo ""
echo "[*] Starting Development Server at http://127.0.0.1:8000 with auto-reload..."
echo "[*] Press CTRL+C to terminate."
echo ""

exec "${VENV_UVICORN}" backend.main:app \
    --app-dir "${PROJECT_DIR}" \
    --host "0.0.0.0" \
    --port 8000 \
    --reload \
    --log-level debug
