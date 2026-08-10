'use client'

import { useEffect, useRef, useState } from 'react'
import { guardarRegistro } from '@/lib/db'
import { liberarUrl, normalizarFoto, urlDeFoto } from '@/lib/foto'
import { PLAN } from '@/lib/plan'
import type { TipoComida } from '@/lib/types'

const TITULOS: Record<TipoComida, string> = {
  desayuno: 'Registrar desayuno',
  almuerzo: 'Registrar almuerzo',
  merienda: 'Registrar merienda',
  cena: 'Registrar cena',
  colacion: 'Registrar colación',
}

export function RegistrarComida({
  fecha,
  tipo,
  onGuardado,
  onCerrar,
}: {
  fecha: string
  tipo: TipoComida
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [descripcion, setDescripcion] = useState('')
  const [foto, setFoto] = useState<Blob | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputFoto = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (vistaPrevia) liberarUrl(vistaPrevia)
    }
  }, [vistaPrevia])

  async function elegirFoto(archivo: File) {
    setError(null)
    setProcesando(true)
    try {
      const normalizada = await normalizarFoto(archivo)
      if (vistaPrevia) liberarUrl(vistaPrevia)
      setFoto(normalizada)
      setVistaPrevia(urlDeFoto(normalizada))
    } catch {
      setError('No se pudo procesar la foto. Probá con otra.')
    } finally {
      setProcesando(false)
    }
  }

  async function guardar() {
    if (!descripcion.trim() && !foto) {
      setError('Escribí qué comiste o sacale una foto.')
      return
    }
    setGuardando(true)
    try {
      await guardarRegistro(
        { fecha, tipo, descripcion: descripcion.trim() },
        foto ?? undefined,
      )
      onGuardado()
    } catch {
      setError('No se pudo guardar. Intentá de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end bg-black/40">
      <button
        type="button"
        aria-label="Cerrar"
        className="flex-1"
        onClick={onCerrar}
      />
      <div
        className="rounded-t-2xl border-t border-borde bg-background p-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{TITULOS[tipo]}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-sm text-tenue"
          >
            Cancelar
          </button>
        </div>

        <label className="mb-1 block text-sm text-tenue" htmlFor="descripcion">
          ¿Qué comiste?
        </label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          placeholder="Arroz integral con pollo y ensalada"
          className="mb-3 w-full resize-none rounded-lg border border-borde bg-superficie px-3 py-2 outline-none focus:border-carne"
        />

        <input
          ref={inputFoto}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const archivo = e.target.files?.[0]
            if (archivo) elegirFoto(archivo)
          }}
        />

        <div className="mb-3 flex items-center gap-3">
          {vistaPrevia && (
            // Blob local en memoria; next/image no aplica.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vistaPrevia}
              alt="Foto de la comida"
              className="h-20 w-20 rounded-lg object-cover"
            />
          )}
          <button
            type="button"
            onClick={() => inputFoto.current?.click()}
            disabled={procesando}
            className="rounded-lg border border-borde px-3 py-2 text-sm disabled:opacity-50"
          >
            {procesando ? 'Procesando…' : vistaPrevia ? 'Cambiar foto' : '📷 Sacar foto'}
          </button>
        </div>

        <p className="mb-3 text-xs text-tenue">
          Condimentos libres: {PLAN.condimentosLibres.join(', ').toLowerCase()}.
        </p>

        {error && <p className="mb-3 text-sm text-carne">{error}</p>}

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="w-full rounded-lg bg-carne py-3 font-medium text-white disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
