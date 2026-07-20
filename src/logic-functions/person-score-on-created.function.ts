import { defineLogicFunction } from 'twenty-sdk/define';
import type { DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { PERSON_SCORE_ON_CREATED_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { handleScoreOnEvent } from 'src/lib/score-on-event';

export default defineLogicFunction({
  universalIdentifier: PERSON_SCORE_ON_CREATED_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'scoreOnPersonCreated',
  description: 'Score a newly created person (inline, or queue if imported).',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: { eventName: 'person.created' },
  handler: (event: DatabaseEventPayload) => handleScoreOnEvent('person', event),
});
