/**
 * Shared scoring path (TCA-9 / TCA-10).
 *
 * `scoreRecord` runs the full enrich -> build prompt -> runAgent -> write
 * pipeline for a single person or opportunity and is reused by both the
 * database-event handler (inline scoring) and the cron drain (queued scoring).
 *
 * Loop safety: writes only ever touch the score fields (`leadScore`,
 * `leadScoreSummary`, `leadScoredAt`, `leadScoreStatus`). No update trigger
 * watches those fields, so a score write can never re-trigger scoring.
 */
import { CoreApiClient } from 'twenty-client-sdk/core';
import { runAgent } from 'twenty-sdk/logic-function';

import { LEAD_SCORER_AGENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  buildOpportunityScoringPrompt,
  buildPersonScoringPrompt,
  type OpportunityScoringRecord,
  type PersonScoringRecord,
} from 'src/lib/build-prompt';
import { enrichRecord } from 'src/lib/enrich';

export type ScoreObjectType = 'person' | 'opportunity';
export type LeadScoreStatus = 'QUEUED' | 'SCORED' | 'SKIPPED' | 'FAILED';

type LeadScoreData = {
  leadScoreStatus: LeadScoreStatus;
  leadScore?: number;
  leadScoreSummary?: string;
  leadScoredAt?: string;
};

const writeLeadScoreFields = async (
  objectType: ScoreObjectType,
  recordId: string,
  data: LeadScoreData,
): Promise<void> => {
  const client = new CoreApiClient();

  if (objectType === 'person') {
    await client.mutation({
      updatePerson: { __args: { id: recordId, data }, id: true },
    });
  } else {
    await client.mutation({
      updateOpportunity: { __args: { id: recordId, data }, id: true },
    });
  }
};

/** Write only the lifecycle status (used for SKIPPED / QUEUED / FAILED). */
export const setLeadScoreStatus = (
  objectType: ScoreObjectType,
  recordId: string,
  status: LeadScoreStatus,
): Promise<void> =>
  writeLeadScoreFields(objectType, recordId, { leadScoreStatus: status });

const buildPromptFor = (
  objectType: ScoreObjectType,
  record: PersonScoringRecord | OpportunityScoringRecord,
): string =>
  objectType === 'person'
    ? buildPersonScoringPrompt(record as PersonScoringRecord)
    : buildOpportunityScoringPrompt(record as OpportunityScoringRecord);

/** Transient credit/quota exhaustion — retry when credits return, never fail terminally. */
const CREDIT_EXHAUSTION_PATTERN = /credits?\s+exhausted/i;

const reasonFrom = (source: unknown): string => {
  const message =
    source instanceof Error
      ? source.message
      : typeof source === 'string'
        ? source
        : String(source ?? '');

  return message.trim() || 'Unknown scoring error';
};

/**
 * Persist a non-success outcome without swallowing it (TCA-13). Credit
 * exhaustion is transient, so the record goes back to QUEUED to be re-scored
 * once credits return; any other error is terminal FAILED with the reason
 * captured in `leadScoreSummary` (and logged) so a failed record is
 * self-explaining.
 */
const recordFailure = async (
  objectType: ScoreObjectType,
  recordId: string,
  source: unknown,
): Promise<LeadScoreStatus> => {
  const reason = reasonFrom(source);
  console.error(`scoreRecord ${objectType} ${recordId} failed: ${reason}`);

  if (CREDIT_EXHAUSTION_PATTERN.test(reason)) {
    await setLeadScoreStatus(objectType, recordId, 'QUEUED');
    return 'QUEUED';
  }

  await writeLeadScoreFields(objectType, recordId, {
    leadScoreStatus: 'FAILED',
    leadScoreSummary: reason,
  });

  return 'FAILED';
};

/**
 * Enrich, score via the agent, and persist the result.
 * Writes SCORED (with score + summary + timestamp) on success. On failure the
 * outcome is captured (never swallowed): credit exhaustion re-queues as QUEUED,
 * any other error is terminal FAILED with the reason in `leadScoreSummary`.
 * Returns the resulting status.
 */
export const scoreRecord = async (
  objectType: ScoreObjectType,
  recordId: string,
): Promise<LeadScoreStatus> => {
  try {
    const record = await enrichRecord({ objectType, recordId });
    const prompt = buildPromptFor(objectType, record);

    const { result, error, success } = await runAgent({
      agentUniversalIdentifier: LEAD_SCORER_AGENT_UNIVERSAL_IDENTIFIER,
      prompt,
    });

    const parsed = result as { score?: number; summary?: string } | null;

    if (!success || !parsed || typeof parsed.score !== 'number') {
      return recordFailure(objectType, recordId, error ?? 'Agent returned no score');
    }

    await writeLeadScoreFields(objectType, recordId, {
      leadScore: parsed.score,
      leadScoreSummary: parsed.summary ?? '',
      leadScoredAt: new Date().toISOString(),
      leadScoreStatus: 'SCORED',
    });

    return 'SCORED';
  } catch (error) {
    return recordFailure(objectType, recordId, error);
  }
};
