const GROQ_API_URL = 'https://api.groq.dev/v1/models/groq'

export async function fetchGroqResponse(prompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Missing Groq API key. Set VITE_GROQ_API_KEY in your .env file.')
  }

  const res = await fetch(GROQ_API_URL, {
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

  const data = await res.json()
  if (!res.ok) {
    const message = data.error?.message || data.error || `Groq API request failed with status ${res.status}`
    throw new Error(message)
  }

  return (
    data.output?.[0]?.content ??
    data.output?.[0] ??
    data.output_text ??
    data.text ??
    ''
  )
}
