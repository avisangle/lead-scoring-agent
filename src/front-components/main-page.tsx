import { useCallback, useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar } from 'twenty-sdk/front-component';
import { getPublicAssetUrl } from 'twenty-sdk/utils';
import { LightButton, MainButton } from 'twenty-ui/components/input';
import { IconRefresh, IconSparkles } from 'twenty-ui/icon';
import { Status } from 'twenty-ui/primitives/data-display';
import { useTheme } from 'twenty-ui/theme';

import {
  APP_DISPLAY_NAME,
  MAIN_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import type { BackfillResult } from 'src/lib/backfill';
import type { ScoreStats, StatusCounts } from 'src/lib/score-stats';

const ROWS: {
  key: keyof StatusCounts;
  label: string;
  color: 'green' | 'blue' | 'gray' | 'red' | 'orange';
}[] = [
  { key: 'scored', label: 'Scored', color: 'green' },
  { key: 'queued', label: 'Queued', color: 'blue' },
  { key: 'skipped', label: 'Skipped (no title, company, amount or stage)', color: 'gray' },
  { key: 'failed', label: 'Failed', color: 'red' },
  { key: 'unscored', label: 'Not scored yet', color: 'orange' },
];

const StatsCard = ({ title, counts }: { title: string; counts?: StatusCounts }) => {
  const theme = useTheme();

  return (
    <div
      style={{
        flex: '1 1 260px',
        border: `1px solid ${theme.border.color.medium}`,
        borderRadius: theme.border.radius.md,
        background: theme.background.primary,
        padding: theme.spacing[4],
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing[2],
      }}
    >
      <span
        style={{
          fontSize: theme.font.size.md,
          fontWeight: theme.font.weight.semiBold,
          color: theme.font.color.primary,
        }}
      >
        {title}
      </span>
      {ROWS.map((row) => (
        <div
          key={row.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing[2],
          }}
        >
          <Status color={row.color}>{row.label}</Status>
          <span
            style={{
              fontSize: theme.font.size.md,
              fontWeight: theme.font.weight.medium,
              color: theme.font.color.primary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {counts ? counts[row.key] : '–'}
          </span>
        </div>
      ))}
    </div>
  );
};

const MainPage = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<ScoreStats | null>(null);
  const [isQueueing, setIsQueueing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStats(await new RestApiClient().get<ScoreStats>('/s/stats'));
    } catch {
      await enqueueSnackbar({ message: 'Could not load scoring stats', variant: 'error' });
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const pending = stats
    ? stats.person.unscored + stats.person.failed + stats.opportunity.unscored + stats.opportunity.failed
    : 0;

  const scoreUnscored = async () => {
    setIsQueueing(true);
    try {
      const { queued } = await new RestApiClient().post<{ queued: BackfillResult }>(
        '/s/backfill',
      );
      await enqueueSnackbar({
        message: `Queued ${queued.total} record(s), skipped ${queued.skipped} with nothing to score`,
        variant: 'success',
      });
      await loadStats();
    } catch {
      await enqueueSnackbar({ message: 'Could not queue records', variant: 'error' });
    } finally {
      setIsQueueing(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing[6],
        padding: theme.spacing[8],
        maxWidth: '720px',
        margin: '0 auto',
        fontFamily: theme.font.family,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
        <img src={getPublicAssetUrl('logo.svg')} alt="" width={48} height={48} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
          <span
            style={{
              fontSize: theme.font.size.xl,
              fontWeight: theme.font.weight.semiBold,
              color: theme.font.color.primary,
            }}
          >
            {APP_DISPLAY_NAME}
          </span>
          <span style={{ fontSize: theme.font.size.sm, color: theme.font.color.tertiary }}>
            New and edited people and opportunities are scored automatically. Queued
            records are scored every minute, 20 at a time.
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing[4] }}>
        <StatsCard title="People" counts={stats?.person} />
        <StatsCard title="Opportunities" counts={stats?.opportunity} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing[2] }}>
        <MainButton
          startIcon={<IconSparkles size={16} />}
          loading={isQueueing}
          disabled={isQueueing || pending === 0}
          onClick={scoreUnscored}
        >
          Score unscored and failed records
        </MainButton>
        <LightButton startIcon={<IconRefresh size={16} />} onClick={loadStats}>
          Refresh
        </LightButton>
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: MAIN_PAGE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: APP_DISPLAY_NAME,
  description: `${APP_DISPLAY_NAME} scoring status per object, with a button to score existing records`,
  component: MainPage,
});
