export default async function handler(req, res) {
  try {
    const { path = [], ...query } = req.query;
    const joined = Array.isArray(path) ? path.join('/') : path;
    const url = new URL(`https://api.waqi.info/${joined}`);

    Object.entries(query).forEach(([k, v]) => {
      Array.isArray(v)
        ? v.forEach((vv) => url.searchParams.append(k, vv))
        : url.searchParams.append(k, v);
    });

    url.searchParams.set('token', process.env.WAQI_TOKEN ?? '');

    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(await r.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
