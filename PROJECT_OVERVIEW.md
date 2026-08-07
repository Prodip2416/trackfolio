# TrackFolio — Project Overview

📈 **Personal Stock Portfolio Tracker (SaaS-style, single-user focused)**

---

## 📋 Final Requirements

### 1. Authentication & Multi-tenancy

- **Signup/login**: Email + Password (via Supabase Auth)
- **Data isolation**: Complete per-user isolation — enforced at Database level via **Row Level Security (RLS)**
- **No backdoor**: No superuser / admin role, no backdoor access for anyone
- **User profile**: Full name, email, phone number, address, avatar image
  - Avatar URL stored as text (image via Supabase Storage — no external S3 needed)

---

### 2. Stock / Company Reference

- Users add their own tracked stocks
- Fields: `symbol`, `company_name`, `sector` (optional)
- **Fully user-scoped** (one user cannot see another's stocks)

---

### 3. Buy Transactions

| Field | Required? |
|---|---|
| Stock | ✅ |
| Quantity | ✅ |
| Price / unit | ✅ |
| Date | ✅ |
| Brokerage fee | Optional |
| Note | Optional |

- **Edit / Delete** supported

---

### 4. Sell Transactions

| Field | Required? |
|---|---|
| Stock | ✅ |
| Quantity | ✅ |
| Price / unit | ✅ |
| Date | ✅ |
| Brokerage fee | Optional |
| Note | Optional |

- **Edit / Delete** supported
- **Partial sell** supported (any qty)
- **Realized gain/loss** auto-calculated per sell transaction (against avg cost basis at that time)

---

### 5. Holdings & Portfolio Tracking

#### Per Stock (auto-calculated)
- **Current holding quantity** = `SUM(BUY qty) − SUM(SELL qty) + SUM(BONUS bonus_quantity)`
- **Average buy price (cost basis)** = `Total cost basis ÷ current holding qty`
  - Bonus share: total cost **same**, qty **increases** → avg price **auto decreases**
- **Manual current price field** per stock (user updates)
- **Current value** = `current_price × holding_qty`
- **Unrealized gain/loss (%)** from cost basis

#### Portfolio-wide Summary
- Total invested
- Current value
- Unrealized gain/loss
- Realized gain/loss

---

### 6. Dividend Tracking

Two types — single table:

| Type | Fields |
|---|---|
| **Cash Dividend** | year, % or flat cash amount, date |
| **Bonus / Stock Dividend** | year, %, date → bonus share qty auto-calculated from holding |

- Bonus share auto-adjusts **holding quantity** + recalculates **avg buy price** (total cost stays same)
- Dividend history per stock
- **Dividend yield** = `dividend received ÷ cost basis`

---

### 7. Performance Metrics

- **CAGR** — per stock & portfolio-wide
- **Realized vs Unrealized return** breakdown
- **Overall return %**

---

### 8. Transaction History / Audit Trail

- Chronological timeline **per stock**: BUY → SELL → DIVIDEND → BONUS events

---

### 9. Dashboard

#### Building Now
- Holdings table
- Gain / loss summary
- Dividend summary

#### Future (Not building now)
- Sector allocation chart
- Performance-over-time chart
- Dividend income chart

---

### 10. Non-functional

- ✅ Secure multi-tenant architecture from day 1
- ✅ **No external stock-price API** — fully manual price entry
- ✅ Tech stack: Next.js (FE + BE) + Supabase (DB + Auth)
- ✅ Free-tier hosting target: **Vercel** (app) + **Supabase** (DB/Auth)

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Frontend | **Next.js (App Router)** + TypeScript |
| Backend | Next.js **Server Actions** / Route Handlers (same app — no separate BE needed) |
| Styling | **Tailwind CSS** |
| Icons | **Lucide React** — beautiful, consistent icon set |
| Charts | **Recharts** — composable React chart library |
| Database | **Supabase** (PostgreSQL) |
| Auth | **Supabase Auth** (email + password) |
| Security | **Supabase Row Level Security (RLS)** — isolation enforced at DB level |
| ORM / Query | Supabase JS client (Drizzle / Prisma optional — discuss later) |
| Forms | **React Hook Form** + **Zod** (validation) |

---

## 🌐 Hosting (Free Tier)

| Component | Where |
|---|---|
| Frontend + Backend (Next.js full app) | **Vercel** (free tier) — GitHub auto-deploy |
| Database + Auth | **Supabase** (free tier) — 500MB DB, 50k MAU (enough for solo use) |

### Deploy Flow
```
GitHub repo → Vercel connect → git push → auto build + deploy
```

Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) set via Vercel dashboard.

### ⚠️ Reminder
**Supabase free project auto-pauses after 7 days of inactivity.**
- Regular use → no issue
- Mitigation: GitHub Actions cron for auto-ping (optional, later)

---

## 🗄️ Database Schema

### 1. `profiles` — User Profile

| Field | Type | Note |
|---|---|---|
| `id` | UUID (PK) | = `auth.users.id` (Supabase Auth creates user) |
| `full_name` | text | |
| `email` | text | |
| `phone` | text (nullable) | Contact number |
| `address` | text (nullable) | Full address |
| `avatar_url` | text (nullable) | Avatar image URL (stored via Supabase Storage — no external S3) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### 2. `stocks` — User's Personal Stock List

