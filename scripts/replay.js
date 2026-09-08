import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import { SyncStore } from '../src/store/syncStore.js';
import { BADGE_DEFINITIONS } from '../src/domain/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runReplay() {
  const logArg = process.argv[2] || 'fixtures/sync-log.jsonl';
  const filePath = path.resolve(process.cwd(), logArg);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: Log file not found at ${filePath}`);
    process.exit(1);
  }

  const startTime = Date.now();
  console.log(`\n================================================================`);
  console.log(`🌿 FoQus Sync — Replay Runner`);
  console.log(`   Source: ${filePath}`);
  console.log(`================================================================\n`);

  const store = new SyncStore();

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    lineCount++;
    try {
      const record = JSON.parse(line);
      store.processRecord(record);
    } catch (err) {
      store.processRecord({
        type: 'invalid',
        raw: line,
        error: err.message
      });
    }
  }

  const durationMs = Date.now() - startTime;

  // Compute summary stats
  const health = store.getHealthSummary();
  const userList = store.getUserList();
  const communityTable = store.getCommunityMetrics();

  // Aggregate badges and streaks across all active users
  const badgeCounts = {
    [BADGE_DEFINITIONS.FIRST_RESET.name]: 0,
    [BADGE_DEFINITIONS.THREE_DAY_STREAK.name]: 0,
    [BADGE_DEFINITIONS.THOUGHT_GATHERER.name]: 0,
    [BADGE_DEFINITIONS.HOUR_OF_CALM.name]: 0
  };

  let longestBestStreak = 0;
  let longestStreakUser = null;

  for (const user of userList) {
    const userStats = store.getUserStats(user.userId);
    if (userStats && userStats.stats) {
      const { bestStreak, badges } = userStats.stats;
      if (bestStreak > longestBestStreak) {
        longestBestStreak = bestStreak;
        longestStreakUser = user.nickname || user.userId;
      }
      for (const b of badges) {
        if (badgeCounts[b.name] !== undefined) {
          badgeCounts[b.name]++;
        }
      }
    }
  }

  // Count accepted, deduplicated, quarantined sessions
  let sessionsAccepted = 0;
  let sessionsDeduplicated = 0;
  let sessionsQuarantined = 0;

  for (const item of store.acceptedRecords) {
    if (item.type === 'session') sessionsAccepted++;
  }
  for (const item of store.deduplicatedRecords) {
    if (item.record?.type === 'session') sessionsDeduplicated++;
  }
  for (const item of store.quarantinedRecords) {
    if (item.record?.type === 'session') sessionsQuarantined++;
  }

  // PRINT SUMMARY
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 REPLAY SUMMARY REPORT`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Processed: ${lineCount} records in ${durationMs}ms (${Math.round(lineCount / (durationMs / 1000))} rec/sec)\n`);

  console.log(`1. RECORDS BY TYPE`);
  console.log(`   - Profile:          ${String(health.countsByType.profile).padStart(6)}`);
  console.log(`   - Session:          ${String(health.countsByType.session).padStart(6)}`);
  console.log(`   - Link:             ${String(health.countsByType.link).padStart(6)}`);
  console.log(`   - Erasure Request:  ${String(health.countsByType.erasure_request).padStart(6)}`);
  console.log(`   ─────────────────────────`);
  console.log(`   Total:              ${String(health.totalProcessed).padStart(6)}\n`);

  console.log(`2. SESSIONS CLASSIFICATION`);
  console.log(`   - Accepted:         ${String(sessionsAccepted).padStart(6)}`);
  console.log(`   - Deduplicated:     ${String(sessionsDeduplicated).padStart(6)}`);
  console.log(`   - Quarantined:      ${String(sessionsQuarantined).padStart(6)}`);
  console.log(`   ─────────────────────────`);
  console.log(`   Total Sessions:     ${String(health.countsByType.session).padStart(6)}\n`);

  console.log(`3. QUARANTINE BREAKDOWN BY REASON`);
  if (Object.keys(health.quarantineBreakdown).length === 0) {
    console.log(`   (No records quarantined)`);
  } else {
    for (const [reason, count] of Object.entries(health.quarantineBreakdown)) {
      console.log(`   • [${String(count).padStart(3)}x] ${reason}`);
    }
  }
  console.log('');

  console.log(`4. PEOPLE WITH A HISTORY`);
  console.log(`   - Active Profiles / Users with history: ${userList.length}`);
  console.log(`   - GDPR Erased Users:                    ${health.anomalies.erasedUsersCount}`);
  console.log(`   - Longest Best Streak:                  ${longestBestStreak} days (${longestStreakUser})\n`);

  console.log(`5. BADGES AWARDED BY TYPE`);
  for (const [badgeName, count] of Object.entries(badgeCounts)) {
    console.log(`   - ${badgeName.padEnd(22)}: ${String(count).padStart(4)} awarded`);
  }
  console.log('');

  console.log(`6. COMMUNITY COLLECTIVE TABLE`);
  console.log(`┌───────────┬──────────────┬──────────┬──────────────┬────────┬───────────────┐`);
  console.log(`│ ISO Week  │ Region       │ Sessions │ Mindful Mins │ People │ Typ. Calm (M) │`);
  console.log(`├───────────┼──────────────┼──────────┼──────────────┼────────┼───────────────┤`);
  for (const row of communityTable) {
    const weekStr = row.isoWeek.padEnd(9);
    const regionStr = row.region.padEnd(12);
    const sessStr = String(row.sessionsCount).padStart(8);
    const minsStr = String(row.mindfulMinutes).padStart(12);
    const peopleStr = String(row.peopleCount).padStart(6);
    const calmStr = (row.typicalCalmScore !== null ? row.typicalCalmScore.toFixed(2) : 'N/A').padStart(13);
    console.log(`│ ${weekStr} │ ${regionStr} │ ${sessStr} │ ${minsStr} │ ${peopleStr} │ ${calmStr} │`);
  }
  console.log(`└───────────┴──────────────┴──────────┴──────────────┴────────┴───────────────┘\n`);

  console.log(`================================================================\n`);
}

runReplay().catch(console.error);
