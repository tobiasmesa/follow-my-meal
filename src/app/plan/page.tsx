'use client'

import { useState } from 'react'
import { diaSemanaDe, hoy, nombreDia } from '@/lib/fecha'
import { PLAN } from '@/lib/plan'
import type { Categoria, ComidaDelDia, DiaSemana } from '@/lib/types'

const DIAS: DiaSemana[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
]

const COLOR: Record<Categoria, string> = {
  almidones: 'bg-almidones',
  verduras: 'bg-verduras',
  carne: 'bg-carne',
  proteinas: 'bg-proteinas',
  'proteina-vegetal': 'bg-proteina-vegetal',
}

export default function PlanPage() {
  const [dia, setDia] = useState<DiaSemana>(() => diaSemanaDe(hoy()))

  return (
    <>
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-semibold">Mi plan</h1>
        <p className="text-sm text-tenue">
          {PLAN.profesional} · {PLAN.emitidoEl}
        </p>
      </header>

      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {DIAS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDia(d)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              d === dia
                ? 'bg-carne text-white'
                : 'border border-borde text-tenue'
            }`}
          >
            {nombreDia(d).slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <Bloque titulo="Desayuno">
          <p className="mb-2 text-xs text-tenue">Elegí una opción de cada bloque</p>
          {PLAN.desayuno.bloques.map((opciones, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {opciones.join(' o ')}
            </p>
          ))}
        </Bloque>

        <Bloque titulo={`Almuerzo · ${nombreDia(dia)}`}>
          <Composicion comida={PLAN.almuerzo[dia]} />
        </Bloque>

        <Bloque titulo="Merienda">
          <p className="mb-2 text-xs text-tenue">Elegí una opción de cada bloque</p>
          {PLAN.merienda.bloques.map((opciones, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {opciones.join(' o ')}
            </p>
          ))}
        </Bloque>

        <Bloque titulo={`Cena · ${nombreDia(dia)}`}>
          <Composicion comida={PLAN.cena[dia]} />
        </Bloque>

        <Bloque titulo="Colaciones">
          <ul className="space-y-1 text-sm">
            {PLAN.colaciones.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Bloque>

        <Bloque titulo="Observaciones">
          <ul className="space-y-2 text-sm leading-relaxed">
            <li>{PLAN.observaciones.alternarDesayunoMerienda}</li>
            <li>{PLAN.observaciones.intercambiarOpciones}</li>
            <li className="font-medium">{PLAN.observaciones.proporcionIdeal}</li>
          </ul>
          <p className="mt-3 text-xs text-tenue">
            Condimentos libres: {PLAN.condimentosLibres.join(', ').toLowerCase()}.
          </p>
        </Bloque>
      </div>
    </>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-borde bg-superficie p-4">
      <h2 className="mb-2 font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

function Composicion({ comida }: { comida: ComidaDelDia }) {
  return (
    <>
      <ul className="space-y-2.5">
        {comida.componentes.map((componente, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              aria-hidden
              className={`mt-1 h-4 w-1 shrink-0 rounded-full ${COLOR[componente.categoria]}`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {componente.porcion}
                {componente.nota && (
                  <span className="ml-1.5 text-xs font-normal text-carne">
                    {componente.nota}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-tenue">
                {componente.opciones.join(' · ')}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {(comida.fruta || comida.bebida) && (
        <p className="mt-2.5 text-xs text-tenue">
          {[comida.fruta && '+ 1 fruta', comida.bebida && '1 vaso de agua']
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
    </>
  )
}
