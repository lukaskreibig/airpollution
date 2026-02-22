jest.mock('lottie-react', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="lottie-mock">Lottie Animation Placeholder</div>
  ),
}));

jest.mock('@vercel/analytics/react', () => ({
  __esModule: true,
  Analytics: () => (
    <div data-testid="analytics-mock">Analytics Placeholder</div>
  ),
}));

jest.mock('react-joyride', () => ({
  __esModule: true,
  default: () => <div data-testid="joyride-mock">Joyride Placeholder</div>,
}));

jest.mock('mapbox-gl', () => {
  class FakeMap {
    constructor() {}
    on() {}
    flyTo() {}
    once() {}
    remove() {}
    isStyleLoaded() {
      return true;
    }
    resize() {}
    getSource() {
      return {
        setData: () => {},
      };
    }
  }
  class FakePopup {
    constructor() {}
    setLngLat() {
      return this;
    }
    setHTML() {
      return this;
    }
    addTo() {
      return this;
    }
    remove() {}
  }
  return {
    __esModule: true,
    default: { Map: FakeMap, Popup: FakePopup },
    Map: FakeMap,
    Popup: FakePopup,
    NavigationControl: jest.fn(),
  };
});

jest.mock('react-plotly.js', () => ({
  __esModule: true,
  default: () => <div data-testid="plotly-mock">Mocked Plotly</div>,
}));

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

const originalFetch = global.fetch;
const TEST_ORIGIN = 'http://localhost';

const toUrl = (input: RequestInfo | URL): URL =>
  new URL(
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url,
    TEST_ORIGIN
  );

const makeJsonResponse = (body: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

const defaultFetchMock: jest.MockedFunction<typeof fetch> = jest.fn(
  async (input: RequestInfo | URL) => {
    const url = toUrl(input);
    if (url.pathname !== '/api/fetchData') {
      return makeJsonResponse({});
    }

    const path = url.searchParams.get('path');
    if (path === '/v2/latest') {
      return makeJsonResponse({
        results: [{ id: 1, parameter: 'pm25', value: 12 }],
      });
    }
    if (path === '/v3/countries') {
      return makeJsonResponse({
        results: [{ code: 'DE', name: 'Germany' }],
      });
    }
    if (path === '/v2/averages') {
      return makeJsonResponse({ results: [] });
    }
    return makeJsonResponse({ results: [] });
  }
) as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  defaultFetchMock.mockClear();
  global.fetch = defaultFetchMock;
});

afterAll(() => {
  global.fetch = originalFetch;
});

test('Shows loading overlay text', async () => {
  render(<App />);
  const loadingText = screen.getByText(/Loading data & map/i);
  expect(loadingText).toBeInTheDocument();
});

describe('Server Error Tests', () => {
  test('Simulate error on /v3/countries', async () => {
    defaultFetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = toUrl(input);
      const path = url.searchParams.get('path');
      if (path === '/v3/countries') {
        return makeJsonResponse({}, 500);
      }
      return makeJsonResponse({ results: [] });
    });

    render(<App />);

    const errorText = await screen.findByText(/Error fetching data/i);
    expect(errorText).toBeInTheDocument();
  });
});
