import { beforeEach, describe, expect, it, vi } from 'vitest';

import { backfillAll, backfillUnscored } from 'src/lib/backfill';

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

const people = (...nodes: object[]) => ({
  people: { edges: nodes.map((node) => ({ node })) },
});
const opportunities = (...nodes: object[]) => ({
  opportunities: { edges: nodes.map((node) => ({ node })) },
});

const statusWrite = (
  mutationName: 'updatePerson' | 'updateOpportunity',
  id: string,
  leadScoreStatus: string,
) => ({
  [mutationName]: { __args: { id, data: { leadScoreStatus } }, id: true },
});

beforeEach(() => {
  query.mockReset();
  mutation.mockReset().mockResolvedValue({});
});

describe('backfillUnscored', () => {
  it('queries null-status records and enqueues each as QUEUED', async () => {
    query
      .mockResolvedValueOnce(
        people(
          { id: 'p1', jobTitle: 'CTO', companyId: null },
          { id: 'p2', jobTitle: null, companyId: 'c1' },
        ),
      )
      .mockResolvedValueOnce(
        opportunities({ id: 'o1', stage: 'MEETING', amount: null }),
      );

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

    // The signal fields are selected so the skip rule can be applied.
    expect(query.mock.calls[0][0].people.edges.node).toMatchObject({
      jobTitle: true,
      companyId: true,
    });
    expect(query.mock.calls[1][0].opportunities.edges.node).toMatchObject({
      stage: true,
      amount: { amountMicros: true },
    });

    expect(mutation).toHaveBeenCalledTimes(3);
    expect(mutation).toHaveBeenCalledWith(statusWrite('updatePerson', 'p1', 'QUEUED'));
    expect(mutation).toHaveBeenCalledWith(statusWrite('updatePerson', 'p2', 'QUEUED'));
    expect(mutation).toHaveBeenCalledWith(
      statusWrite('updateOpportunity', 'o1', 'QUEUED'),
    );

    expect(result).toEqual({ people: 2, opportunities: 1, skipped: 0, total: 3 });
  });

  it('marks records with no scoring signal SKIPPED instead of spending AI credits', async () => {
    // Same rule as the live trigger: a person needs a job title or company,
    // an opportunity needs an amount or stage.
    query
      .mockResolvedValueOnce(
        people(
          { id: 'pEmpty', jobTitle: null, companyId: null },
          { id: 'pGood', jobTitle: 'VP Sales', companyId: null },
        ),
      )
      .mockResolvedValueOnce(
        opportunities({ id: 'oEmpty', stage: null, amount: { amountMicros: null } }),
      );

    const result = await backfillUnscored();

    expect(mutation).toHaveBeenCalledWith(
      statusWrite('updatePerson', 'pEmpty', 'SKIPPED'),
    );
    expect(mutation).toHaveBeenCalledWith(
      statusWrite('updateOpportunity', 'oEmpty', 'SKIPPED'),
    );
    expect(mutation).toHaveBeenCalledWith(
      statusWrite('updatePerson', 'pGood', 'QUEUED'),
    );
    expect(result).toEqual({ people: 1, opportunities: 0, skipped: 2, total: 1 });
  });

  it('re-queues a previously-FAILED record so it is re-scored once credits return (TCA-13)', async () => {
    query
      .mockResolvedValueOnce(people({ id: 'pFailed', jobTitle: 'CEO', companyId: null }))
      .mockResolvedValueOnce(opportunities());

    const result = await backfillUnscored();

    const peopleFilter = query.mock.calls[0][0].people.__args.filter;
    expect(peopleFilter.or).toContainEqual({ leadScoreStatus: { eq: 'FAILED' } });
    expect(mutation).toHaveBeenCalledWith(
      statusWrite('updatePerson', 'pFailed', 'QUEUED'),
    );
    expect(result).toEqual({ people: 1, opportunities: 0, skipped: 0, total: 1 });
  });

  it('is a no-op when nothing is unscored', async () => {
    query.mockResolvedValueOnce(people()).mockResolvedValueOnce(opportunities());

    const result = await backfillUnscored();

    expect(mutation).not.toHaveBeenCalled();
    expect(result).toEqual({ people: 0, opportunities: 0, skipped: 0, total: 0 });
  });
});

describe('backfillAll', () => {
  it('repeats batches until a round finds nothing left, and sums the results', async () => {
    query
      // round 1
      .mockResolvedValueOnce(people({ id: 'p1', jobTitle: 'CTO', companyId: null }))
      .mockResolvedValueOnce(opportunities({ id: 'o1', stage: null, amount: null }))
      // round 2
      .mockResolvedValueOnce(people({ id: 'p2', jobTitle: null, companyId: 'c1' }))
      .mockResolvedValueOnce(opportunities())
      // round 3: empty, stop
      .mockResolvedValueOnce(people())
      .mockResolvedValueOnce(opportunities());

    const result = await backfillAll();

    expect(query).toHaveBeenCalledTimes(6);
    expect(result).toEqual({ people: 2, opportunities: 0, skipped: 1, total: 2 });
  });

  it('stops after the round cap even if records keep appearing', async () => {
    query.mockImplementation(async (selection: Record<string, unknown>) =>
      'people' in selection
        ? people({ id: 'p', jobTitle: 'CTO', companyId: null })
        : opportunities(),
    );

    const result = await backfillAll(3);

    expect(query).toHaveBeenCalledTimes(6);
    expect(result.people).toBe(3);
  });
});
