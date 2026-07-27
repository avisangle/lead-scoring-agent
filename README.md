# lead-scoring-agent

A Twenty CRM app (SDK) that automatically scores new/updated `person` and `opportunity`
records 0–100 with a short reasoning summary, so a sales rep can work a leads list sorted by
score. Single manual creates score inline (seconds); bulk imports route to a throttled queue
drained by a cron sweeper (~1 min).

**Status:** v1 functional — auto-scores on create/update, backfills existing records, and ships sorted "by Lead Score" views.

## Install

Published to npm and installable into any Twenty CRM workspace.

- **Twenty UI:** Settings → Applications → find **Lead Scoring Agent** → Install.
  Self-hosted instances: run `yarn twenty dev:catalog-sync` first so npm-published apps appear in the marketplace.
- **CLI / details:** see the Twenty apps guide at docs.twenty.com/developers/extend/apps.

**Requires AI credits.** Scoring calls your workspace's default AI model — one call per scored record, metered by Twenty AI credits. With no credits available, records are marked queued and score automatically once credits return.

**What it installs:** `leadScore` / `leadScoreSummary` / `leadScoredAt` / `leadScoreStatus` fields on People and Opportunities, the lead-scorer AI agent, the event-driven + cron scoring functions (including a backfill for pre-existing records), and default views sorted by score.

## Development

Requires **Node ≥24.5** (`.nvmrc` pins 24.5.0) and **Yarn 4** (`packageManager: yarn@4.13.0`, via corepack). A Node version manager (fnm/nvm) auto-switches from `.nvmrc`.

```bash
corepack yarn twenty dev --once   # build + sync the app to your workspace once
corepack yarn twenty dev          # watch mode
corepack yarn test:unit           # unit tests
corepack yarn typecheck
```

## License

MIT (app code). The Twenty SDK is AGPL-3.0 and bundles into the shipped artifact.
