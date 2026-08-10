'use client'

import { useState } from 'react'
import { Plato, PuntoCategoria } from '@/components/plato'
import { diaSemanaDe, hoy, nombreDia } from '@/lib/fecha'
import { PLAN } from '@/lib/plan'
import type { ComidaDelDia, DiaSemana } from '@/lib/types'

const DIAS: DiaSemana[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
]

export default function PlanPage() {
  const [dia, setDia] = useState<DiaSemana>(() => diaSemanaDe(hoy()))

  return (
    <>
      <header className="pt-8 pb-5">
        <p className="etiqueta">{PLAN.profesional}</p>
        <h1 className="titulo mt-1 text-[32px] leading-none font-semibold">Tu plan</h1>
      </header>

      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {DIAS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDia(d)}
            aria-pressed={d === dia}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              d === dia
                ? 'bg-acento text-white dark:text-[#241e1b]'
                : 'border border-borde text-tinta-suave'
            }`}
          >
            {nombreDia(d).slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <Bloque titulo="Desayuno">
          <p className="mb-2 text-[13px] text-tinta-suave">Una opción de cada bloque</p>
          <ul className="space-y-2">
            {PLAN.desayuno.bloques.map((opciones, i) => (
              <li
                key={i}
                className="border-l-2 border-almidones/50 pl-3 text-[15px] leading-snug"
              >
                {opciones.join(' o ')}
              </li>
            ))}
          </ul>
        </Bloque>

        <Bloque titulo="Almuerzo" sufijo={nombreDia(dia)}>
          <Composicion comida={PLAN.almuerzo[dia]} />
        </Bloque>

        <Bloque titulo="Merienda">
          <p className="mb-2 text-[13px] text-tinta-suave">Una opción de cada bloque</p>
          <ul className="space-y-2">
            {PLAN.merienda.bloques.map((opciones, i) => (
              <li
                key={i}
                className="border-l-2 border-almidones/50 pl-3 text-[15px] leading-snug"
              >
                {opciones.join(' o ')}
              </li>
            ))}
          </ul>
        </Bloque>

        <Bloque titulo="Cena" sufijo={nombreDia(dia)}>
          <Composicion comida={PLAN.cena[dia]} />
        </Bloque>

        <Bloque titulo="Colaciones">
          <ul className="flex flex-wrap gap-1.5">
            {PLAN.colaciones.map((c) => (
              <li
                key={c}
                className="rounded-full bg-superficie-alta px-2.5 py-1 text-[13px]"
              >
                {c}
              </li>
            ))}
          </ul>
        </Bloque>

        <Bloque titulo="Cómo usarlo">
          <ul className="space-y-2.5 text-[15px] leading-relaxed">
            <li>{PLAN.observaciones.alternarDesayunoMerienda}</li>
            <li>{PLAN.observaciones.intercambiarOpciones}</li>
          </ul>
          <p className="titulo mt-4 border-t border-borde pt-3 text-lg leading-snug">
            {PLAN.observaciones.proporcionIdeal}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-tinta-suave">
            Condimentá libre con {PLAN.condimentosLibres.join(', ').toLowerCase()}.
          </p>
        </Bloque>
      </div>
    </>
  )
}

function Bloque({
  titulo,
  sufijo,
  children,
}: {
  titulo: string
  sufijo?: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-2xl border border-borde bg-superficie p-4"
      style={{ boxShadow: 'var(--sombra)' }}
    >
      <h2 className="etiqueta mb-3">
        {titulo}
        {sufijo && <span className="ml-1.5 opacity-60">· {sufijo}</span>}
      </h2>
      {children}
    </section>
  )
}

function Composicion({ comida }: { comida: ComidaDelDia }) {
  return (
    <div className="flex gap-4">
      <Plato componentes={comida.componentes} tamano={80} />
      <div className="min-w-0 flex-1">
        <ul className="space-y-2.5">
          {comida.componentes.map((componente, i) => (
            <li key={i} className="flex gap-2.5">
              <PuntoCategoria categoria={componente.categoria} />
              <div className="min-w-0">
                <p className="text-[15px] leading-snug">
                  {componente.porcion}
                  {componente.nota && (
                    <span className="ml-1.5 text-xs text-acento">{componente.nota}</span>
                  )}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-tinta-suave">
                  {componente.opciones.join(' · ')}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {(comida.fruta || comida.bebida) && (
          <p className="mt-2.5 text-[13px] text-tinta-suave">
            {[comida.fruta && '+ 1 fruta', comida.bebida && '1 vaso de agua']
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}
