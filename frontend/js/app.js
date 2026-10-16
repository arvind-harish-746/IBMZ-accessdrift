/**
 * AccessDrift Main Application Coordinator
 */
import { state } from './state.js';
import { api } from './api.js';
import { renderAuthPage, signOut } from './components/auth.js';
import { initGraphCanvas, loadTopologyData, drawFrame } from './components/graph.js';
import { selectUser, executeRemediation, renderPolicyCode } from './components/inspector.js';
import { renderRosterTable } from './components/roster-table.js';
import { updateOnboardingBanner, promptAddBranch } from './components/onboarding.js';
import { initModals, openModal, closeModal, loadLedgerBlocks } from './components/modals.js';
import { showToast, escapeHtml } from './components/toast.js';

// Bootstrap App
async function init() {
  // Check session
  if (!state.token) {
    showAuthView();
  } else {
    try {
      const me = await api.getMe();
      state.currentUser = me;
      state.isAuthenticated = true;
      showDashboardView();
      await loadEnterpriseData();
    } catch (err) {
      console.warn("Stored session invalid, showing login screen:", err);
      showAuthView();
    }
  }

  setupGlobalEventListeners();
  setInterval(pollSystemHealth, 4000);
}

function showAuthView() {
  document.getElementById('dashboard-view-container').style.display = 'none';
  const authContainer = document.getElementById('auth-view-container');
  authContainer.style.display = 'flex';
  renderAuthPage(async (isDemo) => {
    showDashboardView();
    await loadEnterpriseData();
  });
}

function showDashboardView() {
  document.getElementById('auth-view-container').style.display = 'none';
  document.getElementById('dashboard-view-container').style.display = 'flex';
  updateUserUI();

  const canvas = document.getElementById('topology-canvas');
  if (canvas) {
    initGraphCanvas(canvas, (userId) => {
      selectUser(userId, loadEnterpriseData);
    });
  }

  initModals(loadEnterpriseData);
}

function updateUserUI() {
  const u = state.currentUser;
  if (!u) return;

  document.getElementById('current-user-name').textContent = u.name;
  document.getElementById('current-user-role-badge').textContent = u.role;
  document.getElementById('current-user-dept').textContent = u.department;

  const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('current-user-avatar').textContent = initials;
}

export async function loadEnterpriseData() {
  try {
    // 1. Branches
    const branchesData = await api.getBranches();
    state.branches = branchesData.branches || [];

    const branchSelect = document.getElementById('branch-select');
    branchSelect.innerHTML = '<option value="all">🌐 Global Enterprise (All Branches)</option>';
    state.branches.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.branch;
      opt.textContent = `${b.branch} (${b.total_employees} staff, ${b.outliers_detected} outliers)`;
      branchSelect.appendChild(opt);
    });
    branchSelect.value = state.selectedBranch;

    // Populate modal branch selectors
    ['csv-branch-select', 'new-emp-branch'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '';
        state.branches.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b.branch;
          opt.textContent = b.branch;
          el.appendChild(opt);
        });
      }
    });

    // 2. Users
    const usersData = await api.getUsers(state.selectedBranch);
    state.users = usersData.users || [];
    state.summary = usersData.summary || {};
    state.availableRoles = usersData.available_roles || [];
    state.availableBranches = usersData.available_branches || [];

    updateMetricsRibbon(usersData.summary);
    updateOnboardingBanner(loadEnterpriseData);
    renderRosterTable((userId) => selectUser(userId, loadEnterpriseData));
    populateRoleDropdowns();

    // 3. Topology
    const topoData = await api.getTopology(state.selectedBranch);
    loadTopologyData(topoData.nodes || [], topoData.links || []);

    document.getElementById('graph-scope-badge').textContent = state.selectedBranch === 'all'
      ? 'Global Enterprise'
      : state.selectedBranch;
    document.getElementById('graph-nodes-count').textContent = `${(topoData.nodes || []).length} Nodes`;

    // 4. Default user selection (e.g. Bob Vance in demo or first user)
    if (state.users.length > 0) {
      if (!state.selectedUserId || !state.users.some(u => u.id === state.selectedUserId)) {
        const bob = state.users.find(u => u.name.includes("Bob Vance"));
        selectUser(bob ? bob.id : state.users[0].id, loadEnterpriseData);
      } else {
        selectUser(state.selectedUserId, loadEnterpriseData);
      }
    } else {
      selectUser(null);
    }

    await pollSystemHealth();
  } catch (err) {
    console.error("Failed to load enterprise data:", err);
  }
}

