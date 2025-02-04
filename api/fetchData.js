export default async function handler(req, res) {
  try {
    const { latlng, token } = req.query;
    // Construct WAQI API URL
    const apiUrl = new URL('https://api.waqi.info/map/bounds');
    apiUrl.searchParams.append(
      'token',
      token || '5c0b5d3ed39e6f3835ec52a347f4a0243fd7ad6e'
    );
    apiUrl.searchParams.append(
      'latlng',
      latlng || '47.2701,5.8663,55.0992,15.0419'
    );

    console.log('Forwarding request to:', apiUrl.toString());

    // Fetch from WAQI
    const response = await fetch(apiUrl.toString());
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data from WAQI API:', error.message);
    res
      .status(500)
      .json({ error: `Failed to fetch data from WAQI API: ${error.message}` });
  }
}
