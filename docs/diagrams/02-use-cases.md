# 02 — Use cases

Actor มาจากระดับสิทธิ์จริงในโค้ด: `routes_access_test.go` แบ่ง route เป็น public / authenticated / admin และ `users.role` มีค่า `user` หรือ `admin` (migration 009)
บวก actor ภายนอกสองตัว: Stripe (webhook ที่ลงลายเซ็น) และ scheduler ภายใน backend

```mermaid
flowchart LR
    Anon(["Anonymous visitor"])
    User(["Reader: role user"])
    Admin(["Admin: role admin"])
    Stripe(["Stripe webhook"])
    Sched(["Backend scheduler, 60 min"])

    subgraph Public["Public routes"]
        UC1["Register / login / logout"]
        UC2["Browse novels and chapters"]
        UC3["Read translation history / cache"]
        UC4["Manga metadata: health, sites, languages"]
    end

    subgraph Authed["Signed-in routes"]
        UC5["Manage library"]
        UC6["Manage own terminology"]
        UC7["Translate chapter via AI"]
        UC8["Scrape chapter text / translate manga via /api/ai"]
        UC9["Save reading progress, bookmarks"]
        UC10["Rate a translation"]
        UC11["Subscribe a novel for auto-update"]
        UC12["Save own OpenAI / Gemini key"]
        UC13["Checkout, billing portal, cancel plan"]
        UC14["View review queue pending + stats"]
        UC15["Profile: view, update, delete"]
    end

    subgraph AdminOnly["Admin routes"]
        UC16["Add novel by URL: POST /api/novels"]
        UC17["Overwrite chapter text"]
        UC18["Approve / edit / reject review item"]
        UC19["Trigger update for all subscriptions"]
    end

    subgraph System["System actors"]
        UC20["Apply subscription event"]
        UC21["Re-scrape due subscriptions"]
    end

    Anon --> UC1
    Anon --> UC2
    Anon --> UC3
    Anon --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12
    User --> UC13
    User --> UC14
    User --> UC15
    Admin --> UC16
    Admin --> UC17
    Admin --> UC18
    Admin --> UC19
    Admin -.->|"also every user use case"| UC5
    Stripe --> UC20
    Sched --> UC21
```

Sources: `backend/internal/delivery/http/server.go`, `backend/internal/delivery/http/ai_proxy_handler.go` (`aiProxyRoutes`, `public`/`admin` flags),
`backend/internal/delivery/http/routes_access_test.go`, `backend/internal/domain/model.go` (`RoleUser`, `RoleAdmin`),
`database/migrations/009_add_users_role.up.sql`, `backend/cmd/main.go`, `docs/API.md`

## หมายเหตุ

- admin ได้มาจาก `ADMIN_USER_IDS` ตอน startup (`BootstrapAdmins`) หรือ SQL `UPDATE` เท่านั้น ไม่มี UI ให้ตั้ง role (`server.go`, `docs/API.md`)
- UC14 (ดู queue) เป็น authenticated ไม่ใช่ admin — `docs/UPGRADE-PLAN.md` P1 ยังเปิดเป็นคำถามว่าจะทำเป็น admin-only หรือไม่
- frontend ซ่อนปุ่ม moderation จาก non-admin ด้วย `useIsAdmin` แต่ตัวบังคับจริงคือ backend (`frontend/src/hooks/useIsAdmin.ts`)
- gRPC `BookReadingService` มีใน proto แต่ `cmd/main.go` ไม่ได้ start จึงไม่นับเป็น use case (`backend/proto/bookreading.proto`, `backend/cmd/main.go`)

Central pack ที่เกี่ยวข้อง: [06-authz-decision.md](https://github.com/bookchaowalit/architecture-docs/blob/main/docs/architecture/flows/bookreading-ui/06-authz-decision.md)
(เขียนก่อนมี role — ข้อ "no `UserRole`-style enum" และ "/review/* ไม่มี auth" ไม่ตรงกับโค้ดปัจจุบันแล้ว)

## Open questions

- Team plan (Stripe `STRIPE_PRICE_TEAM`) มี actor "team member" หรือไม่? โค้ดไม่มีตาราง team/member ใด ๆ
