---
title: "BookReading — KPI and Instrumentation Plan"
status: draft
created: 2026-10-22
updated: 2026-10-22
description: "What BookReading measures, from the backend database first, and what has no data yet."
template: architecture-docs templates/sdlc/kpi-and-instrumentation-plan.md
---

# BookReading — KPI and Instrumentation Plan

## Document control

| Field | Value |
|---|---|
| Product | bookchaowalit-website/content-bookreading (https://bookreading.bookchaowalit.com) |
| Version / status | 0.1 / **draft** — no analytics tool is installed and no baseline exists |
| Metric owner | Owner (bookchaowalit) |
| AI maker | Claude Code (Wave 3 session, 2026-10-22) |
| Analytics source of truth | backend PostgreSQL (reading progress, library, subscriptions, translation feedback); Sentry for frontend errors |
| Next review | 2026-11-15 (Milestone M1) |

## KPI tree

```text
OBJ-01 Readers keep reading translated novels here instead of elsewhere
  └─ KPI-O-01 Weekly active readers (≥ 1 chapter progress update in the ISO week)
       ├─ KPI-L-01 New readers who finish 3 chapters within 7 days
       ├─ KPI-L-02 Translation feedback rate (feedback items / chapters translated)
       └─ KPI-G-01 Frontend error events per 1,000 sessions (Sentry)
```

## KPI definitions

| KPI ID | Type | Formula | Source | Baseline | Target | Status |
|---|---|---|---|---|---|---|
| KPI-O-01 | outcome | distinct users with a reading-progress write in the week | backend `reading_progress` (server side) | not yet measured | set after 4 weeks of data | query to write |
| KPI-L-01 | leading | users with ≥ 3 chapters read within 7 days of sign-up / sign-ups | backend users + reading progress | not yet measured | — | query to write |
| KPI-L-02 | leading | translation feedback items / chapters translated | backend feedback + ai-service translation cache | not yet measured | — | query to write |
| KPI-G-01 | guardrail | Sentry error events / sessions × 1000 | Sentry (code merged; DSN not set) | not yet measured | must not rise after a release | planned |

The landing page shows "10K+ users, 1M+ translations, 50+ sources". None of these has a data source today; KPI-O-01
replaces them once measured.

## Event and data specification

No client analytics events are planned: all KPIs come from backend tables the product already writes. Reports
aggregate by week; no names, emails or reading content leave the database.

## Instrumentation verification (before G10)

| # | Check | Result |
|---|---|---|
| 1–2 | Queries return counts that match the tables | not run: queries not written yet |
| 3 | No personal data in reports | by design (aggregates only) |
| 4–5 | Dashboard and alerts | not set up |
| 6 | Baselines captured | waived — dated action: capture KPI-O-01 by 2026-11-15 |
| 7 | Consent | no client tracking, so no consent banner needed |
