# 03 — User flows

Route จาก `frontend/src/app/**/page.tsx` (21 หน้า + `/build-info`) ภาพหน้าจอ/scene ของ reader และ reviewer มีอยู่แล้วใน central pack
[02-operator-storyboard.md](https://github.com/bookchaowalit/architecture-docs/blob/main/docs/architecture/flows/bookreading-ui/02-operator-storyboard.md) (reused)
ไฟล์นี้เพิ่ม flow ต่อ role ตามโค้ดปัจจุบัน

## Visitor → reader

`/app/*` ใช้ guard ฝั่ง client: `app/app/layout.tsx` ดู `localStorage.isLoggedIn` ถ้าไม่มี → `/login` (session จริงคือ cookie `auth_token` ที่ backend ตรวจ)

```mermaid
flowchart LR
    L["/ landing"] --> REG["/register"]
    L --> LOG["/login"]
    L --> INFO["/about, /contact, /privacy, /terms"]
    REG -->|"POST /api/auth/register sets auth_token cookie"| DASH["/app dashboard"]
    LOG -->|"POST /api/auth/login"| DASH
    DASH --> LIB["/app/library"]
    DASH --> CH["/app/chapters"]
    CH --> RD["/app/reader"]
    LIB --> RD
    RD -->|"Arrow keys: prev / next chapter"| RD
    RD -.->|"GAP: no caller of offlineStorage.saveChapter, offline page only reads existing entries"| OFF["/app/offline"]
    DASH --> MG["/app/manga: translate image or URL"]
    MG --> MR["/app/manga-reader"]
    DASH --> TERM["/app/terminology"]
    DASH --> SUBS["/app/subscriptions: novel auto-update"]
    DASH --> STATS["/app/stats"]
    DASH --> PLAN["/app/subscription: Stripe plan"]
    DASH --> SET["/app/settings: API keys"]
    DASH --> PROF["/app/profile"]
    PLAN -->|"checkout URL"| STRIPE["Stripe Checkout, external"]
    STRIPE -->|"success / cancel URL from FRONTEND_URL"| PLAN
```

Sources: `frontend/src/app/` (ทุก `page.tsx`), `frontend/src/app/app/layout.tsx`, `frontend/src/app/login/page.tsx`, `frontend/src/app/register/page.tsx`,
`frontend/src/lib/offline-storage.ts` (`BookReadingOfflineDB`), `frontend/src/app/app/subscription/page.tsx`, `backend/internal/delivery/http/payment_handler.go` (`frontendURL`)

## Reader: เปิดบทและแปล

```mermaid
flowchart TD
    A["Open /app/reader for a novel"] --> B{"Novel in backend DB?"}
    B -->|yes| C["GET /api/chapters, /api/chapters/by-number"]
    B -->|no| D["POST /api/ai/scrape chapter list"]
    C --> V0["Reader shows original text, viewMode = original"]
    D --> V0
    V0 --> V1["User picks Thai or side-by-side tab, or presses Translate: handleTranslate"]
    V1 --> E{"Chapter has original text?"}
    E -->|no| F["POST /api/ai/chapter fetch text"]
    E -->|yes| G{"GET /api/translations/cached has text?"}
    F --> G
    G -->|yes| H["Show cached Thai text"]
    G -->|no| Q{"User OpenAI or Gemini key in appSettings?"}
    Q -->|yes| I["POST /api/ai/translate/agentic"]
    Q -->|no| J["POST /api/ai/translate: Google"]
    I --> K{"isAdmin?"}
    J --> K
    K -->|yes| L["POST /api/chapters/translate with translated_text: shared save"]
    K -->|no| M["Keep translation in the page only"]
    H -.-> N["GAP: 30 s auto-save POST /api/reading-progress never fires, needs localStorage.userId which login never sets"]
    L -.-> N
    M -.-> N
```

Sources: `frontend/src/app/app/reader/page.tsx`, `frontend/src/lib/api.ts`, `frontend/src/components/ReadingProgressTracker.tsx`,
`frontend/src/hooks/useReadingProgress.ts`, `backend/internal/delivery/http/handler.go` (`TranslateChapter`)

## Admin: เพิ่มนิยายและ moderate

```mermaid
flowchart LR
    A1["/app/chapters or /app/reader: add novel from URL"] -->|"POST /api/novels, admin"| A2["Novel + chapters in Postgres"]
    A3["/admin/review"] -->|"GET /api/ai/review/pending, /stats"| A4["Pending list with grade"]
    A4 -->|"POST /api/ai/review/approve, edit, reject: admin"| A5["Item status changed"]
    A6["/app/subscriptions: check now"] -->|"POST /api/subscriptions/trigger-update, admin"| A7["Re-scrape all due subscriptions"]
```

Sources: `frontend/src/app/admin/review/page.tsx`, `frontend/src/hooks/useIsAdmin.ts`, `frontend/src/app/app/subscriptions/page.tsx`,
`backend/internal/delivery/http/server.go`, `backend/internal/delivery/http/ai_proxy_handler.go`, `docs/UPGRADE-PLAN.md` (pass 9–10)

## ช่องว่างที่เห็นจากโค้ด

- `/admin/review` อยู่นอก `app/app/layout.tsx` จึงไม่มี client guard; ข้อมูลยังถูกปิดด้วย session ที่ backend
- `new-api.ts` เรียก `GET /api/feedback/history` แต่ backend ไม่มี route นี้ (`server.go` มีแค่ `/api/feedback`, `/chapter`, `/quality-score`)
- ใน production ทุกลูกศรที่ไป `/api/*` ตอบ 502 วันนี้ (ไม่มี backend) — ดู [16-deployment.md](./16-deployment.md)

## Open questions

- `/app/offline` ใช้ได้จริงไหมเมื่อไม่มี service worker? ไม่พบไฟล์ service worker ใน `frontend/` (มีแค่ IndexedDB)
