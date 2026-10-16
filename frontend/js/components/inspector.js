/**
 * Identity Inspector & Explainable AI (XAI) Component
 */
import { state } from '../state.js';
import { api } from '../api.js';
import { showToast, escapeHtml } from './toast.js';
import { drawFrame } from './graph.js';

export function selectUser(userId, onDataRefresh) {
  state.selectedUserId = userId;
  const user = state.users.find(u => u.id === userId);

  const emptyState = document.getElementById('no-user-selected');
  const userContent = document.getElementById('user-selected-content');
  const statusPill = document.getElementById('user-status-pill');

  if (!user) {
    if (emptyState) emptyState.style.display = 'flex';
    if (userContent) userContent.style.display = 'none';
    if (statusPill) {
      statusPill.textContent = 'Select a node';
      statusPill.style.color = 'var(--text-muted)';
    }
    drawFrame();
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (userContent) userContent.style.display = 'flex';

  // Profile metadata
  document.getElementById('u-name').textContent = user.name;
  document.getElementById('u-id').textContent = user.id;
  document.getElementById('u-role-dept').textContent = `${user.role} • ${user.department}`;
  document.getElementById('u-branch').textContent = user.branch || "Global Enterprise";

  // Career progression trail
  const historyContainer = document.getElementById('u-history-tags');
  if (historyContainer) {
    historyContainer.innerHTML = '';
    const history = user.role_history && user.role_history.length > 0 ? user.role_history : [user.role];
    history.forEach((r, idx) => {
      const isCurrent = idx === history.length - 1;
      const tag = document.createElement('span');
      tag.className = isCurrent ? 'role-trail-tag current' : 'role-trail-tag';
      tag.textContent = r;
      historyContainer.appendChild(tag);

      if (!isCurrent) {
        const arrow = document.createElement('span');
        arrow.className = 'trail-arrow';
        arrow.textContent = '➔';
        historyContainer.appendChild(arrow);
      }
    });
  }

  // Risk Score Radial Gauge
  const score = user.risk_score || 0;
  document.getElementById('u-risk-score').textContent = score;

  const ringFill = document.getElementById('u-risk-ring-fill');
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;
  if (ringFill) {
    ringFill.style.strokeDasharray = `${circumference} ${circumference}`;
    ringFill.style.strokeDashoffset = offset;
  }

  const riskLabel = document.getElementById('u-risk-label');
  if (score >= 70) {
    if (ringFill) ringFill.style.stroke = 'var(--red-threat)';
    if (riskLabel) { riskLabel.textContent = 'CRITICAL DRIFT'; riskLabel.style.color = 'var(--red-pulse)'; }
    if (statusPill) { statusPill.textContent = 'High Drift Outlier'; statusPill.style.color = 'var(--red-pulse)'; }
  } else if (score >= 40) {
    if (ringFill) ringFill.style.stroke = 'var(--amber-warning)';
    if (riskLabel) { riskLabel.textContent = 'MODERATE DRIFT'; riskLabel.style.color = 'var(--amber-warning)'; }
    if (statusPill) { statusPill.textContent = 'Warning Drift'; statusPill.style.color = 'var(--amber-warning)'; }
  } else {
    if (ringFill) ringFill.style.stroke = 'var(--green-compliant)';
    if (riskLabel) { riskLabel.textContent = 'COMPLIANT'; riskLabel.style.color = 'var(--green-compliant)'; }
    if (statusPill) { statusPill.textContent = 'Zero-Trust Compliant'; statusPill.style.color = 'var(--green-compliant)'; }
  }

  const confidence = user.anomaly_score 
    ? Math.min(99.2, (0.85 + Math.abs(user.anomaly_score) * 0.15) * 100).toFixed(1) 
    : "94.2";
  document.getElementById('u-confidence-label').textContent = `ML Confidence: ${confidence}%`;

  // Toxic Drift Entitlements
  const driftList = user.drift_permissions || [];
  document.getElementById('u-drift-count').textContent = driftList.length;
  const driftContainer = document.getElementById('u-drift-list');
  driftContainer.innerHTML = '';

  const remediateBtn = document.getElementById('btn-remediate');

  if (driftList.length === 0) {
    driftContainer.innerHTML = '<span style="font-size: 10px; color: var(--green-compliant);">✓ Least privilege verified. No anomalous entitlements.</span>';
    if (remediateBtn) {
      remediateBtn.disabled = true;
      remediateBtn.textContent = '✓ Entitlements Fully Compliant';
    }
  } else {
    driftList.forEach(p => {
      const chip = document.createElement('span');
      chip.className = 'entitlement-chip danger';
      chip.textContent = `❌ ${p}`;
      chip.title = 'Entitlement outside peer baseline (Toxic privilege creep)';
      driftContainer.appendChild(chip);
    });

    if (remediateBtn) {
      const role = state.currentUser ? state.currentUser.role : 'AUDITOR';
      const canMutate = role === 'ADMIN' || role === 'EXECUTIVE';
      remediateBtn.disabled = !canMutate;
      remediateBtn.textContent = `🛡️ Remediate Privilege Creep (${driftList.length} Entitlements)`;
    }
  }

  // Authorized Baseline Entitlements
  const activeList = (user.permissions || []).filter(p => !driftList.includes(p));
  const activeContainer = document.getElementById('u-active-list');
  activeContainer.innerHTML = '';
  activeList.forEach(p => {
    const chip = document.createElement('span');
    chip.className = 'entitlement-chip success';
    chip.textContent = `✓ ${p}`;
    activeContainer.appendChild(chip);
  });

  // Dual Policy Drawer
  const policySection = document.getElementById('policy-output-section');
  if (state.remediationResult && state.remediationResult.user_id === userId) {
    policySection.style.display = 'block';
    renderPolicyCode();
  } else {
    policySection.style.display = 'none';
  }

  drawFrame();
}

export async function executeRemediation(onSuccess) {
  if (!state.selectedUserId) return;
  const targetId = state.selectedUserId;
  const user = state.users.find(u => u.id === targetId);

  const btn = document.getElementById('btn-remediate');
  btn.disabled = true;
  btn.textContent = 'Pruning Privileges & Synthesizing Policies...';

  try {
    const result = await api.remediate(targetId, true);
    state.remediationResult = result;

    // Confetti celebration if available
    if (window.confetti) {
      window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }

    showToast(`Remediated privilege creep for ${user ? user.name : targetId}!`, 'success');

    if (user) {
      user.risk_score = result.new_risk_score;
      user.drift_permissions = [];
      user.is_outlier = false;
      user.permissions = result.retained_permissions;
    }

    document.getElementById('policy-output-section').style.display = 'block';
    renderPolicyCode();

    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(`Remediation failed: ${err.message}`, 'error');
  } finally {
    selectUser(targetId);
  }
}

export function renderPolicyCode() {
  if (!state.remediationResult) return;
  const codeBlock = document.getElementById('policy-code-block');
  if (!codeBlock) return;

  if (state.policyTab === 'aws') {
    codeBlock.textContent = JSON.stringify(state.remediationResult.remediated_policy_json, null, 2);
  } else {
    const racf = state.remediationResult.racf_script;
    codeBlock.textContent = Array.isArray(racf) ? racf.join('\n') : String(racf);
  }
}
