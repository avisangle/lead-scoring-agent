/**
 * Shared database-event handler for scoreOnEvent (TCA-9).
 *
 * Each thin logic-function file in `src/logic-functions/*.function.ts` wires a
 * single (object, action) trigger to this handler — the SDK's
 * `databaseEventTriggerSettings` allows only one `eventName` per function, so
 * the routing logic lives here once and is delegated to from each trigger.
 *
 * Routing:
 *  - no scoring signal            -> SKIPPED (no AI)
 *  - createdBy.source === IMPORT  -> QUEUED  (drained later by the cron, no AI)
 *  - otherwise                    -> inline scoreRecord() (enrich + runAgent)
 */
import type { DatabaseEventPayload } from 'twenty-sdk/logic-function';

import {
  type ScoreObjectType,
  scoreRecord,
  setLeadScoreStatus,
} from 'src/lib/score-record';

const IMPORT_SOURCE = 'IMPORT';

export type RecordAfter = {
  jobTitle?: string | null;
  companyId?: string | null;
  amount?: { amountMicros?: string | number | null } | number | null;
  stage?: string | null;
  createdBy?: { source?: string | null } | null;
};

// Shared with the backfill so both paths skip the same records.
export const hasScoringSignal = (
  objectType: ScoreObjectType,
  after: RecordAfter,
): boolean => {
  if (objectType === 'person') {
    return Boolean(after.jobTitle) || Boolean(after.companyId);
  }

  const amountPresent =
    after.amount != null &&
    (typeof after.amount === 'number' ? true : after.amount.amountMicros != null);

  return amountPresent || Boolean(after.stage);
};

export const handleScoreOnEvent = async (
  objectType: ScoreObjectType,
  event: DatabaseEventPayload,
): Promise<void> => {
  const recordId = event.recordId;
  const after =
    ((event.properties as { after?: RecordAfter | null } | undefined)?.after ??
      {}) as RecordAfter;

  if (!hasScoringSignal(objectType, after)) {
    await setLeadScoreStatus(objectType, recordId, 'SKIPPED');
    return;
  }

  if (after.createdBy?.source === IMPORT_SOURCE) {
    await setLeadScoreStatus(objectType, recordId, 'QUEUED');
    return;
  }

  await scoreRecord(objectType, recordId);
};
