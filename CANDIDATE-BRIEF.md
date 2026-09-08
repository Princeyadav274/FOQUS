# FoQus Sync — take-home task

**Time:** 2 hours. Please time-box this strictly. Do not spend more; when the two hours are up,
send what you have.

**Use AI.** We assume you will work with ChatGPT, Claude, Copilot, Cursor, Codex, agents, whatever
you like. That is how we work too, and part of this task is showing us *how* you work with it.
Nothing here is a trick about AI, and we will never ask you to prove you did something "by hand".

---

## The setting

**FoQus** is our product: a 1, 3 or 5 minute breathing reset. You breathe with a dot on the screen;
thoughts drift in as small shapes; on the exhale you gather them. At the end you get a calm score, a
count of thoughts gathered, and the session goes into your history. Your history gives you a
**streak**, **mindful minutes** and **badges**. It runs in the browser today; desktop and mobile
shells are coming.

Right now a session is saved in the browser's local storage on the device where it happened.
People use FoQus on a phone in the morning and a laptop at lunch, some of them without an account
at all, and some create an account weeks after their first session. We are building the server
side that receives sessions from every device, turns them into one history per person, and
computes the numbers the user sees. We also want to replace the "coming soon" placeholder on the
community view with real collective numbers.

You have **six weeks of the sync log** as the server received it: `fixtures/sync-log.jsonl`, one
JSON object per line, in arrival order. It contains four record types:

```json
{"type": "profile", "userId": "usr_…", "profileMode": "online", "nickname": "still412",
 "timezone": "Europe/Warsaw", "createdAt": "2026-01-14T00:00:00Z", "received_at": "…"}

{"type": "session", "id": "ses_…", "userId": "usr_…", "device": "dev_…", "appVersion": "1.4.2",
 "timestamp": 1772450123000, "durationSelected": 3, "durationCompletedSeconds": 180, "completed": true,
 "thoughtsGathered": 21, "mergedThoughts": 4, "thoughtLoad": "busy", "soundMode": "Warm Pad",
 "intention": "Focus", "reflection": "Calmer", "feedbackComment": null,
 "sessionMode": "scored", "isPractice": false, "averageSteadiness": 0.81, "exhaleGatherRatio": 0.62,
 "calmScore": 0.77, "received_at": "2026-03-02T11:37:10Z"}

{"type": "link", "guestId": "gst_…", "userId": "usr_…", "received_at": "…"}

{"type": "erasure_request", "userId": "usr_…", "received_at": "…"}
```

`timestamp` is the device's clock at the start of the session, in epoch milliseconds.
`received_at` is the server's clock when the record arrived. A `link` says a guest identity and an
account are the same person from now on. An `erasure_request` is a person asking us to delete
everything about them, which we are legally obliged to do.

Treat the log as what it is modelled on: data from real devices belonging to real people.

---

## Two rules that are not negotiable

1. **Nothing is silently dropped.** A record the server will not accept goes to a visible
   quarantine, with the record and a reason a human can read. Accepted, deduplicated, or
   quarantined: every line ends up in exactly one of the three, and the totals add up.
2. **Free text stays with its owner.** `feedbackComment` is the person's private note to
   themselves. It appears in that person's own history and nowhere else: not in the community
   view, not in a log line, not in an error message, not in an export someone else can see.

---

## What the numbers mean

- A **day** is a calendar day in the person's own timezone (the `timezone` on their profile).
- **Streak**: consecutive days with at least one *completed, scored* session. Practice sessions
  are practice. *Current streak* counts up to the last day of the log, which you should treat as
  "today". *Best streak* is the longest ever.
- **Mindful minutes**: `durationSelected` of every completed session, scored or practice.
- **Badges**, each awarded once, dated to the session that earned it, not to when the server
  noticed:
  - *First Reset*: first completed scored session.
  - *3-Day FoQus Streak*: a streak reaches 3.
  - *Thought Gatherer*: 100 thoughts gathered in total.
  - *Hour of Calm*: 60 mindful minutes.
- **Community**: per ISO week and per region, how many sessions, how many minutes, how many
  people, and a typical calm score. The community view must make it impossible to work out what
  any one person did.
