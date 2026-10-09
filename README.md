# Openbell (stock-search)

Openbell is a web app for signed-in users. You search a stock symbol or company and see its **opening price**, current price, change, an intraday chart and key stats. You can save stocks to a personal dashboard.

Stack: Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Prisma 7 + PostgreSQL · argon2id · Finnhub (quotes/search) · Twelve Data (chart history) · Vitest · Playwright.

---

## Quick start (about 5 minutes)

**You need:** Node.js 20.19+ and **one** of these two databases:
- **Docker Desktop**, for a local Postgres
- a **Neon** Postgres database

```bash
npm install

# Option A: local Postgres in Docker (creates the dev and test databases)
docker compose up -d

# Option B: Neon. Copy .env.example to .env, then set DATABASE_URL (pooled) and DIRECT_URL (direct)

cp .env.example .env      # skip if .env already exists
npm run setup             # applies database migrations
npm run seed              # optional: demo login with 4 saved stocks
npm run dev
```

Open http://localhost:3000.

- To use the demo account, log in with **demo@openbell.dev** / **demo-password**.
- To make your own account, use **Sign up**.

### Demo data vs. live prices

With no API keys, the app runs on **built-in sample prices** for 16 well-known tickers: AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA, NFLX, AMD, INTC, JPM, V, DIS, KO, NKE and COST. The top bar shows a **DEMO DATA** badge so nobody mistakes them for real prices.

To get live market data, add your keys to `.env` and restart:

| Variable | What it enables | Get one |
|---|---|---|
| `FINNHUB_API_KEY` | Live search, quotes, company info, 52-week range | finnhub.io (free) |
| `TWELVE_DATA_API_KEY` | Price chart history and dashboard sparklines | twelvedata.com (free) |

- If Finnhub is set but Twelve Data isn't, everything works except the chart. The chart area explains what's missing, and dashboard sparklines draw a simple open→now line.
- To force demo data even when keys are set, use `STOCK_PROVIDER=mock`.

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run setup` | Apply migrations + generate Prisma client |
| `npm run seed` | Create/refresh the demo account |
| `npm test` | Unit + integration tests (needs the test DB) |
| `npm run test:e2e` | Playwright end-to-end, desktop + phone (builds first: run `npm run build`) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

### Running tests

- Tests use a **separate database**, `openbell_test`, which is set in `.env.test`.
- Tests always use the mock stock provider, so they never call the real APIs.
- Docker Compose creates the test database automatically. Apply its migrations once:

```bash
npm run db:test:migrate
npm test
npm run build && npx playwright install chromium && npm run test:e2e
```

If you use Neon, create a second database or branch for tests and put its URL in `.env.test`.

---

## How it maps to the handoff

| Handoff item | Where |
|---|---|
| Sign up / log in / log out | `src/app/(auth)/` (Server Actions), `src/app/logout/route.ts` |
| Signed-in-only access | `src/proxy.ts` (fast cookie check) and `requireUser()` in `src/lib/auth.ts` (real DB check plus onboarding redirect) |
| Search → opening price | `src/app/(app)/search/`: opening price in the callout, in the stats grid, and as a dashed line on the chart |
| Onboarding (8 starter tiles) | `src/app/onboarding/` |
| Dashboard (batched quotes, skeletons, undo) | `src/app/(app)/dashboard/` |
| JSON API | `src/app/api/*`: `/search`, `/quote/:s`, `/quotes`, `/candles/:s`, `/sparklines`, `/saved` |
| Stock providers, caching, errors | `src/lib/stocks/` (Finnhub, Twelve Data, mock; in-memory cache 30s quotes / 24h search; serves the last cached value on 429) |
| Data model | `prisma/schema.prisma`: `users`, `sessions`, `saved_stocks` |
| Tests 1–8 | `src/test/*.test.ts(x)` |
| Test 9 (end-to-end) | `e2e/full-flow.spec.ts` |

### Security notes

- **Passwords:** hashed with argon2id. A wrong email and a wrong password show the same error and take about the same time.
- **Sessions:** the cookie holds a random token, and the database stores only its SHA-256 hash. The cookie is httpOnly and SameSite=Lax, and is Secure in production. A session expires after 7 days without use.
- **CSRF:** Server Actions have Next's built-in origin check. `/logout` and `/api/saved` reject requests from other sites.
- **Rate limiting:** login allows 5 attempts per minute per IP (in memory).
- **API keys:** they stay on the server. The browser only calls `/api/*`.

### Differences from the handoff

- **Onboarding completion:** `POST /onboarding/complete` is a Server Action rather than a separate route.
- **Database driver:** uses `@prisma/adapter-pg` instead of `adapter-neon`. It works with Neon and with any plain Postgres, including the Docker one.
- **Version pins:** TypeScript stays on 5.x, the version Next 16 ships with, not 7.
- **Volume stat:** Finnhub's `/quote` has no volume, so this stat is summed from today's chart data. It shows "—" without Twelve Data.
