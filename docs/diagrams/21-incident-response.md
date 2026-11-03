# 21 — Incident response

repo ไม่มี incident runbook เฉพาะ; `RUNBOOK.md` เป็น stub ที่บอก owner = solo operator, ไม่มี on-call, rollback = redeploy image/tag ก่อนหน้า
flow ด้านล่างใช้เฉพาะช่องทาง alert ที่พบจริง (deploy-smoke failure, Sentry) และ recovery ที่มีจริง (Vercel previous deployment, revert บน `main`)

```mermaid
flowchart TD
    A1["deploy-smoke.yml fails: :: error FAIL lines"] --> N1["GitHub Actions failure email / notification to owner"]
    A2["Sentry error event, if DSN set"] --> N2["Sentry notification, rule not in repo"]
    A3["User report via /contact page"] --> N3["Owner inbox, channel not in repo"]
    N1 --> T["Triage by owner, solo"]
    N2 --> T
    N3 --> T
    T --> Q1{"Frontend regression after deploy?"}
    Q1 -->|yes| R1["Vercel: promote previous production deployment"]
    Q1 -->|no| Q2{"Backend / ai-service / DB issue?"}
    Q2 -->|yes| R2["RUNBOOK: redeploy previous image or tag; migrations have down files"]
    Q2 -->|no| R3["Investigate: logs on host stdout"]
    R1 --> F["Fix on main: test first, push"]
    R2 --> F
    R3 --> F
    F --> V["ci.yml green + deploy-smoke passes"]
    V --> P["Postmortem: not defined, record in docs/UPGRADE-PLAN.md as done-in-pass"]
```

Sources: `RUNBOOK.md` (Rollback, Owner), `.github/workflows/deploy-smoke.yml`, `scripts/deploy-smoke.sh` (`::error::` lines), `frontend/src/lib/sentry.ts`,
`frontend/src/app/contact/page.tsx`, `docs/UPGRADE-PLAN.md` (บันทึก fix เป็น pass), `database/migrations/*.down.sql`

## Severity / SLA

ไม่ได้กำหนดใน repo (ไม่มี SEV levels, ไม่มี SLA)

## ตัวอย่างจริงในประวัติ

- 2026-10-21 `b7eb40b` ทำ CI + Docker build fail (compose build ของ frontend หลังเปลี่ยนเป็น `next.config.ts`) → แก้ใน `c48e87d` ภายใน ~28 นาที (`gh run list`)
  นี่เป็น CI failure บน `main` ไม่ใช่ production incident เพราะตอนนั้น Vercel ยังไม่ต่อ Git

## Open questions

- ช่องทาง alert หลักของ owner (Telegram ใช้กับ repo อื่น) จะใช้กับ repo นี้หรือไม่
- รูปแบบ postmortem ที่ต้องการ (ไฟล์ใน `docs/` หรือ knowledge-base)
