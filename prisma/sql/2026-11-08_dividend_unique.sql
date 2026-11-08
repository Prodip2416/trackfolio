-- One dividend per (user, stock, date) — matches the app-level duplicate check
-- in src/app/dividends/actions.ts (2026-11-08).
-- Run once in the Supabase SQL editor (dev/stage first). Single transaction:
-- aborts without changing anything if duplicates already exist.

BEGIN;

DO $$
DECLARE
  dup_rows int;
BEGIN
  SELECT count(*) INTO dup_rows FROM (
    SELECT 1 FROM public.dividends GROUP BY user_id, stock_id, date HAVING count(*) > 1
  ) d;

  IF dup_rows > 0 THEN
    RAISE EXCEPTION '% duplicate (user_id, stock_id, date) group(s) in dividends. List them with: SELECT user_id, stock_id, date, array_agg(id) FROM public.dividends GROUP BY 1,2,3 HAVING count(*) > 1;', dup_rows;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS dividends_user_stock_date_key
  ON public.dividends (user_id, stock_id, date);

COMMIT;
