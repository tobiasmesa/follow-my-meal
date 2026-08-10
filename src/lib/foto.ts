/**
 * Normalización de las fotos antes de guardarlas.
 *
 * Una foto de iPhone llega en HEIC, pesa entre 2 y 8 MB, y trae la orientación
 * en los metadatos EXIF en vez de en los píxeles. Pasarla por un canvas resuelve
 * las tres cosas de una: sale JPEG, sale derecha, y sale pesando ~200 KB.
 *
 * Lo del EXIF importa más de lo que parece: sin `imageOrientation: 'from-image'`
 * todas las fotos verticales del teléfono se guardan acostadas.
 */

const LADO_MAXIMO = 1280
const CALIDAD = 0.8

export async function normalizarFoto(archivo: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' })

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.round(bitmap.width * escala)
  const alto = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar la imagen')
  ctx.drawImage(bitmap, 0, 0, ancho, alto)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', CALIDAD),
  )
  if (!blob) throw new Error('No se pudo procesar la foto')
  return blob
}

/**
 * URL temporal para mostrar un Blob en un `<img>`.
 * Hay que liberarla con `liberarUrl` cuando el componente se desmonta, o la
 * memoria del blob queda retenida.
 */
export function urlDeFoto(blob: Blob): string {
  return URL.createObjectURL(blob)
}

export function liberarUrl(url: string): void {
  URL.revokeObjectURL(url)
}
