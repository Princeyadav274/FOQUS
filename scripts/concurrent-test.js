import http from 'http';
import { globalStore } from '../src/store/syncStore.js';
import { RECORD_TYPES } from '../src/domain/types.js';

async function runConcurrencyStressTest() {
  console.log(`\n================================================================`);
  console.log(`⚡ FoQus Sync — Concurrent Delivery Stress Test`);
  console.log(`================================================================\n`);

  const testSessionId = `ses_stress_test_${Date.now()}`;
  const testUserId = `usr_stress_tester_${Date.now()}`;
  const concurrencyCount = 20;

  console.log(`Creating test profile for ${testUserId}...`);
  globalStore.processRecord({
    type: RECORD_TYPES.PROFILE,
    userId: testUserId,
    profileMode: 'online',
    nickname: 'Concurrency Champion',
    timezone: 'Europe/Warsaw',
    createdAt: new Date().toISOString(),
    received_at: new Date().toISOString()
  });

  console.log(`Firing ${concurrencyCount} simultaneous copies of session '${testSessionId}'...`);

  const baseSession = {
    type: RECORD_TYPES.SESSION,
    id: testSessionId,
    userId: testUserId,
    appVersion: '1.4.2',
    timestamp: Date.now(),
    durationSelected: 3,
    durationCompletedSeconds: 180,
    completed: true,
    thoughtsGathered: 15,
    mergedThoughts: 3,
    thoughtLoad: 'moderate',
    soundMode: 'Gentle Waves',
    intention: 'Focus',
    reflection: 'Calmer',
    feedbackComment: 'Testing high concurrency delivery',
    sessionMode: 'scored',
    isPractice: false,
    averageSteadiness: 0.88,
    exhaleGatherRatio: 0.65,
    calmScore: 0.91,
    received_at: new Date().toISOString()
  };

  const results = await Promise.all(
    Array.from({ length: concurrencyCount }, (_, i) => {
      return new Promise((resolve) => {
        // Random micro-jitter to simulate real-world packet arrivals
        setTimeout(() => {
          const res = globalStore.processRecord({
            ...baseSession,
            device: `dev_worker_client_${i + 1}`
          });
          resolve({ attempt: i + 1, res });
        }, Math.random() * 15);
      });
    })
  );

  const accepted = results.filter(r => r.res.status === 'accepted').length;
  const deduplicated = results.filter(r => r.res.status === 'deduplicated').length;
  const quarantined = results.filter(r => r.res.status === 'quarantined').length;

  console.log(`\nResults:`);
  console.log(`- Total Requests Fired: ${concurrencyCount}`);
  console.log(`- Accepted:             ${accepted}`);
  console.log(`- Deduplicated:         ${deduplicated}`);
  console.log(`- Quarantined:          ${quarantined}`);

  if (accepted === 1 && deduplicated === concurrencyCount - 1) {
    console.log(`\n✅ SUCCESS: Exactly 1 copy was accepted and ${deduplicated} duplicate deliveries were cleanly collapsed.`);
  } else {
    console.error(`\n❌ FAILURE: Race condition detected! Accepted = ${accepted}`);
    process.exit(1);
  }

  // Check user stats
  const userStats = globalStore.getUserStats(testUserId);
  console.log(`User Mindful Minutes: ${userStats.stats.mindfulMinutes} (Expected: 3)`);
  console.log(`User Total Sessions:  ${userStats.stats.totalSessions} (Expected: 1)`);

  if (userStats.stats.mindfulMinutes === 3 && userStats.stats.totalSessions === 1) {
    console.log(`✅ VERIFIED: Zero double-counting occurred in user history and mindful minutes.\n`);
  } else {
    console.error(`❌ VERIFIED: Double counting occurred!`);
    process.exit(1);
  }
}

runConcurrencyStressTest().catch(console.error);
