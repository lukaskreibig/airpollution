jest.mock('@vercel/analytics/react', () => ({
  __esModule: true,
  Analytics: () => (
    <div data-testid="analytics-mock">Analytics Placeholder</div>
  ),
}));

jest.mock('maplibre-gl', () => {
  class FakeMap {
    on(event: string, _layerOrHandler?: unknown, maybeHandler?: unknown) {
      const handler =
        typeof _layerOrHandler === 'function' ? _layerOrHandler : maybeHandler;
      if (event === 'load' && typeof handler === 'function') {
        setTimeout(() => handler(), 0);
      }
    }

    once() {}

    remove() {}

    addSource() {}

    addLayer() {}

    addControl() {}

    easeTo() {}

    getZoom() {
      return 2;
    }

    getLayer() {
      return { id: 'mock' };
    }

    setLayoutProperty() {}

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
import userEvent from '@testing-library/user-event';
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

const stationDetailFixture = {
  status: 'ok',
  data: {
    aqi: 156,
    idx: 2,
    city: { name: 'Munich AQI Station', geo: [48.137, 11.575] },
    dominentpol: 'pm25',
    iaqi: { pm25: { v: 156 }, o3: { v: 21 } },
    time: { iso: '2026-04-30T12:00:00Z' },
    attributions: [{ name: 'Test Network' }],
    forecast: {
      daily: {
        pm25: [
          { day: '2026-05-01', avg: 120, min: 90, max: 160 },
          { day: '2026-05-02', avg: 100, min: 70, max: 140 },
          { day: '2026-05-03', avg: 80, min: 60, max: 120 },
        ],
      },
    },
  },
};

const defaultFetchMock: jest.MockedFunction<typeof fetch> = jest.fn(
  async (input: RequestInfo | URL) => {
    const url = toUrl(input);
    if (url.pathname !== '/api/waqi') {
      return makeJsonResponse({});
    }

    if (url.searchParams.has('uid')) {
      return makeJsonResponse(stationDetailFixture);
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
        {
          uid: 2,
          aqi: 156,
          lat: 48.137,
          lon: 11.575,
          station: { name: 'Munich AQI Station', time: '2026-04-30T12:00:00Z' },
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

test('shows the loading status while stations load', async () => {
  render(<App />);
  expect(screen.getByText(/Loading AQI stations/i)).toBeInTheDocument();
  await screen.findByText('Berlin AQI Station');
});

test('renders live stations in the rail after load', async () => {
  render(<App />);

  expect(await screen.findByText('Berlin AQI Station')).toBeInTheDocument();
  expect(
    screen.getByRole('listitem', { name: /Munich AQI Station 156 Unhealthy/i })
  ).toBeInTheDocument();
});

test('switches to the insights view', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText('Berlin AQI Station');

  await user.click(screen.getByRole('button', { name: 'Insights' }));

  expect(
    await screen.findByRole('heading', { name: /Air in view is mostly/i })
  ).toBeInTheDocument();
  expect(screen.getByText('Pollution hotspots')).toBeInTheDocument();
  expect(screen.getByText('The AQI spectrum')).toBeInTheDocument();
});

describe('Server Error Tests', () => {
  test('simulate error on /api/waqi', async () => {
    defaultFetchMock.mockImplementation(async () =>
      makeJsonResponse({ error: 'WAQI unavailable' }, 500)
    );

    render(<App />);

    const errorText = await screen.findByText(/Error loading AQI data/i);
    expect(errorText).toBeInTheDocument();
  });
});
