import { rest } from 'msw';

// This handler intercepts requests to your API base URL.
// It checks the "path" query parameter to decide what response to send.
export const handlers = [
  rest.get(
    'https://airpollution-mocha.vercel.app/api/fetchData',
    (req, res, ctx) => {
      const path = req.url.searchParams.get('path');
      if (path === '/v2/latest') {
        // Return a sample "latest" data response
        return res(
          ctx.json({ results: [{ id: 1, parameter: 'pm25', value: 12 }] })
        );
      }
      if (path === '/v3/countries') {
        // Return a sample countries response
        return res(ctx.json({ results: [{ code: 'DE', name: 'Germany' }] }));
      }
      if (path === '/v2/averages') {
        // Return an empty result for averages by default
        return res(ctx.json({ results: [] }));
      }
      // Fallback response
      return res(ctx.json({ results: [] }));
    }
  ),
];
