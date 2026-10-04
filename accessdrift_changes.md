AccessDrift: Project Architecture & Execution SpecificationTagline: Continuous Identity Entitlement Drift Detection & Zero-Trust Governance   Tracks: Primary: Track 2 (AI Secured) | Secondary: Track 1 (Real-Time AI)   Pitch Hook: Stopping Privilege Creep Before Hackers Exploit It.   1. Executive Summary & Value Proposition1.1 The Enterprise ProblemAs employees change roles within an organization (e.g., Senior Software Engineer $\rightarrow$ Engineering Manager), they gain new access privileges without losing legacy ones. This phenomenon—privilege creep or entitlement drift—creates dormant superuser accounts, inflates attack surfaces, and violates zero-trust principles (SOC2, ISO 27001, HIPAA).   1.2 The AccessDrift SolutionAccessDrift is an AI-powered security governance platform that continuously scans enterprise permission matrices. By modeling user permissions against dynamic peer-group baselines, AccessDrift detects authorization anomalies, quantifies risk scores, and generates automated, 1-click least-privilege remediation policies—all without exposing raw activity logs.   2. System Architecture & Tech Stack2.1 Architecture Pipeline Diagram[Enterprise Identity (LDAP/RACF)] 
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
```[cite: 1]

### 2.2 Tech Stack Selection[cite: 1]
* **Backend Framework:** Python 3.11+, FastAPI, Pydantic[cite: 1]
* **Data Science & ML:** `scikit-learn`, `numpy`, `pandas`, `NetworkX`[cite: 1]
* **Frontend:** React 18, Tailwind CSS, `react-force-graph-2d` / `vis-network`[cite: 1]
* **Infrastructure & Containerization:** Docker, LinuxONE / IBM Z runtime emulation[cite: 1]
* **Cryptographic Layer:** AES-GCM / SHA-256 (leveraging CPACF hardware acceleration primitives with x86_64 fallback)[cite: 1]

---

## 3. IBM Z & LinuxONE Integration Strategy[cite: 1]

### 3.1 Mainframe Fit & Value Proposition[cite: 1]
Mainframes house core enterprise LDAP, RACF, Top Secret, and ACF2 identity registries[cite: 1]. AccessDrift runs natively within a **LinuxONE (s390x)** container environment adjacent to the primary identity vault[cite: 1].

### 3.2 Cryptographic Acceleration (CPACF)[cite: 1]
AccessDrift utilizes IBM Z **CPACF (Central Processor Assist for Cryptographic Functions)** for hardware-accelerated memory encryption:[cite: 1]
* **Log Hashing & Anonymization:** In-memory hashing of Sensitive Identifiers (User IDs, Employee Names) before vector ingestion[cite: 1].
* **Audit Vault Security:** Immutable, real-time audit log encryption with zero overhead on host CPU cycles[cite: 1].
* **Platform Fallback:** Non-s390x local development environments dynamically utilize standard OpenSSL cryptographic primitives.

---

## 4. Algorithmic Architecture & Data Engine[cite: 1]

### 4.1 Data Modeling Strategy[cite: 1]
To avoid sparsity issues common in high-dimensional IAM logs, the workspace is scoped to:[cite: 1]
* **Users ($N$):** 30–50 simulated enterprise employees across 4 primary departments (*DevOps*, *Engineering*, *Finance*, *HR*)[cite: 1].
* **Permissions ($M$):** 15–20 high-value system entitlements (e.g., `db:read`, `db:root`, `k8s:admin`, `s3:read`, `hr:payroll_write`)[cite: 1].

Each user $i$ is represented as a vector $v_i \in \{0, 1\}^M$:[cite: 1]
$$v_i = [p_{i,1}, p_{i,2}, \dots, p_{i,M}]$$
[cite: 1]

### 4.2 Outlier & Drift Scoring Model[cite: 1]
1. **Role Centroid Construction:** For each role $R$, compute the peer group baseline vector $\mu_R$:[cite: 1]
   $$\mu_R = \frac{1}{\vert{}R\vert{}} \sum_{i \in R} v_i$$
[cite: 1]

2. **Cosine Distance Drift Score (Safe Formula):** Compute entitlement divergence between user $v_i$ and role centroid $\mu_R$, handling zero-magnitude edge cases:
   $$\text{Distance}(v_i, \mu_R) = \begin{cases}     1.0 & \text{if } \Vert{}v_i\Vert{}_2 = 0 \text{ or } \Vert{}\mu_R\Vert{}_2 = 0 \\     1 - \frac{v_i \cdot \mu_R}{\Vert{}v_i\Vert{}_2 \Vert{}\mu_R\Vert{}_2} & \text{otherwise}     \end{cases}$$

3. **Clamped Risk Score Normalization:** Scale distance to an integer index ($0 - 100$):
   $$\text{Risk Score}_i = \max\left(0, \min\left(100, \left\lfloor \text{Distance}(v_i, \mu_R) \times 100 \times \alpha \right\rfloor\right)\right)$$
[cite: 1]
   *(where $\alpha$ is a severity multiplier triggered by critical flags like legacy root access).*[cite: 1]

---

## 5. API Data Contracts (FastAPI & React)[cite: 1]

### 5.1 Endpoint: GET `/api/v1/topology`[cite: 1]
Returns node-link graph structure for frontend force-directed visualization with distinct node types.[cite: 1]

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
```[cite: 1]

