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
