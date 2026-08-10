'use client'

import { useSyncExternalStore } from 'react'
import { AgendaDia } from '@/components/agenda-dia'
import { diaSemanaDe, hoy, nombreDia } from '@/lib/fecha'

// El reloj del dispositivo es un sistema externo a React, y en el prerender no
// existe: leerlo con la hora del servidor daría el día cambiado. Devolver null
// como snapshot del servidor deja que el primer render coincida y recién en el
// cliente aparezca la fecha real.
const sinSuscripcion = () => () => {}
const enElServidor = () => null

export default function Hoy() {
  const fecha = useSyncExternalStore(sinSuscripcion, hoy, enElServidor)

  return (
    <>
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-semibold">Hoy</h1>
        {fecha && (
          <p className="text-sm text-tenue">
            {nombreDia(diaSemanaDe(fecha))}
            {' · '}
            {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'long',
            })}
          </p>
        )}
      </header>

      {fecha ? (
        <AgendaDia fecha={fecha} />
      ) : (
        <p className="py-8 text-center text-sm text-tenue">Cargando…</p>
      )}
    </>
  )
}
