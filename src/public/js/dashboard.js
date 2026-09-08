import { api } from './api.js';
import { icons } from './icons.js';

let currentUserId = null;
let currentFilter = 'all';
let currentUserData = null;

export async function initDashboard() {
  initTheme();
  injectStaticIcons();
  await loadUserList();
}

function initTheme() {
  const savedTheme = localStorage.getItem('foqus_theme') || 'light';
  applyTheme(savedTheme);

  const themeBtn = document.getElementById('btnThemeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('foqus_theme', newTheme);
    });
  }
}

function applyTheme(theme) {
  const iconSlot = document.getElementById('themeIconSlot');
  const textSlot = document.getElementById('themeText');
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (iconSlot) iconSlot.innerHTML = icons.sun;
    if (textSlot) textSlot.textContent = 'Light';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (iconSlot) iconSlot.innerHTML = icons.moon;
    if (textSlot) textSlot.textContent = 'Dark';
  }
}

function injectStaticIcons() {
  const exportIconSlot = document.getElementById('exportIconSlot');
  if (exportIconSlot) exportIconSlot.innerHTML = icons.download;
  const eraseIconSlot = document.getElementById('eraseIconSlot');
  if (eraseIconSlot) eraseIconSlot.innerHTML = icons.trash;

  const iconCurrentStreak = document.getElementById('iconCurrentStreak');
  if (iconCurrentStreak) iconCurrentStreak.innerHTML = icons.flame;
  const iconBestStreak = document.getElementById('iconBestStreak');
  if (iconBestStreak) iconBestStreak.innerHTML = icons.trophy;
  const iconMindfulMins = document.getElementById('iconMindfulMins');
  if (iconMindfulMins) iconMindfulMins.innerHTML = icons.clock;
  const iconThoughts = document.getElementById('iconThoughts');
  if (iconThoughts) iconThoughts.innerHTML = icons.sparkles;
}

