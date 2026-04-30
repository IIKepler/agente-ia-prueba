# Agente IA Hotelera

Este proyecto es una aplicación web de ejemplo que ofrece un asistente virtual para el sector hotelero.

El agente permite a los usuarios escribir preguntas sobre gestión de hoteles, servicio al huésped, operaciones de hospitalidad y tendencias de F&B, y obtiene una respuesta generada por la API de Google Gemini.

Incluye:
- un formulario de chat en el frontend para enviar preguntas
- un endpoint de API en `app/api/chat/route.ts` que llama a Gemini usando una clave almacenada en `.env.local`
- memoria básica de conversación en el frontend mediante `localStorage` y envío de contexto en cada petición
- enrutamiento simple de modelos: usa `gemini-2.0` para consultas de investigación y `gemini-flash-lite-latest` para respuestas rápidas
- control de throttle en el cliente y límite básico en el servidor para reducir el riesgo de `429 Too Many Requests`
- manejo de errores para mostrar mensajes claros cuando la API de Gemini devuelve problemas de cuota o solicitudes
