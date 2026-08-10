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
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-semibold">Historial</h1>
        <p className="text-sm text-tenue">Todo lo que registraste, día por día.</p>
      </header>

      {!porFecha && <p className="py-8 text-center text-sm text-tenue">Cargando…</p>}

      {porFecha?.length === 0 && (
        <div className="rounded-xl border border-borde bg-superficie p-6 text-center">
          <p className="text-sm text-tenue">Todavía no registraste ninguna comida.</p>
          <Link href="/" className="mt-2 inline-block text-sm text-carne underline">
            Empezar hoy
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {porFecha?.map(([fecha, registros]) => (
          <section key={fecha}>
            <h2 className="mb-2 text-sm font-semibold text-tenue">
              {etiquetaFecha(fecha)}
            </h2>
            <ul className="space-y-2">
              {registros.map((registro) => (
                <li
                  key={registro.id}
                  className="flex items-start gap-3 rounded-xl border border-borde bg-superficie p-3"
                >
                  {registro.fotoId && (
                    <FotoGuardada fotoId={registro.fotoId} alt={registro.descripcion} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-tenue">
                      {TITULOS[registro.tipo]}
                    </p>
                    <p className="mt-0.5 text-sm break-words">
                      {registro.descripcion || 'Sin descripción'}
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
