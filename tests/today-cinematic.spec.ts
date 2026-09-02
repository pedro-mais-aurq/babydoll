import { expect, type Page, test } from '@playwright/test'

const viewports = [
  { name: 'mobile-small', width: 360, height: 800 },
  { name: 'mobile-standard', width: 390, height: 844 },
  { name: 'mobile-large', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop-small', width: 1366, height: 768 },
  { name: 'desktop-standard', width: 1440, height: 900 },
  { name: 'desktop-large', width: 1920, height: 1080 },
] as const

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
}

async function expectInsideViewport(page: Page, selector: string) {
  const bounds = await page.locator(selector).boundingBox()
  const viewport = page.viewportSize()

  expect(bounds).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(bounds?.x ?? -2).toBeGreaterThanOrEqual(-1)
  expect(bounds?.y ?? -2).toBeGreaterThanOrEqual(-1)
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual((viewport?.width ?? 0) + 1)
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual((viewport?.height ?? 0) + 1)
}

async function enterCinematic(page: Page) {
  await page.goto('./')
  await page.getByLabel('Data de nascimento no formato dia, mês e ano').fill('08/11/2009')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: /Nosso primeiro dia 5/ })).toBeVisible({
    timeout: 3_000,
  })
}

async function scrollToSectionProgress(page: Page, label: string, progress: number) {
  await page.locator(`[aria-label="${label}"]`).evaluate((element, targetProgress) => {
    const section = element as HTMLElement
    const travel = Math.max(section.offsetHeight - window.innerHeight, 1)
    window.scrollTo(0, section.offsetTop + travel * Number(targetProgress))
  }, progress)
  await page.waitForTimeout(100)
}

for (const viewport of viewports) {
  test(`${viewport.name}: a cinemática preserva composição e interação`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await enterCinematic(page)

    const intro = page.getByRole('heading', { name: /Nosso primeiro dia 5/ })
    await expect(intro).toContainText('quando tudo ainda era doce')
    await expect(page.getByRole('img')).toHaveCount(4)
    await expectNoHorizontalOverflow(page)

    await scrollToSectionProgress(page, 'As três primeiras lembranças', 0.5)
    const galleryTransform = await page.locator('[aria-label="As três primeiras lembranças"] > div > div')
      .evaluate((element) => getComputedStyle(element).transform)
    expect(galleryTransform).not.toBe('none')
    await expectNoHorizontalOverflow(page)

    await scrollToSectionProgress(page, 'Linha do tempo até hoje', 0.95)
    const lastImage = page.getByRole('img', { name: 'Nós dois diante de um espelho' })
    const lastMessage = page.getByText('esse não é o nosso último dia 5,', { exact: false })
    await expect(lastImage).toBeVisible()
    await expect(lastMessage).toBeVisible()
    expect(Number(await lastImage.evaluate((element) => getComputedStyle(element.parentElement!).opacity)))
      .toBeGreaterThan(0.9)
    await expectNoHorizontalOverflow(page)

    const finalSection = page.getByRole('heading', {
      name: 'Eu te amo daqui até andrômeda',
    }).locator('..').locator('..')
    await finalSection.evaluate((element) => {
      window.scrollTo(0, (element as HTMLElement).offsetTop)
    })
    await page.waitForTimeout(100)

    const answer = page.getByLabel('complete o caminho')
    const submit = page.getByRole('button', { name: 'Responder' })
    await expect(answer).toBeVisible()
    await expect(answer).toBeEditable()
    await expect(submit).toBeVisible()
    await expect(submit).toBeEnabled()
    await expectInsideViewport(page, '#andromeda-answer')
    await expectInsideViewport(page, 'form')
    await expectNoHorizontalOverflow(page)

    await answer.fill('Só ida')
    await submit.click()
    await expect(page.getByText('ainda falta uma parte desse caminho, amor.')).toBeVisible()
    await expect(answer).toBeEditable()

    await answer.fill('Ida e volta')
    await submit.click()
    await expect(page.getByText('sempre.')).toBeVisible()
    await expect(page.getByLabel('Cinemática encerrada')).toBeVisible({ timeout: 2_000 })
  })
}

test('prefers-reduced-motion encerra sem aguardar a animação', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await enterCinematic(page)

  const answer = page.getByLabel('complete o caminho')
  await answer.evaluate((element) => {
    element.scrollIntoView({ block: 'center' })
  })
  await answer.fill('Ida e volta')
  await page.getByRole('button', { name: 'Responder' }).click()

  await expect(page.getByLabel('Cinemática encerrada')).toBeVisible({ timeout: 500 })
})
