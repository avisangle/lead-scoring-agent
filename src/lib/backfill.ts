/**
 * Backfill for pre-existing unscored leads (TCA-12).
 *
 * The scoring pipeline only fires on database events (create/update), so
 * records that existed before the app was installed never get a score. This
 * helper finds people + opportunities that still need scoring — never-scored
 * (null status) OR previously-FAILED (TCA-13) — and enqueues them by writing
 * status QUEUED. The existing `drainQueue` cron then scores each queued record
 * via the shared `scoreRecord` pipeline.
 *
 * Enqueue (vs. inline scoring) is deliberate: scoring runs an AI agent per
 * record and a full backfill could exceed a single logic-function timeout.
 * Marking QUEUED is a cheap bounded write; the cron drains in capped batches.
 *
 * Including FAILED lets a failure left by a transient incident (e.g. credit
 * exhaustion) be re-scored once credits return, without a manual DB edit. Since
 * credit exhaustion now re-queues itself (see `scoreRecord`), FAILED means a
 * genuine error; re-queueing here is operator-triggered (not the cron), so a
 * broken record is retried only on an explicit backfill, not in a tight loop.
 * A bounded retry-count field remains the proper long-term guard (TCA-10).
 *
 * Idempotent: re-running re-queues only records that still need scoring, never
 * ones already QUEUED / SCORED / SKIPPED.
 */
import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  type ScoreObjectType,
  setLeadScoreStatus,
} from 'src/lib/score-record';

const BACKFILL_BATCH_LIMIT = 50;

const fetchUnscoredIds = async (
  objectType: ScoreObjectType,
): Promise<string[]> => {
  const client = new CoreApiClient();

  if (objectType === 'person') {
    const { people } = await client.query({
      people: {
        __args: {
          first: BACKFILL_BATCH_LIMIT,
          filter: {
            or: [
              { leadScoreStatus: { is: 'NULL' } },
              { leadScoreStatus: { eq: 'FAILED' } },
            ],
          },
        },
        edges: { node: { id: true } },
      },
    });

    return (people?.edges ?? [])
      .map((edge) => edge?.node?.id)
      .filter((id): id is string => typeof id === 'string');
  }

  const { opportunities } = await client.query({
    opportunities: {
      __args: {
        first: BACKFILL_BATCH_LIMIT,
        filter: {
          or: [
            { leadScoreStatus: { is: 'NULL' } },
            { leadScoreStatus: { eq: 'FAILED' } },
          ],
        },
      },
      edges: { node: { id: true } },
    },
  });

  return (opportunities?.edges ?? [])
    .map((edge) => edge?.node?.id)
    .filter((id): id is string => typeof id === 'string');
};

const enqueueAll = async (
  objectType: ScoreObjectType,
  ids: string[],
): Promise<number> => {
  for (const recordId of ids) {
    await setLeadScoreStatus(objectType, recordId, 'QUEUED');
  }

  return ids.length;
};

export type BackfillResult = {
  people: number;
  opportunities: number;
  total: number;
};

/**
 * Enqueue every unscored person + opportunity for scoring. Returns how many of
 * each were queued (they will be scored on the next `drainQueue` cron run).
 */
export const backfillUnscored = async (): Promise<BackfillResult> => {
  const [personIds, opportunityIds] = await Promise.all([
    fetchUnscoredIds('person'),
    fetchUnscoredIds('opportunity'),
  ]);

  const [people, opportunities] = await Promise.all([
    enqueueAll('person', personIds),
    enqueueAll('opportunity', opportunityIds),
  ]);

  return { people, opportunities, total: people + opportunities };
};
