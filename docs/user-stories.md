# Openbell — User Stories

Oct 9, 2026 · @Halie Pearson

## Overview

This doc has 24 user stories across three pages: the landing page (8), favorited stocks (6) and the dashboard (10). They describe the app as built in the OpenBell repo. Each story has acceptance criteria that a tester can check by hand.

| Persona | Who they are | What they need |
| --- | --- | --- |
| Visitor | Someone who has not signed in yet | To understand the app quickly and get an account with little effort |
| Investor | A signed-in user who watches a few stocks | To see each stock's opening price and today's move, and to keep a short list of favorites |

Stories use the format *As a \[persona\], I want \[goal\], so that \[benefit\].* IDs start with **L** (landing), **F** (favorited) or **D** (dashboard).

## Landing page (sign up / log in)

The landing page is the only page a signed-out visitor can see. It lives at `/login` and `/signup`.

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| L1 | As a visitor, I want to see what Openbell does before I sign up, so that I can decide whether it's worth an account. | A brand panel shows the headline "Know the open before the bell," a one-sentence description and sample tickers with their opening prices. Under about 900px wide, the panel stacks above the form. |
| L2 | As a visitor, I want to create an account with my name, email and password, so that I can save stocks. | All three fields are required, and the password must be at least 8 characters. An email that is already registered is rejected, even with different capitalization. Errors show next to the field and keep the name and email I typed. Success signs me in and opens onboarding. |
| L3 | As an investor, I want to log in with my email and password, so that I can get back to my dashboard. | Correct details open `/dashboard`. A wrong email or a wrong password shows one message, "Incorrect email or password." A failed attempt never signs me in. |
| L4 | As a visitor, I want to switch between Log in and Sign up in one place, so that I don't have to hunt for the other form. | A two-tab control at the top of the form card switches modes. A link under the form does the same. |
| L5 | As a visitor, I want to land on the page I originally asked for after I log in, so that a shared link still works. | Opening `/search?q=NVDA` while signed out sends me to log in. After logging in, I arrive at `/search?q=NVDA`. Links to other websites are ignored. |
| L6 | As an investor, I want `/login` to skip ahead when I'm already signed in, so that I don't sign in twice. | A signed-in user who opens `/login` or `/signup` is sent to `/dashboard`. |
| L7 | As an investor, I want my account protected, so that no one can guess or read my password. | Passwords are stored only as argon2id hashes. After 5 login attempts in one minute from one IP, further attempts show "Too many attempts. Wait a minute and try again." |
| L8 | As an investor, I want to log out from any page, so that the next person on this computer can't use my account. | A Log out button is in the top bar of every signed-in page. Logging out ends the session on the server and returns me to `/login`. |

## Favorited stocks

Investors favorite a stock from its detail page on Search, or during onboarding. In the app, a favorite is called a "saved" stock.

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| F1 | As an investor, I want to favorite a stock from its detail page, so that I can follow it without searching again. | "Save to dashboard" changes to "✓ Saved" when tapped. The stock appears on my dashboard the next time it loads. |
| F2 | As an investor, I want to unfavorite a stock from its detail page, so that my list stays current. | Tapping "✓ Saved" again removes the stock, and the button changes back to "Save to dashboard". |
| F3 | As an investor, I want saving to be safe to repeat, so that a double-tap doesn't create duplicates. | Saving the same symbol twice leaves one entry. The database allows only one row per user and symbol. |
| F4 | As an investor, I want the detail page to show whether I've already saved a stock, so that I know where I stand. | Reopening a saved stock's detail page shows "✓ Saved". |
| F5 | As a new investor, I want to pick a few favorites during onboarding, so that my dashboard isn't empty on day one. | Step 2 shows 8 starter tiles (AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA, NFLX) with prices. Tapping a tile toggles it, and the count updates live ("3 selected"). Back keeps my picks. Finishing saves them. "Skip for now" saves nothing. Onboarding is shown only once. |
| F6 | As an investor, I want my favorites to be private, so that no one else can see or change them. | Each user sees only their own list. Signed-out requests get a 401. Save and remove requests from other websites are rejected with a 403. |

## Dashboard

The dashboard at `/dashboard` is the investor's home page. It shows every favorited stock as a card.

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| D1 | As an investor, I want to see all my favorites at a glance, so that I can check the market in seconds. | There is one card per saved stock, newest first. Each card shows the symbol, company name, intraday sparkline, current price, change in $ and %, and opening price. |
| D2 | As an investor, I want up and down moves to be clear without relying on color, so that I can read them at a glance. | Up moves use ▲ and blue. Down moves use ▼ and orange. Screen readers hear "Up" or "Down". |
| D3 | As an investor, I want visible feedback while prices load, so that the page never looks broken. | Skeleton cards show until prices arrive. All card prices load in one batched request. |
| D4 | As an investor, I want to remove a stock from a card and undo it, so that a mis-tap costs nothing. | The bookmark icon removes the card right away. A toast says "Removed NVDA" with an Undo button for 6 seconds. Undo puts the card back in the same spot. |
| D5 | As an investor, I want to open a stock's full details from its card, so that I can see the chart and stats. | "Details →" opens `/search?q=<symbol>`. |
| D6 | As a new investor with no favorites, I want to be told what to do next, so that I'm not stuck on a blank page. | With no saved stocks, the page shows "No saved stocks yet" and a Search stocks button. |
| D7 | As an investor, I want an obvious way to add a stock, so that growing my list is one click away. | An "+ Add stock" button in the header opens `/search`. |
| D8 | As an investor, I want a personal greeting, so that the page feels like mine. | The heading reads "Good morning / afternoon / evening, \<first name>", followed by how many stocks I'm watching. |
| D9 | As an investor, I want the other cards to keep working when one price fails, so that one problem doesn't hide everything. | A card whose price can't load shows "Price unavailable" or "Prices are busy, try again in a minute." The other cards load normally. |
| D10 | As an investor, I want to know when prices are samples rather than live, so that I don't act on fake numbers. | A "DEMO DATA" badge shows in the top bar whenever no market-data key is configured. |

## Test coverage

Automated tests cover 13 of the 24 stories. The other 11 need a manual check before the demo.

| Test file | Stories covered |
| --- | --- |
| `src/test/auth.test.ts` | L2, L3, L5, L8 |
| `src/test/access.test.ts` | L5 (redirect to log in), F6 (401 when signed out) |
| `src/test/saved.test.ts` | F1, F2, F3, F5, F6 (cross-site block), D1 (batched quotes) |
| `src/test/stocks.test.tsx` | Opening price on the detail page (supports F1, D5) |
| `e2e/full-flow.spec.ts` (desktop + phone) | L2, F1, F4, D1, D5, D6, L8 |

**Check by hand:** L1, L4, L6, L7 (rate limit), D2, D3, D4 (undo), D7, D8, D9, D10.

**Open items**

- [ ] Confirm D1 and D9 with live prices once `FINNHUB_API_KEY` is in `.env`
- [ ] Add `TWELVE_DATA_API_KEY` so dashboard sparklines show real intraday data instead of a simple open-to-now line
