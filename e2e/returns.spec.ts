import { expect, test, type Page } from '@playwright/test'

/**
 * Yearly Return + Year-end Prices against the dev server + dev DB.
 * Read-only on purpose: year-end prices are shared by all users, so the test never saves one
 * (it only checks that an invalid price is rejected by the server without writing).
 */

test.describe.configure({ mode: 'serial' })

async function setLocale(page: Page, locale: 'en' | 'bn') {
  const url = new URL(process.env.E2E_BASE_URL ?? 'http://localhost:3000/trackfolio/').origin
  await page.context().addCookies([{ name: 'NEXT_LOCALE', value: locale, url }])
}

const currentYear = () => Number(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }).slice(0, 4))

test.beforeEach(async ({ page }) => {
  await setLocale(page, 'en')
})

test('menu: Analytics → Yearly Return opens the page', async ({ page }) => {
  await page.goto('analytics/performance')
  const link = page.getByRole('link', { name: 'Yearly Return', exact: true }).first()
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(/\/analytics\/returns$/)
  await expect(page.getByTestId('returns-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Yearly Return' })).toBeVisible()
})

test('all time: CAGR, chart and a year-by-year table that matches each year view', async ({ page }) => {
  await page.goto('analytics/returns')
  if (await page.getByTestId('returns-empty').isVisible()) test.skip(true, 'E2E user has no transactions')

  await expect(page.getByTestId('returns-year-all')).toHaveAttribute('aria-current', 'page')
  await expect(page.getByTestId('returns-cagr')).toBeVisible()
  await expect(page.getByTestId('returns-years-table')).toBeVisible()

  // running year is labelled YTD
  const y = currentYear()
  await expect(page.getByTestId(`returns-year-${y}`)).toContainText('YTD')

  // every year in the table shows the same return as its own year view
  const rows = page.locator('[data-testid^="returns-row-"]')
  const count = await rows.count()
  expect(count).toBeGreaterThan(0)
  const expected: Record<string, string> = {}
  for (let i = 0; i < count; i++) {
    const id = (await rows.nth(i).getAttribute('data-testid'))!.replace('returns-row-', '')
    expected[id] = (await rows.nth(i).locator('td').last().innerText()).trim()
  }
  await expect(page.getByTestId('returns-chart').or(page.getByTestId('returns-chart-empty'))).toBeVisible()

  for (const [year, text] of Object.entries(expected)) {
    await page.getByTestId(`returns-year-${year}`).click()
    await expect(page).toHaveURL(new RegExp(`year=${year}$`))
    await expect(page.getByTestId(`returns-year-${year}`)).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('returns-year-return-value')).toHaveText(text)
  }
})

test('year view: per-stock gains add up to the Total Gain card', async ({ page }) => {
  await page.goto(`analytics/returns?year=${currentYear()}`)
  if (await page.getByTestId('returns-empty').isVisible()) test.skip(true, 'E2E user has no transactions')
  await expect(page.getByTestId('returns-year-return')).toBeVisible()
  await expect(page.getByTestId('returns-year-return')).toContainText(`${currentYear() - 1}`) // period starts 31 Dec last year
  const gainText = await page.getByTestId('returns-gain-value').innerText()
  test.skip(gainText.trim() === '—', 'a price is missing for this year')
  const stockTable = page.getByTestId('returns-stock-table')
  await expect(stockTable).toBeVisible()

  // sum of the per-stock Gain column = Total Gain card
  const parse = (s: string) => {
    const v = Number(s.replace(/[৳,+\s]/g, '').replace('−', '-'))
    return Number.isFinite(v) ? v : 0
  }
  const cells = await stockTable.locator('tbody tr td:last-child').allInnerTexts()
  const sum = cells.reduce((a, c) => a + parse(c), 0)
  expect(Math.abs(sum - parse(gainText))).toBeLessThanOrEqual(cells.length) // rounding to whole taka
})

test('unknown ?year falls back to All time', async ({ page }) => {
  await page.goto('analytics/returns?year=1800')
  await expect(page.getByTestId('returns-page')).toBeVisible()
  if (await page.getByTestId('returns-empty').isVisible()) return
  await expect(page.getByTestId('returns-year-all')).toHaveAttribute('aria-current', 'page')
})

test('Bangla: titles and Bangla digits', async ({ page }) => {
  await setLocale(page, 'bn')
  await page.goto('analytics/returns')
  await expect(page.getByRole('heading', { name: 'বার্ষিক রিটার্ন' })).toBeVisible()
  if (await page.getByTestId('returns-empty').isVisible()) return
  await expect(page.getByTestId('returns-year-all')).toHaveText('সব সময়')
  await expect(page.getByTestId('returns-years')).toContainText(/[০-৯]{4}/)
})

test('year-end prices: opens from Yearly Return, breadcrumb, year pills, statuses', async ({ page }) => {
  await page.goto('analytics/returns')
  await page.getByTestId('returns-prices-link').click()
  await expect(page).toHaveURL(/\/analytics\/returns\/prices/)
  await expect(page.getByTestId('prices-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Year-end Prices' })).toBeVisible()

  if (await page.getByTestId('prices-no-years').isVisible()) return
  // only finished years are offered
  await expect(page.getByTestId(`prices-year-${currentYear()}`)).toHaveCount(0)

  const table = page.getByTestId('prices-table')
  if (!(await table.isVisible())) return
  const statuses = await page.locator('[data-testid^="prices-status-"]').allInnerTexts()
  for (const s of statuses) expect(['Missing', 'Stale', 'OK']).toContain(s.trim())

  // "Missing only" hides OK rows
  await page.getByTestId('prices-missing-only').check()
  const after = await page.locator('[data-testid^="prices-status-"]').allInnerTexts()
  expect(after.every(s => s.trim() !== 'OK')).toBe(true)
})

test('year-end prices: an invalid price is rejected by the server (nothing saved)', async ({ page }) => {
  await page.goto('analytics/returns/prices')
  if (!(await page.getByTestId('prices-table').isVisible())) test.skip(true, 'no past-year holdings')
  const save = page.locator('[data-testid^="prices-save-"]').first()
  if ((await save.count()) === 0) test.skip(true, 'every price is locked')
  const symbol = (await save.getAttribute('data-testid'))!.replace('prices-save-', '')
  const before = await page.getByTestId(`prices-status-${symbol}`).innerText()

  await page.getByTestId(`prices-input-${symbol}`).fill('0')
  await save.click()
  await expect(page.getByText(/Enter a price above 0/)).toBeVisible()

  await page.reload()
  await expect(page.getByTestId(`prices-status-${symbol}`)).toHaveText(before)
})
