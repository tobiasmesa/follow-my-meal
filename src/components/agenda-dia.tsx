'use client'

import { useCallback, useEffect, useState } from 'react'
import { ComidaCard } from './comida-card'
import { RegistrarComida } from './registrar-comida'
import { registrosDelDia } from '@/lib/db'
import { diaSemanaDe } from '@/lib/fecha'
import { PLAN } from '@/lib/plan'
import type { Registro, TipoComida } from '@/lib/types'

/**
 * La agenda de un día: qué toca según el plan y qué se comió realmente.
 *
 * Los almuerzos y cenas cambian con el día de la semana; el desayuno, la
 * merienda y las colaciones son iguales todos los días.
 */

const COMIDAS: TipoComida[] = ['desayuno', 'almuerzo', 'merienda', 'cena', 'colacion']

export function AgendaDia({ fecha }: { fecha: string }) {
  const [registros, setRegistros] = useState<Registro[] | null>(null)
  const [registrando, setRegistrando] = useState<TipoComida | null>(null)

  const cargar = useCallback(() => {
    registrosDelDia(fecha).then(setRegistros)
  }, [fecha])

  useEffect(() => {
    cargar()
  }, [cargar])

  const dia = diaSemanaDe(fecha)
  const de = (tipo: TipoComida) => registros?.filter((r) => r.tipo === tipo) ?? []

  // Las reglas de flexibilidad se muestran donde aplican, no en una pantalla
  // aparte: sirven justo cuando estás decidiendo qué comer.
  const { alternarDesayunoMerienda, intercambiarOpciones } = PLAN.observaciones
  const notaPlato = dia === 'domingo' ? undefined : intercambiarOpciones

  if (!registros) {
    return <p className="py-10 text-center text-sm text-tinta-suave">Cargando…</p>
  }

  const hechas = COMIDAS.filter((tipo) => de(tipo).length > 0).length

  return (
    <>
      <p className="mb-4 text-[13px] text-tinta-suave">
        {hechas === 0
          ? 'Todavía no registraste nada.'
          : `${hechas} de ${COMIDAS.length} registradas.`}
      </p>

      <div className="space-y-3">
        <ComidaCard
          tipo="desayuno"
          contenido={{ clase: 'bloques', comida: PLAN.desayuno }}
          registros={de('desayuno')}
          nota={alternarDesayunoMerienda}
          onRegistrar={() => setRegistrando('desayuno')}
          onCambio={cargar}
        />
        <ComidaCard
          tipo="almuerzo"
          contenido={{ clase: 'plato', comida: PLAN.almuerzo[dia] }}
          registros={de('almuerzo')}
          nota={notaPlato}
          onRegistrar={() => setRegistrando('almuerzo')}
          onCambio={cargar}
        />
        <ComidaCard
          tipo="merienda"
          contenido={{ clase: 'bloques', comida: PLAN.merienda }}
          registros={de('merienda')}
          nota={alternarDesayunoMerienda}
          onRegistrar={() => setRegistrando('merienda')}
          onCambio={cargar}
        />
        <ComidaCard
          tipo="cena"
          contenido={{ clase: 'plato', comida: PLAN.cena[dia] }}
          registros={de('cena')}
          nota={notaPlato}
          onRegistrar={() => setRegistrando('cena')}
          onCambio={cargar}
        />
        <ComidaCard
          tipo="colacion"
          contenido={{ clase: 'opciones', opciones: PLAN.colaciones }}
          registros={de('colacion')}
          onRegistrar={() => setRegistrando('colacion')}
          onCambio={cargar}
        />
      </div>

      {registrando && (
        <RegistrarComida
          fecha={fecha}
          tipo={registrando}
          onGuardado={() => {
            setRegistrando(null)
            cargar()
          }}
          onCerrar={() => setRegistrando(null)}
        />
      )}
    </>
  )
}
