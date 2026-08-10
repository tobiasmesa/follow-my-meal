import type { ComponentePlato, Plan } from './types'

/**
 * El plan de alimentación, transcrito del PDF de la nutricionista.
 *
 * Se carga como datos y no se parsea en la app a propósito: el plan cambia cada
 * varios meses, cuando la nutricionista emite uno nuevo. Armar una subida de PDF
 * con parseo por IA para algo que se usa tres veces al año costaba más de lo que
 * ahorraba. Cuando haya plan nuevo, se reemplaza este archivo.
 *
 * No incluye nombre ni peso: la app no los necesita para funcionar y así los
 * datos de salud identificables no viven en el repositorio.
 */

// Las listas de opciones se repiten entre días, así que van una sola vez.

const ALMIDONES = [
  'Pastas simples (pref. integral)',
  'Arroz (varios)',
  'Porotos (varios)',
  'Trigo (varios)',
  'Garbanzos',
  'Arvejas',
  'Habas',
  'Papa',
  'Batata',
  'Choclo',
  'Sorgo',
  'Quínoa',
  'Cebada perlada',
  'Lentejas',
  'Polenta',
  'Mijo',
  'Amaranto',
  'Medallones de legumbres o cereales (soja, arroz, etc.)',
]

/** Variante más corta que aparece en algunas cenas. */
const ALMIDONES_CENA = [
  'Pastas simples (pref. integral)',
  'Arroz (varios)',
  'Papa',
  'Batata',
  'Choclo',
  'Arvejas',
  'Cebada perlada',
  'Trigo burgol',
  'Polenta',
  'Milanesas de arroz',
  'Medallón de cereales',
  'Mijo',
]

/** Formas de preparación de las verduras. */
const VERDURAS = [
  'Al horno',
  'Al wok',
  'Revuelto',
  'Hervida',
  'Grillé',
  'Al vapor',
  'Ensalada',
  'Tortilla',
]

/** En los días de 3/4 de plato la nutricionista acota las preparaciones. */
const VERDURAS_ABUNDANTES = ['Al horno', 'Al wok', 'Ensalada', 'Hervidas', 'Al vapor']

const CARNE = ['Vaca', 'Pollo', 'Pescado', 'Cerdo']
const CARNE_BLANCA = ['Pollo', 'Pescado']

const PROTEINAS = [
  'Trozos de pollo',
  'Trozos de queso',
  'Atún al natural',
  'Jurel al natural',
  'Bastones de surimi',
  'Fetas de lomito desgrasado',
  'Tiras de salmón',
  'Huevo',
]

const PROTEINA_VEGETAL = [
  'Lentejas',
  'Porotos (varios)',
  'Garbanzos',
  'Arroz (negro, rojo y salvaje)',
  'Tempeh',
  'Quínoa',
  'Tofu',
  'Soja',
  'Habas',
  'Seitán',
  'Soja texturizada',
  'Amaranto',
  'Medallón de legumbres',
  'Sorgo',
]

/** Variante que además incluye milanesa de soja. */
const PROTEINA_VEGETAL_AMPLIA = [...PROTEINA_VEGETAL, 'Milanesa de soja']

// Atajos para no repetir la forma de cada componente.

const almidones = (porcion: string, nota?: string): ComponentePlato => ({
  porcion,
  categoria: 'almidones',
  nota,
  opciones: ALMIDONES,
})

const almidonesCena = (porcion: string, nota?: string): ComponentePlato => ({
  porcion,
  categoria: 'almidones',
  nota,
  opciones: ALMIDONES_CENA,
})

const verduras = (porcion: string, abundante = false): ComponentePlato => ({
  porcion,
  categoria: 'verduras',
  opciones: abundante ? VERDURAS_ABUNDANTES : VERDURAS,
})

const carne = (porcion: string, nota?: string, blanca = false): ComponentePlato => ({
  porcion,
  categoria: 'carne',
  nota,
  opciones: blanca ? CARNE_BLANCA : CARNE,
})

const proteinas = (porcion: string, nota?: string): ComponentePlato => ({
  porcion,
  categoria: 'proteinas',
  nota,
  opciones: PROTEINAS,
})

const proteinaVegetal = (
  porcion: string,
  nota?: string,
  amplia = false,
): ComponentePlato => ({
  porcion,
  categoria: 'proteina-vegetal',
  nota,
  opciones: amplia ? PROTEINA_VEGETAL_AMPLIA : PROTEINA_VEGETAL,
})

