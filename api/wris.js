// api/wris.js

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let endpoint = '/Dataset/Reservoir';
    let payload = {};

    if (req.method === 'POST') {
      endpoint = req.body?.endpoint || endpoint;
      payload = req.body?.payload || {};
    } else {
      endpoint = req.query?.endpoint || endpoint;
      payload = req.query || {};
    }

    const stateName = payload.state || "Andhra Pradesh";
    const districtName = payload.district || "Vizianagaram";
    const startdate = payload.startDate || new Date().toISOString().split('T')[0];
    const enddate = payload.endDate || new Date().toISOString().split('T')[0];

    const wrisBaseUrl = "https://indiawris.gov.in";
    const queryParams = new URLSearchParams({
      stateName: stateName,
      districtName: districtName,
      startdate: startdate,
      enddate: enddate,
      download: "false",
      page: "1",
      size: "100"
    });

    const targetUrl = `${wrisBaseUrl}${endpoint}?${queryParams.toString()}`;

    // Sarkaari firewall ko bypass karne ke liye advanced browser headers
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Origin': 'https://indiawris.gov.in',
        'Referer': 'https://indiawris.gov.in/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Sarkaari server ne status diya: ${response.status}`);
    }

    const data = await response.json();
    
    // Agar sarkaari server ne empty array diya, toh hum console me print karayenge
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ 
      error: "Proxy bypass fail ho gaya bhai!",
      asli_bimari: error.message 
    });
  }
}
