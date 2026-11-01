import {
  defineApplicationRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  SystemPermissionFlag,
} from 'twenty-sdk/define';

import {
  APP_DISPLAY_NAME,
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const readOnly = (objectUniversalIdentifier: string) => ({
  objectUniversalIdentifier,
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
});

// Scored objects: read for the prompt, update for the lead score fields.
const readAndUpdate = (objectUniversalIdentifier: string) => ({
  ...readOnly(objectUniversalIdentifier),
  canUpdateObjectRecords: true,
});

export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: `${APP_DISPLAY_NAME} default function role`,
  description: `${APP_DISPLAY_NAME} default function role`,
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  // Function-only role: assignable roles count as custom roles (paid plan) on Twenty Cloud.
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    readAndUpdate(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier),
    readAndUpdate(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier),
    // Company and recent timeline activity feed the scoring prompt.
    readOnly(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier),
    readOnly(STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity.universalIdentifier),
  ],
  permissionFlagUniversalIdentifiers: [SystemPermissionFlag.AI],
});
