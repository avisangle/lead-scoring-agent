import { CoreApiClient } from 'twenty-client-sdk/core';

import { type LeadScoreStatus } from 'src/lib/score-record';

export type StatusCounts = {
  scored: number;
  queued: number;
  skipped: number;
  failed: number;
  /** Never triaged: leadScoreStatus is null. */
  unscored: number;
};

export type ScoreStats = { person: StatusCounts; opportunity: StatusCounts };

const BUCKETS: [keyof StatusCounts, { eq: LeadScoreStatus } | { is: 'NULL' }][] = [
  ['scored', { eq: 'SCORED' }],
  ['queued', { eq: 'QUEUED' }],
  ['skipped', { eq: 'SKIPPED' }],
  ['failed', { eq: 'FAILED' }],
  ['unscored', { is: 'NULL' }],
];

const countFor = async (
  collection: 'people' | 'opportunities',
  leadScoreStatus: { eq: LeadScoreStatus } | { is: 'NULL' },
): Promise<number> => {
  const client = new CoreApiClient();
  const filter = { leadScoreStatus };

  // Selecting only totalCount keeps this to a COUNT, no rows transferred.
  if (collection === 'people') {
    const { people } = await client.query({
      people: { __args: { filter }, totalCount: true },
    });

    return people?.totalCount ?? 0;
  }

  const { opportunities } = await client.query({
    opportunities: { __args: { filter }, totalCount: true },
  });

  return opportunities?.totalCount ?? 0;
};

const countsFor = async (
  collection: 'people' | 'opportunities',
): Promise<StatusCounts> => {
  const values = await Promise.all(
    BUCKETS.map(([, filter]) => countFor(collection, filter)),
  );

  return Object.fromEntries(
    BUCKETS.map(([key], index) => [key, values[index]]),
  ) as StatusCounts;
};

/** Record counts per lead score status, for the app's main page. */
export const getScoreStats = async (): Promise<ScoreStats> => {
  const [person, opportunity] = await Promise.all([
    countsFor('people'),
    countsFor('opportunities'),
  ]);

  return { person, opportunity };
};
