import { test, expect } from '@playwright/test';

test.describe('MapTheAir App Basic Tests', () => {
  // Runs once before all tests in this describe-block
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait until the network is idle (ensuring the app is fully loaded)
    await page.goto('/');
    // Wait until no network calls are in flight. Adjust timeout if needed.
    await page.waitForLoadState('networkidle');
  });

  // Test #1: Can we load the page and see the loading overlay?
  test('loads the page and shows loading overlay', async ({ page }) => {
    await page.goto('/'); // Because baseURL is set to http://localhost:3000
    // Expect the loading message to be visible initially
    await expect(page.getByText('Loading data & map...')).toBeVisible();
  });

  // Test #2: Ensure dropdowns are on the page (Chart / Country).
  test('renders the Chart and Country dropdowns', async ({ page }) => {
    await page.goto('/');

    // After data has loaded, the Chart dropdown should be visible
    const chartDropdown = page.locator('.chart-dropdown');
    await expect(chartDropdown).toBeVisible();

    // The Country dropdown might appear only after countries are fetched
    // We'll wait for it
    const countryDropdown = page.locator('.country-dropdown');
    await expect(countryDropdown).toBeVisible();
  });

  // Test #3: Switch chart from 'Map View' (2) to 'Scatter Chart' (1)
  test('can switch between map and scatter chart', async ({ page }) => {
    await page.goto('/');

    // Initially, default chart is '2' (Map View) in your code
    // Check if the .map-area is present
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

    // In your code, the link is visible only if mapLoaded === true and chart === '2'
    // Wait for the map to fully load
    const link = page.getByText('Legal & Privacy');

    // Because your default chart is '2' (Map View), eventually link should appear
    // (It appears after setMapLoaded(true))
    await expect(link).toBeVisible();
  });

  // Test #5: Change the country and verify no error is displayed
  // (Or verify the new country data is loaded).
  test('changes country selection without error', async ({ page }) => {
    await page.goto('/');

    const skipButton = page.locator('[data-test-id="button-skip"]');
    await skipButton.click();

    await page.getByLabel('Country').click();
    await page.getByRole('option', { name: 'France' }).click();

    // Wait a bit to let the app fetch new data
    // This is a crude approach; better is to watch a spinner or some request
    await page.waitForTimeout(2000);

    // Ensure we didn't get an "Error fetching data" message
    const errorMessage = page.locator('#message', {
      hasText: 'Error fetching data:',
    });
    await expect(errorMessage).toHaveCount(0);
  });
});
