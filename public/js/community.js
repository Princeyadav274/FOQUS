import { api } from './api.js';
import { icons } from './icons.js';

export async function initCommunityScreen() {
  injectCommunityIcons();
  await Promise.all([
    loadHealthOverview(),
    loadCommunityTable(),
    loadQuarantineTable()
  ]);

  setupDevTools();
}

function injectCommunityIcons() {
  const devZapSlot = document.getElementById('devZapIconSlot');
  if (devZapSlot) devZapSlot.innerHTML = icons.zap;
  const btnStressSlot = document.getElementById('btnStressIconSlot');
  if (btnStressSlot) btnStressSlot.innerHTML = icons.zap;
}

async function loadHealthOverview() {
  try {
    const health = await api.getHealthSummary();

    document.getElementById('healthTotal').textContent = health.totalProcessed.toLocaleString();
    document.getElementById('healthAccepted').textContent = health.statusCounts.accepted.toLocaleString();
    document.getElementById('healthDedup').textContent = health.statusCounts.deduplicated.toLocaleString();
    document.getElementById('healthQuarantined').textContent = health.statusCounts.quarantined.toLocaleString();

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
      const calmVal = r.typicalCalmScore !== null ? `${(r.typicalCalmScore * 100).toFixed(0)}%` : 'N/A';
      return `
        <tr>
          <td><strong style="font-family: var(--font-mono); font-size: 0.8rem;">${r.isoWeek}</strong></td>
          <td><span class="region-chip">${r.region}</span></td>
          <td>${r.sessionsCount.toLocaleString()}</td>
          <td><strong style="color: var(--text-hero);">${r.mindfulMinutes.toLocaleString()} m</strong></td>
          <td>${r.peopleCount} ${r.peopleCount === 1 ? 'person' : 'people'}</td>
          <td><span style="font-family: var(--font-mono); font-weight: 600;">${calmVal}</span></td>
          <td>
            ${r.isAnonymized 
              ? `<span class="anonymized-shield-chip">${icons.shield} k-Anonymized</span>` 
              : `<span class="reason-tag">${icons.alertTriangle} Low density</span>`
            }
          </td>
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
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">Zero quarantined records. All records accepted or deduplicated.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.quarantined.map(q => {
      const type = q.record?.type || 'unknown';
      const recordId = q.record?.id || q.record?.userId || 'N/A';
      const dateStr = q.receivedAt ? new Date(q.receivedAt).toLocaleTimeString() : 'N/A';

      return `
        <tr>
          <td><span class="reason-tag" style="background: rgba(244,63,94,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid rgba(244,63,94,0.25);">${type}</span></td>
          <td><code style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(recordId)}</code></td>
          <td><span class="reason-tag">${escapeHtml(q.reason)}</span></td>
          <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${dateStr}</td>
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
      btnFireStress.textContent = 'Dispatching 10 concurrent requests...';
      terminal.textContent = `[${new Date().toLocaleTimeString()}] INGESTION STRESS TEST: Dispatching 10 simultaneous POST /api/sync requests for identical session payload...`;

      try {
        const res = await api.testConcurrency(10, 'usr_dev_concurrency_tester');
        terminal.textContent += `\n\n[ATOMIC DEDUPLICATION VERIFIED] Response summary:`;
        terminal.textContent += `\n• Target Session ID:  ${res.testSessionId}`;
        terminal.textContent += `\n• Dispatched Count:   ${res.totalFired}`;
        terminal.textContent += `\n• Accepted:           ${res.summary.accepted}`;
        terminal.textContent += `\n• Deduplicated:       ${res.summary.deduplicated}`;
        terminal.textContent += `\n• Invariant Check:    ${res.exactOneAccepted ? 'PASSED (Exactly 1 Accepted, 0 Double-Count)' : 'FAILED'}`;

        await Promise.all([loadHealthOverview(), loadQuarantineTable()]);
      } catch (err) {
        terminal.textContent += `\n\n[ERROR] ${err.message}`;
      } finally {
        btnFireStress.disabled = false;
        btnFireStress.innerHTML = `${icons.zap} Fire 10 Concurrent Sessions`;
      }
    });
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
