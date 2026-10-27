# Genfuse

Next.js 14 (App Router) + TypeScript + Tailwind + Supabase + Gemini/GPT-4o + PayOS (VietQR).
Languages: vi, zh, en, es. Themes: elder, adult, and three youth themes. Installable on a phone (PWA).

> Genfuse was called "Gia Đình Số". Families already saved on a device keep working: the browser's old save is adopted automatically.

## 1. Supabase
1. Create a project. In **SQL Editor** run `supabase/schema.sql`. It is one file for everything: new project or upgrade of an
   existing one, and safe to run again. **If you are upgrading, run it again: it adds the exact usage counter (`rev`).**
2. Copy the project URL, anon key and **service_role** key.
3. Authentication > URL Configuration: Site URL = your real address (see HUONG_DAN.md).

## 2. Environment
Copy `.env.example` to `.env.local`. On Vercel add the same names under Project > Settings > Environment Variables.

| Name | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser (realtime only) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only. Never prefix with `NEXT_PUBLIC_` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` or `OPENAI_API_KEY` | AI decoder, chat and game hints |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | payments |
| `NEXT_PUBLIC_APP_URL` | optional: custom domain. Empty = the Vercel URL is detected |
| `NEXT_PUBLIC_PLAN_MONTHLY_VND`, `NEXT_PUBLIC_PLAN_YEARLY_VND` | plan prices (39,000 / 390,000) |
| `HEALTH_KEY` | optional but recommended once live: protects `/api/health` |

## 3. Run
```bash
npm install
npm run seed:genz      # optional: loads the Gen Z dictionary (safe to re-run)
npm run dev
npm run build          # run this before every deploy: it type-checks the whole app
```

## How it starts fast (what changed in v4)
- **One request** (`/api/bootstrap`) brings the family, members, tree counts, reminders and the first state of both shared games.
  Before, the home screen made three requests one after another.
- **Everything is in the first download.** Tabs, the chat, the drawers and the paywall are no longer fetched on a click.
  Tabs you open stay alive, so going back is instant.
- **The last visit is cached on the device** (family, members, tree, reminders), so the next visit paints everything at once and refreshes in the background.
- **Warm-up:** `/api/warm` is called the moment the page opens, so the server and the database are awake when you press a button.
- Creating or joining a family returns the whole family; there is no second request before you can enter.

## The usage counter (exact)
`families.usage_count` is spent by the SQL function `consume_usage` (atomic, row locked). Free families get 5 operations
(story save, AI decoder, AI hint, chat message, start of a game round, a wheel spin, a new reminder). The 6th answers HTTP 402 and opens the paywall.
If an AI call fails, the use is refunded, and the refund's new number is returned too.

Why it used to jump (3, then 5, then 4): a background refresh that was started earlier could land *after* a newer answer and
overwrite it with an old number. Now every change of a family row raises `rev` (a database trigger) and the browser keeps the
copy with the higher `rev`, whatever order the answers arrive in. Banner, paywall and the free-use check all read the same copy.
The pure rules are in `src/lib/entitlement.ts` and `src/lib/latest.ts` and are covered by `npm test`.

## PayOS webhook
In the PayOS dashboard set the webhook URL to `https://YOUR-DOMAIN/api/payos/webhook`. The handler verifies the HMAC signature,
marks the payment paid once, sets the PRO plan (renewals add time to the current expiry) and broadcasts to open browsers, so the paywall lifts without a reload.

## Troubleshooting
Open `/api/health` (add `?key=...` if you set `HEALTH_KEY`). It lists every missing variable and table with the fix next to it, and checks the exact usage counter.
`npm run dev` reads `.env.local` only. On Vercel, `NEXT_PUBLIC_*` values are fixed at build time: Redeploy after changing them.
