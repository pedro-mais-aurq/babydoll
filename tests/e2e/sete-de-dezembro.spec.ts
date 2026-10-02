import { expect, test } from '@playwright/test';

test('C3: frase final, fade e retorno automático ao coração', async ({ page }) => {
  await page.goto('/moments/sete-de-dezembro');
  const cinematic = page.getByTestId('sete-de-dezembro-cinematic');
  await expect(cinematic).toBeVisible();
  await page.evaluate(() => {
    const root = document.querySelector('[data-testid="sete-de-dezembro-cinematic"]') as HTMLElement;
    const top = window.scrollY + root.getBoundingClientRect().top;
    window.scrollTo(0, top + root.offsetHeight - window.innerHeight - 6);
  });
  const finale = page.getByTestId('sete-de-dezembro-finale');
  await expect(finale).toHaveAttribute('data-state', 'in');
  await expect(finale).toHaveText('Eu estou orgulhoso de você');
  await expect(finale).toHaveCSS('opacity', '1');
  await expect(finale).toHaveAttribute('data-state', 'out');
  await expect.poll(() => finale.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(0.9);
  await expect(page).toHaveURL(/\/moments$/);
  await expect(page.getByText('nossos momentos', { exact: true })).toBeVisible();
  await expect(cinematic).toHaveCount(0);
});
