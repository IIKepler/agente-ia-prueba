import { NextResponse } from 'next/server'

type ChatMessage = {
  id?: string
  role: 'user' | 'assistant'
  text: string
}

const recentRequests: number[] = []
const THROTTLE_WINDOW_MS = 10_000
const THROTTLE_MAX_REQUESTS = 3
const memoryStore = new Map<string, ChatMessage[]>()

function chooseModel(question: string) {
  const lower = question.toLowerCase()
  const researchKeywords = ['investigar', 'buscar', 'web', 'tendencia', 'datos', 'fecha', 'última hora']
  return researchKeywords.some((keyword) => lower.includes(keyword))
    ? 'gemini-2.0'
    : 'gemini-flash-lite-latest'
}

function buildPrompt(question: string, history: ChatMessage[]) {
  const memoryText = history
    .slice(-8)
    .map((message) => `${message.role === 'user' ? 'Usuario' : 'Asistente'}: ${message.text}`)
    .join('\n')

  return `Eres un asistente experto en hotelería y experiencia al huésped. Recuerda el contexto de la conversación anterior y responde con claridad y brevedad.

Contexto de la conversación:
${memoryText}

Pregunta del usuario: ${question}`
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchGemini(prompt: string, model: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
  const body = JSON.stringify({
    temperature: 0.2,
    maxOutputTokens: 512,
    contents: [
      {
        text: prompt,
      },
    ],
  })

  const maxRetries = 2
  let attempt = 0

  while (true) {
    attempt += 1
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    if (response.ok || response.status !== 429 || attempt > maxRetries) {
      return response
    }

    await delay(1000 * attempt)
  }
}

export async function POST(req: Request) {
  const now = Date.now()
  recentRequests.push(now)
  const cutoff = now - THROTTLE_WINDOW_MS
  while (recentRequests.length > 0 && recentRequests[0] < cutoff) {
    recentRequests.shift()
  }

  if (recentRequests.length > THROTTLE_MAX_REQUESTS) {
    return NextResponse.json(
      {
        message:
          'Demasiadas solicitudes en poco tiempo. Espera unos segundos antes de intentar de nuevo.',
      },
      { status: 429 }
    )
  }

  const body = await req.json()
  const question = typeof body.question === 'string' ? body.question : ''
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
  const history = Array.isArray(body.history) ? body.history : []

  if (!question) {
    return NextResponse.json(
      { message: 'La pregunta es obligatoria.' },
      { status: 400 }
    )
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        message:
          'No se encontró la clave GEMINI_API_KEY. Por favor configúrala en .env.local.',
      },
      { status: 500 }
    )
  }

  if (sessionId) {
    memoryStore.set(sessionId, history)
  }

  const model = chooseModel(question)
  const prompt = buildPrompt(question, history)
  const initialResponse = await fetchGemini(prompt, model)

  if (!initialResponse.ok) {
    const errorText = await initialResponse.text().catch(() => '')
    return NextResponse.json(
      {
        message:
          initialResponse.status === 429
            ? 'Gemini respondió 429: demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.'
            : `Error desde Gemini: ${initialResponse.status} ${initialResponse.statusText}`,
        details: errorText,
      },
      { status: initialResponse.status }
    )
  }

  const initialData = await initialResponse.json()
  const finalMessage =
    initialData.candidates?.[0]?.content?.parts?.[0]?.text ||
    'No pude responder ahora. Intenta reformular tu pregunta.'

  return NextResponse.json({ message: finalMessage })
}
