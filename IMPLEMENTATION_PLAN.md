# AccessDrift: Master Implementation Plan

> **Tagline:** Continuous Identity Entitlement Drift Detection & Zero-Trust Governance  
> **Tracks:** Primary: Track 2 (AI Secured) | Secondary: Track 1 (Real-Time AI)  
> **Memory Budget:** Maximum 4GB RAM (Target runtime: < 150MB)  
> **Target Environment:** Linux (x86_64 / ARM64 with IBM Z / s390x CPACF support)

---

## 1. Specification Analysis & Delta Summary

| Feature / Dimension | Initial Spec (`accessdrift_hackathon_execution_specification.md`) | Revised Spec (`accessdrift_changes.md`) | Planned Implementation Detail |
| :--- | :--- | :--- | :--- |
| **Cryptographic Acceleration** | Hardcoded CPACF hardware instructions | Platform detection (`platform.machine()`) with automatic OpenSSL fallback | Dual-mode cryptographic engine: IBM Z CPACF native on `s390x`, AES-GCM / SHA-256 via OpenSSL on `x86_64` / `aarch64`. |
| **Distance Metric** | Basic Cosine Distance ($1 - \text{sim}$) | Zero-safe Cosine Distance handling empty user vectors and unassigned roles | Explicit zero-magnitude handling ($\|v_i\| = 0 \lor \|\mu_R\| = 0 \implies \text{Distance} = 1.0$). |
| **Risk Score Bounds** | $\min(100, \lfloor \text{Dist} \times 100 \times \alpha \rfloor)$ | Clamped Risk Score $\max(0, \min(100, \dots))$ | Strictly bounded integer index ($0 - 100$) with dynamic critical multiplier ($\alpha$). |
| **Topology Data Schema** | Implicit node properties | Explicit node `type: "user" \| "permission"` | High-contrast visual differentiation in force graph with typed link contracts. |
| **UI Resiliency** | Generic fallback | Optimistic UI updates with rollback on failure | Instant client-side link severance and score drop with server rollback on error. |

---

## 2. 4GB RAM Efficiency Architecture

To guarantee the entire project runs effortlessly on a **4GB RAM Linux machine** alongside the OS and browser:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Linux Host Memory (4GB)                         │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │ FastAPI + Uvicorn     │  │ Vite + React      │  │ Linux OS &     │  │
│  │ Backend & Vector ML   │  │ Web UI            │  │ System Buffers │  │
│  │ (~45 MB RAM)          │  │ (~55 MB RAM)      │  │ (~400 MB RAM)  │  │
│  └───────────────────────┘  └───────────────────┘  └────────────────┘  │
│                                                                        │
│  Total System Footprint: < 500 MB (Leaving ~3.5 GB Free Headroom)       │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Memory Optimization Decisions:
1. **Lightweight Pure-NumPy Vector Engine:** Avoid heavy ML runtime frameworks (TensorFlow/PyTorch/Transformers). Matrix calculations for $50 \times 20$ matrices take under **10 KB** of memory.
2. **Single-Worker Async Backend:** Run FastAPI with a single lightweight Uvicorn worker and no persistent socket leaks.
3. **Canvas Force-Graph Physics Freezing:** Stabilize and cool graph physics after 150 layout iterations to stop continuous CPU/GPU memory churn.
4. **Zero Heavy Databases:** Use in-memory state with fast JSON/SQLite WAL checkpointing (takes < 5MB RAM).

---

## 3. High-Impact Recommended Features (Demo & Judge Boosters)

1. **Role Shift "Time-Travel" Simulator:**
   * Interactive dropdown in the UI allowing judges to pick any employee (e.g. *"Promote Alice from Senior DevOps to Engineering Manager"*) and watch permissions drift live on the graph.
2. **CPACF-Sealed Immutable Audit Ledger:**
   * Every remediation creates a cryptographic SHA-256 block chained to previous actions, displaying a live badge: `IBM Z CPACF (s390x) Hardware Active` or `OpenSSL (x86_64) Emulated`.
