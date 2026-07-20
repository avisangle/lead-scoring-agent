import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handleScoreOnEvent } from 'src/lib/score-on-event';

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
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const event = (after: Record<string, unknown>): any => ({
  recordId: 'r1',
  properties: { after },
});

const writtenData = (call: number) => {
  const arg = mutation.mock.calls[call][0];
  return (arg.updatePerson ?? arg.updateOpportunity).__args.data;
};

describe('handleScoreOnEvent — no-signal skip', () => {
  it('sets SKIPPED for a person with no company and no jobTitle', async () => {
    await handleScoreOnEvent('person', event({}));

    expect(runAgent).not.toHaveBeenCalled();
    expect(mutation).toHaveBeenCalledTimes(1);
    expect(writtenData(0)).toEqual({ leadScoreStatus: 'SKIPPED' });
  });

  it('sets SKIPPED for an opportunity with no amount and no stage', async () => {
    await handleScoreOnEvent('opportunity', event({}));

    expect(runAgent).not.toHaveBeenCalled();
    expect(writtenData(0)).toEqual({ leadScoreStatus: 'SKIPPED' });
  });
});

describe('handleScoreOnEvent — import routing', () => {
  it('sets QUEUED and does not call the agent for imported records', async () => {
    await handleScoreOnEvent(
      'person',
      event({ jobTitle: 'VP Sales', createdBy: { source: 'IMPORT' } }),
    );

    expect(runAgent).not.toHaveBeenCalled();
    expect(writtenData(0)).toEqual({ leadScoreStatus: 'QUEUED' });
  });
});

describe('handleScoreOnEvent — inline scoring', () => {
  it('scores inline and writes all score fields on success', async () => {
    runAgent.mockResolvedValue({
      success: true,
      error: null,
      result: { score: 87, summary: 'Strong fit' },
    });

    await handleScoreOnEvent(
      'person',
      event({ jobTitle: 'VP Sales', createdBy: { source: 'MANUAL' } }),
    );

    expect(runAgent).toHaveBeenCalledTimes(1);
    const data = writtenData(0);
    expect(data.leadScore).toBe(87);
    expect(data.leadScoreSummary).toBe('Strong fit');
    expect(data.leadScoreStatus).toBe('SCORED');
    expect(typeof data.leadScoredAt).toBe('string');
  });

  it('sets FAILED when the agent run is unsuccessful', async () => {
    runAgent.mockResolvedValue({ success: false, error: 'boom', result: null });

    await handleScoreOnEvent('opportunity', event({ stage: 'PROPOSAL' }));

    expect(runAgent).toHaveBeenCalledTimes(1);
    expect(writtenData(0)).toEqual({ leadScoreStatus: 'FAILED' });
  });
});
