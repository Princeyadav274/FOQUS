import { RECORD_TYPES, VALID_DURATIONS } from './types.js';

/**
 * Validates incoming sync records and checks against current store state.
 * Returns an object: { status: 'accepted'|'deduplicated'|'quarantined', reason?: string, cleanRecord: object }
 */
export function validateRecord(record, storeContext) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return {
      status: 'quarantined',
      reason: 'Malformed record: expected a JSON object'
    };
  }

  const type = record.type;
  if (!type || !Object.values(RECORD_TYPES).includes(type)) {
    return {
      status: 'quarantined',
      reason: `Unknown record type: '${type}'`
    };
  }

  // 1. Profile Validation
  if (type === RECORD_TYPES.PROFILE) {
    if (!record.userId || typeof record.userId !== 'string') {
      return { status: 'quarantined', reason: 'Missing or invalid profile field: userId' };
    }
    if (storeContext.isUserErased(record.userId)) {
      return { status: 'quarantined', reason: `Profile rejected: user '${record.userId}' was erased` };
    }
    if (!record.timezone || typeof record.timezone !== 'string') {
      return { status: 'quarantined', reason: 'Missing or invalid profile field: timezone' };
    }
    if (storeContext.isProfileDuplicate(record)) {
      return { status: 'deduplicated', reason: 'Identical profile already recorded' };
    }
    return { status: 'accepted' };
  }

  // 2. Link Validation
  if (type === RECORD_TYPES.LINK) {
    if (!record.guestId || typeof record.guestId !== 'string') {
      return { status: 'quarantined', reason: 'Missing or invalid link field: guestId' };
    }
    if (!record.userId || typeof record.userId !== 'string') {
      return { status: 'quarantined', reason: 'Missing or invalid link field: userId' };
    }
    if (record.guestId === record.userId) {
      return { status: 'quarantined', reason: 'Invalid link: guestId and userId cannot be identical' };
    }
    if (storeContext.isUserErased(record.guestId) || storeContext.isUserErased(record.userId)) {
      return { status: 'quarantined', reason: 'Link rejected: one or both identities were erased' };
    }
    if (storeContext.isLinkDuplicate(record.guestId, record.userId)) {
      return { status: 'deduplicated', reason: 'Link already established' };
    }
    return { status: 'accepted' };
  }

  // 3. Erasure Request Validation
  if (type === RECORD_TYPES.ERASURE_REQUEST) {
    if (!record.userId || typeof record.userId !== 'string') {
      return { status: 'quarantined', reason: 'Missing or invalid erasure field: userId' };
    }
    if (storeContext.isUserErased(record.userId)) {
      return { status: 'deduplicated', reason: `Erasure request for '${record.userId}' already executed` };
    }
    return { status: 'accepted' };
  }

  // 4. Session Validation
  if (type === RECORD_TYPES.SESSION) {
    if (!record.id || typeof record.id !== 'string') {
      return { status: 'quarantined', reason: 'Missing or invalid session field: id' };
    }
    if (!record.userId || typeof record.userId !== 'string') {
      return { status: 'quarantined', reason: 'Missing or invalid session field: userId' };
    }
    if (typeof record.timestamp !== 'number' || isNaN(record.timestamp) || record.timestamp <= 0) {
      return { status: 'quarantined', reason: `Invalid session timestamp: ${record.timestamp} (uninitialized device RTC clock)` };
    }
    if (typeof record.durationSelected !== 'number' || record.durationSelected <= 0) {
      return { status: 'quarantined', reason: 'Missing or invalid session field: durationSelected' };
    }
    if (typeof record.durationCompletedSeconds !== 'number' || record.durationCompletedSeconds < 0) {
      return { status: 'quarantined', reason: 'Missing or invalid session field: durationCompletedSeconds' };
    }
    if (typeof record.completed !== 'boolean') {
      return { status: 'quarantined', reason: 'Missing or invalid session field: completed (boolean)' };
    }

    // Check if user is erased
    if (storeContext.isUserErased(record.userId)) {
      return { status: 'quarantined', reason: `Session rejected: user '${record.userId}' was erased` };
    }

    // Deduplication check
    if (storeContext.hasSession(record.id)) {
      return { status: 'deduplicated', reason: `Session '${record.id}' already received` };
    }

    // Validate metrics ranges
    if (record.calmScore !== undefined && record.calmScore !== null) {
      if (typeof record.calmScore !== 'number' || record.calmScore < 0 || record.calmScore > 1) {
        return {
          status: 'quarantined',
          reason: `Invalid calmScore: ${record.calmScore} is outside valid normalized range [0.0, 1.0]`
        };
      }
    }

    if (record.averageSteadiness !== undefined && record.averageSteadiness !== null) {
      if (typeof record.averageSteadiness !== 'number' || record.averageSteadiness < 0 || record.averageSteadiness > 1) {
        return {
          status: 'quarantined',
          reason: `Invalid averageSteadiness: ${record.averageSteadiness} is outside [0.0, 1.0]`
        };
      }
    }

    if (record.exhaleGatherRatio !== undefined && record.exhaleGatherRatio !== null) {
      if (typeof record.exhaleGatherRatio !== 'number' || record.exhaleGatherRatio < 0 || record.exhaleGatherRatio > 1) {
        return {
          status: 'quarantined',
          reason: `Invalid exhaleGatherRatio: ${record.exhaleGatherRatio} is outside [0.0, 1.0]`
        };
      }
    }

    if (record.thoughtsGathered !== undefined && (typeof record.thoughtsGathered !== 'number' || record.thoughtsGathered < 0)) {
      return { status: 'quarantined', reason: `Invalid thoughtsGathered: ${record.thoughtsGathered} must be non-negative` };
    }

    if (record.mergedThoughts !== undefined && (typeof record.mergedThoughts !== 'number' || record.mergedThoughts < 0)) {
      return { status: 'quarantined', reason: `Invalid mergedThoughts: ${record.mergedThoughts} must be non-negative` };
    }

    return { status: 'accepted' };
  }

  return { status: 'quarantined', reason: 'Unhandled validation state' };
}
