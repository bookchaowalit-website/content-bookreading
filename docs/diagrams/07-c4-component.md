# 07 — C4 Component

## Backend (Go, hexagonal: delivery → usecase → domain ← repository)

```mermaid
C4Component
    title Backend - Components
    Container_Boundary(be, "backend") {
        Component(mw, "middleware", "rate_limit.go, logging.go", "100 / 10 / 5 req per min per IP, TRUSTED_PROXIES")
        Component(cors, "corsMiddleware", "server.go", "ALLOWED_ORIGINS, security headers")
        Component(auth, "AuthMiddleware, AdminMiddleware", "handler.go", "Bearer or auth_token cookie, role from users row")
        Component(h, "Handler", "handler.go, reading_feedback_handler.go, subscription_handler.go, api_key_handler.go", "Auth, library, terminology, novels, chapters, progress, bookmarks, feedback, keys")
        Component(pay, "PaymentHandler", "payment_handler.go, billing_plans.go", "Checkout, portal, cancel, webhook")
        Component(proxy, "AIProxyHandler", "ai_proxy_handler.go", "/api/ai allow-list, body caps")
        Component(uc, "Usecases", "internal/usecase", "User, Novel, Chapter, NovelUpdate, ReadingProgress, Bookmark, TranslationFeedback, APIKey")
        Component(sched, "NovelUpdateScheduler", "internal/scheduler", "Every 60 min RunScheduledUpdates")
        Component(repo, "Postgres repositories", "internal/repository/postgres", "13 repositories over sqlx")
        Component(aic, "aiservice client", "internal/infrastructure/aiservice", "postJSON, Forward, 5 min timeout, AI_SERVICE_TOKEN")
        Component(cr, "crypto", "internal/crypto/apikeys.go", "Encrypts user API keys")
        Component(grpc, "gRPC server", "internal/delivery/grpc", "Built only with generated_grpc tag, not started")
    }
    ContainerDb(db, "PostgreSQL")
    Container(ai, "ai-service")
    System_Ext(stripe, "Stripe")
    Rel(mw, cors, "wraps")
    Rel(cors, h, "routes")
    Rel(h, auth, "protected routes")
    Rel(h, uc, "calls")
    Rel(pay, repo, "UserRepository")
    Rel(pay, stripe, "stripe-go")
    Rel(proxy, aic, "Forward")
    Rel(uc, repo, "ports")
    Rel(uc, aic, "Scrape, Translate, ExtractTerminology")
    Rel(uc, cr, "encrypt / decrypt")
    Rel(sched, uc, "NovelUpdateUseCase")
    Rel(repo, db, "SQL")
    Rel(aic, ai, "HTTP")
```

Sources: `backend/internal/delivery/http/server.go`, `backend/internal/delivery/http/handler.go`, `backend/internal/delivery/http/ai_proxy_handler.go`,
`backend/internal/delivery/http/payment_handler.go`, `backend/internal/delivery/http/billing_plans.go`, `backend/internal/middleware/rate_limit.go`,
`backend/internal/usecase/*.go`, `backend/internal/repository/postgres/*.go`, `backend/internal/infrastructure/aiservice/client.go`,
`backend/internal/scheduler/novel_update.go`, `backend/internal/crypto/apikeys.go`, `backend/internal/delivery/grpc/server.go`

## ai-service (FastAPI, `main.py` ~3k บรรทัด)

```mermaid
C4Component
    title ai-service - Components
    Container_Boundary(ai, "ai-service") {
        Component(sa, "require_service_token", "service_auth.py", "App-wide dependency, PUBLIC_PATHS open")
        Component(routes, "Route handlers", "main.py", "/scrape, /chapter, /translate*, /terminology*, /context/*, /manga/*, /review/*")
        Component(scr, "Scrapers", "scrapers.py, korean_scraper.py, site_routing.py", "Parser chosen by URL host")
        Component(safe, "url_safety.safe_get", "url_safety.py", "Host allow-list, IP checks, pinned connect, 5 MB cap")
        Component(agt, "AgenticTranslator", "agentic_translator.py", "OpenAI or Gemini, terminology, context")
        Component(pipe, "TranslationPipeline + review_queue", "multi_agent_translator.py", "4 agents, grade A-D, in-memory queue")
        Component(manga, "MangaTranslationPipeline", "manga_translator.py", "EasyOCR + LLM, image render")
        Component(term, "Terminology + name protect", "terminology.py, name_protect.py, glossary_loader.py", "KNOWN_TERMINOLOGY, glossaries CSV")
        Component(cache, "translation_cache", "translation_cache.py", "In-memory, 10k items, 30 day TTL")
        Component(dbm, "DatabaseManager", "db_manager.py", "asyncpg pool")
    }
    ContainerDb(db, "PostgreSQL")
    System_Ext(llm, "OpenAI, Gemini, Google Translate")
    System_Ext(src, "Source sites")
    Rel(sa, routes, "guards")
    Rel(routes, scr, "scrape")
    Rel(scr, safe, "fetch")
    Rel(safe, src, "HTTPS")
    Rel(routes, agt, "/translate/agentic")
    Rel(routes, pipe, "/translate/pipeline, /review/*")
    Rel(routes, manga, "/manga/*")
    Rel(agt, term, "uses")
    Rel(routes, cache, "get / set")
    Rel(agt, llm, "API")
    Rel(pipe, llm, "API")
    Rel(manga, llm, "API")
    Rel(pipe, dbm, "review_queue rows")
    Rel(dbm, db, "SQL")
```

Sources: `ai-service/main.py`, `ai-service/service_auth.py`, `ai-service/url_safety.py`, `ai-service/site_routing.py`, `ai-service/scrapers.py`,
`ai-service/korean_scraper.py`, `ai-service/agentic_translator.py`, `ai-service/multi_agent_translator.py`, `ai-service/manga_translator.py`,
`ai-service/terminology.py`, `ai-service/name_protect.py`, `ai-service/glossary_loader.py`, `ai-service/translation_cache.py`, `ai-service/db_manager.py`

## Frontend components (โดยย่อ)

`src/lib/api.ts` + `src/lib/new-api.ts` (axios client, `/api/ai` path), hooks (`useReadingProgress`, `useLibrary`, `useSubscriptions`, `useTranslationFeedback`, `useIsAdmin`),
providers (`ThemeProvider`, `ToastProvider`), `components/AppShell.tsx` และ `lib/offline-storage.ts`, `lib/epub-generator.ts`, `lib/sentry.ts`
ไม่วาดเป็น C4 แยกเพราะเป็น client-side ล้วน

Sources: `frontend/src/lib/`, `frontend/src/hooks/`, `frontend/src/providers/`, `frontend/src/components/`

## Open questions

- `REFACTORING.md` ใน ai-service เสนอแยก `main.py`; ยังไม่ทำ — owner ต้องการแยกไหม
