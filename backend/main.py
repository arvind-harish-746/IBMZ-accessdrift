"""
AccessDrift Enterprise API Gateway
FastAPI application providing zero-trust drift detection, force topology data, and 1-click remediation.
"""

import copy
import os
import resource
import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .crypto import crypto_vault
from .data_generator import get_initial_dataset, ALL_PERMISSIONS, ROLE_BASELINES
from .engine import AnomalyEngine
from .remediation import RemediationManager

app = FastAPI(
    title="AccessDrift Security Governance API",
    description="Continuous Identity Entitlement Drift Detection & Zero-Trust Governance",
    version="1.0.0"
)

# Enable CORS for local dev and embedded web UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory State & Engine Singletons
users_db: List[Dict[str, Any]] = get_initial_dataset()
engine = AnomalyEngine()
remediation_mgr = RemediationManager(engine)
start_time = time.time()


# Pydantic Request Models
class RemediateRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64, description="Unique user identifier (e.g. usr_102)")
    strip_drift_only: bool = Field(default=True, description="Whether to remove only anomalous permissions")


class RoleChangeSimulationRequest(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)
    new_role: str = Field(..., min_length=1, max_length=100)
    new_department: Optional[str] = Field(default=None, max_length=100)


def get_current_memory_mb() -> float:
    """Returns current process Resident Set Size (RSS) in Megabytes on Linux."""
    try:
        # ru_maxrss is in Kilobytes on Linux
        usage_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return round(usage_kb / 1024.0, 2)
    except Exception:
        return 0.0


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Get absolute path to frontend
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")



@app.get("/")
def read_root():
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "service": "AccessDrift",
        "tagline": "Continuous Identity Entitlement Drift Detection & Zero-Trust Governance",
        "crypto_mode": crypto_vault.mode_description,
        "status": "HEALTHY",
        "memory_rss_mb": get_current_memory_mb()
    }



@app.get("/api/v1/topology")
def get_topology():
    """
    Returns node-link graph data contract for force-directed graph visualizer.
    """
    analysis = engine.analyze_enterprise_topology(users_db)
    return {
        "nodes": analysis["topology"]["nodes"],
        "links": analysis["topology"]["links"],
        "summary": analysis["summary"]
    }


@app.get("/api/v1/users")
def get_users():
    """
    Returns full analyzed employee roster with risk scores, peer divergence, and drift flags.
    """
    analysis = engine.analyze_enterprise_topology(users_db)
    return {
        "users": analysis["users"],
        "summary": analysis["summary"],
        "available_roles": list(ROLE_BASELINES.keys())
    }


@app.get("/api/v1/users/{user_id}")
def get_user_detail(user_id: str):
    """
    Returns detailed risk profile and explainable AI metrics for a specific employee.
    """
    analysis = engine.analyze_enterprise_topology(users_db)
    user = next((u for u in analysis["users"] if u["id"] == user_id), None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found."
        )
    return user


@app.post("/api/v1/remediate")
def remediate_user(req: RemediateRequest):
    """
    Executes 1-click privilege pruning, calculates post-remediation score,
    emits zero-trust AWS IAM JSON policy, and logs to CPACF audit vault.
    """
    try:
        result = remediation_mgr.execute_remediation(
            user_id=req.user_id,
            all_users=users_db,
            strip_drift_only=req.strip_drift_only
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Remediation error: {str(e)}"
        )


@app.post("/api/v1/simulate/role-change")
def simulate_role_change(req: RoleChangeSimulationRequest):
    """
    Simulates employee role promotion/transfer, retaining previous permissions to demonstrate drift emergence.
    """
    target = next((u for u in users_db if u["id"] == req.user_id), None)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User '{req.user_id}' not found.")

    old_role = target["role"]
    target["role"] = req.new_role
    if req.new_department:
        target["department"] = req.new_department
    elif req.new_role in ROLE_BASELINES:
        target["department"] = ROLE_BASELINES[req.new_role]["department"]

    if "role_history" not in target:
        target["role_history"] = [old_role]
    target["role_history"].append(req.new_role)

    # Add baseline permissions of new role while keeping old permissions (creating natural drift)
    if req.new_role in ROLE_BASELINES:
        new_baseline = ROLE_BASELINES[req.new_role]["baseline_permissions"]
        for p in new_baseline:
            if p not in target["permissions"]:
                target["permissions"].append(p)

    # Record in audit log
    crypto_vault.record_audit_action(
        action="ROLE_TRANSITION_SIMULATION",
        actor="ADMIN_SIMULATOR",
        details={
            "user_id": target["id"],
            "previous_role": old_role,
            "new_role": req.new_role,
            "permissions_count": len(target["permissions"])
        }
    )

    # Re-analyze topology
    analysis = engine.analyze_enterprise_topology(users_db)
    updated_user = next((u for u in analysis["users"] if u["id"] == req.user_id), None)
    return {
        "status": "SUCCESS",
        "message": f"Simulated promotion of {target['name']} to {req.new_role}",
        "user": updated_user
    }


@app.post("/api/v1/reset")
def reset_dataset():
    """
    Restores initial pristine dataset for repeated live demonstrations.
    """
    global users_db
    users_db = get_initial_dataset()
    crypto_vault.record_audit_action(
        action="DATASET_RESET",
        actor="SYSTEM_DEMO",
        details={"total_users": len(users_db)}
    )
    return {"status": "SUCCESS", "message": "Enterprise identity dataset reset to initial state."}


@app.get("/api/v1/audit-ledger")
def get_audit_ledger():
    """
    Returns full immutable cryptographic audit ledger with verification status.
    """
    is_valid = crypto_vault.verify_ledger_integrity()
    return {
        "ledger": crypto_vault.audit_ledger,
        "total_blocks": len(crypto_vault.audit_ledger),
        "chain_integrity_valid": is_valid,
        "crypto_mode": crypto_vault.mode_description
    }


@app.get("/api/v1/system/health")
def get_system_health():
    """
    Returns real-time memory usage and system health metrics.
    """
    return {
        "status": "HEALTHY",
        "uptime_seconds": round(time.time() - start_time, 1),
        "memory_rss_mb": get_current_memory_mb(),
        "ram_budget_mb": 4096.0,
        "ram_consumption_percent": round((get_current_memory_mb() / 4096.0) * 100, 3),
        "crypto_mode": crypto_vault.mode_description,
        "total_active_users": len(users_db)
    }
