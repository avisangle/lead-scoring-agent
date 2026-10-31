import { definePostInstallLogicFunction } from 'twenty-sdk/define';

import { POST_INSTALL_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { backfillAll } from 'src/lib/backfill';

export default definePostInstallLogicFunction({
  universalIdentifier: POST_INSTALL_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'post-install-backfill',
  description:
    'Queue existing unscored people + opportunities for scoring after install or upgrade.',
  timeoutSeconds: 300,
  // Upgrades also run it: records created while the app was out of date get picked up.
  shouldRunOnVersionUpgrade: true,
  // Queued job, so a large workspace never blocks the install request.
  shouldRunSynchronously: false,
  handler: async () => ({ queued: await backfillAll() }),
});
