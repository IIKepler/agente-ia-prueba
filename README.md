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

## 🔧 Análisis y Correcciones Realizadas

### Problemas Detectados
1. **Bug en la URL de Gemini API**: El endpoint siempre usaba `gemini-flash-lite-latest` sin importar el modelo seleccionado por `chooseModel()`
2. **Estructura del request incorrecta**: El formato del body no cumplía con la especificación de la API v1beta de Google Gemini
3. **Conflicto de gestores de paquetes**: El proyecto tenía tanto `package-lock.json` como `pnpm-lock.yaml`
4. **Dependencias no instaladas**: Faltaba ejecutar `npm install`

### Soluciones Implementadas
✅ **Corrección de URL dinámica** - La URL ahora usa correctamente el parámetro `model` seleccionado
✅ **Actualización del formato del request** - Cambiado a la estructura v1beta:
   - Antes: `prompt: { text: ... }`
   - Ahora: `contents: [{ parts: [{ text: ... }] }]`
✅ **Configuración correcta de parámetros** - `temperature` y `maxOutputTokens` movidos a `generationConfig`
✅ **Parser mejorado de respuestas** - Mejor manejo de la estructura de respuesta de Gemini API
✅ **Eliminación de conflictos** - Removido `package-lock.json` para usar `npm` como gestor único
✅ **Instalación de dependencias** - Ejecutado `npm install` correctamente

## 🚀 Cómo ejecutar el proyecto

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env.local con:
# GEMINI_API_KEY=tu_clave_api

# Iniciar servidor de desarrollo
npm run dev
```

