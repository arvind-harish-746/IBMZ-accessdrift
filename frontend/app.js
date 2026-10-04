/**
 * AccessDrift Zero-Trust Frontend Application
 * Ultra-Lean Pure Canvas Force Graph + Interactive Governance Controller
 */

// Application State
const state = {
  users: [],
  topology: { nodes: [], links: [] },
  summary: {},
  selectedUserId: null,
  remediationResult: null,
  policyTab: 'aws',
  
  // Canvas Viewport & Physics
  scale: 1.0,
  panX: 0,
  panY: 0,
  isDragging: false,
  draggedNode: null,
  hoveredNode: null,
  physicsAlpha: 1.0,
  animationFrameId: null
};

// DOM Elements
const canvas = document.getElementById('topology-canvas');
const ctx = canvas.getContext('2d');
const ramText = document.getElementById('ram-usage-text');
const cryptoBadgeText = document.getElementById('crypto-mode-text');
const metricTotal = document.getElementById('metric-total-users');
const metricOutliers = document.getElementById('metric-outliers');
const metricHighRisk = document.getElementById('metric-high-risk');
const metricClean = document.getElementById('metric-clean');

// User Inspector Elements
const emptyState = document.getElementById('no-user-selected');
const userContent = document.getElementById('user-selected-content');
const uName = document.getElementById('u-name');
const uRoleDept = document.getElementById('u-role-dept');
const uHistoryTags = document.getElementById('u-history-tags');
const uRiskScore = document.getElementById('u-risk-score');
const uRiskCircle = document.getElementById('u-risk-circle');
const uDriftCount = document.getElementById('u-drift-count');
const uDriftList = document.getElementById('u-drift-list');
const uActiveList = document.getElementById('u-active-list');
const userStatusPill = document.getElementById('user-status-pill');
const btnRemediate = document.getElementById('btn-remediate');
const policySection = document.getElementById('policy-output-section');
const policyCodeBlock = document.getElementById('policy-code-block');
const tabBtnAws = document.getElementById('tab-btn-aws');
const tabBtnRacf = document.getElementById('tab-btn-racf');

// Simulator Elements
const simUserSelect = document.getElementById('sim-user-select');
const simRoleSelect = document.getElementById('sim-role-select');
const btnSimulate = document.getElementById('btn-simulate-promo');
const btnReset = document.getElementById('reset-btn');
const auditStream = document.getElementById('audit-stream');
const ledgerCount = document.getElementById('ledger-count');

// --- 1. Initialization & API Fetching ---

async function initApp() {
  setupCanvas();
  setupEventListeners();
  await refreshData();
  await refreshAuditLedger();
  await checkSystemHealth();
  
  // Poll system health every 4s
  setInterval(checkSystemHealth, 4000);
}

async function refreshData() {
  try {
    const res = await fetch('/api/v1/users');
    const data = await res.json();
    state.users = data.users;
    state.summary = data.summary;

    updateMetrics(data.summary);
    populateSimulatorDropdowns(data.users, data.available_roles);

    const topoRes = await fetch('/api/v1/topology');
    const topoData = await topoRes.json();
    initTopologyNodes(topoData.nodes, topoData.links);

    // Auto-select Bob Vance if available for quick demo hook
    if (!state.selectedUserId) {
      const bob = state.users.find(u => u.name.includes("Bob Vance"));
      if (bob) selectUser(bob.id);
    } else {
      selectUser(state.selectedUserId);
    }
  } catch (err) {
    console.error("Failed to load topology data:", err);
  }
}

async function checkSystemHealth() {
  try {
    const res = await fetch('/api/v1/system/health');
    const health = await res.json();
    ramText.textContent = `${health.memory_rss_mb} MB`;
    cryptoBadgeText.textContent = health.crypto_mode;
  } catch (err) {
    ramText.textContent = "Offline";
  }
}

