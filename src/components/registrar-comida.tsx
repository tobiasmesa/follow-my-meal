'use client'

import { useEffect, useRef, useState } from 'react'
import { guardarRegistro } from '@/lib/db'
import { liberarUrl, normalizarFoto, urlDeFoto } from '@/lib/foto'
import { PLAN } from '@/lib/plan'
import type { TipoComida } from '@/lib/types'

const TITULOS: Record<TipoComida, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  colacion: 'Colación',
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

  // En modo standalone no hay botón de atrás, así que Escape es la única salida
  // por teclado cuando se usa desde la computadora.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Registrar ${TITULOS[tipo].toLowerCase()}`}
      className="fixed inset-0 z-20 flex flex-col justify-end bg-black/35 backdrop-blur-[2px]"
    >
      <button type="button" aria-label="Cerrar" className="flex-1" onClick={onCerrar} />

      <div
        className="rounded-t-3xl border-t border-borde bg-superficie px-4 pt-3 pb-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div aria-hidden className="mx-auto mb-4 h-1 w-9 rounded-full bg-borde" />

        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="titulo text-xl font-semibold">{TITULOS[tipo]}</h2>
          <button type="button" onClick={onCerrar} className="text-sm text-tinta-suave">
            Cancelar
          </button>
        </div>

        <label className="etiqueta mb-1.5 block" htmlFor="descripcion">
          Qué comiste
        </label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          autoFocus
          placeholder="Arroz integral con pollo y ensalada"
          className="mb-3 w-full resize-none rounded-xl border border-borde bg-superficie-alta px-3.5 py-2.5 leading-snug outline-none placeholder:text-tinta-suave/60 focus:border-acento"
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

        <button
          type="button"
          onClick={() => inputFoto.current?.click()}
          disabled={procesando}
          className="mb-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-borde px-3 py-2.5 text-left transition-colors hover:border-acento disabled:opacity-50"
        >
          {vistaPrevia ? (
            // Blob local en memoria; next/image no aplica.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vistaPrevia}
              alt="Foto de la comida"
              className="size-14 rounded-lg object-cover"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-lg bg-superficie-alta text-tinta-suave">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2a2 2 0 0 0 1.7-.9l.6-1a1.5 1.5 0 0 1 1.3-.7h3.4a1.5 1.5 0 0 1 1.3.7l.6 1a2 2 0 0 0 1.7.9h1.2A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="13" r="3.6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
          )}
          <span className="text-sm">
            {procesando
              ? 'Procesando…'
              : vistaPrevia
                ? 'Cambiar la foto'
                : 'Sacar una foto'}
          </span>
        </button>

        <p className="mb-4 text-xs leading-relaxed text-tinta-suave">
          Podés condimentar libre con {PLAN.condimentosLibres.join(', ').toLowerCase()}.
        </p>

        {error && <p className="mb-3 text-sm text-acento">{error}</p>}

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="w-full rounded-xl bg-acento py-3.5 font-medium text-white transition-opacity disabled:opacity-60 dark:text-[#241e1b]"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
