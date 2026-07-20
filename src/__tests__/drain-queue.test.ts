import { beforeEach, describe, expect, it, vi } from 'vitest';

import { drainQueue } from 'src/lib/drain-queue';

const { query, mutation, runAgent, enrichRecord } = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
  runAgent: vi.fn(),
  enrichRecord: vi.fn(),
}));

vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: class {
    query = query;
    mutation = mutation;
  },
}));

vi.mock('twenty-sdk/logic-function', () => ({ runAgent }));

vi.mock('src/lib/enrich', () => ({ enrichRecord }));

beforeEach(() => {
  query.mockReset();
  mutation.mockReset().mockResolvedValue({});
  runAgent.mockReset().mockResolvedValue({
    success: true,
    error: null,
    result: { score: 50, summary: 'ok' },
  });
  enrichRecord.mockReset().mockResolvedValue({ name: 'A' });
});

describe('drainQueue', () => {
  it('scores each QUEUED person and opportunity', async () => {
    query
      .mockResolvedValueOnce({ people: { edges: [{ node: { id: 'p1' } }] } })
      .mockResolvedValueOnce({
        opportunities: { edges: [{ node: { id: 'o1' } }] },
      });

    await drainQueue();

    // Both queues fetched, filtered on QUEUED, capped at 20.
    expect(query).toHaveBeenCalledTimes(2);
    const peopleArgs = query.mock.calls[0][0].people.__args;
    expect(peopleArgs.filter).toEqual({ leadScoreStatus: { eq: 'QUEUED' } });
    expect(peopleArgs.first).toBe(20);

    // Each queued record enriched + scored + written.
    expect(enrichRecord).toHaveBeenCalledWith({
      objectType: 'person',
      recordId: 'p1',
    });
    expect(enrichRecord).toHaveBeenCalledWith({
      objectType: 'opportunity',
      recordId: 'o1',
    });
    expect(runAgent).toHaveBeenCalledTimes(2);

    const scored = mutation.mock.calls.map(
      (c) => (c[0].updatePerson ?? c[0].updateOpportunity).__args.data,
    );
    expect(scored.every((d) => d.leadScoreStatus === 'SCORED')).toBe(true);
  });

  it('does nothing when no records are queued', async () => {
    query
      .mockResolvedValueOnce({ people: { edges: [] } })
      .mockResolvedValueOnce({ opportunities: { edges: [] } });

    await drainQueue();

    expect(runAgent).not.toHaveBeenCalled();
    expect(mutation).not.toHaveBeenCalled();
  });
});
