-- Year-end prices for Yearly Return / CAGR (2026-11-25c). ADDITIVE ONLY + idempotent.
-- One row per symbol per year: the last known price of that year (Asia/Dhaka).
--   source = 'sync'   → written by the DSE price sync (overwritten on every sync of that year)
--   source = 'manual' → entered on /analytics/returns/prices for past years (never overwritten by sync)
-- Prices are market facts, so the table is global (not per user); updated_by is only an audit trail.

BEGIN;

CREATE TABLE IF NOT EXISTS public.year_end_prices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol      text NOT NULL REFERENCES public.dse_companies(symbol) ON UPDATE CASCADE,
  year        integer NOT NULL CHECK (year BETWEEN 1990 AND 2200),
  price       numeric NOT NULL CHECK (price > 0),
  price_date  date NOT NULL,
  source      text NOT NULL DEFAULT 'sync' CHECK (source IN ('sync', 'manual')),
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT year_end_prices_date_in_year CHECK (EXTRACT(YEAR FROM price_date)::integer = year)
);

CREATE UNIQUE INDEX IF NOT EXISTS year_end_prices_symbol_year_key ON public.year_end_prices (symbol, year);
CREATE INDEX IF NOT EXISTS year_end_prices_year_idx ON public.year_end_prices (year);

ALTER TABLE public.year_end_prices ENABLE ROW LEVEL SECURITY;

COMMIT;