| Field | Type | Note |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → `profiles.id`) | Owner |
| `symbol` | text | e.g. `RENATA` |
| `company_name` | text | |
| `sector` | text (nullable) | Optional |
| `face_value` | numeric | Default = 10 (BD market standard, for cash dividend % calc) |
| `current_price` | numeric (nullable) | Manually updated by user |
| `current_price_updated_at` | timestamp (nullable) | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Relation**: `profiles (1) ──< stocks (N)`

---

### 3. `transactions` — Buy + Sell

Single table — `type` enum differentiates BUY/SELL.

| Field | Type | Note |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → `profiles.id`) | Owner (redundant but required for RLS policies) |
| `stock_id` | UUID (FK → `stocks.id`) | |
| `type` | enum (`BUY`, `SELL`) | |
| `quantity` | numeric | |
| `price_per_unit` | numeric | |
| `transaction_date` | date | |
| `brokerage_fee` | numeric (nullable) | |
| `note` | text (nullable) | |
| `created_at` | timestamp | |

**Relation**: `stocks (1) ──< transactions (N)`

---

### 4. `dividends` — Cash + Bonus

Single table — `type` enum differentiates CASH/BONUS.

| Field | Type | Note |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → `profiles.id`) | Owner |
| `stock_id` | UUID (FK → `stocks.id`) | |
| `type` | enum (`CASH`, `BONUS`) | |
| `year` | int | |
| `percentage` | numeric (nullable) | e.g. `10` = 10% |
| `cash_amount` | numeric (nullable) | CASH type if flat amount (not %) |
| `bonus_quantity` | numeric (nullable) | Shares received (calc: % × holding at declaration time) |
| `date` | date | |
| `note` | text (nullable) | |
| `created_at` | timestamp | |

**Relation**: `stocks (1) ──< dividends (N)`

---

## 🔗 Relationship Summary

```
profiles (1)
    │
    └── stocks (N)
            │
            ├── transactions (N)  [BUY / SELL]
            │
            └── dividends (N)     [CASH / BONUS]
```

---

## 🧮 Derived / Computed Data (on-read, NOT stored)

These are calculated via view / query — never stored (avoids stale data):

| Metric | Formula |
|---|---|
| **Current holding qty** | `SUM(BUY qty) − SUM(SELL qty) + SUM(BONUS bonus_quantity)` |
| **Avg buy price** | `Total cost basis ÷ current holding qty` *(bonus: cost same, qty ↑, avg ↓)* |
| **Unrealized G/L** | `(current_price × holding_qty) − cost_basis` |
| **Realized G/L (per SELL)** | `(sell_price − avg_cost_at_that_time) × sold_qty` |
| **CAGR** | From transaction dates + current value |
| **Cash dividend (when %)** | `face_value × (percentage ÷ 100) × holding_qty_at_declaration` *(or flat cash_amount)* |
| **Bonus quantity** | `holding_qty_at_declaration × (percentage ÷ 100)` |
| **Dividend yield** | `total_dividend_received ÷ cost_basis` |

---

## 🔒 Security — Row Level Security (RLS)

### Policy on EVERY table (`profiles`, `stocks`, `transactions`, `dividends`):

```sql
-- Enable RLS on ALL tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

-- ============ profiles ============
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============ stocks ============
CREATE POLICY "Users can read own stocks"
  ON stocks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own stocks"
  ON stocks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stocks"
  ON stocks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own stocks"
  ON stocks FOR DELETE
  USING (user_id = auth.uid());

-- ============ transactions ============
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (user_id = auth.uid());

-- ============ dividends ============
CREATE POLICY "Users can read own dividends"
  ON dividends FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own dividends"
  ON dividends FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own dividends"
  ON dividends FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own dividends"
  ON dividends FOR DELETE
  USING (user_id = auth.uid());
```

### Triggers (Implementation Checklist)

```sql
-- Trigger 1: Auto-create profile row when Supabase Auth signs up a new user
-- (Trigger function on auth.users AFTER INSERT → inserts into public.profiles)

-- Trigger 2: Auto-set updated_at timestamp on profiles / stocks update
```

### Foreign Key ON DELETE Behavior

```sql
-- Recommendation: ON DELETE CASCADE for user-owned children
-- stock_id FK → ON DELETE CASCADE (stock deleted → all its txns + dividends auto-deleted)
-- user_id FK  → ON DELETE CASCADE (rare, but profile deleted → all data wiped)
```

> **Why DB-level RLS?** Even if a bug exists in app code, user data **cannot** leak — isolation enforced by PostgreSQL itself.

---

## 📁 Project Structure

```
TrackFolio/
├── src/
│   ├── app/                     # Next.js App Router routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # Reusable UI components
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts        # Browser Supabase client
│   │       ├── server.ts        # Server/SSR Supabase client
│   │       └── middleware.ts    # Session refresh + auth guard
│   ├── types/
│   │   └── database.ts          # TypeScript DB types
│   └── middleware.ts            # Next.js middleware (auth routing)
├── .env.local                   # Supabase URL + anon key
├── package.json
├── tsconfig.json
└── tailwind + eslint configs
```
