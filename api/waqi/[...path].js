/**
 * Serverless proxy for every WAQI request.
 * Example call from the client:
 *   /api/waqi/map/bounds?latlng=-85,-180,85,180      → forwards to
 *   https://api.waqi.info/map/bounds?latlng=-85,-180,85,180&token=<TOKEN>
 *
 * All query params are forwarded 1-to-1, and the token is appended/
 * overwritten automatically.
 */

export default async function handler(req, res) {
  try {
    /* ------------------------------------------------------------- */
    /* 1.   Build WAQI URL                                           */
    /* ------------------------------------------------------------- */
    const { path = [], ...query } = req.query; // catch-all segments
    const joinedPath = Array.isArray(path) ? path.join('/') : path;
    const apiUrl = new URL(`https://api.waqi.info/${joinedPath}`);

    // copy query params … supports array & comma-separated variants
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => apiUrl.searchParams.append(key, v));
      } else if (typeof value === 'string' && value.includes(',')) {
        value.split(',').forEach((v) => apiUrl.searchParams.append(key, v));
      } else {
        apiUrl.searchParams.append(key, value);
      }
    });

    // always (over-)write token
    apiUrl.searchParams.set('token', process.env.WAQI_TOKEN || '');

    console.log('[proxy] →', apiUrl.toString());

    /* ------------------------------------------------------------- */
    /* 2.   Forward the request                                      */
    /* ------------------------------------------------------------- */
    const waqiResp = await fetch(apiUrl.toString());

    if (!waqiResp.ok) {
      const txt = await waqiResp.text();
      console.error('[proxy] WAQI error:', txt);
      return res.status(waqiResp.status).json({ error: txt });
    }

    const data = await waqiResp.json();

    // very permissive CORS – adjust if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    console.error('[proxy] Unexpected error:', err);
    res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}
