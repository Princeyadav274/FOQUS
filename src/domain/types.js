/**
 * Record types and constants for FoQus Sync.
 */

export const RECORD_TYPES = {
  PROFILE: 'profile',
  SESSION: 'session',
  LINK: 'link',
  ERASURE_REQUEST: 'erasure_request'
};

export const SYNC_STATUS = {
  ACCEPTED: 'accepted',
  DEDUPLICATED: 'deduplicated',
  QUARANTINED: 'quarantined'
};

export const BADGE_DEFINITIONS = {
  FIRST_RESET: {
    id: 'first_reset',
    name: 'First Reset',
    description: 'First completed scored session'
  },
  THREE_DAY_STREAK: {
    id: '3_day_streak',
    name: '3-Day FoQus Streak',
    description: 'A streak reaches 3 consecutive days'
  },
  THOUGHT_GATHERER: {
    id: 'thought_gatherer',
    name: 'Thought Gatherer',
    description: '100 thoughts gathered in total'
  },
  HOUR_OF_CALM: {
    id: 'hour_of_calm',
    name: 'Hour of Calm',
    description: '60 mindful minutes completed'
  }
};

/**
 * Standard offered durations are 1, 3, 5 minutes.
 * Legacy app version 0.9.7 offered 2 and 10 minutes.
 */
export const STANDARD_DURATIONS = [1, 3, 5];
export const LEGACY_DURATIONS = [2, 10];
export const VALID_DURATIONS = [...STANDARD_DURATIONS, ...LEGACY_DURATIONS];
