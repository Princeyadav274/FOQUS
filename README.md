# 🌿 FoQus Sync

> High-performance, idempotent session synchronization, timezone-aware streak/badge engine, and collective mindfulness analytics for FoQus.

---

## 🚀 Quick Start (Clean Mac / Linux / Windows)

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Both Screens (Web Application)
```bash
npm start
```
Navigate in your browser to:
- **Screen 1 (Personal Dashboard — My Practice)**: `/`
- **Screen 2 (Community & Ops Health)**: `/#community`

### 4. Run the Replay Runner
Feeds the 6-week sync log through the ingestion engine and prints the complete verbatim report:
```bash
npm run replay
```
*To replay any other log file:*
```bash
node scripts/replay.js path/to/held-back-log.jsonl
```

### 5. Run Automated Tests
Executes the native test suite covering streaks, timezone boundaries, badges, GDPR privacy, and concurrency:
```bash
npm test
```

### 6. Run Concurrency Stress Test
Fires 20 simultaneous HTTP sync requests with identical session IDs to verify atomic deduplication:
```bash
npm run test:concurrency
```

---

## 🏛️ Architecture & System Design

```
├── fixtures/
│   └── sync-log.jsonl              # 6-week input log fixture (8,416 records)
├── src/
│   ├── domain/                     # Pure domain logic (zero HTTP/UI coupling)
│   │   ├── types.js                # Type constants, statuses, badge schemas
│   │   ├── validator.js            # Invariant checks & quarantine triage
│   │   ├── stats.js                # Timezone-aware streaks & mindful minutes
│   │   ├── badges.js               # Milestone badges dated to earned session
│   │   └── community.js            # Regional & ISO-week aggregation (k-anonymity)
│   ├── store/
│   │   ├── identityGraph.js        # Disjoint-set graph for guest-to-user linking
│   │   └── syncStore.js            # In-memory transactional store & triage logs
│   ├── server/
│   │   ├── routes/                 # sync, users, community, health, dev
│   │   ├── app.js                  # Express app & static hosting
│   │   └── server.js               # Server entry point with fixture auto-loader
│   └── public/                     # Dual-screen frontend
│       ├── index.html              # Shell with Tab Switcher
│       ├── css/                    # variables.css, dashboard.css, community.css
│       └── js/                     # app.js, dashboard.js, community.js, api.js
├── scripts/
│   ├── replay.js                   # CLI Replay runner with verbatim summary
│   └── concurrent-test.js          # Concurrency stress tester
├── test/
│   ├── sync.test.js                # Ingestion, deduplication & Rule 1 invariant
│   ├── stats.test.js               # Timezone calendar day & streak calculations
│   ├── badges.test.js              # Milestone triggers & dating
│   ├── erasure.test.js             # GDPR erasure & feedback privacy
│   └── concurrency.test.js         # Concurrent delivery race-condition tests
├── REPORT.md                       # Verbatim summary, findings, decisions & stack
└── NOTES.md                        # AI collaboration log & double-count proof
```

---

## 🛡️ Core Rules & Invariants

1. **Rule 1: Nothing is silently dropped**:
   - Every single line in the sync log ends up in exactly one of: **Accepted**, **Deduplicated**, or **Quarantined**.
   - `Accepted + Deduplicated + Quarantined === Total Records`. Quarantined items include a human-readable reason.
2. **Rule 2: Free text stays with its owner**:
   - `feedbackComment` is strictly private to the owner. It is scrubbed from public community views, sync health logs, quarantine reason strings, and CLI output.
3. **Deterministic Recomputability**:
   - Computing user stats incrementally or recomputing from scratch from the accepted session array yields the exact same state.

---

## 📡 API Reference

- `POST /api/sync` — Ingests a single record (`profile`, `session`, `link`, `erasure_request`).
- `GET /api/users` — Returns list of all active users with session counts.
- `GET /api/users/:id` — Returns user stats, streaks, badges, and private session history.
- `GET /api/users/:id/export` — Downloads GDPR Article 20 JSON data export.
- `POST /api/users/:id/erase` — Executes GDPR Article 17 right to erasure.
- `GET /api/community` — Returns collective metrics per ISO week and geographic region.
- `GET /api/health` — Returns triage counts, quarantine breakdown, and anomaly metrics.
- `GET /api/health/quarantine` — Returns detailed quarantine log with reasons.
- `POST /api/dev/concurrent-sync` — Developer endpoint for live concurrency stress testing.
