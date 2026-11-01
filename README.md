# Lead Scoring Agent

Scores every person and opportunity in your Twenty workspace from 0 to 100, with a one-to-three
sentence reason, so your team works the most promising leads first.

## What you get

- **Lead Score**, **Lead Score Summary**, **Lead Scored At** and **Lead Score Status** fields on
  People and Opportunities.
- **People by Lead Score** and **Opportunities by Lead Score** views, highest score first.
- A **Lead Scoring Agent** page in the sidebar with counts per status and a button to score
  anything not yet scored.

## How it works

- A new or edited record is scored within seconds. People are re-scored when their job title,
  company or email changes; opportunities when amount, stage or close date changes.
- Imports and records that existed before install go to a queue that is scored 20 per object
  per minute. Installing or upgrading the app queues existing records automatically.
- The score comes from your workspace's default AI model, judging fit (seniority, title, company),
  intent (stage, amount, recent activity) and how complete the record is. It uses only what is
  in the record and does not look anything up on the web.
- A record with nothing to judge (a person without job title or company, an opportunity without
  amount or stage) is marked **Skipped** and costs nothing. It is scored once one of those
  fields is filled in.

## Install

Requires a Twenty server **2.49 or later**.

- **Twenty UI:** Settings → Applications → Marketplace → **Lead Scoring Agent** → Install. If it
  isn't shown, open the filter and turn on **Show unlisted apps**.
- **CLI:** `npx twenty@latest auth login --url https://<your-workspace>.twenty.com`, then
  `npx twenty@latest app install --universal-identifier 94f2e86e-62e5-4695-b4e8-50059cd7db30`.

There is nothing to configure. Make sure your workspace has a default AI model (Settings → AI).

## Privacy

**What leaves the workspace.** Only the scoring prompt, sent through Twenty's AI service to your
workspace's default model:

- People: name, job title, primary email, LinkedIn URL, company name, company domain and company
  city.
- Opportunities: name, amount, stage, close date, company name and company domain.
- Both: the event names of the 10 most recent timeline entries (for example `noteLinked`), never
  their content. Email bodies, notes and attachments are not sent.

**Where it goes.** On Twenty Cloud, models run through Twenty's own AI providers, covered by
[Twenty's privacy policy](https://twenty.com/privacy-policy). On a self-hosted server, they go
to the provider your administrator configured. The app holds no API keys and calls no other
service.

**What is kept, and for how long.** The score, summary, time and status are stored on the record
itself, inside your workspace. The app keeps no copy of the prompt or the answer anywhere else.
A score stays until the record is re-scored or deleted.

**Deleting it.** Deleting a record deletes its score. Uninstalling the app removes the four fields
and all their values.

**Permissions.** The app can read People, Companies, Opportunities and timeline activity, update
People and Opportunities, and use AI. It cannot delete anything.

## Pricing

Free, and open source under the MIT license. Each scored record uses one AI call, billed to your
workspace's Twenty AI credits (Cloud) or to your own AI provider account (self-hosted). Skipped
records use none. If credits run out, records wait in the queue and are scored once credits
return. No other paid service is needed.

## Support

- Email: [support@reportstack.app](mailto:support@reportstack.app)
- Issues: [github.com/avisangle/lead-scoring-agent/issues](https://github.com/avisangle/lead-scoring-agent/issues)
- Development setup: [SETUP.md](SETUP.md). Changes: [CHANGELOG.md](CHANGELOG.md).
