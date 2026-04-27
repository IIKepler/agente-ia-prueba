'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Sparkles, Send, Hotel, Utensils, Users, Star } from 'lucide-react'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export default function HotelAICoach() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const isLoading = status === 'loading'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const question = input.trim()
    setError(null)
    setStatus('loading')
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-user`, role: 'user', text: question },
    ])
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Error en la API de chat')
      }

      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-assistant`, role: 'assistant', text: data.message },
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
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Hotel AI Coach</h1>
            <p className="text-xs text-muted-foreground">Tu asistente de hospitalidad</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 md:py-10 max-w-2xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-3 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Potenciado por IA</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
            Pregunta a tu AI Coach
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto text-pretty">
            Obtén consejos expertos sobre gestión hotelera, servicio al huésped y operaciones de hospitalidad.
          </p>
        </div>

        {/* Question Form */}
        <Card className="mb-6 shadow-lg border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta sobre hoteles, hospitalidad, servicio al cliente..."
                className="min-h-[120px] resize-none text-base bg-background border-input focus:ring-2 focus:ring-ring"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium"
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
            </form>
          </CardContent>
        </Card>

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3 text-center">Prueba con estas preguntas:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q.text)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors text-left text-sm"
                >
                  <q.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Response Card */}
        {latestResponse && (
          <Card className="border-accent/30 bg-card shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/20 rounded-lg shrink-0">
                  <Sparkles className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Consejo del AI Coach</p>
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                    {latestResponse.text}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-border/50 bg-card shadow-lg mt-4">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-destructive">No se pudo generar la respuesta</p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
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

        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center">Historial de conversación</p>
            {messages.map((message) => (
              <Card key={message.id} className={`${message.role === 'user' ? 'bg-secondary/30 border-secondary' : 'bg-card border-border/50'}`}>
                <CardContent className="py-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {message.role === 'user' ? 'Tu pregunta' : 'AI Coach'}
                  </p>
                  <div className="text-sm text-foreground whitespace-pre-wrap">{message.text}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
