import { http, HttpResponse } from 'msw';

// This handler intercepts requests to your API base URL.
// It checks the "path" query parameter to decide what response to send.
export const handlers = [
  http.get(
    'https://airpollution-mocha.vercel.app/api/fetchData',
    ({ request }) => {
      const path = new URL(request.url).searchParams.get('path');
      if (path === '/v2/latest') {
        // Return a sample "latest" data response
        return HttpResponse.json({
          results: [{ id: 1, parameter: 'pm25', value: 12 }],
        });
      }
      if (path === '/v3/countries') {
        // Return a sample countries response
        return HttpResponse.json({
          results: [{ code: 'DE', name: 'Germany' }],
        });
      }
      if (path === '/v2/averages') {
        // Return an empty result for averages by default
        return HttpResponse.json({ results: [] });
      }
      // Fallback response
      return HttpResponse.json({ results: [] });
    }
  ),
];
