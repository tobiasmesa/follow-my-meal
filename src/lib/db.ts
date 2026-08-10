import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Registro, TipoComida } from './types'

/**
 * Única puerta a los datos. Todo lo demás pasa por acá.
 *
 * Hoy es IndexedDB local, sin servidor. Si más adelante se agrega sincronización,
 * se cambia la implementación de este módulo y la UI no se entera — por eso
 * ningún componente habla con `idb` directamente.
 *
 * Las fotos van en su propio store como Blob. Guardarlas junto al registro haría
 * que leer la agenda del día arrastre megabytes de imágenes que no se muestran.
 */

const DB_NAME = 'follow-my-meal'
const DB_VERSION = 1

interface Schema extends DBSchema {
  registros: {
    key: string
    value: Registro
    indexes: { fecha: string }
  }
  fotos: {
    key: string
    value: Blob
  }
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null

function getDB() {
  // El acceso es perezoso porque IndexedDB no existe durante el render del
  // servidor ni en el build.
  if (!dbPromise) {
    dbPromise = openDB<Schema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const registros = db.createObjectStore('registros', { keyPath: 'id' })
        registros.createIndex('fecha', 'fecha')
        db.createObjectStore('fotos')
      },
    })
  }
  return dbPromise
}

export async function registrosDelDia(fecha: string): Promise<Registro[]> {
  const db = await getDB()
  const registros = await db.getAllFromIndex('registros', 'fecha', fecha)
  return registros.sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
}

export async function todosLosRegistros(): Promise<Registro[]> {
  const db = await getDB()
  const registros = await db.getAll('registros')
  // Más nuevos primero: el historial se lee hacia atrás.
  return registros.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
}

/** Fechas con al menos un registro, de la más reciente a la más vieja. */
export async function fechasConRegistros(): Promise<string[]> {
  const registros = await todosLosRegistros()
  return [...new Set(registros.map((r) => r.fecha))].sort((a, b) => b.localeCompare(a))
}

export async function guardarRegistro(
  entrada: { fecha: string; tipo: TipoComida; descripcion: string },
  foto?: Blob,
): Promise<Registro> {
  const db = await getDB()
  const id = crypto.randomUUID()

  let fotoId: string | undefined
  if (foto) {
    fotoId = `foto-${id}`
    await db.put('fotos', foto, fotoId)
  }

  const registro: Registro = {
    id,
    ...entrada,
    fotoId,
    creadoEn: new Date().toISOString(),
  }
  await db.put('registros', registro)
  return registro
}

export async function borrarRegistro(id: string): Promise<void> {
  const db = await getDB()
  const registro = await db.get('registros', id)
  if (registro?.fotoId) await db.delete('fotos', registro.fotoId)
  await db.delete('registros', id)
}

export async function obtenerFoto(fotoId: string): Promise<Blob | undefined> {
  const db = await getDB()
  return db.get('fotos', fotoId)
}

/**
 * Exporta todo: registros y fotos en base64, en un solo archivo.
 *
 * Cumple tres funciones a la vez y por eso lleva las fotos adentro en lugar de
 * ser un JSON pelado: es el backup (no hay servidor que respalde), es el camino
 * de migración si algún día esto se muda a una base de datos, y es lo que se le
 * manda a la nutricionista.
 */
export async function exportarTodo(): Promise<Blob> {
  const registros = await todosLosRegistros()

  const fotos: Record<string, string> = {}
  for (const registro of registros) {
    if (!registro.fotoId) continue
    const blob = await obtenerFoto(registro.fotoId)
    if (blob) fotos[registro.fotoId] = await blobABase64(blob)
  }

  const dump = {
    version: 1,
    exportadoEl: new Date().toISOString(),
    registros,
    fotos,
  }
  return new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
}

function blobABase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(lector.result as string)
    lector.onerror = () => reject(lector.error)
    lector.readAsDataURL(blob)
  })
}
