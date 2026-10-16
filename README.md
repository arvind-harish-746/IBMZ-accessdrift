# AccessDrift: Zero-Trust Continuous Identity Governance

> **Tagline:** Continuous Identity Entitlement Drift Detection & Zero-Trust Governance  
> **Tracks:** Primary: Track 2 (AI Secured) | Secondary: Track 1 (Real-Time AI)  
> **Target Platform:** LinuxONE (s390x) & IBM Z Mainframe Cloud Environments  
> **Memory Consumption:** ~50MB RAM (Leaves >3.5GB free on a 4GB RAM budget)

---

## 1. Executive Summary & Value Proposition

In enterprise environments, as employees move between roles (e.g., *Senior Software Engineer $\rightarrow$ Engineering Manager*), they accumulate privileges without shedding legacy permissions. This phenomenon—**privilege creep** or **entitlement drift**—produces dormant superuser accounts, expands enterprise attack surfaces, and violates zero-trust principles (SOC2, ISO 27001, HIPAA).

**AccessDrift** is an AI-powered security governance platform that continuously audits enterprise permission matrices. By modeling individual entitlements against dynamic peer-group baselines using **Isolation Forest anomaly detection** and **zero-safe cosine divergence**, AccessDrift flags privilege anomalies, quantifies organizational risk scores, and generates automated, 1-click least-privilege remediation policies.

---

## 2. Core Platform Capabilities

- **Isolation Forest ML Anomaly Engine**: Scikit-learn Pipeline incorporating 12 quantitative drift features (e.g., divergence from role centroid, permission counts above role median, critical privilege ratios) with a calibrated threshold ($\tau = 0.055$) achieving **ROC-AUC 0.9721** and **F1 0.8697**.
- **Enterprise Multi-Branch Governance**: Real-time visibility across global branches (`Global HQ - New York`, `EMEA - London`, `APAC - Singapore`, `IBM Z Lab - Poughkeepsie`, `Latin America - São Paulo`), with live branch switching and regional risk aggregation.
- **Dynamic Employee Ingestion**:
  - **Batch CSV Upload**: Ingest corporate IAM spreadsheets with automatic permission array parsing and instant real-time ML anomaly scoring.
  - **Manual Registration**: Add single employee records directly into regional branches.
- **Zero-Friction Presentation & Trial Auth**:
  - **1-Click Persona Sign-In**: Instant token issuance as `CEO (Executive)`, `Admin`, `Analyst`, or `Auditor` without passwords for hackathon judging and live demonstrations.
  - **Dynamic Evaluator Registration**: Presenters and judges can register on-the-fly to receive custom executive sessions with full audit trail logging.
- **CPACF Hardware Security & Tamper-Evident Ledger**: IBM Z CPACF-accelerated memory encryption (AES-GCM / SHA-256 fallback on x86) with an immutable cryptographic blockchain audit ledger.
- **1-Click Dual Remediation**: Prunes toxic drift and automatically synthesizes both AWS IAM JSON zero-trust policies and IBM RACF mainframe commands.

---

## 3. Quickstart & Local Execution

### Prerequisites
- Python 3.11, 3.12, or 3.14 (Linux / macOS / Windows)
- Standard virtual environment (`.venv`)

### Running the API Gateway
```bash
# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Launch the enterprise server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The API Gateway will start at **`http://localhost:8000`**.  
Interactive Swagger API Documentation is accessible at **`http://localhost:8000/docs`**.

### Running the Automated Test Suite
AccessDrift includes 21 comprehensive unit, cryptographic, and machine learning tests:
```bash
python -m unittest discover -s backend/tests -v
```

```
- test_auth.py: 6/6 passed (PBKDF2 hashing, JWT signing, login, introspection, RBAC enforcement, audit trail)
- test_enterprise_features.py: 6/6 passed (Trial login, presenter registration, branch filtering, CSV template, CSV upload, manual add/delete)
- test_ml_inference.py: 4/4 passed (Isolation Forest pipeline, feature vectorization, score directionality, batch consistency)
- test_backend.py: 5/5 passed (CPACF crypto vault, mathematical bounds, Bob Vance privilege creep detection, 1-click remediation, simulation)

Ran 21 tests in 4.3s — OK (All tests passing)
```

---

## 4. Pre-Configured Presentation Accounts

For manual testing and live presentations:

