const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());

app.get('/api/openaq/*', async (req, res) => {
    try {
      const apiUrl = `https://api.openaq.org/v2${req.originalUrl.replace('/api/openaq', '')}`;
      console.log('Forwarding request to:', apiUrl);
  
      const response = await axios.get(apiUrl, {
        headers: {
          'X-API-Key': '7509e7cd7258ba59a45d64c3d38526da848c98926c1f50bc1c1c19d4aa0a62e3',
        },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching data from OpenAQ API:', error.message);
      res.status(500).json({ error: error.message });
    }
  });
  

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
