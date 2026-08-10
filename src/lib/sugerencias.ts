import type { ComidaDelDia, ComidaFija } from './types'

/**
 * Sugerencia local: elige una opción de cada componente del plato.
 *
 * No hace falta IA para esto — el plan ya trae, para cada renglón, la lista de
 * lo que se puede comer. Es instantáneo, funciona sin internet y sin API key, y
 * es lo que se usa cuando no hay clave de Gemini cargada.
 *
 * Recibe la sugerencia anterior para no repetirla: con listas cortas (la carne
 * magra tiene cuatro opciones) tocar "Sugerir" varias veces devolvía lo mismo
 * una y otra vez.
 */

function alAzarDistinto(opciones: string[], evitar?: string): string {
  const posibles =
    opciones.length > 1 && evitar ? opciones.filter((o) => o !== evitar) : opciones
  return posibles[Math.floor(Math.random() * posibles.length)]
}

export interface Sugerencia {
  partes: { porcion: string; eleccion: string; nota?: string }[]
  extras: string[]
  /** Texto libre cuando la sugerencia viene de Gemini en vez de la combinatoria. */
  idea?: string
}

export function sugerirPlato(
  comida: ComidaDelDia,
  anterior?: Sugerencia | null,
): Sugerencia {
  const extras: string[] = []
  if (comida.fruta) extras.push('1 fruta')
  if (comida.bebida) extras.push('1 vaso de agua')

  return {
    partes: comida.componentes.map((componente, i) => ({
      porcion: componente.porcion,
      eleccion: alAzarDistinto(componente.opciones, anterior?.partes[i]?.eleccion),
      nota: componente.nota,
    })),
    extras,
  }
}

export function sugerirComidaFija(
  comida: ComidaFija,
  anterior?: Sugerencia | null,
): Sugerencia {
  return {
    partes: comida.bloques.map((opciones, i) => ({
      porcion: '',
      eleccion: alAzarDistinto(opciones, anterior?.partes[i]?.eleccion),
    })),
    extras: [],
  }
}

export function sugerirDeLista(
  opciones: string[],
  anterior?: Sugerencia | null,
): Sugerencia {
  return {
    partes: [
      { porcion: '', eleccion: alAzarDistinto(opciones, anterior?.partes[0]?.eleccion) },
    ],
    extras: [],
  }
}

/** Una línea de texto, para mostrar o copiar. */
export function sugerenciaATexto(sugerencia: Sugerencia): string {
  if (sugerencia.idea) return sugerencia.idea
  const partes = sugerencia.partes.map((p) =>
    p.porcion ? `${p.porcion}: ${p.eleccion}` : p.eleccion,
  )
  return [...partes, ...sugerencia.extras].join(' · ')
}
