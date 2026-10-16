# PROMPT FOR FRONTEND IMPLEMENTATION AGENT: ACCESSDRIFT ENTERPRISE UI

Copy and paste the entire prompt below into your frontend coding agent to build the AccessDrift user interface.

---

```markdown
# TASK: Build the Modern Enterprise Frontend for AccessDrift

## 1. Project Context & Objectives
You are building the frontend for **AccessDrift**, an AI-powered continuous identity entitlement drift detection and zero-trust governance platform submitted to the **IBM Z Datathon**.

AccessDrift stops **privilege creep**—the security vulnerability where employees change roles within an enterprise (e.g., *Senior Software Engineer → Engineering Manager*), retaining legacy superuser permissions that violate least-privilege policies.

The backend is an enterprise-grade **FastAPI Gateway** running at `http://localhost:8000` with:
- A trained **scikit-learn Isolation Forest ML Anomaly Engine** (`ROC-AUC: 0.9721`, `F1: 0.8697`).
- **RFC 7519 JWT Authentication** with 4 RBAC tiers (`EXECUTIVE`, `ADMIN`, `SECURITY_ANALYST`, `AUDITOR`).
- **Zero-Friction Presentation Trial Sign-In** (1-click demo persona sign-in and evaluator registration without hardcoded passwords).
- **Multi-Branch Governance** across 5 global enterprise regions.
- **Dynamic Roster Ingestion**: Batch CSV upload with automatic ML scoring + manual single-employee add/delete.
- **1-Click Privilege Remediation**: Prunes toxic drift links and synthesizes dual policies (AWS IAM JSON + IBM RACF commands).
- **IBM Z CPACF Hardware Security**: Tamper-evident SHA-256 blockchain audit ledger and in-memory encryption vault consuming < 60MB RAM.

Your mission is to build or upgrade the web client in `frontend/` into a **stunning, state-of-the-art, dark-themed cybernetic dashboard** that will blow away hackathon judges, enterprise CISOs, and security evaluators.

---

## 2. Technology & Architecture Guidelines
- **Location**: All frontend files reside in `frontend/` (`frontend/index.html`, `frontend/app.js`, `frontend/styles.css`).
  - *Option A (Recommended & Preserved)*: High-performance Vanilla HTML5, modern Vanilla CSS, and modular modern ES6+ JavaScript using a Zero-Copy HTML5 Canvas / SVG force graph. This preserves the ultra-lean mainframe RAM footprint (< 60MB RAM).
  - *Option B*: Modern React + Tailwind + Vite inside `frontend/` if you bundle to static files served by FastAPI (`/static` and `/`).
- **Aesthetics & Theme**:
  - Dark enterprise cybernetic palette inspired by IBM Carbon & Zero-Trust security:
    - Deep Backgrounds: `#090d16`, `#0e1422`, `#161f33`
    - Borders & Glass: `rgba(255, 255, 255, 0.08)` with subtle backdrop blur
    - Accent Blue & Neon Cyan: `#0f62fe`, `#00e5ff`
    - Anomaly Threat Alert: `#da1e28` (Crimson), glowing pulse `#ff5c67`
    - Warning Drift: `#f1c21b`, `#f59e0b`
    - Zero-Trust Compliant: `#24a148`, `#10b981`
    - Typography: `Plus Jakarta Sans` or `Inter` for interface, `JetBrains Mono` or `Fira Code` for permissions and code.
- **Authentication Handling**:
  - The frontend MUST maintain session state (JWT `access_token` in `localStorage` or `sessionStorage`).
  - Every API request that requires authentication MUST send the header:
    `Authorization: Bearer <token>`
  - Auto-login on initial page load using the 1-click `ceo` persona if no active token is stored, ensuring judges immediately see a fully populated, interactive dashboard without any login friction!

---

## 3. Required Features & UI Layout

