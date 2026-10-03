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
    let endpoint = '/Dataset/Reservoir';
    let payload = {};

    // 2. React frontend se aane wala data pakdo
    if (req.method === 'POST') {
      endpoint = req.body?.endpoint || endpoint;
      payload = req.body?.payload || {};
    } else {
      endpoint = req.query?.endpoint || endpoint;
      payload = req.query || {};
    }

    // 3. Variables set karo (Agar frontend se na aaye, toh default AP ki dates lagao)
    const stateName = payload.state || "Andhra Pradesh";
    const districtName = payload.district || "Vizianagaram";
    const startdate = payload.startDate || new Date().toISOString().split('T')[0];
    const enddate = payload.endDate || new Date().toISOString().split('T')[0];

    // 4. Exactly screenshot ki tarah URL Parameters banao
    const wrisBaseUrl = "https://indiawris.gov.in";
    const queryParams = new URLSearchParams({
      stateName: stateName,
      districtName: districtName,
      // agencyName: "APWRIMS", // Optional: Jo tumhari Excel file me tha
      startdate: startdate,
      enddate: enddate,
      download: "false",
      page: "1",
      size: "100"
    });

    // 5. Final Target URL (e.g., https://indiawris.gov.in/Dataset/Reservoir?stateName=...)
    const targetUrl = `${wrisBaseUrl}${endpoint}?${queryParams.toString()}`;
    console.log("Calling Sarkaari API:", targetUrl); // Vercel logs ke liye

    // 6. Request bhejo, par body ekdum empty rakhna hai jaisa curl me tha (-d '')
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`WRIS ne gussa kiya. Status: ${response.status}`);
    }

    const data = await response.json();
    
    // Screenshot me dikha hai ki successful call hone par bhi kabhi data array empty aa sakta hai
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ 
      error: "WRIS se live data nahi mil paya bhai!",
      asli_bimari: error.message 
    });
  }
}
