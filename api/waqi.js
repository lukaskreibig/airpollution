const WAQI_API_BASE = 'https://api.waqi.info';
const DEFAULT_BOUNDS = '-85,-180,85,180';

function firstValue(value, fallback = '') {
  if (Array.isArray(value)) return firstValue(value[0], fallback);
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function buildWaqiUrl(query, token) {
  const latlng = firstValue(query.latlng, DEFAULT_BOUNDS);
  const url = new URL('/map/bounds/', WAQI_API_BASE);
  url.searchParams.set('latlng', latlng);
  url.searchParams.set('token', token);
  return url;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const token = process.env.WAQI_TOKEN;
    if (!token) {
      res.status(500).json({ error: 'WAQI_TOKEN is not configured.' });
      return;
    }

    const apiUrl = buildWaqiUrl(req.query, token);
    const response = await fetch(apiUrl.toString());
    const payload = await response.text();

    if (!response.ok) {
      res.status(response.status).send(payload);
      return;
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    res.status(200).send(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch WAQI data: ${message}` });
  }
}

