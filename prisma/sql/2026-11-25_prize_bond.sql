-- Prize Bond module (2026-11-25): the user's bonds.
-- Matches prisma/schema.prisma. ADDITIVE ONLY + idempotent: safe to re-run.
-- Run order: this file, then 2026-11-25b_prize_bond_wins.sql.
--
-- Note: an earlier draft of this file also created prize_bond_draws,
-- prize_bond_winning_numbers and prize_bond_claims. Those are no longer used
-- (draws are never stored) and were only ever created on the dev/dummy DB.

BEGIN;

-- number = 7 digits with leading zeros (0000001..1000000).
-- series is optional (Bangla letters, e.g. 'কখ'); a winning number applies to every series.
CREATE TABLE IF NOT EXISTS public.prize_bonds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  number        char(7) NOT NULL CHECK (number ~ '^[0-9]{7}$' AND number <> '0000000' AND number <= '1000000'),
  series        text,
  holder        text,
  purchase_date date,
  encashed_on   date,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Same number in two different series = two different bonds; NULL series counts as one value.
CREATE UNIQUE INDEX IF NOT EXISTS prize_bonds_user_number_series_key
  ON public.prize_bonds (user_id, number, (COALESCE(series, '')));
CREATE INDEX IF NOT EXISTS prize_bonds_number_idx ON public.prize_bonds (number);

-- App talks to Postgres through Prisma (server-side), not the Supabase client;
-- enable RLS with no policies so the anon/auth REST roles cannot read this table.
ALTER TABLE public.prize_bonds ENABLE ROW LEVEL SECURITY;

COMMIT;
