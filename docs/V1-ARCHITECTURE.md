# Asistente de notas de reunión → tickets en OpenProject

## Qué es esto ahora

Este proyecto empezó como un ejercicio para aprender a consumir la API de OpenProject (autenticación + creación de _work packages_). Esa parte **ya funciona y no se tocó**.

El objetivo cambió: ahora es el prototipo de un asistente de Project Management. La idea de uso:

1. Durante una reunión, abres la app y **solo tomas notas** en un editor tipo Notion.
2. Al terminar, pulsas **CREAR TICKETS**.
3. (Todavía no implementado) Una IA analiza el texto, identifica qué partes son tickets independientes y qué imágenes va con cada uno, y usa la integración con OpenProject ya existente para crearlos automáticamente.

Por eso el formulario que existía (título, descripción, proyecto, adjuntos, secciones manuales) **se eliminó del frontend**: ya no tiene sentido si la idea es que la IA rellene esos campos por ti. La lógica que sabe _cómo_ crear un ticket en OpenProject se conservó intacta y ahora vive detrás de un servicio, lista para que la IA la use.

## Estructura del proyecto

```
.
├── client/
│   ├── editor.ts                    # Editor Tiptap: título, autoguardado, botón "+", menú de bloque, modal de asignación
│   ├── blockMetadataExtension.ts     # Extensión Tiptap: atributo `metadata` por bloque + comando + decoración
│   ├── metadata/
│   │   ├── types.ts                    # MetadataItem, MetadataRegistry — el contrato entre editor y componentes
│   │   ├── MetadataChip.ts             # Un chip: ícono + etiqueta (sin saber de clics ni arrastre)
│   │   └── MetadataContainer.ts        # Fila de chips de un bloque: orden, clic vs. arrastre, sin saber de Tiptap
│   └── sidebar.ts                    # Sidebar: proyectos, notas, modal "Crear Proyecto", navegación entre vistas
├── public/
│   ├── index.html              # Página única: sidebar + vista vacía + vista de notas + modales
│   ├── styles.css              # Tema oscuro minimalista (sidebar, modales, menú de bloque, reskin de Tom Select)
│   ├── editor.js                # Generado por esbuild a partir de client/editor.ts (no se versiona)
│   ├── editor.css                # CSS de Tom Select que importa editor.ts, extraído por esbuild (no se versiona)
│   ├── sidebar.js                # Generado por esbuild a partir de client/sidebar.ts (no se versiona)
│   └── sidebar.css               # CSS de Tom Select que importa sidebar.ts, extraído por esbuild (no se versiona)
├── src/
│   ├── config.ts                # Carga y valida las variables de entorno (.env)
│   ├── openProjectClient.ts     # Cliente HTTP de la API de OpenProject (SIN CAMBIOS)
│   ├── duration.ts              # Horas -> duración ISO 8601 (utilidad reusable, sin cambios)
│   ├── createTicket.ts          # CLI para crear un ticket a mano (SIN CAMBIOS)
│   ├── services/
│   │   ├── MeetingDocumentService.ts # Sabe qué es un documento válido de Tiptap (forma, no contenido)
│   │   ├── MeetingNoteService.ts     # Notas de reunión: crear, listar por proyecto, actualizar, persistir
│   │   ├── MeetingPromptBuilder.ts   # Construye el prompt para Claude (único lugar que conoce ese texto)
│   │   ├── MeetingAIService.ts       # Único servicio que habla con la API de Anthropic; devuelve TicketDraft[]
│   │   ├── OpenProjectService.ts     # Único punto de acceso a la API de OpenProject (dominio)
│   │   ├── ProjectService.ts         # Proyectos locales: crear, listar, persistir (JSON en disco)
│   │   ├── UserSettingsService.ts    # Configuración del PM: API Key, usuario autenticado, responsable por defecto
│   │   └── MeetingProcessor.ts       # Orquestador notas -> MeetingAIService -> TicketDraft[]
│   └── server.ts                 # Express: sirve la web + endpoints de proyectos, notas, tickets, IA y configuración
├── data/
│   ├── projects.json            # Proyectos locales persistidos (se crea solo, no se versiona)
│   └── notes.json                # Notas de reunión persistidas (se crea solo, no se versiona)
├── .env.example
├── package.json
├── tsconfig.json                 # Compila src/ (backend, Node)
└── tsconfig.client.json          # Solo type-checking de client/ (el bundle lo hace esbuild)
```

## Por qué Tiptap para el editor

Se pidió explícitamente no construir un editor de texto enriquecido desde cero, y usar algo mantenido. Tiptap encaja porque:

- Es **headless**: no impone su propio look, así que el tema oscuro minimalista se controla 100% desde `public/styles.css` en vez de pelear contra los estilos de un componente cerrado.
- Funciona en **JavaScript plano** (`@tiptap/core` + `new Editor(...)`), sin necesitar React/Vue. Este proyecto no tenía build de frontend con framework, y no hacía falta introducir uno solo por el editor.
- El set de funcionalidades pedido (títulos, subtítulos, listas, listas numeradas, negrilla, cursiva, separador de bloques) viene ya resuelto por `@tiptap/starter-kit`, incluyendo atajos de markdown (`# `, `## `, `- `, `1. `, `**negrilla**`, `---`) que hacen que escribir se sienta natural, como en Notion.
- Es una librería madura (basada en ProseMirror), con mantenimiento activo y muy usada en producción — no es una apuesta arriesgada para una base que se planea seguir construyendo.
- El menú flotante (`@tiptap/extension-bubble-menu`) permite un toolbar mínimo que **solo aparece al seleccionar texto**, en vez de una barra fija enorme — clave para el requisito de "sensación de hoja en blanco".

Paquetes usados: `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-placeholder` (el placeholder "Escribe aquí tus notas…" que se ve en la página vacía), `@tiptap/extension-bubble-menu`.

### Cómo se genera el bundle del editor

Tiptap se instala vía npm y se importa en `client/editor.ts`, pero el navegador no puede hacer `import` de paquetes de `node_modules` directamente. Por eso se usa **esbuild** (`npm run build:client`) para empaquetar `client/editor.ts` y `client/sidebar.ts` (dos entradas independientes, `--outdir=public`) en `public/editor.js` y `public/sidebar.js`. Se eligió esbuild y no Vite/webpack por ser lo mínimo necesario: un solo comando, sin configuración, ideal para un proyecto que no tiene (todavía) más necesidades de build de frontend. El CSS de Tom Select que importa `sidebar.ts` esbuild lo extrae solo a `public/sidebar.css` (ver sección de Sidebar).

`npm run start` ya encadena todo: compila el backend (`tsc`), genera el bundle del editor (`esbuild`) y arranca el servidor.

## El documento: JSON nativo de Tiptap, no HTML

