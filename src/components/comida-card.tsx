'use client'

import { useState } from 'react'
import { FotoGuardada } from './foto-guardada'
import { Plato, PuntoCategoria } from './plato'
import { borrarRegistro } from '@/lib/db'
import {
  generarIdeasDeColacion,
  generarIdeasDelPlato,
  generarIdeasFijas,
  type Idea,
} from '@/lib/gemini'
import { useClaveGemini } from '@/lib/usar-clave'
import {
  sugerenciaATexto,
  sugerirComidaFija,
  sugerirDeLista,
  sugerirPlato,
  type Sugerencia,
} from '@/lib/sugerencias'
import type { ComidaDelDia, ComidaFija, Registro, TipoComida } from '@/lib/types'

const TITULOS: Record<TipoComida, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  colacion: 'Colación',
}

type Contenido =
  | { clase: 'plato'; comida: ComidaDelDia }
  | { clase: 'bloques'; comida: ComidaFija }
  | { clase: 'opciones'; opciones: string[] }

export function ComidaCard({
  tipo,
  contenido,
  registros,
  nota,
  onRegistrar,
  onCambio,
}: {
  tipo: TipoComida
  contenido: Contenido
  registros: Registro[]
  /** Regla de la nutricionista que aplica a esta comida en particular. */
  nota?: string
  onRegistrar: () => void
  onCambio: () => void
}) {
  const [sugerencia, setSugerencia] = useState<Sugerencia | null>(null)
  const [ideas, setIdeas] = useState<Idea[] | null>(null)
  const [pensando, setPensando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clave = useClaveGemini()
  const registrada = registros.length > 0
  const conIA = !!clave

  async function sugerir() {
    setError(null)

    if (conIA) {
      setPensando(true)
      try {
        // Cada tipo de comida se pide distinto: el almuerzo y la cena se arman
        // combinando proporciones, mientras que el desayuno y la merienda son
        // bloques fijos y lo que se busca ahí es variedad dentro del criterio.
        setIdeas(
          await (contenido.clase === 'plato'
            ? generarIdeasDelPlato(contenido.comida, tipo as 'almuerzo' | 'cena')
            : tipo === 'colacion'
              ? generarIdeasDeColacion()
              : generarIdeasFijas(tipo as 'desayuno' | 'merienda')),
        )
        setSugerencia(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo generar la idea.')
      } finally {
        setPensando(false)
      }
      return
    }

    setIdeas(null)
    if (contenido.clase === 'plato')
      setSugerencia(sugerirPlato(contenido.comida, sugerencia))
    else if (contenido.clase === 'bloques')
      setSugerencia(sugerirComidaFija(contenido.comida, sugerencia))
    else setSugerencia(sugerirDeLista(contenido.opciones, sugerencia))
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-borde bg-superficie"
      style={{ boxShadow: 'var(--sombra)' }}
    >
      <div className="p-4">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="etiqueta">{TITULOS[tipo]}</h2>
          {registrada && (
            <span className="flex items-center gap-1 rounded-full bg-acento-tenue px-2 py-0.5 text-[11px] text-acento">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="m5 12.5 4.5 4.5L19 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {registros.length > 1 ? `${registros.length} registros` : 'Registrado'}
            </span>
          )}
        </header>

        {contenido.clase === 'plato' && <PlatoDelDia comida={contenido.comida} />}
        {contenido.clase === 'bloques' && <Bloques comida={contenido.comida} />}
        {contenido.clase === 'opciones' && <Opciones opciones={contenido.opciones} />}

        {nota && (
          <p className="mt-3 border-l-2 border-borde pl-3 text-[13px] leading-relaxed text-tinta-suave">
            {nota}
          </p>
        )}

        {sugerencia && (
          <p className="mt-3 rounded-xl bg-superficie-alta px-3.5 py-2.5 text-[13px] leading-relaxed">
            <span className="etiqueta mr-1.5">Probá</span>
            {sugerenciaATexto(sugerencia)}
          </p>
        )}

        {ideas && ideas.length > 0 && (
          <ul className="mt-3 space-y-2">
            {ideas.map((idea, i) => (
              <li key={i} className="rounded-xl bg-superficie-alta px-3.5 py-3">
                <p className="titulo text-[15px] leading-snug font-semibold">
                  {idea.titulo}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-tinta-suave">
                  {idea.comoArmarlo}
                </p>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-3 text-[13px] text-acento">{error}</p>}
      </div>

      {registros.length > 0 && (
        <ul className="border-t border-borde">
          {registros.map((registro) => (
            <li key={registro.id} className="flex items-start gap-3 px-4 py-3">
              {registro.fotoId && (
                <FotoGuardada fotoId={registro.fotoId} alt={registro.descripcion} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-snug break-words">
                  {registro.descripcion || 'Sin descripción'}
                </p>
                <p className="mt-1 text-xs text-tinta-suave tabular-nums">
                  {new Date(registro.creadoEn).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Borrar ${registro.descripcion || 'registro'}`}
                onClick={async () => {
                  await borrarRegistro(registro.id)
                  onCambio()
                }}
                className="-m-1 p-1 text-tinta-suave transition-colors hover:text-acento"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex border-t border-borde">
        <button
          type="button"
          onClick={sugerir}
          disabled={pensando}
          className="flex-1 py-3 text-sm text-tinta-suave transition-colors hover:bg-superficie-alta disabled:opacity-60"
        >
          {pensando ? 'Pensando…' : conIA ? 'Dame ideas' : 'Sugerir'}
        </button>
        <button
          type="button"
          onClick={onRegistrar}
          className="flex-1 border-l border-borde py-3 text-sm font-medium text-acento transition-colors hover:bg-acento-tenue"
        >
          {registrada ? 'Sumar otro' : 'Registrar'}
        </button>
      </div>
    </section>
  )
}

function PlatoDelDia({ comida }: { comida: ComidaDelDia }) {
  return (
    <div className="flex gap-4">
      <Plato componentes={comida.componentes} tamano={72} />
      <div className="min-w-0 flex-1">
        <ul className="space-y-1.5">
          {comida.componentes.map((componente, i) => (
            <li key={i} className="flex gap-2.5">
              <PuntoCategoria categoria={componente.categoria} />
              <details className="min-w-0 flex-1">
                <summary className="cursor-pointer list-none text-[15px] leading-snug">
                  {componente.porcion}
                  {componente.nota && (
                    <span className="ml-1.5 text-xs text-acento">{componente.nota}</span>
                  )}
                </summary>
                <p className="mt-1 text-[13px] leading-relaxed text-tinta-suave">
                  {componente.opciones.join(' · ')}
                </p>
              </details>
            </li>
          ))}
        </ul>
        {(comida.fruta || comida.bebida) && (
          <p className="mt-2 text-[13px] text-tinta-suave">
            {[comida.fruta && '+ 1 fruta', comida.bebida && '1 vaso de agua']
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}

function Bloques({ comida }: { comida: ComidaFija }) {
  return (
    <>
      <p className="mb-2 text-[13px] text-tinta-suave">Una opción de cada bloque</p>
      <ul className="space-y-2">
        {comida.bloques.map((opciones, i) => (
          <li
            key={i}
            className="border-l-2 border-almidones/50 pl-3 text-[15px] leading-snug"
          >
            {opciones.join(' o ')}
          </li>
        ))}
      </ul>
    </>
  )
}

function Opciones({ opciones }: { opciones: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {opciones.map((opcion) => (
        <li
          key={opcion}
          className="rounded-full bg-superficie-alta px-2.5 py-1 text-[13px]"
        >
          {opcion}
        </li>
      ))}
    </ul>
  )
}
