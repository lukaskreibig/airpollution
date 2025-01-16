import { test, expect } from '@playwright/test';

test.describe('MapTheAir App Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');
  });

  // Test #1: Can we load the page and see the loading overlay?
  test('loads the page and shows loading overlay', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Loading data & map...')).toBeVisible();
  });

  // Test #2: Ensure dropdowns are on the page (Chart / Country).
  test('renders the Chart and Country dropdowns', async ({ page }) => {
    await page.goto('/');

    const chartDropdown = page.locator('.chart-dropdown');
    await expect(chartDropdown).toBeVisible();

    const countryDropdown = page.locator('.country-dropdown');
    await expect(countryDropdown).toBeVisible();
  });

  // Test #3: Switch chart from 'Map View' (2) to 'Scatter Chart' (1)
  test('can switch between map and scatter chart', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.map-area')).toBeVisible();

    const skipButton = page.locator('[data-test-id="button-skip"]');
    await skipButton.click();

    await page.getByLabel('View').click();
    await page.getByRole('option', { name: 'Scatter Chart' }).click();

    // The map-area should no longer be visible
    await expect(page.locator('.map-area')).toHaveCount(0);

    // Instead, we should see the Plotly chart
    const chartArea = page.locator('.chart-area');
    await expect(chartArea).toBeVisible();
  });

  // Test #4: Check that "Legal & Privacy" link only appears when the map is loaded
  test('displays "Legal & Privacy" link only after map is loaded', async ({
    page,
  }) => {
    await page.goto('/');

    const link = page.getByText('Legal & Privacy');

    await expect(link).toBeVisible();
  });

  // Test #5: Change the country and verify no error is displayed
  test('changes country selection without error', async ({ page }) => {
    await page.goto('/');

    const skipButton = page.locator('[data-test-id="button-skip"]');
    await skipButton.click();

    await page.getByLabel('Country').click();
    await page.getByRole('option', { name: 'France' }).click();

    const errorMessage = page.locator('#message', {
      hasText: 'Error fetching data:',
    });
    await expect(errorMessage).toHaveCount(0);
  });
});
