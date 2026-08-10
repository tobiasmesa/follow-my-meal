'use client'

import { useEffect, useState } from 'react'
import { exportarTodo, todosLosRegistros } from '@/lib/db'
import { PLAN } from '@/lib/plan'

export default function Ajustes() {
  const [cantidad, setCantidad] = useState<number | null>(null)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    todosLosRegistros().then((r) => setCantidad(r.length))
  }, [])

  async function exportar() {
    setExportando(true)
    try {
      const blob = await exportarTodo()
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `mis-comidas-${new Date().toISOString().slice(0, 10)}.json`
      enlace.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportando(false)
    }
  }

  return (
    <>
      <header className="pt-8 pb-5">
        <h1 className="titulo text-[32px] leading-none font-semibold">Ajustes</h1>
      </header>

      <div className="space-y-3">
        <Bloque titulo="Tus datos">
          <p className="titulo text-2xl leading-none font-semibold tabular-nums">
            {cantidad ?? '—'}
          </p>
          <p className="mt-1 text-[13px] text-tinta-suave">
            {cantidad === 1 ? 'comida registrada' : 'comidas registradas'}
          </p>

          <p className="mt-4 text-[15px] leading-relaxed">
            Todo se guarda en este dispositivo, sin servidor. Nadie más puede verlo — y
            también quiere decir que si borrás la app, se pierde.
          </p>

          <button
            type="button"
            onClick={exportar}
            disabled={exportando || cantidad === 0}
            className="mt-4 w-full rounded-xl bg-acento py-3 font-medium text-white transition-opacity disabled:opacity-40 dark:text-[#241e1b]"
          >
            {exportando ? 'Exportando…' : 'Exportar todo'}
          </button>
          <p className="mt-2.5 text-[13px] leading-relaxed text-tinta-suave">
            El archivo lleva las fotos adentro. Sirve de respaldo, para mandarle el
            seguimiento a la nutricionista, y para mudar los datos si algún día la app
            pasa a tener cuenta.
          </p>
        </Bloque>

        <Bloque titulo="Instalarla en el iPhone">
          <ol className="space-y-2 text-[15px] leading-relaxed">
            <li className="flex gap-2.5">
              <span className="etiqueta mt-0.5 tabular-nums">1</span>
              Abrila en Safari
            </li>
            <li className="flex gap-2.5">
              <span className="etiqueta mt-0.5 tabular-nums">2</span>
              Tocá el botón de compartir
            </li>
            <li className="flex gap-2.5">
              <span className="etiqueta mt-0.5 tabular-nums">3</span>
              Elegí «Agregar a pantalla de inicio»
            </li>
          </ol>
          <p className="mt-3 text-[13px] leading-relaxed text-tinta-suave">
            Se abre como una app, sin la barra del navegador.
          </p>
        </Bloque>

        <Bloque titulo="Plan cargado">
          <p className="text-[15px]">{PLAN.profesional}</p>
          <p className="mt-1 text-[13px] text-tinta-suave">
            Emitido el {PLAN.emitidoEl}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-tinta-suave">
            Cuando tengas un plan nuevo hay que actualizarlo en el código. Es un solo
            archivo.
          </p>
        </Bloque>
      </div>
    </>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border border-borde bg-superficie p-4"
      style={{ boxShadow: 'var(--sombra)' }}
    >
      <h2 className="etiqueta mb-3">{titulo}</h2>
      {children}
    </section>
  )
}
