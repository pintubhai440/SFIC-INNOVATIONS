export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // SAFE WAY TO GET DISTRICT NAME
    // Optional chaining (?.) prevents crash if req.body is undefined
    let districtName = 'Vizianagaram';
    
    if (req.method === 'POST') {
      // Check both nested payload (from InteractiveMapDashboard) or direct body
      districtName = req.body?.payload?.district || req.body?.district || 'Vizianagaram';
    } else if (req.method === 'GET') {
      // Check query string for GET requests
      districtName = req.query?.district || 'Vizianagaram';
    }

    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    
    const endDate = today.toISOString().split('T')[0];
    const startDate = lastMonth.toISOString().split('T')[0];

    const wrisUrl = `https://indiawris.gov.in/Dataset/Reservoir?stateName=Andhra%20Pradesh&districtName=${districtName}&agencyName=APWRIMS&startdate=${startDate}&enddate=${endDate}&download=false&page=1&size=100`;

    const response = await fetch(wrisUrl, {
      method: 'POST', // WRIS govt API requires POST
      headers: {
        'accept': 'application/json',
      },
      body: ''
    });

    if (!response.ok) {
      throw new Error(`WRIS API Error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: 'Data fetch karne me problem aayi', details: error.message });
  }
}
