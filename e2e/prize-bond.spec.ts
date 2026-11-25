import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import * as XLSX from 'xlsx'

/**
 * Prize Bond end-to-end flow against the dev server + dev DB.
 * Real data it keeps ON PURPOSE: the 200 bonds from the client's Excel.
 * Everything the test creates for CRUD checks (holder "E2E-TEST", the 0544222 bond and
 * its win record) is deleted again through the UI. Re-runnable.
 */

const SAMPLES = join(process.cwd(), 'sample-pdf')
const PDF = (no: number) => join(SAMPLES, `${no}${no === 121 ? 'st' : no === 122 ? 'nd' : no === 123 ? 'rd' : 'th'}draw.pdf`)
const EXCEL = join(SAMPLES, 'Bangladesh Price Bond.xlsx')
const TAG = 'E2E-TEST'

test.describe.configure({ mode: 'serial' })

async function setLocale(page: Page, locale: 'en' | 'bn') {
  const url = new URL(process.env.E2E_BASE_URL ?? 'http://localhost:3000/trackfolio/').origin
  await page.context().addCookies([{ name: 'NEXT_LOCALE', value: locale, url }])
}

function confirmDialog(page: Page) {
  // ConfirmModal overlay
  return page.locator('div.fixed.inset-0.z-\\[100\\]')
}

async function checkPdf(page: Page, file: string) {
  await page.goto('prize-bond/draws')
  await page.getByTestId('pb-check-file').setInputFiles(file)
  await expect(page.getByTestId('pb-check-result')).toBeVisible({ timeout: 60_000 })
}

test.beforeEach(async ({ page }) => {
  await setLocale(page, 'en')
})

test('bonds: import the client Excel (200 bonds, leading zeros kept)', async ({ page }) => {
  test.skip(!existsSync(EXCEL), 'client Excel not present')
  await page.goto('prize-bond')
  await page.getByTestId('pb-import-open').click()
  await page.getByTestId('pb-import-file').setInputFiles(EXCEL)
  await expect(page.getByTestId('pb-import-summary')).toContainText('200 bond numbers found')
  await page.getByTestId('pb-import-submit').click()
  await expect(page.getByText(/bonds added/)).toBeVisible()
  await expect(page.getByTestId('pb-bond-0063559')).toBeVisible() // first row of page 1 (sorted)
  await page.getByTestId('pb-search').fill('0622201')
  await expect(page.getByTestId('pb-bond-0622201')).toBeVisible()
  const total = Number(await page.getByTestId('pb-stat-total').locator('p').nth(1).innerText())
  expect(total).toBeGreaterThanOrEqual(200)
})

test('bonds: download sample format → fill → import with holder/date per row', async ({ page }, testInfo) => {
  await page.goto('prize-bond')
  await page.getByTestId('pb-import-open').click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('pb-import-template').click()])
  expect(download.suggestedFilename()).toBe('prize-bond-import-format.xlsx')
  const tplPath = testInfo.outputPath('template.xlsx')
  await download.saveAs(tplPath)

  // the template: header + 2 sample rows (numbers kept as text) + a help sheet
  const wb = XLSX.read(readFileSync(tplPath))
  expect(wb.SheetNames).toEqual(['Bonds', 'How to fill'])
  const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets.Bonds, { header: 1, raw: true, defval: '' })
  expect(rows[0]).toEqual(['Bond Number', 'Series (optional, e.g. কখ)', 'Holder (optional)', 'Purchase Date (YYYY-MM-DD, optional)', 'Note (optional)'])
  expect(rows[1][0]).toBe('0123456')

  // fill it like a user would: replace the sample rows
  wb.Sheets.Bonds = XLSX.utils.aoa_to_sheet([rows[0], ['0999990', 'কখ', TAG, '2024-03-01', 'from template'], ['999991', '', TAG, '05/03/2024', '']])
  const filled = testInfo.outputPath('filled.xlsx')
  writeFileSync(filled, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))

  await page.getByTestId('pb-import-file').setInputFiles(filled)
  await expect(page.getByTestId('pb-import-summary')).toContainText('2 bond numbers found')
  await expect(page.getByTestId('pb-import-columns')).toHaveText('Columns found: Number, Series, Holder, Purchase date, Note')
  await page.getByTestId('pb-import-submit').click()
  await expect(page.getByText(/[02] bonds added/)).toBeVisible()

  await page.getByTestId('pb-search').fill(TAG)
  await expect(page.getByTestId('pb-bond-0999990')).toContainText('কখ')
  await expect(page.getByTestId('pb-bond-0999990')).toContainText('01 Mar 2024')
  await expect(page.getByTestId('pb-bond-0999990')).toContainText('from template')
  await expect(page.getByTestId('pb-bond-0999991')).toContainText('05 Mar 2024')

  // clean up
  await page.getByRole('checkbox', { name: 'Select all' }).check()
  await page.getByTestId('pb-bulk-delete').click()
  await confirmDialog(page).getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('2 bonds deleted')).toBeVisible()
})

