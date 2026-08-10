'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Barra inferior de navegación.
 *
 * En modo standalone iOS no muestra el botón de atrás de Safari, así que la
 * navegación tiene que bastarse sola. El `padding-bottom` con `safe-area-inset`
 * es lo que evita que los botones queden debajo de la barra de gestos.
 */

const SECCIONES = [
  { href: '/', etiqueta: 'Hoy', icono: PlatoIcono },
  { href: '/plan', etiqueta: 'Plan', icono: ListaIcono },
  { href: '/historial', etiqueta: 'Historial', icono: RelojIcono },
  { href: '/ajustes', etiqueta: 'Ajustes', icono: EngranajeIcono },
]

export function Nav() {
  const ruta = usePathname()

  return (
    <nav
      className="sticky bottom-0 z-10 border-t border-borde bg-fondo/85 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {SECCIONES.map(({ href, etiqueta, icono: Icono }) => {
          const activa = href === '/' ? ruta === '/' : ruta.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={activa ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] tracking-wide transition-colors ${
                  activa ? 'text-acento' : 'text-tinta-suave'
                }`}
              >
                <Icono activa={activa} />
                {etiqueta}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

type IconoProps = { activa?: boolean }

const base = {
  width: 21,
  height: 21,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function PlatoIcono({ activa }: IconoProps) {
  return (
    <svg {...base} strokeWidth={activa ? 2.1 : 1.7}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.4" fill={activa ? 'currentColor' : 'none'} />
    </svg>
  )
}

function ListaIcono({ activa }: IconoProps) {
  return (
    <svg {...base} strokeWidth={activa ? 2.1 : 1.7}>
      <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  )
}

function RelojIcono({ activa }: IconoProps) {
  return (
    <svg {...base} strokeWidth={activa ? 2.1 : 1.7}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

function EngranajeIcono({ activa }: IconoProps) {
  return (
    <svg {...base} strokeWidth={activa ? 2.1 : 1.7}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
    </svg>
  )
}
