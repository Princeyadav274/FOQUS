import { RECORD_TYPES, SYNC_STATUS } from '../domain/types.js';
import { validateRecord } from '../domain/validator.js';
import { IdentityGraph } from './identityGraph.js';
import { computeUserStats, getCalendarDay } from '../domain/stats.js';
import { computeCommunityMetrics, timezoneToRegion } from '../domain/community.js';

export class SyncStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.profiles = new Map();         // canonUserId -> profileRecord
    this.sessions = new Map();         // sessionId -> sessionRecord
    this.sessionsByUser = new Map();   // canonUserId -> Set(sessionId)
    this.identityGraph = new IdentityGraph();
    this.erasedUsers = new Set();      // Set of erased identifiers
    
    // Triage Logs
    this.acceptedRecords = [];
    this.deduplicatedRecords = [];
    this.quarantinedRecords = [];

    // Counters
    this.countsByType = {
      [RECORD_TYPES.PROFILE]: 0,
      [RECORD_TYPES.SESSION]: 0,
      [RECORD_TYPES.LINK]: 0,
      [RECORD_TYPES.ERASURE_REQUEST]: 0
    };

    this.statusCounts = {
      [SYNC_STATUS.ACCEPTED]: 0,
      [SYNC_STATUS.DEDUPLICATED]: 0,
      [SYNC_STATUS.QUARANTINED]: 0
    };

    this.quarantineReasons = new Map(); // reason -> count
    this.latestTimestamp = 0;
  }

  /**
   * Provides read-only context methods to the validator.
   */
  getContext() {
    return {
      isUserErased: (userId) => {
        if (!userId) return false;
        if (this.erasedUsers.has(userId)) return true;
        const canon = this.identityGraph.getCanonicalId(userId);
        return this.erasedUsers.has(canon);
      },
      hasSession: (sessionId) => {
        return this.sessions.has(sessionId);
      },
      isProfileDuplicate: (profile) => {
        const canon = this.identityGraph.getCanonicalId(profile.userId);
        const existing = this.profiles.get(canon);
        if (!existing) return false;
        return (
          existing.nickname === profile.nickname &&
          existing.timezone === profile.timezone &&
          existing.profileMode === profile.profileMode
        );
      },
      isLinkDuplicate: (guestId, userId) => {
        return this.identityGraph.hasLink(guestId, userId);
      }
    };
  }

  /**
   * Synchronously processes an incoming record.
   * Categorizes into exactly one of: accepted, deduplicated, or quarantined.
   */
  processRecord(record) {
    if (record && record.type && this.countsByType[record.type] !== undefined) {
      this.countsByType[record.type]++;
    }

    const validation = validateRecord(record, this.getContext());

    if (validation.status === SYNC_STATUS.QUARANTINED) {
      this.statusCounts[SYNC_STATUS.QUARANTINED]++;
      const reason = validation.reason || 'Validation failed';
      this.quarantineReasons.set(reason, (this.quarantineReasons.get(reason) || 0) + 1);
      this.quarantinedRecords.push({
        id: `quar_${this.quarantinedRecords.length + 1}`,
        record,
        reason,
        receivedAt: record?.received_at || new Date().toISOString()
      });
      return { status: SYNC_STATUS.QUARANTINED, reason };
    }

    if (validation.status === SYNC_STATUS.DEDUPLICATED) {
      this.statusCounts[SYNC_STATUS.DEDUPLICATED]++;
      const reason = validation.reason || 'Duplicate record ignored';
      this.deduplicatedRecords.push({
        record,
        reason,
        receivedAt: record?.received_at || new Date().toISOString()
      });
      return { status: SYNC_STATUS.DEDUPLICATED, reason };
    }

    // Status is ACCEPTED
    this.statusCounts[SYNC_STATUS.ACCEPTED]++;
    this.acceptedRecords.push(record);

    switch (record.type) {
      case RECORD_TYPES.PROFILE:
        this._acceptProfile(record);
        break;
      case RECORD_TYPES.LINK:
        this._acceptLink(record);
        break;
      case RECORD_TYPES.ERASURE_REQUEST:
        this._acceptErasure(record);
        break;
      case RECORD_TYPES.SESSION:
        this._acceptSession(record);
        break;
    }

    return { status: SYNC_STATUS.ACCEPTED };
  }

  _acceptProfile(profile) {
    const canonId = this.identityGraph.getCanonicalId(profile.userId);
    this.profiles.set(canonId, { ...profile, userId: canonId });
    // Also track the original ID in case it's a guest
    if (canonId !== profile.userId) {
      this.profiles.set(profile.userId, profile);
    }
  }

  _acceptLink(link) {
    const { guestId, userId } = link;
    this.identityGraph.link(guestId, userId);
    const canonUser = this.identityGraph.getCanonicalId(userId);

    // Merge sessions from guest to canonical user
    const guestSessions = this.sessionsByUser.get(guestId) || new Set();
    if (!this.sessionsByUser.has(canonUser)) {
      this.sessionsByUser.set(canonUser, new Set());
    }
    const targetSet = this.sessionsByUser.get(canonUser);
    for (const sid of guestSessions) {
      targetSet.add(sid);
    }
    this.sessionsByUser.delete(guestId);
  }

  _acceptErasure(erasure) {
    const { userId } = erasure;
    const allIds = this.identityGraph.getAllAssociatedIds(userId);

    for (const id of allIds) {
      this.erasedUsers.add(id);
      this.profiles.delete(id);
      
      const sessionIds = this.sessionsByUser.get(id) || new Set();
      for (const sid of sessionIds) {
        this.sessions.delete(sid);
      }
      this.sessionsByUser.delete(id);
    }
  }

  _acceptSession(session) {
    this.sessions.set(session.id, session);
    if (session.timestamp > this.latestTimestamp) {
      this.latestTimestamp = session.timestamp;
    }

    const canonUser = this.identityGraph.getCanonicalId(session.userId);
    if (!this.sessionsByUser.has(canonUser)) {
      this.sessionsByUser.set(canonUser, new Set());
    }
    this.sessionsByUser.get(canonUser).add(session.id);
  }

  /**
   * Retrieves all sessions for a canonical user.
   */
  getUserSessions(userId) {
    const canon = this.identityGraph.getCanonicalId(userId);
    if (this.erasedUsers.has(canon)) return [];
    
    const sessionIds = this.sessionsByUser.get(canon) || new Set();
    const result = [];
    for (const sid of sessionIds) {
      const s = this.sessions.get(sid);
      if (s) result.push(s);
    }
    // Sort chronologically ascending
    return result.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Gets stats, streaks, and badges for a specific user.
   */
  getUserStats(userId) {
    const canon = this.identityGraph.getCanonicalId(userId);
    if (this.erasedUsers.has(canon)) {
      return null;
    }

    const sessions = this.getUserSessions(canon);
    const profile = this.profiles.get(canon) || {
      userId: canon,
      nickname: canon.startsWith('gst_') ? `Guest ${canon.slice(4, 10)}` : canon,
      timezone: 'UTC'
    };

    const referenceDay = getCalendarDay(this.latestTimestamp, profile.timezone);
    const stats = computeUserStats(sessions, profile.timezone, referenceDay);

    return {
      user: {
        userId: canon,
        nickname: profile.nickname || canon,
        timezone: profile.timezone || 'UTC',
        profileMode: profile.profileMode || 'unknown',
        createdAt: profile.createdAt || null
      },
      stats,
      sessions // full history for the owner
    };
  }

  /**
   * Returns list of all active users with basic stats.
   */
  getUserList() {
    const userList = [];
    const seen = new Set();

    // Iterate through profiles and users with sessions
    for (const [userId, profile] of this.profiles.entries()) {
      const canon = this.identityGraph.getCanonicalId(userId);
      if (this.erasedUsers.has(canon) || seen.has(canon)) continue;
      seen.add(canon);

      const sessionCount = (this.sessionsByUser.get(canon) || new Set()).size;
      userList.push({
        userId: canon,
        nickname: profile.nickname || canon,
        timezone: profile.timezone || 'UTC',
        profileMode: profile.profileMode || 'unknown',
        sessionCount
      });
    }

    // Include any users with sessions who didn't have an explicit profile record
    for (const [userId, sessionSet] of this.sessionsByUser.entries()) {
      const canon = this.identityGraph.getCanonicalId(userId);
      if (this.erasedUsers.has(canon) || seen.has(canon)) continue;
      seen.add(canon);

      userList.push({
        userId: canon,
        nickname: canon.startsWith('gst_') ? `Guest ${canon.slice(4, 10)}` : canon,
        timezone: 'UTC',
        profileMode: 'guest',
        sessionCount: sessionSet.size
      });
    }

    // Sort by session count descending
    return userList.sort((a, b) => b.sessionCount - a.sessionCount);
  }

  /**
   * Computes community metrics per ISO week and region.
   */
  getCommunityMetrics() {
    const allAcceptedSessions = Array.from(this.sessions.values());
    const getUserRegion = (userId) => {
      const canon = this.identityGraph.getCanonicalId(userId);
      const profile = this.profiles.get(canon);
      const tz = profile?.timezone || 'UTC';
      return timezoneToRegion(tz);
    };
    return computeCommunityMetrics(allAcceptedSessions, getUserRegion);
  }

  /**
   * Summary of sync health, counts, and quarantine reasons.
   */
  getHealthSummary() {
    const totalProcessed = 
      this.statusCounts[SYNC_STATUS.ACCEPTED] +
      this.statusCounts[SYNC_STATUS.DEDUPLICATED] +
      this.statusCounts[SYNC_STATUS.QUARANTINED];

    const quarantineBreakdown = {};
    for (const [reason, count] of this.quarantineReasons.entries()) {
      quarantineBreakdown[reason] = count;
    }

    // Anomaly detection metrics
    let legacyVersionSessions = 0;
    let clockDriftAheadCount = 0;

    for (const s of this.sessions.values()) {
      if (s.appVersion === '0.9.7') legacyVersionSessions++;
      if (s.received_at && new Date(s.timestamp) > new Date(s.received_at)) {
        clockDriftAheadCount++;
      }
    }

    return {
      totalProcessed,
      statusCounts: this.statusCounts,
      countsByType: this.countsByType,
      quarantineBreakdown,
      anomalies: {
        legacyVersionSessions,
        clockDriftAheadCount,
        erasedUsersCount: this.erasedUsers.size,
        totalQuarantined: this.quarantinedRecords.length
      },
      latestTimestamp: this.latestTimestamp,
      latestDateIso: this.latestTimestamp ? new Date(this.latestTimestamp).toISOString() : null
    };
  }

  /**
   * Returns quarantined records list.
   */
  getQuarantinedRecords(limit = 100) {
    return this.quarantinedRecords.slice(0, limit);
  }

  /**
   * GDPR Data Export for a single user.
   */
  exportUserData(userId) {
    const canon = this.identityGraph.getCanonicalId(userId);
    if (this.erasedUsers.has(canon)) return null;

    const data = this.getUserStats(canon);
    return data;
  }
}

// Global singleton instance for the app runtime
export const globalStore = new SyncStore();
