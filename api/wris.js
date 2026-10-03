// api/wris.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Sarkaari sites ke strict SSL error ko bypass karne ki ninja technique

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

    // React frontend se data nikalna
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

    // Sarkaari format me URL Parameters banana
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

    // Sarkaari server ko call lagana
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`WRIS ne rok diya. Status Code: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ 
      error: "WRIS se live data nahi mil paya bhai!",
      asli_bimari: error.message 
    });
  }
}
