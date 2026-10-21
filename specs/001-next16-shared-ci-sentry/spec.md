---
title: "SPEC-001 — Next.js 16 upgrade, shared CI, Sentry and dependency security"
status: implemented
tags: [spec, sdd, tdd, ci, sentry, nextjs, security]
created: 2026-10-22
updated: 2026-10-22
description: "Move the frontend to Next.js 16, replace five workflows with the shared CI plus the jobs it cannot run, add Sentry, and fix what the security scan found."
---

# SPEC-001 — Next.js 16 upgrade, shared CI, Sentry and dependency security

Standard: ADR-0004 (TDD + SDD). Plan: Big Loop Plan 2026-10-21, Wave 3 items 3–5.
Upgrade guide followed: Next.js "Upgrading to version 16" (bundled with next 16.3.8).

## Document control

| Field | Value |
|---|---|
| Spec ID / version | SPEC-001 / 1.0 |
| Status | implemented |
| Repository | bookchaowalit-website/content-bookreading |
| Owner (maker) | Claude Code (Wave 3 session) |
| Approver | Owner (bookchaowalit) |

## 1. Problem and intent

- **Problem:** five hand-written workflows (`ci.yml`, `frontend-ci.yml`, `backend-ci.yml`, `ai-service-ci.yml`,
  `docker-build.yml`) with overlapping jobs and no security scan; frontend on Next.js 14 / React 18; no error
  reporting; known vulnerabilities in the Go and Python dependency trees; the ai-service had no lockfile and its
  container ran as root.
- **Outcome:** one `ci.yml` built on the shared workflows, keeping the jobs they cannot run; frontend on Next.js 16;
  Sentry on the frontend; the security scan passes.

## 2. Workflow migration

| Old job | Now |
|---|---|
| frontend-ci lint, type check, test, build; ci.yml frontend-build | `frontend` → shared `ci-node.yml` (lint, typecheck, vitest, build) |
| ai-service-ci lint (ruff), test | `ai-service` → shared `ci-python.yml` (`uv sync --frozen`, ruff with `ruff.toml`, pytest) plus a check that `requirements.txt` matches `uv.lock` |
| backend-ci lint (golangci-lint) | kept: `backend-lint` (golangci-lint v2.15.0; v2.5 cannot lint `go 1.26`) |
| backend-ci test (Postgres service, migration chain, `go test -race`), build; ci.yml backend-test | kept: `backend-test` (the shared workflows have no Go job) |
| ci.yml docker-build (`docker compose build`) | kept: `compose-build` |
| ai-service-ci build (single Docker image) | covered by `compose-build` and `docker-build.yml` |
| docker-build.yml (build and optional push of three images) | kept unchanged |
| Codecov uploads (`fail_ci_if_error: false`) | dropped; the shared workflows print coverage in the job summary |
| — | new: `security` → shared `security.yml` (gitleaks, Semgrep, OSV-Scanner, Trivy) |

All shared workflows are pinned to v1.1.1 (`87dc5e1`).

## 3. Behaviour — scenarios

| AC | Given / When / Then | Test |
|---|---|---|
| AC-01 | `next.config.ts` uses `images.remotePatterns` (no deprecated `images.domains`), does not suppress type errors, and proxies `/api/*` to the backend | `frontend/src/lib/__tests__/nextConfig.test.ts` |
| AC-02 | Sentry: off without `NEXT_PUBLIC_SENTRY_DSN`; errors only; request, user, breadcrumbs, extra and frame locals stripped | `frontend/src/lib/__tests__/sentry.test.ts` |
| AC-03 | Existing behaviour unchanged after the upgrade | 76 frontend tests, 195 ai-service tests, Go tests; UI review: 30 captures pixel-identical to the Next 14 build |
| AC-04 | Security scan finds no unreviewed vulnerability | `security` job |

## 4. Interfaces and data

| Area | Change |
|---|---|
| frontend | next 16.3.8, react 19.2.3, eslint 9 flat config, @testing-library/react 16, vitest 4, `@sentry/nextjs` ^11, axios ^1.20; three `<a href="/">` → `<Link>` |
| ai-service | `pyproject.toml` + `uv.lock`; `requirements.txt` is now `uv export` output with hashes and the Dockerfile installs it with `--require-hashes`; fastapi 0.157 / starlette 1.x, lxml 6.1, pydantic 2.14; container runs as uid 1001 |
| backend | `go 1.26.0`; x/crypto, x/net, x/text, x/sys, grpc 1.83.2, protobuf 1.36, golang-jwt 5.3.1; Docker builder golang:1.26 |

Reviewed scanner exceptions (reason + expiry 2027-01-17): `frontend/osv-scanner.toml` (braces, postcss-selector-parser —
dev-only, no fix in the required major), `backend/osv-scanner.toml` (x/crypto/openpgp — not imported, no fix),
`ai-service/osv-scanner.toml` (deep-translator 2022 account-takeover advisory with an open range; 1.11.4 pinned by hash).

## 5. Follow-ups and known gaps

- **F-01:** eslint-config-next 16 adds the React Compiler rules (`set-state-in-effect`, `immutability`,
  `static-components`). 41 existing effects in 23 files break them; the rules are warnings until those effects are refactored.
- **Deploy:** `https://bookreading.bookchaowalit.com` is the Vercel project `bookreading-frontend`, last deployed by CLI on
  2026-08-12; it is not connected to this repository. No deploy workflow is added. The backend and ai-service hosts are
  not recorded here.
- Pre-existing, unchanged: cramped header navigation at 768 px; landing-page figures (10K+ users, 1M+ translations, 50+
  sources) have no data source; axe label/select-name findings on settings and stats.
