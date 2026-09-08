import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SyncStore } from '../src/store/syncStore.js';
import { RECORD_TYPES, SYNC_STATUS } from '../src/domain/types.js';

describe('GDPR Erasure & Privacy Zero-Leakage', () => {
  let store;

  beforeEach(() => {
    store = new SyncStore();
  });

  it('erases a user, removing all their sessions and profiles from active state', () => {
    const userId = 'usr_erase_me';

    // Ingest profile
    store.processRecord({
      type: RECORD_TYPES.PROFILE,
      userId,
      nickname: 'temporary_user',
      timezone: 'Europe/Warsaw'
    });

    // Ingest sessions
    store.processRecord({
      type: RECORD_TYPES.SESSION,
      id: 'ses_temp_1',
      userId,
      timestamp: 1772000000000,
      durationSelected: 3,
      durationCompletedSeconds: 180,
      completed: true,
      feedbackComment: 'ultra sensitive private comment',
      sessionMode: 'scored',
      isPractice: false
    });

    assert.equal(store.sessions.size, 1);
    assert.ok(store.getUserStats(userId));

    // Send erasure request
    const erasureRes = store.processRecord({
      type: RECORD_TYPES.ERASURE_REQUEST,
      userId,
      received_at: '2026-03-21T14:00:00Z'
    });

    assert.equal(erasureRes.status, SYNC_STATUS.ACCEPTED);

    // Verify user is gone from store
    assert.equal(store.getUserStats(userId), null);
    assert.equal(store.sessions.size, 0);
    assert.equal(store.getUserSessions(userId).length, 0);

    // Subsequent session from an offline device must be quarantined
    const postErasureSession = store.processRecord({
      type: RECORD_TYPES.SESSION,
      id: 'ses_temp_2',
      userId,
      timestamp: 1772010000000,
      durationSelected: 3,
      durationCompletedSeconds: 180,
      completed: true
    });

    assert.equal(postErasureSession.status, SYNC_STATUS.QUARANTINED);
    assert.match(postErasureSession.reason, /was erased/);
  });

  it('erases linked guest sessions when user is erased', () => {
    const guestId = 'gst_guest_1';
    const userId = 'usr_account_1';

    // Guest meditates
    store.processRecord({
      type: RECORD_TYPES.SESSION,
      id: 'ses_guest_1',
      userId: guestId,
      timestamp: 1772000000000,
      durationSelected: 3,
      durationCompletedSeconds: 180,
      completed: true
    });

    // Link guest to account
    store.processRecord({
      type: RECORD_TYPES.LINK,
      guestId,
      userId
    });

    // Erase user account
    store.processRecord({
      type: RECORD_TYPES.ERASURE_REQUEST,
      userId
    });

    // Both user and guest sessions must be gone
    assert.equal(store.sessions.size, 0);
    assert.equal(store.getUserStats(userId), null);
    assert.equal(store.getUserStats(guestId), null);
  });

  it('guarantees Rule 2: feedbackComment never leaks into community table or health logs', () => {
    const secret = 'TOP_SECRET_PERSONAL_NOTE_123';

    store.processRecord({
      type: RECORD_TYPES.PROFILE,
      userId: 'usr_secretive',
      timezone: 'Europe/Warsaw'
    });

    store.processRecord({
      type: RECORD_TYPES.SESSION,
      id: 'ses_secret',
      userId: 'usr_secretive',
      timestamp: 1772450123000,
      durationSelected: 5,
      durationCompletedSeconds: 300,
      completed: true,
      calmScore: 0.8,
      sessionMode: 'scored',
      isPractice: false,
      feedbackComment: secret
    });

    // Check community metrics JSON string
    const communityJson = JSON.stringify(store.getCommunityMetrics());
    assert.equal(communityJson.includes(secret), false, 'Community metrics must not contain feedbackComment');

    // Check health summary JSON string
    const healthJson = JSON.stringify(store.getHealthSummary());
    assert.equal(healthJson.includes(secret), false, 'Health summary must not contain feedbackComment');
  });
});
