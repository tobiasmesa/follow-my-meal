import { PLAN } from './plan'
import type { ComidaDelDia, ComidaFija } from './types'

/**
 * Ideas de comida generadas a partir del plan.
 *
 * La combinatoria de `sugerencias.ts` te dice *qué* elegir ("arroz · ensalada ·
 * pollo"); esto te dice *cómo armarlo*, que es lo que uno necesita parado frente
 * a la heladera. Es opcional: sin clave cargada la app usa la sugerencia local.
 *
 * La clave vive en el localStorage del dispositivo y se carga desde Ajustes.
 * Como no hay backend, la llamada sale del navegador y la clave viaja en la URL
 * de la request — es tu clave en tu teléfono, pero conviene saberlo, y Ajustes
 * lo dice explícitamente.
 *
 * Se usa la API REST y no el SDK: es una sola llamada, y así no entra al bundle
 * del cliente una dependencia pensada para servidor.
 */

const CLAVE = 'gemini-api-key'
const MODELO_ELEGIDO = 'gemini-modelo'
const BASE = 'https://generativelanguage.googleapis.com/v1beta'

/**
 * Google viene renombrando los modelos seguido, así que fijar uno en el código
 * es una bomba de tiempo: cuando lo retiran, la app devuelve 404 y no hay forma
 * de saberlo desde acá. En vez de adivinar, se le pregunta a la API qué hay
 * disponible y se elige el primero de esta lista que exista, prefiriendo los
 * más baratos y rápidos.
 */
const PREFERIDOS = ['flash-lite', 'flash', 'pro']

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
  // El modelo se descubre por clave, así que al cambiarla hay que redescubrirlo.
  window.localStorage.removeItem(MODELO_ELEGIDO)
  for (const avisar of oyentes) avisar()
}

export interface Idea {
  titulo: string
  comoArmarlo: string
}

/** Devuelve el mensaje que da Google, que suele decir exactamente qué pasó. */
async function motivoDelError(respuesta: Response): Promise<string> {
  try {
    const cuerpo = await respuesta.json()
    const mensaje = cuerpo?.error?.message
    if (typeof mensaje === 'string' && mensaje) return mensaje
  } catch {
    // Sin cuerpo JSON no hay nada más que agregar.
  }
  return `Google respondió ${respuesta.status}.`
}

function traducirError(respuesta: Response, motivo: string): Error {
  if (respuesta.status === 400 || respuesta.status === 403) {
    return new Error(`La clave no funciona. ${motivo}`)
  }
  if (respuesta.status === 429) {
    return new Error('Gemini está limitando las consultas. Probá en un rato.')
  }
  return new Error(motivo)
}

