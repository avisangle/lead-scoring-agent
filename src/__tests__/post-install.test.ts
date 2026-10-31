import { beforeEach, describe, expect, it, vi } from 'vitest';

import postInstall from 'src/logic-functions/post-install.function';

const { backfillAll } = vi.hoisted(() => ({ backfillAll: vi.fn() }));

vi.mock('src/lib/backfill', () => ({ backfillAll }));

beforeEach(() => {
  backfillAll.mockReset().mockResolvedValue({
    people: 2,
    opportunities: 1,
    skipped: 0,
    total: 3,
  });
});

describe('post-install hook', () => {
  it('backfills existing records on install and on upgrades, off the request path', () => {
    expect(postInstall.config.shouldRunOnVersionUpgrade).toBe(true);
    expect(postInstall.config.shouldRunSynchronously).toBe(false);
  });

  it('runs the full backfill', async () => {
    await postInstall.config.handler({ newVersion: '0.3.0' });

    expect(backfillAll).toHaveBeenCalledTimes(1);
  });
});
