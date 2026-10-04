# AccessDrift: Project Architecture & Execution Specification

> **Tagline:** Continuous Identity Entitlement Drift Detection & Zero-Trust Governance  
> **Tracks:** Primary: Track 2 (AI Secured) | Secondary: Track 1 (Real-Time AI)  
> **Pitch Hook:** *Stopping Privilege Creep Before Hackers Exploit It.*  

---

## 1. Executive Summary & Value Proposition

### 1.1 The Enterprise Problem
As employees change roles within an organization (e.g., *Senior Software Engineer $\rightarrow$ Engineering Manager*), they gain new access privileges without losing legacy ones. This phenomenon—**privilege creep** or **entitlement drift**—creates dormant superuser accounts, inflates attack surfaces, and violates zero-trust principles (SOC2, ISO 27001, HIPAA).

### 1.2 The AccessDrift Solution
AccessDrift is an AI-powered security governance platform that continuously scans enterprise permission matrices. By modeling user permissions against dynamic peer-group baselines, AccessDrift detects authorization anomalies, quantifies risk scores, and generates automated, 1-click least-privilege remediation policies—all without exposing raw activity logs.

---

## 2. System Architecture & Tech Stack

### 2.1 Architecture Pipeline Diagram
```
[Enterprise Identity (LDAP/RACF)] 
              │
              ▼
  [Encrypted Ingestion Gateway]  <── Mainframe CPACF Acceleration / Memory Vault
              │
              ▼
  [Vector Encoding Engine]      <── Binary/Weighted User-Entitlement Matrix
              │
              ▼
   [Least-Privilege AI Engine]   <── Role Centroid & Cosine Anomaly Engine
       │                 │
       ▼                 ▼
[Deterministic Rules] [Outlier Clustering]
       │                 │
       └────────┬────────┘
                │
                ▼
   [FastAPI Gateway REST API]
                │
                ▼
   [React / Force-Graph UI]      <── Interactive Visualizer & 1-Click Remediation
```

### 2.2 Tech Stack Selection
* **Backend Framework:** Python 3.11+, FastAPI, Pydantic
* **Data Science & ML:** `scikit-learn`, `numpy`, `pandas`, `NetworkX`
* **Frontend:** React 18, Tailwind CSS, `react-force-graph-2d` / `vis-network`
* **Infrastructure & Containerization:** Docker, LinuxONE / IBM Z runtime emulation
* **Cryptographic Layer:** AES-GCM / SHA-256 (leveraging CPACF hardware acceleration primitives)

---

## 3. IBM Z & LinuxONE Integration Strategy

### 3.1 Mainframe Fit & Value Proposition
Mainframes house core enterprise LDAP, RACF, Top Secret, and ACF2 identity registries. AccessDrift runs natively within a **LinuxONE (s390x)** container environment adjacent to the primary identity vault.

### 3.2 Cryptographic Acceleration (CPACF)
AccessDrift utilizes IBM Z **CPACF (Central Processor Assist for Cryptographic Functions)** for hardware-accelerated memory encryption:
* **Log Hashing & Anonymization:** In-memory hashing of Sensitive Identifiers (User IDs, Employee Names) before vector ingestion.
* **Audit Vault Security:** Immutable, real-time audit log encryption with zero overhead on host CPU cycles.

---

## 4. Algorithmic Architecture & Data Engine

### 4.1 Data Modeling Strategy
To avoid sparsity issues common in high-dimensional IAM logs, the workspace is scoped to:
* **Users ($N$):** 30–50 simulated enterprise employees across 4 primary departments (*DevOps*, *Engineering*, *Finance*, *HR*).
* **Permissions ($M$):** 15–20 high-value system entitlements (e.g., `db:read`, `db:root`, `k8s:admin`, `s3:read`, `hr:payroll_write`).

Each user $i$ is represented as a vector $v_i \in \{0, 1\}^M$:
$$v_i = [p_{i,1}, p_{i,2}, \dots, p_{i,M}]$$

### 4.2 Outlier & Drift Scoring Model
1. **Role Centroid Construction:** For each role $R$, compute the peer group baseline vector $\mu_R$:
   $$\mu_R = \frac{1}{|R|} \sum_{i \in R} v_i$$
2. **Cosine Distance Drift Score:** Compute the entitlement divergence between user $v_i$ and role centroid $\mu_R$:
   $$\text{Distance}(v_i, \mu_R) = 1 - \frac{v_i \cdot \mu_R}{\|v_i\|_2 \|\mu_R\|_2}$$
3. **Risk Score Normalization:** Scale distance to a integer index ($0 - 100$):
   $$\text{Risk Score}_i = \min\left(100, \left\lfloor \text{Distance}(v_i, \mu_R) \times 100 \times \alpha \right\rfloor\right)$$
   *(where $\alpha$ is a severity multiplier triggered by critical flags like legacy root access).*

---

## 5. API Data Contracts (FastAPI & React)

### 5.1 Endpoint: GET `/api/v1/topology`
Returns node-link graph structure for frontend force-directed visualization.

```json
{
  "nodes": [
    {
      "id": "usr_102",
      "name": "Bob Vance",
      "role": "Engineering Manager",
      "department": "Engineering",
      "risk_score": 92,
      "is_outlier": true
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

### 5.2 Endpoint: POST `/api/v1/remediate`
Executes automated 1-click privilege trimming.

**Request:**
```json
{
  "user_id": "usr_102",
  "strip_drift_only": true
}
```

**Response:**
```json
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
  }
}
```

---

## 6. Risk Management & Fallback Matrix

| Area | Risk | Impact | Mitigation / Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **ML Model** | High dimensional sparse matrix breaking clustering | High | Limit MVP dimension scope ($50 \times 20$); rely on Cosine Distance against role centroids instead of full GNN inference. |
| **UI Performance** | Graph layout stutter or physics collapse | Med | Pre-calculate initial node coordinates or lock physics simulation post-render; use strict node coloring. |
| **Demo Runtime** | API failure or latency during live presentation | High | Implement local state overrides on React UI so remediation animates immediately even if network delays occur. |
| **Mainframe Pitch** | IBM Z platform applicability challenged | Med | Emphasize LinuxONE container deployment and CPACF hardware-accelerated memory hashing for audit log compliance. |

---

## 7. 3-Minute Live Demo Walkthrough

1. **0:00 - 0:30 (The Hook & Problem):** Introduce "Bob"—a Senior DevOps Engineer promoted to Engineering Manager. Show how traditional IAM tools miss legacy `db:root` rights Bob retained.
2. **0:30 - 1:15 (The Topology Visualizer):** Open AccessDrift dashboard. Point out the cluster of safe green nodes and highlight Bob’s node in **glowing red (Risk Score: 92/100)** sitting far outside the manager cluster.
3. **1:15 - 2:00 (The AI Engine & CPACF Audit):** Explain how Cosine Distance vector comparison flagged the anomaly while IBM Z CPACF hashed the identity data directly in host memory.
4. **2:00 - 2:30 (1-Click Auto-Remediation):** Click "Auto-Remediate Access". Show the UI animation severing the invalid permission links, snapping Bob's node into the green cluster, and dropping his risk score to 12.
5. **2:30 - 3:00 (The Delta Output & Pitch Close):** Display the automatically generated, zero-trust pruned JSON IAM policy ready for deployment. Reiterate enterprise security and compliance savings.