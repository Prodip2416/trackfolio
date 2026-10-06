import { revalidatePath } from 'next/cache'

/**
 * Holdings feed the dashboard, portfolio, ledger, reports, history and analytics,
 * so a transaction/dividend change invalidates every page under the root layout.
 */
export function revalidatePortfolioViews() {
  revalidatePath('/', 'layout')
}
