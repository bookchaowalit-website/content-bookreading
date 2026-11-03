# 05 — C4 Context

ระบบ BookReading มองจากภายนอก: ผู้ใช้สองระดับ (reader, admin) และระบบภายนอกที่โค้ดเรียกจริง

```mermaid
C4Context
    title BookReading - System Context
    Person(reader, "Reader", "Signed-in user, role user")
    Person(admin, "Admin", "role admin via ADMIN_USER_IDS")
    Person(visitor, "Visitor", "Anonymous")
    System(br, "BookReading", "Next.js frontend, Go backend, FastAPI ai-service, PostgreSQL")
    System_Ext(stripe, "Stripe", "Checkout, billing portal, subscription webhooks")
    System_Ext(openai, "OpenAI API", "Agentic, pipeline and manga translation")
    System_Ext(gemini, "Google Gemini API", "Optional LLM provider")
    System_Ext(gtrans, "Google Translate", "deep-translator and translatepy fallback")
    System_Ext(sources, "Novel and manga source sites", "piaotia, qidian, 69shu, webtoons, mangadex and others on the allow-list")
    System_Ext(sentry, "Sentry", "Frontend error events when NEXT_PUBLIC_SENTRY_DSN is set")
    Rel(visitor, br, "Reads landing pages, registers")
    Rel(reader, br, "Reads, translates, tracks progress, pays")
    Rel(admin, br, "Adds novels, saves chapter text, moderates reviews")
    Rel(br, stripe, "Creates checkout and portal sessions")
    Rel(stripe, br, "Signed webhooks")
    Rel(br, openai, "Chat completions")
    Rel(br, gemini, "generate content")
    Rel(br, gtrans, "Machine translation")
    Rel(br, sources, "HTTP GET through SSRF guard")
    Rel(br, sentry, "Error events, scrubbed")
```

Sources: `backend/internal/delivery/http/payment_handler.go` (stripe-go), `ai-service/agentic_translator.py` (`AsyncOpenAI`, `google.genai`, `GoogleTranslator`),
`ai-service/multi_agent_translator.py`, `ai-service/manga_translator.py`, `ai-service/main.py` (`translatepy`), `ai-service/url_safety.py`,
`ai-service/site_routing.py` (`SUPPORTED_MANGA_DOMAINS`), `frontend/src/lib/sentry.ts`, `backend/internal/domain/model.go` (roles)

## หมายเหตุ

- ผู้ใช้สามารถเก็บ OpenAI/Gemini key ของตัวเองที่ `/api/settings/api-keys` (ตาราง `user_api_keys`) — ใน `/translate/pipeline` มีช่อง `openai_api_key` จาก request
- ไม่พบ email provider, analytics หรือ OAuth provider ในโค้ด

## Open questions

- ใน production ไม่มี backend (ดู [16-deployment.md](./16-deployment.md)) ดังนั้นความสัมพันธ์กับ Stripe/OpenAI/source sites เป็นของ stack ที่รันด้วย `docker-compose.yml` เท่านั้นวันนี้
- Sentry DSN ถูกตั้งใน Vercel แล้วหรือยัง? `KPI-PLAN.md` (2026-10-22) เขียนว่า "DSN not set"