El HTML que se ve en pantalla es únicamente la **representación visual**. El contenido real de una reunión — lo que viaja al backend, lo que un día leerá Claude, lo que se podría guardar y volver a abrir — es el **JSON nativo de Tiptap**: exactamente lo que devuelve `editor.getJSON()` y lo que `editor.commands.setContent(json)` sabe reconstruir sin pérdidas. No hay, ni habrá, un paso de "convertir HTML a JSON": el editor ya trabaja en JSON internamente (Tiptap está construido sobre ProseMirror, cuyo modelo de documento siempre fue un árbol de nodos; el HTML es solo una de sus formas de serializarlo). Este cambio consistió en dejar de pedirle al editor su serialización HTML y empezar a pedirle su documento nativo.

### Por qué JSON y no HTML para este proyecto

- **HTML es ambiguo para una máquina.** `<p>` puede ser una nota suelta o el texto de una lista; distinguir "esto es un título", "esto es una imagen de la sección 2" o "esto es una lista con 3 ítems" a partir de HTML requiere volver a parsear texto y adivinar la estructura con reglas frágiles (regex, un parser de HTML, heurísticas). El JSON de Tiptap ya _es_ esa estructura: no hay nada que adivinar.
- **El orden y el anidamiento se conservan exactamente.** Un `content: []` es un array ordenado de nodos; una imagen dentro de una sección es, literalmente, un nodo hijo en la posición donde se insertó. HTML también preserva orden, pero solo como texto — hay que re-parsearlo para poder _operar_ sobre esa estructura en código.
- **Es el mismo formato de ida y de vuelta.** `editor.getJSON()` y `editor.commands.setContent(doc)` son inversos exactos: guardar y volver a cargar un documento no pierde ni transforma nada (ver la prueba de round-trip más abajo). Con HTML, volver a cargarlo implica re-parsearlo con el motor del navegador y esperar que el resultado sea equivalente — un paso de más, y una fuente de bugs sutiles.
- **Es exactamente lo que una IA necesita para razonar sobre bloques.** Cuando Claude reciba el documento, va a necesitar responder "¿dónde empieza el ticket 2?", "¿qué imágenes van con qué texto?". Eso es recorrer un árbol de nodos tipados, no interpretar markup.

### Cómo representa el editor los bloques (forma del JSON)

Un documento es siempre `{ type: "doc", content: [...] }`, donde cada elemento de `content` es un nodo de nivel de bloque, en el mismo orden en que aparecen en la página:

| Lo que escribes             | Nodo JSON                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| Título (`# `)               | `{ type: "heading", attrs: { level: 1 }, content: [...texto...] }`                                   |
| Subtítulo (`## `)           | `{ type: "heading", attrs: { level: 2 }, content: [...] }`                                           |
| Párrafo                     | `{ type: "paragraph", content: [{ type: "text", text: "..." }] }`                                    |
| Negrilla / cursiva          | Igual que un párrafo, pero el nodo de texto lleva `marks: [{ type: "bold" }]` o `{ type: "italic" }` |
| Lista con viñetas (`- `)    | `{ type: "bulletList", content: [{ type: "listItem", content: [...párrafos...] }, ...] }`            |
| Lista numerada (`1. `)      | Igual, con `type: "orderedList"`                                                                     |
| Separador de bloque (`---`) | `{ type: "horizontalRule" }`                                                                         |
| Imagen                      | `{ type: "image", attrs: { src: "...", alt, title } }` — ver siguiente sección                       |

Verificado con una prueba real (escribir un título, un párrafo, una lista, un separador, un subtítulo, texto en negrilla y una imagen, en ese orden): `editor.getJSON()` devuelve exactamente esos nodos en ese orden, y `editor.commands.setContent(json)` seguido de `editor.getJSON()` produce un documento **idéntico byte a byte** al original.

### Cómo se almacenan las imágenes dentro del documento

Igual que antes de este cambio, una imagen pegada o arrastrada se convierte a una _data URL_ base64 en el navegador (no hay endpoint de subida — no hace falta uno hasta que exista la IA que consuma las imágenes). La diferencia es dónde vive ese dato: ya no es un `<img src="data:...">` dentro de una cadena HTML, sino un nodo de documento real:

```json
{
  "type": "image",
  "attrs": { "src": "data:image/png;base64,iVBORw0KG...", "alt": null, "title": null }
}
```

Esto importa porque un nodo de imagen tiene una posición exacta en el árbol — está _entre_ el texto que lo precede y el que lo sigue, dentro de la sección correcta — en vez de ser una subcadena que hay que localizar dentro de un blob de HTML.

## Arquitectura: separación de responsabilidades

La regla explícita del rediseño: **la interfaz solo captura información**. Ninguna lógica de IA ni de OpenProject vive en `client/editor.ts` — ese archivo solo sabe de Tiptap y hace un `fetch` con el JSON del editor. Todo lo demás vive en el backend, en tres capas separadas:

```
src/services/MeetingDocumentService.ts  "¿cuál es el documento?"     (hoy: real, capa fina)
src/services/MeetingProcessor.ts        "¿qué dicen las notas?"      (hoy: stub)
src/services/OpenProjectService.ts      "créalos en OpenProject"     (hoy: real, reusa lo existente)
```

- **`MeetingDocumentService`** — único punto de acceso al documento JSON de una reunión. Hoy expone:
  - `load(raw)`: valida que lo que llegó por HTTP tenga forma de documento Tiptap (`{ type: "doc", ... }`) antes de que nada más lo toque.
  - `export(document)`: devuelve el documento listo para persistir o para reenviarlo a un editor (`editor.commands.setContent(doc)`).
  - `prepareForAI(document)`: hoy es un paso identidad; es el lugar donde en el futuro se le podría añadir metadatos (fecha, participantes) antes de pasarlo a Claude.

  **Responsabilidades futuras** (a medida que el producto crezca): si algún día las notas se guardan (disco, base de datos), `load`/`export` son el único lugar que cambiaría — ni `server.ts` ni `MeetingProcessor` necesitarían saber de dónde vino el documento o adónde va. También es el lugar natural para versionar el formato del documento si Tiptap cambia su esquema, o para normalizar documentos antiguos antes de reprocesarlos.

- **`OpenProjectService`**: capa fina sobre `OpenProjectClient` (que no cambió). Expone `createTicketsFromDrafts(drafts)`, donde cada `TicketDraft` es `{ subject, sections }` — `sections` es el mismo tipo `TicketSection[]` que ya usaba el formulario, así que no hubo que inventar una estructura nueva ni tocar `openProjectClient.ts`. Usa `OPENPROJECT_PROJECT_ID` de `.env` como proyecto destino (ya no hay selector de proyecto en la interfaz).

