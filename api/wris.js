export default async function handler(req, res) {
  try {
    // India-WRIS ka official API URL
    const wrisUrl = "https://indiawris.gov.in/api/telemetry/reservoir";

    // Vercel yahan se request bhej raha hai 'Chrome Browser' ka bhesh pehan kar
    const response = await fetch(wrisUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    // Agar WRIS server ne data ki jagah koi error page fek diya
    if (!response.ok) {
      throw new Error(`WRIS Bouncer ne rok diya! Status Code: ${response.status}`);
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
