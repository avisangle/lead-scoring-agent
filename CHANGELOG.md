# Changelog

All notable changes to this application are documented in this file.

## Unreleased

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