async function refreshAuditLedger() {
  try {
    const res = await fetch('/api/v1/audit-ledger');
    const data = await res.json();
    ledgerCount.textContent = `${data.total_blocks} Blocks`;
    
    auditStream.innerHTML = '';
    // Show latest blocks first
    [...data.ledger].reverse().forEach(block => {
      const el = document.createElement('div');
      el.className = 'audit-entry';
      const timeStr = new Date(block.timestamp * 1000).toLocaleTimeString();
      el.innerHTML = `
        <div class="audit-entry-head">
          <strong>#${block.index} ${block.action}</strong>
          <span>${timeStr}</span>
        </div>
        <div class="audit-entry-hash">SHA256: ${block.block_hash.substring(0, 24)}...</div>
      `;
      auditStream.appendChild(el);
    });
  } catch (err) {
    console.error("Failed to load audit ledger:", err);
  }
}

function updateMetrics(summary) {
  if (!summary) return;
  metricTotal.textContent = summary.total_users;
  metricOutliers.textContent = summary.outliers_detected;
  metricHighRisk.textContent = summary.high_risk_users;
  metricClean.textContent = summary.clean_users;
}

function populateSimulatorDropdowns(users, roles) {
  simUserSelect.innerHTML = '';
  users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.name} (${u.role})`;
    simUserSelect.appendChild(opt);
  });

  simRoleSelect.innerHTML = '';
  roles.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    simRoleSelect.appendChild(opt);
  });
}

// --- 2. Canvas Force-Directed Graph Layout ---

function setupCanvas() {
  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    if (state.topology.nodes.length > 0) wakePhysics();
  };
  window.addEventListener('resize', resize);
  resize();
}

function initTopologyNodes(rawNodes, rawLinks) {
  const width = canvas.width || 800;
  const height = canvas.height || 500;
  const existingMap = new Map(state.topology.nodes.map(n => [n.id, n]));

  // Preserve existing positions if available, otherwise cluster by role/type
  const nodes = rawNodes.map((n, idx) => {
    const existing = existingMap.get(n.id);
    if (existing) {
      return { ...n, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy };
    }
    const angle = (idx / rawNodes.length) * 2 * Math.PI;
    const radius = n.type === 'permission' ? 120 + Math.random() * 60 : 200 + Math.random() * 80;
    return {
      ...n,
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0
    };
  });

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const links = rawLinks.map(l => ({
    ...l,
    sourceNode: nodeMap.get(typeof l.source === 'object' ? l.source.id : l.source),
    targetNode: nodeMap.get(typeof l.target === 'object' ? l.target.id : l.target)
  })).filter(l => l.sourceNode && l.targetNode);

  state.topology = { nodes, links };
  wakePhysics();
}

function wakePhysics() {
  state.physicsAlpha = 1.0;
  if (!state.animationFrameId) {
    state.animationFrameId = requestAnimationFrame(simulationStep);
  }
}

function simulationStep() {
  const { nodes, links } = state.topology;
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;

  if (nodes.length === 0) {
    state.animationFrameId = null;
    return;
  }

  // Node-Node Repulsion
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy || 1;
      const dist = Math.sqrt(distSq);
      
      const repulse = 4000 / (distSq + 100);
      const fx = (dx / dist) * repulse * state.physicsAlpha;
      const fy = (dy / dist) * repulse * state.physicsAlpha;

      if (a !== state.draggedNode) { a.vx -= fx; a.vy -= fy; }
      if (b !== state.draggedNode) { b.vx += fx; b.vy += fy; }
    }
  }

  // Link Springs
  for (const link of links) {
    const a = link.sourceNode;
    const b = link.targetNode;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const targetDist = link.is_drift ? 180 : 90;
    const force = (dist - targetDist) * 0.03 * state.physicsAlpha;

    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    if (a !== state.draggedNode) { a.vx += fx; a.vy += fy; }
    if (b !== state.draggedNode) { b.vx -= fx; b.vy -= fy; }
  }

  // Center Gravity & Velocity Integration
  for (const n of nodes) {
    if (n === state.draggedNode) continue;
    
    // Gravity toward center
    n.vx += (cx - n.x) * 0.005 * state.physicsAlpha;
    n.vy += (cy - n.y) * 0.005 * state.physicsAlpha;

    // Friction damping
    n.vx *= 0.85;
    n.vy *= 0.85;

    n.x += n.vx;
    n.y += n.vy;
  }

  renderCanvas();

  // Energy cooling (cools down to 0 to save CPU/RAM)
  state.physicsAlpha *= 0.96;
  if (state.physicsAlpha > 0.005 || state.isDragging) {
    state.animationFrameId = requestAnimationFrame(simulationStep);
  } else {
    state.animationFrameId = null;
  }
}

function renderCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(state.panX, state.panY);
  ctx.scale(state.scale, state.scale);

  const { nodes, links } = state.topology;

  // 1. Draw Links
  for (const link of links) {
    const a = link.sourceNode;
    const b = link.targetNode;
    if (!a || !b) continue;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);

    if (link.is_drift) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
    } else {
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2. Draw Nodes
  for (const node of nodes) {
    const isSelected = state.selectedUserId === node.id;
    const isHovered = state.hoveredNode === node;

    ctx.beginPath();
    if (node.type === 'permission') {
      // Permission Node: Diamond / Square
      const size = node.is_critical ? 14 : 10;
      ctx.fillStyle = node.is_critical ? '#F59E0B' : '#00F0FF';
      ctx.rect(node.x - size / 2, node.y - size / 2, size, size);
      ctx.fill();

      // Label
      ctx.fillStyle = '#94A3B8';
      ctx.font = '9px monospace';
      ctx.fillText(node.name, node.x + 10, node.y + 3);
    } else {
      // User Node: Circle
      const radius = isSelected ? 12 : (node.is_outlier ? 10 : 7);
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

      if (node.is_outlier) {
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = isSelected ? 16 : 8;
      } else {
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = isSelected ? 12 : 2;
      }
      ctx.fill();
      ctx.shadowBlur = 0; // reset blur

      if (isSelected) {
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // User Label
      ctx.fillStyle = isSelected ? '#FFF' : '#CBD5E1';
      ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.fillText(node.name, node.x + 12, node.y + 4);
    }
  }

  ctx.restore();
}

// --- 3. User Selection & Remediation Logic ---

function selectUser(userId) {
  state.selectedUserId = userId;
  const user = state.users.find(u => u.id === userId);
  
  if (!user) {
    emptyState.style.display = 'block';
    userContent.style.display = 'none';
    userStatusPill.textContent = 'Select a node';
    return;
  }

  emptyState.style.display = 'none';
  userContent.style.display = 'flex';

  uName.textContent = user.name;
  uRoleDept.textContent = `${user.role} • ${user.department}`;
  
  // Role History Tags
  uHistoryTags.innerHTML = '';
  (user.role_history || [user.role]).forEach(r => {
    const span = document.createElement('span');
    span.className = 'role-tag';
    span.textContent = r;
    uHistoryTags.appendChild(span);
  });

  // Risk Score Gauge
  uRiskScore.textContent = user.risk_score;
  if (user.risk_score < 40) {
    uRiskCircle.className = 'risk-gauge-circle safe';
    userStatusPill.textContent = 'Zero-Trust Compliant';
    userStatusPill.style.color = '#10B981';
  } else {
    uRiskCircle.className = 'risk-gauge-circle';
    userStatusPill.textContent = 'High Drift Outlier';
    userStatusPill.style.color = '#EF4444';
  }

  // Drift List
  uDriftCount.textContent = user.drift_permissions.length;
  uDriftList.innerHTML = '';
  if (user.drift_permissions.length === 0) {
    uDriftList.innerHTML = '<span class="section-help">No anomalous permissions detected.</span>';
    btnRemediate.disabled = true;
    btnRemediate.textContent = '✓ User is Fully Compliant';
  } else {
    user.drift_permissions.forEach(p => {
      const tag = document.createElement('span');
      tag.className = 'tag tag-danger';
      tag.textContent = `❌ ${p}`;
      uDriftList.appendChild(tag);
    });
    btnRemediate.disabled = false;
    btnRemediate.textContent = `🛡️ Auto-Remediate (${user.drift_permissions.length} Drift Entitlements)`;
  }

  // Active / Authorized List
  uActiveList.innerHTML = '';
  const authorized = user.permissions.filter(p => !user.drift_permissions.includes(p));
  authorized.forEach(p => {
    const tag = document.createElement('span');
    tag.className = 'tag tag-success';
    tag.textContent = `✓ ${p}`;
    uActiveList.appendChild(tag);
  });

  // Hide policy until remediated
  if (!state.remediationResult || state.remediationResult.user_id !== userId) {
    policySection.style.display = 'none';
  }

  renderCanvas();
}

async function executeAutoRemediation() {
  if (!state.selectedUserId) return;
  const targetId = state.selectedUserId;

  // Optimistic UI update (Instant gratification)
  const user = state.users.find(u => u.id === targetId);
  if (user) {
    user.risk_score = 12;
    user.drift_permissions = [];
    selectUser(targetId);
  }

  try {
    const res = await fetch('/api/v1/remediate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: targetId, strip_drift_only: true })
    });

    if (!res.ok) throw new Error('Remediation API returned error');

    const result = await res.json();
    state.remediationResult = result;

    // Show Policy Output
    policySection.style.display = 'block';
    renderPolicyCode();

    // Refresh full topology and audit trail
    await refreshData();
    await refreshAuditLedger();
  } catch (err) {
    console.error("Remediation failed, rolling back:", err);
    await refreshData();
  }
}

function renderPolicyCode() {
  if (!state.remediationResult) return;
  if (state.policyTab === 'aws') {
    policyCodeBlock.textContent = JSON.stringify(state.remediationResult.remediated_policy_json, null, 2);
  } else {
    policyCodeBlock.textContent = (state.remediationResult.racf_script || []).join('\n');
  }
}

// --- 4. Simulator & Reset Handlers ---

async function executeRoleSimulation() {
  const userId = simUserSelect.value;
  const newRole = simRoleSelect.value;
  if (!userId || !newRole) return;

  btnSimulate.disabled = true;
  btnSimulate.textContent = 'Simulating Transition...';

  try {
    const res = await fetch('/api/v1/simulate/role-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, new_role: newRole })
    });
    const data = await res.json();
    state.selectedUserId = userId;
    await refreshData();
    await refreshAuditLedger();
  } catch (err) {
    console.error("Simulation error:", err);
  } finally {
    btnSimulate.disabled = false;
    btnSimulate.textContent = 'Simulate Role Transition';
  }
}

async function executeResetDataset() {
  if (!confirm('Reset enterprise identities back to pristine demo state?')) return;
  try {
    await fetch('/api/v1/reset', { method: 'POST' });
    state.remediationResult = null;
    await refreshData();
    await refreshAuditLedger();
  } catch (err) {
    console.error("Reset failed:", err);
  }
}

// --- 5. Event Listeners & Interaction ---

function setupEventListeners() {
  btnRemediate.addEventListener('click', executeAutoRemediation);
  btnSimulate.addEventListener('click', executeRoleSimulation);
  btnReset.addEventListener('click', executeResetDataset);

  tabBtnAws.addEventListener('click', () => {
    state.policyTab = 'aws';
    tabBtnAws.className = 'tab-btn active';
    tabBtnRacf.className = 'tab-btn';
    renderPolicyCode();
  });

  tabBtnRacf.addEventListener('click', () => {
    state.policyTab = 'racf';
    tabBtnRacf.className = 'tab-btn active';
    tabBtnAws.className = 'tab-btn';
    renderPolicyCode();
  });

  // Canvas Mouse Events (Drag, Pan, Select)
  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - state.panX) / state.scale;
    const y = (e.clientY - rect.top - state.panY) / state.scale;

    const clickedNode = state.topology.nodes.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 15;
    });

    if (clickedNode) {
      if (clickedNode.type === 'user') {
        selectUser(clickedNode.id);
      }
      state.draggedNode = clickedNode;
      state.isDragging = true;
      wakePhysics();
    } else {
      state.isDragging = false;
    }
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - state.panX) / state.scale;
    const y = (e.clientY - rect.top - state.panY) / state.scale;

    if (state.isDragging && state.draggedNode) {
      state.draggedNode.x = x;
      state.draggedNode.y = y;
      wakePhysics();
    }
  });

  window.addEventListener('mouseup', () => {
    state.isDragging = false;
    state.draggedNode = null;
  });

  // Zoom controls
  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    state.scale = Math.min(2.0, state.scale * 1.2);
    renderCanvas();
  });
  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    state.scale = Math.max(0.4, state.scale / 1.2);
    renderCanvas();
  });
  document.getElementById('btn-reset-zoom').addEventListener('click', () => {
    state.scale = 1.0;
    state.panX = 0;
    state.panY = 0;
    wakePhysics();
  });
}

// Start app on DOM load
document.addEventListener('DOMContentLoaded', initApp);
