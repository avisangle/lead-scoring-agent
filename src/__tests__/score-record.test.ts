/**
 * TCA-13 — scoring failures must be self-diagnosing + credit-aware.
 *
 * runAgent can fail two ways (both exercised here):
 *  - it throws (the SDK throws `Error("runAgent() failed: Credits exhausted")`
 *    on GraphQL errors — the original incident, swallowed by an empty catch), or
 *  - it resolves with `{ success: false, error: string | null, result: null }`.
 *
 * Contract under test:
 *  1. A genuine failure records a readable reason in `leadScoreSummary` and is
 *     logged via console.error (no silent swallow).
 *  2. A credit-exhaustion failure is transient: status becomes QUEUED (retried
 *     when credits return), never terminal FAILED.
 *  3. Success is unchanged: SCORED with score + summary.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { scoreRecord } from 'src/lib/score-record';

const { mutation, runAgent, enrichRecord } = vi.hoisted(() => ({
  mutation: vi.fn(),
  runAgent: vi.fn(),
  enrichRecord: vi.fn(),
}));

vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: class {
    mutation = mutation;
    query = vi.fn();
  },
}));

vi.mock('twenty-sdk/logic-function', () => ({ runAgent }));

vi.mock('src/lib/enrich', () => ({ enrichRecord }));

beforeEach(() => {
  mutation.mockReset().mockResolvedValue({});
  runAgent.mockReset();
  enrichRecord.mockReset().mockResolvedValue({ name: 'A', jobTitle: 'VP' });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const writtenData = (call: number) => {
  const arg = mutation.mock.calls[call][0];
  return (arg.updatePerson ?? arg.updateOpportunity).__args.data;
};

const writtenStatuses = () =>
  mutation.mock.calls.map(
    (c) => (c[0].updatePerson ?? c[0].updateOpportunity).__args.data.leadScoreStatus,
  );

describe('scoreRecord — success (unchanged)', () => {
  it('writes SCORED with score + summary on a successful agent run', async () => {
    runAgent.mockResolvedValue({
      success: true,
      error: null,
      result: { score: 87, summary: 'Strong fit' },
    });

    const status = await scoreRecord('person', 'p1');

    expect(status).toBe('SCORED');
    const data = writtenData(0);
    expect(data.leadScore).toBe(87);
    expect(data.leadScoreSummary).toBe('Strong fit');
    expect(data.leadScoreStatus).toBe('SCORED');
  });
});

describe('scoreRecord — credit exhaustion re-queues instead of failing', () => {
  it('sets QUEUED (not FAILED) when runAgent throws "Credits exhausted"', async () => {
    runAgent.mockRejectedValue(new Error('runAgent() failed: Credits exhausted'));

    const status = await scoreRecord('person', 'p1');

    expect(status).toBe('QUEUED');
    expect(writtenData(0).leadScoreStatus).toBe('QUEUED');
    // A transient credit failure must never be persisted as terminal FAILED.
    expect(writtenStatuses()).not.toContain('FAILED');
  });

  it('sets QUEUED when the agent returns an unsuccessful "Credits exhausted" result', async () => {
    runAgent.mockResolvedValue({
      success: false,
      error: 'Credits exhausted',
      result: null,
    });

    const status = await scoreRecord('opportunity', 'o1');

    expect(status).toBe('QUEUED');
    expect(writtenData(0).leadScoreStatus).toBe('QUEUED');
  });
});

describe('scoreRecord — genuine failure captures a readable reason', () => {
  it('sets FAILED and records the thrown error message in leadScoreSummary', async () => {
    runAgent.mockRejectedValue(new Error('enrichment exploded'));

    const status = await scoreRecord('person', 'p1');

    expect(status).toBe('FAILED');
    const data = writtenData(0);
    expect(data.leadScoreStatus).toBe('FAILED');
    expect(data.leadScoreSummary).toContain('enrichment exploded');
    expect(console.error).toHaveBeenCalled();
  });

  it('sets FAILED and captures the returned error string on an unsuccessful run', async () => {
    runAgent.mockResolvedValue({
      success: false,
      error: 'model returned garbage',
      result: null,
    });

    const status = await scoreRecord('opportunity', 'o1');

    expect(status).toBe('FAILED');
    const data = writtenData(0);
    expect(data.leadScoreStatus).toBe('FAILED');
    expect(data.leadScoreSummary).toContain('model returned garbage');
    expect(console.error).toHaveBeenCalled();
  });
});
