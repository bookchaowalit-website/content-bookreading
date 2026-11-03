# 06 — C4 Container

Container ตาม `docker-compose.yml` (local / self-host) และ production บน Vercel (frontend อย่างเดียว)

```mermaid
C4Container
    title BookReading - Containers
    Person(user, "Reader or Admin")
    System_Boundary(br, "BookReading") {
        Container(fe, "frontend", "Next.js 16, React 19", "Pages, /build-info, rewrite /api/* to BACKEND_URL for raw fetch. Port 3000")
        Container(be, "backend", "Go, net/http", "REST /api/*, JWT cookie auth, admin role, /api/ai proxy, Stripe, hourly scheduler. Port 8080, host 8888")
        Container(ai, "ai-service", "Python 3.11, FastAPI", "Scrape, translate, terminology, manga OCR, review queue. Port 8000, loopback")
        ContainerDb(db, "postgres", "PostgreSQL 15", "users, novels, chapters, progress, billing columns, review_queue")
        Container(bk, "backup", "postgres:15-alpine, profile backup", "pg_dump to ./backups")
        ContainerDb(idb, "Browser storage", "IndexedDB + localStorage", "Offline chapters, library cache, settings")
    }
    System_Ext(stripe, "Stripe")
    System_Ext(llm, "OpenAI, Gemini, Google Translate")
    System_Ext(src, "Source sites")
    System_Ext(sentry, "Sentry")
    Rel(user, fe, "HTTPS")
    Rel(fe, idb, "Reads and writes")
    Rel(fe, be, "raw fetch /api/* via rewrite")
    Rel(user, be, "axios direct to NEXT_PUBLIC_BACKEND_URL, cookie, CORS")
    Rel(be, db, "sqlx, lib/pq")
    Rel(be, ai, "HTTP, Bearer AI_SERVICE_TOKEN")
    Rel(ai, db, "asyncpg: review_queue and pipeline tables")
    Rel(ai, llm, "HTTPS")
    Rel(ai, src, "safe_get")
    Rel(be, stripe, "stripe-go")
    Rel(stripe, be, "POST /api/payments/stripe/webhook")
    Rel(fe, sentry, "Errors")
    Rel(bk, db, "pg_dump")
```

Sources: `docker-compose.yml`, `frontend/next.config.ts`, `frontend/Dockerfile`, `backend/Dockerfile`, `ai-service/Dockerfile`, `backend/cmd/main.go`,
`backend/internal/delivery/http/server.go`, `backend/internal/infrastructure/aiservice/client.go`, `ai-service/db_manager.py`, `ai-service/service_auth.py`,
`frontend/src/lib/offline-storage.ts`, `frontend/src/hooks/useLibrary.ts`, `frontend/src/lib/sentry.ts`

## หมายเหตุ

- gRPC (`:9090`, host `127.0.0.1:9091`) ถูก publish ใน compose แต่ `cmd/main.go` ไม่ start gRPC server (ไม่มี generated stubs, `backend/internal/delivery/grpc/pb/pb.go` เป็น stub) จึงไม่วาดเป็น container
- compose healthcheck ของ backend เรียก `http://localhost:8080/health` แต่ route จริงคือ `/api/health` (`server.go`) — healthcheck นี้น่าจะ fail เสมอ
- ai-service เก็บ review queue และ translation cache ใน memory ด้วย (`multi_agent_translator.review_queue`, `translation_cache.py`) — หายเมื่อ restart

## Open questions

- production host ของ backend / ai-service / postgres (ไม่มีใน repo; Vercel rewrite ชี้ `http://backend:8080` ที่ resolve ไม่ได้)