async function descubrirModelo(clave: string): Promise<string> {
  const guardado = window.localStorage.getItem(MODELO_ELEGIDO)
  if (guardado) return guardado

  const respuesta = await fetch(`${BASE}/models?key=${encodeURIComponent(clave)}`)
  if (!respuesta.ok) {
    throw traducirError(respuesta, await motivoDelError(respuesta))
  }

  const { models } = await respuesta.json()
  const utiles: string[] = (Array.isArray(models) ? models : [])
    .filter((m) => m?.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => String(m.name).replace(/^models\//, ''))
    // Las variantes experimentales y de vista previa cambian sin aviso.
    .filter((n: string) => !/preview|exp|thinking|image|tts|embedding/i.test(n))

  const elegido =
    PREFERIDOS.map((pista) => utiles.find((n) => n.includes(pista))).find(Boolean) ??
    utiles[0]

  if (!elegido) throw new Error('Tu clave no tiene ningún modelo de texto habilitado.')

  window.localStorage.setItem(MODELO_ELEGIDO, elegido)
  return elegido
}

const ESQUEMA = {
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
} as const

async function pedirIdeas(prompt: string): Promise<Idea[]> {
  const clave = leerClave()
  if (!clave) throw new Error('Cargá tu clave de Gemini en Ajustes.')

  const llamar = async (modelo: string) =>
    fetch(`${BASE}/models/${modelo}:generateContent?key=${encodeURIComponent(clave)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: ESQUEMA,
        },
      }),
    })

  let respuesta = await llamar(await descubrirModelo(clave))

  // Si el modelo cacheado ya no existe, se redescubre y se reintenta una vez.
  if (respuesta.status === 404) {
    window.localStorage.removeItem(MODELO_ELEGIDO)
    respuesta = await llamar(await descubrirModelo(clave))
  }

  if (!respuesta.ok) {
    throw traducirError(respuesta, await motivoDelError(respuesta))
  }

  const datos = await respuesta.json()
  const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!texto) throw new Error('Gemini no devolvió ninguna idea. Probá de nuevo.')

  // El esquema garantiza la forma del JSON, pero no que los valores tengan
  // sentido, así que se valida antes de mostrarlo.
  const ideas: Idea[] = JSON.parse(texto)?.ideas ?? []
  return ideas.filter(
    (idea) => typeof idea?.titulo === 'string' && typeof idea?.comoArmarlo === 'string',
  )
}

const ESTILO =
  'Cocina argentina de todos los días, ingredientes de supermercado, nada elaborado. Para cada una: un título corto y apetecible, y dos o tres oraciones de cómo armarla. Escribí en español rioplatense, tuteando de vos. No menciones el plan ni las fracciones: hablá de comida.'

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

function describirFija(comida: ComidaFija): string {
  return comida.bloques
    .map((opciones, i) => `- Bloque ${i + 1}: ${opciones.join(' o ')}`)
    .join('\n')
}

/**
 * Para el almuerzo y la cena el plan define proporciones y listas cerradas, así
 * que la consigna es combinarlas sin salirse.
 */
export function generarIdeasDelPlato(
  comida: ComidaDelDia,
  tipo: 'almuerzo' | 'cena',
): Promise<Idea[]> {
  return pedirIdeas(
    `Sos un cocinero práctico. Un plan nutricional define así el ${tipo} de hoy, por proporciones del plato:

${describirPlato(comida)}

Proponé 3 comidas concretas y distintas entre sí que respeten esas proporciones, usando SOLO alimentos de las listas de opciones permitidas. ${ESTILO}`,
  )
}

/**
 * El desayuno y la merienda no son proporciones sino bloques con una opción
 * fija, así que pedir "combinaciones" no daría variedad. Acá la consigna es
 * variar respetando el criterio nutricional: el propio plan autoriza alternar
 * desayuno con merienda, y las colaciones marcan qué clase de alimentos entran.
 */
export function generarIdeasFijas(tipo: 'desayuno' | 'merienda'): Promise<Idea[]> {
  const otra = tipo === 'desayuno' ? 'merienda' : 'desayuno'

  return pedirIdeas(
    `Sos un nutricionista práctico. El plan de tu paciente define así el ${tipo}:

${describirFija(PLAN[tipo])}

Y así la ${otra}:

${describirFija(PLAN[otra])}

Regla del plan: ${PLAN.observaciones.alternarDesayunoMerienda}

Como referencia del tipo de alimentos permitidos, estas son las colaciones autorizadas: ${PLAN.colaciones.join('; ')}.

Proponé 3 ${tipo}s distintos entre sí, para variar sin salirse del plan. Respetá el criterio: lácteos y quesos descremados, pan integral, huevo, frutas, frutos secos, infusiones con edulcorante en vez de azúcar. Nada de azúcar agregada, facturas, frituras, fiambres grasos ni ultraprocesados. Mantené porciones parecidas a las del plan. ${ESTILO}`,
  )
}

/** Las colaciones son una lista corta y cerrada: alcanza con variar cómo se arman. */
export function generarIdeasDeColacion(): Promise<Idea[]> {
  return pedirIdeas(
    `Sos un nutricionista práctico. Estas son las colaciones que autoriza el plan de tu paciente:

${PLAN.colaciones.map((c) => `- ${c}`).join('\n')}

Proponé 3 versiones concretas y distintas entre sí, basadas en esas opciones. Sin azúcar agregada ni ultraprocesados, porciones chicas de colación. ${ESTILO}`,
  )
}
