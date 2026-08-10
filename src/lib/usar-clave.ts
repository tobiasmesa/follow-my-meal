'use client'

import { useSyncExternalStore } from 'react'
import { leerClave, suscribirClave } from './gemini'

/**
 * La clave de Gemini vive en localStorage, que no existe durante el prerender.
 * Leerla directo en el cuerpo del componente daría distinto en el servidor y en
 * el cliente, así que se lee como lo que es: un sistema externo a React.
 */

const enElServidor = () => null

export function useClaveGemini(): string | null {
  return useSyncExternalStore(suscribirClave, leerClave, enElServidor)
}
