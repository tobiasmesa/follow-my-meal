# Límites y trampas de plataforma — verificados

Datos verificados el **2026-08-10** contra documentación oficial y contra los docs
de la versión instalada en `node_modules`.

Los límites de free tier cambian sin aviso. Si vas a apoyar una decisión
importante en un número de acá y pasaron más de ~3 meses, reverificalo contra la
fuente. Las trampas de framework (sección 4) son estables mientras no cambie el
major.

## Índice

1. [Supabase free tier](#1-supabase-free-tier)
2. [Vercel Hobby](#2-vercel-hobby)
3. [iOS / Safari / PWA](#3-ios--safari--pwa)
4. [Next.js 16 — convenciones que cambiaron](#4-nextjs-16--convenciones-que-cambiaron)
5. [Alternativas gratis evaluadas](#5-alternativas-gratis-evaluadas)

---

## 1. Supabase free tier

| Recurso | Límite |
|---|---|
| Base de datos | 500 MB |
| Storage | 1 GB |
| Egress | 5 GB/mes (+5 GB cached) |
| Auth MAU | 50.000 |
| Proyectos free activos | 2 (los pausados no cuentan) |
| Backups | **ninguno** |

**Pausa por inactividad.** Los proyectos free se pausan tras **7 días sin
requests de API** y requieren reanudación manual desde el dashboard. No es
destructivo: los datos se conservan con ventana de restauración de 1 año y se
reanuda con un clic. Para una app de uso diario no se dispara solo; el escenario
real es el usuario que vuelve de dos semanas de vacaciones y encuentra la app
caída justo cuando retoma la rutina. Mitigación barata: un cron diario que haga
un `select 1`.

**El límite que aprieta primero suele ser storage, no la pausa.** Con fotos sin
comprimir (~3 MB) y 3 por día, 1 GB se llena en ~4 meses. Comprimidas a ~200 KB,
en ~4 años. Por eso la compresión client-side no es cosmética.

**Transformaciones de imagen no están en el free tier** — las miniaturas hay que
generarlas en el cliente.

Fuentes: [Free Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing) ·
[Pricing](https://supabase.com/pricing)

## 2. Vercel Hobby

| Recurso | Límite |
|---|---|
| Bandwidth | 100 GB Fast Data Transfer |
| Invocaciones de función | 1.000.000/mes |
| Duración de función | 10s default, 60s máx |
| Active CPU / memoria | 4 CPU-hrs / 360 GB-hrs mensuales |
| Builds | 100 deploys/día, 45 min por build |
| Logs de runtime | retenidos 1 hora |
| **Body por request** | **4.5 MB — límite duro, NO configurable** |

El límite de 4.5 MB es de infraestructura: no lo levanta ni `bodySizeLimit` de
Next ni Fluid Compute. Cualquier archivo que pueda superarlo tiene que ir
**directo del cliente al storage**, sin atravesar una función.

**Hobby es solo para uso no comercial.** La definición de Vercel incluye
"cualquier ganancia financiera de cualquier persona involucrada en la producción
del proyecto" — no solo del dueño del sitio. Un proyecto personal está bien;
pagarle a alguien para que lo desarrolle, no.

Fuentes: [Limits](https://vercel.com/docs/limits) ·
[Function Limitations](https://vercel.com/docs/functions/limitations) ·
[Bypass body size limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)

## 3. iOS / Safari / PWA

**Instalación.** Safari **ignora los iconos del manifest** para la pantalla de
inicio: hace falta un `apple-touch-icon` de 180×180 declarado explícitamente. En
Next, las convenciones de archivo `app/apple-icon.png` y `app/icon.png` lo
inyectan solas y son menos frágiles que referenciar `public/` a mano. Requiere
además `display: "standalone"` en el manifest. **No hay prompt automático de
instalación** en iOS — hay que guiar al usuario a "Compartir → Agregar a inicio"
desde la UI.

**Modo standalone: no hay botón de atrás.** La navegación tiene que ser
autosuficiente (tab bar + back explícito en subpáginas). Es un requisito de
diseño, no un detalle.

**Magic links y OAuth rompen standalone**: el link abre Safari y la sesión queda
ahí, no en la app instalada. Email + contraseña evita el problema.

**Service workers.** No hacen falta para instalar. Background Sync no está
soportado. iOS desaloja el cache del SW tras ~7 días sin uso, así que tampoco
compran offline confiable. Un SW escrito a mano que cachee HTML o respuestas RSC
de rutas autenticadas es la causa número uno de "la app me muestra datos de
ayer". Next 16 trae `experimental.useOffline` + hook `useOffline`, que reintenta
navegaciones y actions fallidas — mejor opción que un SW casero.

**Storage de apps instaladas.** El cap de 7 días de Safari para storage
script-writable **no aplica** a apps agregadas a la pantalla de inicio: tienen su
propio contador de uso.

**Cámara.** `<input type="file" accept="image/*" capture="environment">` funciona
bien y abre la cámara directo. El formato devuelto **no es determinístico** entre
versiones de iOS (HEIC vs JPEG, depende del `accept` y del ajuste "Más
compatible" de Cámara). No diseñar asumiendo un formato fijo.

**Normalización recomendada, client-side, resuelve tres problemas de una:**

```js
const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
// → dibujar en canvas redimensionado (lado mayor 1280–1600px)
// → canvas.toBlob(cb, 'image/jpeg', 0.8)
```

Convierte HEIC a JPEG (Safari decodifica HEIC nativamente), aplica la orientación
EXIF —sin `imageOrientation: 'from-image'` las fotos verticales de iPhone salen
rotadas, bug clásico— y baja de ~3 MB a ~200 KB.

**Fricciones de UX a mitigar por diseño:**

| Problema | Mitigación |
|---|---|
| Zoom automático al tocar un input | ningún input con `font-size < 16px` |
| Teclado achica el viewport y no lo devuelve | `interactive-widget=resizes-content` en el meta viewport |
| Nav tapada por el home indicator | `viewport-fit=cover` + `env(safe-area-inset-*)` |
| Pull-to-refresh accidental | `overscroll-behavior-y: contain` |

**Contexto regulatorio.** En feb-2024 Apple anunció que eliminaría las web apps
de pantalla de inicio en la UE por la DMA y lo revirtió antes del release final.
Hoy el soporte sigue completo, pero el precedente existe.

Fuentes: [Apple 7-day cap](https://support.didomi.io/apple-adds-a-7-day-cap-on-all-script-writable-storage) ·
[TechCrunch — reversión en la UE](https://techcrunch.com/2024/03/01/apple-reverses-decision-about-blocking-web-apps-on-iphones-in-the-eu/)

## 4. Next.js 16 — convenciones que cambiaron

Verificado contra `node_modules/next/dist/docs/`. Los tutoriales de internet
—incluidos los oficiales de integraciones— todavía usan las formas viejas, así
que estos son reintroducidos constantemente si no se documentan.

**`middleware.ts` → `proxy.ts`.** La convención `middleware.js` está deprecada y
renombrada. Se exporta `proxy` (o default) y `config.matcher`. La lógica interna
de `@supabase/ssr` no cambia. Los docs además aclaran que Proxy **no es una
solución de autorización**: solo refresca la cookie; la autorización real va en
cada Server Component y cada Server Action.

**Server Actions: límite de body de 1 MB por defecto** (configurable, pero por
detrás está el 4.5 MB duro de Vercel). Los docs son explícitos en que cada action
es un endpoint POST público: autenticar y autorizar adentro, validar todo input,
y no confiar en IDs de dueño que vengan del cliente.

**Helpers de tipos globales** `PageProps<'/ruta'>` y `LayoutProps<'/ruta'>`, sin
import, generados por `next dev` / `next build` / `next typegen`.

**Manifest** por convención de archivo `app/manifest.ts` que devuelve
`MetadataRoute.Manifest`. Metadata soporta `appleWebApp: { capable, title,
statusBarStyle }` — sin eso, iOS abre la app instalada con la barra de Safari.

**Clientes como factories, nunca instancias de módulo.** Si
`createBrowserClient(process.env.X!, ...)` corre a nivel de módulo, `next build`
explota al prerenderizar cualquier página que lo importe, porque en build no hay
variables de entorno reales.

## 5. Alternativas gratis evaluadas

| Opción | DB | Auth | Storage | ¿Pausa? |
|---|---|---|---|---|
| **Supabase** | Postgres | integrado | integrado | sí, 7 días (1 clic, no destructivo) |
| Neon | Postgres | Neon Auth | **no** | solo suspende compute, despierta solo |
| Turso | SQLite | no | no | nunca |
| Firebase | Firestore | sí | **exige tarjeta desde feb-2026** | no |
| Cloudflare D1 + R2 | SQLite | no incluido | R2, sin costo de egress | no |
| PocketBase self-host | SQLite | integrado | integrado | depende del hosting |

**Recomendación: Supabase.** Es la única que da Postgres + Auth + Storage en un
solo servicio gratuito sin ensamblar piezas.

**Plan B si el storage aprieta:** mover solo el bucket a Cloudflare R2 (10 GB
gratis, sin cargo de egress) manteniendo Supabase para DB + Auth. Para que sea un
cambio de un archivo, todo el acceso a storage debe pasar por un módulo
(`src/lib/storage.ts`).

**Firebase queda descartado**: desde feb-2026 Cloud Storage exige plan Blaze con
tarjeta cargada aunque el consumo quede en $0, lo cual rompe el requisito de
"todo gratis".

**PocketBase no es el problema, el hosting sí**: Railway dejó de ser gratis
indefinido y Fly.io no da free tier a cuentas nuevas desde 2024.
