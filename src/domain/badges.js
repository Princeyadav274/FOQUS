import { BADGE_DEFINITIONS } from './types.js';

/**
 * Pure function: Evaluates badges earned by a user, dated to the exact session that unlocked it.
 * 
 * @param {Array} sortedSessions - Sessions sorted chronologically by timestamp.
 * @param {string} userTimezone - User's timezone.
 * @param {Array} streakHistory - Array of { day, streakLength }.
 * @param {Map} scoredDaysMap - Map of dayStr -> qualifying session object.
 * @returns {Array} Array of awarded badge objects.
 */
export function evaluateBadges(sortedSessions, userTimezone, streakHistory = [], scoredDaysMap = new Map()) {
  const awardedBadges = [];
  const earnedIds = new Set();

  let cumulativeMinutes = 0;
  let cumulativeThoughts = 0;

  for (const session of sortedSessions) {
    if (session.completed !== true) continue;

    // 1. First Reset: first completed scored session
    const isScored = session.sessionMode === 'scored' && !session.isPractice;
    if (isScored && !earnedIds.has(BADGE_DEFINITIONS.FIRST_RESET.id)) {
      earnedIds.add(BADGE_DEFINITIONS.FIRST_RESET.id);
      awardedBadges.push({
        id: BADGE_DEFINITIONS.FIRST_RESET.id,
        name: BADGE_DEFINITIONS.FIRST_RESET.name,
        description: BADGE_DEFINITIONS.FIRST_RESET.description,
        earnedAtSessionId: session.id,
        earnedAtTimestamp: session.timestamp,
        earnedAtIso: new Date(session.timestamp).toISOString()
      });
    }

    // 2. Hour of Calm: 60 cumulative mindful minutes across completed sessions
    cumulativeMinutes += session.durationSelected;
    if (cumulativeMinutes >= 60 && !earnedIds.has(BADGE_DEFINITIONS.HOUR_OF_CALM.id)) {
      earnedIds.add(BADGE_DEFINITIONS.HOUR_OF_CALM.id);
      awardedBadges.push({
        id: BADGE_DEFINITIONS.HOUR_OF_CALM.id,
        name: BADGE_DEFINITIONS.HOUR_OF_CALM.name,
        description: BADGE_DEFINITIONS.HOUR_OF_CALM.description,
        earnedAtSessionId: session.id,
        earnedAtTimestamp: session.timestamp,
        earnedAtIso: new Date(session.timestamp).toISOString()
      });
    }

    // 3. Thought Gatherer: 100 cumulative thoughts gathered across completed sessions
    cumulativeThoughts += (session.thoughtsGathered || 0);
    if (cumulativeThoughts >= 100 && !earnedIds.has(BADGE_DEFINITIONS.THOUGHT_GATHERER.id)) {
      earnedIds.add(BADGE_DEFINITIONS.THOUGHT_GATHERER.id);
      awardedBadges.push({
        id: BADGE_DEFINITIONS.THOUGHT_GATHERER.id,
        name: BADGE_DEFINITIONS.THOUGHT_GATHERER.name,
        description: BADGE_DEFINITIONS.THOUGHT_GATHERER.description,
        earnedAtSessionId: session.id,
        earnedAtTimestamp: session.timestamp,
        earnedAtIso: new Date(session.timestamp).toISOString()
      });
    }
  }

  // 4. 3-Day FoQus Streak: when a streak first reaches 3 consecutive days
  const streakThreeMilestone = streakHistory.find(s => s.streakLength >= 3);
  if (streakThreeMilestone && !earnedIds.has(BADGE_DEFINITIONS.THREE_DAY_STREAK.id)) {
    earnedIds.add(BADGE_DEFINITIONS.THREE_DAY_STREAK.id);
    const qualifyingSession = scoredDaysMap.get(streakThreeMilestone.day);
    awardedBadges.push({
      id: BADGE_DEFINITIONS.THREE_DAY_STREAK.id,
      name: BADGE_DEFINITIONS.THREE_DAY_STREAK.name,
      description: BADGE_DEFINITIONS.THREE_DAY_STREAK.description,
      earnedAtSessionId: qualifyingSession ? qualifyingSession.id : null,
      earnedAtTimestamp: qualifyingSession ? qualifyingSession.timestamp : null,
      earnedAtIso: qualifyingSession ? new Date(qualifyingSession.timestamp).toISOString() : null,
      earnedOnDay: streakThreeMilestone.day
    });
  }

  return awardedBadges;
}
