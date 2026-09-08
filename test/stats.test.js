import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCalendarDay, calculateStreaks, computeUserStats } from '../src/domain/stats.js';

describe('Stats & Timezone Streak Engine', () => {
  it('correctly maps timestamps to calendar days in user timezone', () => {
    // 2026-03-01 23:30:00 UTC
    const ts = new Date('2026-03-01T23:30:00Z').getTime();

    // In New York (UTC-5), it is still 2026-03-01 18:30
    assert.equal(getCalendarDay(ts, 'America/New_York'), '2026-03-01');

    // In London (UTC+0), it is 2026-03-01 23:30
    assert.equal(getCalendarDay(ts, 'Europe/London'), '2026-03-01');

    // In Warsaw (UTC+1), it is already 2026-03-02 00:30
    assert.equal(getCalendarDay(ts, 'Europe/Warsaw'), '2026-03-02');

    // In Sydney (UTC+11), it is 2026-03-02 10:30
    assert.equal(getCalendarDay(ts, 'Australia/Sydney'), '2026-03-02');
  });

  it('calculates streaks accurately across consecutive calendar days', () => {
    const days = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-05', '2026-03-06'];
    const { bestStreak, currentStreak } = calculateStreaks(days, '2026-03-06');

    assert.equal(bestStreak, 3); // 01, 02, 03
    assert.equal(currentStreak, 2); // 05, 06
  });

  it('keeps current streak alive if last session was yesterday', () => {
    const days = ['2026-03-01', '2026-03-02', '2026-03-03'];
    // Today is 2026-03-04 (yesterday was 2026-03-03)
    const { currentStreak } = calculateStreaks(days, '2026-03-04');
    assert.equal(currentStreak, 3);

    // If today is 2026-03-05 (missed a day), streak resets to 0
    const reset = calculateStreaks(days, '2026-03-05');
    assert.equal(reset.currentStreak, 0);
  });

  it('ignores practice sessions for streak but counts them for mindful minutes', () => {
    const baseTime = new Date('2026-03-01T10:00:00Z').getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    const sessions = [
      // Day 1: completed scored session
      { id: 's1', timestamp: baseTime, durationSelected: 3, completed: true, sessionMode: 'scored', isPractice: false },
      // Day 2: completed practice session (does NOT count for streak)
      { id: 's2', timestamp: baseTime + oneDay, durationSelected: 5, completed: true, sessionMode: 'practice', isPractice: true },
      // Day 3: completed scored session
      { id: 's3', timestamp: baseTime + 2 * oneDay, durationSelected: 1, completed: true, sessionMode: 'scored', isPractice: false },
    ];

    const stats = computeUserStats(sessions, 'UTC', '2026-03-03');

    // Streaks broken by practice-only day
    assert.equal(stats.bestStreak, 1);
    // Mindful minutes include all completed sessions: 3 + 5 + 1 = 9
    assert.equal(stats.mindfulMinutes, 9);
    assert.equal(stats.completedSessions, 3);
    assert.equal(stats.scoredSessions, 2);
    assert.equal(stats.practiceSessions, 1);
  });

  it('counts multiple sessions on the same calendar day as a single streak increment', () => {
    const day1Morning = new Date('2026-03-01T08:00:00Z').getTime();
    const day1Evening = new Date('2026-03-01T20:00:00Z').getTime();
    const day2Morning = new Date('2026-03-02T08:00:00Z').getTime();

    const sessions = [
      { id: 's1', timestamp: day1Morning, durationSelected: 3, completed: true, sessionMode: 'scored', isPractice: false },
      { id: 's2', timestamp: day1Evening, durationSelected: 5, completed: true, sessionMode: 'scored', isPractice: false },
      { id: 's3', timestamp: day2Morning, durationSelected: 3, completed: true, sessionMode: 'scored', isPractice: false }
    ];

    const stats = computeUserStats(sessions, 'UTC', '2026-03-02');
    assert.equal(stats.bestStreak, 2); // 2 days, not 3
    assert.equal(stats.mindfulMinutes, 11);
  });
});
