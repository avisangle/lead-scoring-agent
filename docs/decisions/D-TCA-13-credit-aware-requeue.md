# D-TCA-13: Credit-aware re-queue instead of terminal FAILED, with operator-triggered FAILED re-processing
**Status:** Accepted
**Date:** 2026-07-22
**Issue:** TCA-13
**Confluence:** none

**Decision:** When `runAgent` fails with a credit/quota-exhaustion error (message
matches `/credits?\s+exhausted/i`), `scoreRecord` writes `leadScoreStatus = 'QUEUED'`
so the cron re-scores it once credits return; any other error is terminal `FAILED`
with the reason captured in `leadScoreSummary`. Backfill's selection is widened
from null-status-only to null OR FAILED, so genuinely-failed records can be
re-scored by an explicit backfill run.

**Why:** The 2026-07-22 incident swallowed a "Credits exhausted" error in an empty
catch and left records permanently FAILED, needing manual DB edits to recover.
Treating a transient quota condition as terminal is wrong; re-queueing it makes
recovery automatic. Capturing the reason on real failures makes a FAILED record
self-explaining.

**Rejected:** Adding a bounded retry-count field to the schema (the proper
long-term guard, noted in TCA-10) — rejected for v1 because it needs a schema
migration that is out of this issue's scope. Draining FAILED records from the
cron (`drainQueue`) automatically — rejected because a genuinely-broken record
would thrash on every cron tick; keeping FAILED re-processing on the
operator-triggered `backfill` path throttles retries to explicit human action.

**Impact:** Credit exhaustion must never be persisted as terminal FAILED — it is
QUEUED. FAILED now means a genuine, non-transient error and always carries a
reason in `leadScoreSummary`. The cron (`drainQueue`) must keep draining only
QUEUED, never FAILED; only `backfill` may re-queue FAILED. Until a retry-count
field exists, an operator running backfill repeatedly on a permanently-broken
record will re-queue it each time — a bounded retry-count field remains the
follow-up guard.