- **`MeetingProcessor`**: dueño del método `processMeetingNotes(notes)`, donde `notes.document` es el `MeetingDocument` (JSON) ya validado por `MeetingDocumentService`. Hoy hace tres pasos, dos reales y uno stub:
  1. `meetingDocumentService.prepareForAI(document)` — **real**: siempre pasa por aquí, nunca se lee el documento directamente.
  2. `analyzeWithClaude(document)` — **stub**: siempre devuelve `[]`. Aquí es donde se conecta Claude en el futuro (queda documentado en el propio código qué debe hacer: recorrer el árbol de nodos, separar bloques "#N" en tickets, agrupar nodos entre imágenes en secciones, decodificar los nodos `image` a `Buffer`).
  3. `openProjectService.createTicketsFromDrafts(drafts)` — **real**, ya reutiliza toda la integración existente.

  **Responsabilidad futura**: cuando exista la IA, `MeetingProcessor` será quien arme el prompt/mensaje para Claude a partir del documento que le entrega `MeetingDocumentService`, interprete su respuesta como `TicketDraft[]`, y se la pase a `OpenProjectService`. Sigue sin conocer los detalles de cómo se autentica con OpenProject ni cómo se serializa el documento — cada capa mantiene su única responsabilidad.

  Como el paso 2 siempre devuelve una lista vacía, el paso 3 no crea ningún ticket todavía (recorre cero elementos). El endpoint es seguro de probar ahora mismo: no va a crear tickets falsos en tu OpenProject real, pero la tubería completa ya está conectada de punta a punta.

- **`server.ts`**: solo expone `POST /api/meeting-notes/process`, que recibe `{ document }` (el JSON de Tiptap), lo valida con `meetingDocumentService.load(...)` y llama a `meetingProcessor.processMeetingNotes(...)`. Las rutas viejas del formulario (`/api/projects`, `/api/tickets`, etc.) se eliminaron porque nada las consume ya; la lógica que había detrás de ellas (`OpenProjectClient`) sigue intacta y ahora la usa `OpenProjectService`.

## Integración con IA (Claude): de notas a tickets, con revisión humana obligatoria

"CREAR TICKETS" ya no crea nada directamente. Dispara un análisis con Claude que propone tickets, pero **nada se crea en OpenProject hasta que el PM revisa y confirma esa propuesta** en un modal. El flujo real:

```
Usuario
  ↓ clic en "CREAR TICKETS"  →  fetch { projectId, document: editor.getJSON() }
POST /api/meeting-notes/analyze
  ↓
MeetingDocumentService.load(document)              ← valida la forma del documento
  ↓
MeetingProcessor.analyzeMeetingNotes()
  ↓ prepareForAI(document)                          ← hoy: paso identidad
  ↓
MeetingAIService.analyzeMeetingNotes(document, context, responsible)
  ↓ extrae imágenes del documento → { type: "image", attrs: { imageIndex } } (sin bytes)
  ↓ MeetingPromptBuilder construye el system prompt + mensaje
  ↓ client.messages.parse(... claude-sonnet-5, output_config.format: esquema Zod ...)
  ↓
TicketDraft[]  { subject, sections: [{ description, images }], assigneeId, responsibleId, dueDate, estimatedHours }
  ↓ (responsibleId/responsibleName: puestos por la app, NO por Claude — ver más abajo)
  ↓
server.ts guarda { openProjectId, drafts } en memoria bajo un analysisId
  ↓ responde { analysisId, ticketDrafts } (versión resumida, sin bytes de imagen)
  ↓
Modal de revisión (client/editor.ts): una tarjeta por ticket — título, descripción,
asignado, responsable, tiempo, fecha, cantidad de imágenes, proyecto destino
  ↓ el PM revisa y pulsa "CONFIRMAR Y CREAR TICKETS"
  ↓
POST /api/meeting-notes/create-tickets { analysisId }   ← NO vuelve a llamar a Claude
  ↓
OpenProjectService.createTicketsFromDrafts(openProjectId, drafts)   ← sin cambios de fondo
  ↓
OpenProjectClient.createWorkPackage()  (sin cambios, ver abajo)
  ↓
Tickets creados → pantalla de éxito con id, título y enlace "Abrir Ticket" por cada uno
```

### Por qué la IA únicamente interpreta la reunión

`MeetingAIService` recibe el documento y devuelve `TicketDraft[]` — punto. No sabe qué es un `WorkPackage`, no conoce la API de OpenProject, no sube adjuntos ni construye URLs. Esa frontera importa porque son dos responsabilidades que cambian por razones distintas: cómo interpretar y redactar una reunión es un problema de lenguaje (mejora con mejores prompts, otro modelo, más contexto); cómo crear un ticket en OpenProject es un problema de integración con una API externa (cambia si OpenProject cambia su API, no si Claude mejora). Mezclarlas significaría que tocar el prompt arriesga romper la creación de tickets, y viceversa.

### Por qué OpenProject sigue siendo responsabilidad exclusiva de `OpenProjectService`

`MeetingAIService.analyzeMeetingNotes` termina su trabajo entregando `TicketDraft[]` al llamador (`MeetingProcessor`, y de ahí a `server.ts`) — nunca llama a `OpenProjectClient` ni sabe que existe. La creación real (`POST /api/meeting-notes/create-tickets`) llama a `openProjectService.createTicketsFromDrafts(...)` directamente, el mismo método (extendido, no reescrito) que ya usaba el resto de la app. Esto es lo que permite el requisito explícito de "no duplicar lógica": subir adjuntos, armar el markdown de la descripción y resolver asignado/responsable/fecha/tiempo en la llamada a la API siguen pasando por el único código que ya sabía hacerlo.

### Por qué existe un paso obligatorio de revisión humana

Claude puede identificar mal cuántos tickets hay, agrupar incorrectamente una sección, o simplemente no ser el criterio final sobre qué se le pide al equipo de desarrollo — el PM es quien tiene que responder por esos tickets. Por eso `analyze` y `create-tickets` son dos peticiones HTTP separadas, no una: entre ellas hay, obligatoriamente, un humano mirando una tarjeta por ticket antes de que exista la posibilidad de tocar OpenProject. No hay ningún camino en el código que cree un ticket sin pasar primero por `/api/meeting-notes/analyze` y el modal — `create-tickets` ni siquiera vuelve a mirar el documento original, solo la propuesta ya guardada que el PM tuvo enfrente.

### Por qué `MeetingPromptBuilder` está separado de `MeetingAIService`

El prompt (qué reglas seguir, cómo describir los metadatos, qué tono adoptar como "PM Senior") es lo que más se va a ajustar con el tiempo a medida que se vea qué tan bien agrupa tickets o qué tan bien redacta Claude. `MeetingAIService`, en cambio, es la parte estable: cómo se llama a la API, cómo se valida la respuesta, cómo se convierte en `TicketDraft[]`. Si ambas cosas vivieran en el mismo archivo, cada ajuste de redacción arriesgaría romper por accidente la llamada a la API o la validación. Separado, ajustar el prompt es editar únicamente `MeetingPromptBuilder.buildSystemPrompt`/`buildUserMessage` — nada más cambia.

### El responsable lo decide la app, nunca Claude

`AnalysisResponseSchema` (el esquema que valida la respuesta de Claude) **no tiene ningún campo para "responsable"** — no es una regla de prompt que el modelo podría ignorar, es que estructuralmente no existe dónde ponerlo. `server.ts` resuelve `userSettingsService.resolveDefaultResponsible()` (usuario autenticado, o el override de "Configuración") _antes_ de llamar a la IA, y `MeetingAIService.analyzeMeetingNotes` estampa ese mismo valor en cada `TicketDraft` después de recibir la respuesta de Claude. Claude solo lo recibe como una línea de contexto en el prompt ("el responsable ya fue decidido, no te corresponde a ti").

