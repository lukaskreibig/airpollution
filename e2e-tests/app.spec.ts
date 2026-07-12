import { test, expect } from '@playwright/test';

const runtimeErrors = new WeakMap<object, string[]>();

const waqiBoundsFixture = {
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

const waqiDetailFixture = {
  status: 'ok',
  data: {
    aqi: 156,
    idx: 2,
    city: { name: 'Munich AQI Station', geo: [48.137, 11.575] },
    dominentpol: 'pm25',
    iaqi: { pm25: { v: 156 }, o3: { v: 21 }, no2: { v: 33 } },
    time: { iso: '2026-04-30T12:00:00Z' },
    attributions: [{ name: 'Test Network' }],
    forecast: {
      daily: {
        pm25: [
          { day: '2026-05-01', avg: 120, min: 90, max: 160 },
          { day: '2026-05-02', avg: 100, min: 70, max: 140 },
          { day: '2026-05-03', avg: 80, min: 60, max: 120 },
          { day: '2026-05-04', avg: 90, min: 65, max: 130 },
        ],
      },
    },
  },
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
      const url = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          url.includes('uid=') ? waqiDetailFixture : waqiBoundsFixture
        ),
      });
    });

    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    expect(runtimeErrors.get(page) || []).toEqual([]);
  });

  test('loads live AQI station data into the rail', async ({ page }) => {
    const rail = page.locator('.rail');
    await expect(rail.getByText('Berlin AQI Station')).toBeVisible();
    await expect(rail.getByText('Munich AQI Station')).toBeVisible();
    await expect(
      page.getByRole('listitem', { name: /Munich AQI Station 156/i })
    ).toBeVisible();
  });

  test('renders the view switch, legend and station search', async ({
    page,
  }) => {
    await expect(page.getByRole('button', { name: 'Insights' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Map' })).toBeVisible();
    await expect(page.getByLabel('AQI color scale')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Pollution field' })
    ).toBeVisible();
    await expect(page.getByPlaceholder('Search stations…')).toBeVisible();
  });

  test('filters the station list by search query', async ({ page }) => {
    const rail = page.locator('.rail');
    await page.getByPlaceholder('Search stations…').fill('Munich');

    await expect(rail.getByText('Munich AQI Station')).toBeVisible();
    await expect(rail.getByText('Berlin AQI Station')).toHaveCount(0);
  });

  test('opens the station detail panel with pollutants and forecast', async ({
    page,
  }) => {
    await page
      .getByRole('listitem', { name: /Munich AQI Station 156/i })
      .click();

    const detail = page.locator('.detail');
    await expect(detail).toBeVisible();
    await expect(
      detail.locator('.pollutant-row', { hasText: 'PM2.5' })
    ).toBeVisible();
    await expect(detail.getByText(/Forecast · next days/i)).toBeVisible();
    await expect(detail.getByText(/drives this station/i)).toBeVisible();

    await page.getByRole('button', { name: 'Close station detail' }).click();
    await expect(detail).toBeHidden();
  });

  test('switches to the insights dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Insights' }).click();

    await expect(page.locator('.insights-dashboard')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Air in view is mostly/i })
    ).toBeVisible();
    await expect(page.getByText('The AQI spectrum')).toBeVisible();
    await expect(page.getByText('Pollution hotspots')).toBeVisible();
    await expect(page.getByText('Station spotlight')).toBeVisible();
  });

  test('insights spotlight jumps back to the map', async ({ page }) => {
    await page.getByRole('button', { name: 'Insights' }).click();
    await expect(page.locator('.insights-dashboard')).toBeVisible();

    await page.getByRole('button', { name: 'View on map' }).click();

    await expect(page.locator('.insights-dashboard')).toHaveCount(0);
    await expect(page.locator('.detail')).toBeVisible();
  });

  test('insights page scrolls to the bottom', async ({ page }) => {
    await page.getByRole('button', { name: 'Insights' }).click();
    await expect(page.locator('.insights-dashboard')).toBeVisible();

    const scrollState = await page
      .locator('.insights-dashboard')
      .evaluate((element) => {
        element.scrollTop = element.scrollHeight;
        return {
          bottomGap:
            element.scrollHeight - element.clientHeight - element.scrollTop,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
        };
      });

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

    await expect(page.locator('.rail')).toBeHidden();
    await page.getByRole('button', { name: 'Open station list' }).click();

    await expect(page.getByText('Berlin AQI Station')).toBeVisible();
    const railBox = await page.locator('.rail').boundingBox();
    expect(railBox?.y).toBeGreaterThan(150);
  });

  test('displays legal and WAQI attribution after load', async ({ page }) => {
    await expect(page.getByText('Legal & Privacy')).toBeVisible();
    await expect(page.getByRole('link', { name: 'WAQI' })).toBeVisible();

    await page.getByRole('button', { name: 'Legal & Privacy' }).click();
    await expect(
      page.getByRole('dialog', { name: /Legal Notice and Privacy/i })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close legal notice' }).click();
  });
});
