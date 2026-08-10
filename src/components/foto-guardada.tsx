'use client'

import { useEffect, useState } from 'react'
import { obtenerFoto } from '@/lib/db'
import { liberarUrl, urlDeFoto } from '@/lib/foto'

/**
 * Muestra una foto guardada en IndexedDB.
 *
 * Las URLs de objeto retienen el blob en memoria hasta que se las libera, así
 * que la limpieza del efecto no es opcional: sin ella, scrollear el historial
 * va acumulando imágenes que nunca se sueltan.
 */
export function FotoGuardada({ fotoId, alt }: { fotoId: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    let creada: string | null = null

    obtenerFoto(fotoId).then((blob) => {
      if (!blob) return
      if (!vigente) return
      creada = urlDeFoto(blob)
      setUrl(creada)
    })

    return () => {
      vigente = false
      if (creada) liberarUrl(creada)
    }
  }, [fotoId])

  if (!url) return <div className="h-20 w-20 shrink-0 rounded-lg bg-superficie" />

  return (
    // Son blobs locales, no archivos servidos: next/image no aporta nada acá.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="h-20 w-20 shrink-0 rounded-lg object-cover"
      loading="lazy"
    />
  )
}
