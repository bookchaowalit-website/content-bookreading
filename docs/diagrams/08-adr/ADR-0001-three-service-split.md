# ADR-0001 — แยกเป็นสาม service ใน repo เดียว: Next.js, Go backend, Python ai-service

- Status: accepted (retro-documented)
- Date: 2026-11-03 (บันทึกย้อนหลังจากโค้ด `74cf7cb`)
- Deciders: owner (bookchaowalit)

## Context

ระบบต้องทำสองงานที่ต่างกันมาก: (1) API ของแอปอ่านนิยาย (auth, library, progress, billing) และ (2) งาน AI/scraping ที่ใช้ library ของ Python
(OpenAI SDK, google-genai, deep-translator, BeautifulSoup, EasyOCR, Playwright)

## Decision

- `frontend/` — Next.js 16 / React 19 / TypeScript / Tailwind, `output: 'standalone'`
- `backend/` — Go (`net/http` + `sqlx`) จัดแบบ hexagonal: `delivery/` → `usecase/` → `domain/` ← `repository/postgres`, `infrastructure/aiservice`
- `ai-service/` — FastAPI (Python 3.11) รวม scrape, translate, terminology, manga, review queue
- ทั้งสามอยู่ใน repo เดียวและรันพร้อมกันด้วย `docker-compose.yml`

## Evidence

`README.md` (Architecture, Tech Stack), `docker-compose.yml`, `backend/go.mod`, `backend/internal/` (โครงสร้าง layer), `ai-service/pyproject.toml`,
`frontend/package.json`, `frontend/next.config.ts`

## Consequences

- ดี: งาน AI แยก dependency หนัก (easyocr, playwright) ออกจาก API หลัก; Go backend มี test ระดับ route ที่ล็อกสิทธิ์ได้
- เสีย: deploy ต้องดูแลสาม runtime; วันนี้ production มีแค่ frontend (ดู `../16-deployment.md`)
- `ai-service/main.py` ใหญ่ ~3k บรรทัด (`ai-service/REFACTORING.md`)
- gRPC ถูกออกแบบไว้ (`backend/proto/bookreading.proto`) แต่ไม่ได้ start (`backend/cmd/main.go`)
