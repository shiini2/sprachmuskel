// AI Provider abstraction - supports Claude API, Ollama (free local), and Groq (free fast)

export interface AIResponse {
  content: string
  provider: 'claude' | 'ollama' | 'groq'
}

export interface AIProvider {
  generate(prompt: string): Promise<AIResponse>
}

// Claude API Provider (costs ~$0.01-0.03 per request)
class ClaudeProvider implements AIProvider {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || ''
  }

  async generate(prompt: string): Promise<AIResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Cheapest, fastest model
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    return {
      content: data.content[0].text,
      provider: 'claude',
    }
  }
}

// Ollama Provider (FREE - runs locally)
class OllamaProvider implements AIProvider {
  private baseUrl: string
  private model: string

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    this.model = process.env.OLLAMA_MODEL || 'llama3.2'
  }

  async generate(prompt: string): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1024,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama error: ${error}`)
    }

    const data = await response.json()
    return {
      content: data.response,
      provider: 'ollama',
    }
  }
}

// Groq Provider (FREE & extremely fast)
class GroqProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || ''
    this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant' // Fast & good quality
  }

  async generate(prompt: string): Promise<AIResponse> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Groq API error: ${error}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      provider: 'groq',
    }
  }
}

// Factory function to get the configured provider
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'ollama'

  if (provider === 'groq') {
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not set, falling back to Ollama')
      return new OllamaProvider()
    }
    return new GroqProvider()
  }

  if (provider === 'claude') {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not set, falling back to Ollama')
      return new OllamaProvider()
    }
    return new ClaudeProvider()
  }

  return new OllamaProvider()
}

// Helper to parse JSON from AI response (handles markdown code blocks)
export function parseAIResponse<T>(response: AIResponse): T {
  let content = response.content.trim()

  // Remove markdown code blocks if present
  if (content.startsWith('```json')) {
    content = content.slice(7)
  } else if (content.startsWith('```')) {
    content = content.slice(3)
  }
  if (content.endsWith('```')) {
    content = content.slice(0, -3)
  }

  content = content.trim()

  try {
    return JSON.parse(content)
  } catch (error) {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error(`Failed to parse AI response as JSON: ${content}`)
  }
}
