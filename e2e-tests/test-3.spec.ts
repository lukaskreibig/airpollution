import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.locator('[data-test-id="button-skip"]').click();
  await page.getByLabel('Country').click();
  await page.getByRole('option', { name: 'France' }).click();
});
