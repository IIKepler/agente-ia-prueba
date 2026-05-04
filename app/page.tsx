'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Sparkles, Send, Sun, Moon, Hotel, Utensils, Users, Star } from 'lucide-react'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

type ChatThread = {
  id: string
  question: string
  messages: ChatMessage[]
}

function cleanAssistantText(text: string) {
  return text
    .replace(/\*\*(?:[\s\S]*?)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildChatThreads(messages: ChatMessage[]): ChatThread[] {
  return messages.reduce<ChatThread[]>((threads, message) => {
    if (message.role === 'user') {
      threads.push({ id: message.id, question: message.text, messages: [message] })
    } else if (threads.length > 0) {
      threads[threads.length - 1].messages.push(message)
    }
    return threads
  }, [])
}

export default function HotelAICoach() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const lastRequestRef = useRef<number | null>(null)
  const { theme, resolvedTheme, setTheme } = useTheme()

  const isLoading = status === 'loading'

  const clearHistory = () => {
    setMessages([])
    localStorage.removeItem('hotel-ai-messages')
    setError(null)
  }
  const currentTheme = mounted ? resolvedTheme ?? theme : 'light'

  useEffect(() => {
    setMounted(true)

    const stored = localStorage.getItem('hotel-ai-messages')
    if (stored) {
      try {
        setMessages(JSON.parse(stored))
      } catch {
        localStorage.removeItem('hotel-ai-messages')
      }
    }

    const storedSessionId = localStorage.getItem('hotel-ai-session-id')
    if (storedSessionId) {
      setSessionId(storedSessionId)
    } else {
      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
      localStorage.setItem('hotel-ai-session-id', id)
      setSessionId(id)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('hotel-ai-messages', JSON.stringify(messages))
  }, [messages])

  const threads = useMemo(() => buildChatThreads(messages), [messages])
  const activeThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[threads.length - 1]

  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[threads.length - 1].id)
    }
  }, [threads, selectedThreadId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const now = Date.now()
    if (lastRequestRef.current && now - lastRequestRef.current < 3000) {
      setError('Espera unos segundos antes de enviar otra pregunta.')
      return
    }

    const question = input.trim()
    const userMessageId = `${Date.now()}-user`
    const userMessage: ChatMessage = { id: userMessageId, role: 'user', text: question }
    const updatedMessages = [...messages, userMessage]

    lastRequestRef.current = now
    setError(null)
    setStatus('loading')
    setMessages(updatedMessages)
    setInput('')
    setSelectedThreadId(userMessageId)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          sessionId,
          history: messages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Error en la API de chat')
      }

      const data = await response.json()
      const cleanedText = cleanAssistantText(data.message || '')
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-assistant`, role: 'assistant', text: cleanedText },
      ])
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  const suggestedQuestions = [
    { icon: Hotel, text: '¿Cómo mejorar la ocupación en temporada baja?' },
    { icon: Users, text: '¿Consejos para capacitar al personal de recepción?' },
    { icon: Star, text: '¿Cómo gestionar reseñas negativas?' },
    { icon: Utensils, text: '¿Tendencias en F&B para hoteles 2026?' },
  ]

  const latestResponse = messages.filter((m) => m.role === 'assistant').slice(-1)[0]

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Hotel AI Coach</h1>
              <p className="text-xs text-muted-foreground">Tu asistente de hospitalidad</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary/80"
          >
            {mounted && currentTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {mounted && currentTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 md:py-10">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-3 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Potenciado por IA</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Hotel AI Coach
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Un asistente de hospitalidad con memoria de conversación y respuestas claras para tu equipo.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Card className="shadow-lg border-border/50 bg-card">
              <CardContent className="pb-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">Historial</h3>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground"
                  >
                    Borrar historial
                  </button>
                </div>
                <div className="space-y-2 max-h-[64vh] overflow-y-auto pr-1">
                  {threads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tu historial aparecerá aquí mientras chateas con el AI Coach.</p>
                  ) : (
                    threads.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`w-full rounded-2xl p-3 text-left text-sm transition ${
                          thread.id === selectedThreadId
                            ? 'bg-primary/10 border border-primary text-foreground'
                            : 'bg-secondary/20 border border-secondary/50 text-foreground hover:bg-secondary/30'
                        }`}
                      >
                        <p className="font-medium text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Tú</p>
                        <p className="whitespace-pre-wrap leading-relaxed">{thread.question}</p>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6">
            <Card className="shadow-lg border-border/50">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu pregunta sobre hoteles, hospitalidad o servicio al cliente..."
                    className="min-h-[140px] resize-none text-base bg-background border-input focus:ring-2 focus:ring-ring"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="submit"
                      className="w-full sm:w-auto h-12 text-base font-medium"
                      disabled={isLoading || !input.trim()}
                    >
                      {isLoading ? (
                        <>
                          <Spinner className="mr-2 h-5 w-5" />
                          Generando respuesta...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Obtener Consejo
                        </>
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">Tiempo de respuesta rápido y contextual.</span>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-border/50">
              <CardContent className="pt-6">
                <h3 className="text-base font-semibold text-foreground mb-3">Preguntas sugeridas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q.text)}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left text-sm"
                    >
                      <q.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{q.text}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-border/50 bg-card shadow-lg">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-destructive">No se pudo generar la respuesta</p>
                  <p className="text-sm text-muted-foreground mt-2">{error}</p>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <Card className="border-border/50 bg-card shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-lg">
                      <Spinner className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Analizando tu pregunta...</p>
                      <p className="text-xs text-muted-foreground">El AI Coach está preparando tu consejo personalizado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeThread && (
              <Card className="border-accent/30 bg-card shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversación</p>
                      <p className="text-xs text-muted-foreground">Haz clic en una pregunta del historial para ver el chat completo.</p>
                    </div>
                    <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Última pregunta</span>
                  </div>
                  <div className="space-y-4">
                    {activeThread.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-2xl p-4 text-sm ${
                          message.role === 'user'
                            ? 'bg-secondary/20 border border-secondary/50 text-foreground'
                            : 'bg-card border border-border/60 text-foreground'
                        }`}
                      >
                        <p className="font-medium text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                          {message.role === 'user' ? 'Tú' : 'AI Coach'}
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Hotel AI Coach — Consejos inteligentes para la industria hotelera
          </p>
        </div>
      </footer>
    </main>
  )
}
