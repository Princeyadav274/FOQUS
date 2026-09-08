import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SyncStore } from '../src/store/syncStore.js';
import { RECORD_TYPES, SYNC_STATUS } from '../src/domain/types.js';

describe('Sync Ingestion & Classification', () => {
  let store;

  beforeEach(() => {
    store = new SyncStore();
  });

  it('accepts a valid profile record', () => {
    const res = store.processRecord({
      type: RECORD_TYPES.PROFILE,
      userId: 'usr_test_1',
      profileMode: 'online',
      nickname: 'quietSky',
      timezone: 'Europe/Warsaw',
      createdAt: '2026-01-01T00:00:00Z',
      received_at: '2026-01-01T00:10:00Z'
    });

    assert.equal(res.status, SYNC_STATUS.ACCEPTED);
    assert.equal(store.statusCounts.accepted, 1);
  });

  it('deduplicates an identical profile record', () => {
    const prof = {
      type: RECORD_TYPES.PROFILE,
      userId: 'usr_test_1',
      profileMode: 'online',
      nickname: 'quietSky',
      timezone: 'Europe/Warsaw',
      createdAt: '2026-01-01T00:00:00Z',
      received_at: '2026-01-01T00:10:00Z'
    };
    store.processRecord(prof);
    const res = store.processRecord(prof);

    assert.equal(res.status, SYNC_STATUS.DEDUPLICATED);
    assert.equal(store.statusCounts.accepted, 1);
    assert.equal(store.statusCounts.deduplicated, 1);
  });

  it('accepts a valid session and deduplicates re-delivery with different device', () => {
    store.processRecord({
      type: RECORD_TYPES.PROFILE,
      userId: 'usr_test_1',
      timezone: 'Europe/Warsaw'
    });

    const session1 = {
      type: RECORD_TYPES.SESSION,
      id: 'ses_abc123',
      userId: 'usr_test_1',
      device: 'dev_phone',
      appVersion: '1.4.2',
      timestamp: 1772450123000,
      durationSelected: 3,
      durationCompletedSeconds: 180,
      completed: true,
      thoughtsGathered: 15,
      mergedThoughts: 2,
      calmScore: 0.85,
      sessionMode: 'scored',
      isPractice: false
    };

    const res1 = store.processRecord(session1);
    assert.equal(res1.status, SYNC_STATUS.ACCEPTED);

    // Duplicate delivery from laptop
    const session2 = { ...session1, device: 'dev_laptop' };
    const res2 = store.processRecord(session2);
    assert.equal(res2.status, SYNC_STATUS.DEDUPLICATED);

    assert.equal(store.sessions.size, 1);
  });

  it('quarantines sessions with out-of-bounds calmScore (< 0 or > 1)', () => {
    const resNegative = store.processRecord({
      type: RECORD_TYPES.SESSION,
      id: 'ses_bad_1',
      userId: 'usr_test_1',
      timestamp: 1772450123000,
      durationSelected: 3,
      durationCompletedSeconds: 180,
      completed: true,
      calmScore: -0.45
    });
    assert.equal(resNegative.status, SYNC_STATUS.QUARANTINED);
    assert.match(resNegative.reason, /outside valid normalized range/);

    const resOverflow = store.processRecord({
      type: RECORD_TYPES.SESSION,
      id: 'ses_bad_2',
      userId: 'usr_test_1',
      timestamp: 1772450123000,
      durationSelected: 3,
      durationCompletedSeconds: 180,
      completed: true,
      calmScore: 1.89
    });
    assert.equal(resOverflow.status, SYNC_STATUS.QUARANTINED);
  });

  it('quarantines sessions with uninitialized timestamp (timestamp <= 0)', () => {
    const res = store.processRecord({
      type: RECORD_TYPES.SESSION,
      id: 'ses_epoch0',
      userId: 'usr_test_1',
      timestamp: 0,
      durationSelected: 3,
      durationCompletedSeconds: 180,
      completed: true
    });
    assert.equal(res.status, SYNC_STATUS.QUARANTINED);
    assert.match(res.reason, /uninitialized device RTC clock/);
  });

  it('guarantees Rule 1: Accepted + Deduplicated + Quarantined === Total Processed', () => {
    // Fire various records
    store.processRecord({ type: 'profile', userId: 'u1', timezone: 'UTC' });
    store.processRecord({ type: 'profile', userId: 'u1', timezone: 'UTC' }); // dup
    store.processRecord({ type: 'session', id: 's1', userId: 'u1', timestamp: 1772000000000, durationSelected: 1, durationCompletedSeconds: 60, completed: true });
    store.processRecord({ type: 'session', id: 's1', userId: 'u1', timestamp: 1772000000000, durationSelected: 1, durationCompletedSeconds: 60, completed: true }); // dup
    store.processRecord({ type: 'session', id: 's2', userId: 'u1', timestamp: 0, durationSelected: 1, durationCompletedSeconds: 60, completed: true }); // quar
    store.processRecord({ type: 'unknown_type', foo: 'bar' }); // quar

    const summary = store.getHealthSummary();
    assert.equal(summary.totalProcessed, 6);
    assert.equal(
      summary.statusCounts.accepted + summary.statusCounts.deduplicated + summary.statusCounts.quarantined,
      summary.totalProcessed
    );
  });
});
