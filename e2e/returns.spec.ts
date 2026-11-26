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

/** Year filter is the shared SearchableDropdown: open it, then click an option. */
const yearButton = (page: Page) => page.getByTestId('returns-year-select')
const yearOption = (page: Page, value: string | number) => page.getByTestId(`returns-year-select-option-${value}`)
async function pickYear(page: Page, value: string | number) {
  await yearButton(page).click()
  await yearOption(page, value).click()
}

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

  await expect(yearButton(page)).toHaveText('All time')
  await expect(page.getByTestId('returns-cagr')).toBeVisible()
  await expect(page.getByTestId('returns-years-table')).toBeVisible()

  // filter: All time, 2025 … 2075; running year labelled YTD; future years disabled
  const y = currentYear()
  await yearButton(page).click()
  await expect(yearOption(page, 'all')).toHaveText('All time')
  await expect(yearOption(page, 2025)).toBeEnabled()
  await expect(yearOption(page, y)).toHaveText(`${y} YTD`)
  await expect(yearOption(page, 2075)).toBeDisabled()
  await expect(yearOption(page, y + 1)).toBeDisabled()
  await expect(yearOption(page, 2076)).toHaveCount(0)
  // search inside the dropdown
  await page.getByPlaceholder('Search year...').fill('2030')
  await expect(page.locator('[data-testid^="returns-year-select-option-"]')).toHaveCount(1)
  await page.getByPlaceholder('Search year...').fill('xyz')
  await expect(page.getByText('No year found')).toBeVisible()
  await yearButton(page).click() // close

  // every year in the table shows the same return as its own year view
  const rows = page.locator('[data-testid^="returns-row-"]')
  const count = await rows.count()
  expect(count).toBeGreaterThan(0)

  // each year: Realized + Unrealized + Dividend = Gain (whole-taka rounding)
  const taka = (s: string) => Number(s.replace(/[৳,+\s]/g, '').replace('−', '-'))
  for (let i = 0; i < count; i++) {
    const cell = (col: string) => rows.nth(i).locator(`td[data-col="${col}"]`).innerText()
    const gain = (await cell('gain')).trim()
    if (gain === '—') continue
    const sum = taka(await cell('realized')) + taka(await cell('unrealized')) + taka(await cell('dividend'))
    expect(Math.abs(sum - taka(gain))).toBeLessThanOrEqual(2)
  }
  const expected: Record<string, string> = {}
  for (let i = 0; i < count; i++) {
    const id = (await rows.nth(i).getAttribute('data-testid'))!.replace('returns-row-', '')
    expected[id] = (await rows.nth(i).locator('td').last().innerText()).trim()
  }
  await expect(page.getByTestId('returns-chart').or(page.getByTestId('returns-chart-empty'))).toBeVisible()

  for (const [year, text] of Object.entries(expected)) {
    await pickYear(page, year)
    await expect(page).toHaveURL(new RegExp(`year=${year}$`))
    await expect(yearButton(page)).toHaveText(Number(year) === y ? `${year} YTD` : year)
    await expect(page.getByTestId('returns-year-return-value')).toHaveText(text)
  }

  // back to All time
  await pickYear(page, 'all')
  await expect(page).toHaveURL(/\/analytics\/returns$/)
  await expect(page.getByTestId('returns-cagr')).toBeVisible()
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

test('year view: Top Gainer / Top Loser match the biggest gain and loss in the stock table', async ({ page }) => {
  await page.goto('analytics/returns')
  if (await page.getByTestId('returns-empty').isVisible()) test.skip(true, 'E2E user has no transactions')
  const parse = (s: string) => Number(s.replace(/[৳,+\s]/g, '').replace('−', '-'))

  for (const year of [currentYear(), currentYear() - 1]) {
    if (year < 2025) continue
    await pickYear(page, year)
    await expect(page).toHaveURL(new RegExp(`year=${year}$`))
    await expect(page.getByTestId('returns-top-gainer')).toBeVisible()
    await expect(page.getByTestId('returns-top-loser')).toBeVisible()

    const rows = page.locator('[data-testid^="returns-stock-"]')
    const gains: { symbol: string; gain: number }[] = []
    for (let i = 0; i < (await rows.count()); i++) {
      const text = (await rows.nth(i).locator('td').last().innerText()).trim()
      if (text === '—') continue
      gains.push({ symbol: (await rows.nth(i).locator('td').first().innerText()).trim(), gain: parse(text) })
    }
    const best = gains.filter(g => g.gain > 0).sort((a, b) => b.gain - a.gain)[0]
    const worst = gains.filter(g => g.gain < 0).sort((a, b) => a.gain - b.gain)[0]
    await expect(page.getByTestId('returns-top-gainer-value')).toHaveText(best?.symbol ?? '—')
    await expect(page.getByTestId('returns-top-loser-value')).toHaveText(worst?.symbol ?? '—')
  }
})

test('unknown ?year falls back to All time', async ({ page }) => {
  await page.goto('analytics/returns?year=1800')
  await expect(page.getByTestId('returns-page')).toBeVisible()
  if (await page.getByTestId('returns-empty').isVisible()) return
  await expect(yearButton(page)).toHaveText('All time')
  // a future year in the URL is not allowed either
  await page.goto(`analytics/returns?year=${currentYear() + 1}`)
  await expect(yearButton(page)).toHaveText('All time')
})

test('Bangla: titles and Bangla digits', async ({ page }) => {
  await setLocale(page, 'bn')
  await page.goto('analytics/returns')
  await expect(page.getByRole('heading', { name: 'বার্ষিক রিটার্ন' })).toBeVisible()
  if (await page.getByTestId('returns-empty').isVisible()) return
  await expect(yearButton(page)).toHaveText('সব সময়')
  await yearButton(page).click()
  await expect(yearOption(page, 2025)).toHaveText('২০২৫')
  await expect(yearOption(page, currentYear())).toHaveText(/^[০-৯]{4} YTD$/)
  // English digits find a Bangla-digit year; Bangla "no result" text
  await page.getByPlaceholder('বছর খুঁজুন...').fill('2025')
  await expect(page.locator('[data-testid^="returns-year-select-option-"]')).toHaveCount(1)
  await expect(yearOption(page, 2025)).toBeVisible()
  await page.getByPlaceholder('বছর খুঁজুন...').fill('xyz')
  await expect(page.getByText('কোনো বছর পাওয়া যায়নি')).toBeVisible()
  // pick a year in Bangla → URL + Bangla card labels
  await page.getByPlaceholder('বছর খুঁজুন...').fill('')
  await yearOption(page, 2025).click()
  await expect(page).toHaveURL(/year=2025$/)
  await expect(yearButton(page)).toHaveText('২০২৫')
  await expect(page.getByTestId('returns-year-return')).toContainText('রিটার্ন')
  await expect(page.getByTestId('returns-top-gainer')).toContainText('সেরা লাভ')
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