function updateMetricsRibbon(summary) {
  if (!summary) return;
  document.getElementById('metric-total-users').textContent = summary.total_users || 0;
  document.getElementById('metric-outliers').textContent = summary.outliers_detected || 0;
  document.getElementById('metric-high-risk').textContent = summary.high_risk_users || 0;
  document.getElementById('metric-clean').textContent = summary.clean_users || 0;

  const pct = summary.total_users > 0 
    ? Math.round((summary.clean_users / summary.total_users) * 100) 
    : 100;
  document.getElementById('metric-clean-pct').textContent = `${pct}% Compliant`;
}

function populateRoleDropdowns() {
  const roles = state.availableRoles || [];

  // Table filter
  const tableFilter = document.getElementById('table-filter-role');
  if (tableFilter && tableFilter.options.length <= 1) {
    roles.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      tableFilter.appendChild(opt);
    });
  }

  // Modals
  const simRole = document.getElementById('sim-modal-role-select');
  const simUser = document.getElementById('sim-modal-user-select');
  const newRole = document.getElementById('new-emp-role');

  if (simRole) {
    simRole.innerHTML = '';
    roles.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      simRole.appendChild(opt);
    });
  }

  if (simUser) {
    simUser.innerHTML = '';
    state.users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = `${u.name} (${u.role})`;
      simUser.appendChild(opt);
    });
  }

  if (newRole) {
    newRole.innerHTML = '';
    roles.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      newRole.appendChild(opt);
    });
  }

  // Permissions checkbox grid
  const permGrid = document.getElementById('new-emp-perms-grid');
  if (permGrid && permGrid.children.length === 0) {
    state.standardPermissions.forEach(p => {
      const label = document.createElement('label');
      label.className = `perm-cb-label ${p.critical ? 'critical' : ''}`;
      label.innerHTML = `
        <input type="checkbox" name="emp-permission" value="${p.id}" />
        <span>${p.name} ${p.critical ? '⚠️' : ''}</span>
      `;
      permGrid.appendChild(label);
    });
  }
}

async function pollSystemHealth() {
  try {
    const health = await api.getHealth();
    document.getElementById('ram-usage-text').textContent = `${health.memory_rss_mb} MB`;
    document.getElementById('crypto-mode-text').textContent = health.crypto_mode;
    document.getElementById('footer-crypto-mode').textContent = health.crypto_mode;
  } catch (e) {}
}

