import type { ComidaDelDia, ComidaFija } from './types'

/**
 * Arma una sugerencia concreta eligiendo una opción de cada componente.
 *
 * No hace falta IA para esto: el plan ya trae, para cada renglón del plato, la
 * lista de lo que se puede comer. Sugerir es combinar. Sale instantáneo, funciona
 * sin internet y no manda tus datos a ningún lado.
 */

function alAzar<T>(opciones: T[]): T {
  return opciones[Math.floor(Math.random() * opciones.length)]
}

export interface Sugerencia {
  partes: { porcion: string; eleccion: string; nota?: string }[]
  extras: string[]
}

export function sugerirPlato(comida: ComidaDelDia): Sugerencia {
  const extras: string[] = []
  if (comida.fruta) extras.push('1 fruta')
  if (comida.bebida) extras.push('1 vaso de agua')

  return {
    partes: comida.componentes.map((c) => ({
      porcion: c.porcion,
      eleccion: alAzar(c.opciones),
      nota: c.nota,
    })),
    extras,
  }
}

export function sugerirComidaFija(comida: ComidaFija): Sugerencia {
  return {
    partes: comida.bloques.map((opciones) => ({
      porcion: '',
      eleccion: alAzar(opciones),
    })),
    extras: [],
  }
}

/** Una línea de texto, para copiar o compartir. */
export function sugerenciaATexto(sugerencia: Sugerencia): string {
  const partes = sugerencia.partes.map((p) =>
    p.porcion ? `${p.porcion}: ${p.eleccion}` : p.eleccion,
  )
  return [...partes, ...sugerencia.extras].join(' · ')
}
