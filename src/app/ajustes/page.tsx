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
      enlace.download = `follow-my-meal-${new Date().toISOString().slice(0, 10)}.json`
      enlace.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportando(false)
    }
  }

  return (
    <>
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-semibold">Ajustes</h1>
      </header>

      <div className="space-y-3">
        <section className="rounded-xl border border-borde bg-superficie p-4">
          <h2 className="mb-1 font-semibold">Tus datos</h2>
          <p className="text-sm text-tenue">
            {cantidad === null
              ? 'Contando…'
              : `${cantidad} ${cantidad === 1 ? 'comida registrada' : 'comidas registradas'}.`}
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            Todo se guarda en este dispositivo, no hay servidor. Eso quiere decir que
            nadie más puede verlo — y también que si borrás la app, se pierde.
            Exportá cada tanto.
          </p>
          <button
            type="button"
            onClick={exportar}
            disabled={exportando || cantidad === 0}
            className="mt-3 w-full rounded-lg bg-carne py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {exportando ? 'Exportando…' : 'Exportar todo'}
          </button>
          <p className="mt-2 text-xs text-tenue">
            El archivo incluye las fotos. Sirve de respaldo, para mandarle el
            seguimiento a la nutricionista, y para mudar los datos si más adelante la
            app pasa a tener cuenta.
          </p>
        </section>

        <section className="rounded-xl border border-borde bg-superficie p-4">
          <h2 className="mb-1 font-semibold">Instalar en el iPhone</h2>
          <p className="text-sm leading-relaxed text-tenue">
            En Safari, tocá el botón de compartir y elegí{' '}
            <span className="text-foreground">Agregar a pantalla de inicio</span>. Se
            abre como una app, sin la barra del navegador.
          </p>
        </section>

        <section className="rounded-xl border border-borde bg-superficie p-4">
          <h2 className="mb-1 font-semibold">Plan cargado</h2>
          <p className="text-sm text-tenue">
            {PLAN.profesional} · emitido el {PLAN.emitidoEl}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-tenue">
            Cuando tengas un plan nuevo, hay que actualizarlo en el código. Es un solo
            archivo.
          </p>
        </section>
      </div>
    </>
  )
}