3. **Explainable AI (XAI) Peer Divergence Breakdown:**
   * Clicking a flagged user displays a side-by-side comparison of their entitlements against the peer group centroid, clearly explaining why their risk score spiked.
4. **Multi-Format Least-Privilege IAM Policy Exporter:**
   * 1-click export of remediated policies in AWS IAM JSON, GCP IAM format, and IBM RACF terminal commands.
5. **Real-Time Memory & Health Diagnostic Widget:**
   * Live badge displaying backend RAM usage (~45MB) to visibly demonstrate the ultra-lean performance to judges.

---

## 4. API Endpoints & Contracts

### `GET /api/v1/topology`
Returns typed nodes and links for the interactive force graph.
```json
{
  "nodes": [
    {
      "id": "usr_102",
      "name": "Bob Vance",
      "type": "user",
      "role": "Engineering Manager",
      "department": "Engineering",
      "risk_score": 92,
      "is_outlier": true
    },
    {
      "id": "perm_db_root",
      "name": "db:root",
      "type": "permission",
      "role": null,
      "department": null,
      "risk_score": 0,
      "is_outlier": false
    }
  ],
  "links": [
    {
      "source": "usr_102",
      "target": "perm_db_root",
      "is_drift": true
    }
  ]
}
```

### `POST /api/v1/remediate`
Remediates privilege creep for a specific user.
```json
// Request
{
  "user_id": "usr_102",
  "strip_drift_only": true
}

// Response
{
  "user_id": "usr_102",
  "status": "SUCCESS",
  "previous_risk_score": 92,
  "new_risk_score": 12,
  "removed_permissions": ["db:root", "k8s:admin"],
  "remediated_policy_json": {
    "Version": "2026-10-04",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["jira:read", "github:org_admin"],
        "Resource": "*"
      }
    ]
  },
  "audit_block_hash": "a4f89d...3c1"
}
```

### Additional Endpoints:
* `GET /api/v1/users` - Roster with risk scores and department summaries.
* `POST /api/v1/simulate/role-change` - Simulate promotion/department shift.
* `GET /api/v1/audit-ledger` - View immutable cryptographic audit trail.
* `GET /api/v1/system/health` - Memory consumption and CPACF status.

---

## 5. Phased Implementation Roadmap

### Phase 1: Project Setup & Backend Core (Completed)
* [x] Create directory structure (`backend/` and `frontend/`).
* [x] Setup Python environment with minimal dependencies (`fastapi`, `uvicorn`, `numpy`, `pydantic`, `cryptography`, `httpx`).
* [x] Implement `crypto.py`: Hardware architecture detection (`s390x` vs `x86_64`) with SHA-256 and AES-GCM memory vault.
* [x] Implement `data_generator.py`: Synthetic enterprise identity dataset with standard roles & drift personas (Bob Vance).

### Phase 2: Anomaly Engine & Remediation (Completed)
* [x] Implement `engine.py`: Vector encoding, role centroids ($\mu_R$), zero-safe Cosine Distance, clamped risk score ($0-100$).
* [x] Implement `remediation.py`: Pruning algorithm, IAM policy generation, and cryptographic audit log chaining.
* [x] Implement `main.py`: FastAPI routes, CORS, static mounting, and request handlers.

### Phase 3: Initial Functional Frontend & Force Visualizer (Completed)
* [x] Build lightweight HTML5 Canvas force-directed graph visualizer with color-coded risk clusters.
* [x] Implement User Details & XAI peer divergence inspector panel.
* [x] Implement 1-Click Auto-Remediation with optimistic UI link severance.
* [x] Implement Role Shift Time-Travel Simulator dropdown.
* [x] Implement CPACF Audit Ledger viewer & Live Memory Monitor badge.
* [ ] *(Optional Future Polish)*: Upgrade to full Next.js/React component framework if customized further.

### Phase 4: Integration, Memory Profiling & Launch Automation (Completed)
* [x] End-to-end integration and security test suite (`test_backend.py`).
* [x] Verify system RAM usage stays well under 100MB (< 60MB observed).
* [x] Create `./run_dev.sh` and `./run_prod.sh` execution scripts.
* [x] Initialize Git repository, commit codebase, and connect to remote.

