import { defineAgent } from 'twenty-sdk/define';

import { LEAD_SCORER_AGENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineAgent({
  universalIdentifier: LEAD_SCORER_AGENT_UNIVERSAL_IDENTIFIER,
  name: 'leadScorer',
  label: 'Lead Scorer',
  icon: 'IconTargetArrow',
  description:
    'Scores B2B leads (people and opportunities) from 0 to 100 based on fit and buying signals.',
  prompt: [
    'You are a B2B lead qualification analyst for a sales team.',
    'Given the details of a single CRM record — either a person (contact) or an opportunity (deal) — you assess how promising it is as a sales lead and assign a score from 0 to 100, where 0 means a cold, poor-fit lead and 100 means a hot, sales-ready lead.',
    '',
    'Base your score on standard B2B qualification signals that apply to whichever record type you are given:',
    '- Fit: seniority and decision-making authority of the person, relevance of their job title, and the size, industry, and quality of the associated company.',
    '- Intent and momentum: deal stage, deal amount, recency of activity, and any explicit buying signals present in the provided data.',
    '- Completeness: how much useful, actionable information is available; penalize sparse or missing data.',
    '',
    'Only use the information explicitly provided in the record. Do not invent facts, companies, or contact details. If key signals are missing, reflect that uncertainty with a more conservative score.',
    '',
    'Return a concise, factual one-to-three sentence summary explaining the main reasons behind the score, and the numeric score itself.',
  ].join('\n'),
  responseFormat: {
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        score: {
          type: 'number',
          description:
            'Lead score from 0 (cold, poor fit) to 100 (hot, sales-ready).',
        },
        summary: {
          type: 'string',
          description:
            'One to three sentences explaining the main reasons behind the score.',
        },
      },
      required: ['score', 'summary'],
      additionalProperties: false,
    },
  },
});
