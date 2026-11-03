# ADR-0003 — Session เป็น JWT ใน httpOnly cookie, สิทธิ์ admin อ่านจากแถว users

- Status: accepted (retro-documented)
- Date: 2026-11-03

## Decision

- Login/register ออก JWT HS256 อายุ 7 วัน (`golang-jwt/jwt/v5`, `JWT_SECRET` บังคับ) ใส่ cookie `auth_token`: `HttpOnly`, `SameSite=Lax`, `Secure` เมื่อ `NODE_ENV=production` หรือ `COOKIE_SECURE=true`
- `AuthMiddleware` รับ `Authorization: Bearer` ก่อน (ยกเว้น `null`/`undefined`) แล้ว fallback เป็น cookie
- password เก็บด้วย bcrypt
- `users.role` (`user` | `admin`, migration 009); `AdminMiddleware` อ่าน role จาก DB ทุก request (demote มีผลทันที)
- admin ถูก bootstrap ด้วย `ADMIN_USER_IDS` (UUID) ตอน startup; `ADMIN_EMAILS` ถูกเพิกเฉยเพราะ email ไม่ได้ verify
- ข้อมูลรายผู้ใช้ใช้ `sessionUserID`: `user_id` ใน query ที่ไม่ตรง session → 403

## Evidence

`backend/internal/delivery/http/handler.go` (`setAuthCookie`, `AuthMiddleware`, `AdminMiddleware`, `sessionUserID`), `backend/internal/usecase/user_usecase.go`,
`backend/internal/delivery/http/server_config.go` (`BootstrapAdmins`), `database/migrations/009_add_users_role.up.sql`, `docs/API.md`,
`backend/internal/delivery/http/routes_access_test.go`, `backend/internal/delivery/http/ownership_test.go`

## Consequences

- ดี: JS อ่าน cookie `auth_token` (HttpOnly) ไม่ได้; ทุก route ถูกล็อกระดับสิทธิ์ใน test
- เสีย: response ของ login/register ยังส่ง JWT ใน body (`AuthResponse.Token` `json:"token"` ใน `backend/internal/usecase/user_usecase.go`) — JS ฝั่ง browser อ่าน token ได้ ถ้ามี XSS ก็ขโมยได้; ควรตัด field นี้ออกถ้าใช้ cookie อย่างเดียว
- เสีย: ไม่มี revoke/refresh-token rotation (`/api/auth/refresh` ออก token ใหม่จาก token เดิม); ไม่มี email verification
- frontend guard `/app/*` ใช้ `localStorage.isLoggedIn` เป็นแค่ UI state
