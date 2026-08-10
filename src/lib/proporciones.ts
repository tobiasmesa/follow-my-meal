import type { ComponentePlato } from './types'

/**
 * Traduce la composición del plato a arcos de un anillo.
 *
 * La nutricionista dibuja cada comida como un plato con arcos de colores: el
 * martes es medio plato de almidones, un cuarto de verduras y el resto carne.
 * Reproducir ese dibujo hace que el día se lea de un vistazo, sin leer texto.
 *
 * Algunos renglones traen la fracción escrita ("1/2 plato de almidones") y otros
 * no ("1 porción de carne magra chica"). Los que no la traen se reparten lo que
 * sobra, que es exactamente lo que hace ella en el PDF: en el almuerzo del lunes,
 * 1/4 de almidones y 1/2 de verduras dejan un cuarto, y ese cuarto es la carne.
 */

const FRACCIONES: Record<string, number> = {
  '1/4': 0.25,
  '1/2': 0.5,
  '3/4': 0.75,
  '1/3': 1 / 3,
  '2/3': 2 / 3,
}

function fraccionDe(porcion: string): number | null {
  const encontrada = porcion.match(/(\d\/\d)/)
  if (!encontrada) return null
  return FRACCIONES[encontrada[1]] ?? null
}

export interface Arco {
  categoria: ComponentePlato['categoria']
  /** Proporción del plato, de 0 a 1. */
  parte: number
  /** Dónde arranca el arco en la vuelta, de 0 a 1. */
  desde: number
}

export function arcosDelPlato(componentes: ComponentePlato[]): Arco[] {
  const fracciones = componentes.map((c) => fraccionDe(c.porcion))
  const declarado = fracciones.reduce<number>((total, f) => total + (f ?? 0), 0)
  const sinFraccion = fracciones.filter((f) => f === null).length

  // Lo que sobra se reparte entre los renglones que no declaran fracción. Si no
  // hay ninguno, se normaliza para que el anillo cierre igual.
  const resto = Math.max(0, 1 - declarado)
  const porCabeza = sinFraccion > 0 ? resto / sinFraccion : 0
  const escala = sinFraccion === 0 && declarado > 0 ? 1 / declarado : 1

  const partes = componentes.map((_, i) => (fracciones[i] ?? porCabeza) * escala)

  return componentes.map((componente, i) => ({
    categoria: componente.categoria,
    parte: partes[i],
    desde: partes.slice(0, i).reduce((total, parte) => total + parte, 0),
  }))
}
