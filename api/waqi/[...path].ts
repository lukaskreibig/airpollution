import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // path is always an array if present, otherwise undefined
    const { path = [] } = req.query;
    // Get the "path" as an array (or empty)
    const pathArray = Array.isArray(path) ? path : [path];
    // Construct the WAQI endpoint
    const apiPath = pathArray.length ? '/' + pathArray.join('/') : '';
    const url = new URL(`https://api.waqi.info${apiPath}`);

    // Forward all other query params
    Object.entries(req.query).forEach(([key, val]) => {
      if (key === 'path') return; // skip our catch-all param
      if (Array.isArray(val)) {
        val.forEach((v) => url.searchParams.append(key, v));
      } else if (typeof val === 'string' && val.includes(',')) {
        val.split(',').forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.append(key, String(val));
      }
    });

    // Always append/overwrite token
    url.searchParams.set('token', process.env.WAQI_TOKEN ?? '');

    console.log('[proxy → WAQI]', url.toString());

    const resp = await fetch(url.toString());
    const text = await resp.text();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: text });
    }
    const data = JSON.parse(text);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[proxy] Unexpected error:', err);
    res.status(500).json({ error: err.message });
  }
}
