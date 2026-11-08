-- Planner module: trade_plans + planner_notes (2026-11-08).
-- Matches prisma/schema.prisma. Run once in the Supabase SQL editor (DEV first).
-- Idempotent: safe to re-run.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_plan_status') THEN
    CREATE TYPE public.trade_plan_status AS ENUM ('IDEA', 'ACTIVE', 'EXECUTED', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.trade_plans (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  symbol         text NOT NULL REFERENCES public.dse_companies(symbol) ON DELETE RESTRICT ON UPDATE CASCADE,
  type           public.transaction_type NOT NULL,
  price          numeric NOT NULL CHECK (price > 0),
  quantity       numeric NOT NULL CHECK (quantity > 0),
  commission_pct numeric NOT NULL DEFAULT 0 CHECK (commission_pct >= 0 AND commission_pct < 100),
  stop_loss      numeric,
  target_price   numeric,
  reason         text,
  status         public.trade_plan_status NOT NULL DEFAULT 'IDEA',
  review_date    date,
  executed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trade_plans_user_id_status_idx ON public.trade_plans (user_id, status);

CREATE TABLE IF NOT EXISTS public.planner_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  symbol      text REFERENCES public.dse_companies(symbol) ON DELETE SET NULL ON UPDATE CASCADE,
  title       text NOT NULL,
  body        text,
  tags        text[] NOT NULL DEFAULT '{}',
  pinned      boolean NOT NULL DEFAULT false,
  review_date date,
  outcome     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS planner_notes_user_id_idx ON public.planner_notes (user_id);

-- App talks to Postgres through Prisma (server-side), not the Supabase client;
-- enable RLS with no policies so the anon/auth REST roles cannot read these tables.
ALTER TABLE public.trade_plans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_notes ENABLE ROW LEVEL SECURITY;

COMMIT;
