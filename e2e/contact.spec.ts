import { expect, test } from '@playwright/test'

// Contact form (ticket 13/14) — external-behavior e2e against `pnpm start`
// (port 7000). The two observable success/error states are pinned by stubbing
// the contact POST so each test asserts one specific path (no "either-or"
// assertions that hide which side regressed):
//
//  - success: the server stub returns {status:'success'} and the form shows
//    the success toast.
//  - error:   the server stub returns {status:'error'} and the form shows
//    the inline `mailto:` fallback (ticket 13 degradation contract).
//
// Both stubs match `**/api/contact-us` regardless of host/port so the spec is
// robust to local-CI port differences (local: 8000, CI: 7000).
test.describe('contact form', () => {
  test('a valid submission with a 200 success response shows the success toast', async ({ page }) => {
    await page.route('**/api/contact-us', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', message: 'Thanks — we will reach out within a business day.' }),
      })
    })

    await page.goto('/en#get-in-touch')
    await page.getByRole('textbox', { name: /name/i }).fill('Asha Patel')
    await page.getByRole('textbox', { name: /email/i }).fill('asha@acme.co')
    await page.getByRole('textbox', { name: /what are you trying to see/i }).fill('Identity drift across tenants.')

    await page.getByRole('button', { name: /^Send$/ }).click()

    // Success toast mirrors the server's success message verbatim.
    const toast = page.locator('[data-sonner-toast]').first()
    await expect(toast).toBeVisible({ timeout: 5000 })
    await expect(toast).toContainText(/reach out within a business day/i)
  })

  test('a server error response shows the inline mailto fallback', async ({ page }) => {
    await page.route('**/api/contact-us', route => {
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', message: 'Simulated failure.' }),
      })
    })

    await page.goto('/en#get-in-touch')
    await page.getByRole('textbox', { name: /name/i }).fill('Asha Patel')
    await page.getByRole('textbox', { name: /email/i }).fill('asha@acme.co')
    await page.getByRole('textbox', { name: /what are you trying to see/i }).fill('Identity drift across tenants.')

    await page.getByRole('button', { name: /^Send$/ }).click()

    // Inline fallback (ticket 13 degradation contract) surfaces a mailto:
    // link prefilled with name/email/notes.
    const fallback = page.getByRole('link', { name: /email us directly/i })
    await expect(fallback).toBeVisible({ timeout: 5000 })
    await expect(fallback).toHaveAttribute('href', /^mailto:/)
  })

  test('inline validation rejects an empty submission before any POST', async ({ page }) => {
    await page.goto('/en#get-in-touch')
    await page.getByRole('button', { name: /^Send$/ }).click()

    // react-hook-form messages, not network. The exact copy is the schema's.
    await expect(page.getByText(/please enter your name/i)).toBeVisible()
  })

  // Ticket 18 AC: "With sitekey unset, the Turnstile widget is absent and
  // the form still posts to the in-app route." This runs against the
  // built-in .dev.vars default (no sitekey configured), so it asserts the
  // contract that survives provisioning: the form is fully usable without
  // bot-protection, the cf-turnstile mount point is gone.
  test('with no sitekey, the Turnstile widget is absent and a valid submission still posts to the in-app route', async ({ page }) => {
    let posted = false
    await page.route('**/api/contact-us', async route => {
      posted = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', message: 'Thanks — we will reach out within a business day.' }),
      })
    })

    await page.goto('/en#get-in-touch')
    // Widget host is a `.cf-turnstile` div injected by Turnstile's script.
    // When the sitekey is unset, the client never renders the mount point
    // at all — `.cf-turnstile` is absent.
    await expect(page.locator('.cf-turnstile')).toHaveCount(0)

    await page.getByRole('textbox', { name: /name/i }).fill('Asha Patel')
    await page.getByRole('textbox', { name: /email/i }).fill('asha@acme.co')
    await page.getByRole('textbox', { name: /what are you trying to see/i }).fill('Identity drift across tenants.')
    await page.getByRole('button', { name: /^Send$/ }).click()

    // The form still posts — and the success path renders the toast.
    await expect.poll(() => posted).toBe(true)
    const toast = page.locator('[data-sonner-toast]').first()
    await expect(toast).toBeVisible({ timeout: 5000 })
  })
})