test('draw check: no matching bond → "No match", nothing recorded', async ({ page }) => {
  await checkPdf(page, PDF(125))
  await expect(page.getByTestId('pb-check-draw')).toContainText('Draw #125')
  await expect(page.getByText('All 46 numbers verified')).toBeVisible()
  await expect(page.getByTestId('pb-check-nomatch')).toContainText('No match')
  await expect(page.getByTestId('pb-check-matches')).toHaveCount(0)
  // all 46 winning numbers can be revealed
  await page.getByRole('button', { name: /All winning numbers/ }).click()
  await expect(page.getByTestId('pb-check-numbers').locator('span[style]')).toHaveCount(46)
  await page.goto('prize-bond/winnings')
  await expect(page.locator('[data-testid^="pb-win-"][data-testid$="-125"]')).toHaveCount(0)
})

test('draw check: winning bond → match shown → recorded in Winnings → delete with confirm', async ({ page }) => {
  // add a bond that won the 1st prize in draw 120
  await page.goto('prize-bond')
  await page.getByTestId('pb-add-open').click()
  await page.locator('#pb-number').fill('544222') // leading zero is added
  await page.locator('#pb-series').fill('কখ')
  await page.locator('#pb-holder').fill(TAG)
  await page.locator('#pb-purchase').fill('2024-01-10')
  await page.getByTestId('pb-bond-save').click()
  await expect(page.getByText(/[01] bonds added/)).toBeVisible() // 0 if a previous run left it behind

  // check the draw-120 PDF
  await checkPdf(page, PDF(120))
  await expect(page.getByTestId('pb-check-draw')).toContainText('Draw #120')
  const match = page.getByTestId('pb-check-match-0544222')
  await expect(page.getByTestId('pb-check-matches')).toContainText('1 of your bonds won!')
  await expect(match).toContainText('কখ-0544222')
  await expect(match).toContainText('1st prize')
  await expect(match).toContainText('৳6,00,000')
  await expect(match).toContainText('৳4,80,000')
  await expect(match).toContainText('Claim by 31 Jul 2027')
  await expect(page.getByTestId('pb-check-matches')).toContainText(/1 new win\(s\) saved|already in Winnings/)

  // checking the same PDF again does not duplicate
  await page.getByTestId('pb-check-again').click()
  await page.getByTestId('pb-check-file').setInputFiles(PDF(120))
  await expect(page.getByText('These wins are already in Winnings')).toBeVisible({ timeout: 60_000 })

  // Winnings history
  await page.goto('prize-bond/winnings')
  const win = page.getByTestId('pb-win-0544222-120')
  await expect(win).toHaveCount(1)
  await expect(win).toContainText('1st prize')
  await expect(win).toContainText('৳4,80,000')

  // delete win → Cancel keeps it, Delete removes it
  await page.getByRole('button', { name: 'Delete 0544222 #120' }).click()
  await expect(confirmDialog(page)).toContainText('draw #120')
  await confirmDialog(page).getByRole('button', { name: 'Cancel' }).click()
  await expect(win).toBeVisible()
  await page.getByRole('button', { name: 'Delete 0544222 #120' }).click()
  await confirmDialog(page).getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('Win record deleted')).toBeVisible()
  await expect(win).toHaveCount(0)

  // edit + delete the bond (Cancel first, then Delete)
  await page.goto('prize-bond')
  await page.getByTestId('pb-search').fill('0544222')
  await page.getByRole('button', { name: 'Edit 0544222' }).click()
  await page.locator('#pb-holder').fill(`${TAG}-EDITED`)
  await page.getByTestId('pb-bond-save').click()
  await expect(page.getByText('Bond updated')).toBeVisible()
  await expect(page.getByTestId('pb-bond-0544222')).toContainText(`${TAG}-EDITED`)

  await page.getByRole('button', { name: 'Delete 0544222' }).click()
  await expect(confirmDialog(page)).toContainText('Delete bond কখ-0544222?')
  await confirmDialog(page).getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByTestId('pb-bond-0544222')).toBeVisible()
  await page.getByRole('button', { name: 'Delete 0544222' }).click()
  await confirmDialog(page).getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('1 bonds deleted')).toBeVisible()
  await expect(page.getByTestId('pb-bond-0544222')).toHaveCount(0)
})

