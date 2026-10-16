# AccessDrift: Zero-Trust Continuous Identity Governance

> **Tagline:** Continuous Identity Entitlement Drift Detection & Zero-Trust Governance  
> **Tracks:** Primary: Track 2 (AI Secured) | Secondary: Track 1 (Real-Time AI)  
> **Memory Consumption:** ~50MB RAM (Leaves >3.5GB free on a 4GB RAM Linux system)

---

## 🚀 Run Locally Using Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Start the application
```bash
docker compose up --build
```

### 3. Access the application
Once all containers have started, open your browser:
- Application: [http://localhost:8000](http://localhost:8000/)

### 4. Stop the application
```bash
docker compose down
```

---

## 💻 Alternative: Run Locally Using Python Scripts

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

## 🛠️ Technologies Used

### Infrastructure & Containerization
- **Docker**: Multi-architecture containerization (`x86_64`, `aarch64`, `s390x` IBM Z) running under an unprivileged least-privilege user (`appuser`).
- **Docker Compose**: Container lifecycle orchestration, automated health checks, and resource controls.

### Backend & Core Logic
- **Python 3.11+**: Core runtime environment.
- **FastAPI**: Modern, high-performance async web framework for REST API endpoints and automatic OpenAPI schema generation.
- **Uvicorn**: Ultra-lean ASGI web server with minimal memory footprint (<60MB RSS).
- **Pydantic (v2)**: Strict data modeling, schema validation, and zero-trust payload enforcement.
- **NumPy**: Vectorized divergence calculations, matrix operations, and zero-safe cosine drift computation.
- **Cryptography (pyca/cryptography)**: Enterprise-grade OpenSSL cryptographic bindings (AES-GCM encryption & SHA-256 HMAC).
- **HTTPX**: Asynchronous HTTP client for test suite automation and endpoint verification.

### Enterprise Security & Acceleration
- **IBM Z CPACF Hardware Acceleration**: Native hardware crypto instructions on `s390x` mainframes with seamless OpenSSL fallback.
- **Tamper-Evident Cryptographic Ledger**: SHA-256 hash-chained immutable audit log for all remediation events.
- **Zero-Safe Vector Engine**: Mathematical divergence calculation resilient to empty profile vectors ($\|v_i\| = 0$) and division-by-zero edge cases.

### Frontend Dashboard
- **HTML5 & Vanilla CSS3**: Custom modern cyber-security dark theme with glassmorphism, responsive metrics, and zero external CSS bloat.
- **Vanilla JavaScript (ES6+)**: Real-time event handling, interactive entitlement simulation, dynamic drift visualization, and remediation workflows.

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
