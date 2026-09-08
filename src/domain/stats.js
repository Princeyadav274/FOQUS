import { evaluateBadges } from './badges.js';

/**
 * Converts epoch timestamp (ms) to YYYY-MM-DD in the given IANA timezone.
 */
export function getCalendarDay(epochMs, timezone = 'UTC') {
  if (!epochMs || isNaN(epochMs)) return null;
  try {
    const d = new Date(epochMs);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch (e) {
    // Fallback if timezone string is unrecognized
    return new Date(epochMs).toISOString().slice(0, 10);
  }
}

/**
 * Computes consecutive days difference between two YYYY-MM-DD strings.
 */
export function daysDifference(dayStrA, dayStrB) {
  const dateA = new Date(dayStrA + 'T00:00:00Z');
  const dateB = new Date(dayStrB + 'T00:00:00Z');
  return Math.round((dateB - dateA) / (1000 * 60 * 60 * 24));
}

/**
 * Computes streaks from an ascending array of unique calendar day strings (YYYY-MM-DD).
 * Returns { bestStreak, currentStreak, streakHistory: [{ day, streakLength }] }
 */
export function calculateStreaks(sortedDays, referenceDayStr) {
  if (!sortedDays || sortedDays.length === 0) {
    return { bestStreak: 0, currentStreak: 0, streakHistory: [] };
  }

  let bestStreak = 0;
  let runningStreak = 0;
  let prevDay = null;
  const streakHistory = [];

  for (let i = 0; i < sortedDays.length; i++) {
    const currentDay = sortedDays[i];

    if (!prevDay) {
      runningStreak = 1;
    } else {
      const diff = daysDifference(prevDay, currentDay);
      if (diff === 1) {
        runningStreak++;
      } else if (diff > 1) {
        runningStreak = 1;
      }
      // Note: diff === 0 shouldn't happen because sortedDays contains unique days
    }

    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }

    streakHistory.push({ day: currentDay, streakLength: runningStreak });
    prevDay = currentDay;
  }

  // Calculate current streak relative to referenceDayStr ("today" in the user's timezone)
  let currentStreak = 0;
  const lastActiveDay = sortedDays[sortedDays.length - 1];

  if (referenceDayStr) {
    const diffFromRef = daysDifference(lastActiveDay, referenceDayStr);
    // If the person meditated today (diff === 0) or yesterday (diff === 1, streak not broken yet)
    if (diffFromRef === 0 || diffFromRef === 1) {
      currentStreak = runningStreak;
    } else {
      currentStreak = 0;
    }
  } else {
    currentStreak = runningStreak;
  }

  return { bestStreak, currentStreak, streakHistory };
}

/**
 * Pure function: Computes all stats and awards badges for a person's sessions.
 * 
 * @param {Array} sessions - Array of accepted session objects.
 * @param {string} userTimezone - IANA timezone of the person.
 * @param {string} referenceDayStr - Reference day (YYYY-MM-DD) for "today", or null.
 * @returns {Object} Complete calculated stats and badges.
 */
export function computeUserStats(sessions = [], userTimezone = 'UTC', referenceDayStr = null) {
  // Sort sessions deterministically by timestamp ascending, tie-breaking by id
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return a.id.localeCompare(b.id);
  });

  let mindfulMinutes = 0;
  let totalThoughts = 0;
  let completedCount = 0;
  let scoredCount = 0;
  let practiceCount = 0;

  // Track unique scored days with first qualifying session metadata
  const scoredDaysMap = new Map(); // dayStr -> first qualifying session

  for (const s of sortedSessions) {
    if (s.completed === true) {
      completedCount++;
      mindfulMinutes += s.durationSelected;
      totalThoughts += (s.thoughtsGathered || 0);

      const isScored = s.sessionMode === 'scored' && !s.isPractice;
      if (isScored) {
        scoredCount++;
        const day = getCalendarDay(s.timestamp, userTimezone);
        if (day && !scoredDaysMap.has(day)) {
          scoredDaysMap.set(day, s);
        }
      } else {
        practiceCount++;
      }
    }
  }

  const sortedScoredDays = Array.from(scoredDaysMap.keys()).sort();
  const { bestStreak, currentStreak, streakHistory } = calculateStreaks(sortedScoredDays, referenceDayStr);

  // Evaluate badges
  const badges = evaluateBadges(sortedSessions, userTimezone, streakHistory, scoredDaysMap);

  return {
    totalSessions: sortedSessions.length,
    completedSessions: completedCount,
    scoredSessions: scoredCount,
    practiceSessions: practiceCount,
    mindfulMinutes,
    totalThoughts,
    bestStreak,
    currentStreak,
    scoredDays: sortedScoredDays,
    badges
  };
}
