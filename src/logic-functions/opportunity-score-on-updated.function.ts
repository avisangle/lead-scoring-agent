import { defineLogicFunction } from 'twenty-sdk/define';
import type { DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { OPPORTUNITY_SCORE_ON_UPDATED_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { handleScoreOnEvent } from 'src/lib/score-on-event';

export default defineLogicFunction({
  universalIdentifier: OPPORTUNITY_SCORE_ON_UPDATED_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'scoreOnOpportunityUpdated',
  description:
    'Re-score an opportunity when a scoring-relevant business field changes.',
  timeoutSeconds: 60,
  // Watches only business fields — never the score fields — so score writes
  // cannot re-trigger scoring (loop guard).
  databaseEventTriggerSettings: {
    eventName: 'opportunity.updated',
    updatedFields: ['amount', 'stage', 'closeDate'],
  },
  handler: (event: DatabaseEventPayload) =>
    handleScoreOnEvent('opportunity', event),
});
