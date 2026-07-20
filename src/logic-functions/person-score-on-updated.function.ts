import { defineLogicFunction } from 'twenty-sdk/define';
import type { DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PERSON_SCORE_ON_UPDATED_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { handleScoreOnEvent } from 'src/lib/score-on-event';

export default defineLogicFunction({
  universalIdentifier: PERSON_SCORE_ON_UPDATED_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'scoreOnPersonUpdated',
  description: 'Re-score a person when a scoring-relevant business field changes.',
  timeoutSeconds: 60,
  // Watches only business fields — never the score fields — so score writes
  // cannot re-trigger scoring (loop guard).
  databaseEventTriggerSettings: {
    eventName: 'person.updated',
    updatedFields: ['jobTitle', 'companyId', 'emails'],
  },
  handler: (event: DatabaseEventPayload) => handleScoreOnEvent('person', event),
});
