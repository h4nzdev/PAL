export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt } = req.body
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY in environment' })
  }

  try {
    const response = await fetch('https://api.groq.dev/v1/models/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        max_output_tokens: 300,
        temperature: 0.7,
        top_p: 0.95,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const message = data.error?.message || data.error || `Groq API error: ${response.status}`
      return res.status(response.status).json({ error: message })
    }

    const completion =
      data.output?.[0]?.content ||
      data.output?.[0] ||
      data.output_text ||
      data.text ||
      ''

    return res.status(200).json({ completion })
  } catch (error) {
    console.error('Groq API error:', error)
    return res.status(500).json({ error: error.message || 'Failed to fetch from Groq' })
  }
}
