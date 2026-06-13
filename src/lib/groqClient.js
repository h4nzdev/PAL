const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_journey',
      description: 'Create a brand-new project journey when the user wants to start a completely new project',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the new journey/project' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_section',
      description: 'Create a new section or phase inside the current journey',
      parameters: {
        type: 'object',
        properties: {
          name:        { type: 'string', description: 'Section/phase name' },
          description: { type: 'string', description: 'Brief description of what this section covers' },
        },
        required: ['name'],
      },
    },
  },
]

function getApiKey() {
  return localStorage.getItem('pal-groq-key')?.trim() || import.meta.env.VITE_GROQ_API_KEY || ''
}

async function groqFetch(messages, extra = {}) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('No Groq API key — add one in Settings → AI Settings')

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: 400, temperature: 0.7, ...extra }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Groq error ${res.status}`)
  return data
}

// Task-level AI with a custom system prompt (no tools, more tokens)
export async function fetchTaskAIResponse(systemPrompt, conversationMessages) {
  const data = await groqFetch(
    [{ role: 'system', content: systemPrompt }, ...conversationMessages],
    { max_tokens: 900, temperature: 0.72 }
  )
  return data.choices?.[0]?.message?.content?.trim() || ''
}

// Primary call — with tools enabled
export async function fetchGroqResponse(messages) {
  const data = await groqFetch(messages, { tools: AI_TOOLS, tool_choice: 'auto' })
  const choice = data.choices?.[0]
  return {
    content:    choice?.message?.content?.trim() || '',
    toolCalls:  choice?.message?.tool_calls || [],
    rawMessage: choice?.message,
  }
}

// Follow-up after a tool call — no tools, just get a short confirmation text
export async function fetchGroqFollowUp(messages) {
  const data = await groqFetch(messages, { max_tokens: 120 })
  return data.choices?.[0]?.message?.content?.trim() || ''
}
