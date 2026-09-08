import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SyncStore } from '../src/store/syncStore.js';
import { RECORD_TYPES } from '../src/domain/types.js';

describe('Concurrent Delivery & Atomic Deduplication', () => {
  it('deduplicates 50 simultaneous arrivals of the same session record with zero race conditions', async () => {
    const store = new SyncStore();
    const testSessionId = 'ses_concurrent_123';
    const testUserId = 'usr_concurrent_user';

    store.processRecord({
      type: RECORD_TYPES.PROFILE,
      userId: testUserId,
      timezone: 'Europe/Warsaw'
    });

    const baseSession = {
      type: RECORD_TYPES.SESSION,
      id: testSessionId,
      userId: testUserId,
      timestamp: 1772450123000,
      durationSelected: 3,
      durationCompletedSeconds: 180,
      completed: true,
      thoughtsGathered: 10,
      calmScore: 0.8,
      sessionMode: 'scored',
      isPractice: false
    };

    const count = 50;
    const promises = Array.from({ length: count }, (_, i) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const res = store.processRecord({
            ...baseSession,
            device: `dev_client_${i + 1}`
          });
          resolve(res);
        }, Math.random() * 10);
      });
    });

    const results = await Promise.all(promises);

    const accepted = results.filter(r => r.status === 'accepted').length;
    const deduplicated = results.filter(r => r.status === 'deduplicated').length;

    assert.equal(accepted, 1, 'Exactly 1 record must be accepted');
    assert.equal(deduplicated, count - 1, 'All other records must be deduplicated');
    assert.equal(store.sessions.size, 1);

    const userStats = store.getUserStats(testUserId);
    assert.equal(userStats.stats.mindfulMinutes, 3);
    assert.equal(userStats.stats.totalSessions, 1);
  });
});
