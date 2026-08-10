---
name: plan-audit
description: Audita un plan de implementación antes de escribir una sola línea de código, buscando el supuesto no verificado que lo rompe — límites de plataforma, modelo de datos ambiguo, políticas de seguridad por join, convenciones de framework que cambiaron de versión, restricciones de iOS/PWA. Devuelve un informe priorizado con correcciones concretas y las fases reordenadas en lanes paralelizables. Usala siempre que haya un plan, diseño, propuesta técnica o RFC por revisar antes de implementar; cuando el usuario diga "revisá el plan", "esto necesita mejoras de arquitectura", "¿esto va a funcionar?"; al arrancar una iteración del loop de agentes; y también cuando estés por implementar algo que ya tiene un plan escrito y nadie lo auditó todavía.
---

# Auditoría de plan

## Qué estás buscando

El error que rompe un proyecto casi nunca está escrito en el plan. Está en el
**supuesto que el plan no verificó** — algo que sonaba obvio, que nadie chequeó
contra la documentación real, y sobre el que después se apoyan diez decisiones.

Tres ejemplos reales de este repo, todos encontrados en una sola pasada:

- El plan proponía `src/middleware.ts` con el patrón estándar de Supabase. En
  Next.js 16 esa convención está **deprecada y renombrada a `proxy.ts`**. El plan
  no estaba mal escrito: copiaba un tutorial correcto de una versión anterior.
- El plan proponía commitear `.env.local.example`. El `.gitignore` generado tiene
  `.env*`, así que el archivo se creaba, el agente lo daba por hecho, y **nunca
  entraba al commit**. Nadie lo hubiera notado hasta el primer clone.
- El plan mandaba la foto de la comida por un Server Action. Next tiene un límite
  de 1MB por action y Vercel uno **duro de 4.5MB que no se puede configurar**.
  Una foto de iPhone pesa 2–8MB. La feature central del producto era inviable tal
  como estaba planificada.

Ninguno de los tres se encuentra leyendo el plan con atención. Se encuentran
verificando sus supuestos contra la fuente. Ese es el trabajo.

## Antes de opinar, leé

1. **El plan completo**, sin saltear.
2. **El estado real del repo** — no el que el plan asume. Como mínimo:
   `package.json` (versiones reales), `.gitignore`, los archivos de config, y lo
   que ya exista de la estructura que el plan propone tocar. Proponer algo que ya
   existe, o que contradice el scaffold, te quema credibilidad y le hace perder
   tiempo a quien implemente.
3. **La documentación de la versión instalada**, no la de tu memoria. Si hay docs
   en `node_modules/<framework>/dist/docs/`, esa es la fuente de verdad y le gana
   a cualquier tutorial. Los frameworks renombran convenciones entre majors y los
   tutoriales tardan años en actualizarse.
4. **`references/plataforma.md`** de esta skill — límites ya verificados de
   Supabase, Vercel, iOS/Safari y Next 16, con fecha. Si un dato ahí tiene más de
   ~3 meses y es load-bearing para tu conclusión, reverificalo; si no, reusalo en
   vez de re-investigar.

## Los cinco ejes

Están ordenados por costo de equivocarse. Un error en el eje 1 se paga en cada
iteración futura; uno en el eje 5 se paga una vez.

### 1. Modelo de datos

Buscá **ambigüedades que después se vuelven bugs de producto**. La señal más
confiable es un "o" en la descripción de una columna: `day_of_week 0-6 OR date`
no es una decisión de sintaxis pendiente, son dos entidades distintas metidas en
una tabla.

La pregunta que más rinde: **¿qué pasa cuando el usuario edita algo que ya
ocurrió?** Si editar el plan de comidas hoy cambia retroactivamente lo que
"debía" haber comido el lunes, el historial de cumplimiento se reescribe solo y
el producto pierde su razón de existir. Plantilla e historial son entidades
separadas: el historial es un **snapshot copiado por valor**, no una referencia a
la plantilla viva.

Chequeá también: ¿hay zona horaria? (un dashboard de "hoy" en un servidor UTC
salta de día a las 21:00 hora de Argentina); ¿están definidos los estados
derivados como "cumplió", o cada quien va a inventar el suyo?; ¿hay índices para
las queries que el plan describe?

### 2. Seguridad y autorización

En apps con RLS, la trampa es que las tablas hijas quedan a dos joins del
`user_id`, y las policies por `EXISTS (... join ...)` se evalúan **por fila**.
Desnormalizar `user_id` en todas las tablas no es duplicar datos: es la práctica
recomendada, y hace la policy uniforme y barata.

Detalles que casi ningún plan menciona y que importan de verdad:
- `(select auth.uid())` entre paréntesis se evalúa una vez por query; `auth.uid()`
  pelado, una vez por fila.
