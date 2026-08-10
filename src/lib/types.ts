/**
 * El plan de la nutricionista no lista comidas concretas: define la *composición
 * del plato*. "Martes al almuerzo" no es un plato, es 1/2 de almidones + 1/4 de
 * verduras + 1 porción chica de carne magra, y vos elegís de cada lista.
 *
 * Por eso el modelo gira alrededor de `ComponentePlato` y no de un título de
 * comida, y por eso cumplir el plan es "armé el plato con estas proporciones",
 * no "comí tal cosa".
 */

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo'

export type TipoComida = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'colacion'

/** Grupo de alimento del componente. Define el color con el que se muestra. */
export type Categoria =
  | 'almidones'
  | 'verduras'
  | 'carne'
  | 'proteinas'
  | 'proteina-vegetal'

/**
 * Un renglón de la composición del plato.
 * Ej: porcion "1/2 plato", categoria "almidones", nota "Tamaño puño".
 */
export interface ComponentePlato {
  porcion: string
  categoria: Categoria
  /** Aclaración de la nutricionista: "Desgrasada", "Tamaño puño". */
  nota?: string
  opciones: string[]
}

/**
 * Desayuno y merienda no varían por día: son bloques y se elige una opción de
 * cada bloque.
 */
export interface ComidaFija {
  bloques: string[][]
}

/** Almuerzo y cena sí varían por día. */
export interface ComidaDelDia {
  componentes: ComponentePlato[]
  /** Casi todos los días suman una fruta y un vaso de agua. */
  fruta: boolean
  bebida: boolean
}

export interface Plan {
  /** Fecha en que la nutricionista emitió el plan (dd/mm/aaaa del PDF). */
  emitidoEl: string
  profesional: string
  desayuno: ComidaFija
  merienda: ComidaFija
  almuerzo: Record<DiaSemana, ComidaDelDia>
  cena: Record<DiaSemana, ComidaDelDia>
  colaciones: string[]
  /** Las reglas de flexibilidad. Se muestran donde aplican, no en una pantalla aparte. */
  observaciones: {
    alternarDesayunoMerienda: string
    intercambiarOpciones: string
    proporcionIdeal: string
  }
  condimentosLibres: string[]
}

/** Lo que efectivamente comió. Texto libre: el plan da el marco, no un menú cerrado. */
export interface Registro {
  id: string
  /** YYYY-MM-DD en hora local. Define a qué día pertenece. */
  fecha: string
  tipo: TipoComida
  descripcion: string
  /** Clave de la foto en el store de blobs. */
  fotoId?: string
  /** Instante real del registro, para ordenar dentro del día. */
  creadoEn: string
}

/** Estado de un tipo de comida en un día, derivado de los registros. */
export type EstadoComida = 'pendiente' | 'registrada'
