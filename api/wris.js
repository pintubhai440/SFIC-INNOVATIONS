// api/wris.js

export default async function handler(req, res) {
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

    const districtName = payload.district || "Vizianagaram";
    
    // Sarkaari API ko exact wahi parameters do jo unke Swagger tool me chalte hain
    const wrisBaseUrl = "https://indiawris.gov.in";
    const queryParams = new URLSearchParams({
      stateName: payload.state || "Andhra Pradesh",
      districtName: districtName,
      agencyName: "CWC", // Yeh sabse important parameter hai jo missing tha!
      startdate: payload.startDate || "2026-09-26", // Swagger curl jaisa date format
      enddate: payload.endDate || "2026-10-03",
      download: "false",
      page: "1",
      size: "100"
    });

    const targetUrl = `${wrisBaseUrl}${endpoint}?${queryParams.toString()}`;
    console.log("Hitting URL:", targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const data = await response.json();
    
    // Seedha sarkaari server ka asli data frontend ko bhej do
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ 
      error: "Live data fetch nahi ho paya",
      asli_bimari: error.message 
    });
  }
}
