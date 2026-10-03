export default async function handler(req, res) {
  try {
    // Yeh India-WRIS ka official URL hai jo tumne bataya tha
    const wrisUrl = "https://indiawris.gov.in/api/telemetry/reservoir";

    // Vercel yahan se India-WRIS ko request bhej raha hai
    const response = await fetch(wrisUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Agar WRIS ko kal ko koi login/API key chahiye hogi toh hum yahan add karenge
      }
    });

    // Data ko clean JSON me badlo
    const data = await response.json();

    // Data successfully tumhare React frontend ko bhej diya
    res.status(200).json(data);

  } catch (error) {
    // Agar net kharab ho ya WRIS server down ho, toh frontend ko error batao
    res.status(500).json({ error: "WRIS se live data nahi mil paya bhai!" });
  }
}
