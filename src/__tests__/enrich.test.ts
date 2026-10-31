import { enrichRecord } from 'src/lib/enrich';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: class {
    query = query;
  },
}));

beforeEach(() => {
  query.mockReset();
});

describe('enrichRecord (person)', () => {
  it('selects company and timelineActivities and maps person fields', async () => {
    query.mockResolvedValue({
      person: {
        id: 'p1',
        name: { firstName: 'Ada', lastName: 'Lovelace' },
        jobTitle: 'VP of Engineering',
        emails: { primaryEmail: 'ada@analytical.example' },
        linkedinLink: { primaryLinkUrl: 'https://linkedin.com/in/ada' },
        leadScore: 42,
        company: {
          name: 'Analytical Engines Inc',
          domainName: { primaryLinkUrl: 'https://analytical.example' },
          annualRevenue: { amountMicros: '5000000000', currencyCode: 'USD' },
          address: { addressCity: 'London', addressCountry: 'UK' },
        },
        timelineActivities: {
          edges: [
            { node: { timelineActivityTypeSnapshot: { name: 'noteLinked' } } },
            { node: { timelineActivityTypeSnapshot: { name: 'recordUpdated' } } },
          ],
        },
      },
    });

    const result = await enrichRecord({ objectType: 'person', recordId: 'p1' });

    // Assert the genql selection includes company + timelineActivities.
    const selection = query.mock.calls[0][0].person;
    expect(selection.company).toBeDefined();
    expect(selection.timelineActivities).toBeDefined();
    expect(selection.timelineActivities.__args.first).toBe(10);
    expect(selection.timelineActivities.__args.orderBy).toEqual([
      { createdAt: 'DescNullsLast' },
    ]);
    // `name` was removed from TimelineActivity; the event name is on the type snapshot.
    expect(
      selection.timelineActivities.edges.node.timelineActivityTypeSnapshot,
    ).toBe(true);
    expect(selection.timelineActivities.edges.node.name).toBeUndefined();
    expect(selection.__args.filter).toEqual({ id: { eq: 'p1' } });

    // Assert field mapping.
    expect(result).toEqual({
      name: 'Ada Lovelace',
      jobTitle: 'VP of Engineering',
      company: 'Analytical Engines Inc',
      companyDomain: 'https://analytical.example',
      city: 'London',
      email: 'ada@analytical.example',
      linkedinUrl: 'https://linkedin.com/in/ada',
      recentActivity: ['noteLinked', 'recordUpdated'],
    });
  });

  it('throws when the person is not found', async () => {
    query.mockResolvedValue({ person: null });

    await expect(
      enrichRecord({ objectType: 'person', recordId: 'missing' }),
    ).rejects.toThrow('Person not found');
  });
});

describe('enrichRecord (opportunity)', () => {
  it('selects company and timelineActivities and maps opportunity fields', async () => {
    query.mockResolvedValue({
      opportunity: {
        id: 'o1',
        name: 'Enterprise rollout',
        amount: { amountMicros: '50000000000', currencyCode: 'USD' },
        stage: 'PROPOSAL',
        closeDate: '2026-08-01T00:00:00.000Z',
        leadScore: null,
        company: {
          name: 'Analytical Engines Inc',
          domainName: { primaryLinkUrl: 'https://analytical.example' },
          annualRevenue: null,
          address: null,
        },
        timelineActivities: {
          edges: [
            { node: { timelineActivityTypeSnapshot: { name: 'taskLinked' } } },
          ],
        },
      },
    });

    const result = await enrichRecord({
      objectType: 'opportunity',
      recordId: 'o1',
    });

    const selection = query.mock.calls[0][0].opportunity;
    expect(selection.company).toBeDefined();
    expect(selection.timelineActivities).toBeDefined();
    expect(selection.__args.filter).toEqual({ id: { eq: 'o1' } });

    expect(result).toEqual({
      name: 'Enterprise rollout',
      amount: 50000,
      stage: 'PROPOSAL',
      closeDate: '2026-08-01T00:00:00.000Z',
      company: 'Analytical Engines Inc',
      companyDomain: 'https://analytical.example',
      recentActivity: ['taskLinked'],
    });
  });
});
