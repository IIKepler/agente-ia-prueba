import { NextResponse } from 'next/server'

export async function POST(req: Request) {
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are a practical startup coach. Give clear, useful, concise advice.\nUser question: ${question}`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    return NextResponse.json(
      {
        message: `Error desde Gemini: ${response.status} ${response.statusText}`,
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
