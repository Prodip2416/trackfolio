-- Prize Bond wins history (2026-11-25b). Draws are no longer stored: a result PDF is
-- only checked, and each WIN found is recorded here. ADDITIVE ONLY + idempotent.
-- (prize_bond_draws / prize_bond_winning_numbers / prize_bond_claims from
--  2026-11-25_prize_bond.sql are no longer used by the app; they are left untouched.)

BEGIN;

CREATE TABLE IF NOT EXISTS public.prize_bond_wins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- Kept as history even if the bond is deleted later (number/series/holder are snapshots).
  bond_id     uuid REFERENCES public.prize_bonds(id) ON DELETE SET NULL ON UPDATE CASCADE,
  number      char(7) NOT NULL CHECK (number ~ '^[0-9]{7}$' AND number <> '0000000' AND number <= '1000000'),
  series      text,
  holder      text,
  draw_no     integer NOT NULL CHECK (draw_no > 0),
  draw_date   date NOT NULL,
  rank        smallint NOT NULL CHECK (rank BETWEEN 1 AND 5),
  amount      numeric NOT NULL CHECK (amount > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Checking the same PDF again must not create duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS prize_bond_wins_user_bond_draw_key
  ON public.prize_bond_wins (user_id, number, (COALESCE(series, '')), draw_no);
CREATE INDEX IF NOT EXISTS prize_bond_wins_user_id_idx ON public.prize_bond_wins (user_id);

ALTER TABLE public.prize_bond_wins ENABLE ROW LEVEL SECURITY;

COMMIT;
