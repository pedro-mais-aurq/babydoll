import { expect, type Locator, test } from '@playwright/test'

const viewports = [
  { name: 'mobile-small', width: 360, height: 800 },
  { name: 'mobile-standard', width: 390, height: 844 },
  { name: 'mobile-large', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop-small', width: 1366, height: 768 },
  { name: 'desktop-standard', width: 1440, height: 900 },
  { name: 'desktop-large', width: 1920, height: 1080 },
] as const

async function expectInsideViewport(locator: Locator, width: number, height: number) {
  const box = await locator.boundingBox()

  expect(box).not.toBeNull()
  expect(box?.x ?? -2).toBeGreaterThanOrEqual(-1)
  expect(box?.y ?? -2).toBeGreaterThanOrEqual(-1)
  expect((box?.x ?? width) + (box?.width ?? 2)).toBeLessThanOrEqual(width + 1)
  expect((box?.y ?? height) + (box?.height ?? 2)).toBeLessThanOrEqual(height + 1)
}

for (const viewport of viewports) {
  test(`${viewport.name}: Entry responsivo e fluxo completo`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('./')

    const logo = page.getByRole('heading', { name: 'BABYDOLL' })
    const character = page.getByRole('img', { name: /Hello Kitty/ })
    const question = page.getByText('Qual é minha data de nascimento?')
    const input = page.getByLabel('Data de nascimento no formato dia, mês e ano')
    const button = page.getByRole('button', { name: 'Entrar' })
    const form = page.locator('form')

    await expect(logo).toBeVisible()
    await expect(character).toBeVisible()
    await expect(question).toBeVisible()
    await expect(input).toBeVisible()
    await expect(input).toBeEditable()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
    await expect(form).toBeVisible()

    for (const element of [logo, character, question, input, button, form]) {
      await expectInsideViewport(element, viewport.width, viewport.height)
    }

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasHorizontalOverflow).toBe(false)

    await input.fill('01/01/2000')
    await input.press('Enter')
    const errorFeedback = page.getByText('tem certeza, amor?')

    await expect(errorFeedback).toBeVisible()
    await expectInsideViewport(errorFeedback, viewport.width, viewport.height)
    await expect(input).toBeEditable()

    await input.fill('08/11/2009')
    await button.click()
    await expect(page.getByText('claro que você lembrava.')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Nosso primeiro dia 5/ })).toBeVisible({
      timeout: 3_000,
    })
  })
}