### Cómo esta arquitectura permitiría sustituir Claude por otro proveedor sin tocar el resto de la app

Todo el conocimiento de "cómo se le habla a Claude" está encapsulado en dos archivos: `MeetingPromptBuilder` (el texto) y `MeetingAIService` (el cliente de la API y el esquema de validación). `MeetingProcessor`, `server.ts` y el frontend solo conocen la forma `TicketDraft[]` — nunca importan `@anthropic-ai/sdk` ni saben que el proveedor es Anthropic. Cambiar de proveedor sería reescribir el contenido de esos dos archivos (la llamada HTTP/SDK y, si hace falta, el formato del prompt) sin tocar `MeetingProcessor.analyzeMeetingNotes`, las rutas de `server.ts`, ni el modal de revisión — todos ellos siguen recibiendo exactamente el mismo `TicketDraft[]` que reciben hoy.

### Validación de la respuesta de Claude

`MeetingAIService` usa `client.messages.parse()` con un esquema Zod (`AnalysisResponseSchema`) vía `output_config.format` — la respuesta de Claude se valida contra ese esquema antes de convertirse en `TicketDraft[]`. Si la llamada falla (red, límite de la API) o la respuesta no calza con el esquema (`parsed_output` viene vacío), `analyzeMeetingNotes` lanza un error claro y `POST /api/meeting-notes/analyze` responde con ese mensaje — sin guardar ninguna propuesta pendiente y sin que exista ninguna forma de llegar a `create-tickets` con datos a medias.

### Por qué el "tiempo de trabajo" no se convierte hasta el último momento

Claude devuelve `estimatedHours` como número decimal — exactamente lo que ya guarda el metadato del bloque (`{ type: "estimatedTime", value: 2.5 }`), sin inventar una conversión intermedia. La conversión a duración ISO 8601 que exige la API de OpenProject (`hoursToIso8601Duration`, ya existente) ocurre dentro de `OpenProjectService.createTicketsFromDrafts`, justo antes de llamar a `client.createWorkPackage` — es una conversión de unidades ya resuelta por código existente, no una reinterpretación de texto libre por parte de la IA.

## Proyectos y navegación (Sidebar)

Hasta ahora la app tenía una sola vista: el editor. Con varios equipos/clientes usándola, hacía falta un concepto de **proyecto** para organizar las reuniones — de ahí la Sidebar, y el primer paso de un modelo que crecerá con múltiples reuniones, historial y configuración por proyecto.

### Proyecto local vs. proyecto de OpenProject — por qué son dos cosas distintas

```ts
interface LocalProject {
  id: string;
  name: string;
  openProjectId: number;
  openProjectName: string;
}
```

Un `LocalProject` **no es** un proyecto de OpenProject: es la unidad de organización de esta app, y solo guarda una _referencia_ (`openProjectId`/`openProjectName`) hacia uno. Separarlos importa por varias razones concretas:

- **Los ciclos de vida son distintos.** Un proyecto de OpenProject lo administra otra herramienta, con sus propios permisos y su propio dueño; esta app no debería poder crearlo, borrarlo ni renombrarlo sin querer. Un `LocalProject` es solo nuestro, se crea/borra libremente y nunca toca el proyecto real detrás.
- **La app va a guardar cosas que a OpenProject no le interesan.** Reuniones, notas, historial, configuración — todo eso cuelga del `LocalProject`, no del proyecto de OpenProject. Mezclar ambos conceptos habría forzado a inventarle a OpenProject un lugar para guardar datos que no son suyos, o a duplicar la relación en todas partes.
- **Un mismo proyecto de OpenProject podría, a futuro, tener más de un `LocalProject`** (por ejemplo, distintas líneas de trabajo dentro del mismo cliente) sin que eso implique nada raro del lado de OpenProject — la referencia es de muchos-a-uno, no una identidad compartida.
- **Si el día de mañana cambia cómo se identifican los proyectos en OpenProject** (o se soporta otro backend de tickets además de OpenProject), solo cambia el campo de referencia dentro de `LocalProject`; el resto de la app (Sidebar, notas, navegación) no sabe ni le importa qué hay del otro lado.

### `ProjectService` — proyectos locales, no OpenProject

`src/services/ProjectService.ts` es el único lugar que crea, lista y persiste `LocalProject`s. Hoy los guarda en `data/projects.json` (un array, reescrito completo en cada `create`), cargado en memoria una vez al arrancar. Es deliberadamente la implementación más simple que cumple el contrato (crear/listar/obtener/guardar/cargar) sin construir una capa de "repositorio" o interfaz abstracta que hoy no hace falta: si el día de mañana esto pasa a SQLite o Postgres, es **este único archivo** el que se reescribe — nadie más en la app sabe (ni debería saber) que los proyectos viven en un JSON.

### `OpenProjectService` — por qué sigue siendo el único que le habla a OpenProject

La regla se mantiene igual que en el rediseño anterior, ahora reforzada: **ningún componente de interfaz hace `fetch` directo a la API de OpenProject**, ni siquiera para algo tan simple como listar proyectos. El flujo real es:

```
client/sidebar.ts  →  GET /api/openproject-projects  →  server.ts  →  OpenProjectService.listAvailableProjects()  →  OpenProjectClient
```

`OpenProjectService` ganó un método (`listAvailableProjects`, que reutiliza `OpenProjectClient.listProjects()` — ya existía, no se reescribió nada) pero sigue siendo la _única_ puerta de entrada a OpenProject. Esto importa porque:

- Si OpenProject cambia su forma de autenticar, pagina distinto, o hay que cachear la lista de proyectos para no golpear la API en cada tecleo del buscador, el cambio vive en un solo archivo.
- El navegador nunca ve el token de API (sigue viviendo solo en `.env`, leído por el backend) — el mismo argumento de seguridad de siempre, ahora también aplicado al listado de proyectos.
- El resto de la app (Sidebar, `ProjectService`, y a futuro `MeetingProcessor`) solo conoce métodos de dominio (`listAvailableProjects`, `createTicketsFromDrafts`), nunca URLs ni el formato de respuesta de la API REST de OpenProject.

### Por qué la Sidebar se diseñó ya como un componente reutilizable

La Sidebar (`client/sidebar.ts`) no sabe nada de Tiptap ni de tickets: solo sabe de proyectos y de mostrar/ocultar vistas. Esa separación es la que permite que, sin rediseñar nada, mañana se le agregue:

- Más de una opción en el menú desplegable de cada proyecto (ya está preparado como una lista de acciones por proyecto, no una sola opción cableada a mano).
- Más de una vista dentro de "un proyecto" (hoy conmuta entre `#empty-view` y `#notes-view`; una tercera vista, ej. "Historial de reuniones" o "Configuración", es otro `<section class="view">` más y una línea en el switch de navegación, no una reestructuración).
- Estado activo/selección persistente, breadcrumbs, búsqueda de proyectos, etc. — todo son adiciones a un componente que ya existe, no una reescritura.

