export default async function handler(req, res) {
    try {
        // Extract the path and all query parameters
        const { path = '', ...query } = req.query;

        // Build the OpenAQ API URL
        const apiUrl = new URL(`https://api.openaq.org${path}`);

        // Append query parameters, handling comma-separated values
        Object.keys(query).forEach((key) => {
            if (query[key].includes(',')) {
                // Split comma-separated values and append each one individually
                query[key].split(',').forEach((value) => apiUrl.searchParams.append(key, value));
            } else {
                apiUrl.searchParams.append(key, query[key]);
            }
        });

        console.log('Forwarding request to:', apiUrl.toString());

        // Make the request to the OpenAQ API using fetch
        const response = await fetch(apiUrl.toString(), {
            headers: {
                'X-API-Key': '7509e7cd7258ba59a45d64c3d38526da848c98926c1f50bc1c1c19d4aa0a62e3',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error fetching data from OpenAQ API:', errorText);
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data = await response.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data from OpenAQ API:', error.message);
        res.status(500).json({ error: `Failed to fetch data from OpenAQ API: ${error.message}` });
    }
}
