/**
 * Genera los iconos de la app sin dependencias: escribe los PNG a mano usando
 * zlib, que ya viene con Node.
 *
 * Son iconos provisorios — un plato sobre el bordó del plan de la nutricionista.
 * Cuando haya identidad visual de verdad, se reemplazan los PNG y este script
 * deja de hacer falta.
 *
 *   node scripts/generar-iconos.mjs
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

const FONDO = [0x7b, 0x2d, 0x42] // bordó del encabezado del plan
const PLATO = [0xf7, 0xf2, 0xf0] // blanco cálido
const COMIDA = [0xe8, 0xa3, 0x3d] // el naranja de los almidones

const tablaCrc = (() => {
  const tabla = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabla[i] = c
  }
  return tabla
})()

function crc32(buf) {
  let c = -1
  for (const byte of buf) c = tablaCrc[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(tipo, datos) {
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length)
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([largo, cuerpo, crc])
}

/** Arma un PNG RGB de 8 bits. `pixeles` es un Buffer de ancho*alto*3. */
function png(ancho, alto, pixeles) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ancho, 0)
  ihdr.writeUInt32BE(alto, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 2 // color RGB
  // 10, 11, 12 quedan en 0: compresión, filtro e interlazado estándar

  // Cada fila del PNG va precedida por un byte que indica su filtro. Usamos 0
  // (sin filtro): el icono es de colores planos y no se gana nada filtrando.
  const conFiltro = Buffer.alloc(alto * (1 + ancho * 3))
  for (let y = 0; y < alto; y++) {
    const origen = y * ancho * 3
    const destino = y * (1 + ancho * 3)
    conFiltro[destino] = 0
    pixeles.copy(conFiltro, destino + 1, origen, origen + ancho * 3)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(conFiltro, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function dibujarIcono(lado) {
  const pixeles = Buffer.alloc(lado * lado * 3)
  const centro = lado / 2
  const radioPlato = lado * 0.3
  const radioComida = lado * 0.17

  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const dx = x - centro + 0.5
      const dy = y - centro + 0.5
      const distancia = Math.hypot(dx, dy)

      let color = FONDO
      if (distancia <= radioComida) color = COMIDA
      else if (distancia <= radioPlato) color = PLATO

      const i = (y * lado + x) * 3
      pixeles[i] = color[0]
      pixeles[i + 1] = color[1]
      pixeles[i + 2] = color[2]
    }
  }
  return png(lado, lado, pixeles)
}

const salidas = [
  // Convenciones de archivo de Next: las inyecta en el <head> solo.
  ['src/app/icon.png', 512],
  // Safari ignora los iconos del manifest para la pantalla de inicio y usa este.
  ['src/app/apple-icon.png', 180],
  // Referenciados desde manifest.ts.
  ['public/icono-192.png', 192],
  ['public/icono-512.png', 512],
]

for (const [ruta, lado] of salidas) {
  const destino = join(RAIZ, ruta)
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, dibujarIcono(lado))
  console.log(`${ruta} (${lado}×${lado})`)
}