- **The offered durations are 1, 3 and 5 minutes.** Decide what to do with anything else.

The log will disagree with these definitions in places. Where it does, you decide, and you write
the decision down.

---

## What to build

A small full-stack application. **Any language, framework, runtime.** We are interested in what
you pick and why, so write the why down.

### 1. Sync endpoint

Accepts the records above, one per request. Devices retry when the network drops, sync in
batches after being offline for days, and two devices belonging to one person can sync at the
same moment. Whatever order, timing or repetition the records arrive in, the resulting history is
the same. One session is one session, however many times it is delivered.

Storage: anything. In-memory, a JSON file, SQLite, Postgres. A real database earns nothing on its
own.

### 2. History, stats, badges

Per person: the accepted sessions, the streaks, the minutes, the badges with their earned dates.
A person's history includes everything from identities that were linked to them. These
computations must be plain, testable functions with no knowledge of HTTP or the UI, and
recomputing from scratch must give the same answer as computing incrementally.

### 3. Two screens

- **The person's dashboard.** Streak, minutes, badges, a view of the last six weeks, the session
  history. FoQus is a calm product; the dashboard is what you see after a breathing exercise. It
  should feel like the end of one. No login needed; a way to pick which person you are looking at
  is enough. Take this seriously as a piece of design.
- **Community and sync health.** For us, internally. The community numbers above, and the state
  of the sync: what was accepted, what was collapsed as duplicate, what is in quarantine and why,
  and anything about a device or a person's data that looks wrong and we should know about.

### 4. Replay

A command (script, `make` target, `bun run`, anything) that feeds the whole log through **the
same endpoint the devices use**, in arrival order, then prints a summary: records by type,
sessions accepted / deduplicated / quarantined by reason, people with a history, badges awarded by
type, longest best streak, and the community table. The dashboard shows the replayed data.

**We will replay a second six-week log you have not seen** through your endpoint and compare the
summary and a handful of individual people's stats to ours. So the rules live in code, and the
numbers in your report are what your code printed.

### 5. Tests

Test the sync behaviour and the stats. We care about tests that prove the streak is right when
time is awkward and that repeated or simultaneous delivery cannot double-count, far more than
tests that a component renders. Include a dev-only way (a button, a script) to fire several
copies of the same session at the endpoint at once and see that exactly one results.

### Nice to have, skip freely

- Live update of the dashboard when a new session arrives.
- A per-person "export my data" that is complete and a "erase me" that is, too.
- Anything you think the community view should show that we did not list.

---

## Working with AI — required, read carefully

Keep a short log as you go. Honesty over polish.

1. **One prompt that worked well.** Paste it as-is.
2. **Two things the AI got wrong** that you caught: a computation that looked right and was not,
   an edge case it did not consider, a fix that did not fix. What it said, how you noticed, what
   you did. If you caught nothing, say so; that is a legitimate answer and we will talk about it.
3. **One place you disagreed with the AI**, and who turned out to be right.
4. **How would you prove this system never double-counts a session**, beyond "I tried it and it
   looked fine"? What would you measure, against what?

If you are comfortable sharing the actual chat transcripts or session exports, attach or link
them. Optional, and the single most useful thing you can give us.

---

## Deliverables

A Git repository, public or private (invite `dariusz@sustematiq.com` if private), with:

- The code and a **README.md**: install, run both screens, run the replay, run the tests. We will
  follow it literally on a clean Mac.
- **REPORT.md**, under two pages:
  - The replay summary your code printed, verbatim.
  - **What you noticed about the data.** Anything that surprised you, looked broken, or forced a
    decision. Say what you decided and why.
  - Your definitions where the brief left room, in one or two sentences each.
  - Your stack and why. "It was the default" is an acceptable answer if it is the true one.
- **NOTES.md**, under one page: the AI log above.
- Optional: a 3–5 minute screen recording of the two screens and the replay.

Commit as you go. We read the history.

## What we look at

Whether it runs from the README. Whether the two rules hold. Whether the held-back log gives

sensible numbers. Whether the code is honest about what it does not handle. How the two screens
feel. How you talk about your own work.

Questions are welcome, by email or message, the way you would ask if you already worked here. A
good question is a point in your favour.