| Role | Username | Password | Assigned Persona & Focus |
| :--- | :--- | :--- | :--- |
| **`EXECUTIVE`** | `ceo` | `AccessDrift@Executive2026!` | Victoria Sterling (CISO / CEO) — Global Multi-Branch Governance & CSV Upload |
| **`ADMIN`** | `admin` | `AccessDrift@Admin2026!` | Sarah Connor (Security Operations Admin) — Full Privilege Remediation & System Control |
| **`SECURITY_ANALYST`** | `analyst` | `Analyst@Drift2026!` | Alex Mercer (Cyber Risk Analyst) — Risk Triage & Role Simulation |
| **`AUDITOR`** | `auditor` | `Audit@Compliance2026!` | Marcus Vance (Compliance Officer) — Cryptographic Blockchain Ledger Inspection |

> **Presentation Tip:** You can bypass passwords completely using the 1-click trial endpoint:  
> `POST /api/v1/auth/trial-login` with `{"persona": "ceo"}`.

---

## 5. API Reference Table

| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | None | Web Dashboard UI |
| `GET` | `/api/v1/auth/presentation-personas` | None | Lists 1-click trial personas with roles & descriptions |
| `POST` | `/api/v1/auth/trial-login` | None | 1-Click zero-password presentation sign-in |
| `POST` | `/api/v1/auth/register-trial` | None | On-the-fly evaluator/judge custom session creation |
| `POST` | `/api/v1/auth/login` | None | Standard username/password PBKDF2 authentication |
| `GET` | `/api/v1/auth/me` | Bearer Token | Current session identity and RBAC capabilities |
| `GET` | `/api/v1/branches` | Bearer Token | Regional branches with live employee counts & risk metrics |
| `GET` | `/api/v1/topology` | Bearer Token | Force-directed graph nodes and links (supports `?branch=...`) |
| `GET` | `/api/v1/users` | Bearer Token | Scored employee roster with anomaly flags (supports `?branch=...`) |
| `GET` | `/api/v1/users/{user_id}` | Bearer Token | Explainable AI risk breakdown for an individual employee |
| `GET` | `/api/v1/roster/csv-template` | None | Downloads pre-formatted enterprise IAM CSV template |
| `POST` | `/api/v1/roster/upload-csv` | `EXECUTIVE`, `ADMIN` | Multipart CSV upload; batch-scores employees through ML model |
| `POST` | `/api/v1/roster/add-user` | `EXECUTIVE`, `ADMIN` | Registers single employee; runs real-time anomaly inference |
| `DELETE`| `/api/v1/roster/users/{id}` | `EXECUTIVE`, `ADMIN` | Removes employee record from active governance |
| `POST` | `/api/v1/remediate` | `EXECUTIVE`, `ADMIN` | 1-Click privilege pruning; emits AWS IAM JSON & IBM RACF commands |
| `POST` | `/api/v1/simulate/role-change` | `EXECUTIVE`, `ADMIN`, `SECURITY_ANALYST` | Simulates promotion/transfer to demonstrate emerging drift |
| `GET` | `/api/v1/audit-ledger` | `EXECUTIVE`, `ADMIN`, `AUDITOR` | Immutable SHA-256 CPACF audit ledger with integrity status |
| `POST` | `/api/v1/reset` | `EXECUTIVE`, `ADMIN` | Restores pristine demo dataset for repeated evaluations |
| `GET` | `/api/v1/system/health` | None | Real-time memory consumption (RSS MB) and hardware crypto status |

---

## 6. Repository Structure

```
├── backend/
│   ├── auth.py                  # RFC 7519 JWT, PBKDF2 hashing, 4-tier RBAC, trial personas
│   ├── crypto.py                # CPACF / OpenSSL AES-GCM vault & SHA-256 blockchain ledger
│   ├── data_generator.py        # Enterprise roles, permissions, baselines & 5 regional branches
│   ├── engine.py                # Zero-safe vector math & Isolation Forest anomaly engine
│   ├── main.py                  # FastAPI gateway & complete enterprise REST endpoints
│   ├── ml_service.py            # Lightweight scikit-learn Isolation Forest inference service
│   ├── models/                  # Production trained ML pipeline & metadata
│   │   ├── accessdrift_isolation_forest.joblib
│   │   └── model_metadata.json
│   ├── remediation.py           # 1-Click privilege pruner (AWS IAM JSON + IBM RACF commands)
│   ├── requirements.txt         # Production backend dependencies
│   └── tests/                   # 21 automated test suites
│       ├── test_auth.py
│       ├── test_backend.py
│       ├── test_enterprise_features.py
│       └── test_ml_inference.py
├── frontend/                    # Web client (HTML5 Canvas visualizer, styles, script)
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── frontend_prompt.md           # Specification prompt for frontend agent implementation
├── .gitignore                   # Ignores training scripts/datasets; preserves model artifacts
└── README.md                    # Core project documentation
```
