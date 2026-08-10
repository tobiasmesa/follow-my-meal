# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Comandos

```bash
npm run dev            # desarrollo
npm run build          # build de producción (todas las rutas salen estáticas)
npm run lint
npm start              # sirve el build

node scripts/generar-iconos.mjs   # regenera los PNG de los iconos
```

No hay tests configurados todavía. La verificación es manual: `npm run build`,
después abrirla en un iPhone real e instalarla desde Safari.

## Qué es esta app

Un diario de comidas contra un plan de nutricionista, para uso personal. El
usuario ve qué le toca comer hoy, registra qué comió con una foto, y después le
muestra el historial a la nutricionista.

## Corre entera en el navegador

No hay backend, ni base de datos remota, ni login. Todo vive en IndexedDB en el
dispositivo. Eso es una decisión, no una etapa provisoria a medio terminar: sacó
del proyecto la autenticación, las políticas de acceso por fila, los límites de
tamaño de request, las cuotas de storage y los bugs de zona horaria del servidor.

Consecuencias que hay que tener presentes al tocar el código:

- **`src/lib/db.ts` es la única puerta a los datos.** Ningún componente habla con
  `idb` directamente. Si algún día se agrega sincronización, se cambia ese módulo
  y la UI no se entera.
- **No hay backup.** El exportador de `/ajustes` es lo único que hay, y por eso
  lleva las fotos adentro en base64: es respaldo, es el archivo que se le manda a
  la nutricionista, y es el camino de migración si esto pasa a tener cuenta.
- Las páginas son todas client components porque leen IndexedDB, que no existe
  durante el prerender.

## El plan no lista comidas, lista proporciones

Esto es lo que más cuesta entender del dominio y determina todo el modelo de
datos. El PDF de la nutricionista no dice "el martes comés milanesa con puré".
Dice que el martes al almuerzo el plato se arma con `1/2 plato de almidones` +
`1/4 plato de verduras` + `1 porción chica de carne magra desgrasada`, y cada uno
de esos renglones trae su lista de opciones permitidas.

De ahí sale la forma de `src/lib/types.ts`:

- `ComponentePlato` (porción + categoría + opciones) es la unidad, no un título
  de comida.
- Desayuno y merienda no varían por día: son `ComidaFija`, bloques de los que se
  elige una opción de cada uno.
- Almuerzo y cena sí varían: `Record<DiaSemana, ComidaDelDia>`.
- Por eso "cumplir el plan" es *armé el plato con estas proporciones*, no *comí
  tal cosa*, y el registro es texto libre más foto.

**El plan vive en `src/lib/plan.ts` como datos, transcrito a mano del PDF.** No se
parsea en la app a propósito: cambia cada varios meses, cuando la nutricionista
emite uno nuevo. Armar subida de PDF con parseo por IA para algo que se usa tres
veces al año costaba más de lo que ahorraba. Cuando haya plan nuevo, se reemplaza
ese archivo. No incluye nombre ni peso: la app no los necesita y así los datos de
salud identificables no quedan en el repositorio.

Las sugerencias tienen dos niveles. `src/lib/sugerencias.ts` combina una opción de
cada componente y no necesita nada: el plan ya trae las listas, sugerir es
combinar. `src/lib/gemini.ts` es opcional y va un paso más allá — con una clave
cargada desde Ajustes, propone comidas armadas en vez de ingredientes sueltos.
Sin clave la app funciona igual y ni se entera.

La clave vive en `localStorage`, se lee con `useClaveGemini()` (nunca directo en
el render, o el prerender y el cliente dan distinto) y **nunca va al repositorio**.
Como no hay backend, la llamada sale del navegador con la clave en la URL; está
dicho explícitamente en Ajustes.

Dos cosas de ese módulo que parecen de más y no lo son, las dos aprendidas
rompiendo la app en producción.

**Los modelos no están fijos en el código.** Se descubren con `ListModels` y se
guarda la lista entera ordenada por preferencia. Google renombra y retira modelos
seguido, y un nombre hardcodeado hace que la app tire 404 sin poder explicarse. Se
guarda la lista y no un solo modelo porque un 429 no distingue entre "consultaste
muy seguido" y "este modelo tiene cuota cero para tu clave": ante 404 o 429 se
prueba el siguiente, hasta tres. Un 400 o 403, en cambio, no mejora cambiando de
modelo, así que corta ahí.

