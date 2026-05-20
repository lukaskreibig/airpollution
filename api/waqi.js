const WAQI_API_BASE = 'https://api.waqi.info';
const DEFAULT_BOUNDS = '-85,-180,85,180';
const CACHE_TTL_MS = 60 * 1000;
const DETAIL_CACHE_TTL_MS = 5 * 60 * 1000;
const waqiCache = new Map();

function firstValue(value, fallback = '') {
  if (Array.isArray(value)) return firstValue(value[0], fallback);
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function buildWaqiUrl(query, token) {
  const rawUid = firstValue(query.uid);
  if (rawUid) {
    const uid = normalizeStationUid(rawUid);
    if (!uid) {
      throw httpError(400, 'Invalid WAQI station uid.');
    }

    const stationPath = /^\d+$/.test(uid) ? `@${uid}` : uid;
    const url = new URL(`/feed/${stationPath}/`, WAQI_API_BASE);
    url.searchParams.set('token', token);
    return {
      cacheKey: `station:${uid}`,
      ttl: DETAIL_CACHE_TTL_MS,
      url,
    };
  }

  const latlng = normalizeLatLng(firstValue(query.latlng, DEFAULT_BOUNDS));
  const url = new URL('/map/bounds/', WAQI_API_BASE);
  url.searchParams.set('latlng', latlng);
  url.searchParams.set('token', token);
  return {
    cacheKey: `bounds:${latlng}`,
    ttl: CACHE_TTL_MS,
    url,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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

function normalizeStationUid(raw = '') {
  const uid = String(raw).trim();
  if (!uid) return '';
  return /^[a-zA-Z0-9_-]{1,40}$/.test(uid) ? uid : '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const token = process.env.WAQI_TOKEN;
    if (!token) {
      res.status(500).json({ error: 'WAQI_TOKEN is not configured.' });
      return;
    }

    const request = buildWaqiUrl(req.query, token);
    const cacheKey = request.cacheKey;
    const cached = waqiCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-MapTheAir-Cache', 'HIT');
      res.status(200).send(cached.payload);
      return;
    }

    const response = await fetch(request.url.toString());
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
      expiresAt: Date.now() + request.ttl,
      payload,
    });
    res.setHeader('X-MapTheAir-Cache', 'MISS');

    res.status(200).send(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const statusCode = Number.isInteger(error.statusCode)
      ? error.statusCode
      : 500;
    res.status(statusCode).json({
      error:
        statusCode === 500 ? `Failed to fetch WAQI data: ${message}` : message,
    });
  }
}
