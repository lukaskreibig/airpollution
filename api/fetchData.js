export default async function handler(req, res) {
    try {
        // Construct the OpenAQ API URL
        const apiUrl = `https://api.openaq.org/v2${req.url.replace('/api/openaq', '')}`;
        console.log('Forwarding request to:', apiUrl);

        // Make the request to the OpenAQ API using fetch
        const response = await fetch(apiUrl, {
            headers: {
                'X-API-Key': '7509e7cd7258ba59a45d64c3d38526da848c98926c1f50bc1c1c19d4aa0a62e3',
            },
        });

        // Check if the response is okay (status in the range 200-299)
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        // Parse the JSON data
        const data = await response.json();

        // Set CORS headers and respond with the data
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data from OpenAQ API:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from OpenAQ API' });
    }
}
