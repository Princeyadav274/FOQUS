# FoQus Sync — Replay & Architectural Report

---

## 1. Verbatim Replay Summary

```
================================================================
🌿 FoQus Sync — Replay Runner
   Source: fixtures/sync-log.jsonl
================================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 REPLAY SUMMARY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Processed: 8416 records in 44ms (191273 rec/sec)

1. RECORDS BY TYPE
   - Profile:             327
   - Session:            8060
   - Link:                 25
   - Erasure Request:       4
   ─────────────────────────
   Total:                8416

2. SESSIONS CLASSIFICATION
   - Accepted:           7749
   - Deduplicated:        194
   - Quarantined:         117
   ─────────────────────────
   Total Sessions:       8060

3. QUARANTINE BREAKDOWN BY REASON
   • [  1x] Invalid calmScore: -0.576 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.164 is outside valid normalized range [0.0, 1.0]
   • [  5x] Invalid session timestamp: 0 (uninitialized device RTC clock)
   • [  1x] Invalid calmScore: -0.893 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 2.389 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: -0.638 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: -0.762 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.113 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: -0.764 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: -0.822 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.046 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.081 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.464 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 2.163 is outside valid normalized range [0.0, 1.0]
   • [ 23x] Session rejected: user 'usr_jw2tpadmnedj' was erased
   • [ 26x] Session rejected: user 'usr_ndqr5mt8da7y' was erased
   • [  1x] Invalid calmScore: 1.72 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: -0.438 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 2.39 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.993 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: -0.062 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: -0.017 is outside valid normalized range [0.0, 1.0]
   • [ 19x] Session rejected: user 'usr_jps2b4x2kf5x' was erased
   • [ 14x] Session rejected: user 'usr_7juk88m35nqr' was erased
   • [  1x] Invalid calmScore: -0.057 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.417 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.284 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: -0.606 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 2.035 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: -0.8 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.686 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.325 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 1.278 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 2.35 is outside valid normalized range [0.0, 1.0]
   • [  1x] Invalid calmScore: 2.046 is outside valid normalized range [0.0, 1.0]

4. PEOPLE WITH A HISTORY
   - Active Profiles / Users with history: 299
   - GDPR Erased Users:                    4
   - Longest Best Streak:                  23 days (soft190)

5. BADGES AWARDED BY TYPE
   - First Reset           :  299 awarded
   - 3-Day FoQus Streak    :  216 awarded
   - Thought Gatherer      :  281 awarded
   - Hour of Calm          :  171 awarded

6. COMMUNITY COLLECTIVE TABLE
┌───────────┬──────────────┬──────────┬──────────────┬────────┬───────────────┐
│ ISO Week  │ Region       │ Sessions │ Mindful Mins │ People │ Typ. Calm (M) │
├───────────┼──────────────┼──────────┼──────────────┼────────┼───────────────┤
│ 2026-W15  │ Americas     │      155 │          433 │     38 │          0.74 │
│ 2026-W15  │ Asia         │      294 │          862 │     67 │          0.71 │
│ 2026-W15  │ Europe       │      420 │         1251 │    107 │          0.74 │
│ 2026-W15  │ Global / UTC │        1 │            3 │      1 │          0.65 │
│ 2026-W15  │ Oceania      │      111 │          329 │     26 │          0.74 │
│ 2026-W14  │ Americas     │      169 │          496 │     40 │          0.75 │
│ 2026-W14  │ Asia         │      338 │         1030 │     70 │          0.73 │
│ 2026-W14  │ Europe       │      481 │         1421 │    107 │          0.73 │
│ 2026-W14  │ Oceania      │      131 │          388 │     29 │          0.73 │
│ 2026-W13  │ Americas     │      175 │          494 │     40 │          0.74 │
│ 2026-W13  │ Asia         │      322 │          944 │     69 │          0.72 │
│ 2026-W13  │ Europe       │      509 │         1447 │    107 │          0.74 │
│ 2026-W13  │ Global / UTC │        2 │            8 │      2 │          0.56 │
│ 2026-W13  │ Oceania      │      162 │          453 │     31 │          0.72 │
│ 2026-W12  │ Americas     │      177 │          546 │     39 │          0.75 │
│ 2026-W12  │ Asia         │      301 │          849 │     66 │          0.74 │
│ 2026-W12  │ Europe       │      485 │         1359 │    108 │          0.74 │
│ 2026-W12  │ Oceania      │      147 │          446 │     32 │          0.74 │
│ 2026-W11  │ Americas     │      191 │          518 │     46 │          0.71 │
│ 2026-W11  │ Asia         │      326 │          950 │     77 │          0.75 │
│ 2026-W11  │ Europe       │      499 │         1451 │    123 │          0.75 │
│ 2026-W11  │ Oceania      │      142 │          404 │     29 │          0.74 │
│ 2026-W10  │ Americas     │      208 │          601 │     48 │          0.75 │
│ 2026-W10  │ Asia         │      378 │         1044 │     81 │          0.72 │
│ 2026-W10  │ Europe       │      547 │         1595 │    123 │          0.72 │
│ 2026-W10  │ Oceania      │      161 │          441 │     33 │          0.72 │
│ 2026-W09  │ Americas     │       20 │           68 │     18 │          0.78 │
│ 2026-W09  │ Asia         │       55 │          147 │     46 │          0.71 │
│ 2026-W09  │ Europe       │       86 │          242 │     75 │          0.75 │
│ 2026-W09  │ Oceania      │       29 │           77 │     23 │          0.72 │
└───────────┴──────────────┴──────────┴──────────────┴────────┴───────────────┘
```

