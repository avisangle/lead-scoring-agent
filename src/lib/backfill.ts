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
 * Records with no scoring signal are marked SKIPPED (same rule as the live
 * trigger) so the cron never spends AI credits on an empty record.
 *
 * Idempotent: re-running re-queues only records that still need scoring, never
 * ones already QUEUED / SCORED / SKIPPED.
 */
import { CoreApiClient } from 'twenty-client-sdk/core';

import { hasScoringSignal, type RecordAfter } from 'src/lib/score-on-event';
import {
  type LeadScoreStatus,
  type ScoreObjectType,
  setLeadScoreStatus,
} from 'src/lib/score-record';

const BACKFILL_BATCH_LIMIT = 50;
// 40 rounds x 50 = up to 2,000 records per object in one post-install run.
const DEFAULT_MAX_ROUNDS = 40;

const NEEDS_SCORING_FILTER = {
  or: [
    { leadScoreStatus: { is: 'NULL' as const } },
    { leadScoreStatus: { eq: 'FAILED' as const } },
  ],
};

type Candidate = RecordAfter & { id?: unknown };

const toCandidates = (
  edges: ({ node?: Candidate | null } | null)[] | null | undefined,
): (Candidate & { id: string })[] =>
  (edges ?? [])
    .map((edge) => edge?.node)
    .filter(
      (node): node is Candidate & { id: string } =>
        typeof node?.id === 'string',
    );

const fetchUnscored = async (
  objectType: ScoreObjectType,
): Promise<(Candidate & { id: string })[]> => {
  const client = new CoreApiClient();

  if (objectType === 'person') {
    const { people } = await client.query({
      people: {
        __args: { first: BACKFILL_BATCH_LIMIT, filter: NEEDS_SCORING_FILTER },
        edges: { node: { id: true, jobTitle: true, companyId: true } },
      },
    });

    return toCandidates(people?.edges);
  }

  const { opportunities } = await client.query({
    opportunities: {
      __args: { first: BACKFILL_BATCH_LIMIT, filter: NEEDS_SCORING_FILTER },
      edges: {
        node: { id: true, stage: true, amount: { amountMicros: true } },
      },
    },
  });

  return toCandidates(opportunities?.edges);
};

/** Writes QUEUED or SKIPPED per record; returns how many were queued vs skipped. */
const triage = async (
  objectType: ScoreObjectType,
  candidates: (Candidate & { id: string })[],
): Promise<{ queued: number; skipped: number }> => {
  let queued = 0;

  for (const candidate of candidates) {
    const status: LeadScoreStatus = hasScoringSignal(objectType, candidate)
      ? 'QUEUED'
      : 'SKIPPED';

    await setLeadScoreStatus(objectType, candidate.id, status);

    if (status === 'QUEUED') {
      queued += 1;
    }
  }

  return { queued, skipped: candidates.length - queued };
};

export type BackfillResult = {
  /** People queued for scoring. */
  people: number;
  /** Opportunities queued for scoring. */
  opportunities: number;
  /** Records of either kind marked SKIPPED for lack of a signal. */
  skipped: number;
  /** people + opportunities (queued only). */
  total: number;
};

/**
 * One batch: triage up to 50 unscored people and 50 unscored opportunities.
 * Queued records are scored on the next `drainQueue` cron run.
 */
export const backfillUnscored = async (): Promise<BackfillResult> => {
  const [personCandidates, opportunityCandidates] = await Promise.all([
    fetchUnscored('person'),
    fetchUnscored('opportunity'),
  ]);

  const [personResult, opportunityResult] = await Promise.all([
    triage('person', personCandidates),
    triage('opportunity', opportunityCandidates),
  ]);

  return {
    people: personResult.queued,
    opportunities: opportunityResult.queued,
    skipped: personResult.skipped + opportunityResult.skipped,
    total: personResult.queued + opportunityResult.queued,
  };
};

/**
 * Repeats `backfillUnscored` until a round finds nothing (each round's writes
 * take its records out of the filter), capped at `maxRounds`.
 */
export const backfillAll = async (
  maxRounds = DEFAULT_MAX_ROUNDS,
): Promise<BackfillResult> => {
  const sum: BackfillResult = { people: 0, opportunities: 0, skipped: 0, total: 0 };

  for (let round = 0; round < maxRounds; round += 1) {
    const result = await backfillUnscored();

    sum.people += result.people;
    sum.opportunities += result.opportunities;
    sum.skipped += result.skipped;
    sum.total += result.total;

    if (result.total + result.skipped === 0) {
      break;
    }
  }

  return sum;
};