### Screen Layout Structure
```
+-------------------------------------------------------------------------------------------------------+
| [AD] AccessDrift  | Branch: [Global HQ - NY ▼] | Trial: [CEO] [Admin] [Analyst] [Auditor] | RAM: 48MB |
+-------------------------------------------------------------------------------------------------------+
| METRICS RIBBON: [ 45 Monitored ]  [ 8 Drift Outliers ]  [ 3 High-Risk Critical ]  [ 37 Compliant ]    |
+-----------------------------------------------------------------------+-------------------------------+
| TOPOLOGY GRAPH & ACTIONS                                              | USER INSPECTOR & REMEDIATION  |
|                                                                       |                               |
| [Upload CSV Roster]  [+ Add Employee]  [Simulate Promotion] [Reset]   | [Employee Profile & Risk]     |
|                                                                       | Score: 92 (CRITICAL OUTLIER)  |
|                                                                       | Confidence: 94.2%             |
|                                                                       |                               |
|           (INTERACTIVE 2D FORCE-DIRECTED TOPOLOGY CANVAS)             | Drifted Entitlements:         |
|                                                                       |  [!] db:root                  |
|            (O) Peer Cluster: Engineering                              |  [!] k8s:admin                |
|                    \                                                  |                               |
|                    (X) Bob Vance [SUPERUSER DRIFT - RED GLOW]         | [ 1-Click Remediate Drift ]   |
|                    /                                                  |                               |
|            (O) Peer Cluster: DevOps                                   | Dual Policy Output:           |
|                                                                       | [ AWS IAM JSON ] [ IBM RACF ] |
| Controls: [+] [-] [Reset View] | Legend: (Compliant) (Warning) (Risk) |                               |
+-----------------------------------------------------------------------+-------------------------------+
| AUDIT LEDGER FOOTER: [Live CPACF SHA-256 Ledger (14 Blocks) - Integrity Verified]                     |
+-------------------------------------------------------------------------------------------------------+
```

---

### Key Interactive Components

#### 1. Presentation Auth Quick-Bar (Header)
- **1-Click Presentation Personas**:
  - Render 4 clickable role pills:
    - `👑 CEO (Executive)` → 1-click token for Victoria Sterling (`EXECUTIVE`)
    - `🛡️ Admin (SecOps)` → 1-click token for Sarah Connor (`ADMIN`)
    - `🔍 Analyst (Risk)` → 1-click token for Alex Mercer (`SECURITY_ANALYST`)
    - `📋 Auditor (Compliance)` → 1-click token for Marcus Vance (`AUDITOR`)
  - Clicking any persona executes:
    `POST /api/v1/auth/trial-login` with `{"persona": "<id>"}`
    Immediately updates the active user session badge, stores token, and refreshes all data.
- **Dynamic Presenter Registration Modal**:
  - Button: `"Judge / Evaluator Sign-In"`.
  - Opens modal asking for: `Full Name`, `Organization`, `Role (default: EXECUTIVE)`, `Branch`.
  - Submits to `POST /api/v1/auth/register-trial`.
  - Issues instant personalized JWT session with full multi-branch executive rights.
- **Current User Profile Chip**: Displays active user's name, role badge, and department.

#### 2. Multi-Branch Executive Dropdown Selector
- Dropdown selector populated dynamically from `GET /api/v1/branches`.
- Options:
  - `🌐 Global Enterprise (All Branches)`
  - `🏢 Global HQ - New York`
  - `🇬🇧 EMEA Operations - London`
  - `🇸🇬 APAC Tech Hub - Singapore`
  - `⚡ IBM Z Systems Lab - Poughkeepsie`
  - `🌎 Latin America Center - São Paulo`
- On change: Appends `?branch=<selected_branch>` to `/api/v1/topology` and `/api/v1/users`, seamlessly redrawing the graph and updating the metrics bar.

#### 3. Dynamic Roster Ingestion Drawer / Modal
Triggered via an **"Ingest Roster"** button:
- **Tab A: Batch CSV Upload**:
  - Drag-and-drop file upload zone accepting `.csv`.
  - Prominent button: **"Download IAM Template CSV"** (triggers browser download of `/api/v1/roster/csv-template`).
  - Toggle switch: `"Replace Entire Roster"` vs `"Merge / Upsert"`.
  - "Upload & Score Roster" button: Submits `multipart/form-data` to `POST /api/v1/roster/upload-csv`.
  - Shows success notification with: imported count, total active count, and number of ML anomalies detected!
- **Tab B: Manual Single-Employee Input**:
  - Form fields: Employee ID, Full Name, Role (select from known baselines), Department, Branch, Permissions (tag input or checkboxes of available system entitlements).
  - Submits to `POST /api/v1/roster/add-user`.
  - Automatically scores the user and places them in the topology graph.
