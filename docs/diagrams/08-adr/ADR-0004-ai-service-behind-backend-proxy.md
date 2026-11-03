# ADR-0004 — Browser เรียก ai-service ผ่าน `/api/ai` ของ backend เท่านั้น

- Status: accepted (retro-documented)
- Date: 2026-11-03 (ตัดสินใน pass 7, 2026-10-01, commit `df0666d`)

## Context

เดิม frontend เรียก ai-service ตรงจาก browser (`NEXT_PUBLIC_AI_SERVICE_URL`) ทำให้ endpoint ที่ใช้ LLM และ scrape URL เปิดให้ทุกคน

## Decision

- backend เสิร์ฟ `/api/ai/<path>` หลัง `AuthMiddleware`; allow-list ตรงตัวใน `aiProxyRoutes` (+ `/terminology/{id}`), method check, ห้าม `%`, `//`, dot segments
- body cap 2 MiB (32 MiB สำหรับ manga image)
- forward ด้วย `Authorization: Bearer $AI_SERVICE_TOKEN`; ไม่ส่ง cookie/JWT ของผู้ใช้ต่อ; upstream 401/403 → 502
- ai-service ตรวจ token ทุก route ยกเว้น `PUBLIC_PATHS` และยังมี SSRF guard (`url_safety.safe_get`) ของตัวเอง
- `/review/approve|edit|reject` ต้อง admin; manga health/supported-* เป็น public
- compose publish ai-service บน loopback เท่านั้น

## Evidence

`backend/internal/delivery/http/ai_proxy_handler.go`, `backend/internal/infrastructure/aiservice/client.go` (`Forward`), `ai-service/service_auth.py`,
`ai-service/url_safety.py`, `docker-compose.yml`, `frontend/src/lib/api.ts` (`AI_PROXY_PATH`), `docs/UPGRADE-PLAN.md` (pass 5–8),
`backend/internal/delivery/http/ai_proxy_handler_test.go`

## Consequences

- ดี: `AI_SERVICE_TOKEN` อยู่ฝั่ง server เท่านั้น; มี test ว่า proxy ตัด session credential (cookie/Authorization) ของผู้ใช้ก่อนส่งต่อ
- เสีย: BYOK OpenAI/Gemini key ของผู้ใช้ **ไม่ได้** อยู่ฝั่ง server — `frontend/src/app/reader/page.tsx` อ่านจาก `localStorage.appSettings` และ `frontend/src/lib/api.ts` ส่งไปใน request body ถึง ai-service (ดู threat model G1)
- เสีย: `AI_SERVICE_TOKEN` ว่าง = ai-service เปิด (dev mode); ต้องตั้งใน prod (UPGRADE-PLAN P1)
- `/translate/pipeline` ไม่อยู่ใน allow-list จึงไม่มีทางป้อน review queue จากแอป
