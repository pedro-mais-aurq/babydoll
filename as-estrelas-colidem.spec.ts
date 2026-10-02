import { expect, test, type Locator, type Page } from '@playwright/test';

async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
}

async function intersectsViewport(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeInViewport();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
}

async function fitsViewport(locator: Locator, page: Page) {
  await intersectsViewport(locator);
  const box = (await locator.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(-2);
  expect(box.y).toBeGreaterThanOrEqual(-2);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 2);
}

test('C2 mantém composição, diálogo e interação em desktop e mobile', async ({ page, isMobile }) => {
  await page.goto('/moments/stars-collide');
  const root = page.getByTestId('stars-collide-cinematic');
  const scene = page.getByTestId('stars-collide-scene');
  const hint = page.getByTestId('stars-collide-continue-hint');
  const bubble = page.getByTestId('stars-collide-bubble');
  const line = page.getByTestId('stars-collide-line');
  await expect(root).toBeVisible();
  await expect(scene).toHaveAttribute('data-revealed', 'true');

  async function checkScene() {
    for (const name of ['pedro', 'mabel']) {
      const character = page.getByTestId(`stars-collide-${name}`);
      await expect(character).toHaveJSProperty('complete', true);
      expect(await character.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      await expect.poll(() => character.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.9);
      await intersectsViewport(character);
    }
    await intersectsViewport(page.getByTestId('stars-collide-foreground'));
    await noHorizontalOverflow(page);
  }

  await checkScene();
  // Amostra também o meio da aproximação; scroll continua sendo o mecanismo real.
  for (const progress of [0.5, 1]) {
    await root.evaluate((el, p) => {
      const top = scrollY + el.getBoundingClientRect().top;
      window.scrollTo(0, top + (el.clientHeight - innerHeight) * p);
    }, progress);
    if (progress === 0.5) {
      await expect.poll(() => root.getAttribute('data-progress')).toBe('0.500');
      await expect(root).toHaveAttribute('data-phase', 'approach');
    } else {
      await expect(root).toHaveAttribute('data-phase', 'dialogue');
    }
    await checkScene();
  }

  // Coordenada relativa livre de hover; tap real no projeto mobile.
  async function interact() {
    const position = { x: page.viewportSize()!.width / 2, y: page.viewportSize()!.height / 2 };
    if (isMobile) await scene.tap({ position });
    else await scene.click({ position });
  }
  for (const [speaker, text] of [
    ['pedro', 'Oi'],
    ['mabel', 'Oi'],
    ['pause', ''],
    ['pedro', 'Você gosta do Drummond?'],
    ['mabel', 'Nem um pouco'],
    ['pedro', 'Eu também não, aquele assediador filho da puta'],
    ['mabel', 'jurooo'],
  ]) {
    await expect(hint).toBeVisible();
    // Indicador entra após 260 ms, guarda termina em 320 ms: aguarde sua animação de 500 ms.
    await expect(hint).toHaveCSS('opacity', '1');
    await interact();
    if (speaker === 'pause') {
      await expect(bubble).toHaveCount(0);
      // Aguarda o indicador anterior sair antes de aceitar o indicador pós-pausa.
      await expect(hint).toBeHidden();
      await expect(hint).toBeVisible();
      await expect(bubble).toHaveCount(0); // timer não avança sozinho
      continue;
    }
    await expect(bubble).toHaveAttribute('data-speaker', speaker);
    await expect(bubble).toHaveAttribute('data-typing', 'false');
    await expect(line).toHaveText(text);
    await fitsViewport(bubble, page);
    await fitsViewport(line, page);
    expect(await line.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(2);
    await noHorizontalOverflow(page);
  }
  await expect(hint).toHaveCSS('opacity', '1');
  await interact();
  await expect(root).toHaveAttribute('data-phase', 'outro');
  await expect(page.getByTestId('stars-collide-finale')).toHaveAttribute('data-visible', 'true', { timeout: 7000 });
  await expect(page.getByTestId('stars-collide-finale')).toHaveText('Assim nós viramos amigos');
});

test('reduced-motion só oferece continuação após revelar a cena', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"));
  await page.goto('/moments/stars-collide');
  const scene = page.getByTestId('stars-collide-scene');
  await expect(scene).toBeAttached();

  if (await scene.getAttribute('data-revealed') === 'false') {
    await expect(page.getByTestId('stars-collide-continue-hint')).toHaveCount(0);
  }
  await page.clock.runFor(1100);
  await expect(scene).toHaveAttribute('data-revealed', 'true');
  await expect(page.getByTestId('stars-collide-continue-hint')).toBeVisible();
});
