'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FotoGuardada } from '@/components/foto-guardada'
import { todosLosRegistros } from '@/lib/db'
import { aFecha, desdeFecha, etiquetaFecha, hoy } from '@/lib/fecha'
import type { Registro, TipoComida } from '@/lib/types'

const TITULOS: Record<TipoComida, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  colacion: 'Colación',
}

const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/**
 * El historial como calendario.
 *
 * Es la pantalla que se le muestra a la nutricionista, y una lista de notas no
 * sirve para eso: no se ve la constancia. Con la foto de cada día como celda, un
 * mes entero se lee de un vistazo — dónde comiste bien, dónde no registraste.
 */
export default function Historial() {
  const [registros, setRegistros] = useState<Registro[] | null>(null)
  const [mes, setMes] = useState(() => {
    const d = desdeFecha(hoy())
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [elegido, setElegido] = useState<string | null>(null)

  useEffect(() => {
    todosLosRegistros().then(setRegistros)
  }, [])

  const porFecha = useMemo(() => {
    const mapa = new Map<string, Registro[]>()
    for (const registro of registros ?? []) {
      const dia = mapa.get(registro.fecha) ?? []
      dia.push(registro)
      mapa.set(registro.fecha, dia)
    }
    for (const dia of mapa.values()) {
      dia.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
    }
    return mapa
  }, [registros])

  // La grilla arranca en lunes, así que el desplazamiento del día 1 se corre uno.
  const primero = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const desplazamiento = (primero.getDay() + 6) % 7
  const diasDelMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const celdas = [
    ...Array<null>(desplazamiento).fill(null),
    ...Array.from({ length: diasDelMes }, (_, i) =>
      aFecha(new Date(mes.getFullYear(), mes.getMonth(), i + 1)),
    ),
  ]

  const nombreMes = mes.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const registrosDelMes = celdas.filter(
    (fecha) => fecha && porFecha.has(fecha),
  ).length
  const delDia = elegido ? (porFecha.get(elegido) ?? []) : []

  return (
    <>
      <header className="pt-8 pb-5">
        <p className="etiqueta">Tu seguimiento</p>
        <h1 className="titulo mt-1 text-[32px] leading-none font-semibold">Historial</h1>
      </header>

      {!registros && <p className="py-10 text-center text-sm text-tinta-suave">Cargando…</p>}

      {registros?.length === 0 && (
        <div
          className="rounded-2xl border border-dashed border-borde p-8 text-center"
          style={{ boxShadow: 'var(--sombra)' }}
        >
          <p className="text-[15px] leading-relaxed text-tinta-suave">
            Acá se va a ir armando el calendario con las fotos de lo que comés. Es lo
            que después le mostrás a la nutricionista.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-acento px-4 py-2.5 text-sm font-medium text-white dark:text-[#241e1b]"
          >
            Registrar la primera
          </Link>
        </div>
      )}

      {registros && registros.length > 0 && (
        <>
          <section
            className="rounded-2xl border border-borde bg-superficie p-4"
            style={{ boxShadow: 'var(--sombra)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <FlechaMes
                haciaAtras
                onClick={() =>
                  setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))
                }
              />
              <div className="text-center">
                {/* `capitalize` pondría "Agosto De 2026": solo va la inicial. */}
                <h2 className="titulo text-lg leading-none font-semibold first-letter:uppercase">
                  {nombreMes}
                </h2>
                <p className="mt-1 text-[11px] text-tinta-suave">
                  {registrosDelMes === 0
                    ? 'sin registros'
                    : `${registrosDelMes} ${registrosDelMes === 1 ? 'día' : 'días'}`}
                </p>
              </div>
              <FlechaMes
                onClick={() =>
                  setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))
                }
              />
            </div>

            <div className="grid grid-cols-7 gap-1">
              {INICIALES.map((inicial, i) => (
                <div key={i} className="etiqueta pb-1 text-center">
                  {inicial}
                </div>
              ))}

              {celdas.map((fecha, i) =>
                fecha === null ? (
                  <div key={`hueco-${i}`} />
                ) : (
                  <Celda
                    key={fecha}
                    fecha={fecha}
                    registros={porFecha.get(fecha) ?? []}
                    elegido={elegido === fecha}
                    onElegir={() => setElegido(elegido === fecha ? null : fecha)}
                  />
                ),
              )}
            </div>
          </section>

          {elegido && (
            <section className="mt-4">
              <h2 className="titulo mb-2.5 text-lg font-semibold">
                {etiquetaFecha(elegido)}
              </h2>
              {delDia.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-borde p-5 text-center text-[15px] text-tinta-suave">
                  No registraste nada este día.
                </p>
              ) : (
                <ul className="space-y-2">
                  {delDia.map((registro) => (
                    <li
                      key={registro.id}
                      className="flex items-start gap-3 rounded-2xl border border-borde bg-superficie p-3"
                      style={{ boxShadow: 'var(--sombra)' }}
                    >
                      {registro.fotoId && (
                        <FotoGuardada
                          fotoId={registro.fotoId}
                          alt={registro.descripcion}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="etiqueta">{TITULOS[registro.tipo]}</p>
                        <p className="mt-1 text-[15px] leading-snug break-words">
                          {registro.descripcion || 'Sin descripción'}
                        </p>
                        <p className="mt-1 text-xs text-tinta-suave tabular-nums">
                          {new Date(registro.creadoEn).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </>
  )
}

function Celda({
  fecha,
  registros,
  elegido,
  onElegir,
}: {
  fecha: string
  registros: Registro[]
  elegido: boolean
  onElegir: () => void
}) {
  const dia = desdeFecha(fecha).getDate()
  const esHoy = fecha === hoy()
  const conFoto = registros.find((r) => r.fotoId)
  const tiene = registros.length > 0

  return (
    <button
      type="button"
      onClick={onElegir}
      aria-pressed={elegido}
      aria-label={`${dia}: ${tiene ? `${registros.length} registros` : 'sin registros'}`}
      className={`relative aspect-square overflow-hidden rounded-lg transition-transform active:scale-95 ${
        tiene ? '' : 'border border-dashed border-borde'
      } ${elegido ? 'ring-2 ring-acento ring-offset-1 ring-offset-superficie' : ''}`}
    >
      {conFoto?.fotoId ? (
        <FotoGuardada
          fotoId={conFoto.fotoId}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span
          className={`absolute inset-0 ${tiene ? 'bg-acento-tenue' : ''}`}
          aria-hidden
        />
      )}

      {/* Sin el degradado el número se pierde sobre las fotos claras. */}
      {conFoto && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent"
        />
      )}

      <span
        className={`absolute bottom-0.5 left-1 text-[11px] tabular-nums ${
          conFoto ? 'font-medium text-white' : esHoy ? 'font-bold text-acento' : 'text-tinta-suave'
        }`}
      >
        {dia}
      </span>

      {tiene && !conFoto && (
        <span
          aria-hidden
          className="absolute top-1 right-1 size-1.5 rounded-full bg-acento"
        />
      )}
    </button>
  )
}

function FlechaMes({
  haciaAtras = false,
  onClick,
}: {
  haciaAtras?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={haciaAtras ? 'Mes anterior' : 'Mes siguiente'}
      className="-m-2 p-2 text-tinta-suave transition-colors hover:text-acento"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={haciaAtras ? 'M14.5 6 9 12l5.5 6' : 'M9.5 6l5.5 6-5.5 6'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
