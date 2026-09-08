import { api } from './api.js';
import { icons } from './icons.js';

let currentUserId = null;
let currentFilter = 'all';
let currentUserData = null;

export async function initDashboard() {
  injectStaticIcons();
  await loadUserList();
}

function injectStaticIcons() {
  // Brand logo
  const brandLogoSlot = document.getElementById('brandLogoSlot');
  if (brandLogoSlot) brandLogoSlot.innerHTML = icons.logoMark;

  // Tabs
  const tabPracticeIcon = document.getElementById('tabPracticeIcon');
  if (tabPracticeIcon) tabPracticeIcon.innerHTML = icons.practice;
  const tabCommunityIcon = document.getElementById('tabCommunityIcon');
  if (tabCommunityIcon) tabCommunityIcon.innerHTML = icons.globe;

  // Action icons
  const exportIconSlot = document.getElementById('exportIconSlot');
  if (exportIconSlot) exportIconSlot.innerHTML = icons.download;
  const eraseIconSlot = document.getElementById('eraseIconSlot');
  if (eraseIconSlot) eraseIconSlot.innerHTML = icons.trash;

  // Metric icons
  const iconCurrentStreak = document.getElementById('iconCurrentStreak');
  if (iconCurrentStreak) iconCurrentStreak.innerHTML = icons.flame;
  const iconBestStreak = document.getElementById('iconBestStreak');
  if (iconBestStreak) iconBestStreak.innerHTML = icons.trophy;
  const iconMindfulMins = document.getElementById('iconMindfulMins');
  if (iconMindfulMins) iconMindfulMins.innerHTML = icons.clock;
  const iconThoughts = document.getElementById('iconThoughts');
  if (iconThoughts) iconThoughts.innerHTML = icons.sparkles;
  const iconCompleted = document.getElementById('iconCompleted');
  if (iconCompleted) iconCompleted.innerHTML = icons.checkCircle;
}

