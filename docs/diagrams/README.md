# Core 22 SDLC diagram pack — content-bookreading

ชุดภาพ 22 รายการตาม SDLC Diagram Catalog v2 (knowledge-base `knowledge/tech/core-cs/sdlc-diagram-catalog.md`) วาดจากโค้ดที่ commit `74cf7cb`
(origin/main = production frontend ณ 2026-11-03) ทุก diagram มี `Sources:` ใต้ภาพ และสิ่งที่ไม่รู้อยู่ใน "Open questions" ของแต่ละไฟล์

Central flow pack ที่ reuse/อ้างอิง: [architecture-docs `docs/architecture/flows/bookreading-ui/`](https://github.com/bookchaowalit/architecture-docs/tree/main/docs/architecture/flows/bookreading-ui)
— pin ที่ `6fd8737` (2026-08) ก่อน pass 7–11 จึงล้าสมัยหลายจุด (review queue มี auth + admin แล้ว, frontend ไม่เรียก ai-service ตรง, `users.role` มีแล้ว,
reader ไม่ได้ gate ด้วยสถานะ review) — ไฟล์ในชุดนี้ระบุจุดต่างไว้ทุกครั้งที่ลิงก์

## ข้อค้นพบหลัก

1. **Production มีแค่ frontend**: `/api/*` บน `bookreading.bookchaowalit.com` ตอบ `502 DNS_HOSTNAME_NOT_FOUND` (rewrite ไป `http://backend:8080`) — login, library, translate, billing ใช้ไม่ได้บน prod
2. **Review queue ไม่ถูกป้อน**: item เข้าได้ทาง `/translate/pipeline` เท่านั้น ซึ่งไม่อยู่ใน `/api/ai` allow-list และไม่มีใครเรียก
3. **User LLM key อยู่ใน localStorage** และถูกส่งใน body (ขัดกับ README "Server-Side API Keys") — ดู 13 G1
4. compose healthcheck ของ backend ใช้ `/health` แต่ route จริงคือ `/api/health`
5. `backups/` ไม่อยู่ใน `.gitignore`; ไม่มี restore script, RTO/RPO ไม่กำหนด

| # | Item | Status | File | Sources read |
|---|---|---|---|---|
| 01 | Business process (As-Is / To-Be) | done (reuses central 01) | [01-business-process.md](./01-business-process.md) | `server.go`, `handler.go`, `reader/page.tsx`, `novel_update_usecase.go`, `payment_handler.go`, `ai-service/main.py`, `docs/UPGRADE-PLAN.md`, `KPI-PLAN.md`, `specs/001` |
| 02 | Use cases | done | [02-use-cases.md](./02-use-cases.md) | `server.go`, `ai_proxy_handler.go`, `routes_access_test.go`, `domain/model.go`, migration 009 |
| 03 | User flows | done (reuses central 02) | [03-user-flows.md](./03-user-flows.md) | `frontend/src/app/**/page.tsx`, `app/app/layout.tsx`, `lib/api.ts`, `lib/new-api.ts`, `useIsAdmin.ts` |
| 04 | Traceability (RTM) | done (reuses central 08) | [04-traceability.md](./04-traceability.md) | `specs/001`, `PRODUCT.md`, `docs/API.md`, `docs/UPGRADE-PLAN.md`, all test files |
| 05 | C4 Context | done | [05-c4-context.md](./05-c4-context.md) | `payment_handler.go`, `agentic_translator.py`, `url_safety.py`, `site_routing.py`, `sentry.ts` |
| 06 | C4 Container | done | [06-c4-container.md](./06-c4-container.md) | `docker-compose.yml`, Dockerfiles, `next.config.ts`, `cmd/main.go`, `db_manager.py` |
| 07 | C4 Component | done | [07-c4-component.md](./07-c4-component.md) | `backend/internal/**`, `ai-service/*.py`, `frontend/src/lib`, `REFACTORING.md` |
| 08 | ADRs | done (6 retro ADRs) | [08-adr/](./08-adr/) | `README.md`, compose, migrations, `handler.go`, `ai_proxy_handler.go`, workflows, `payment_handler.go` |
| 09 | ERD | done | [09-erd.md](./09-erd.md) | `database/migrations/001…010`, `database/init.sql`, `domain/*.go` |
| 10 | Sequences | done (reuses central 03 progress sync) | [10-sequences.md](./10-sequences.md) | `handler.go`, `user_usecase.go`, `ai_proxy_handler.go`, `reader/page.tsx`, `payment_handler.go`, scheduler, `novel_subscription_repo.go` |
| 11 | State machines | done (corrects central 04) | [11-state-machines.md](./11-state-machines.md) | `multi_agent_translator.py`, `db_manager.py`, `payment_handler.go`, `novel_update_usecase.go` |
| 12 | API + integration | reused (`docs/API.md`, `docs/openapi.yaml`) + inventory | [12-api-integration.md](./12-api-integration.md) | `docs/API.md`, `docs/openapi.yaml`, `server.go`, `ai_proxy_handler.go`, `aiservice/client.go` |
| 13 | Threat model | done (supersedes central 06) | [13-threat-model.md](./13-threat-model.md) | `handler.go`, `ai_proxy_handler.go`, `service_auth.py`, `url_safety.py`, `settings/page.tsx`, workflows |
| 14 | Backup / DR | done | [14-backup-dr.md](./14-backup-dr.md) | `scripts/backup-db.sh`, `docker-compose.yml`, `RUNBOOK.md`, `.gitignore` |
| 15 | CI/CD pipeline | done | [15-cicd-pipeline.md](./15-cicd-pipeline.md) | `.github/workflows/*.yml`, `scripts/deploy-smoke.sh`, `scripts/check-migrations.sh` |
| 16 | Deployment | done | [16-deployment.md](./16-deployment.md) | `docker-compose.yml`, `next.config.ts`, env reads in Go/Python, `vercel ls`, live curl |
| 17 | Test coverage matrix | done | [17-test-coverage-matrix.md](./17-test-coverage-matrix.md) | every `*_test.go`, `test_*.py`, `__tests__/*`, `e2e/*`, `pytest.ini` |
| 18 | Git / release workflow | done | [18-git-release-workflow.md](./18-git-release-workflow.md) | `git log`, `gh pr list`, branch protection API, workflows |
| 19 | Service dependency map | done | [19-service-dependency-map.md](./19-service-dependency-map.md) | `next.config.ts`, `cmd/main.go`, `ai_proxy_handler.go`, `ai-service/main.py`, `layout.tsx` |
| 20 | Observability | done | [20-observability.md](./20-observability.md) | `sentry.ts`, `instrumentation*.ts`, health routes, `middleware/logging.go`, `logging_config.py` |
| 21 | Incident response | done | [21-incident-response.md](./21-incident-response.md) | `RUNBOOK.md`, `deploy-smoke.yml`, `gh run list` |
| 22 | DORA | done (2 metrics partly not computable) | [22-dora.md](./22-dora.md) | `git log`, `gh run list`, `gh api deployments`, `vercel ls/inspect` |

ตรวจ syntax: `node ~/work/core22/tools/validate.mjs docs/diagrams/*.md docs/diagrams/08-adr/*.md`
