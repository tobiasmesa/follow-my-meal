'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FotoGuardada } from '@/components/foto-guardada'
import { todosLosRegistros } from '@/lib/db'
import { etiquetaFecha } from '@/lib/fecha'
import type { Registro, TipoComida } from '@/lib/types'

const TITULOS: Record<TipoComida, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  colacion: 'Colación',
}

/** Esta es la vista que se le muestra a la nutricionista, así que va cronológica. */
export default function Historial() {
  const [porFecha, setPorFecha] = useState<[string, Registro[]][] | null>(null)

  useEffect(() => {
    todosLosRegistros().then((registros) => {
      const agrupados = new Map<string, Registro[]>()
      for (const registro of registros) {
        const dia = agrupados.get(registro.fecha) ?? []
        dia.push(registro)
        agrupados.set(registro.fecha, dia)
      }
      // Dentro del día, en el orden en que se comió.
      for (const dia of agrupados.values()) {
        dia.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
      }
      setPorFecha([...agrupados.entries()])
    })
  }, [])

  return (
    <>
      <header className="pt-8 pb-5">
        <p className="etiqueta">Tu seguimiento</p>
        <h1 className="titulo mt-1 text-[32px] leading-none font-semibold">Historial</h1>
      </header>

      {!porFecha && <p className="py-10 text-center text-sm text-tinta-suave">Cargando…</p>}

      {porFecha?.length === 0 && (
        <div
          className="rounded-2xl border border-dashed border-borde p-8 text-center"
          style={{ boxShadow: 'var(--sombra)' }}
        >
          <p className="text-[15px] leading-relaxed text-tinta-suave">
            Acá se va a ir armando tu registro, día por día. Es lo que después le
            mostrás a la nutricionista.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-acento px-4 py-2.5 text-sm font-medium text-white dark:text-[#241e1b]"
          >
            Registrar la primera
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {porFecha?.map(([fecha, registros]) => (
          <section key={fecha}>
            <h2 className="titulo mb-2.5 text-lg font-semibold">
              {etiquetaFecha(fecha)}
            </h2>
            <ul className="space-y-2">
              {registros.map((registro) => (
                <li
                  key={registro.id}
                  className="flex items-start gap-3 rounded-2xl border border-borde bg-superficie p-3"
                  style={{ boxShadow: 'var(--sombra)' }}
                >
                  {registro.fotoId && (
                    <FotoGuardada fotoId={registro.fotoId} alt={registro.descripcion} />
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
          </section>
        ))}
      </div>
    </>
  )
}
