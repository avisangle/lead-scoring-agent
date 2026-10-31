import { defineLogicFunction, HTTPMethod } from 'twenty-sdk/define';

import { SCORE_STATS_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { getScoreStats } from 'src/lib/score-stats';

export default defineLogicFunction({
  universalIdentifier: SCORE_STATS_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'score-stats',
  description: 'Counts of people + opportunities per lead score status, for the main page.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: '/stats',
    httpMethod: HTTPMethod.GET,
    isAuthRequired: true,
  },
  handler: async () => getScoreStats(),
});
