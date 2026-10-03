// api/wris.js

export default async function handler(req, res) {
  // 1. CORS Headers (Gareebo ka Bouncer)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Pre-flight OPTIONS bypass
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 3. GET aur POST dono ka swagat hai!
    // Agar GET request aayi, toh URL query parameters se data nikalenge
    // Agar POST request aayi, toh body se nikalenge
    const endpoint = req.method === 'POST' ? req.body.endpoint : req.query.endpoint;
    
    // Default payload set kar dete hain taaki GET request me error na aaye
    const payload = req.method === 'POST' ? req.body.payload : {
      state: req.query.state || "Andhra Pradesh",
      district: req.query.district || "Vizianagaram",
      startDate: req.query.startDate || new Date().toISOString().split('T')[0],
      endDate: req.query.endDate || new Date().toISOString().split('T')[0]
    };

    if (!endpoint) {
      // Agar direct koi link khol de bina endpoint bataye
      return res.status(400).json({ error: 'Frontend se API endpoint missing hai bhai!' });
    }

    // 4. India-WRIS ka Data API URL structure
    const wrisBaseUrl = "https://indiawris.gov.in/wris-api"; 
    const targetUrl = `${wrisBaseUrl}${endpoint}`;

    // 5. Hum humesha WRIS ko POST bhejenge, chahe humare paas GET aaye ya POST
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
