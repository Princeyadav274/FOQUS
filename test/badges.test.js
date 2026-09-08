import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeUserStats } from '../src/domain/stats.js';

describe('Badges Awarding Engine', () => {
  it('awards First Reset on the first completed scored session', () => {
    const t1 = 1772000000000;
    const t2 = 1772100000000;

    const sessions = [
      // Practice session does not trigger First Reset
      { id: 's_practice', timestamp: t1, durationSelected: 3, completed: true, sessionMode: 'practice', isPractice: true },
      // Scored session triggers First Reset
      { id: 's_scored', timestamp: t2, durationSelected: 3, completed: true, sessionMode: 'scored', isPractice: false }
    ];

    const stats = computeUserStats(sessions, 'UTC');
    const firstReset = stats.badges.find(b => b.id === 'first_reset');

    assert.ok(firstReset, 'First Reset badge should be awarded');
    assert.equal(firstReset.earnedAtSessionId, 's_scored');
    assert.equal(firstReset.earnedAtTimestamp, t2);
  });

  it('awards Thought Gatherer when cumulative thoughts gathered reaches 100', () => {
    const t1 = 1772000000000;
    const t2 = 1772100000000;
    const t3 = 1772200000000;

    const sessions = [
      { id: 's1', timestamp: t1, durationSelected: 3, completed: true, thoughtsGathered: 40, sessionMode: 'scored', isPractice: false },
      { id: 's2', timestamp: t2, durationSelected: 3, completed: true, thoughtsGathered: 50, sessionMode: 'scored', isPractice: false }, // total 90
      { id: 's3', timestamp: t3, durationSelected: 3, completed: true, thoughtsGathered: 20, sessionMode: 'scored', isPractice: false }  // total 110
    ];

    const stats = computeUserStats(sessions, 'UTC');
    const thoughtBadge = stats.badges.find(b => b.id === 'thought_gatherer');

    assert.ok(thoughtBadge, 'Thought Gatherer badge should be awarded');
    assert.equal(thoughtBadge.earnedAtSessionId, 's3');
    assert.equal(thoughtBadge.earnedAtTimestamp, t3);
  });

  it('awards Hour of Calm when cumulative mindful minutes reaches 60', () => {
    const sessions = [];
    const baseTs = 1772000000000;

    // Add 11 sessions of 5 minutes = 55 minutes
    for (let i = 0; i < 11; i++) {
      sessions.push({
        id: `s_${i}`,
        timestamp: baseTs + i * 3600000,
        durationSelected: 5,
        completed: true,
        sessionMode: 'scored',
        isPractice: false
      });
    }

    // 12th session adds 5 min = 60 minutes
    sessions.push({
      id: 's_unlock',
      timestamp: baseTs + 11 * 3600000,
      durationSelected: 5,
      completed: true,
      sessionMode: 'scored',
      isPractice: false
    });

    const stats = computeUserStats(sessions, 'UTC');
    const hourBadge = stats.badges.find(b => b.id === 'hour_of_calm');

    assert.ok(hourBadge, 'Hour of Calm badge should be awarded');
    assert.equal(hourBadge.earnedAtSessionId, 's_unlock');
  });

  it('awards 3-Day FoQus Streak on the 3rd consecutive day', () => {
    const day1 = new Date('2026-03-01T10:00:00Z').getTime();
    const day2 = new Date('2026-03-02T10:00:00Z').getTime();
    const day3 = new Date('2026-03-03T10:00:00Z').getTime();

    const sessions = [
      { id: 's1', timestamp: day1, durationSelected: 3, completed: true, sessionMode: 'scored', isPractice: false },
      { id: 's2', timestamp: day2, durationSelected: 3, completed: true, sessionMode: 'scored', isPractice: false },
      { id: 's3', timestamp: day3, durationSelected: 3, completed: true, sessionMode: 'scored', isPractice: false }
    ];

    const stats = computeUserStats(sessions, 'UTC', '2026-03-03');
    const streakBadge = stats.badges.find(b => b.id === '3_day_streak');

    assert.ok(streakBadge, '3-Day FoQus Streak badge should be awarded');
    assert.equal(streakBadge.earnedAtSessionId, 's3');
  });
});
