/**
 * Pure, dependency-free prompt builders that turn a CRM record into the
 * runtime instruction passed to the lead-scorer agent at `runAgent` time.
 *
 * The agent's base system prompt (see `src/agents/lead-scorer.agent.ts`)
 * defines HOW to score; these functions supply the record-specific WHAT.
 */

export type PersonScoringRecord = {
  name?: string;
  jobTitle?: string;
  company?: string;
  city?: string;
  email?: string;
  linkedinUrl?: string;
  companyDomain?: string;
  recentActivity?: string[];
};

export type OpportunityScoringRecord = {
  name?: string;
  amount?: number;
  stage?: string;
  closeDate?: string;
  company?: string;
  companyDomain?: string;
  recentActivity?: string[];
};

const line = (label: string, value: unknown): string | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return `- ${label}: ${value}`;
};

const activityLine = (activity: string[] | undefined): string | null =>
  activity && activity.length > 0
    ? line('Recent activity', activity.join('; '))
    : null;

const buildPrompt = (
  recordType: string,
  fields: (string | null)[],
): string => {
  const known = fields.filter((field): field is string => field !== null);
  const details =
    known.length > 0 ? known.join('\n') : '- (no additional details provided)';

  return [
    `Score the following ${recordType} record as a B2B sales lead.`,
    '',
    'Record details:',
    details,
    '',
    'Return the score (0-100) and a short summary of your reasoning.',
  ].join('\n');
};

export const buildPersonScoringPrompt = (
  record: PersonScoringRecord,
): string =>
  buildPrompt('person (contact)', [
    line('Name', record.name),
    line('Job title', record.jobTitle),
    line('Company', record.company),
    line('Company domain', record.companyDomain),
    line('City', record.city),
    line('Email', record.email),
    line('LinkedIn', record.linkedinUrl),
    activityLine(record.recentActivity),
  ]);

export const buildOpportunityScoringPrompt = (
  record: OpportunityScoringRecord,
): string =>
  buildPrompt('opportunity (deal)', [
    line('Name', record.name),
    line('Amount', record.amount),
    line('Stage', record.stage),
    line('Close date', record.closeDate),
    line('Company', record.company),
    line('Company domain', record.companyDomain),
    activityLine(record.recentActivity),
  ]);
