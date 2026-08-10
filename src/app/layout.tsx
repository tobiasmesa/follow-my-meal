import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'

const geistSans = Geist({
  variable: '--font-geist-sans',
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
  themeColor: '#7b2d42',
  // `cover` deja que el contenido llegue a los bordes; las safe areas las maneja
  // cada componente. `resizes-content` evita que el teclado de iOS deje el
  // viewport achicado al cerrarse.
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <main className="mx-auto w-full max-w-md flex-1 px-4 pb-6">{children}</main>
        <Nav />
      </body>
    </html>
  )
}
