# ADR-0005 — Frontend บน Vercel (Git integration), CI ใช้ shared reusable workflows

- Status: accepted (retro-documented)
- Date: 2026-11-03

## Decision

- `https://bookreading.bookchaowalit.com` = Vercel project `bookreading-frontend` (team `chaowalit-greepokes-projects`); push `main` → Vercel deploy → GitHub `deployment_status` → `deploy-smoke.yml`
- smoke test เช็ค `/`, `/build-info` (commit ต้องตรง `VERCEL_GIT_COMMIT_SHA`) และ `/about`
- CI (`ci.yml`) ใช้ `bookchaowalit/platform-ci-workflows` v1.1.1 (`87dc5e1`) สำหรับ node, python, security; Go/compose เป็น job ของ repo เอง; CI ไม่ deploy
- `docker-build.yml` build image สามตัว, push Docker Hub เฉพาะเมื่อมี secrets

## Evidence

`.github/workflows/ci.yml`, `.github/workflows/deploy-smoke.yml`, `.github/workflows/docker-build.yml`, `scripts/deploy-smoke.sh`, `frontend/src/app/build-info/route.ts`,
`specs/001-next16-shared-ci-sentry/spec.md`, ผลจาก `vercel ls bookreading-frontend --prod` และ `gh api .../deployments` (2026-11-03)

## Consequences

- ดี: ทุก production deploy ถูก verify commit อัตโนมัติ
- เสีย: deploy มีแค่ frontend; rewrite `/api/*` ไป `BACKEND_URL` ไม่มีปลายทาง → 502 บน production
- ไม่มี branch protection บน `main` (`gh api .../branches/main/protection` → 404) จึงไม่มี gate บังคับก่อน deploy