### 5.2 Endpoint: POST `/api/v1/remediate`[cite: 1]
Executes automated 1-click privilege trimming.[cite: 1]

**Request:**[cite: 1]
```json
{
  "user_id": "usr_102",
  "strip_drift_only": true
}
```[cite: 1]

**Response:**[cite: 1]
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
```[cite: 1]

---

## 6. Risk Management & Fallback Matrix[cite: 1]

| Area | Risk | Impact | Mitigation / Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **ML Model** | High dimensional sparse matrix breaking clustering[cite: 1] | High[cite: 1] | Limit MVP dimension scope ($50 \times 20$); rely on Cosine Distance against role centroids instead of full GNN inference.[cite: 1] |
| **UI Performance** | Graph layout stutter or physics collapse[cite: 1] | Med[cite: 1] | Pre-calculate initial node coordinates or lock physics simulation post-render; use strict node coloring.[cite: 1] |
| **Demo Runtime** | API failure or latency during live presentation[cite: 1] | High[cite: 1] | Implement optimistic UI updates in React with automatic rollback on network error. |
| **Mainframe Pitch** | IBM Z platform applicability challenged[cite: 1] | Med[cite: 1] | Emphasize LinuxONE container deployment and CPACF hardware-accelerated memory hashing for audit log compliance.[cite: 1] |
| **Architecture** | CPACF unavailable on non-s390x local host | Med | Implement automatic architecture detection (`platform.machine()`) with fallback to standard OpenSSL libraries. |

---

## 7. 3-Minute Live Demo Walkthrough[cite: 1]

1. **0:00 - 0:30 (The Hook & Problem):** Introduce "Bob"—a Senior DevOps Engineer promoted to Engineering Manager[cite: 1]. Show how traditional IAM tools miss legacy `db:root` rights Bob retained[cite: 1].
2. **0:30 - 1:15 (The Topology Visualizer):** Open AccessDrift dashboard[cite: 1]. Point out the cluster of safe green nodes and highlight Bob’s node in **glowing red (Risk Score: 92/100)** sitting far outside the manager cluster[cite: 1].
3. **1:15 - 2:00 (The AI Engine & CPACF Audit):** Explain how Cosine Distance vector comparison flagged the anomaly while IBM Z CPACF hashed the identity data directly in host memory[cite: 1].
4. **2:00 - 2:30 (1-Click Auto-Remediation):** Click "Auto-Remediate Access"[cite: 1]. Show the UI animation severing the invalid permission links, snapping Bob's node into the green cluster, and dropping his risk score to 12[cite: 1].
5. **2:30 - 3:00 (The Delta Output & Pitch Close):** Display the automatically generated, zero-trust pruned JSON IAM policy ready for deployment[cite: 1]. Reiterate enterprise security and compliance savings[cite: 1].
