const { URL } = require('node:url');

const OPENAQ_API_BASE = 'https://api.openaq.org';
const WAQI_API_BASE = 'https://api.waqi.info';
const DEFAULT_WAQI_BOUNDS = '-85,-180,85,180';
const V2_TO_V3_PARAMETER_IDS = {
  pm10: 1,
  pm25: 2,
  o3: 3,
  co: 4,
  no2: 5,
  so2: 6,
};
const V2_LATEST_CACHE_TTL_MS = 60_000;
// Local v2->v3 compatibility can require one v3 request per location; cap to avoid rate limiting.
const V2_LATEST_COMPAT_MAX_LOCATIONS = 40;
const v2LatestCache = new Map();

function firstValue(value, fallback = '') {
  if (Array.isArray(value)) return firstValue(value[0], fallback);
  return typeof value === 'string' ? value : fallback;
}

function listValues(value) {
  if (Array.isArray(value)) return value.flatMap((v) => listValues(v));
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function appendQueryValue(url, key, value) {
  if (Array.isArray(value)) {
    value.forEach((v) => appendQueryValue(url, key, v));
    return;
  }

  if (typeof value !== 'string') return;

  if (value.includes(',')) {
    value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => url.searchParams.append(key, part));
    return;
  }

  url.searchParams.append(key, value);
}

async function fetchOpenAqJson(url, apiKey) {
  const response = await fetch(url.toString(), {
    headers: {
      'X-API-Key': apiKey,
    },
  });

  const payload = await response.text();

  if (!response.ok) {
    const error = new Error(
      `OpenAQ request failed (${response.status}): ${payload.slice(0, 300)}`
    );
    error.status = response.status;
    throw error;
  }

  return JSON.parse(payload);
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const count = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: count }, () => runWorker()));
  return results;
}

async function fetchV2LatestCompat(query, apiKey) {
  const requestedLimit = Number.parseInt(firstValue(query.limit, '2000'), 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(requestedLimit, V2_LATEST_COMPAT_MAX_LOCATIONS))
    : V2_LATEST_COMPAT_MAX_LOCATIONS;
  const countryId = firstValue(query.country_id);
  const requestedParameters = listValues(query.parameter);
  const wantedParameters = requestedParameters.length
    ? requestedParameters
    : ['pm10', 'pm25'];

  const cacheKey = JSON.stringify({
    countryId,
    limit,
    parameters: [...wantedParameters].sort(),
  });
  const cached = v2LatestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const locationsUrl = new URL('/v3/locations', OPENAQ_API_BASE);
  locationsUrl.searchParams.set('countries_id', countryId);
  locationsUrl.searchParams.set('limit', String(limit));

  wantedParameters.forEach((name) => {
    const v3Id = V2_TO_V3_PARAMETER_IDS[name];
    if (v3Id) {
      locationsUrl.searchParams.append('parameters_id', String(v3Id));
    }
  });

  const locationsResponse = await fetchOpenAqJson(locationsUrl, apiKey);
  const locations = Array.isArray(locationsResponse.results)
    ? locationsResponse.results
    : [];

  const compatResults = await mapWithConcurrency(locations, 12, async (loc) => {
    const latestUrl = new URL(`/v3/locations/${loc.id}/latest`, OPENAQ_API_BASE);
    latestUrl.searchParams.set('limit', '100');

    try {
      const latestResponse = await fetchOpenAqJson(latestUrl, apiKey);
      const sensorMap = new Map(
        (loc.sensors || []).map((sensor) => [sensor.id, sensor])
      );

      const measurements = (latestResponse.results || [])
        .map((entry) => {
          const sensor = sensorMap.get(entry.sensorsId);
          const parameter = sensor?.parameter?.name;
          if (!parameter || !wantedParameters.includes(parameter)) {
            return null;
          }

          return {
            parameter,
            value: entry.value,
            lastUpdated: entry.datetime?.utc || '',
            unit: sensor.parameter.units || '',
          };
        })
        .filter(Boolean);

      if (!measurements.length) {
        return null;
      }

      return {
        location: loc.name,
        city: loc.locality || null,
        country: loc.country?.code || '',
        coordinates: {
          latitude: loc.coordinates?.latitude,
          longitude: loc.coordinates?.longitude,
        },
        measurements,
      };
    } catch (error) {
      return null;
    }
  });

  const value = {
    meta: {
      name: 'openaq-v2-latest-compat',
      website: '/',
      page: 1,
      limit,
      found: compatResults.filter(Boolean).length,
    },
    results: compatResults.filter(Boolean),
  };

  v2LatestCache.set(cacheKey, {
    expiresAt: Date.now() + V2_LATEST_CACHE_TTL_MS,
    value,
  });

  return value;
}

module.exports = function setupProxy(app) {
  app.get('/api/waqi', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const token = process.env.WAQI_TOKEN || process.env.REACT_APP_WAQI_TOKEN;
      if (!token) {
        res.status(500).json({ error: 'WAQI_TOKEN is not configured.' });
        return;
      }

      const apiUrl = new URL('/map/bounds/', WAQI_API_BASE);
      apiUrl.searchParams.set(
        'latlng',
        firstValue(req.query.latlng, DEFAULT_WAQI_BOUNDS)
      );
      apiUrl.searchParams.set('token', token);

      const response = await fetch(apiUrl.toString());
      const contentType = response.headers.get('content-type');
      const payload = await response.text();

      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      res.status(response.status).send(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: `Failed to fetch WAQI data: ${message}` });
    }
  });

  app.get('/api/fetchData', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const { path = '', ...query } = req.query;
      const apiKey =
        process.env.OPENAQ_API_KEY || process.env.REACT_APP_OPENAQ_API_KEY;

      if (!apiKey) {
        res.status(500).json({ error: 'OPENAQ_API_KEY is not configured.' });
        return;
      }

      if (path === '/v2/latest') {
        const compatResponse = await fetchV2LatestCompat(query, apiKey);
        res.status(200).json(compatResponse);
        return;
      }

      const apiUrl = new URL(path, OPENAQ_API_BASE);

      Object.entries(query).forEach(([key, value]) => {
        appendQueryValue(apiUrl, key, value);
      });

      const response = await fetch(apiUrl.toString(), {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      const contentType = response.headers.get('content-type');
      const payload = await response.text();

      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      res.status(response.status).send(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res
        .status(500)
        .json({ error: `Failed to fetch data from OpenAQ API: ${message}` });
    }
  });
};
