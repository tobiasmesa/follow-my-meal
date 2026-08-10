import { arcosDelPlato } from '@/lib/proporciones'
import type { Categoria, ComponentePlato } from '@/lib/types'

/**
 * El plato como anillo de arcos, igual que en el PDF de la nutricionista.
 *
 * Es SVG y no imagen porque las proporciones salen de los datos: si cambia el
 * plan, cambia el dibujo. Los arcos se trazan con `stroke-dasharray` sobre un
 * solo círculo, que es más barato que generar paths por segmento.
 */

const COLOR: Record<Categoria, string> = {
  almidones: 'var(--almidones)',
  verduras: 'var(--verduras)',
  carne: 'var(--carne)',
  proteinas: 'var(--proteinas)',
  'proteina-vegetal': 'var(--vegetal)',
}

export function Plato({
  componentes,
  tamano = 64,
  atenuado = false,
}: {
  componentes: ComponentePlato[]
  tamano?: number
  atenuado?: boolean
}) {
  const grosor = tamano * 0.13
  const radio = (tamano - grosor) / 2
  const perimetro = 2 * Math.PI * radio

  const arcos = arcosDelPlato(componentes)

  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${tamano} ${tamano}`}
      role="img"
      aria-label={`Plato: ${componentes.map((c) => c.porcion).join(', ')}`}
      className={atenuado ? 'opacity-40' : undefined}
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        cx={tamano / 2}
        cy={tamano / 2}
        r={radio}
        fill="none"
        stroke="var(--borde)"
        strokeWidth={grosor}
      />
      {arcos.map((arco, i) => {
        // Un hueco de dos grados deja ver la separación entre grupos.
        const largo = Math.max(0, arco.parte * perimetro - perimetro / 180)
        const desfase = -arco.desde * perimetro
        return (
          <circle
            key={i}
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            fill="none"
            stroke={COLOR[arco.categoria]}
            strokeWidth={grosor}
            strokeLinecap="butt"
            strokeDasharray={`${largo} ${perimetro - largo}`}
            strokeDashoffset={desfase}
          />
        )
      })}
    </svg>
  )
}

/** Punto de color del grupo, para las listas. */
export function PuntoCategoria({ categoria }: { categoria: Categoria }) {
  return (
    <span
      aria-hidden
      className="mt-[7px] size-2 shrink-0 rounded-full"
      style={{ background: COLOR[categoria] }}
    />
  )
}
