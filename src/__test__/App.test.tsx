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

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

const API_BASE = 'https://airpollution-mocha.vercel.app/api/fetchData';
const defaultHandlers = [
  rest.get(API_BASE, (req, res, ctx) => {
    const path = req.url.searchParams.get('path');

    if (path === '/v2/latest') {
      return res(
        ctx.json({ results: [{ id: 1, parameter: 'pm25', value: 12 }] })
      );
    }
    if (path === '/v3/countries') {
      return res(ctx.json({ results: [{ code: 'DE', name: 'Germany' }] }));
    }
    if (path === '/v2/averages') {
      return res(ctx.json({ results: [] }));
    }
    return res(ctx.json({ results: [] }));
  }),
];
const server = setupServer(...defaultHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('Shows loading overlay text', async () => {
  render(<App />);
  const loadingText = screen.getByText(/Loading data & map/i);
  expect(loadingText).toBeInTheDocument();
});

describe('Server Error Tests', () => {
  test('Simulate error on /v3/countries', async () => {
    server.use(
      rest.get(API_BASE, (req, res, ctx) => {
        const path = req.url.searchParams.get('path');
        if (path === '/v3/countries') {
          return res(ctx.status(500));
        }
        return res(ctx.json({ results: [] }));
      })
    );

    render(<App />);

    const errorText = await screen.findByText(/No data found/i);
    expect(errorText).toBeInTheDocument();
  });
});