El editor (`client/editor.ts`) **no se tocó en su lógica de edición**: la Sidebar solo oculta/muestra el contenedor donde vive (atributo `hidden`, nativo del navegador, sin librería de routing) y le pide que abra una nota. Es la prueba de que la separación de responsabilidades del rediseño anterior (interfaz vs. servicios) también sirve _dentro_ del frontend: la Sidebar y el editor son dos piezas independientes que se coordinan por eventos de DOM, no por código compartido (ver la siguiente sección).

### Por qué Tom Select y no un `<select>` nativo

Con ~200 proyectos reales en la instancia de OpenProject usada para probar esto, un `<select>` nativo obliga a desplazarse por una lista larga sin poder escribir para filtrar. Tom Select (sucesor moderno y sin jQuery de Select2, activamente mantenido) agrega búsqueda incremental sobre el mismo `<select>` con un footprint pequeño (~100 KB sin minificar, sin plugins que no se usan — se importa `tom-select/base`, no el paquete completo). Su CSS por defecto es claro; `public/styles.css` lo re-skinea a oscuro reutilizando las mismas variables (`--bg`, `--text`, `--accent`) del resto de la app, así que no hay dos temas conviviendo.

### Endpoints nuevos

| Método y ruta                            | Qué hace                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `GET /api/openproject-projects`          | Proyectos reales de OpenProject, para el buscador del modal                |
| `GET /api/projects`                      | Proyectos locales, para poblar la Sidebar                                  |
| `POST /api/projects`                     | Crea un proyecto local (`{ name, openProjectId, openProjectName }`)        |
| `GET /api/projects/:id/assignable-users` | Usuarios del proyecto de OpenProject vinculado, para el modal "Asignado a" |

## Notas de reunión (`MeetingNote`)

Cada proyecto ahora puede contener muchas reuniones. Una nota es una entidad propia, no un campo dentro del proyecto:

```ts
interface MeetingNote {
  id: string;
  projectId: string;
  title: string;
  document: MeetingDocument; // el JSON de Tiptap, ver sección anterior
  createdAt: string;
  updatedAt: string;
}
```

### Por qué la nota es una entidad independiente y no vive dentro de `LocalProject`

Sería más corto guardar `notes: MeetingNote[]` como un array dentro de cada `LocalProject`. Se descartó a propósito:

- **Cardinalidad y crecimiento.** El propio objetivo dice "decenas o cientos de reuniones por proyecto". Un proyecto con 300 notas embebidas significa que _cada_ operación sobre el proyecto (listarlo en la Sidebar, renombrarlo, lo que sea) carga o reescribe las 300 notas con él. Con la nota como entidad propia (su propio archivo, su propia fila el día de mañana), listar proyectos es barato siempre, sin importar cuántas notas tenga cada uno.
- **Cada una tiene su propio ciclo de vida.** Un `MeetingNote` se crea, se edita y (a futuro) se archiva o elimina _independientemente_ de que el proyecto exista o cambie. Igual que `LocalProject` no debía vivir mezclado con el proyecto de OpenProject (mismo argumento, un nivel más abajo): una nota que se pudiera editar solo "a través" del proyecto forzaría a que toda operación de nota pasara primero por cargar y reescribir el proyecto entero.
- **La relación ya es explícita y suficiente.** `projectId` en la nota apunta al proyecto — no hace falta que el proyecto también apunte de vuelta a sus notas; eso sería el mismo dato guardado dos veces (y con el riesgo de que un día diverjan). `MeetingNoteService.listByProject(projectId)` es la única fuente de verdad para "qué notas tiene este proyecto": ni la Sidebar ni ningún otro código mantiene su propia copia de esa relación.

### `MeetingNoteService` — misma responsabilidad, un nivel más abajo que `ProjectService`

`src/services/MeetingNoteService.ts` es, a propósito, el mismo patrón que `ProjectService` (JSON plano en `data/notes.json`, cargado una vez en memoria, migrable a SQLite/Postgres sin que nadie más lo note) — dos entidades, dos archivos con la misma forma, en vez de una abstracción de "repositorio genérico" que hoy no hace falta. Expone exactamente los métodos pedidos: `create`, `listByProject`, `get`, `updateTitle`, `updateDocument` (`save`/`load` son privados: nadie fuera de esta clase necesita saber que el mecanismo hoy es un archivo JSON). Reutiliza `MeetingDocumentService.load()` para validar la forma del documento antes de guardarlo — esa validación no se duplicó, solo se le encontró un segundo consumidor.

La Sidebar **no** guarda ni carga notas por su cuenta: siempre pasa por los endpoints que llaman a este servicio (`GET/POST /api/projects/:id/notes`, `PATCH /api/notes/:id`). Es la misma regla de "ningún componente de interfaz habla directo con la fuente de datos" que ya regía para OpenProject, aplicada ahora a las notas.

### El título: por qué un `div` editable y no un `<input>`

Un título de nota necesitaba sentirse "parte del documento" (pedido explícito), no un campo de formulario aparte. Un `<input>` trae su propio recuadro, su propia tipografía de formulario y no permite, por ejemplo, que después crezca a más de una línea si hiciera falta. Un `<div contenteditable>` es contenido real de la página: se estiliza como un título (`font-size` grande, `font-weight: 700`) igual que cualquier otro texto, sin caja de formulario alrededor.

El placeholder ("Añade un título...") usa la misma técnica CSS nativa que ya tenía el editor Tiptap para su propio placeholder (`::before` con `content: attr(data-placeholder)`) — reutilizada, no reinventada. La diferencia es el _fade_: Tiptap oculta/muestra su placeholder con la pseudo-clase `:empty`, que aparece y desaparece de golpe (no es animable). Para el fade suave pedido, `editor.ts` alterna una clase `is-empty` en cada tecleo, y es esa clase — no `:empty` — la que gobierna la opacidad del `::before` en CSS, así el `transition: opacity` sí tiene algo continuo que animar.

### Por qué el título de la Sidebar se sincroniza sin esperar al guardado

El requisito era explícito: reactivo, no "cuando se guarde". Esto separa dos relojes distintos que antes se hubieran mezclado en uno:

1. **Sincronización visual (Sidebar ↔ editor): instantánea, sin red.** Cada tecleo en el título dispara un `CustomEvent` (`meeting-note:title-changed`) en `window` con el id de la nota y el texto actual. `sidebar.ts` lo escucha y actualiza _solo el nodo de texto_ de esa nota en el árbol — no vuelve a pedir la lista de notas al servidor, no re-renderiza la Sidebar completa (eso además cerraría los submenús abiertos de otros proyectos). Es DOM local, así que no hay forma de que se sienta lento.
2. **Persistencia (autoguardado): con _debounce_, por red.** El mismo tecleo también programa un `PATCH /api/notes/:id` que espera 600ms de silencio antes de disparar, para no mandar una petición por cada letra. Si el usuario sigue escribiendo, el temporizador se reinicia.

