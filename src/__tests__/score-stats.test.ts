import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getScoreStats } from 'src/lib/score-stats';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: class {
    query = query;
  },
}));

const COUNTS: Record<string, Record<string, number>> = {
  people: { SCORED: 4, QUEUED: 1, SKIPPED: 2, FAILED: 0, NULL: 5 },
  opportunities: { SCORED: 3, QUEUED: 0, SKIPPED: 0, FAILED: 1, NULL: 2 },
};

beforeEach(() => {
  query.mockReset().mockImplementation(async (selection) => {
    const [collection, body] = Object.entries(selection)[0] as [
      string,
      { __args: { filter: { leadScoreStatus: { eq?: string; is?: string } } } },
    ];
    const { eq, is } = body.__args.filter.leadScoreStatus;

    return { [collection]: { totalCount: COUNTS[collection][eq ?? is!] } };
  });
});

describe('getScoreStats', () => {
  it('counts people and opportunities per lead score status, with null as unscored', async () => {
    const stats = await getScoreStats();

    expect(stats).toEqual({
      person: { scored: 4, queued: 1, skipped: 2, failed: 0, unscored: 5 },
      opportunity: { scored: 3, queued: 0, skipped: 0, failed: 1, unscored: 2 },
    });
  });

  it('asks only for totalCount, never the records themselves', async () => {
    await getScoreStats();

    expect(query).toHaveBeenCalledTimes(10);
    for (const [selection] of query.mock.calls) {
      const body = Object.values(selection)[0] as Record<string, unknown>;
      expect(body.totalCount).toBe(true);
      expect(body.edges).toBeUndefined();
    }
  });

  it('treats a missing totalCount as zero', async () => {
    query.mockReset().mockResolvedValue({});

    const stats = await getScoreStats();

    expect(stats.person.scored).toBe(0);
    expect(stats.opportunity.unscored).toBe(0);
  });
});
