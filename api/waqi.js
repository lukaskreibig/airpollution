const WAQI_API_BASE = 'https://api.waqi.info';
const DEFAULT_BOUNDS = '-85,-180,85,180';
const CACHE_TTL_MS = 60 * 1000;
const waqiCache = new Map();

function firstValue(value, fallback = '') {
  if (Array.isArray(value)) return firstValue(value[0], fallback);
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function buildWaqiUrl(query, token) {
  const latlng = normalizeLatLng(firstValue(query.latlng, DEFAULT_BOUNDS));
  const url = new URL('/map/bounds/', WAQI_API_BASE);
  url.searchParams.set('latlng', latlng);
  url.searchParams.set('token', token);
  return url;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeLatLng(raw) {
  const parts = String(raw)
    .split(',')
    .map((part) => Number.parseFloat(part.trim()));

  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return DEFAULT_BOUNDS;
  }

  const south = clamp(Math.min(parts[0], parts[2]), -85, 85);
  const north = clamp(Math.max(parts[0], parts[2]), -85, 85);
  const west = clamp(Math.min(parts[1], parts[3]), -180, 180);
  const east = clamp(Math.max(parts[1], parts[3]), -180, 180);

  return [south, west, north, east]
    .map((part) => Number(part.toFixed(3)))
    .join(',');
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
    const cacheKey = apiUrl.searchParams.get('latlng') || DEFAULT_BOUNDS;
    const cached = waqiCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-MapTheAir-Cache', 'HIT');
      res.status(200).send(cached.payload);
      return;
    }

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
    waqiCache.set(cacheKey, {
      contentType: contentType || 'application/json',
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload,
    });
    res.setHeader('X-MapTheAir-Cache', 'MISS');

    res.status(200).send(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch WAQI data: ${message}` });
  }
}
