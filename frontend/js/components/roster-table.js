/**
 * Enterprise Roster Directory Data Table Component
 */
import { state } from '../state.js';
import { escapeHtml } from './toast.js';

export function renderRosterTable(onSelectUser) {
  const tbody = document.getElementById('roster-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const query = (state.searchQuery || '').toLowerCase().trim();
  const filterRole = state.tableFilterRole || 'all';
  const filterRisk = state.tableFilterRisk || 'all';

  const filtered = state.users.filter(u => {
    const matchSearch = !query || (
      u.name.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query) ||
      u.department.toLowerCase().includes(query)
    );
    const matchRole = filterRole === 'all' || u.role === filterRole;

    let matchRisk = true;
    if (filterRisk === 'critical') matchRisk = u.risk_score >= 75;
    else if (filterRisk === 'warning') matchRisk = u.risk_score >= 40 && u.risk_score < 75;
    else if (filterRisk === 'compliant') matchRisk = u.risk_score < 40;

    return matchSearch && matchRole && matchRisk;
  });

  const countBadge = document.getElementById('table-count-badge');
  if (countBadge) countBadge.textContent = `${filtered.length} of ${state.users.length} Employees`;

  filtered.forEach(u => {
    const tr = document.createElement('tr');
    tr.dataset.userId = u.id;
    if (u.id === state.selectedUserId) tr.classList.add('active-row');

    const driftCount = (u.drift_permissions || []).length;
    let badgeClass = 'safe';
    let badgeText = `${u.risk_score} (Compliant)`;

    if (u.risk_score >= 75) {
      badgeClass = 'critical';
      badgeText = `${u.risk_score} (Critical)`;
    } else if (u.risk_score >= 40) {
      badgeClass = 'warn';
      badgeText = `${u.risk_score} (Warning)`;
    }

    const driftTags = driftCount > 0
      ? u.drift_permissions.map(p => `<span class="entitlement-chip danger">${escapeHtml(p)}</span>`).join(' ')
      : '<span class="text-muted">None</span>';

    tr.innerHTML = `
      <td>
        <strong>${escapeHtml(u.name)}</strong><br />
        <span style="font-family: var(--font-mono); font-size: 9px; color: var(--text-muted);">${escapeHtml(u.id)}</span>
      </td>
      <td>
        <div>${escapeHtml(u.role)}</div>
        <div style="font-size: 9.5px; color: var(--text-muted);">${escapeHtml(u.department)}</div>
      </td>
      <td>${escapeHtml(u.branch || 'Global Enterprise')}</td>
      <td><span class="metric-pill-tag ${badgeClass}">${badgeText}</span></td>
      <td>${u.is_outlier ? '<strong style="color: var(--red-pulse);">YES</strong>' : '<span style="color: var(--green-compliant);">NO</span>'}</td>
      <td>${driftTags}</td>
      <td>
        <button class="btn btn-outline btn-xs" data-inspect-id="${u.id}">Inspect</button>
      </td>
    `;

    tr.addEventListener('click', () => {
      if (onSelectUser) onSelectUser(u.id);
    });

    tbody.appendChild(tr);
  });
}