- **Delete Employee**:
  - In the Inspector drawer, provide a "Remove Employee" button that calls `DELETE /api/v1/roster/users/{id}` (protected for `EXECUTIVE` and `ADMIN`).

#### 4. Force-Directed Topology Visualizer
- Visualizes employees and their entitlements as a force-directed graph.
- Nodes:
  - **User Nodes**: Circular nodes.
    - Green (`#10b981`): Compliant (Risk < 40).
    - Amber (`#f59e0b`): Warning (Risk 40–69).
    - Glowing Neon Red (`#da1e28`): High-Risk Drift Outlier (Risk ≥ 70).
  - **Permission Nodes**: Distinct diamond or hexagonal icon nodes.
- Links:
  - Normal links: Semi-transparent subtle blue lines.
  - Toxic / Drift links: Glowing red dotted or pulsing lines connecting superusers to anomalous permissions!
- Physics & Interactions:
  - Drag nodes to reposition.
  - Mouse wheel or zoom buttons `[+]` `[-]` `[Reset Zoom]`.
  - Click node: Selects employee and opens the User Inspector.

#### 5. User Inspector & Anomaly Explainability
When an employee is selected:
- **Header**: Name, ID, Role pill, Department, Branch.
- **Role Transition History**: Shows career path trail tags (e.g. `Senior Software Engineer ➔ Engineering Manager`).
- **Risk Score Gauge**: Circular or radial progress ring ($0 - 100$).
  - Displays risk badge: `COMPLIANT`, `MODERATE DRIFT`, or `SUPERUSER DRIFT (CRITICAL)`.
  - Shows Isolation Forest Anomaly Confidence percentage.
- **Entitlements Breakdown**:
  - **Drifted / Toxic Entitlements**: Highlighted in red with warning icons (e.g. `db:root`, `k8s:admin`, `cloud:iam_admin`).
  - **Baseline Role Entitlements**: Clean tags showing legitimate role permissions.
- **1-Click Remediation Button**:
  - Large button: `"Remediate Privilege Creep"`.
  - Blocked or disabled with tooltip if user's role is not `ADMIN` or `EXECUTIVE`.
  - On click: calls `POST /api/v1/remediate` with `{"user_id": "...", "strip_drift_only": true}`.
  - **Visual feedback**: Drops risk score to 0, removes red drift links on the graph, and populates the dual policy drawer.

#### 6. Dual Remediation Policy Output Drawer
- Tab 1: **AWS IAM JSON Policy**: Syntax-highlighted least-privilege JSON policy with a 1-click **"Copy to Clipboard"** button.
- Tab 2: **IBM Z RACF Mainframe Security Commands**: Exact mainframe terminal commands to revoke toxic permissions (e.g., `PERMIT ... DELETE`, `CONNECT ...`).

#### 7. What-If Role Promotion Simulator
- Allows the user to select any employee (e.g. an Engineer), choose a target role (e.g. `Engineering Manager`), and click `"Simulate Role Promotion"`.
- Calls `POST /api/v1/simulate/role-change`.
- Demonstrates to judges how privilege creep emerges in real time!

#### 8. CPACF Blockchain Audit Ledger & Memory Health
- **Live Memory Counter**: Polls `/api/v1/system/health` to display:
  `RAM RSS: ~50MB / 4096MB Budget` with a green pulse dot indicating native CPACF / OpenSSL crypto acceleration.
- **Audit Ledger Drawer / Modal**:
  - Button in footer or header: `"Audit Ledger"`.
  - Calls `GET /api/v1/audit-ledger`.
  - Displays tamper-evident blockchain blocks with cryptographic hashes (`SHA-256`), action types, timestamps, actors, and verification badge `"Chain Integrity: 100% Valid"`.

---

## 4. Complete Backend API Contracts

All endpoints are hosted at `http://localhost:8000`.

