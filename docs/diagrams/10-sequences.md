# 10 — Sequences

สี่ request path ที่สำคัญที่สุด sequence เรื่อง reading-progress sync มีใน central pack
[03-system-sequence.md](https://github.com/bookchaowalit/architecture-docs/blob/main/docs/architecture/flows/bookreading-ui/03-system-sequence.md) (reused ส่วน progress;
ส่วน review ใน pack นั้นล้าสมัย — frontend ไม่เรียก ai-service ตรงแล้ว)

## 1. Login และ request ที่ต้อง session

```mermaid
sequenceDiagram
    actor U as Browser
    participant MW as Backend RateLimit + CORS
    participant H as Handler
    participant UC as UserUsecase
    participant DB as PostgreSQL

    Note over U,MW: axios client calls NEXT_PUBLIC_BACKEND_URL directly (absolute URL), not the Next.js /api rewrite
    U->>MW: POST {NEXT_PUBLIC_BACKEND_URL}/api/auth/login {email, password}
    MW->>MW: auth limiter 5 req/min per IP
    MW->>H: Login
    H->>UC: Login
    UC->>DB: SELECT user by email
    UC->>UC: bcrypt compare, sign HS256 JWT 7 days
    H-->>U: 200 + Set-Cookie auth_token HttpOnly SameSite=Lax
    U->>U: localStorage isLoggedIn, user
    U->>MW: GET {NEXT_PUBLIC_BACKEND_URL}/api/library (cookie, withCredentials)
    MW->>H: AuthMiddleware
    H->>UC: ValidateToken
    alt invalid or missing
        H-->>U: 401
    else valid
        H->>DB: user_library WHERE user_id = session user
        H-->>U: 200 data
    end
```

Sources: `backend/internal/delivery/http/server.go`, `backend/internal/delivery/http/handler.go` (`Login`, `setAuthCookie`, `AuthMiddleware`),
`backend/internal/usecase/user_usecase.go`, `backend/internal/middleware/rate_limit.go`, `frontend/src/app/login/page.tsx`, `frontend/src/lib/api.ts`, `frontend/src/lib/new-api.ts` (`NEXT_PUBLIC_BACKEND_URL`, default `http://localhost:8080`; Compose sets `http://localhost:8888`), `frontend/next.config.ts` (the `/api/*` rewrite to `BACKEND_URL` serves only same-origin relative calls)

### สองเส้นทางจาก browser ไป backend

```mermaid
flowchart LR
    B["Browser"] -->|"axios apiClient in lib/api.ts, lib/new-api.ts: auth, library, novels, chapters, progress, bookmarks, /api/ai/*"| D["Absolute NEXT_PUBLIC_BACKEND_URL, baked at build"]
    D --> BE["Go backend, cross-origin: CORS + withCredentials"]
    B -->|"raw fetch /api/...: settings api-keys, payments, reader save, update, add novel"| R["Same-origin Next.js rewrite"]
    R -->|"BACKEND_URL, default http://backend:8080"| BE
```

Sources: `frontend/src/lib/api.ts`, `frontend/src/lib/new-api.ts`, `frontend/next.config.ts` (`rewrites`), `frontend/src/app/app/settings/page.tsx`,
`frontend/src/app/app/subscription/page.tsx`, `frontend/src/app/app/reader/page.tsx`, `docker-compose.yml` (`NEXT_PUBLIC_BACKEND_URL: http://localhost:8888`, `BACKEND_URL: http://backend:8080`)

ใน production (ตรวจ 2026-11-03) JS bundle ของ `/login` ฝัง `http://localhost:8080` (ค่า default ใน `lib/api.ts`) — axios calls ทั้งหมดรวม login จึงยิงไป localhost ของผู้เข้าชม
ส่วน raw `fetch('/api/...')` ไป rewrite แล้วได้ 502 `DNS_HOSTNAME_NOT_FOUND` — แก้ rewrite อย่างเดียวไม่พอ ต้องตั้ง `NEXT_PUBLIC_BACKEND_URL` แล้ว build ใหม่ด้วย

## 2. Reader แปลบทผ่าน `/api/ai`

