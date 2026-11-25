import { expect, test as setup } from '@playwright/test'

setup('log in', async ({ page }) => {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  if (!email || !password) throw new Error('Set E2E_EMAIL and E2E_PASSWORD in .env.e2e')

  await page.goto('login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 })
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})
