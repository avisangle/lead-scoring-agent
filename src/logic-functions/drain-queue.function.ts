import { defineLogicFunction } from 'twenty-sdk/define';

import { DRAIN_QUEUE_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { drainQueue } from 'src/lib/drain-queue';

export default defineLogicFunction({
  universalIdentifier: DRAIN_QUEUE_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'drainQueue',
  description: 'Score up to a capped batch of QUEUED leads each run.',
  timeoutSeconds: 300,
  cronTriggerSettings: { pattern: '* * * * *' },
  handler: () => drainQueue(),
});
