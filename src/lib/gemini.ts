import type { ComidaDelDia } from './types'

/**
 * Ideas de comida generadas a partir de la composición del plato del día.
 *
 * La combinatoria de `sugerencias.ts` te dice *qué* elegir ("arroz · ensalada ·
 * pollo"); esto te dice *cómo armarlo*, que es lo que uno realmente necesita
 * parado frente a la heladera. Es opcional: sin clave cargada, la app usa la
 * sugerencia local y no se entera de que esto existe.
 *
 * La clave vive en el localStorage del dispositivo y se carga desde Ajustes.
 * Como no hay backend, la llamada sale del navegador y la clave viaja en la URL
 * de la request — es tu clave en tu teléfono, pero conviene saberlo, y por eso
 * Ajustes lo dice explícitamente.
 *
 * Se usa la API REST en vez del SDK: es una sola llamada y así no entra una
 * dependencia pensada para servidor en el bundle del cliente.
 */

const CLAVE = 'gemini-api-key'

// Anclado a un modelo estable y barato a propósito. La familia 3.x cambió de
// nombre varias veces; si se actualiza, chequear primero el listado oficial.
const MODELO = 'gemini-2.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`

export interface Idea {
  titulo: string
  comoArmarlo: string
}

// El localStorage es un sistema externo a React: se lee con useSyncExternalStore
// (ver `usar-clave.ts`) y por eso hace falta avisar cuando cambia.
const oyentes = new Set<() => void>()

export function suscribirClave(avisar: () => void): () => void {
  oyentes.add(avisar)
  return () => {
    oyentes.delete(avisar)
  }
}

export function leerClave(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(CLAVE)
}

export function guardarClave(clave: string): void {
  const limpia = clave.trim()
  if (limpia) window.localStorage.setItem(CLAVE, limpia)
  else window.localStorage.removeItem(CLAVE)
  for (const avisar of oyentes) avisar()
}

function describirPlato(comida: ComidaDelDia): string {
  const renglones = comida.componentes.map((componente) => {
    const nota = componente.nota ? ` (${componente.nota.toLowerCase()})` : ''
    return `- ${componente.porcion}${nota}. Opciones permitidas: ${componente.opciones.join(', ')}.`
  })
  const extras = [comida.fruta && '1 fruta', comida.bebida && '1 vaso de agua']
    .filter(Boolean)
    .join(' y ')
  return [...renglones, extras && `- Además: ${extras}.`].filter(Boolean).join('\n')
}

export async function generarIdeas(
  comida: ComidaDelDia,
  tipo: 'almuerzo' | 'cena',
): Promise<Idea[]> {
  const clave = leerClave()
  if (!clave) throw new Error('Cargá tu clave de Gemini en Ajustes.')

  const prompt = `Sos un cocinero práctico. Un plan nutricional define así el ${tipo} de hoy, por proporciones del plato:

${describirPlato(comida)}

Proponé 3 comidas concretas y distintas entre sí que respeten esas proporciones, usando SOLO alimentos de las listas de opciones permitidas. Cocina argentina de todos los días, ingredientes de supermercado, nada elaborado. Para cada una: un título corto y apetecible, y dos o tres oraciones de cómo armarla. Escribí en español rioplatense, tuteando de vos. No menciones las fracciones ni el plan: hablá de comida.`

  const respuesta = await fetch(`${ENDPOINT}?key=${encodeURIComponent(clave)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            ideas: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  titulo: { type: 'STRING' },
                  comoArmarlo: { type: 'STRING' },
                },
                required: ['titulo', 'comoArmarlo'],
              },
            },
          },
          required: ['ideas'],
        },
      },
    }),
  })

  if (!respuesta.ok) {
    if (respuesta.status === 400 || respuesta.status === 403) {
      throw new Error('La clave no es válida. Revisala en Ajustes.')
    }
    if (respuesta.status === 429) {
      throw new Error('Gemini está limitando las consultas. Probá en un rato.')
    }
    throw new Error('No se pudo consultar a Gemini. Fijate la conexión.')
  }

  const datos = await respuesta.json()
  const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!texto) throw new Error('Gemini no devolvió ninguna idea. Probá de nuevo.')

  // El esquema garantiza la forma del JSON, pero no que los valores tengan
  // sentido, así que se valida antes de mostrarlo.
  const parseado = JSON.parse(texto)
  const ideas: Idea[] = Array.isArray(parseado?.ideas) ? parseado.ideas : []
  return ideas.filter(
    (idea) => typeof idea?.titulo === 'string' && typeof idea?.comoArmarlo === 'string',
  )
}
