# Changelog

All notable changes to this application are documented in this file.

## 0.2.0

- Upgrade to Twenty SDK 2.54.3 and the standalone `twenty` CLI. Requires a Twenty server 2.49 or later.
- Fix: recent timeline activity was silently missing from scoring on current servers. Twenty replaced
  `timelineActivity.name` with an activity type; the event name is now read from
  `timelineActivityTypeSnapshot.name`.

## 0.1.0

- Initial application scaffolded with [`create-twenty-app`](https://www.npmjs.com/package/create-twenty-app)