async function loadUserList() {
  try {
    const users = await api.getUsers();
    const select = document.getElementById('userSelect');
    if (!select) return;

    select.innerHTML = '';
    if (users.length === 0) {
      select.innerHTML = '<option value="">No users found</option>';
      return;
    }

    users.forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.userId;
      const tz = u.timezone || 'UTC';
      opt.dataset.timezone = tz;
      opt.textContent = `${u.nickname} (${u.sessionCount} resets • ${tz})`;
      select.appendChild(opt);
    });

    currentUserId = users[0].userId;
    select.value = currentUserId;

    const updateTimezoneTag = () => {
      const selectedOpt = select.options[select.selectedIndex];
      const tz = selectedOpt?.dataset?.timezone || 'UTC';
      const tzElem = document.getElementById('userTimezoneText');
      if (tzElem) tzElem.textContent = tz;
    };
    updateTimezoneTag();

    select.addEventListener('change', (e) => {
      currentUserId = e.target.value;
      updateTimezoneTag();
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
    const { stats, user, sessions } = data;
    currentUserData = data;

    // Welcome title & nickname
    const welcomeName = document.getElementById('welcomeUserName');
    if (welcomeName) welcomeName.textContent = user.nickname || user.userId;

    const cardNick = document.getElementById('cardUserNickname');
    if (cardNick) cardNick.textContent = user.nickname || user.userId;

    const cardUid = document.getElementById('cardUserId');
    if (cardUid) cardUid.textContent = user.userId;

    const cardMode = document.getElementById('cardUserMode');
    if (cardMode) cardMode.textContent = (user.profileMode || 'personal').toUpperCase();

    // Top Header Capsules
    const pillScored = document.getElementById('pillScoredCount');
    if (pillScored) pillScored.textContent = `${stats.scoredSessions} Scored`;

    const pillPractice = document.getElementById('pillPracticeCount');
    if (pillPractice) pillPractice.textContent = `${stats.practiceSessions} Practice`;

    // Compute average calm score for user
    const scoredCalms = (sessions || [])
      .filter(s => s.completed && s.calmScore !== undefined && s.calmScore !== null && s.sessionMode === 'scored')
      .map(s => s.calmScore);
    const avgCalm = scoredCalms.length > 0 
      ? Math.round((scoredCalms.reduce((a, b) => a + b, 0) / scoredCalms.length) * 100)
      : 74;

    const pillCalm = document.getElementById('pillCalmRate');
    if (pillCalm) pillCalm.textContent = `Calm ${avgCalm}%`;

    const dialCalm = document.getElementById('dialCalmScore');
    if (dialCalm) dialCalm.textContent = `Calm ${avgCalm}%`;

    const subTitle = document.getElementById('userMetaSubtitle');
    if (subTitle) subTitle.textContent = `${user.timezone} • ${stats.totalSessions} Resets`;

    const tzDisplay = document.getElementById('userTzDisplay');
    if (tzDisplay) tzDisplay.textContent = `Timezone: ${user.timezone}`;

    // Metrics
    const metricCurStreak = document.getElementById('metricCurrentStreak');
    if (metricCurStreak) metricCurStreak.textContent = `${stats.currentStreak}d`;

    const metricBest = document.getElementById('metricBestStreak');
    if (metricBest) metricBest.textContent = `${stats.bestStreak}d`;

    const metricMins = document.getElementById('metricMindfulMins');
    if (metricMins) metricMins.textContent = `${stats.mindfulMinutes}m`;

    const metricThoughts = document.getElementById('metricThoughts');
    if (metricThoughts) metricThoughts.textContent = (stats.totalThoughts || 0).toLocaleString();

    const dialMinutes = document.getElementById('dialMinutesText');
    if (dialMinutes) dialMinutes.textContent = `${stats.mindfulMinutes}m`;

    const badgeCount = document.getElementById('badgeCompletedCount');
    if (badgeCount) badgeCount.textContent = `${stats.badges.length}/4`;

    renderBadges(stats.badges, stats);
    renderHeatmap(sessions, user.timezone);
    renderSessionsList(sessions);
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
      progress: stats.scoredSessions >= 1 ? 'Earned' : `${stats.scoredSessions}/1 scored reset`
    },
    {
      id: '3_day_streak',
      name: '3-Day FoQus Streak',
      desc: 'Streak reaches 3 consecutive days',
      iconSvg: icons.badges['3_day_streak'],
      progress: stats.bestStreak >= 3 ? 'Earned' : `Best: ${stats.bestStreak}/3 days`
    },
    {
      id: 'thought_gatherer',
      name: 'Thought Gatherer',
      desc: '100 thoughts gathered in total',
      iconSvg: icons.badges.thought_gatherer,
      progress: stats.totalThoughts >= 100 ? 'Earned' : `${stats.totalThoughts}/100 thoughts`
    },
    {
      id: 'hour_of_calm',
      name: 'Hour of Calm',
      desc: '60 mindful minutes completed',
      iconSvg: icons.badges.hour_of_calm,
      progress: stats.mindfulMinutes >= 60 ? 'Earned' : `${stats.mindfulMinutes}/60 mins`
    }
  ];

  container.innerHTML = allBadges.map(b => {
    const isUnlocked = earnedMap.has(b.id);
    const badgeData = earnedMap.get(b.id);
    const dateStr = badgeData?.earnedAtIso 
      ? new Date(badgeData.earnedAtIso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : null;

    return `
      <div class="navy-badge-item ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="navy-badge-left">
          <div class="navy-badge-icon">${b.iconSvg}</div>
          <div>
            <div class="navy-badge-title">${b.name}</div>
            <div class="navy-badge-date">${isUnlocked ? `Earned ${dateStr}` : b.progress}</div>
          </div>
        </div>
        <div class="navy-check-pill">${isUnlocked ? '✓' : '○'}</div>
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
    let lvlClass = '';
    if (item.count === 1) lvlClass = 'l1';
    else if (item.count === 2) lvlClass = 'l2';
    else if (item.count >= 3) lvlClass = 'l3';

    return `<div class="heat-cell ${lvlClass}" title="${item.dayStr}: ${item.count} resets"></div>`;
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
    container.innerHTML = `<div style="color: var(--text-dim); padding: 1.5rem; text-align: center; font-size: 0.85rem;">No sessions recorded for selected filter.</div>`;
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
    const calmVal = typeof s.calmScore === 'number' ? `${(s.calmScore * 100).toFixed(0)}%` : null;

    return `
      <div class="history-item">
        <div class="history-left">
          <span class="tag-duration">${s.durationSelected}m</span>
          <span class="history-meta-title">${s.intention || 'Reset'}</span>
          <span class="history-meta-sub">${dateStr} • ${isScored ? 'Scored' : 'Practice'} • ${s.thoughtsGathered || 0} thoughts</span>
        </div>
        <div class="history-right">
          ${isScored && calmVal !== null 
            ? `<span class="calm-badge">Calm ${calmVal}</span>` 
            : ''
          }
          ${s.feedbackComment 
            ? `<span class="private-note-badge" title="Private note">
                ${icons.lock} "${escapeHtml(s.feedbackComment)}"
               </span>` 
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
  const filterBtns = document.querySelectorAll('.filter-btn-simple');
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
        alert(`User ${currentUserId} has been erased.`);
        await loadUserList();
      }
    });
  }
}
