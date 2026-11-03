# ADR-0002 — PostgreSQL ตัวเดียว, migrations ของ golang-migrate เป็น source of truth

- Status: accepted (retro-documented)
- Date: 2026-11-03

## Context

ทั้ง backend และ ai-service ต้องเก็บข้อมูลถาวร (users, novels, chapters, progress, billing, review queue) มี `database/init.sql` รุ่นเก่ากับ
`database/migrations/` ที่ขัดกันอยู่หลายตาราง

## Decision

- PostgreSQL 15 (`postgres:15-alpine` ใน compose, `postgres:15` ใน CI) ใช้ร่วมกันทั้งสอง service
- schema เปลี่ยนผ่าน golang-migrate (`Makefile` `migrate-up/down/status/create`, ไฟล์ `NNN_*.up.sql` / `.down.sql`)
- กติกา: down migration ห้ามลบสิ่งที่ `init.sql` สร้าง (pass 11); CI รัน `scripts/check-migrations.sh` up/down/up + rollback ของ init.sql
- `docs/UPGRADE-PLAN.md` P1 เลือก migrations เป็น source of truth และจะทำให้ `init.sql` เป็น dump ของ schema ที่ migrate แล้ว

## Evidence

`docker-compose.yml`, `Makefile`, `database/README.md`, `database/migrations/001…010`, `scripts/check-migrations.sh`, `.github/workflows/ci.yml` (`backend-test`),
`docs/UPGRADE-PLAN.md` (P1 schema drift, pass 9, 11)

## Consequences

- ดี: rollback ถูกทดสอบใน CI; DB-backed test (`BOOKREADING_TEST_DATABASE_URL`) จับ drift ได้
- เสีย: `review_queue`, `character_profiles`, `translation_*` ของ ai-service มีเฉพาะใน `init.sql` — DB ที่สร้างจาก migrations อย่างเดียวไม่มีตารางเหล่านี้
- compose mount `init.sql` เข้า `docker-entrypoint-initdb.d` จึงใช้ทั้งสองทางพร้อมกัน
