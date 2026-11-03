# ADR-0006 — Billing ด้วย Stripe Checkout + webhook แบบ order-safe

- Status: accepted (retro-documented)
- Date: 2026-11-03

## Decision

- plan `pro` / `team` map ไป Stripe Price จาก `STRIPE_PRICE_PRO` / `STRIPE_PRICE_TEAM`; validate ตอน startup (fatal ถ้าตั้งไม่ครบ); ไม่ตั้ง = billing ปิด, checkout 503
- สถานะ subscription เก็บบนแถว `users` (`subscription_plan`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_event_at`)
- webhook `checkout.session.completed`, `customer.subscription.updated|deleted` ลงลายเซ็นด้วย `STRIPE_WEBHOOK_SECRET`; event เก่ากว่า `stripe_event_at` ถูกข้าม
- cancel = `CancelAtPeriodEnd` → `canceling`; จบรอบ → `canceled` + plan `free`

## Evidence

`backend/internal/delivery/http/payment_handler.go`, `backend/internal/delivery/http/billing_plans.go`, `database/migrations/007…008`,
`payment_ordering_test.go`, `payment_subscription_test.go`, `billing_plans_test.go`, `docs/UPGRADE-PLAN.md` (pass 1–4)

## Consequences

- ดี: webhook ซ้ำ/ผิดลำดับไม่ทำให้ re-activate
- เสีย: ไม่มี ledger/ตาราง payment แยก; ไม่มี quota ตาม plan (UPGRADE-PLAN P1); หน้า subscription hard-code ราคา
