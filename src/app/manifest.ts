import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Follow My Meal',
    short_name: 'Mis comidas',
    description: 'Seguí tu plan alimenticio y registrá lo que comés, con foto.',
    start_url: '/',
    display: 'standalone',
    background_color: '#7b2d42',
    theme_color: '#7b2d42',
    orientation: 'portrait',
    lang: 'es-AR',
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
