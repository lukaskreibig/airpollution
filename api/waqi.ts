import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // path is "map/bounds", so join with slash
    const path = req.query.path ? `/${req.query.path}` : '';
    const url = new URL(`https://api.waqi.info${path}`);
    Object.entries(req.query).forEach(([k, v]) => {
      if (k === 'path') return;
      url.searchParams.append(k, String(v));
    });
    url.searchParams.set('token', process.env.WAQI_TOKEN ?? '');

    const resp = await fetch(url.toString());
    const text = await resp.text();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: text });
    }
    const data = JSON.parse(text);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
