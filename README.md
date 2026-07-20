# lead-scoring-agent

A Twenty CRM app (SDK) that automatically scores new/updated `person` and `opportunity`
records 0–100 with a short reasoning summary, so a sales rep can work a leads list sorted by
score. Single manual creates score inline (seconds); bulk imports route to a throttled queue
drained by a cron sweeper (~1 min).

**Status:** scaffolded + synced to `https://lead-scoring.twenty.com` (TCA-2 done). Feature work next.

## Toolchain

This app requires **Node ≥24.5** (`.nvmrc` pins 24.5.0) and **Yarn 4** (`packageManager: yarn@4.13.0`, via corepack).
On this machine Node 24 is Homebrew keg-only — put it on PATH before working here:

```bash
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"   # or add to ~/.zshrc to make permanent
```

## Dev commands

```bash
corepack yarn twenty dev --once   # sync app to the workspace once
corepack yarn twenty dev          # watch mode
corepack yarn test                # vitest
corepack yarn typecheck
```

## Planning & tracking

Design/planning lives in the separate `Twenty-CRM` planning repo + Atlassian:

- **PRD:** `Twenty-CRM/docs/prd/lead-scoring-agent.md` (source of truth)
- **Confluence:** space `SD` → "PRD: AI Lead Scoring & Enrichment Agent" (page 753665)
- **Jira:** project `TCA` — epic `TCA-1`, stories `TCA-2`…`TCA-10`

| Issue | Work | State |
|---|---|---|
| TCA-2 | Scaffold app + pin GA SDK | ✅ done |
| TCA-3 | `leadScore` fields on person + opportunity | to do |
| TCA-4 | Lead-scorer agent (flat `{score, summary}` + 2 prompts) | to do |
| TCA-5 | Default app role granting the AI permission flag | to do |
| TCA-6 | SPIKE: verify GA SDK API shapes (Q1–Q5) | to do |
| TCA-7 | Enrichment helper (record + company + activity) | to do |
| TCA-8 | Default INDEX views sorted by `leadScore` desc | to do |
| TCA-9 | `scoreOnEvent` databaseEvent fn (filter, burst, loop guard) | to do |
| TCA-10 | `drainQueue` cron fn (capped drain, failed + retry) | to do |

License: MIT (app code). The Twenty SDK is AGPL-3.0 and bundles into the shipped artifact.
