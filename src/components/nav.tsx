'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Barra inferior de navegación.
 *
 * En modo standalone iOS no muestra el botón de atrás de Safari, así que la
 * navegación tiene que bastarse sola. El `padding-bottom` con `safe-area-inset`
 * es lo que evita que los botones queden debajo de la barra de gestos del
 * iPhone.
 */

const SECCIONES = [
  { href: '/', etiqueta: 'Hoy', icono: PlatoIcono },
  { href: '/plan', etiqueta: 'Mi plan', icono: ListaIcono },
  { href: '/historial', etiqueta: 'Historial', icono: RelojIcono },
  { href: '/ajustes', etiqueta: 'Ajustes', icono: EngranajeIcono },
]

export function Nav() {
  const ruta = usePathname()

  return (
    <nav
      className="sticky bottom-0 z-10 border-t border-borde bg-background/90 backdrop-blur"
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
                className={`flex flex-col items-center gap-1 py-2 text-[11px] transition-colors ${
                  activa ? 'text-carne' : 'text-tenue'
                }`}
              >
                <Icono />
                {etiqueta}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const props = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function PlatoIcono() {
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

function ListaIcono() {
  return (
    <svg {...props}>
      <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  )
}

function RelojIcono() {
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

function EngranajeIcono() {
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  )
}