### A. Authentication & Personas
- **`GET /api/v1/auth/presentation-personas`**
  - Response:
    ```json
    {
      "personas": [
        {"id": "ceo", "name": "Victoria Sterling", "role": "EXECUTIVE", "department": "Executive Committee / CISO", "description": "Global multi-branch visibility, CSV upload, risk governance"},
        {"id": "admin", "name": "Sarah Connor", "role": "ADMIN", "department": "Security Operations", "description": "Full privilege remediation, simulation, user mutation, ledger access"},
        {"id": "analyst", "name": "Alex Mercer", "role": "SECURITY_ANALYST", "department": "Cybersecurity Risk", "description": "Triage anomaly scoring, role simulation, topology inspection"},
        {"id": "auditor", "name": "Marcus Vance", "role": "AUDITOR", "department": "Internal Audit & Compliance", "description": "Read-only ledger verification, immutable blockchain inspection"}
      ],
      "mode": "PRESENTATION_READY"
    }
    ```

- **`POST /api/v1/auth/trial-login`**
  - Request: `{"persona": "ceo"}` (or `"admin"`, `"analyst"`, `"auditor"`)
  - Response:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1Ni...",
      "token_type": "bearer",
      "expires_in": 28800,
      "user": {
        "username": "ceo",
        "name": "Victoria Sterling",
        "role": "EXECUTIVE",
        "department": "Executive Committee / CISO",
        "permissions": ["*"]
      }
    }
    ```

- **`POST /api/v1/auth/register-trial`**
  - Request:
    ```json
    {
      "full_name": "Dr. Aris Thorne",
      "organization": "IBM Cloud Security Lab",
      "email": "thorne@ibm.com",
      "role": "EXECUTIVE",
      "branch": "IBM Z Systems Lab - Poughkeepsie"
    }
    ```
  - Response: Same `LoginResponse` containing new JWT `access_token` and session info.

- **`POST /api/v1/auth/login`**
  - Request: `{"username": "admin", "password": "AccessDrift@Admin2026!"}`
  - Response: Same `LoginResponse`.

- **`GET /api/v1/auth/me`** (Header: `Authorization: Bearer <token>`)
  - Response: User session profile.

---

### B. Multi-Branch & Topology
- **`GET /api/v1/branches`** (Header: `Authorization: Bearer <token>`)
  - Response:
    ```json
    {
      "branches": [
        {"branch": "Global HQ - New York", "employee_count": 12, "drift_outliers": 2, "avg_risk_score": 28.4},
        {"branch": "EMEA Operations - London", "employee_count": 8, "drift_outliers": 1, "avg_risk_score": 19.5},
        {"branch": "APAC Tech Hub - Singapore", "employee_count": 8, "drift_outliers": 1, "avg_risk_score": 22.1},
        {"branch": "IBM Z Systems Lab - Poughkeepsie", "employee_count": 7, "drift_outliers": 1, "avg_risk_score": 31.0},
        {"branch": "Latin America Center - São Paulo", "employee_count": 5, "drift_outliers": 0, "avg_risk_score": 12.0}
      ],
      "total_branches": 5,
      "total_roster_count": 40
    }
    ```

- **`GET /api/v1/topology?branch=<optional_branch>`** (Header: `Authorization: Bearer <token>`)
  - Response:
    ```json
    {
      "nodes": [
        {
          "id": "usr_102",
          "name": "Bob Vance",
          "type": "user",
          "role": "Engineering Manager",
          "department": "Engineering",
          "branch": "Global HQ - New York",
          "risk_score": 92,
          "is_outlier": true,
          "divergence_score": 0.68,
          "permissions": ["jira:admin", "github:repo_write", "db:root"]
        },
        {
          "id": "perm_db_root",
          "name": "db:root",
          "type": "permission",
          "is_critical": true
        }
      ],
      "links": [
        {"source": "usr_102", "target": "perm_db_root", "is_drift": true}
      ],
      "summary": {
        "total_users": 40,
        "outlier_count": 5,
        "clean_count": 35,
        "high_risk_count": 3,
        "average_risk_score": 24.1
      },
      "active_branch": "all"
    }
    ```

- **`GET /api/v1/users?branch=<optional_branch>`** (Header: `Authorization: Bearer <token>`)
  - Returns complete analyzed employee roster with explainable metrics.

- **`GET /api/v1/users/{user_id}`** (Header: `Authorization: Bearer <token>`)
  - Returns detailed risk breakdown, role history, baseline comparison, and anomaly confidence.

---

### C. Dynamic Roster Ingestion
- **`GET /api/v1/roster/csv-template`**
  - Returns: `text/csv` downloadable template with columns:
    `id,name,role,department,branch,permissions`

- **`POST /api/v1/roster/upload-csv`** (Header: `Authorization: Bearer <token>`, Roles: `EXECUTIVE`, `ADMIN`)
  - Body: `FormData` with:
    - `file`: CSV file object
    - `branch`: optional default branch
    - `replace_roster`: `true` or `false`
  - Response:
    ```json
    {
      "status": "SUCCESS",
      "message": "Successfully ingested 25 employee records from 'roster.csv'.",
      "records_processed": 25,
      "total_active_users": 40,
      "outliers_detected": 4,
      "active_branches": [...]
    }
    ```

- **`POST /api/v1/roster/add-user`** (Header: `Authorization: Bearer <token>`, Roles: `EXECUTIVE`, `ADMIN`)
  - Request:
    ```json
    {
      "id": "usr_new_01",
      "name": "Evelyn Reed",
      "role": "Senior Software Engineer",
      "department": "Engineering",
      "branch": "Global HQ - New York",
      "permissions": ["github:repo_write", "code:review", "db:read", "db:root"]
    }
    ```
  - Response:
    ```json
    {
      "status": "SUCCESS",
      "message": "Employee Evelyn Reed successfully registered.",
      "user": { ...analyzed user with risk score and anomaly flags... },
      "total_active_users": 41
    }
    ```

- **`DELETE /api/v1/roster/users/{user_id}`** (Header: `Authorization: Bearer <token>`, Roles: `EXECUTIVE`, `ADMIN`)
  - Response: `{"status": "SUCCESS", "message": "User 'usr_new_01' removed from active roster."}`

---

### D. Governance, Remediation & Simulation
- **`POST /api/v1/remediate`** (Header: `Authorization: Bearer <token>`, Roles: `EXECUTIVE`, `ADMIN`)
  - Request:
    ```json
    {
      "user_id": "usr_102",
      "strip_drift_only": true
    }
    ```
  - Response:
    ```json
    {
      "user_id": "usr_102",
      "remediation_status": "SUCCESS",
      "pruned_permissions": ["db:root"],
      "retained_permissions": ["jira:admin", "github:repo_write", "code:review"],
      "previous_risk_score": 92,
      "new_risk_score": 0,
      "policies": {
        "aws_iam": { ...zero-trust JSON policy... },
        "ibm_racf": "/* IBM Z RACF Enterprise Least-Privilege Policy */\nPERMIT db:root CLASS(ACCESS) ID(usr_102) DELETE\n..."
      }
    }
    ```

- **`POST /api/v1/simulate/role-change`** (Header: `Authorization: Bearer <token>`, Roles: `EXECUTIVE`, `ADMIN`, `SECURITY_ANALYST`)
  - Request:
    ```json
    {
      "user_id": "usr_101",
      "new_role": "Engineering Manager"
    }
    ```
  - Response: Returns simulated user with new combined permissions showing how drift immediately emerges.

- **`POST /api/v1/reset`** (Header: `Authorization: Bearer <token>`, Roles: `EXECUTIVE`, `ADMIN`)
  - Restores the clean demo dataset.

- **`GET /api/v1/audit-ledger`** (Header: `Authorization: Bearer <token>`, Roles: `EXECUTIVE`, `ADMIN`, `AUDITOR`)
  - Returns complete cryptographic blockchain ledger and integrity check.

- **`GET /api/v1/system/health`** (No Auth required)
  - Returns memory RSS in MB, RAM budget, and hardware CPACF crypto mode.

---

## 5. Definition of Done & Success Criteria
1. The frontend boots cleanly when opening `http://localhost:8000` with no console errors.
2. The UI automatically activates an initial presentation session (or prompts for 1-click persona) without failing any API calls with 401 Unauthorized.
3. The 1-click persona bar allows swapping between CEO, Admin, Analyst, and Auditor in real time.
4. Changing the branch dropdown immediately updates the metrics, topology graph, and employee roster.
5. Ingesting a CSV template or uploading a CSV triggers real-time ML scoring and updates the graph without page reloads.
6. Clicking "Remediate" on an outlier animates the pruning of drift links, drops the risk score to 0, and displays both the AWS IAM JSON policy and IBM RACF mainframe commands.
7. Visual presentation looks slick, dark, cybernetic, and production-ready for an enterprise CISO and IBM hackathon evaluation!
```