- Las vistas de Postgres corren con permisos del *owner* y **bypasean RLS** salvo
  que se declaren `with (security_invoker = true)`. Es la forma más común de
  filtrar datos de todos los usuarios sin enterarse.
- Los Server Actions son endpoints POST públicos. La autorización va **adentro de
  cada action**, y el ID del dueño se deriva de la sesión, nunca del cliente.

### 3. Viabilidad de la plataforma

Esto puede invalidar la arquitectura entera, así que va temprano. Verificá los
límites reales contra la documentación oficial, con números, y traducilos al caso
de uso concreto: no sirve "1 GB de storage", sirve "a 3MB por foto y 3 comidas
por día se llena en 4 meses; comprimiendo a 200KB, en 4 años".

Prestá atención especial a límites **duros** (no configurables) y a
comportamientos que rompen el caso de uso aunque no sean errores — un free tier
que pausa el proyecto por inactividad no falla, pero deja al usuario tirado justo
cuando vuelve de vacaciones.

### 4. El camino del dato pesado

Seguí el recorrido completo del archivo más grande que maneja la app, de punta a
punta: origen → normalización → transporte → almacenamiento → lectura. Es donde
se acumulan los límites duros de todas las capas a la vez, y donde un plan
escrito en abstracto casi siempre falla.

Para fotos desde el navegador móvil, las preguntas concretas: ¿qué formato
entrega realmente el dispositivo (iOS puede dar HEIC y no es determinístico)?;
¿se comprime antes de subir o se quema cuota de egress?; ¿la orientación EXIF se
aplica o las fotos verticales salen rotadas?; ¿el archivo atraviesa una función
serverless con límite de body, o va directo al storage?; ¿hay miniaturas, o la
vista de historial descarga 90 fotos completas?

### 5. Secuenciación y lanes

Un plan lineal de N pasos no es una planificación, es un índice. Reordenalo en
fases con dependencias explícitas y separá:

- **Lo secuencial**: los cimientos que definen el contrato (schema, tipos,
  sesión) y el shell compartido (layout, navegación, tokens de estilo). Si esto
  se paraleliza, todos los agentes editan los mismos archivos y se pisan.
- **Lo paralelizable**: lanes con **propiedad de archivos disjunta**. Nombrá
  explícitamente qué directorios y archivos son de cada lane. Si dos lanes
  comparten un archivo, no son dos lanes.

Una carpeta compartida tipo `app/actions/` con un archivo por feature es un punto
de conflicto disfrazado: colocá las actions dentro de cada feature.

Definí también **criterios de salida por fase**. Si un requisito duro del usuario
es "que funcione bien en el iPhone", eso se verifica en la fase que construye el
shell, no al final con diez features encima.

## El informe

Priorizá por impacto, no por orden de lectura. Estructura:

```
## Problemas críticos
Los que rompen el proyecto si no se corrigen. Cada uno: qué está mal,
por qué (con la cita o el número que lo prueba), y la corrección concreta.

## Mejoras de arquitectura
Diseño alternativo concreto — SQL, estructura de carpetas, firma de módulos.

## Ambigüedades para el usuario
Preguntas que NO podés responder solo y que cambian el diseño.
Separalas del resto: son las que bloquean.

## Fases reordenadas
Con dependencias y lanes de propiedad disjunta.

## Recortes para la primera iteración
Qué sacar sin perder el core loop del producto.
```

Dos cosas que hacen la diferencia entre un informe útil y uno ignorable:

**Citá la evidencia.** "El límite es 1MB (`node_modules/next/dist/docs/.../server-actions.md:83`)"
vale infinitamente más que "creo que hay un límite de tamaño". Ruta y línea, o URL
y fecha.

**Recomendá, no enumeres.** Si hay tres opciones, elegí una y explicá por qué.
Quien recibe el informe quiere avanzar, no volver a decidir todo desde cero.

## Sobre las ambigüedades

Resistí la tentación de resolverlas por tu cuenta con un default razonable. La
más cara de este proyecto era si "subir el plan alimenticio" significaba cargar
un formulario o subir el PDF del nutricionista — la diferencia entre una
iteración de dos días y una que necesita OCR o un LLM (y rompe el requisito de
"todo gratis"). Un default silencioso ahí habría construido lo que el usuario no
pidió.

Cuando encuentres una de estas, marcala fuerte, proponé tu recomendación **y
pedí confirmación** antes de que se implemente.

## Dónde encaja esto

Es el paso ① del loop de agentes documentado en `docs/agent-workflow.md`: audit →
cimientos → fan-out paralelo → merge + review → vuelta al audit con los hallazgos.

Corré esta auditoría con el modelo más capaz disponible. Los errores que caza son
justamente los que un modelo más chico no ve, y se pagan en cada iteración
posterior.
