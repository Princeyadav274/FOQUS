import { api } from './api.js';

let currentUserId = null;
let currentFilter = 'all';
let currentUserData = null;

export async function initDashboard() {
  await loadUserList();
}

async function loadUserList() {
  try {
    const users = await api.getUsers();
    const select = document.getElementById('userSelect');
    if (!select) return;

    select.innerHTML = '';
    if (users.length === 0) {
      select.innerHTML = '<option value="">No users found (Run replay)</option>';
      return;
    }

    users.forEach((u, i) => {
      const opt = document.createElement('option');
      opt.value = u.userId;
      opt.textContent = `${u.nickname} (${u.userId.slice(0, 12)}…) — ${u.sessionCount} sessions [${u.timezone}]`;
      select.appendChild(opt);
    });

    // Default select first active user or remembered user
    currentUserId = users[0].userId;
    select.value = currentUserId;

    select.addEventListener('change', (e) => {
      currentUserId = e.target.value;
      renderUserDashboard(currentUserId);
    });

    setupActions();
    await renderUserDashboard(currentUserId);
  } catch (err) {
    console.error('Failed to load user list:', err);
  }
}

export async function renderUserDashboard(userId) {
  if (!userId) return;
  const container = document.getElementById('dashboardView');
  if (!container) return;

  try {
    const data = await api.getUserDetails(userId);
    currentUserData = data;

    // Update Header Meta
    const userMetaChip = document.getElementById('userMetaChip');
    if (userMetaChip) {
      userMetaChip.innerHTML = `<span>📍 ${data.user.timezone}</span> • <span>👤 Mode: ${data.user.profileMode}</span>`;
    }

    // Top Metrics
    const { stats } = data;
    document.getElementById('metricCurrentStreak').textContent = `${stats.currentStreak}d`;
    document.getElementById('metricBestStreak').textContent = `${stats.bestStreak}d`;
    document.getElementById('metricMindfulMins').textContent = stats.mindfulMinutes;
    document.getElementById('metricThoughts').textContent = stats.totalThoughts;
    document.getElementById('metricCompleted').textContent = `${stats.completedSessions} / ${stats.totalSessions}`;

    // Render Badges
    renderBadges(stats.badges, stats);

    // Render Heatmap
    renderHeatmap(data.sessions, data.user.timezone);

    // Render History
    renderSessionsList(data.sessions);
  } catch (err) {
    console.error('Error rendering dashboard:', err);
  }
}

