/**
 * Proxy zu WAQI – moderne Vercel Route Function
 * Aufruf (Client):
 *   /api/fetchData?path=/map/bounds&latlng=...
 */
export async function GET(request) {
  try {
    /* 1) Query zerlegen */
    const { searchParams } = new URL(request.url);
    const apiPath = searchParams.get('path') ?? '';
    const apiURL = new URL(`https://api.waqi.info${apiPath}`);

    /* 2) Query-Parameter übernehmen */
    searchParams.forEach((val, key) => {
      if (key !== 'path') apiURL.searchParams.append(key, val);
    });

    /* 3) Token anhängen / überschreiben */
    apiURL.searchParams.set('token', process.env.WAQI_TOKEN ?? '');

    console.log('[proxy → WAQI]', apiURL.toString());

    /* 4) Weiterleiten (kein Cache) */
    const upstream = await fetch(apiURL, { cache: 'no-store' });
    if (!upstream.ok) {
      const txt = await upstream.text();
      return new Response(JSON.stringify({ error: txt }), {
        status: upstream.status,
        headers: { 'content-type': 'application/json' },
      });
    }

    /* 5) Erfolg */
    const json = await upstream.json();
    return new Response(JSON.stringify(json), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message ?? 'unknown error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
