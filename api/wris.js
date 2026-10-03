// api/wris.js

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let endpoint = '';
    let payload = {};

    // 2. Agar POST request hai, toh Frontend ka data use karo
    if (req.method === 'POST') {
      endpoint = req.body?.endpoint || '/Dataset/Reservoir';
      payload = req.body?.payload || {
        state: "Andhra Pradesh",
        district: "Vizianagaram",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };
    } 
    // 3. Agar browser galti se GET bhej de, toh Default data use karo
    else {
      endpoint = req.query?.endpoint || '/Dataset/Reservoir';
      payload = {
        state: req.query?.state || "Andhra Pradesh",
        district: req.query?.district || "Vizianagaram",
        startDate: req.query?.startDate || new Date().toISOString().split('T')[0],
        endDate: req.query?.endDate || new Date().toISOString().split('T')[0]
      };
    }

    // 4. WRIS Server ko call lagao (Wo humesha POST hi leta hai)
    const wrisBaseUrl = "https://indiawris.gov.in/wris-api"; 
    const targetUrl = `${wrisBaseUrl}${endpoint}`;

    const response = await fetch(targetUrl, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`WRIS bouncer ne rok diya! Status Code: ${response.status}`);
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