Que vivan separadas es la razón por la que la UI se siente inmediata (nunca espera a la red) sin que el servidor reciba tráfico innecesario. `editor.ts` y `sidebar.ts` siguen sin importarse código entre sí — coordinan por este evento y por `window.notesEditor.openNote(note)` (la única función que la Sidebar puede llamarle al editor), exactamente el mismo patrón de "coordinar por DOM, no por módulos compartidos" que ya se usaba para mostrar/ocultar vistas.

### Cómo esto prepara el terreno para que la IA procese varias reuniones de un mismo proyecto

Con `MeetingNoteService.listByProject(projectId)` ya devolviendo todas las notas de un proyecto (cada una con su `MeetingDocument` completo), el día que `MeetingProcessor` necesite "mira todas las reuniones de CTSO del último mes y decide qué tickets faltan", esa consulta ya existe — no hay que inventar una forma nueva de encontrar las notas de un proyecto. Cada nota es un documento JSON independiente y con su propia fecha (`createdAt`), así que agruparlas, ordenarlas cronológicamente o pasárselas a Claude una por una (o todas juntas) es trabajo de `MeetingProcessor`, no de un nuevo mecanismo de almacenamiento.

### Qué más habilita esta estructura sin rediseñar nada

Como cada nota ya es una entidad con su propio `id`, `projectId`, `title`, `updatedAt`, funcionalidades típicas de una app de notas son, cada una, una adición local y no un cambio de arquitectura:

- **Búsqueda**: filtrar el array que ya devuelve `listByProject` (o, a más escala, indexar `title`/`document` en el servicio) — no hace falta tocar `LocalProject` ni el editor.
- **Favoritos/archivado**: un campo booleano más en `MeetingNote` (`archived?: boolean`) y un filtro en `listByProject`; el resto de la app ni se entera.
- **Historial de reuniones**: ya existe — es literalmente `listByProject` ordenado por `createdAt`. Falta una vista que lo muestre (otra `<section class="view">`, mismo patrón que `#empty-view`/`#notes-view`), no un modelo de datos nuevo.
- **Renombrar/eliminar una nota**: un método más en `MeetingNoteService` siguiendo el patrón de `updateTitle`/`updateDocument`, y un botón más en `.note-row`.

## Metadatos por bloque (menú contextual "+")

Durante una reunión, algunas líneas son notas sueltas y otras terminarán siendo un ticket con dueño. En vez de forzar un formulario aparte, cada bloque del editor (un párrafo, un título) puede llevar metadatos propios — hoy solo "asignado a", pensado para crecer.

### Cómo se investigó la estrategia antes de implementar

La pregunta central era: ¿cómo le atas un dato estructurado (`{ assignee: { id, name } }`) a _un párrafo en concreto_, sin que sea texto que la IA tenga que interpretar? Tiptap (ProseMirror) ya resuelve exactamente esto con **atributos de nodo**: cualquier nodo del esquema (`paragraph`, `heading`, ...) puede declarar atributos arbitrarios que viajan con él en el documento y en su serialización JSON. La alternativa fácil — meter un `[assignee: Brayan]` como texto, o un comentario HTML — se descartó explícitamente en el pedido, y con razón: sería de nuevo el problema que ya se resolvió al pasar de HTML a JSON (ver sección "El documento"): un dato que la IA tendría que _adivinar_ parseando texto, no leer directamente.

La pieza que faltaba por resolver era _cómo_ declarar ese atributo sin tener que redefinir cada tipo de nodo (`paragraph`, `heading`, y cualquier otro que se sume después). La respuesta de Tiptap es `Extension.create({ addGlobalAttributes() })`: una extensión declara "estos tipos de nodo ganan este atributo", sin tocar la definición de `paragraph` ni de `heading`. Es la pieza correcta para este problema — no una capa genérica inventada, sino el mecanismo que Tiptap ya expone para esto.

### Cómo se almacenan los metadatos: un array ordenado, no un objeto

La primera versión de esto guardaba `metadata` como un objeto libre (`{ assignee?: {...} }`). Cambió a un **array de `MetadataItem`** (`{ type: string; [key]: unknown }[]`) por una razón concreta: en cuanto un bloque puede tener varios metadatos a la vez (asignado, prioridad, fecha límite...), el _orden_ en que el usuario los acomoda es en sí mismo un dato — y un objeto de JavaScript no tiene orden garantizado ni forma natural de expresar "este chip va antes que aquel otro". Un array sí. `client/blockMetadataExtension.ts` sigue declarando un único atributo (`metadata`) vía `addGlobalAttributes` sobre `paragraph`/`heading` — el cambio es de qué tipo de valor guarda ese atributo, no de cómo se declara.

El comando `setBlockMetadataItem(item)` reemplaza al anterior `setBlockMetadata(patch)`: en vez de fusionar un objeto, _inserta o reemplaza por `type`_ dentro del array, preservando la posición si ese tipo ya existía (para que reasignar a otra persona no reordene los chips que ya estaban ahí).

### `MetadataChip` y `MetadataContainer`: por qué se extrajeron del editor

El chip ya no vive como una función suelta dentro de la extensión — se movió a `client/metadata/`, en tres piezas con responsabilidades separadas:

| Archivo                         | Responsabilidad                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `metadata/types.ts`             | La forma de un `MetadataItem` y del `MetadataRegistry` (qué tipos de metadato existen) |
| `metadata/MetadataChip.ts`      | Pinta **un** chip: ícono + etiqueta. No sabe de clics, de arrastre, ni de "asignado"   |
| `metadata/MetadataContainer.ts` | Pinta la fila completa de chips de un bloque, y es dueño del arrastre/reordenamiento   |

Esta separación importa porque, tal como pedía el objetivo, **el editor únicamente monta el contenedor**: `blockMetadataExtension.ts` no sabe qué es un chip por dentro, solo llama a `createMetadataContainer({ items, registry, ... })` dentro de su decoración de ProseMirror y le pasa dos callbacks (`onReorder`, `onChipClick`). `MetadataContainer`/`MetadataChip` tampoco saben qué es Tiptap, ProseMirror, ni una transacción — son DOM puro, reutilizable fuera de este proyecto si hiciera falta. Quien traduce "el usuario reordenó" o "el usuario hizo clic" en un cambio real del documento es, exclusivamente, `blockMetadataExtension.ts`.

Ni `MetadataChip` ni `MetadataContainer` conocen "assignee": ambos reciben un **`MetadataRegistry`** (definido en `editor.ts`) que mapea cada `type` a su ícono, su función de etiqueta y qué hacer al hacer clic. Hoy el registro tiene una sola entrada:

```ts
const metadataRegistry: MetadataRegistry = {
  assignee: {
    icon: "👤",
    label: (item) => item.name as string,
    onClick: () => openAssigneeModal(),
  },
};
```

`onClick` reutiliza `openAssigneeModal()` **tal cual** — la misma función que ya usaba el menú "+" para asignar por primera vez. Al hacer clic en un chip existente, la extensión mueve el cursor al bloque de ese chip y llama a esta misma función; como `openAssigneeModal` ubica el bloque a partir de la posición del cursor (igual que siempre lo hizo), no hizo falta escribir ninguna lógica nueva para "cambiar el asignado" — es la lógica de "asignar" de siempre, disparada desde un segundo lugar.