```mermaid
sequenceDiagram
    actor U as Reader page
    participant BE as backend AIProxyHandler
    participant AI as ai-service
    participant LLM as OpenAI or Gemini
    participant G as Google Translate

    Note over U,BE: axios aiClient = apiClient, absolute NEXT_PUBLIC_BACKEND_URL, not the rewrite
    U->>BE: GET /api/translations/cached?chapter_id
    BE-->>U: cached text or empty
    alt appSettings has openaiApiKey or geminiApiKey
        U->>BE: POST /api/ai/translate/agentic (cookie, user key in body)
        BE->>BE: allow-list, method, 2 MiB cap, AuthMiddleware
        BE->>AI: POST /translate/agentic, Bearer AI_SERVICE_TOKEN
        AI->>AI: require_service_token
        AI->>LLM: chat completion with terminology + context
        LLM-->>AI: Thai text
        AI-->>BE: translated_text, grade
        BE-->>U: 200
    else no user key
        U->>BE: POST /api/ai/translate
        BE->>AI: POST /translate, Bearer AI_SERVICE_TOKEN
        AI->>G: deep-translator
        AI-->>BE: translated_text
        BE-->>U: 200
    end
    opt isAdmin
        U->>BE: POST /api/chapters/translate?id with translated_text
        BE->>BE: requireAdmin, SaveTranslatedContent
    end
```

Sources: `frontend/src/app/app/reader/page.tsx`, `frontend/src/lib/api.ts`, `backend/internal/delivery/http/ai_proxy_handler.go`,
`backend/internal/infrastructure/aiservice/client.go`, `ai-service/service_auth.py`, `ai-service/main.py` (`/translate`, `/translate/agentic`),
`ai-service/agentic_translator.py`, `backend/internal/delivery/http/handler.go` (`TranslateChapter`)

หมายเหตุ: เลือก agentic หรือ Google จาก `localStorage.appSettings` (key ของผู้ใช้เอง) ไม่ใช่จากความล้มเหลว — key ถูกส่งใน body ผ่าน proxy (ดู [13-threat-model.md](./13-threat-model.md))

## 3. Stripe checkout และ webhook

```mermaid
sequenceDiagram
    actor U as /app/subscription
    participant BE as PaymentHandler
    participant S as Stripe
    participant DB as users row

    U->>BE: POST /api/payments/stripe/checkout {plan}
    BE->>BE: plan key to configured Price, 503 if billing off
    BE->>S: create Checkout Session, metadata plan
    S-->>BE: session URL
    BE-->>U: url
    U->>S: pay on Stripe page
    S->>BE: POST /api/payments/stripe/webhook checkout.session.completed
    BE->>BE: ConstructEvent with STRIPE_WEBHOOK_SECRET
    BE->>DB: GetByID, skip if older than stripe_event_at
    BE->>DB: plan, status active, stripe ids, stripe_event_at
    BE-->>S: 200, or 500 so Stripe retries
    S->>BE: customer.subscription.updated or deleted
    BE->>DB: GetByStripeSubscriptionID, map status
```

Sources: `backend/internal/delivery/http/payment_handler.go`, `backend/internal/delivery/http/billing_plans.go`, `frontend/src/app/app/subscription/page.tsx`,
`database/migrations/007_index_users_stripe_subscription.up.sql`, `database/migrations/008_add_users_stripe_event_at.up.sql`

## 4. Scheduler re-scrape นิยายที่ subscribe

```mermaid
sequenceDiagram
    participant SC as NovelUpdateScheduler
    participant UC as NovelUpdateUseCase
    participant DB as PostgreSQL
    participant NU as NovelUseCase
    participant AI as ai-service /scrape
    participant SRC as Source site

    SC->>UC: RunScheduledUpdates (on start, then every 60 min)
    UC->>DB: is_active and last_checked_at older than check_interval_hours
    loop each subscription
        UC->>DB: novel_update_history status checking
        UC->>NU: ScrapeNovel(source_url)
        NU->>AI: POST /scrape
        AI->>SRC: safe_get allow-listed host
        alt error
            UC->>DB: history status error + error_message
        else ok
            NU->>DB: save chapters
            UC->>DB: UpdateLastChecked, history success
        end
    end
```

Sources: `backend/cmd/main.go`, `backend/internal/scheduler/novel_update.go`, `backend/internal/usecase/novel_update_usecase.go`,
`backend/internal/usecase/novel_usecase.go`, `backend/internal/infrastructure/aiservice/client.go`, `ai-service/main.py` (`/scrape`), `ai-service/url_safety.py`

`GetDueForUpdate` เลือกเฉพาะ `is_active = true` และ `last_checked_at IS NULL OR last_checked_at < NOW() - check_interval_hours` (default 12 ชม.)
ดังนั้น tick ทุก 60 นาทีจะ scrape เรื่องเดิมซ้ำไม่บ่อยกว่า interval (`backend/internal/repository/postgres/novel_subscription_repo.go`)

## Open questions

- ไม่มี — ทุก path ข้างบนอ่านจากโค้ด; ไม่ได้รันจริงในรอบนี้ (production ไม่มี backend)
