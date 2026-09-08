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
    renderHeatmap(sessions, user.timezone, stats);
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

function renderHeatmap(sessions, timezone, stats) {
  const container = document.getElementById('heatmapGrid');
  const monthsHeader = document.getElementById('githubMonthsHeader');
  if (!container) return;

  const dayCounts = new Map();
  let maxTs = 0;

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

  // Determine reference end date (Saturday of the current/max week)
  const refDate = new Date(maxTs > 0 ? maxTs : Date.now());
  const dayOfWeek = refDate.getUTCDay(); // 0 is Sun, 6 is Sat
  const endSat = new Date(refDate);
  endSat.setUTCDate(endSat.getUTCDate() + (6 - dayOfWeek));

  // 52 weeks = 364 days ending on endSat
  const numWeeks = 52;
  const startDate = new Date(endSat);
  startDate.setUTCDate(startDate.getUTCDate() - (numWeeks * 7 - 1));

  const weeks = [];
  const monthLabels = [];
  let lastMonth = -1;

  for (let w = 0; w < numWeeks; w++) {
    const daysInWeek = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(startDate);
      cur.setUTCDate(cur.getUTCDate() + (w * 7 + d));
      const dayStr = cur.toISOString().slice(0, 10);
      const count = dayCounts.get(dayStr) || 0;
      const month = cur.getUTCMonth();

      // Check if start of a month or first column
      if (d === 0 && month !== lastMonth) {
        monthLabels.push({
          colIndex: w,
          name: cur.toLocaleDateString('en-US', { month: 'short' })
        });
        lastMonth = month;
      }

      let lvlClass = 'lvl-0';
      if (count === 1) lvlClass = 'lvl-1';
      else if (count === 2) lvlClass = 'lvl-2';
      else if (count === 3) lvlClass = 'lvl-3';
      else if (count >= 4) lvlClass = 'lvl-4';

      const friendlyDate = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      daysInWeek.push({
        dayStr,
        friendlyDate,
        count,
        lvlClass
      });
    }
    weeks.push(daysInWeek);
  }

  // Render month header positioned over columns
  if (monthsHeader) {
    monthsHeader.innerHTML = monthLabels
      .filter((m, i, arr) => i === 0 || m.colIndex - arr[i - 1].colIndex >= 3)
      .map(m => {
        // each column is 13px + 3.5px gap = 16.5px
        const leftPx = m.colIndex * 16.5;
        return `<span class="github-month-label" style="left: ${leftPx}px;">${m.name}</span>`;
      }).join('');
  }

  // Render heatmap grid
  container.innerHTML = weeks.map(week => {
    const cellsHtml = week.map(cell => {
      const tip = `${cell.count === 0 ? 'No' : cell.count} mindful reset${cell.count === 1 ? '' : 's'} on ${cell.friendlyDate}`;
      return `<div class="heat-cell ${cell.lvlClass}" title="${tip}" data-date="${cell.dayStr}"></div>`;
    }).join('');
    return `<div class="week-col">${cellsHtml}</div>`;
  }).join('');

  // Update top summary text
  const summaryElem = document.getElementById('heatmapSummaryText');
  if (summaryElem) {
    const totalInYear = stats?.completedSessions || stats?.totalSessions || sessions.length;
    summaryElem.innerHTML = `<span><strong>${totalInYear}</strong> mindful resets recorded</span>`;
  }

  // Activity Overview: Left Panel Content
  const highlightResets = document.getElementById('activityHighlightResets');
  if (highlightResets) {
    const activeDays = stats?.scoredDays?.length || dayCounts.size || 0;
    const completedCount = stats?.completedSessions || stats?.totalSessions || sessions.length;
    highlightResets.innerHTML = `Completed <strong>${completedCount}</strong> resets across <strong>${activeDays}</strong> active calendar days`;
  }

  const highlightDetails = document.getElementById('activityHighlightDetails');
  if (highlightDetails) {
    const soundscapeFreq = {};
    for (const s of sessions) {
      if (s.soundscape) {
        soundscapeFreq[s.soundscape] = (soundscapeFreq[s.soundscape] || 0) + 1;
      }
    }
    const topSounds = Object.keys(soundscapeFreq).slice(0, 2).join(', ') || 'Stillness, Solvana';
    highlightDetails.textContent = `Primary soundscapes: ${topSounds} • ${stats?.mindfulMinutes || 0} total mindful minutes`;
  }

  const highlightStreak = document.getElementById('activityHighlightStreak');
  if (highlightStreak) {
    highlightStreak.innerHTML = `Longest unbroken chain: <strong>${stats?.bestStreak || 0} days</strong> • Current: <strong>${stats?.currentStreak || 0} days</strong>`;
  }

  const scoredCount = stats?.scoredSessions || 0;
  const practiceCount = stats?.practiceSessions || 0;
  const totalMode = scoredCount + practiceCount || 1;
  const scoredPct = Math.round((scoredCount / totalMode) * 100);
  const practicePct = 100 - scoredPct;

  const highlightRatio = document.getElementById('activityHighlightRatio');
  if (highlightRatio) {
    highlightRatio.innerHTML = `<strong>${scoredPct}%</strong> Scored resets (${scoredCount}) • <strong>${practicePct}%</strong> Practice sessions (${practiceCount})`;
  }

  // Activity Overview: Right Panel 4-Axis Cross Radar Chart (Blue Theme)
  renderCrossChart(stats, scoredPct, practicePct, sessions);
}

