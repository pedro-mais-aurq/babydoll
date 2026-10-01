import { expect, test } from '@playwright/test';

for (const route of ['/', '/moments', '/moments/first-day-five', '/moments/sete-de-dezembro']) {
  test(`rota direta e refresh: ${route}`, async ({ page }) => {
    await page.goto(route);
    const mounted = route === '/'
      ? page.getByPlaceholder('DD/MM/AAAA')
      : route === '/moments'
        ? page.getByText('nossos momentos', { exact: true })
        : route.endsWith('first-day-five')
          ? page.getByRole('article', { name: 'Quando nos entrelaçamos' })
          : page.getByTestId('moment-reserved');
    await expect(mounted).toBeVisible();
    await page.reload();
    await expect(mounted).toBeVisible();
    await expect(page.getByText('Página não encontrada', { exact: true })).toHaveCount(0);
  });
}
