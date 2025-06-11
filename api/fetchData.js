/**
 * Serverless proxy for every WAQI request.
 * Example (client):
 *   /api/fetchData?path=/map/bounds&latlng=-85,-180,85,180
 * is forwarded to
 *   https://api.waqi.info/map/bounds?latlng=-85,-180,85,180&token=<TOKEN>
 */

export default async function handler(req, res) {
  try {
    // 1) Path & Query
    const { path = '', ...query } = req.query;
    const apiUrl = new URL(`https://api.waqi.info${path}`);

    // 2) Append all query params (handles arrays + comma-lists)
    Object.entries(query).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((v) => apiUrl.searchParams.append(key, v));
      } else if (typeof val === 'string' && val.includes(',')) {
        val.split(',').forEach((v) => apiUrl.searchParams.append(key, v));
      } else {
        apiUrl.searchParams.append(key, val);
      }
    });

    // 3) Always (over)write token
    apiUrl.searchParams.set('token', process.env.WAQI_TOKEN ?? '');

    console.log('[proxy → WAQI]', apiUrl.toString());

    // 4) Forward
    const resp = await fetch(apiUrl.toString());
    if (!resp.ok) {
      return res.status(resp.status).json({ error: await resp.text() });
    }

    const data = await resp.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    console.error('[proxy] Unexpected error:', err);
    res.status(500).json({ error: err.message ?? 'unknown error' });
  }
}
