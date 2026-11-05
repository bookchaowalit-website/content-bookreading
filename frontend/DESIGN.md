# Design: BookReading web app

This app follows the ADR-0007 design floor (WCAG 2.2 AA quality floor, version 1.0.0). The floor
check is `design-floor.json` in this folder; the reusable CI job runs it on every pull request.
A passing check is not a WCAG 2.2 AA conformance claim: the manual rows (contrast over images,
meaningful names, Latin passages inside Thai pages, states, keyboard operation) are signed off by hand.

## Tokens

Token names come from the vendored `src/styles/design-floor/tokens.css` (do not edit it). Values
are set in `src/styles/app-theme.css`.

| Token | Light | Dark (`data-theme="dark"`) |
|---|---|---|
| `--color-bg` | `#ffffff` | `#111827` |
| `--color-surface` | `#f9fafb` | `#1f2937` |
| `--color-fg` | `#111827` | `#ffffff` |
| `--color-fg-muted` | `#4b5563` | `#d1d5db` |
| `--color-accent` | `#2563eb` | `#60a5fa` |
| `--color-accent-fg` | `#ffffff` | `#111827` |
| `--color-border` | `#d1d5db` | `#4b5563` |
| `--color-focus` | `#2563eb` | `#60a5fa` |
| `--font-sans` | Inter (Latin), then Noto Sans Thai | same |
| `--leading-thai` / `--leading-thai-heading` | 1.7 / 1.35 | same |

**Dark mode: yes.** The toggle in `ThemeProvider` sets `data-theme` and the `dark` class on `<html>`.
Tailwind `dark:` variants respond to either. Existing components use Tailwind palette classes, so
the token values above describe the app; they do not restyle pages on their own.

Fonts load through `next/font` on `<html>`: Inter, Noto Sans Thai (default Thai face) and Sarabun
(only for the reader's own font choice). No runtime font CDN.

Tailwind is v3 (`tailwind.config.js`). The floor's `tailwind/v3.config.snippet.js` is merged for
colours and the `sans` family. Its `borderRadius` and `boxShadow` keys are not merged: they would
change every `rounded-lg` and `shadow-lg` on the site. Text sizes keep Tailwind's sizes and take
Thai line-heights from the tokens (body 1.7, headings 1.35).

## Routes covered by the floor check

`/`, `/about`, `/contact`, `/login`, `/register`, `/privacy`, `/terms`, and a 404 check at
`/no-such-page/`. Widths: 320, 375, 390, 768, 1440. The `/app/*` pages redirect to `/login` without
a local login flag, and `/admin/review` is for moderators (role-gated in the page). Neither is in the
public route list; they need a signed-in session to check.

## Waivers

None. Rules `contrast`, `skip-link`, `focus-visible`, `focus-not-obscured` and `keyboard-trap` cannot
be waived on this public app.