### Cómo funciona el arrastre (drag & drop) por dentro

Sin librerías: Pointer Events nativos del navegador (unifican mouse y touch en una sola API). En `MetadataContainer`:

1. `pointerdown` sobre un chip arma el seguimiento, pero **no decide todavía** si es un clic o un arrastre.
2. En cada `pointermove`, si el puntero se movió más de 4px desde el punto inicial, se considera arrastre: el chip gana la clase `.dragging` (el estado visual "levantado") y se reubica _en el DOM real_ entre sus hermanos, comparando la posición X del puntero contra el punto medio de cada chip vecino — no hay reconstrucción de la lista en cada frame, el propio nodo se mueve con `insertBefore`, así conserva sus listeners y su identidad durante todo el gesto.
3. En `pointerup`: si hubo arrastre, se lee el orden final directamente del DOM (`[...container.children]`) y se llama a `onReorder(nuevoOrden)`. Si nunca se cruzó el umbral de 4px, se interpreta como un clic normal y se llama a `onChipClick(item)` en su lugar — la misma interacción (`pointerdown` → `pointerup`) resuelve ambos casos según cuánto se movió el puntero en el medio, sin un temporizador de "mantener presionado" que retrase el arranque del arrastre.

> Bug real encontrado al probar esto: el primer intento no reordenaba nada. La causa era que el `pointerdown` sobre el chip, aunque el chip es una decoración "no editable", igual hacía que ProseMirror moviera su selección nativa ahí — eso dispara una transacción, y una transacción recalcula **todas** las decoraciones del documento, destruyendo a mitad de camino el propio chip que se estaba arrastrando (el `container`/`chip` que seguía el arrastre quedaban huérfanos, reemplazados por unos nuevos sin los listeners del gesto en curso). La solución es una línea: `event.preventDefault()` en el `pointerdown`, que le dice al navegador/ProseMirror que no toque la selección por esto.

### Cómo se persiste el orden

El nuevo orden no es un efecto puramente visual: `onReorder` en `blockMetadataExtension.ts` hace `state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, metadata: nuevoOrden })` — la MISMA operación que ya se usaba para asignar, solo que reemplazando el array completo en vez de un único item. A partir de ahí sigue el camino que ya existía: ese cambio dispara `editor.on("update")` → autoguardado con _debounce_ → `PATCH /api/notes/:id` → `MeetingNoteService.updateDocument()` → `data/notes.json`. El orden de los chips no tiene su propio mecanismo de guardado: es simplemente parte del `document` de la nota, como el texto o las imágenes.

### Cómo se serializan dentro del JSON

Al ser un atributo de nodo estándar, `editor.getJSON()` lo saca solo, sin código adicional: aparece como cualquier otro atributo, dentro de `attrs`, ya como array y en el orden visual exacto de los chips:

```json
{
  "type": "paragraph",
  "attrs": {
    "metadata": [
      { "type": "priority", "label": "Alta" },
      { "type": "assignee", "id": 48, "name": "Breyner Pinto" }
    ]
  },
  "content": [{ "type": "text", "text": "Agregar columna en el datatable de medicamentos" }]
}
```

(Los atributos de nodo en Tiptap siempre van anidados bajo `attrs`, no sueltos al mismo nivel que `type`/`content` — vale la pena tenerlo presente si `MeetingProcessor` va a leer `node.attrs.metadata` más adelante.)

### El diseño visual: Material 3 + Liquid Glass, sin copiar ninguno al 100%

El chip dejó de ser texto plano (`👤 Nombre`) para ser una píldora compacta: `border-radius: 999px` (Material 3), fondo semitransparente + `backdrop-filter: blur()` muy sutil (el toque "liquid glass"), borde de 1px casi invisible, sombra mínima — todo dentro de la misma paleta oscura del resto de la app (`var(--surface)`, `var(--border)`, `var(--accent)`), para que se sienta un metadato del documento y no un botón importado de otra interfaz. El hover (`scale(1.045)` + borde que vira hacia `--accent` + sombra que crece un poco) y el estado de arrastre (`scale(1.08)`, opacidad reducida, sin transición para que siga al puntero sin retraso) son puramente CSS, sin JS animando nada — la clase `.dragging` la agrega/quita `MetadataContainer`, el resto lo hace la hoja de estilos.

### Cómo crece esto sin rediseñar el editor

Añadir un metadato nuevo (prioridad, fecha límite, etiquetas, tiempo estimado, ...) es, cada vez, el mismo puñado de pasos chicos, no una pieza de arquitectura nueva:

1. Una entrada más en `metadataRegistry` (`editor.ts`): su ícono, cómo formatear su etiqueta, y qué modal abrir al hacer clic.
2. Un botón más en `#block-menu` (`index.html`), con su propio `data-action`.
3. Una entrada más en `BLOCK_MENU_ACTIONS` (`editor.ts`) que abra ese modal para _agregar_ el metadato la primera vez (`editor.commands.setBlockMetadataItem({ type: "...", ... })` — el comando ya existe, no cambia).

`MetadataChip`, `MetadataContainer` y `blockMetadataExtension.ts` no cambian una línea: ya saben renderizar, reordenar y persistir cualquier `type` que aparezca en el registro. Tampoco cambia `MeetingNoteService` ni el autoguardado — el nuevo metadato viaja dentro del mismo `document`, como el `assignee` de hoy.

### Cómo esto facilita que la IA convierta el documento en tickets sin interpretar texto libre

Cuando `MeetingProcessor.analyzeWithClaude` se implemente, el asignado de un bloque va a estar en `node.attrs.metadata` (un array; basta buscar el item con `type === "assignee"` para leer `.id`/`.name`) — un campo estructurado, no algo que haya que extraer de "che, Brayan encárgate de esto" con una heurística de lenguaje natural. Sirve exactamente al mismo objetivo que llevó a usar JSON en vez de HTML: cuantos más datos vengan ya estructurados desde el editor, menos tiene que _inferir_ la IA, y menos margen de error hay en esa inferencia. Cuando existan más tipos de metadato, Claude podría incluso generarlos él mismo con la misma forma (`{ type: "priority", value: "alta" }`) para que el editor los muestre con el mismo componente, sin distinguir si el chip lo puso una persona o la IA. `TicketDraft`/`TicketSection` (ver `OpenProjectService`) ya podrían extenderse con un campo `assigneeId` leído directamente de aquí, sin ningún paso de interpretación en el medio.

### Por qué el botón "+" espera ~3 segundos

El requisito explícito era "no invasivo": que aparecer no interrumpa mientras se escribe. `editor.ts` reinicia un temporizador de 3s en cada `update` (tecleo) y cada `selectionUpdate` (mover el cursor) — solo si ninguno de los dos vuelve a dispararse en ese lapso, se calcula la posición del bloque actual (vía `editor.view.nodeDOM`) y se muestra el botón ahí, con una transición de opacidad. Es el mismo patrón que ya usa el menú flotante de selección (`BubbleMenu` de Tiptap): un elemento fuera del documento, posicionado a mano, que aparece y desaparece por CSS.

