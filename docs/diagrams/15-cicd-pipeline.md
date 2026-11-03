# 15 — CI/CD pipeline

สาม workflow ใน `.github/workflows/` (public repo → GitHub-hosted runners) CI ไม่ deploy; deploy ทำโดย Vercel Git integration

```mermaid
flowchart TB
    PUSH["push main"] --> CI
    PR["pull_request"] --> CI
    WD["workflow_dispatch"] --> CI
    PUSH --> DB
    TAG["push tag v*"] --> DB
    PRM["pull_request to main"] --> DB

    subgraph CI["ci.yml: CI, concurrency ci-ref, cancel in progress"]
        FE["frontend: shared ci-node.yml v1.1.1, node 22, lint, typecheck, vitest require-tests, next build"]
        AIS["ai-service: shared ci-python.yml v1.1.1, python 3.11, ruff, pytest, requirements.txt vs uv.lock diff"]
        BL["backend-lint: golangci-lint v2.15.0"]
        BT["backend-test: postgres:15 service, check-migrations.sh, go test -race, go build"]
        CB["compose-build: cp .env.example, docker compose build"]
        SEC["security: shared security.yml v1.1.1, gitleaks, Semgrep, OSV-Scanner, Trivy"]
    end

    subgraph DB["docker-build.yml: matrix backend, ai-service, frontend"]
        BX["buildx + metadata tags: branch, pr, semver, sha"]
        PSH{"HAS_DOCKERHUB and not PR?"}
        BX --> PSH
        PSH -->|yes| HUB["push bookreading/service to Docker Hub"]
        PSH -->|no| ONLY["build only"]
    end

    PUSH --> VER["Vercel Git integration: bookreading-frontend production deploy"]
    VER -->|"deployment_status success, environment Production"| SMK
    WD2["workflow_dispatch"] --> SMK

    subgraph SMK["deploy-smoke.yml"]
        S1["scripts/deploy-smoke.sh https://bookreading.bookchaowalit.com EXPECTED_SHA"]
        S2["GET / shows BookReading"]
        S3["GET /build-info commit equals deployed sha, 20 tries x 15 s"]
        S4["GET /about shows BookReading"]
        S1 --> S2 --> S3 --> S4
    end
```

Sources: `.github/workflows/ci.yml`, `.github/workflows/docker-build.yml`, `.github/workflows/deploy-smoke.yml`, `scripts/deploy-smoke.sh`, `scripts/check-migrations.sh`,
`frontend/src/app/build-info/route.ts`, `specs/001-next16-shared-ci-sentry/spec.md` (workflow migration table)

## หมายเหตุ

- ไม่มี `needs:` ระหว่าง job — ทุก job ใน `ci.yml` รันขนานกัน และ Vercel deploy ไม่รอ CI (ไม่มี branch protection / required checks บน `main`, `gh api .../branches/main/protection` → 404)
- Playwright e2e (`frontend/e2e/landing.spec.ts`, `npm run test:e2e`) ไม่ถูกเรียกใน workflow ใด
- backend และ ai-service ไม่มี deploy job; image บน Docker Hub (ถ้า push) ไม่มีผู้ใช้ที่ระบุใน repo
- workflow เก่า `frontend-ci.yml`, `backend-ci.yml`, `ai-service-ci.yml` ถูกลบใน `77d6f45` (2026-10-22) และ `ci.yml` ถูกเขียนใหม่ใน `b7eb40b` (run ของ workflow เก่ายังเห็นใน `gh run list` ถึง 2026-10-15)

## Open questions

- ต้องการให้ Vercel deploy รอ CI เขียว (required checks หรือ Vercel "Ignored Build Step") หรือไม่
- Docker Hub secrets ตั้งไว้หรือไม่ (`HAS_DOCKERHUB`) — log ของ run ไม่ได้ตรวจในรอบนี้
