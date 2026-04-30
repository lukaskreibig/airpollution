jest.mock('@vercel/analytics/react', () => ({
  __esModule: true,
  Analytics: () => (
    <div data-testid="analytics-mock">Analytics Placeholder</div>
  ),
}));

jest.mock('maplibre-gl', () => {
  class FakeMap {
    constructor() {}
    on(event: string, _layerOrHandler?: unknown, maybeHandler?: unknown) {
      const handler =
        typeof _layerOrHandler === 'function' ? _layerOrHandler : maybeHandler;
      if (event === 'load' && typeof handler === 'function') {
        setTimeout(() => handler(), 0);
      }
    }
    flyTo() {}
    once() {}
    remove() {}
    addSource() {}
    addLayer() {}
    addControl() {}
    easeTo() {}
    getZoom() {
      return 2;
    }
    getBounds() {
      return {
        getSouthWest: () => ({ lat: -10, lng: -10 }),
        getNorthEast: () => ({ lat: 10, lng: 10 }),
      };
    }
    getCanvas() {
      return { style: {} };
    }
    setFilter() {}
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
    default: {
      Map: FakeMap,
      Popup: FakePopup,
      supported: () => true,
      NavigationControl: jest.fn(),
      ScaleControl: jest.fn(),
    },
    Map: FakeMap,
    Popup: FakePopup,
    NavigationControl: jest.fn(),
    ScaleControl: jest.fn(),
    supported: () => true,
  };
});

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
    if (url.pathname !== '/api/waqi') {
      return makeJsonResponse({});
    }

    return makeJsonResponse({
      status: 'ok',
      data: [
        {
          uid: 1,
          aqi: 42,
          lat: 52.52,
          lon: 13.405,
          station: { name: 'Berlin AQI Station', time: '2026-04-30T12:00:00Z' },
        },
      ],
    });
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
  const loadingText = screen.getByText(/Loading AQI stations/i);
  expect(loadingText).toBeInTheDocument();
});

describe('Server Error Tests', () => {
  test('Simulate error on /api/waqi', async () => {
    defaultFetchMock.mockImplementation(async () =>
      makeJsonResponse({ error: 'WAQI unavailable' }, 500)
    );

    render(<App />);

    const errorText = await screen.findByText(/Error loading AQI data/i);
    expect(errorText).toBeInTheDocument();
  });
});
