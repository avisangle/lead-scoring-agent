import { defineApplicationRole, SystemPermissionFlag } from 'twenty-sdk/define';

import {
  APP_DISPLAY_NAME,
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: `${APP_DISPLAY_NAME} default function role`,
  description: `${APP_DISPLAY_NAME} default function role`,
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: false,
  // Function-only role: assignable roles count as custom roles (paid plan) on Twenty Cloud.
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  permissionFlagUniversalIdentifiers: [SystemPermissionFlag.AI],
});