**Los errores muestran el mensaje de Google tal cual.** El cuerpo de error de la
API dice exactamente qué falló; taparlo con un "revisá la conexión" genérico
convierte un bug de una línea en una sesión de adivinanzas. Si agregás un caso
nuevo, pasá el motivo, no lo resumas.

Cada tipo de comida pide las ideas distinto, porque el plan las define distinto:
almuerzo y cena son proporciones con listas cerradas (combinar sin salirse),
mientras que desayuno y merienda son bloques fijos, así que ahí lo que se pide es
variedad dentro del criterio nutricional, apoyándose en la regla del plan que
autoriza alternarlos entre sí.

## El plato es el elemento visual, no la decoración

La nutricionista dibuja cada comida como un anillo con arcos de colores según las
proporciones. La app usa el mismo lenguaje: `src/components/plato.tsx` genera ese
anillo desde los datos, y `src/lib/proporciones.ts` traduce las porciones a arcos.

Las porciones que traen la fracción escrita ("1/2 plato de almidones") la usan tal
cual; las que no ("1 porción de carne magra chica") se reparten lo que sobra, que
es lo mismo que hace ella en el papel. Los colores de grupo (`--almidones`,
`--verduras`, `--carne`, `--proteinas`, `--vegetal`) salen de su diagrama y están
en `globals.css`, expuestos a Tailwind por el bloque `@theme`. El bordó
(`--acento`) es el único acento de interfaz y conviene no repartirlo por todos
lados.

Los neutros llevan un sesgo cálido hacia el ocre a propósito: un gris puro al
lado de esta paleta se ve apagado. Fraunces para títulos, Karla para todo lo
demás.

## Cosas que se rompen si no se saben

**Fechas.** Todo pasa por `src/lib/fecha.ts`. Nunca usar `toISOString()` para
derivar el día: convierte a UTC y de noche manda la comida al día siguiente. Y
`new Date('2026-08-10')` parsea como UTC, por eso existe `desdeFecha()`.

**Fotos.** Siempre pasarlas por `normalizarFoto()` de `src/lib/foto.ts` antes de
guardarlas. El canvas resuelve tres cosas de una: el iPhone entrega HEIC, la
orientación viene en el EXIF (sin `imageOrientation: 'from-image'` las fotos
verticales se guardan acostadas) y el archivo pesa varios MB. Sale JPEG, derecho
y en ~200 KB. Las URLs de objeto hay que liberarlas con `liberarUrl` al
desmontar, o los blobs quedan retenidos en memoria.

**PWA en iOS.** Safari ignora los iconos del manifest para la pantalla de inicio:
el que usa es `src/app/apple-icon.png` (180×180). El `appleWebApp` de la metadata
en `layout.tsx` es lo que evita que la app instalada abra con la barra de Safari.

Con `viewportFit: 'cover'` el contenido llega hasta los bordes físicos, así que
los insets son obligatorios y no decorativos: sin `env(safe-area-inset-top)` en
`main`, el título queda tapado por el reloj y la batería. La barra inferior es
`fixed`, no `sticky` — como tab bar, sticky se despega al scrollear con inercia
en iOS y salta al tope antes de reacomodarse. Por ser fixed, `main` reserva su
alto abajo con `--alto-nav`.

En modo standalone no hay botón de atrás, así que la navegación se banca sola.
Ningún input puede tener `font-size` menor a 16px o iOS hace zoom solo al tocarlo
(está puesto en `globals.css`).

**Nada de service worker.** No hace falta para que la app sea instalable, y
cachear rutas con datos del día es la causa más común de "me muestra lo de ayer".

## Próximo paso pendiente

El usuario quiere eventualmente subir el PDF y que se parsee solo. Está diferido
por lo explicado arriba. Si se retoma, en
`.claude/skills/plan-audit/references/plataforma.md` están verificados el SDK
vigente de Gemini, el soporte de PDF, la salida estructurada y las latencias.

## Cómo se desarrolla esto

`docs/agent-workflow.md` describe el loop con agentes en paralelo y qué modelo
conviene para cada fase. La skill `/plan-audit` audita un plan antes de escribir
código.