function renderCrossChart(stats, scoredPct, practicePct, sessions) {
  const container = document.getElementById('crossGraphContainer');
  if (!container) return;

  // Calculate calm average
  const scoredCalms = (sessions || [])
    .filter(s => s.completed && s.calmScore !== undefined && s.calmScore !== null && s.sessionMode === 'scored')
    .map(s => s.calmScore);
  const avgCalm = scoredCalms.length > 0 
    ? Math.round((scoredCalms.reduce((a, b) => a + b, 0) / scoredCalms.length) * 100)
    : 74;

  // Radar coordinates with center at (180, 100)
  // Left: Scored % (dominant, stretches left matching GitHub commits in reference image)
  const leftDist = 30 + Math.min(100, Math.round((scoredPct / 100) * 90));
  const xLeft = 180 - leftDist;

  // Right: Practice %
  const rightDist = 18 + Math.min(60, Math.round((practicePct / 100) * 80));
  const xRight = 180 + rightDist;

  // Top: Steadiness / Calm score %
  const topDist = 20 + Math.min(65, Math.round((avgCalm / 100) * 60));
  const yTop = 100 - topDist;

  // Bottom: Duration / Streak depth
  const streakVal = stats?.bestStreak || 1;
  const bottomDist = 18 + Math.min(65, streakVal * 9);
  const yBottom = 100 + bottomDist;

  container.innerHTML = `
    <svg viewBox="0 0 380 200" width="100%" height="100%" style="overflow: visible;">
      <!-- Crosshair Axes (Blue Theme) -->
      <line x1="50" y1="100" x2="310" y2="100" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" />
      <line x1="180" y1="22" x2="180" y2="178" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" />

      <!-- Center Origin Dot -->
      <circle cx="180" cy="100" r="2.5" fill="#2563eb" />

      <!-- Diamond Polygon (Filled Blue with Blue Border) -->
      <polygon 
        points="${xLeft},100 180,${yTop} ${xRight},100 180,${yBottom}" 
        fill="rgba(37, 99, 235, 0.22)" 
        stroke="#2563eb" 
        stroke-width="2.5" 
        stroke-linejoin="round" 
      />

      <!-- Vertex Marker Dots (White with Blue Ring) -->
      <circle cx="${xLeft}" cy="100" r="4.5" fill="#ffffff" stroke="#2563eb" stroke-width="2.5" />
      <circle cx="180" cy="${yTop}" r="4.5" fill="#ffffff" stroke="#2563eb" stroke-width="2.5" />
      <circle cx="${xRight}" cy="100" r="4.5" fill="#ffffff" stroke="#2563eb" stroke-width="2.5" />
      <circle cx="180" cy="${yBottom}" r="4.5" fill="#ffffff" stroke="#2563eb" stroke-width="2.5" />

      <!-- Axis Labels Matching Reference Image -->
      <!-- Top Label -->
      <text x="180" y="14" text-anchor="middle" font-size="11" font-weight="500" fill="var(--text-muted)">Steadiness</text>

      <!-- Bottom Label -->
      <text x="180" y="195" text-anchor="middle" font-size="11" font-weight="500" fill="var(--text-muted)">Breath Depth</text>

      <!-- Left Label (Two lines: Percentage + Scored) -->
      <text x="42" y="94" text-anchor="end" font-size="12" font-weight="700" fill="var(--text-primary)">${scoredPct}%</text>
      <text x="42" y="108" text-anchor="end" font-size="10" font-weight="500" fill="var(--text-muted)">Scored</text>

      <!-- Right Label (Two lines: Percentage + Practice) -->
      <text x="318" y="94" text-anchor="start" font-size="12" font-weight="700" fill="var(--text-primary)">${practicePct}%</text>
      <text x="318" y="108" text-anchor="start" font-size="10" font-weight="500" fill="var(--text-muted)">Practice</text>
    </svg>
  `;
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