### Por qué el modal de "Asignado a" solo trae usuarios del proyecto

El Select de usuarios no llama a OpenProject directamente desde el navegador (regla ya establecida: toda comunicación con OpenProject pasa por `OpenProjectService`). El camino es: la nota abierta sabe su `projectId` (local) → `GET /api/projects/:id/assignable-users` en `server.ts` → busca el `LocalProject` → toma su `openProjectId` → `OpenProjectService.listAssignableUsers()` → `OpenProjectClient.listAssignableUsers()` (el mismo método que ya existía, reutilizado sin cambios). El resultado es que el buscador solo muestra a quienes de verdad pertenecen al proyecto de OpenProject vinculado, no a cualquier usuario de la instancia.

> Detalle de implementación que costó descubrir: `keepOnSplit: false` en el atributo `metadata` (la opción documentada de Tiptap para "no copiar este atributo al partir un bloque") no bastó por sí sola — el comando interno `splitBlock` tiene una ruta donde igual copia `node.attrs` sin filtrar, así que al presionar Enter sobre un bloque con asignado, el bloque nuevo heredaba el mismo asignado, y así con cada Enter sucesivo. La solución fue interceptar `Enter` explícitamente en `blockMetadataExtension.ts` (`addKeyboardShortcuts`): si el bloque actual no tiene metadato, no hace nada y deja pasar el comportamiento normal (listas, etc.); si lo tiene, ejecuta el split y borra el metadato del bloque recién creado a mano.

## Configuración

### Instalar dependencias

```bash
npm install
```

### Variables de entorno

```bash
cp .env.example .env
```

| Variable                 | Qué es                                                                                                                                                       | Dónde encontrarlo                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `OPENPROJECT_BASE_URL`   | URL base de tu instancia (compartida, no es un secreto por PM)                                                                                               | Lo que va antes de `/projects/...`, ej. `https://tuempresa.openproject.com` |
| `OPENPROJECT_API_TOKEN`  | Opcional — solo la usa `npm run create-ticket` (CLI de prueba). La app web ya no necesita esta variable: cada PM configura su propia Key desde Configuración | Mi cuenta → Ajustes de acceso → Tokens de API                               |
| `OPENPROJECT_PROJECT_ID` | Identificador o ID del proyecto por defecto de la CLI                                                                                                        | Visible en la URL del proyecto: `.../projects/ESTE-VALOR`                   |
| `ANTHROPIC_API_KEY`      | API Key de Claude — fija, de la aplicación (no por PM, ver sección de IA)                                                                                    | https://console.anthropic.com/settings/keys                                 |

El archivo `.env` no se sube a git (está en `.gitignore`).

### Arrancar

```bash
npm run start
```

Abre `http://localhost:3000`: verás la Sidebar a la izquierda (vacía la primera vez) y un mensaje invitando a crear un proyecto. Pulsa **+ Crear Proyecto**, ponle un nombre y busca el proyecto real de OpenProject al que se vincula. Una vez creado, aparece en la Sidebar (📁 nombre); haz clic para desplegarlo y pulsa **+ Crear Notas**: se crea una nota vacía, aparece de inmediato como 📝 debajo del proyecto, y se abre en el editor con el título en blanco (placeholder "Añade un título..."). Escribe el título y el cuerpo con los atajos de markdown (`# `, `## `, `- `, `1. `, `**negrilla**`, `*cursiva*`, `---`), o selecciona texto para usar el menú flotante. Pega o arrastra una imagen para insertarla. Todo se autoguarda (título y contenido quedan en `data/notes.json` segundos después de dejar de teclear); recarga la página, vuelve a expandir el proyecto y haz clic en la nota para comprobar que sigue ahí. Al pulsar CREAR TICKETS verás el mensaje "Análisis con IA pendiente de implementar..." — es el comportamiento esperado hoy.

## Cómo se autentica con la API de OpenProject (sin cambios)

OpenProject usa **HTTP Basic Auth** con un API Token:

- Usuario: literalmente la palabra `apikey`
- Contraseña: tu token de API

```ts
this.authHeader = "Basic " + Buffer.from(`apikey:${apiToken}`).toString("base64");
```

Referencia oficial: https://www.openproject.org/docs/api/authentication/

## Cómo se crea un ticket con secciones e imágenes (sin cambios)

Un ticket en OpenProject es un **work package**. `OpenProjectClient.createWorkPackage()` (`src/openProjectClient.ts`) recibe una o varias `TicketSection` (`{ description, images? }`) y:

1. Crea el work package con el texto de cada sección (sin imágenes todavía: un adjunto solo puede subirse cuando el work package ya existe).
2. Sube las imágenes de cada sección como adjuntos (`POST /api/v3/work_packages/{id}/attachments`, `multipart/form-data`).
3. Reescribe la descripción (`PATCH /api/v3/work_packages/{id}`), con cada sección seguida de sus imágenes embebidas en markdown (`![nombre.png](/api/v3/attachments/{id}/content)`), separadas por `---`. Con una sola sección se omite el encabezado "Sección N".

> Detalles de implementación que costó descubrir (documentados en el código): al subir un adjunto, el campo `metadata` del `FormData` debe ir como string plano, no como `Blob` (si no, Rails lo confunde con un archivo y falla con un error interno).

### CLI para crear un ticket a mano

Sigue disponible, sin cambios, útil para probar la integración sin pasar por la IA:

```bash
npm run create-ticket -- "Arreglar el login" "El botón de login no responde en móvil"
```

## Qué falta (a propósito)

- La propuesta de tickets pendiente de revisión (`pendingAnalyses` en `server.ts`) vive solo en memoria del proceso — un reinicio del servidor entre "analizar" y "confirmar" pierde la propuesta (el PM tendría que pulsar "CREAR TICKETS" otra vez). Aceptable hoy porque es una sola sesión activa a la vez; con varios PMs simultáneos esto pasaría a necesitar una clave por usuario, no una expiración.
- El modal de revisión no permite editar un ticket antes de confirmar (solo verlo y cancelar/confirmar el lote completo) — no se pidió edición inline, y agregarla no cambia la arquitectura descrita arriba: seguiría siendo el mismo `TicketDraft[]`, solo mutado en el navegador antes de reenviarlo.
- Metadatos disponibles hoy: `assignee`, `estimatedTime`, `dueDate`. Agregar el siguiente (prioridad, etiquetas, ...) son los mismos 3 pasos documentados en la sección de metadatos, sin tocar `MetadataChip`/`MetadataContainer`.
- Configuración sigue siendo **una sola, global** (`data/user-settings.json` no distingue PMs todavía — no se pidió autenticación aún). La sección "Configuración del PM" explica exactamente qué cambiaría el día que exista login real.
- Sin editar/eliminar/archivar notas o proyectos, ni buscador, ni recordar cuál era el proyecto/nota activa al recargar — el mínimo para probar el flujo era crear, listar y autoguardar. La sección de notas explica por qué el modelo ya soporta agregar esto sin rediseñar nada.
- Nada de autenticación de usuarios — el mismo alcance que tenía el proyecto original.
