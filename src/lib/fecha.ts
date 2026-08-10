import type { DiaSemana } from './types'

/**
 * Todo lo que sea "qué día es" pasa por acá.
 *
 * La app corre entera en el navegador, así que la hora local del teléfono es la
 * verdad. Lo que hay que evitar es `toISOString()` para derivar el día: eso
 * convierte a UTC y de noche te tira la comida al día siguiente.
 */

const DIAS: DiaSemana[] = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
]

const NOMBRES: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

/** YYYY-MM-DD en hora local. */
export function aFecha(d: Date = new Date()): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function hoy(): string {
  return aFecha()
}

/** Parsea YYYY-MM-DD como fecha local (con `new Date(str)` sería UTC). */
export function desdeFecha(fecha: string): Date {
  const [a, m, d] = fecha.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function diaSemanaDe(fecha: string): DiaSemana {
  return DIAS[desdeFecha(fecha).getDay()]
}

export function nombreDia(dia: DiaSemana): string {
  return NOMBRES[dia]
}

/** "Hoy", "Ayer", o "Martes 12 de agosto". */
export function etiquetaFecha(fecha: string): string {
  if (fecha === hoy()) return 'Hoy'

  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)
  if (fecha === aFecha(ayer)) return 'Ayer'

  const d = desdeFecha(fecha)
  const mes = d.toLocaleDateString('es-AR', { month: 'long' })
  return `${nombreDia(diaSemanaDe(fecha))} ${d.getDate()} de ${mes}`
}

export function sumarDias(fecha: string, dias: number): string {
  const d = desdeFecha(fecha)
  d.setDate(d.getDate() + dias)
  return aFecha(d)
}