/** Todos los almuerzos y cenas suman una fruta y una bebida. */
const conFrutaYBebida = (componentes: ComponentePlato[]) => ({
  componentes,
  fruta: true,
  bebida: true,
})

export const PLAN: Plan = {
  emitidoEl: '09/08/2026',
  profesional: 'Barciocco Mariana Laura — MP 912',

  desayuno: {
    bloques: [
      ['2 rodaja/s de pan lactal integral con queso untable descremado y huevo revuelto'],
      [
        'Infusión con edulcorante con leche descremada (té, mate cocido, café, mate cebado o tereré)',
      ],
    ],
  },

  merienda: {
    bloques: [
      ['Yogur descremado con frutas'],
      ['Vaso/s de jugo de naranja o pomelo exprimido'],
    ],
  },

  almuerzo: {
    lunes: conFrutaYBebida([
      almidones('1/4 plato de almidones'),
      carne('1 porción de carne magra chica'),
      verduras('1/2 plato de verduras'),
    ]),
    martes: conFrutaYBebida([
      almidones('1/2 plato de almidones'),
      verduras('1/4 plato de verduras'),
      carne('1 porción chica de carne magra', 'Desgrasada'),
    ]),
    miercoles: conFrutaYBebida([
      carne('1 porción de carne magra', 'Desgrasada', true),
      almidones('1/4 plato de almidones'),
      verduras('1/4 plato de verduras'),
    ]),
    jueves: conFrutaYBebida([
      carne('1 porción de carne magra', 'Desgrasada', true),
      verduras('1/2 plato de verduras'),
    ]),
    viernes: conFrutaYBebida([
      carne('1 porción de carne magra', 'Desgrasada'),
      almidones('1/4 plato de almidones'),
      verduras('1/4 plato de verduras'),
    ]),
    sabado: conFrutaYBebida([
      verduras('3/4 plato de verduras', true),
      proteinas('1/4 plato de proteínas', 'Tamaño puño'),
    ]),
    domingo: conFrutaYBebida([
      almidones('3/4 plato de almidones'),
      carne('1 porción chica de carne magra', 'Desgrasada'),
    ]),
  },

  cena: {
    lunes: conFrutaYBebida([
      almidones('1/2 plato de almidones'),
      verduras('1/4 plato de verduras'),
      proteinas('1/4 plato de proteínas', 'Tamaño puño'),
    ]),
    martes: conFrutaYBebida([
      proteinaVegetal('1/2 plato de proteína vegetal'),
      almidonesCena('1/4 plato de almidones'),
      verduras('1/4 plato de verduras'),
    ]),
    miercoles: conFrutaYBebida([
      almidones('1/2 plato de almidones'),
      verduras('1/4 plato de verduras'),
      carne('1 porción chica de carne magra', 'Desgrasada'),
    ]),
    jueves: conFrutaYBebida([
      verduras('3/4 plato de verduras', true),
      proteinaVegetal('1/4 plato de proteína vegetal', 'Tamaño puño', true),
    ]),
    viernes: conFrutaYBebida([
      proteinaVegetal('1/4 plato de proteína vegetal', 'Tamaño puño'),
      almidonesCena('1/4 plato de almidones', 'Tamaño puño'),
      verduras('1/2 plato de verduras'),
    ]),
    sabado: conFrutaYBebida([
      carne('1 porción de carne magra', 'Desgrasada'),
      almidones('1/4 plato de almidones'),
      verduras('1/4 plato de verduras'),
    ]),
    domingo: conFrutaYBebida([
      verduras('1/2 plato de verduras'),
      proteinaVegetal('1/2 plato de proteína vegetal', undefined, true),
    ]),
  },

  colaciones: [
    'Pan integral con queso descremado y palta',
    'Ensalada de fruta o fruta a elección',
    'Licuados de fruta con agua',
    'Mix de frutos secos',
    'Pan integral con huevo',
  ],

  observaciones: {
    alternarDesayunoMerienda:
      'Podés alternar los alimentos que forman parte del desayuno con los de la merienda.',
    intercambiarOpciones:
      'De lunes a sábado se pueden intercambiar las opciones, prefiriendo aquellas que lleven 1/2 plato de vegetales.',
    proporcionIdeal: 'El ideal es 1/3 de carbohidratos, 1/3 de proteína y 1/3 de vegetales.',
  },

  condimentosLibres: [
    'Jugo de limón',
    'Hierbas aromáticas',
    'Aceite de oliva',
    'Salsa de soja',
    'Aceto balsámico',
    'Mostaza',
  ],
}