function setupGlobalEventListeners() {
  // Sign Out
  document.getElementById('btn-header-signout')?.addEventListener('click', () => {
    signOut(async (isDemo) => {
      showDashboardView();
      await loadEnterpriseData();
    });
  });

  // Branch selector
  document.getElementById('branch-select')?.addEventListener('change', (e) => {
    state.selectedBranch = e.target.value;
    loadEnterpriseData();
  });

  // Add Branch prompt button
  document.getElementById('btn-add-branch-quick')?.addEventListener('click', () => {
    promptAddBranch(loadEnterpriseData);
  });

  // Switch to demo dataset button in header
  document.getElementById('btn-switch-demo')?.addEventListener('click', async () => {
    try {
      await api.loadDemoWorkspace();
      state.isDemoWorkspace = true;
      showToast("Enterprise demo dataset loaded!", "success");
      await loadEnterpriseData();
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    }
  });

  // Reset Demo
  document.getElementById('reset-btn')?.addEventListener('click', async () => {
    if (!confirm("Reset enterprise dataset to initial demo state?")) return;
    try {
      await api.resetDemo();
      showToast("Dataset reset to clean demo baseline", "success");
      await loadEnterpriseData();
    } catch (err) {
      showToast(`Reset failed: ${err.message}`, "error");
    }
  });

  // Remediation
  document.getElementById('btn-remediate')?.addEventListener('click', () => {
    executeRemediation(loadEnterpriseData);
  });

  // Dual Policy tabs
  document.getElementById('tab-btn-aws')?.addEventListener('click', () => {
    state.policyTab = 'aws';
    document.getElementById('tab-btn-aws').classList.add('active');
    document.getElementById('tab-btn-racf').classList.remove('active');
    renderPolicyCode();
  });

  document.getElementById('tab-btn-racf')?.addEventListener('click', () => {
    state.policyTab = 'racf';
    document.getElementById('tab-btn-racf').classList.add('active');
    document.getElementById('tab-btn-aws').classList.remove('active');
    renderPolicyCode();
  });

  document.getElementById('btn-copy-policy')?.addEventListener('click', () => {
    const code = document.getElementById('policy-code-block').textContent;
    if (code) {
      navigator.clipboard.writeText(code);
      showToast(`${state.policyTab === 'aws' ? 'AWS IAM JSON' : 'IBM RACF Commands'} copied to clipboard!`, 'info');
    }
  });

  // View switch (Graph vs Table)
  document.getElementById('tab-view-graph')?.addEventListener('click', () => {
    state.activeView = 'graph';
    document.getElementById('tab-view-graph').classList.add('active');
    document.getElementById('tab-view-table').classList.remove('active');
    document.getElementById('graph-view-container').style.display = 'flex';
    document.getElementById('table-view-container').style.display = 'none';
    drawFrame();
  });

  document.getElementById('tab-view-table')?.addEventListener('click', () => {
    state.activeView = 'table';
    document.getElementById('tab-view-table').classList.add('active');
    document.getElementById('tab-view-graph').classList.remove('active');
    document.getElementById('graph-view-container').style.display = 'none';
    document.getElementById('table-view-container').style.display = 'flex';
    renderRosterTable((userId) => selectUser(userId, loadEnterpriseData));
  });

  // Search input
  document.getElementById('node-search-input')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    if (state.activeView === 'table') renderRosterTable((userId) => selectUser(userId, loadEnterpriseData));
    else drawFrame();
  });

  // Table filters
  document.getElementById('table-filter-role')?.addEventListener('change', (e) => {
    state.tableFilterRole = e.target.value;
    renderRosterTable((userId) => selectUser(userId, loadEnterpriseData));
  });

  document.getElementById('table-filter-risk')?.addEventListener('change', (e) => {
    state.tableFilterRisk = e.target.value;
    renderRosterTable((userId) => selectUser(userId, loadEnterpriseData));
  });

  // Modals triggers
  document.getElementById('btn-open-ingest-modal')?.addEventListener('click', () => openModal('ingest-modal'));
  document.getElementById('btn-open-simulator-modal')?.addEventListener('click', () => {
    openModal('simulator-modal');
    const simUserSelect = document.getElementById('sim-modal-user-select');
    if (simUserSelect && state.selectedUserId) simUserSelect.value = state.selectedUserId;
  });

  document.getElementById('btn-view-ledger')?.addEventListener('click', () => {
    openModal('ledger-modal');
    loadLedgerBlocks();
  });

  document.getElementById('btn-delete-this-user')?.addEventListener('click', async () => {
    if (!state.selectedUserId) return;
    const user = state.users.find(u => u.id === state.selectedUserId);
    const name = user ? user.name : state.selectedUserId;

    if (!confirm(`Remove employee "${name}" (${state.selectedUserId}) from active roster?`)) return;

    try {
      await api.deleteEmployee(state.selectedUserId);
      showToast(`Removed employee ${name}`, 'info');
      state.selectedUserId = null;
      await loadEnterpriseData();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  });

  document.getElementById('btn-simulate-this-user')?.addEventListener('click', () => {
    openModal('simulator-modal');
    const simUserSelect = document.getElementById('sim-modal-user-select');
    if (simUserSelect && state.selectedUserId) simUserSelect.value = state.selectedUserId;
  });
}

document.addEventListener('DOMContentLoaded', init);