function renderBadges(awardedBadges, stats) {
  const container = document.getElementById('badgeShelfContainer');
  if (!container) return;

  const earnedMap = new Map();
  for (const b of awardedBadges) {
    earnedMap.set(b.id, b);
  }

  const allBadges = [
    {
      id: 'first_reset',
      name: 'First Reset',
      desc: 'First completed scored session',
      icon: '🌱',
      progress: stats.scoredSessions >= 1 ? 'Earned' : `${stats.scoredSessions}/1 scored session`
    },
    {
      id: '3_day_streak',
      name: '3-Day FoQus Streak',
      desc: 'Streak reaches 3 consecutive days',
      icon: '🔥',
      progress: stats.bestStreak >= 3 ? 'Earned' : `Best: ${stats.bestStreak}/3 days`
    },
    {
      id: 'thought_gatherer',
      name: 'Thought Gatherer',
      desc: '100 thoughts gathered in total',
      icon: '✨',
      progress: stats.totalThoughts >= 100 ? 'Earned' : `${stats.totalThoughts}/100 thoughts`
    },
    {
      id: 'hour_of_calm',
      name: 'Hour of Calm',
      desc: '60 mindful minutes completed',
      icon: '⏳',
      progress: stats.mindfulMinutes >= 60 ? 'Earned' : `${stats.mindfulMinutes}/60 mins`
    }
  ];

  container.innerHTML = allBadges.map(b => {
    const isUnlocked = earnedMap.has(b.id);
    const badgeData = earnedMap.get(b.id);
    const dateStr = badgeData?.earnedAtIso 
      ? new Date(badgeData.earnedAtIso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

    return `
      <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon-box">${b.icon}</div>
        <div class="badge-info">
          <h4>${b.name}</h4>
          <p>${b.desc}</p>
          ${isUnlocked 
            ? `<div class="badge-date">✨ Unlocked on ${dateStr}</div>` 
            : `<div class="badge-date" style="color: var(--text-muted);">🔒 ${b.progress}</div>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function renderHeatmap(sessions, timezone) {
  const container = document.getElementById('heatmapGrid');
  if (!container) return;

  // Build map of counts per calendar day in user timezone
  const dayCounts = new Map();
  let maxTs = Date.now();

  for (const s of sessions) {
    if (!s.completed) continue;
    if (s.timestamp > maxTs) maxTs = s.timestamp;
    try {
      const day = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date(s.timestamp));
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    } catch (e) {}
  }

  // Generate 42 days (6 weeks) ending at max timestamp date
  const daysArray = [];
  const endDate = new Date(maxTs);

  for (let i = 41; i >= 0; i--) {
    const d = new Date(endDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const count = dayCounts.get(dayStr) || 0;
    daysArray.push({ dayStr, count });
  }

  container.innerHTML = daysArray.map(item => {
    let activeClass = '';
    if (item.count === 1) activeClass = 'active-1';
    else if (item.count === 2) activeClass = 'active-2';
    else if (item.count >= 3) activeClass = 'active-3';

    return `<div class="heatmap-day ${activeClass}" title="${item.dayStr}: ${item.count} sessions"></div>`;
  }).join('');
}

function renderSessionsList(sessions) {
  const container = document.getElementById('sessionsList');
  if (!container) return;

  const filtered = sessions.filter(s => {
    if (currentFilter === 'scored') return s.sessionMode === 'scored' && !s.isPractice;
    if (currentFilter === 'practice') return s.isPractice === true || s.sessionMode === 'practice';
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); padding: 1rem; text-align: center;">No sessions found for selected filter.</div>`;
    return;
  }

  // Show most recent sessions first
  const reversed = [...filtered].reverse();

  container.innerHTML = reversed.map(s => {
    const dateStr = new Date(s.timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isScored = s.sessionMode === 'scored' && !s.isPractice;
    const calmVal = typeof s.calmScore === 'number' ? (s.calmScore * 100).toFixed(0) : 'N/A';
    const calmClass = s.calmScore >= 0.7 ? 'calm-high' : 'calm-mid';

    return `
      <div class="session-item">
        <div class="session-left">
          <div class="session-duration-pill">${s.durationSelected}m ${isScored ? 'Scored' : 'Practice'}</div>
          <div class="session-meta-info">
            <h5>${s.intention || 'Reset'} • ${s.reflection || 'Calmer'}</h5>
            <span>${dateStr} • Thoughts: ${s.thoughtsGathered || 0} (Merged: ${s.mergedThoughts || 0}) • Steadiness: ${(s.averageSteadiness * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div class="session-right">
          ${isScored && s.calmScore !== null && s.calmScore !== undefined 
            ? `<div class="calm-pill ${calmClass}">🌿 Calm ${calmVal}%</div>` 
            : ''
          }
          ${s.feedbackComment 
            ? `<div class="private-feedback-bubble" title="Private note only visible to you">🔒 "${escapeHtml(s.feedbackComment)}"</div>` 
            : ''
          }
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setupActions() {
  // Filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      if (currentUserData) renderSessionsList(currentUserData.sessions);
    });
  });

  // Export button
  const exportBtn = document.getElementById('btnExportData');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (currentUserId) {
        window.open(`/api/users/${encodeURIComponent(currentUserId)}/export`, '_blank');
      }
    });
  }

  // Erasure button
  const eraseBtn = document.getElementById('btnEraseUser');
  if (eraseBtn) {
    eraseBtn.addEventListener('click', async () => {
      if (!currentUserId) return;
      const confirmed = confirm(`Are you sure you want to permanently delete all data for ${currentUserId}? Under GDPR Article 17, this cannot be undone.`);
      if (confirmed) {
        await api.eraseUser(currentUserId);
        alert(`User ${currentUserId} erased successfully.`);
        await loadUserList();
      }
    });
  }
}