test('bonds: range add, paste preview, bulk delete with confirm', async ({ page }) => {
  await page.goto('prize-bond')
  await page.getByTestId('pb-add-open').click()
  await page.getByTestId('pb-mode-range').click()
  await page.locator('#pb-from').fill('0999990')
  await page.locator('#pb-to').fill('999994')
  await expect(page.getByTestId('pb-range-info')).toHaveText('5 bonds')
  await page.locator('#pb-to').fill('0999980')
  await expect(page.getByTestId('pb-range-info')).toContainText('must not be smaller')
  await page.locator('#pb-to').fill('0999994')
  await page.locator('#pb-holder').fill(TAG)
  await page.getByTestId('pb-bond-save').click()
  await expect(page.getByText('5 bonds added')).toBeVisible()

  await page.getByTestId('pb-add-open').click()
  await page.getByTestId('pb-mode-paste').click()
  await page.locator('#pb-paste').fill('0544222, ০৫৪৪২২৩\n544222 abc 99999999')
  await expect(page.getByTestId('pb-paste-info')).toHaveText('2 valid · 2 invalid · 1 duplicate')
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.getByTestId('pb-search').fill(TAG)
  await expect(page.getByTestId('pb-showing')).toHaveText('1–5 of 5')
  await page.getByRole('checkbox', { name: 'Select all' }).check()
  await page.getByTestId('pb-bulk-delete').click()
  await expect(confirmDialog(page)).toContainText('Delete 5 selected bonds?')
  await confirmDialog(page).getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText('5 bonds deleted')).toBeVisible()
  await expect(page.getByText('No bonds match these filters.')).toBeVisible()
})

test('bonds: 10 rows per page with working pagination', async ({ page }) => {
  await page.goto('prize-bond')
  const rows = page.getByTestId('pb-bonds-table').locator('tbody tr')
  await expect(rows).toHaveCount(10)
  const total = Number((await page.getByTestId('pb-showing').innerText()).split(' of ')[1])
  expect(total).toBeGreaterThan(10)
  await expect(page.getByTestId('pb-showing')).toHaveText(`1–10 of ${total}`)
  const first = await rows.first().getAttribute('data-testid')

  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByTestId('pb-showing')).toHaveText(`11–20 of ${total}`)
  await expect(rows).toHaveCount(10)
  expect(await rows.first().getAttribute('data-testid')).not.toBe(first)

  const last = Math.ceil(total / 10)
  await page.getByTestId('pb-pagination').getByRole('button', { name: String(last), exact: true }).click()
  await expect(page.getByTestId('pb-showing')).toHaveText(`${(last - 1) * 10 + 1}–${total} of ${total}`)
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
  await page.getByRole('button', { name: 'Previous page' }).click()
  await expect(page.getByTestId('pb-showing')).toHaveText(`${(last - 2) * 10 + 1}–${(last - 1) * 10} of ${total}`)

  await page.getByTestId('pb-search').fill('06222')
  await expect(page.getByTestId('pb-showing')).toHaveText(/^1–10 of /)
})

test('i18n: Bangla labels on all three pages', async ({ page }) => {
  await setLocale(page, 'bn')
  await page.goto('prize-bond')
  await expect(page.getByRole('heading', { name: 'আমার বন্ড' })).toBeVisible()
  await expect(page.getByText('প্রাইজ বন্ড').first()).toBeVisible()
  await page.goto('prize-bond/draws')
  await expect(page.getByRole('heading', { name: 'ড্র চেক' })).toBeVisible()
  await page.goto('prize-bond/winnings')
  await expect(page.getByRole('heading', { name: 'পুরস্কার' })).toBeVisible()
  await setLocale(page, 'en')
})

test('sidebar: Prize Bond submenu stays open and highlights the current page', async ({ page }) => {
  for (const [path, label] of [
    ['prize-bond', 'My Bonds'],
    ['prize-bond/draws', 'Draw Check'],
    ['prize-bond/winnings', 'Winnings']
  ] as const) {
    await page.goto(path)
    const link = page.getByRole('link', { name: label, exact: true })
    await expect(link).toBeVisible() // submenu is open on page load
    await expect(link).toHaveClass(/text-indigo-700/) // current page highlighted
  }
  // clicking a submenu link keeps the submenu open on the new page
  await page.getByRole('link', { name: 'Draw Check', exact: true }).click()
  await expect(page).toHaveURL(/prize-bond\/draws/)
  await expect(page.getByRole('link', { name: 'Draw Check', exact: true })).toHaveClass(/text-indigo-700/)
  await expect(page.getByRole('link', { name: 'My Bonds', exact: true })).toBeVisible()
})

test('dashboard shows the prize bond card', async ({ page }) => {
  await page.goto('')
  const card = page.getByTestId('pb-dashboard-card')
  await expect(card).toBeVisible({ timeout: 60_000 })
  await expect(card).toContainText('Total bonds')
  await expect(card).toContainText('Check a draw')
})
