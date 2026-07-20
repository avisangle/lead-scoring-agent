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

/**
 * Enrich, score via the agent, and persist the result.
 * Writes SCORED (with score + summary + timestamp) on success, FAILED on any
 * error or unsuccessful agent run. Returns the terminal status.
 */
export const scoreRecord = async (
  objectType: ScoreObjectType,
  recordId: string,
): Promise<LeadScoreStatus> => {
  try {
    const record = await enrichRecord({ objectType, recordId });
    const prompt = buildPromptFor(objectType, record);

    const { result, success } = await runAgent({
      agentUniversalIdentifier: LEAD_SCORER_AGENT_UNIVERSAL_IDENTIFIER,
      prompt,
    });

    const parsed = result as { score?: number; summary?: string } | null;

    if (!success || !parsed || typeof parsed.score !== 'number') {
      await setLeadScoreStatus(objectType, recordId, 'FAILED');
      return 'FAILED';
    }

    await writeLeadScoreFields(objectType, recordId, {
      leadScore: parsed.score,
      leadScoreSummary: parsed.summary ?? '',
      leadScoredAt: new Date().toISOString(),
      leadScoreStatus: 'SCORED',
    });

    return 'SCORED';
  } catch {
    await setLeadScoreStatus(objectType, recordId, 'FAILED');
    return 'FAILED';
  }
};
