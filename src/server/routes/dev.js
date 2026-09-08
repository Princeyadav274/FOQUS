import express from 'express';
import { globalStore } from '../../store/syncStore.js';
import { RECORD_TYPES } from '../../domain/types.js';

export const devRouter = express.Router();

/**
 * POST /api/dev/concurrent-sync
 * Generates a test session and fires multiple identical copies simultaneously into the store.
 */
devRouter.post('/concurrent-sync', async (req, res) => {
  const count = parseInt(req.body.count || '10', 10);
  const testSessionId = `ses_dev_stress_${Date.now()}`;
  const testUserId = req.body.userId || 'usr_dev_tester';

  // Ensure test profile exists
  globalStore.processRecord({
    type: RECORD_TYPES.PROFILE,
    userId: testUserId,
    profileMode: 'online',
    nickname: 'Dev Stress Tester',
    timezone: 'Europe/Warsaw',
    createdAt: new Date().toISOString(),
    received_at: new Date().toISOString()
  });

  const sessionPayload = {
    type: RECORD_TYPES.SESSION,
    id: testSessionId,
    userId: testUserId,
    device: 'dev_stress_node',
    appVersion: '1.4.2',
    timestamp: Date.now(),
    durationSelected: 3,
    durationCompletedSeconds: 180,
    completed: true,
    thoughtsGathered: 12,
    mergedThoughts: 2,
    thoughtLoad: 'moderate',
    soundMode: 'Warm Pad',
    intention: 'Focus',
    reflection: 'Calmer',
    feedbackComment: 'Testing concurrent delivery idempotency',
    sessionMode: 'scored',
    isPractice: false,
    averageSteadiness: 0.85,
    exhaleGatherRatio: 0.70,
    calmScore: 0.88,
    received_at: new Date().toISOString()
  };

  // Dispatch multiple concurrent requests asynchronously
  const promises = Array.from({ length: count }, (_, idx) => {
    return new Promise((resolve) => {
      // Simulate varying network jitter
      const jitterMs = Math.floor(Math.random() * 20);
      setTimeout(() => {
        const result = globalStore.processRecord({
          ...sessionPayload,
          device: `dev_stress_client_${idx + 1}`
        });
        resolve({ attempt: idx + 1, result });
      }, jitterMs);
    });
  });

  const results = await Promise.all(promises);

  const acceptedCount = results.filter(r => r.result.status === 'accepted').length;
  const deduplicatedCount = results.filter(r => r.result.status === 'deduplicated').length;
  const quarantinedCount = results.filter(r => r.result.status === 'quarantined').length;

  return res.json({
    testSessionId,
    totalFired: count,
    summary: {
      accepted: acceptedCount,
      deduplicated: deduplicatedCount,
      quarantined: quarantinedCount
    },
    exactOneAccepted: acceptedCount === 1,
    details: results
  });
});
