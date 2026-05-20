import { test, expect } from '@playwright/test';

const runtimeErrors = new WeakMap<object, string[]>();

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
    const errors: string[] = [];
    runtimeErrors.set(page, errors);
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.route('**/api/waqi?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(waqiFixture),
      });
    });

    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    expect(runtimeErrors.get(page) || []).toEqual([]);
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

  test('can switch between map and insights dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Insights' }).click();

    await expect(page.locator('.insights-dashboard')).toBeVisible();
    await expect(page.locator('.map-area')).toHaveCount(0);
    await expect(page.getByText('Air quality insights')).toBeVisible();
  });

  test('insights tabs switch visible content and scroll to the bottom', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Insights' }).click();

    await page.getByRole('tab', { name: 'Hotspots' }).click();
    await expect(page.getByText('Highest AQI stations')).toBeVisible();

    await page.getByRole('tab', { name: 'Data quality' }).click();
    await expect(page.getByText('Data quality and coverage')).toBeVisible();

    const scrollState = await page.locator('.insights-dashboard').evaluate(
      (element) => {
        element.scrollTop = element.scrollHeight;
        return {
          bottomGap:
            element.scrollHeight - element.clientHeight - element.scrollTop,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
        };
      }
    );

    expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
    expect(scrollState.bottomGap).toBeLessThanOrEqual(1);
  });

  test('keeps the view switch usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Insights' }).click();

    await expect(page.locator('.insights-dashboard')).toBeVisible();
  });

  test('opens the station list as a mobile bottom sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByLabel('Open station list').click();

    await page.waitForTimeout(400);
    await expect(page.getByText('Berlin AQI Station')).toBeVisible();
    const drawerBox = await page.locator('.MuiDrawer-paper').boundingBox();
    expect(drawerBox?.y).toBeGreaterThan(150);
    expect(drawerBox?.y).toBeLessThan(350);
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
