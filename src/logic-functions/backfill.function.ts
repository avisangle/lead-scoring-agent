import { defineLogicFunction, HTTPMethod } from 'twenty-sdk/define';

import { BACKFILL_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { backfillUnscored } from 'src/lib/backfill';

export default defineLogicFunction({
  universalIdentifier: BACKFILL_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'backfill',
  description:
    'Enqueue unscored or failed people + opportunities for the drainQueue cron; marks no-signal records SKIPPED. Idempotent.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: '/backfill',
    httpMethod: HTTPMethod.POST,
    isAuthRequired: true,
  },
  handler: async () => {
    const result = await backfillUnscored();

    return { queued: result };
  },
});
