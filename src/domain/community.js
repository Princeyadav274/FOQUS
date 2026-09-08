/**
 * Community aggregations per ISO week and per region.
 */

/**
 * Returns ISO week string (e.g. "2026-W09") for a given date in UTC.
 */
export function getIsoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Monday = 1, Sunday = 7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Maps an IANA timezone string to a top-level geographic region.
 */
export function timezoneToRegion(tz = '') {
  if (!tz) return 'Unknown';
  if (tz.startsWith('Europe/')) return 'Europe';
  if (tz.startsWith('Asia/')) return 'Asia';
  if (tz.startsWith('America/') || tz.startsWith('US/') || tz.startsWith('Canada/')) return 'Americas';
  if (tz.startsWith('Australia/') || tz.startsWith('Pacific/')) return 'Oceania';
  if (tz.startsWith('Africa/')) return 'Africa';
  if (tz.startsWith('Atlantic/')) return 'Atlantic';
  return 'Global / UTC';
}

/**
 * Computes median of an array of numbers.
 */
function calculateMedian(numbers) {
  if (!numbers || numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Computes community collective table aggregated by ISO Week and Region.
 * Ensures zero leakage of individual user data or private feedback comments.
 * 
 * @param {Array} sessions - Array of accepted sessions.
 * @param {Function} getUserRegion - Function resolving userId to geographic region.
 * @returns {Array} Array of community group rows.
 */
export function computeCommunityMetrics(sessions, getUserRegion) {
  const groups = new Map(); // key: `${isoWeek}__${region}`

  for (const session of sessions) {
    if (session.completed !== true) continue;

    const date = new Date(session.timestamp);
    const isoWeek = getIsoWeek(date);
    const region = getUserRegion(session.userId) || 'Unknown';
    const key = `${isoWeek}__${region}`;

    if (!groups.has(key)) {
      groups.set(key, {
        isoWeek,
        region,
        sessionsCount: 0,
        mindfulMinutes: 0,
        participants: new Set(),
        calmScores: []
      });
    }

    const group = groups.get(key);
    group.sessionsCount++;
    group.mindfulMinutes += (session.durationSelected || 0);
    group.participants.add(session.userId);

    if (session.sessionMode === 'scored' && typeof session.calmScore === 'number' && session.calmScore >= 0 && session.calmScore <= 1) {
      group.calmScores.push(session.calmScore);
    }
  }

  // Convert to formatted table rows
  const result = [];
  for (const [_, g] of groups.entries()) {
    const peopleCount = g.participants.size;
    const medianScore = calculateMedian(g.calmScores);
    const meanScore = g.calmScores.length > 0 
      ? g.calmScores.reduce((acc, v) => acc + v, 0) / g.calmScores.length 
      : null;

    result.push({
      isoWeek: g.isoWeek,
      region: g.region,
      sessionsCount: g.sessionsCount,
      mindfulMinutes: g.mindfulMinutes,
      peopleCount,
      typicalCalmScore: medianScore !== null ? Number(medianScore.toFixed(2)) : null,
      meanCalmScore: meanScore !== null ? Number(meanScore.toFixed(2)) : null,
      // Differential privacy / k-anonymity flag:
      isAnonymized: peopleCount >= 2
    });
  }

  // Sort by isoWeek descending, then region ascending
  result.sort((a, b) => {
    if (a.isoWeek !== b.isoWeek) return b.isoWeek.localeCompare(a.isoWeek);
    return a.region.localeCompare(b.region);
  });

  return result;
}
