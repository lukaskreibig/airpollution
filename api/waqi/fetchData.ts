import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { path = '', ...query } = req.query;
    const joinedPath = Array.isArray(path) ? path.join('/') : path;
    const url = new URL(`https://api.waqi.info/${joinedPath}`);

    Object.entries(query).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((v) => url.searchParams.append(key, v));
      } else if (typeof val === 'string' && val.includes(',')) {
        val.split(',').forEach((v) => url.searchParams.append(key, v));
      } else {
        url.searchParams.append(key, String(val));
      }
    });

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
