import { defineLogicFunction } from 'twenty-sdk/define';
import type { DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { OPPORTUNITY_SCORE_ON_CREATED_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { handleScoreOnEvent } from 'src/lib/score-on-event';

export default defineLogicFunction({
  universalIdentifier: OPPORTUNITY_SCORE_ON_CREATED_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'scoreOnOpportunityCreated',
  description: 'Score a newly created opportunity (inline, or queue if imported).',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: { eventName: 'opportunity.created' },
  handler: (event: DatabaseEventPayload) =>
    handleScoreOnEvent('opportunity', event),
});