---

## 2. What We Noticed About the Data

1. **Legacy App Durations (2 and 10 minutes)**: Exactly 40 sessions in the log have `durationSelected` of 2 or 10 minutes. Deep inspection revealed that 100% of these 40 sessions came from `appVersion: "0.9.7"` (prior to product standardization to 1, 3, 5 min). **Decision**: We accept these sessions as legitimate completed mindful resets; mindful minutes are credited according to `durationSelected`.
2. **Out-of-Bounds `calmScore` Metrics**: Exactly 30 sessions contain impossible `calmScore` values (< 0.0 or > 1.0, e.g., `-0.576`, `2.389`). **Decision**: Quarantined with human-readable reason `Invalid calmScore: ... outside valid normalized range [0.0, 1.0]` to prevent mathematical skewing of community scores and user history.
3. **Uninitialized Hardware Clock (`timestamp: 0`)**: 5 sessions arrived with `timestamp = 0` (epoch zero / Jan 1 1970). **Decision**: Quarantined with reason `Invalid session timestamp: 0 (uninitialized device RTC clock)` rather than polluting 1970 in user streak calendars and community tables.
4. **Post-Erasure Cached Sync Deliveries**: For the 4 erased accounts, exactly 82 cached sessions arrived *after* their erasure request timestamp. **Decision**: Under GDPR Article 17, the server must never resurrect deleted accounts; these subsequent deliveries are quarantined with reason `Session rejected: user '...' was erased`.
5. **Cross-Device Deduplication**: 194 session deliveries had identical session IDs delivered from differing devices (e.g. phone vs laptop). All 194 were atomically collapsed to `deduplicated` with zero double-counting.
6. **Clock Drift Ahead**: 128 sessions had device timestamps ahead of `received_at` (common on unsynchronized client clocks). **Decision**: Accepted using device `timestamp` for local calendar day grouping.

---

## 3. Explicit Definitions Where Brief Left Room

- **Streak Continuity ("Today" & "Yesterday")**: A streak remains alive if the user completed a scored session today OR yesterday (allowing the user to complete today's session before midnight). If more than 1 calendar day is missed, `currentStreak` resets to 0.
- **Multiple Sessions in One Day**: Multiple completed scored sessions on the same calendar day count as 1 streak day, while all sessions contribute to cumulative `mindfulMinutes` and `thoughtsGathered`.
- **Practice Sessions**: Practice sessions (`sessionMode === "practice"` or `isPractice === true`) never contribute to streaks or `First Reset`, but always contribute to `mindfulMinutes`, `thoughtsGathered`, and `Hour of Calm`.
- **Identity Graph & Chained Links**: Links merge guest session histories transitively and retroactively. Erasure requests cascade across all linked aliases.
- **Community View Privacy (k-Anonymity)**: Collective rows are grouped by ISO 8601 week and continent-level region. Cells with fewer than 2 people are flagged to prevent re-identification. `feedbackComment` is stripped from public memory.

---

## 4. Technology Stack Rationale

- **Runtime & API: Node.js (v20+) & Express**: Provides native, zero-dependency streaming performance (processes >8,400 records in 44ms), native `Intl` IANA timezone support, and zero external binary compilation friction on any clean Mac or Linux machine.
- **Storage Layer: In-Memory Transactional Store with Disjoint-Set Graph**: Deterministic O(1) deduplication and O(α(N)) identity resolution. Instant recomputation without external database server overhead.
- **Frontend: Modern Vanilla HTML5 / Glassmorphic CSS3 / ES Modules**: Eliminates fragile frontend build tooling while delivering a serene, high-end calm meditation aesthetic with responsive layouts and live micro-animations.
- **Test Framework: Native Node.js Test Runner (`node --test`)**: Instant test execution (19 tests in 135ms) without third-party test framework vulnerabilities.
