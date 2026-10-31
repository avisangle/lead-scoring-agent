/**
 * Cron drain for queued leads (TCA-10).
 *
 * Fetches up to `QUEUE_BATCH_LIMIT` QUEUED people and opportunities and scores
 * each via the shared `scoreRecord` pipeline (enrich -> runAgent -> write
 * SCORED/FAILED).
 *
 * Bounded-retry note: the schema has no retry-count field, so re-processing
 * FAILED records would be unbounded. For v1 only QUEUED is drained; FAILED is
 * terminal (surfaced for visibility). A retry-count field is a small follow-up.
 */
import { CoreApiClient } from 'twenty-client-sdk/core';

import { type ScoreObjectType, scoreRecord } from 'src/lib/score-record';

const QUEUE_BATCH_LIMIT = 20;

const fetchQueuedIds = async (
  objectType: ScoreObjectType,
): Promise<string[]> => {
  const client = new CoreApiClient();

  if (objectType === 'person') {
    const { people } = await client.query({
      people: {
        __args: {
          first: QUEUE_BATCH_LIMIT,
          filter: { leadScoreStatus: { eq: 'QUEUED' } },
        },
        edges: { node: { id: true } },
      },
    });

    return (people?.edges ?? [])
      .map((edge: { node?: { id?: unknown } } | null) => edge?.node?.id)
      .filter((id: unknown): id is string => typeof id === 'string');
  }

  const { opportunities } = await client.query({
    opportunities: {
      __args: {
        first: QUEUE_BATCH_LIMIT,
        filter: { leadScoreStatus: { eq: 'QUEUED' } },
      },
      edges: { node: { id: true } },
    },
  });

  return (opportunities?.edges ?? [])
    .map((edge: { node?: { id?: unknown } } | null) => edge?.node?.id)
    .filter((id: unknown): id is string => typeof id === 'string');
};

export const drainQueue = async (): Promise<void> => {
  const [personIds, opportunityIds] = await Promise.all([
    fetchQueuedIds('person'),
    fetchQueuedIds('opportunity'),
  ]);

  for (const recordId of personIds) {
    await scoreRecord('person', recordId);
  }

  for (const recordId of opportunityIds) {
    await scoreRecord('opportunity', recordId);
  }
};
