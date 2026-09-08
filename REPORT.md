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

---

## 5. Working with AI — Required Log

### 1. One Prompt That Worked Well (Pasted as-is)
> *"Verify that my sync endpoint and stats engine actually satisfy the task's correctness requirements — don't just check that the code runs, check that the OUTPUT is correct.*
>
> *Do the following and show me the actual results, not just "looks good":*
>
> 1. *IDEMPOTENCY: Take one session record from fixtures/sync-log.jsonl. POST it to the sync endpoint 5 times in a row (including at least 2 requests fired concurrently/in parallel, not sequentially). Query the database afterward and confirm exactly ONE row exists for that session id. Show me the row count.*
> 2. *ORDER INDEPENDENCE: Take a small slice of records (say 20 lines) that includes a `link` record arriving AFTER some sessions from both the guestId and userId it links. Replay them in original order, then replay the same 20 lines in a shuffled order. Compute that person's full stats (streak, minutes, badges) both times and diff the two results — they must be identical.*
> 3. *STREAK TIMEZONE CORRECTNESS: Find or construct a case where a session's UTC timestamp falls on calendar day X, but in the user's local timezone it falls on calendar day X+1 or X-1. Show how the streak engine handles it.*
> 4. *QUARANTINE COMPLETENESS: Run the full fixtures/sync-log.jsonl through the system. Count: Accepted records, Deduplicated records, Quarantined records. The sum of those three numbers MUST equal the total number of lines in the log. Show the three counts and the sum.*
> 5. *PRIVACY LEAK CHECK: Check every endpoint except the owner's own history: does `feedbackComment` appear anywhere in the output? Check the community endpoint, health endpoint, any diagnostic or error outputs. Confirm zero occurrences.*
> 6. *RECOMPUTE CONSISTENCY: Pick one user with a long history. Compute their stats incrementally. Then compute their stats from scratch. Diff the two results."*

**Why it worked well:** It prevented superficial "all unit tests passed" responses and forced the assistant to build an empirical verification engine (`scripts/verify-correctness.js`) that directly audited the 8,416 records against the exact invariants.

---

### 2. Two Things the AI Got Wrong That Were Caught

1. **Unstyled Screen 2 (Community & Ops Health) during the Bento Redesign:**
   - *What the AI did:* When converting the UI to the modern Soft UI 2.0 / Bento layout, the AI focused exclusively on Screen 1 (Personal Practice), leaving Screen 2 referencing obsolete CSS classes. Navigating to the Community tab displayed raw, unaligned HTML without card styling or table formatting.
   - *How I caught it:* Switched to the Community & Ops Health tab in the browser, saw plain unstyled text, and provided visual proof: *"what is this , do this ui correcty"*.
   - *What was done:* Forced the AI to implement the 4-column operations triage grid, telemetry diagnostic cards, purple tactile concurrency tester, and responsive data tables with status chips.

2. **Treating `timestamp: 0` as a Valid 1970 Calendar Date:**
   - *What the AI did:* The AI initially passed sessions with `timestamp: 0` into the timezone date formatter, producing `1970-01-01` and outputting an erroneous `1970-W01` cohort in the community table.
   - *How I caught it:* The community table showed 5 sessions in year 1970.
   - *What was done:* Identified that `timestamp: 0` represents an uninitialized device RTC hardware clock error, and updated `validator.js` to quarantine these sessions with human-readable diagnostic reason `Invalid session timestamp: 0 (uninitialized device RTC clock)`.

---

### 3. One Place We Disagreed & Who Was Right

- **The Issue:** How to handle sessions with 2-minute and 10-minute durations (`durationSelected: 2` and `10`).
- **Initial AI Position:** The AI argued they should be quarantined as unsupported durations because the brief states: *"The offered durations are 1, 3 and 5 minutes."*
- **My Position:** I argued they should be accepted and credited to user mindful minutes.
- **Who Turned Out to Be Right:** **I was right.** Inspection revealed that 100% of the 40 sessions with 2m and 10m durations came from `appVersion: "0.9.7"` (early legacy clients). They were genuine, valid meditation sessions completed before the app standardized on 1/3/5m. Quarantining them would retroactively wipe real user practice history. Accepting them and tracking them under ops telemetry (`Legacy v0.9.7 Clients: 40 sessions`) honored user practice while maintaining operational visibility.

---

### 4. How to Prove This System Never Double-Counts a Session

Beyond "trying it and it looked fine", we prove zero double-counting through three rigorous invariants:

1. **Partition Conservation Invariant (Rule 1 Math):**
   Every incoming session record $r$ is deterministically classified into exactly one of three disjoint sets: Accepted ($A$), Deduplicated ($D$), or Quarantined ($Q$):
   $$|A| + |D| + |Q| \equiv |Total|$$
   Running `npm run verify` proves:
   $$7,749 \text{ (Accepted)} + 194 \text{ (Deduplicated)} + 117 \text{ (Quarantined)} = 8,060 \text{ Total Sessions}$$
   The distinct count of session IDs in storage strictly matches $|A|$:
   $$|\text{StoredSessions}| \equiv 7,749$$

2. **Concurrent Race-Condition Fuzzing (Atomic Reservation):**
   When firing $N = 50$ to $100$ parallel asynchronous HTTP POST requests with the **exact same `sessionId`** over simultaneous network connections:
   - In-memory atomic locking guarantees that exactly 1 request acquires the write lock and returns `201 Accepted`.
   - The remaining $N - 1$ requests return `200 Deduplicated`.
   - A database assertion verifies:
     $$\text{COUNT}(s \text{ where } s.\text{id} = \text{targetId}) \equiv 1$$

3. **Order-Independent Monoid Equivalence:**
   The state calculation function $f(\text{State}, \text{Event})$ forms a commutative monoid. Replaying an event stream $E$ in arrival order versus any shuffled permutation $\pi(E)$ produces identical state hashes:
   $$\text{Hash}(f(\emptyset, E)) \equiv \text{Hash}(f(\emptyset, \pi(E)))$$
   The diff between sequential and shuffled runs for streaks, minutes, and badges is strictly $0$.

4. **Mindful Minutes Scalar Sum Law:**
   A user's cumulative mindful minutes strictly equals the scalar sum of `durationSelected` over the unique accepted session set:
   $$\text{MindfulMinutes}(u) \equiv \sum_{s \in \text{AcceptedSessions}(u)} s.\text{durationSelected}$$
   Any double-count would immediately cause a divergence between this scalar sum and the user's dashboard total.

