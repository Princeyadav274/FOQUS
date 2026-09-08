import { api } from './api.js';

export async function initCommunityScreen() {
  await Promise.all([
    loadHealthOverview(),
    loadCommunityTable(),
    loadQuarantineTable()
  ]);

  setupDevTools();
}

async function loadHealthOverview() {
  try {
    const health = await api.getHealthSummary();

    document.getElementById('healthTotal').textContent = health.totalProcessed.toLocaleString();
    document.getElementById('healthAccepted').textContent = health.statusCounts.accepted.toLocaleString();
    document.getElementById('healthDedup').textContent = health.statusCounts.deduplicated.toLocaleString();
    document.getElementById('healthQuarantined').textContent = health.statusCounts.quarantined.toLocaleString();

    // Telemetry cards
    document.getElementById('telemetryLegacy').textContent = `${health.anomalies.legacyVersionSessions} sessions`;
    document.getElementById('telemetryClockDrift').textContent = `${health.anomalies.clockDriftAheadCount} sessions`;
    document.getElementById('telemetryErased').textContent = `${health.anomalies.erasedUsersCount} accounts`;
  } catch (err) {
    console.error('Failed to load health summary:', err);
  }
}

async function loadCommunityTable() {
  try {
    const rows = await api.getCommunityMetrics();
    const tbody = document.getElementById('communityTableBody');
    if (!tbody) return;

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No community data recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(r => {
      const calmVal = r.typicalCalmScore !== null ? `${(r.typicalCalmScore * 100).toFixed(0)}% (${r.typicalCalmScore})` : 'N/A';
      return `
        <tr>
          <td><strong>${r.isoWeek}</strong></td>
          <td><span class="badge-tag badge-tag-region">${r.region}</span></td>
          <td>${r.sessionsCount.toLocaleString()}</td>
          <td><strong>${r.mindfulMinutes.toLocaleString()} m</strong></td>
          <td>${r.peopleCount} ${r.peopleCount === 1 ? 'person' : 'people'}</td>
          <td>${calmVal}</td>
          <td>${r.isAnonymized ? '🔒 k-Anonymized' : '⚠️ Low density'}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load community table:', err);
  }
}

async function loadQuarantineTable() {
  try {
    const data = await api.getQuarantineRecords(100);
    const tbody = document.getElementById('quarantineTableBody');
    if (!tbody) return;

    if (!data.quarantined || data.quarantined.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">Clean sync! Zero quarantined records.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.quarantined.map(q => {
      const type = q.record?.type || 'unknown';
      const recordId = q.record?.id || q.record?.userId || 'N/A';
      const dateStr = q.receivedAt ? new Date(q.receivedAt).toLocaleTimeString() : 'N/A';

      return `
        <tr class="quarantine-item-row">
          <td><span class="badge-tag badge-tag-danger">${type}</span></td>
          <td><code>${escapeHtml(recordId)}</code></td>
          <td><span class="reason-pill">⚠️ ${escapeHtml(q.reason)}</span></td>
          <td>${dateStr}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load quarantine table:', err);
  }
}

function setupDevTools() {
  const btnFireStress = document.getElementById('btnFireStress');
  const terminal = document.getElementById('devStressOutput');

  if (btnFireStress && terminal) {
    btnFireStress.addEventListener('click', async () => {
      btnFireStress.disabled = true;
      btnFireStress.textContent = 'Firing 10 concurrent requests...';
      terminal.textContent = `[${new Date().toLocaleTimeString()}] Dispatching 10 simultaneous POST requests for identical session payload...`;

      try {
        const res = await api.testConcurrency(10, 'usr_dev_concurrency_tester');
        terminal.textContent += `\n\n[SUCCESS] Response received:`;
        terminal.textContent += `\n• Test Session ID:    ${res.testSessionId}`;
        terminal.textContent += `\n• Total Dispatched:   ${res.totalFired}`;
        terminal.textContent += `\n• Accepted:           ${res.summary.accepted}`;
        terminal.textContent += `\n• Deduplicated:       ${res.summary.deduplicated}`;
        terminal.textContent += `\n• Exact 1 Accepted:   ${res.exactOneAccepted ? 'YES ✅ (Zero Double-Count)' : 'NO ❌'}`;

        await Promise.all([loadHealthOverview(), loadQuarantineTable()]);
      } catch (err) {
        terminal.textContent += `\n\n[ERROR] ${err.message}`;
      } finally {
        btnFireStress.disabled = false;
        btnFireStress.textContent = '⚡ Fire 10 Concurrent Sessions';
      }
    });
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
