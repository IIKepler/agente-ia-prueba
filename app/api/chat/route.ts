import { NextResponse } from 'next/server'

const recentRequests: number[] = []
const THROTTLE_WINDOW_MS = 10_000
const THROTTLE_MAX_REQUESTS = 3

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

  const { question } = await req.json()

  if (!question || typeof question !== 'string') {
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

  async function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function fetchGemini(question: string) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key="+ process.env.GEMINI_API_KEY
    const body = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are a practical startup coach. Give clear, useful, concise advice.\nUser question: ${question}`,
            },
          ],
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

  const response = await fetchGemini(question)

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    return NextResponse.json(
      {
        message:
          response.status === 429
            ? 'Gemini respondió 429: demasiadas solicitudes. Espera unos segundos e inténtalo de nuevo.'
            : `Error desde Gemini: ${response.status} ${response.statusText}`,
        details: errorText,
      },
      { status: response.status }
    )
  }

  const data = await response.json()

  const message =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    'No pude responder ahora.'

  return NextResponse.json({ message })
}
