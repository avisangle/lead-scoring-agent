# lead-scoring-agent

A Twenty CRM app (SDK) that automatically scores new/updated `person` and `opportunity`
records 0–100 with a short reasoning summary, so a sales rep can work a leads list sorted by
score. Single manual creates score inline (seconds); bulk imports route to a throttled queue
drained by a cron sweeper (~1 min).

**Status:** v1 functional — auto-scores on create/update, backfills existing records, and ships sorted "by Lead Score" views.

## Install

Published to npm as [`lead-scoring-agent`](https://www.npmjs.com/package/lead-scoring-agent). Requires a Twenty server **2.49 or later**.

- **Twenty UI:** Settings → Applications → Marketplace. The app has not been through Twenty's marketplace review yet, so open the filter and turn on **Show unlisted apps**, then find **Lead Scoring Agent** → Install. Twenty shows a "not reviewed" warning for unlisted apps.
  Self-hosted servers import npm apps into their catalog automatically every hour.
- **CLI:** `npx twenty@latest auth login --url https://<your-workspace>.twenty.com`, then
  `npx twenty@latest app install --universal-identifier 94f2e86e-62e5-4695-b4e8-50059cd7db30`.

**Requires AI credits.** Scoring calls your workspace's default AI model — one call per scored record, metered by Twenty AI credits. With no credits available, records are marked queued and score automatically once credits return.

**What it installs:** `leadScore` / `leadScoreSummary` / `leadScoredAt` / `leadScoreStatus` fields on People and Opportunities, the lead-scorer AI agent, the event-driven + cron scoring functions, an app page with scoring status, and default views sorted by score.

**After install:** existing People and Opportunities are queued for scoring automatically, and the cron scores them 20 per object per minute. Records with nothing to score (a person without job title or company, an opportunity without amount or stage) are marked **Skipped** and use no credits; they score as soon as one of those fields is filled in. Upgrades repeat this step, so records missed while the app was out of date are picked up too. The **Lead Scoring Agent** page in the sidebar shows counts per status and has a **Score unscored and failed records** button for a manual re-run.

## Development

Requires **Node 24.5+ or 26.5+** (`.nvmrc` pins 24.5.0), **Yarn 4** (via corepack) and the standalone Twenty CLI (`npm install -g twenty`). See [SETUP.md](SETUP.md).

```bash
twenty app apply --create   # first time: register, install and sync the app
twenty app dev              # watch mode
corepack yarn test:unit     # unit tests
corepack yarn typecheck
```

## License

MIT. The Twenty SDK packages it bundles are MIT too.
