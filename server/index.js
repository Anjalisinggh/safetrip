const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // If you are on Node 18+, you can remove this line and just use fetch directly
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.ORS_API_KEY;
console.log("API KEY:", API_KEY);

app.get('/api/traffic', async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Please provide both start and end query parameters' });
  }

  try {
    const startCoords = start.split(',').map(Number);
    const endCoords = end.split(',').map(Number);

    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates: [startCoords, endCoords]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'OpenRouteService API error', details: errorText });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Fetch error:', err.stack || err.message || err);
    res.status(500).json({ error: 'Failed to fetch traffic data', details: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
