'use client'

import { useState } from 'react'
import { FotoGuardada } from './foto-guardada'
import { borrarRegistro } from '@/lib/db'
import {
  sugerenciaATexto,
  sugerirComidaFija,
  sugerirPlato,
  type Sugerencia,
} from '@/lib/sugerencias'
import type { Categoria, ComidaDelDia, ComidaFija, Registro, TipoComida } from '@/lib/types'

const TITULOS: Record<TipoComida, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  colacion: 'Colación',
}

/** El color viene del grupo de alimento, igual que en el plan impreso. */
const COLOR: Record<Categoria, string> = {
  almidones: 'bg-almidones',
  verduras: 'bg-verduras',
  carne: 'bg-carne',
  proteinas: 'bg-proteinas',
  'proteina-vegetal': 'bg-proteina-vegetal',
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
  const registrada = registros.length > 0

  function sugerir() {
    if (contenido.clase === 'plato') setSugerencia(sugerirPlato(contenido.comida))
    else if (contenido.clase === 'bloques')
      setSugerencia(sugerirComidaFija(contenido.comida))
    else
      setSugerencia({
        partes: [
          {
            porcion: '',
            eleccion:
              contenido.opciones[Math.floor(Math.random() * contenido.opciones.length)],
          },
        ],
        extras: [],
      })
  }

  return (
    <section className="rounded-xl border border-borde bg-superficie p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{TITULOS[tipo]}</h2>
        <span className={`text-xs ${registrada ? 'text-verduras' : 'text-tenue'}`}>
          {registrada ? '✓ registrado' : 'pendiente'}
        </span>
      </header>

      {contenido.clase === 'plato' && <Plato comida={contenido.comida} />}
      {contenido.clase === 'bloques' && <Bloques comida={contenido.comida} />}
      {contenido.clase === 'opciones' && <Opciones opciones={contenido.opciones} />}

      {nota && <p className="mt-3 text-xs leading-relaxed text-tenue">{nota}</p>}

      {sugerencia && (
        <p className="mt-3 rounded-lg bg-background px-3 py-2 text-sm">
          <span className="text-tenue">Probá con: </span>
          {sugerenciaATexto(sugerencia)}
        </p>
      )}

      {registros.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-borde pt-3">
          {registros.map((registro) => (
            <li key={registro.id} className="flex items-start gap-3">
              {registro.fotoId && (
                <FotoGuardada fotoId={registro.fotoId} alt={registro.descripcion} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm break-words">
                  {registro.descripcion || 'Sin descripción'}
                </p>
                <p className="mt-0.5 text-xs text-tenue">
                  {new Date(registro.creadoEn).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                type="button"
                aria-label="Borrar registro"
                onClick={async () => {
                  await borrarRegistro(registro.id)
                  onCambio()
                }}
                className="p-1 text-xs text-tenue"
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={sugerir}
          className="flex-1 rounded-lg border border-borde py-2 text-sm"
        >
          Sugerir
        </button>
        <button
          type="button"
          onClick={onRegistrar}
          className="flex-1 rounded-lg bg-carne py-2 text-sm font-medium text-white"
        >
          Registrar
        </button>
      </div>
    </section>
  )
}

function Plato({ comida }: { comida: ComidaDelDia }) {
  return (
    <>
      <ul className="space-y-2">
        {comida.componentes.map((componente, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              aria-hidden
              className={`mt-1 h-4 w-1 shrink-0 rounded-full ${COLOR[componente.categoria]}`}
            />
            <details className="min-w-0 flex-1">
              <summary className="cursor-pointer list-none text-sm">
                <span className="font-medium">{componente.porcion}</span>
                {componente.nota && (
                  <span className="ml-1.5 text-xs text-carne">{componente.nota}</span>
                )}
                <span className="ml-1.5 text-xs text-tenue">
                  ({componente.opciones.length} opciones)
                </span>
              </summary>
              <p className="mt-1 text-xs leading-relaxed text-tenue">
                {componente.opciones.join(' · ')}
              </p>
            </details>
          </li>
        ))}
      </ul>
      {(comida.fruta || comida.bebida) && (
        <p className="mt-2 text-xs text-tenue">
          {[comida.fruta && '+ 1 fruta', comida.bebida && '1 vaso de agua']
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
    </>
  )
}

function Bloques({ comida }: { comida: ComidaFija }) {
  return (
    <>
      <p className="mb-2 text-xs text-tenue">Elegí una opción de cada bloque</p>
      <ul className="space-y-1.5">
        {comida.bloques.map((opciones, i) => (
          <li key={i} className="text-sm leading-relaxed">
            {opciones.join(' o ')}
          </li>
        ))}
      </ul>
    </>
  )
}

function Opciones({ opciones }: { opciones: string[] }) {
  return (
    <ul className="space-y-1.5">
      {opciones.map((opcion) => (
        <li key={opcion} className="text-sm">
          {opcion}
        </li>
      ))}
    </ul>
  )
}
