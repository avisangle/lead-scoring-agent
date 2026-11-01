import {
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  SystemPermissionFlag,
} from 'twenty-sdk/define';
import { describe, expect, it } from 'vitest';

import defaultRole from 'src/default-role';

describe('default function role', () => {
  // Twenty Cloud treats a role assignable to members or API keys as a custom
  // role (Organization plan only), so the app install would be refused.
  it('is not assignable to workspace members or API keys', () => {
    expect(defaultRole.config.canBeAssignedToUsers).toBe(false);
    expect(defaultRole.config.canBeAssignedToApiKeys).toBe(false);
  });
});

describe('least privilege (marketplace review)', () => {
  const { config } = defaultRole;
  const byObject = Object.fromEntries(
    (config.objectPermissions ?? []).map((permission) => [
      permission.objectUniversalIdentifier,
      permission,
    ]),
  );

  it('grants nothing workspace-wide', () => {
    expect(config.canReadAllObjectRecords).toBe(false);
    expect(config.canUpdateAllObjectRecords).toBe(false);
    expect(config.canSoftDeleteAllObjectRecords).toBe(false);
    expect(config.canDestroyAllObjectRecords).toBe(false);
  });

  it('reads only what scoring uses and updates only People and Opportunities', () => {
    const PERSON = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier;
    const OPPORTUNITY =
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier;
    const COMPANY = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier;
    const TIMELINE =
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.timelineActivity.universalIdentifier;

    expect(Object.keys(byObject).sort()).toEqual(
      [PERSON, OPPORTUNITY, COMPANY, TIMELINE].sort(),
    );

    for (const id of [PERSON, OPPORTUNITY]) {
      expect(byObject[id]).toMatchObject({
        canReadObjectRecords: true,
        canUpdateObjectRecords: true,
      });
    }
    for (const id of [COMPANY, TIMELINE]) {
      expect(byObject[id].canReadObjectRecords).toBe(true);
      expect(byObject[id].canUpdateObjectRecords).toBe(false);
    }
    for (const permission of Object.values(byObject)) {
      expect(permission.canSoftDeleteObjectRecords).toBe(false);
      expect(permission.canDestroyObjectRecords).toBe(false);
    }
  });

  it('keeps the AI permission scoring needs', () => {
    expect(config.permissionFlagUniversalIdentifiers).toEqual([
      SystemPermissionFlag.AI,
    ]);
  });
});
