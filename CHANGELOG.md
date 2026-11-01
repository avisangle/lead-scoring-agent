# Changelog

All notable changes to this application are documented in this file.

## Unreleased

- Marketplace listing: author set to ReportStack.
- Least privilege: the app's function role now reads only People, Companies, Opportunities and
  timeline activity, updates only People and Opportunities, and can no longer delete anything.
- Marketplace listing: four gallery images (1600x1000) and a README covering privacy (what is sent,
  where, what is kept, how to delete it), pricing and support.

## 0.3.0

- Existing records are scored after install: a post-install hook (also run on upgrades) queues every
  unscored or failed person and opportunity. Previously only records created or edited after install
  were scored.
- Backfill marks records with no scoring signal SKIPPED instead of queueing them, so they no longer
  spend AI credits.
- New app page: scoring counts per status for People and Opportunities, with a button to queue
  unscored and failed records.
- Marketplace listing: original animated logo (CSS keyframes, respects reduced motion), category
  Sales, support email, website and issue tracker links.

## 0.2.1

- Fix: install failed on Twenty Cloud plans without custom roles ("Custom roles require the
  Organization plan"). The app's function role is no longer assignable to members or API keys.

## 0.2.0

- Upgrade to Twenty SDK 2.54.3 and the standalone `twenty` CLI. Requires a Twenty server 2.49 or later.
- Fix: recent timeline activity was silently missing from scoring on current servers. Twenty replaced
  `timelineActivity.name` with an activity type; the event name is now read from
  `timelineActivityTypeSnapshot.name`.

## 0.1.0

- Initial application scaffolded with [`create-twenty-app`](https://www.npmjs.com/package/create-twenty-app)
