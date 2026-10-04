# AccessDrift: Zero-Trust Continuous Identity Governance

> **Tagline:** Continuous Identity Entitlement Drift Detection & Zero-Trust Governance  
> **Tracks:** Primary: Track 2 (AI Secured) | Secondary: Track 1 (Real-Time AI)  
> **Memory Consumption:** ~50MB RAM (Leaves >3.5GB free on a 4GB RAM Linux system)

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.11+ or 3.12+ (standard Linux distribution)

### 2. Quick Execution Scripts

#### A. Development & Test Mode (Hot-Reload + Verbose Debugging)
```bash
./run_dev.sh
```
* Automatically creates/validates the virtual environment.
* Runs all unit, cryptographic, and security test suites before launch.
* Enables live auto-reloading (`--reload`) and debug logging.

#### B. Production Ready Mode (Ultra-Lean RAM Footprint)
```bash
./run_prod.sh
```
* Runs pre-flight cryptographic verification checks (halts on any failure).
* Configured for zero-overhead performance (`--workers 1`, `--timeout-keep-alive 30`).
* Consumes **< 60MB RAM**, leaving over 3.9GB RAM free on your Linux system.


### 3. Access Dashboard
Open your browser at: **`http://localhost:8000`**

---

## 🔒 Security & Cryptographic Architecture
- **Dual-Mode Cryptography:** Native IBM Z CPACF hardware acceleration on `s390x` mainframes with automatic AES-GCM / SHA-256 OpenSSL fallback on `x86_64` / `aarch64`.
- **In-Memory Vault:** Sensitive employee identifiers are anonymized using keyed HMAC before vector processing.
- **Tamper-Evident Audit Ledger:** Every remediation action is hashed and cryptographically chained to guarantee audit trail integrity.
- **Zero-Safe Vector Engine:** Vector divergence handles empty profiles ($\|v_i\| = 0$) and unassigned roles without division-by-zero or NaN exploits.

---

## 📊 Endpoints Overview

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Web Dashboard UI |
| `GET` | `/api/v1/topology` | Node-link force-graph contracts with typed nodes & drift flags |
| `GET` | `/api/v1/users` | Analyzed roster with risk scores, peer divergence & anomalies |
| `GET` | `/api/v1/users/{id}` | Detailed employee risk breakdown |
| `POST` | `/api/v1/remediate` | 1-click privilege pruning, AWS IAM JSON synthesis & RACF scripts |
| `POST` | `/api/v1/simulate/role-change` | Interactive role transition / privilege creep simulation |
| `GET` | `/api/v1/audit-ledger` | Cryptographically verified SHA-256 audit ledger |
| `GET` | `/api/v1/system/health` | Live memory footprint (RSS in MB) & crypto acceleration status |
| `POST` | `/api/v1/reset` | Restore pristine enterprise dataset for demonstrations |
