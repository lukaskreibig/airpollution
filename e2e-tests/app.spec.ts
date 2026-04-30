import { test, expect } from '@playwright/test';

const waqiFixture = {
  status: 'ok',
  data: [
    {
      uid: 1,
      aqi: 42,
      lat: 52.52,
      lon: 13.405,
      station: { name: 'Berlin AQI Station', time: '2026-04-30T12:00:00Z' },
    },
    {
      uid: 2,
      aqi: 156,
      lat: 48.137,
      lon: 11.575,
      station: { name: 'Munich AQI Station', time: '2026-04-30T12:00:00Z' },
    },
  ],
};

test.describe('MapTheAir App Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/waqi?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(waqiFixture),
      });
    });

    await page.goto('/');
  });

  test('loads live AQI station data', async ({ page }) => {
    await expect(page.getByText('Berlin AQI Station')).toBeVisible();
    await expect(page.getByText('Munich AQI Station')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Munich AQI Station 156/i })
    ).toBeVisible();
  });

  test('renders the view control and station search', async ({ page }) => {
    await expect(page.locator('.chart-dropdown')).toBeVisible();
    await expect(page.locator('.search-field')).toBeVisible();
  });

  test('can switch between map and scatter chart', async ({ page }) => {
    await page.getByLabel('View').click();
    await page.getByRole('option', { name: 'Scatter Chart' }).click();

    await expect(page.locator('.chart-area')).toBeVisible();
    await expect(page.locator('.map-area')).toHaveCount(0);
  });

  test('filters the station list by search query', async ({ page }) => {
    await page.getByLabel('Search').fill('Munich');

    await expect(page.getByText('Munich AQI Station')).toBeVisible();
    await expect(page.getByText('Berlin AQI Station')).toHaveCount(0);
  });

  test('displays legal and WAQI attribution after load', async ({ page }) => {
    await expect(page.getByText('Legal & Privacy')).toBeVisible();
    await expect(page.getByRole('link', { name: 'WAQI' })).toBeVisible();
  });
});