async function loadUserList() {
  try {
    const users = await api.getUsers();
    const select = document.getElementById('userSelect');
    if (!select) return;

    select.innerHTML = '';
    if (users.length === 0) {
      select.innerHTML = '<option value="">No practitioners found</option>';
      return;
    }

    users.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.userId;
      opt.textContent = `${u.nickname} (${u.userId.slice(0, 12)}…) — ${u.sessionCount} sessions [${u.timezone}]`;
      select.appendChild(opt);
    });

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

  try {
    const data = await api.getUserDetails(userId);
    currentUserData = data;

    // Update Avatar initials
    const avatarSlot = document.getElementById('userAvatarSlot');
    if (avatarSlot) {
      const initials = (data.user.nickname || 'FQ').slice(0, 2).toUpperCase();
      avatarSlot.textContent = initials;
    }

    // Update Meta Pills
    const userMetaPills = document.getElementById('userMetaPills');
    if (userMetaPills) {
      userMetaPills.innerHTML = `
        <div class="meta-pill">
          <span>${data.user.timezone}</span>
        </div>
        <div class="meta-pill">
          <span>Mode: ${data.user.profileMode}</span>
        </div>
      `;
    }

    // Top Metrics
    const { stats } = data;
    document.getElementById('metricCurrentStreak').textContent = `${stats.currentStreak}d`;
    document.getElementById('metricBestStreak').textContent = `${stats.bestStreak}d`;
    document.getElementById('metricMindfulMins').textContent = stats.mindfulMinutes;
    document.getElementById('metricThoughts').textContent = stats.totalThoughts.toLocaleString();
    document.getElementById('metricCompleted').textContent = `${stats.completedSessions} / ${stats.totalSessions}`;

    // Render Badges Shelf
    renderBadges(stats.badges, stats);

    // Render Heatmap
    renderHeatmap(data.sessions, data.user.timezone);

    // Render Sessions Timeline
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
      iconSvg: icons.badges.first_reset,
      progress: stats.scoredSessions >= 1 ? 'Unlocked' : `${stats.scoredSessions}/1 scored reset`
    },
    {
      id: '3_day_streak',
      name: '3-Day FoQus Streak',
      desc: 'Consecutive daily practice reaches 3 days',
      iconSvg: icons.badges['3_day_streak'],
      progress: stats.bestStreak >= 3 ? 'Unlocked' : `Best: ${stats.bestStreak}/3 days`
    },
    {
      id: 'thought_gatherer',
      name: 'Thought Gatherer',
      desc: '100 cumulative thoughts gathered on exhale',
      iconSvg: icons.badges.thought_gatherer,
      progress: stats.totalThoughts >= 100 ? 'Unlocked' : `${stats.totalThoughts}/100 thoughts`
    },
    {
      id: 'hour_of_calm',
      name: 'Hour of Calm',
      desc: '60 cumulative mindful minutes completed',
      iconSvg: icons.badges.hour_of_calm,
      progress: stats.mindfulMinutes >= 60 ? 'Unlocked' : `${stats.mindfulMinutes}/60 mins`
    }
  ];

  container.innerHTML = allBadges.map(b => {
    const isUnlocked = earnedMap.has(b.id);
    const badgeData = earnedMap.get(b.id);
    const dateStr = badgeData?.earnedAtIso 
      ? new Date(badgeData.earnedAtIso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

    return `
      <div class="badge-token ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-emblem">${b.iconSvg}</div>
        <div class="badge-details">
          <h4>${b.name}</h4>
          <p>${b.desc}</p>
          ${isUnlocked 
            ? `<div class="badge-earned-tag">${icons.checkCircle} Earned on ${dateStr}</div>` 
            : `<div class="badge-earned-tag" style="color: var(--text-muted);">${icons.lock} ${b.progress}</div>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function renderHeatmap(sessions, timezone) {
  const container = document.getElementById('heatmapGrid');
  if (!container) return;

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
    let levelClass = '';
    if (item.count === 1) levelClass = 'level-1';
    else if (item.count === 2) levelClass = 'level-2';
    else if (item.count >= 3) levelClass = 'level-3';

    return `<div class="heatmap-cell ${levelClass}" title="${item.dayStr}: ${item.count} sessions completed"></div>`;
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
    container.innerHTML = `<div style="color: var(--text-muted); padding: 2rem; text-align: center;">No sessions match selected filter.</div>`;
    return;
  }

  const reversed = [...filtered].reverse();

  container.innerHTML = reversed.map(s => {
    const dateStr = new Date(s.timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isScored = s.sessionMode === 'scored' && !s.isPractice;
    const calmVal = typeof s.calmScore === 'number' ? (s.calmScore * 100).toFixed(0) : null;
    const calmClass = s.calmScore >= 0.7 ? 'calm-gauge-high' : 'calm-gauge-mid';

    return `
      <div class="timeline-card">
        <div class="timeline-left">
          <div class="duration-chip">${s.durationSelected}m ${isScored ? 'Scored' : 'Practice'}</div>
          <div class="timeline-meta">
            <h5>${s.intention || 'Reset'} • ${s.reflection || 'Calmer'}</h5>
            <span>${dateStr} • Thoughts: ${s.thoughtsGathered || 0} (Merged: ${s.mergedThoughts || 0}) • Steadiness: ${(s.averageSteadiness * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div class="timeline-right">
          ${isScored && calmVal !== null 
            ? `<div class="calm-gauge-pill ${calmClass}"><span>Calm ${calmVal}%</span></div>` 
            : ''
          }
          ${s.feedbackComment 
            ? `<div class="private-note-card" title="Private owner feedback (Rule 2 protected)">
                ${icons.lock} <span>"${escapeHtml(s.feedbackComment)}"</span>
               </div>` 
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
  const filterBtns = document.querySelectorAll('.filter-tab');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      if (currentUserData) renderSessionsList(currentUserData.sessions);
    });
  });

  const exportBtn = document.getElementById('btnExportData');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (currentUserId) {
        window.open(`/api/users/${encodeURIComponent(currentUserId)}/export`, '_blank');
      }
    });
  }

  const eraseBtn = document.getElementById('btnEraseUser');
  if (eraseBtn) {
    eraseBtn.addEventListener('click', async () => {
      if (!currentUserId) return;
      const confirmed = confirm(`Are you sure you want to permanently erase all records for ${currentUserId}? Under GDPR Article 17, this action is irreversible.`);
      if (confirmed) {
        await api.eraseUser(currentUserId);
        alert(`Practitioner account ${currentUserId} has been permanently erased.`);
        await loadUserList();
      }
    });
  }
}
