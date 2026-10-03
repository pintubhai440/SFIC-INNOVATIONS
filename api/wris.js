// api/wris.js

export default async function handler(req, res) {
  // CORS headers set kar rahe hain taaki tumhara Vercel frontend isko block na kare
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Pre-flight request (OPTIONS) ko handle karne ke liye
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Sirf POST request allow karenge kyunki WRIS ke catalog me sab POST hain
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sirf POST requests allowed hain bhai!' });
  }

  try {
    // Frontend (React) se aane wala endpoint aur filter details nikal lo
    const { endpoint, payload } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Frontend se API endpoint missing hai!' });
    }

    // India-WRIS ka Data API URL structure
    const wrisBaseUrl = "https://indiawris.gov.in/wris-api"; // Agar base URL kuch aur hai API docs me toh ise update kar lena
    const targetUrl = `${wrisBaseUrl}${endpoint}`;

    // Vercel yahan se request bhej raha hai browser ka bhesh pehan kar
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
        // 'Authorization': 'Bearer YOUR_API_KEY' // Agar API key required hui future me toh yahan uncomment karke daalna
      },
      // Jo payload frontend se aaya (state, district, date), wahi seedha WRIS ko bhej do
      body: JSON.stringify(payload)
    });

    // Agar WRIS server ne data ki jagah koi error page fek diya
    if (!response.ok) {
      throw new Error(`WRIS bouncer ne rok diya! Status Code: ${response.status}`);
    }

    // Data ko clean JSON me badlo
    const data = await response.json();
    
    // Data successfully tumhare React frontend ko bhej diya
    res.status(200).json(data);

  } catch (error) {
    // Ab frontend par asli bimari (exact error) ka pata chalega
    res.status(500).json({ 
      error: "WRIS se live data nahi mil paya bhai!",
      asli_bimari: error.message 
    });
  }
}
