-- Integrity constraints and indexes matching prisma/schema.prisma (2026-10-06).
-- Run once in the Supabase SQL editor. Runs in a single transaction and aborts
-- without changing anything if existing data violates the new constraints.

BEGIN;

-- 1. Pre-checks ---------------------------------------------------------------
DO $$
DECLARE
  null_rows int;
  dup_rows  int;
BEGIN
  SELECT
    (SELECT count(*) FROM public.dividends         WHERE user_id IS NULL) +
    (SELECT count(*) FROM public.stocks            WHERE user_id IS NULL) +
    (SELECT count(*) FROM public.transactions      WHERE user_id IS NULL) +
    (SELECT count(*) FROM public.watchlist         WHERE user_id IS NULL) +
    (SELECT count(*) FROM public.price_alerts      WHERE user_id IS NULL) +
    (SELECT count(*) FROM public.short_term_trades WHERE user_id IS NULL)
  INTO null_rows;

  IF null_rows > 0 THEN
    RAISE EXCEPTION '% row(s) have NULL user_id. Fix or delete them first.', null_rows;
  END IF;

  SELECT count(*) INTO dup_rows FROM (
    SELECT 1 FROM public.stocks GROUP BY user_id, symbol HAVING count(*) > 1
  ) d;

  IF dup_rows > 0 THEN
    RAISE EXCEPTION '% duplicate (user_id, symbol) group(s) in stocks. List them with: SELECT user_id, symbol, array_agg(id) FROM public.stocks GROUP BY 1,2 HAVING count(*) > 1;', dup_rows;
  END IF;
END $$;

-- 2. user_id is required everywhere --------------------------------------------
ALTER TABLE public.dividends         ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.stocks            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.transactions      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.watchlist         ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.price_alerts      ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.short_term_trades ALTER COLUMN user_id SET NOT NULL;

-- 3. One portfolio row per user and symbol --------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS stocks_user_id_symbol_key
  ON public.stocks (user_id, symbol);

-- 4. Lookup indexes (names follow Prisma's convention) ---------------------------
CREATE INDEX IF NOT EXISTS dividends_user_id_idx
  ON public.dividends (user_id);
CREATE INDEX IF NOT EXISTS dividends_stock_id_idx
  ON public.dividends (stock_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_transaction_date_idx
  ON public.transactions (user_id, transaction_date);
CREATE INDEX IF NOT EXISTS transactions_stock_id_idx
  ON public.transactions (stock_id);
CREATE INDEX IF NOT EXISTS short_term_trades_user_id_symbol_status_idx
  ON public.short_term_trades (user_id, symbol, status);
CREATE INDEX IF NOT EXISTS short_term_trade_legs_trade_id_idx
  ON public.short_term_trade_legs (trade_id);

COMMIT;
