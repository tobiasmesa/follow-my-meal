import type { Metadata, Viewport } from 'next'
import { Fraunces, Karla } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'

// Fraunces para los títulos: es una serif cálida y con carácter, que le saca a
// la app el aire de planilla clínica. Karla para todo lo demás, que aguanta bien
// las listas largas de opciones en pantalla chica.
const display = Fraunces({
  variable: '--fuente-display',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK'],
})

const cuerpo = Karla({
  variable: '--fuente-cuerpo',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Follow My Meal',
  description: 'Seguí tu plan alimenticio y registrá lo que comés, con foto.',
  // Sin esto iOS abre la app instalada con la barra de Safari encima.
  appleWebApp: {
    capable: true,
    title: 'Mis comidas',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf9f6' },
    { media: '(prefers-color-scheme: dark)', color: '#14110f' },
  ],
  // `cover` deja que el fondo llegue a los bordes; las safe areas las maneja
  // cada componente. `resizes-content` evita que el teclado de iOS deje el
  // viewport achicado al cerrarse.
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" className={`${display.variable} ${cuerpo.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <main className="mx-auto w-full max-w-md flex-1 px-4 pb-8">{children}</main>
        <Nav />
      </body>
    </html>
  )
}
