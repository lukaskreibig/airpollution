export async function GET(
  req: Request,
  { params }: { params: { path?: string[] } }
) {
  try {
    /* 1) Pfad hinter /api/waqi/ zusammensetzen */
    const joined = (params.path ?? []).join('/');
    const target = new URL(`https://api.waqi.info/${joined}`);

    /* 2) Query-Strings 1-zu-1 übernehmen  */
    const src = new URL(req.url);
    src.searchParams.forEach((v, k) => {
      if (k !== 'path') {
        v.includes(',')
          ? v.split(',').forEach((p) => target.searchParams.append(k, p))
          : target.searchParams.append(k, v);
      }
    });

    /* 3) Token garantieren / überschreiben */
    target.searchParams.set('token', process.env.WAQI_TOKEN ?? '');

    console.log('[proxy → WAQI]', target.toString());

    /* 4) Weiterleiten – keine Framework-Cache-Optionen nötig */
    const upstream = await fetch(target.toString(), { cache: 'no-store' });
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: await upstream.text() }), {
        status: upstream.status,
        headers: { 'content-type': 'application/json' },
      });
    }

    /* 5) Erfolg */
    return new Response(await upstream.text(), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    console.error('[proxy] unexpected', e);
    return new Response(
      JSON.stringify({ error: e?.message ?? 'unknown error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
