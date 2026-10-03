export default async function handler(req, res) {
  // CORS headers set karein taaki frontend call block na ho
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Frontend se district name lenge (default Vizianagaram)
    const districtName = req.query.district || req.body.district || 'Vizianagaram';
    
    // Dynamic dates nikalne ke liye (Last 1 month ka data)
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    
    const endDate = today.toISOString().split('T')[0];
    const startDate = lastMonth.toISOString().split('T')[0];

    // WRIS API URL - APWRIMS agency ke sath
    const wrisUrl = `https://indiawris.gov.in/Dataset/Reservoir?stateName=Andhra%20Pradesh&districtName=${districtName}&agencyName=APWRIMS&startdate=${startDate}&enddate=${endDate}&download=false&page=1&size=100`;

    // Govt API ko POST request bhejenge
    const response = await fetch(wrisUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
      },
      body: '' // Body empty rahega jaise curl command me tha
    });

    if (!response.ok) {
      throw new Error(`WRIS API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Frontend ko JSON response bhej dein
    res.status(200).json(data);
    
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: 'Data fetch karne me problem aayi', details: error.message });
  }
}
