/**
 * Enrichment helper (TCA-7).
 *
 * Fetches the scoring context for a single CRM record via the Core GraphQL API
 * (genql `CoreApiClient`) and normalizes it into the plain record shape that
 * `build-prompt.ts` consumes. Alongside the record's own scoring-relevant
 * fields it pulls the linked company and the most recent timeline activities so
 * the lead-scorer agent has richer signal than the bare record provides.
 *
 * Field names and selection shapes are taken from the generated core schema
 * (`twenty-client-sdk/dist/core/generated/schema.ts`): Person.name is a
 * `FullName` (firstName/lastName), Person.emails is `Emails` (primaryEmail),
 * Opportunity.amount is a `Currency` (amountMicros/currencyCode), Company has
 * `domainName` (Links) and `annualRevenue` (Currency), and both objects expose
 * a `timelineActivities` connection ordered by `createdAt`.
 */
import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  type OpportunityScoringRecord,
  type PersonScoringRecord,
} from 'src/lib/build-prompt';

export type EnrichmentInput = {
  objectType: 'person' | 'opportunity';
  recordId: string;
};

const RECENT_ACTIVITY_LIMIT = 10;

// Event name lives on the activity-type snapshot (JSON), e.g. `noteLinked`.
type TimelineActivitiesResult = {
  edges?:
    | ({ node?: { timelineActivityTypeSnapshot?: unknown } | null } | null)[]
    | null;
};

const snapshotName = (snapshot: unknown): string | undefined => {
  const name = (snapshot as { name?: unknown } | null | undefined)?.name;

  return typeof name === 'string' ? name : undefined;
};

const nonEmpty = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim() !== '';

const joinName = (
  name: { firstName?: string | null; lastName?: string | null } | null | undefined,
): string | undefined => {
  const joined = [name?.firstName, name?.lastName].filter(nonEmpty).join(' ');

  return joined === '' ? undefined : joined;
};

const recentActivity = (
  timelineActivities: TimelineActivitiesResult | null | undefined,
): string[] | undefined => {
  const names = (timelineActivities?.edges ?? [])
    .map((edge) => snapshotName(edge?.node?.timelineActivityTypeSnapshot))
    .filter(nonEmpty);

  return names.length > 0 ? names : undefined;
};

/** Convert a `Currency.amountMicros` (micros, 1e6 = one unit) to a plain number. */
const microsToAmount = (
  amountMicros: string | number | null | undefined,
): number | undefined => {
  if (amountMicros === null || amountMicros === undefined) {
    return undefined;
  }

  const asNumber = Number(amountMicros);

  return Number.isFinite(asNumber) ? asNumber / 1_000_000 : undefined;
};

const enrichPerson = async (
  client: CoreApiClient,
  recordId: string,
): Promise<PersonScoringRecord> => {
  const { person } = await client.query({
    person: {
      __args: { filter: { id: { eq: recordId } } },
      id: true,
      name: { firstName: true, lastName: true },
      jobTitle: true,
      emails: { primaryEmail: true },
      linkedinLink: { primaryLinkUrl: true },
      leadScore: true,
      company: {
        name: true,
        domainName: { primaryLinkUrl: true },
        annualRevenue: { amountMicros: true, currencyCode: true },
        address: { addressCity: true, addressState: true, addressCountry: true },
      },
      timelineActivities: {
        __args: {
          first: RECENT_ACTIVITY_LIMIT,
          orderBy: [{ createdAt: 'DescNullsLast' }],
        },
        edges: {
          node: {
            id: true,
            timelineActivityTypeSnapshot: true,
            happensAt: true,
            createdAt: true,
          },
        },
      },
    },
  });

  if (!person) {
    throw new Error(`Person not found for id ${recordId}`);
  }

  return {
    name: joinName(person.name),
    jobTitle: person.jobTitle ?? undefined,
    company: person.company?.name ?? undefined,
    companyDomain: person.company?.domainName?.primaryLinkUrl ?? undefined,
    city: person.company?.address?.addressCity ?? undefined,
    email: person.emails?.primaryEmail ?? undefined,
    linkedinUrl: person.linkedinLink?.primaryLinkUrl ?? undefined,
    recentActivity: recentActivity(person.timelineActivities),
  };
};

const enrichOpportunity = async (
  client: CoreApiClient,
  recordId: string,
): Promise<OpportunityScoringRecord> => {
  const { opportunity } = await client.query({
    opportunity: {
      __args: { filter: { id: { eq: recordId } } },
      id: true,
      name: true,
      amount: { amountMicros: true, currencyCode: true },
      stage: true,
      closeDate: true,
      leadScore: true,
      company: {
        name: true,
        domainName: { primaryLinkUrl: true },
        annualRevenue: { amountMicros: true, currencyCode: true },
        address: { addressCity: true, addressState: true, addressCountry: true },
      },
      timelineActivities: {
        __args: {
          first: RECENT_ACTIVITY_LIMIT,
          orderBy: [{ createdAt: 'DescNullsLast' }],
        },
        edges: {
          node: {
            id: true,
            timelineActivityTypeSnapshot: true,
            happensAt: true,
            createdAt: true,
          },
        },
      },
    },
  });

  if (!opportunity) {
    throw new Error(`Opportunity not found for id ${recordId}`);
  }

  return {
    name: opportunity.name ?? undefined,
    amount: microsToAmount(opportunity.amount?.amountMicros),
    stage: opportunity.stage ?? undefined,
    closeDate: opportunity.closeDate ?? undefined,
    company: opportunity.company?.name ?? undefined,
    companyDomain: opportunity.company?.domainName?.primaryLinkUrl ?? undefined,
    recentActivity: recentActivity(opportunity.timelineActivities),
  };
};

/**
 * Fetch and normalize the scoring context for a single person or opportunity.
 * The returned object is shaped for `buildPersonScoringPrompt` /
 * `buildOpportunityScoringPrompt`.
 */
export const enrichRecord = async (
  input: EnrichmentInput,
): Promise<PersonScoringRecord | OpportunityScoringRecord> => {
  const client = new CoreApiClient();

  return input.objectType === 'person'
    ? enrichPerson(client, input.recordId)
    : enrichOpportunity(client, input.recordId);
};
