export default async function handler(req, res) {
  // Standard CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight OPTIONS request from frontend
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let districtName = 'Vizianagaram';
    
    if (req.method === 'POST') {
      districtName = req.body?.payload?.district || req.body?.district || 'Vizianagaram';
    } else if (req.method === 'GET') {
      districtName = req.query?.district || 'Vizianagaram';
    }

    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    
    const endDate = today.toISOString().split('T')[0];
    const startDate = lastMonth.toISOString().split('T')[0];

    // URL Encode in case district name has spaces (e.g. "East Godavari")
    const encodedDistrict = encodeURIComponent(districtName);

    const wrisUrl = `https://indiawris.gov.in/Dataset/Reservoir?stateName=Andhra%20Pradesh&districtName=${encodedDistrict}&agencyName=APWRIMS&startdate=${startDate}&enddate=${endDate}&download=false&page=1&size=100`;

    // ADDED BROWSER HEADERS HERE TO BYPASS GOVT FIREWALL/BOT PROTECTION
    const response = await fetch(wrisUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Connection': 'keep-alive'
      },
      body: ''
    });

    if (!response.ok) {
      throw new Error(`WRIS API ne error diya: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error("Backend Fetch Failed:", error);
    res.status(500).json({ 
      error: 'Data fetch karne me problem aayi', 
      details: error.message 
    });
  }
}
