import { beforeEach, describe, expect, it, vi } from 'vitest';

import { backfillUnscored } from 'src/lib/backfill';

const { query, mutation } = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
}));

vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: class {
    query = query;
    mutation = mutation;
  },
}));

beforeEach(() => {
  query.mockReset();
  mutation.mockReset().mockResolvedValue({});
});

describe('backfillUnscored', () => {
  it('queries null-status records and enqueues each as QUEUED', async () => {
    query
      .mockResolvedValueOnce({
        people: { edges: [{ node: { id: 'p1' } }, { node: { id: 'p2' } }] },
      })
      .mockResolvedValueOnce({
        opportunities: { edges: [{ node: { id: 'o1' } }] },
      });

    const result = await backfillUnscored();

    // Both queues fetched, selecting never-scored (null) OR FAILED, capped at 50.
    expect(query).toHaveBeenCalledTimes(2);
    const peopleArgs = query.mock.calls[0][0].people.__args;
    expect(peopleArgs.filter).toEqual({
      or: [
        { leadScoreStatus: { is: 'NULL' } },
        { leadScoreStatus: { eq: 'FAILED' } },
      ],
    });
    expect(peopleArgs.first).toBe(50);

    // Each unscored record enqueued as QUEUED (2 people + 1 opportunity).
    expect(mutation).toHaveBeenCalledTimes(3);
    expect(mutation).toHaveBeenCalledWith({
      updatePerson: {
        __args: { id: 'p1', data: { leadScoreStatus: 'QUEUED' } },
        id: true,
      },
    });
    expect(mutation).toHaveBeenCalledWith({
      updateOpportunity: {
        __args: { id: 'o1', data: { leadScoreStatus: 'QUEUED' } },
        id: true,
      },
    });

    expect(result).toEqual({ people: 2, opportunities: 1, total: 3 });
  });

  it('re-queues a previously-FAILED record so it is re-scored once credits return (TCA-13)', async () => {
    // A record left FAILED by the credit-exhaustion incident must be selectable
    // by backfill and re-enqueued as QUEUED — no manual DB edit required.
    query
      .mockResolvedValueOnce({ people: { edges: [{ node: { id: 'pFailed' } }] } })
      .mockResolvedValueOnce({ opportunities: { edges: [] } });

    const result = await backfillUnscored();

    const peopleFilter = query.mock.calls[0][0].people.__args.filter;
    expect(peopleFilter.or).toContainEqual({ leadScoreStatus: { eq: 'FAILED' } });

    expect(mutation).toHaveBeenCalledWith({
      updatePerson: {
        __args: { id: 'pFailed', data: { leadScoreStatus: 'QUEUED' } },
        id: true,
      },
    });
    expect(result).toEqual({ people: 1, opportunities: 0, total: 1 });
  });

  it('is a no-op when nothing is unscored', async () => {
    query
      .mockResolvedValueOnce({ people: { edges: [] } })
      .mockResolvedValueOnce({ opportunities: { edges: [] } });

    const result = await backfillUnscored();

    expect(mutation).not.toHaveBeenCalled();
    expect(result).toEqual({ people: 0, opportunities: 0, total: 0 });
  });
});
