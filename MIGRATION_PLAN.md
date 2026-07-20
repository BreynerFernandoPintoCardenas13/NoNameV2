# MIGRATION_PLAN.md — Contrato de migración NoNameV1 → NoNameV2

> **Documento de arquitectura.** Analiza el 100 % de `~/Documentos/NoNameV1` (proyecto funcional) y el estado actual de `~/Documentos/NoNameV2` (proyecto definitivo). Ningún archivo fue modificado para producir este documento. Cualquier desarrollador debe poder ejecutar la migración completa leyendo únicamente este plan.

---

## 0. Advertencia previa: qué es realmente cada proyecto

Antes de cualquier inventario hay que corregir dos supuestos del enunciado, porque afectan todas las decisiones posteriores:

1. **NoNameV1 NO es una aplicación React.** Es un **servidor Express 4 + TypeScript** con un cliente **vanilla TypeScript** (sin framework) empaquetado con esbuild. No existen componentes React, ni hooks, ni contextos, ni React Router. El "frontend" es un único `index.html` de 322 líneas con ~10 modales declarados estáticamente, manipulado con `document.getElementById` desde 11 módulos TS. Donde el enunciado pide inventariar "hooks" y "context providers", este documento inventaría sus **equivalentes reales**: módulos de cliente, extensiones de TipTap y servicios de servidor.
2. **NoNameV2 NO usa Vite.** Es **Next.js 16.2.10 (App Router, React 19, Turbopack)**. Todo lo demás del enunciado es correcto: TypeScript, Tailwind v4, Supabase, PostgreSQL, OAuth Google, verificación de email, Motion, React Bits, arquitectura modular. La migración descrita aquí apunta a Next.js 16, no a Vite.

Estas dos realidades convierten la migración en una **reescritura dirigida**, no en un copy-paste de componentes: la lógica de negocio de V1 (servicios de servidor, cliente de OpenProject, pipeline de IA, modelo de documento TipTap) se **porta casi tal cual**; toda la capa de UI (DOM imperativo) se **reescribe en React** usando el design system que V2 ya tiene.

---

## 1. Resumen ejecutivo

### Tamaño de NoNameV1

| Métrica                                           | Valor                                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Líneas de código fuente (TS + CSS + HTML)         | **~8.310**                                                                                                                                       |
| Archivos TypeScript de servidor                   | 14 (4 raíz + 10 servicios)                                                                                                                       |
| Archivos TypeScript de cliente                    | 11 (8 raíz + 3 en `metadata/`)                                                                                                                   |
| CSS                                               | 3 archivos (~3.200 líneas)                                                                                                                       |
| HTML                                              | 1 (`index.html`, 322 líneas, ~10 modales)                                                                                                        |
| Endpoints HTTP (Express)                          | **21**                                                                                                                                           |
| "Componentes" de UI (modales/paneles/widgets DOM) | **~24**                                                                                                                                          |
| Extensiones TipTap propias                        | **3** (BlockMetadata, TicketTracking, MeetingBlock)                                                                                              |
| Servicios de dominio (servidor)                   | **10**                                                                                                                                           |
| Hooks / Contextos React                           | **0** (no es React)                                                                                                                              |
| Utilidades                                        | 3 (`config.ts`, `duration.ts`, `createTicket.ts` CLI)                                                                                            |
| Datos persistidos                                 | 5 JSON en `data/` (`notes.json` pesa **11,6 MB** — ver §12)                                                                                      |
| Documentación                                     | `README.md` de **55 KB** — arquitectura, decisiones y debugging documentados con detalle excepcional. Es un activo de migración de primer orden. |

### Funcionalidad que V1 entrega hoy (y que no se puede perder)

1. **Proyectos locales** vinculados a proyectos reales de OpenProject (opcionalmente a un tablero y columna concretos).
2. **Notas de reunión** por proyecto: editor TipTap estilo Notion (título editable, bubble menu, imágenes por paste/drop como data-URL, autoguardado con debounce de 600 ms).
3. **Metadatos por bloque** (menú "+"): asignado (Tom Select con usuarios reales de OpenProject), horas estimadas, fecha límite (flatpickr) — chips reordenables por drag & drop, persistidos como atributos del JSON de TipTap.
4. **Bloque de Reunión**: nodo TipTap atómico con título, fecha, hora, duración, descripción y participantes (Encargados del proyecto + invitados externos).
5. **Pipeline de IA** (Claude `claude-sonnet-5`, structured output con Zod): notas → propuesta de `TicketDraft[]` → **revisión humana obligatoria** en modal → creación real en OpenProject → congelamiento (Frozen) de los bloques de origen con barra verde + chip enlazado al work package.
6. **Integración OpenProject completa**: Basic Auth por API Key personal del PM, proyectos, usuarios asignables/responsables, tipos de WP, creación de work packages con secciones + imágenes adjuntas re-embebidas en markdown, tableros (Grids `free`) y ubicación del ticket en columna vía endpoint no documentado `PATCH /queries/{id}/order`.
7. **Base de conocimiento** por proyecto (segundo editor TipTap en panel lateral, persistencia propia).
8. **Encargados** por proyecto (CRUD de personas: nombre, email, teléfono).
9. **Configuración del PM**: API Key de OpenProject (verificada contra `/users/me`), override del "Responsable" por defecto.
10. **Exportación**: descarga del JSON nativo de la nota (botón "Descargar notas").
11. UX: sidebar colapsable con árbol proyecto→notas (carga perezosa), renombrado inline, menú contextual reutilizable, modal de confirmación genérico para acciones destructivas, toasts.

### Estado actual de NoNameV2 (ya construido, NO tocar)

Landing completa (Hero con Beams WebGL, secciones, efectos React Bits), login con card + Google OAuth, registro en modal con Stepper de 4 pasos y verificación real de email, roles (`superadmin`/`admin`/`project_manager`), sistema `pay` 0/1, protección de rutas vía `src/proxy.ts`, tabla `users` con RLS y columna `openproject_api_key` de solo escritura, design system (`ui/` shadcn-style + `shared/` + `effects/`). Dependencias ya instaladas que la migración necesita: **`@tiptap/react` 3.28 + starter-kit + image + placeholder, `@anthropic-ai/sdk` 0.112, `zod` 4, TanStack Query 5, RHF 7, Prisma 7 (sin usar), axios, zustand**.

---

## 2. Arquitectura actual de NoNameV2

```
src/
├─ app/                       # Rutas Next (App Router) — SIEMPRE delgadas, delegan en modules/
│  ├─ page.tsx                # Landing
│  ├─ login/ dashboard/ verificar-email/ payment-required/
│  ├─ auth/callback/route.ts  # Intercambio PKCE / token de email
│  ├─ api/auth/verification-status/route.ts
│  ├─ design-system/          # Showcase interno del design system
│  ├─ layout.tsx · providers.tsx · globals.css
├─ modules/                   # Arquitectura feature-based (el patrón a seguir)
│  ├─ auth/
│  │  ├─ components/ hooks/ pages/ schemas/ services/ types/ utils/
│  └─ dashboard/pages/
├─ components/
│  ├─ ui/                     # Primitivas shadcn (Base UI): dialog, form, input, select…
│  ├─ shared/                 # Composiciones: modal, empty-state, sidebar-item, note-card…
│  ├─ effects/                # Ports de React Bits (beams, stepper, scroll-reveal…)
│  ├─ landing/                # Secciones de la landing
│  └─ animate-ui/             # Primitivas de Animate UI
├─ lib/                       # env (zod), env.public, fonts, utils(cn)
├─ hooks/                     # Hooks genéricos de librería
├─ features/                  # Carpetas placeholder (editor/notes/projects/tickets/settings)
├─ services/                  # ai/ database/(prisma) openproject/ storage — casi vacíos
├─ generated/prisma/          # Cliente Prisma generado (sin modelos aún)
└─ proxy.ts                   # Protección de rutas (Next 16: middleware → proxy)
supabase/migrations/          # SQL versionado (ya existe la migración de users)
```

### Por qué esta arquitectura es correcta

- **Feature-based (`modules/<feature>/{components,hooks,services,schemas,types,utils,pages}`)**: cada dominio (auth, y pronto projects, notes, tickets, openproject, ai) es autocontenido; el acoplamiento entre features es explícito (imports absolutos `@/modules/x`). Escala sin que `components/` se convierta en un cajón de sastre.
- **Rutas delgadas**: `app/*/page.tsx` solo importa la página del módulo. La lógica nunca vive en la capa de enrutado — se puede testear y mover sin tocar rutas.
- **Tres niveles de UI** (`ui/` primitivas → `shared/` composiciones → `modules/*/components` específicos): evita duplicación y mantiene la identidad visual centralizada.
- **Frontera servidor/cliente correcta**: secretos solo en Route Handlers/proxy (`lib/env.ts` server-only con Zod, `lib/env.public.ts` para lo público); la service role de Supabase jamás llega al bundle.
- **Servicios como única puerta a APIs externas**: el patrón `auth.service.ts` (los componentes nunca llaman al SDK directo) es exactamente el que V1 ya aplicaba en servidor (`OpenProjectService` como único hablante con OpenProject) — ambos proyectos coinciden en la filosofía, lo que facilita el mapeo 1:1 de servicios.
- **SQL versionado en `supabase/migrations/`** + RLS por defecto: la seguridad vive en la base de datos, no solo en el código.

**Decisión de contrato**: las carpetas vacías `src/features/*` se consideran **obsoletas** — la convención ganadora es `src/modules/*`. Al migrar, eliminar `features/` (su único archivo real, `features/editor/note-editor.tsx`, se absorbe en `modules/notes/`).

---

## 3. Inventario completo de NoNameV1 (archivo por archivo)

Leyenda de veredictos — **Portar**: se traslada casi tal cual (ajustes de imports/entorno). **Reescribir**: la lógica/spec se conserva, el código se reescribe para React/Next/Supabase. **Reutilizar**: V2 ya tiene un equivalente; se usa ese. **Eliminar**: no se migra.

### 3.1 Servidor (`src/`)

| Archivo                    | Líneas | Qué hace                                                                                                                                                                                                                                                                                                                                                                        | Veredicto                                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/server.ts`            | 505    | Express: 21 endpoints REST (proyectos, notas, knowledge, managers, settings, OpenProject, analyze/create-tickets), mapa en memoria `pendingAnalyses` para propuestas de IA pendientes de confirmación, manejo central de `OpenProjectApiError`.                                                                                                                                 | **Reescribir** como Route Handlers de Next (`app/api/...`) o Server Actions. La _forma_ de cada endpoint (validaciones, códigos de error, contratos JSON) se conserva; Express desaparece. `pendingAnalyses` en memoria **no sobrevive** a serverless → mover a tabla `ticket_analyses` (§12).                                               |
| `src/openProjectClient.ts` | 349    | Cliente HTTP mínimo de la API v3 de OpenProject: Basic Auth `apikey:<token>`, work packages (crear con secciones + adjuntos + markdown re-embebido), proyectos, tableros (Grids `free`), columnas (Queries), `PATCH /queries/{id}/order` (no documentado), usuarios asignables/responsables, tipos de WP, `/users/me`. Incluye `OpenProjectApiError` y `buildSectionsMarkdown`. | **Portar** casi intacto a `modules/openproject/services/openproject-client.ts` (server-only). Es la joya del proyecto: encapsula investigación difícil de reproducir (tableros como Grids, columnas como Queries, orden manual). Cambios: tipado estricto, `Buffer` → `Uint8Array`/`Blob` si se quiere edge-compat (o fijar runtime nodejs). |
| `src/config.ts`            | 35     | Carga y valida env (`OPENPROJECT_BASE_URL`, `ANTHROPIC_API_KEY`, …) con `requireEnv` manual.                                                                                                                                                                                                                                                                                    | **Reutilizar** el patrón de V2: `lib/env.ts` ya valida con Zod. Solo se agregan las variables que falten. Eliminar el archivo.                                                                                                                                                                                                               |
| `src/duration.ts`          | 15     | `hoursToIso8601Duration(hours)` → `"PT2H30M"` para `estimatedTime` de OpenProject.                                                                                                                                                                                                                                                                                              | **Portar** tal cual a `modules/openproject/utils/duration.ts`.                                                                                                                                                                                                                                                                               |
| `src/createTicket.ts`      | 48     | CLI de prueba (`npm run create-ticket`) que crea un WP suelto con token fijo de `.env`.                                                                                                                                                                                                                                                                                         | **Eliminar**. Era herramienta de bootstrap; en V2 el flujo real ya existe.                                                                                                                                                                                                                                                                   |

### 3.2 Servicios de dominio (`src/services/`)

| Archivo                      | Líneas | Qué hace                                                                                                                                                                                                                                                                                                                                                                                       | Veredicto                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MeetingAIService.ts`        | 184    | Única puerta a Anthropic. `messages.parse` con `claude-sonnet-5`, thinking adaptativo, structured output (`zodOutputFormat`) → `TicketDraft[]`. `extractImages`: reemplaza data-URLs por `{imageIndex}` antes del prompt (no envía base64 a Claude) y mapea imagen→bloque de origen para congelar correctamente. El "responsable" NUNCA lo decide la IA (no existe en el schema de respuesta). | **Portar** a `modules/ai/services/meeting-ai.service.ts` (server-only). La lógica es excelente y ya usa el SDK 0.110 (V2 tiene 0.112, compatible). Ajustar `Buffer` según runtime.                                                                                                                                                                             |
| `MeetingPromptBuilder.ts`    | 54     | Único lugar que conoce el texto del prompt (system + user). Documenta el formato de bloques, metadatos, `blockIndex`, reglas de redacción.                                                                                                                                                                                                                                                     | **Portar** tal cual a `modules/ai/services/meeting-prompt-builder.ts`. Diseñado para iterar el prompt sin tocar la lógica — mantener esa separación.                                                                                                                                                                                                           |
| `MeetingProcessor.ts`        | 44     | Orquestador: `prepareForAI` → si no queda contenido activo devuelve `null` (no gasta tokens) → si hay, llama a la IA.                                                                                                                                                                                                                                                                          | **Portar** (renombrar a `analyze-meeting.usecase.ts` o mantener nombre).                                                                                                                                                                                                                                                                                       |
| `MeetingDocumentService.ts`  | 132    | Modelo del documento: `MeetingDocument = JSONContent` de TipTap (decisión clave: no duplicar el tipo), `TicketTracking` (`status: "frozen"`), `load` (validación), `prepareForAI` (filtra Frozen + vacíos, inyecta `blockIndex` con posición REAL), `applyTicketTracking` (congela bloques tras crear tickets).                                                                                | **Portar** a `modules/notes/services/meeting-document.service.ts`. Es lógica pura sobre JSON, sin dependencias de entorno — se comparte entre server y client si hace falta.                                                                                                                                                                                   |
| `MeetingNoteService.ts`      | 103    | CRUD de notas (`data/notes.json` en memoria): listByProject, create (doc vacío), updateTitle/updateDocument, delete, deleteByProject (cascada).                                                                                                                                                                                                                                                | **Reescribir** contra Supabase (`modules/notes/services/notes.service.ts` + tabla `notes`, §12). Los contratos de método se conservan.                                                                                                                                                                                                                         |
| `ProjectService.ts`          | 86     | CRUD de proyectos locales (`data/projects.json`): `LocalProject` con vínculo a OpenProject (`openProjectId/Name`, `boardId/Name`, `boardListId/Name`). `update` reemplaza completo a propósito (el modal envía el form entero).                                                                                                                                                                | **Reescribir** contra Supabase (tabla `projects`). Conservar la semántica de "update = reemplazo completo".                                                                                                                                                                                                                                                    |
| `ProjectKnowledgeService.ts` | 77     | Base de conocimiento 1:1 con proyecto (`data/project-knowledge.json`): getOrCreate, updateDocument, deleteByProject. Deliberadamente independiente del sistema de notas (futuro contexto para la IA).                                                                                                                                                                                          | **Reescribir** contra Supabase (tabla `project_knowledge`).                                                                                                                                                                                                                                                                                                    |
| `ProjectManagerService.ts`   | 91     | CRUD de Encargados (`data/project-managers.json`): personas del proyecto (NO usuarios de OpenProject), fuente de participantes de reuniones.                                                                                                                                                                                                                                                   | **Reescribir** contra Supabase (tabla `project_managers`).                                                                                                                                                                                                                                                                                                     |
| `OpenProjectService.ts`      | 157    | Fachada de dominio sobre `OpenProjectClient`. Clave: **construye un cliente nuevo por llamada** leyendo la API Key vigente de `UserSettingsService` → cambiarla no requiere reinicio. `createTicketsFromDrafts` (con ubicación best-effort en columna de tablero), `buildWorkPackageUrl` (URL web, no API).                                                                                    | **Portar** con un cambio estructural: la API Key ya no viene de un JSON en disco sino de la **columna `users.openproject_api_key` de Supabase** (leída server-side con service role o RLS de servidor; ver §11/§13).                                                                                                                                           |
| `UserSettingsService.ts`     | 115    | Settings del PM único: API Key en claro en `data/user-settings.json`, `currentUser` (dueño de la key según `/users/me`), `defaultResponsible` (override on/off). `getPublicSettings()` nunca expone la key (solo `hasApiKey`). `resolveDefaultResponsible()`.                                                                                                                                  | **Reescribir**: se fusiona con el sistema de usuarios de V2. La API Key ya vive en `users` (flujo de registro paso 4). `currentUser` de OpenProject y `defaultResponsible` → columnas nuevas o tabla `user_settings` (§12). El patrón `hasApiKey`/nunca-en-claro **ya está implementado en V2 a nivel de base de datos** (SELECT revocado), superior al de V1. |

### 3.3 Cliente (`client/`)

| Archivo                         | Líneas | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Veredicto                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `editor.ts`                     | 856    | Corazón de la UI: instancia TipTap (StarterKit, Image base64, Placeholder, BubbleMenu + las 3 extensiones propias), título estilo Notion (`div` editable), autoguardado debounce 600 ms, botón "+" flotante por bloque con menú (asignado/tiempo/fecha/reunión), modales de asignado (Tom Select con usuarios del proyecto), horas, fecha (flatpickr), participantes (Encargados + invitados externos), paste/drop de imágenes como data-URL, flujo "Crear Tickets" (chequeo local `hasPendingTicketDrafts` → `/analyze` → modal de revisión → `/create-tickets` → aplicar documento congelado + modal de éxito), toasts, botón "Descargar notas" (export JSON). Coordinación con sidebar vía `window.notesEditor` y CustomEvent. | **Reescribir** en React: es el mayor esfuerzo de la migración. Se descompone en ~10 componentes (§6) + hooks (`useNoteAutosave`, `useTicketFlow`) dentro de `modules/notes` y `modules/tickets`. La configuración del editor migra a `useEditor` de `@tiptap/react` (ya instalado). Los `window.*`/CustomEvents desaparecen (estado React + TanStack Query). |
| `sidebar.ts`                    | 938    | Sidebar colapsable: árbol proyectos→notas (carga perezosa por proyecto, `notesByProject`), crear/renombrar(inline)/editar/eliminar proyecto, crear/abrir/eliminar nota, modal Crear/Editar Proyecto con tabs (Datos: nombre + Tom Select de proyectos OpenProject + tablero + columna en cascada; Encargados: CRUD), modal de Encargado, modal de Configuración (API Key con mostrar/ocultar + verificación `/users/me`, override de Responsable con Tom Select), menú contextual reutilizable, integración con confirmModal.                                                                                                                                                                                                     | **Reescribir** en React (`modules/projects/components/*` + `modules/settings/components/*`). V2 ya tiene `shared/sidebar-item`, `sidebar-group`, `ui/select`, `ui/dialog`, `shared/modal`, `ui/form` — la mayoría de la infraestructura visual existe.                                                                                                       |
| `knowledgePanel.ts`             | 145    | Panel lateral derecho con segundo editor TipTap (sin metadatos/tracking), autoguardado 600 ms, persistencia del estado abierto/cerrado en `localStorage` (`nn:knowledgePanelOpen`), coordinación vía `window.knowledgePanel`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | **Reescribir** como `modules/knowledge/components/KnowledgePanel.tsx` reutilizando el mismo componente de editor React con flag de features.                                                                                                                                                                                                                 |
| `ticketDraftService.ts`         | 49     | Lógica pura cliente: `getActiveBlocks`/`getFrozenBlocks`/`hasPendingTicketDrafts` (no Frozen + contenido real). Evita llamar a la IA cuando no hay nada pendiente (el párrafo vacío final de TipTap fue un bug real documentado).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | **Portar** tal cual (es TS puro sobre `JSONContent`) a `modules/tickets/utils/ticket-draft.utils.ts`. Nota: duplica criterio con `MeetingDocumentService.prepareForAI` — unificar en un solo módulo compartido (§15).                                                                                                                                        |
| `confirmModal.ts`               | 57     | Modal de confirmación genérico para acciones destructivas (un solo nodo DOM reconfigurado).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | **Reutilizar**: V2 ya tiene `shared/alert-dialog`/`animate-ui radix/alert-dialog`. Eliminar.                                                                                                                                                                                                                                                                 |
| `blockMetadataExtension.ts`     | 185    | Extensión TipTap: atributo global `metadata` (array ordenado de `MetadataItem`) sobre `paragraph`/`heading`, `keepOnSplit: false`, comando `setBlockMetadataItem` (inserta/reemplaza por `type` preservando orden), decoración ProseMirror que monta `MetadataContainer`. Agnóstica de tipos concretos (registry inyectado).                                                                                                                                                                                                                                                                                                                                                                                                      | **Portar** casi intacto a `modules/notes/editor/extensions/block-metadata.ts` — las extensiones TipTap son framework-agnostic y funcionan idéntico bajo `@tiptap/react`.                                                                                                                                                                                     |
| `ticketTrackingExtension.ts`    | 134    | Extensión TipTap: atributo global `ticket` (`TicketTracking`) sobre 7 tipos de bloque, solo lectura desde cliente (lo escribe el servidor), decoración de barra verde + chip "✓ Ticket creado" (solo en el primer bloque de cada `ticketId`) con link al WP.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | **Portar** casi intacto. El chip/decoración DOM puede permanecer imperativo (así funcionan las decoraciones PM) o migrar a NodeView de React — no obligatorio.                                                                                                                                                                                               |
| `meetingBlockExtension.ts`      | 262    | Nodo TipTap atómico `meetingBlock`: attrs (meetingId, title, date, startTime, duration, description, participants[], status:"draft"), NodeView imperativo con inputs nativos + flatpickr, callback `onAddParticipant` inyectado. Preparado para Fase 2 (Microsoft/OpenProject/Client como tipos de participante futuros).                                                                                                                                                                                                                                                                                                                                                                                                         | **Portar** la definición del Node (schema/attrs/comandos) y **reescribir** el NodeView con `ReactNodeViewRenderer` de `@tiptap/react` (mucho más mantenible que el DOM imperativo actual).                                                                                                                                                                   |
| `metadata/types.ts`             | 33     | `MetadataItem` (objeto abierto por `type`), `MetadataTypeDefinition` (icon/label/onClick), `MetadataRegistry`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **Portar** tal cual.                                                                                                                                                                                                                                                                                                                                         |
| `metadata/MetadataChip.ts`      | 27     | Pinta un chip (icono + label). DOM puro.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | **Reescribir** como componente React trivial (o mantener DOM puro dentro de la decoración — decisión de Fase 2).                                                                                                                                                                                                                                             |
| `metadata/MetadataContainer.ts` | 89     | Fila de chips con drag & drop propio (Pointer Events, umbral 4 px, reordena en DOM real). Callbacks `onReorder`/`onChipClick`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | **Portar** inicialmente tal cual (vive dentro de una decoración ProseMirror, donde DOM puro es válido); evaluar port a React + `motion/react` Reorder en fase de pulido.                                                                                                                                                                                     |

### 3.4 Estáticos, datos y raíz

| Archivo                                                                                       | Qué hace                                                                                                              | Veredicto                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/index.html` (322)                                                                     | Shell completo: sidebar, topbar, vistas empty/notes, 10 modales estáticos, knowledge panel.                           | **Eliminar** (React renderiza todo). Sirve como **spec visual/estructural** de la Fase 2-3.                                                                                                                               |
| `public/styles.css` (1465) · `editor.css` (1268) · `sidebar.css` (485)                        | Estética "Material 3 + Liquid Glass": tokens, sidebar, modales, chips, barra Frozen, tarjetas de revisión de tickets. | **Eliminar** como código; **conservar como referencia de diseño** para reproducir en Tailwind los detalles finos (chips de metadatos, barra verde Frozen, tarjetas del modal de revisión).                                |
| `public/*.js`                                                                                 | Bundles esbuild generados.                                                                                            | **Eliminar** (artefactos de build).                                                                                                                                                                                       |
| `data/notes.json` (11,6 MB)                                                                   | Notas reales con imágenes base64 embebidas.                                                                           | **Migrar los datos** vía script one-shot (§12); el archivo no se copia al repo.                                                                                                                                           |
| `data/projects.json`, `project-knowledge.json`, `project-managers.json`, `user-settings.json` | Datos reales de proyectos/KB/encargados/settings del PM.                                                              | **Migrar los datos** (§12). `user-settings.json` contiene una **API Key en claro** → tratar como secreto comprometido: migrar cifrada y recomendar rotación (§11).                                                        |
| `README.md` (55 KB)                                                                           | Arquitectura, decisiones, investigación de la API de OpenProject (tableros/Grids/Queries), debugging documentado.     | **Conservar** en V2 como `docs/V1-ARCHITECTURE.md` (referencia); el README de V2 se escribe nuevo.                                                                                                                        |
| `.env` / `.env.example`                                                                       | `OPENPROJECT_BASE_URL`, `OPENPROJECT_API_TOKEN` (solo CLI), `OPENPROJECT_PROJECT_ID` (solo CLI), `ANTHROPIC_API_KEY`. | **Migrar variables** a los `.env` de V2 (V2 ya declara `OPENPROJECT_BASE_URL`, `OPENPROJECT_API_KEY`, `ANTHROPIC_API_KEY` en su `lib/env.ts`). `OPENPROJECT_PROJECT_ID` y el token fijo **se eliminan** (eran de la CLI). |
| `tsconfig.json`, `tsconfig.client.json`, `package.json`, `dist/`, `.claude/`                  | Build de V1.                                                                                                          | **Eliminar** (V2 tiene su propio toolchain).                                                                                                                                                                              |

---

## 4. Clasificación por dominios

### IA

- **Servicios (portar)**: `MeetingAIService`, `MeetingPromptBuilder`, `MeetingProcessor`.
- **Prompts**: system prompt completo en `MeetingPromptBuilder.buildSystemPrompt` (reglas de agrupación, metadatos exactos, prohibición de "Sección N", `blockIndex`/`imageIndex`). Migrar **verbatim** — está afinado con debugging real.
- **Schemas**: `TicketSectionSchema`, `TicketDraftSchema`, `AnalysisResponseSchema` (Zod, en `MeetingAIService`) — portar a `modules/ai/schemas/`.
- **API**: `POST /api/meeting-notes/analyze` → Route Handler server-only.
- **Reglas invariantes**: la IA nunca decide el responsable; nunca ve bloques Frozen; nunca recibe base64 de imágenes; revisión humana obligatoria antes de crear nada.

### OpenProject

- **Cliente (portar)**: `openProjectClient.ts` completo (WP + adjuntos + markdown, proyectos, boards/Grids, columnas/Queries, `PATCH /queries/{id}/order`, usuarios, tipos, `/users/me`).
- **Servicio (portar con cambio de fuente de credencial)**: `OpenProjectService`.
- **Utilidades**: `duration.ts` (horas → ISO 8601).
- **Tipos**: `WorkPackage`, `Attachment`, `Project`, `Board`, `BoardColumn`, `OpenProjectUser`, `CurrentUser`, `WorkPackageType`, `TicketSection`, `ImageInput`, `CreateWorkPackageInput`, `OpenProjectApiError`.
- **API**: 5 endpoints proxy (`/openproject-projects`, `/boards`, `/columns`, `/assignable-users`, `/responsible-users`) → Route Handlers.
- **Restricción dura**: la API v3 se consume **solo desde el servidor** (la API Key jamás toca el navegador; además evita CORS).

### Notas (editor)

- **Modelo**: `MeetingDocument = JSONContent`, `MeetingNote`, `TicketTracking`.
- **Servicios**: `MeetingDocumentService` (portar), `MeetingNoteService` (reescribir a Supabase).
- **Extensiones TipTap**: BlockMetadata (portar), TicketTracking (portar), MeetingBlock (portar schema, reescribir NodeView en React).
- **UI a reescribir**: editor page, título Notion, bubble menu, botón "+" + block menu, modales de metadatos, paste/drop de imágenes, autoguardado.

### Tickets (pipeline notas→OpenProject)

- **Cliente**: `ticketDraftService.ts` (portar), modal de revisión, modal de éxito, indicadores Frozen.
- **Servidor**: flujo analyze→pendingAnalyses→create-tickets→applyTicketTracking (reescribir con persistencia real del análisis pendiente).

### Dashboard / Navegación

- Sidebar (árbol proyectos/notas, colapso, renombrado inline, menús contextuales) — reescritura React sobre `shared/sidebar-*`.
- Vistas empty/notes → páginas del dashboard de V2.

### Proyectos

- `ProjectService` + modal Crear/Editar con tabs y selects en cascada (OpenProject → tablero → columna).

### Conocimiento (KB)

- `ProjectKnowledgeService` + `knowledgePanel.ts` (panel lateral con editor propio, estado en localStorage).

### Encargados

- `ProjectManagerService` + modal CRUD + checkbox-list en modal de participantes.

### Configuración

- `UserSettingsService` + modal Configuración (API Key mostrar/ocultar + verificación, override Responsable). En V2 se fusiona con el perfil del usuario autenticado (la API Key ya se captura en el registro).

### Exportaciones

- Botón "Descargar notas" (JSON de TipTap → Blob → download). Portar como utilidad pequeña.

### Helpers

- `escapeHtml` (×2 en V1) → innecesario en React (JSX escapa por defecto). `fetchJSON` → lo reemplaza TanStack Query + servicios.

---

## 5. Dependencias de NoNameV1

| Paquete                                             | Versión V1 | ¿Existe? | Estado                               | Decisión para V2                                                                                                                                |
| --------------------------------------------------- | ---------- | -------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `@anthropic-ai/sdk`                                 | ^0.110.0   | Sí       | Vigente                              | **Ya instalado en V2 (0.112)** — no instalar nada; verificar compatibilidad de `messages.parse`/`zodOutputFormat` (misma API).                  |
| `@tiptap/core`                                      | ^3.27.1    | Sí       | Vigente                              | V2 ya tiene la familia TipTap **3.28** vía `@tiptap/react` — usar esa. No instalar `@tiptap/core` directo.                                      |
| `@tiptap/starter-kit`                               | ^3.27.1    | Sí       | Vigente                              | **Ya en V2 (3.28)**.                                                                                                                            |
| `@tiptap/extension-image`                           | ^3.27.1    | Sí       | Vigente                              | **Ya en V2 (3.28)**.                                                                                                                            |
| `@tiptap/extension-placeholder`                     | ^3.27.1    | Sí       | Vigente                              | **Ya en V2 (3.28)**.                                                                                                                            |
| `@tiptap/extension-bubble-menu`                     | ^3.27.1    | Sí       | Vigente                              | **Instalar** (o usar `BubbleMenu` de `@tiptap/react`, que lo reexporta — preferible; probablemente no requiera instalación aparte).             |
| `express`                                           | ^4.19.2    | Sí       | Vigente pero **innecesario**         | **No instalar**: Next Route Handlers lo reemplazan por completo.                                                                                |
| `dotenv`                                            | ^16.4.5    | Sí       | Vigente                              | **No instalar**: Next carga `.env` nativamente (V2 ya lo tiene por Prisma, suficiente).                                                         |
| `flatpickr`                                         | ^4.6.13    | Sí       | **Estancada** (sin releases activos) | **No migrar**: reemplazar por date-picker del design system de V2 (o `<input type="date">` estilizado). React moderno + Base UI cubren el caso. |
| `tom-select`                                        | ^2.6.1     | Sí       | Mantenimiento lento                  | **No migrar**: `ui/select` + un combobox con búsqueda del design system de V2 lo reemplazan.                                                    |
| `zod`                                               | ^4.4.3     | Sí       | Vigente                              | **Ya en V2 (misma major)**.                                                                                                                     |
| `esbuild` (dev)                                     | ^0.28.1    | Sí       | Vigente                              | **No instalar**: Turbopack/Next empaqueta.                                                                                                      |
| `@types/express`, `@types/node`, `typescript` (dev) | —          | —        | —                                    | V2 ya tiene su toolchain.                                                                                                                       |

**Conclusión**: la migración **no requiere instalar casi nada** — solo confirmar el bubble menu de TipTap. Todo lo demás ya está en V2 o se reemplaza por el design system.

---

## 6. Componentes UI (inventario y destino)

"Componente" en V1 = modal/panel/widget DOM. Destino = componente React en V2.

| #   | Componente V1 (ubicación)                                           | Uso                     | Migrar | Reescribir | Eliminar | Destino en V2 / Notas                                                                                      |
| --- | ------------------------------------------------------------------- | ----------------------- | ------ | ---------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | Sidebar colapsable (`sidebar.ts` + `index.html`)                    | Navegación principal    |        | ✔          |          | `modules/dashboard/components/AppSidebar.tsx` sobre `shared/sidebar-group/item`                            |
| 2   | Árbol Proyecto→Notas con carga perezosa                             | Navegación              |        | ✔          |          | TanStack Query con `queryKey ['notes', projectId]` reproduce la carga perezosa                             |
| 3   | Renombrado inline de proyecto                                       | UX rápida               |        | ✔          |          | Input inline controlado (Enter/Escape/blur, misma semántica)                                               |
| 4   | Menú contextual reutilizable (`setupSidebarActionsMenu`)            | Acciones por fila       |        |            | ✔        | Reemplaza `ui/dropdown-menu` (ya existe)                                                                   |
| 5   | Modal Crear/Editar Proyecto (tabs Datos/Encargados)                 | CRUD proyecto           |        | ✔          |          | `modules/projects/components/ProjectModal.tsx` — `ui/dialog` + `shared/tabs` + RHF+Zod                     |
| 6   | Select buscable de proyectos OpenProject (Tom Select)               | Vincular proyecto       |        | ✔          |          | Combobox del design system; opciones vía Route Handler                                                     |
| 7   | Selects en cascada Tablero → Columna                                | Config tablero          |        | ✔          |          | Dos queries dependientes (`enabled:`)                                                                      |
| 8   | Modal Encargado (crear/editar)                                      | CRUD encargados         |        | ✔          |          | `modules/projects/components/ManagerModal.tsx`                                                             |
| 9   | Modal Configuración (API Key + verificación + override Responsable) | Settings                |        | ✔          |          | `modules/settings/` — API Key reutiliza el patrón write-only del registro de V2                            |
| 10  | Modal de confirmación genérico (`confirmModal.ts`)                  | Acciones destructivas   |        |            | ✔        | Ya existe `shared/alert-dialog`                                                                            |
| 11  | Editor de notas TipTap (página)                                     | Núcleo                  |        | ✔          |          | `modules/notes/components/NoteEditor.tsx` con `useEditor`                                                  |
| 12  | Título estilo Notion (`div` contentEditable)                        | Edición título          |        | ✔          |          | Mantener contentEditable o input transparente autosize (misma UX: Enter → foco al cuerpo)                  |
| 13  | Bubble menu de formato (H1/H2/bold/italic/listas)                   | Formato                 |        | ✔          |          | `BubbleMenu` de `@tiptap/react` (el hack de `bubbleMenuElement.remove()` desaparece)                       |
| 14  | Botón "+" flotante + menú de bloque                                 | Metadatos/reunión       |        | ✔          |          | Posicionamiento por `editor.view` igual; menú con `ui/dropdown-menu`                                       |
| 15  | Modal Asignado (Tom Select usuarios del proyecto)                   | Metadato assignee       |        | ✔          |          | Combobox + query `assignable-users`                                                                        |
| 16  | Modal Horas estimadas                                               | Metadato estimatedTime  |        | ✔          |          | `ui/dialog` + input numérico validado (Zod: ≥0, decimales)                                                 |
| 17  | Modal Fecha límite (flatpickr)                                      | Metadato dueDate        |        | ✔          |          | Date picker del design system; salida `YYYY-MM-DD` intacta                                                 |
| 18  | Chips de metadatos + drag & drop (`MetadataChip/Container`)         | Visualización metadatos | ✔      |            |          | Portar DOM puro dentro de la decoración (Fase 2); React/motion en pulido                                   |
| 19  | Bloque de Reunión (NodeView)                                        | Reuniones               |        | ✔          |          | `ReactNodeViewRenderer` — attrs y comandos se portan tal cual                                              |
| 20  | Modal Participantes (Encargados + invitados externos)               | Reuniones               |        | ✔          |          | Checkbox-list (`ui/checkbox`) + mini-form invitado externo                                                 |
| 21  | Modal Revisión de Tickets (tarjetas de propuesta)                   | Pipeline IA             |        | ✔          |          | `modules/tickets/components/TicketReviewModal.tsx` — misma tarjeta (subject, descripción, 👤 ✅ ⏱ 📅 🖼 📁) |
| 22  | Modal Éxito de Tickets (links a OpenProject)                        | Pipeline IA             |        | ✔          |          | Tarjetas con `#id`, título, botón "Abrir Ticket"                                                           |
| 23  | Indicador Frozen (barra verde + chip "✓ Ticket creado")             | Pipeline IA             | ✔      |            |          | Vive en la extensión portada (decoración) — solo re-estilizar con la paleta V2                             |
| 24  | Toast + status bar                                                  | Feedback                |        |            | ✔        | `sonner` ya instalado y montado en V2                                                                      |
| 25  | Panel Base de Conocimiento (aside + editor propio)                  | KB                      |        | ✔          |          | `modules/knowledge/components/KnowledgePanel.tsx`; estado abierto en localStorage se conserva              |
| 26  | Botón "Descargar notas" (export JSON)                               | Export                  | ✔      |            |          | Utilidad de 15 líneas, portar                                                                              |
| 27  | Vista vacía ("Selecciona una nota…")                                | Estado vacío            |        |            | ✔        | Ya existe `shared/empty-state`                                                                             |

---

## 7. Hooks

V1 no tiene hooks (no es React). Equivalencias a **crear** en V2, derivadas de la lógica imperativa de V1:

| Hook nuevo                                                                  | Origen en V1                       | Responsabilidad                                                           |
| --------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `useProjects()` / `useProjectMutations()`                                   | `sidebar.ts` + `/api/projects`     | Listado y CRUD de proyectos (TanStack Query)                              |
| `useNotes(projectId)` (lazy)                                                | `notesByProject` Map               | Notas por proyecto, cache por clave                                       |
| `useNoteAutosave(editor, noteId)`                                           | `scheduleSave` (debounce 600 ms)   | Autoguardado de título+documento; misma ventana de 600 ms                 |
| `useTicketFlow(note, project)`                                              | flujo Crear Tickets de `editor.ts` | Chequeo local → analyze → revisión → create → aplicar documento congelado |
| `useAssignableUsers(projectId)` / `useResponsibleUsers(projectId)`          | fetches de modales                 | Usuarios de OpenProject para selects                                      |
| `useOpenProjectProjects()` / `useBoards(opId)` / `useBoardColumns(boardId)` | modal proyecto                     | Selects en cascada                                                        |
| `useKnowledge(projectId)`                                                   | `knowledgePanel.ts`                | KB getOrCreate + autosave                                                 |
| `useManagers(projectId)`                                                    | `sidebar.ts`/`editor.ts`           | CRUD encargados + participantes                                           |
| `useUserSettings()`                                                         | modal Configuración                | hasApiKey, currentUser OpenProject, defaultResponsible                    |

Ya existentes en V2 (reutilizar, no duplicar): `useCurrentUser`, `useLogin`, `useRegister`, `use-controlled-state`, etc.

## 8. Context Providers

V1: **cero** (coordinación vía `window.notesEditor`, `window.knowledgePanel`, CustomEvents y variables de módulo). En V2 **no reproducir con Context**: el estado de servidor va a TanStack Query (ya provisto en `app/providers.tsx`); el único estado UI global candidato es "nota/proyecto activo" → URL (`/dashboard/projects/[id]/notes/[noteId]`) como fuente de verdad, no un Context. Zustand solo si aparece estado UI transversal real (p. ej. panel KB abierto), y es opcional frente a localStorage + estado local.

## 9. Servicios (mapa completo V1 → V2)

| Servicio V1                       | Destino V2                                                         | Modo                         |
| --------------------------------- | ------------------------------------------------------------------ | ---------------------------- |
| `openProjectClient.ts`            | `modules/openproject/services/openproject-client.ts` (server-only) | Portar                       |
| `OpenProjectService`              | `modules/openproject/services/openproject.service.ts`              | Portar (credencial desde DB) |
| `MeetingAIService`                | `modules/ai/services/meeting-ai.service.ts` (server-only)          | Portar                       |
| `MeetingPromptBuilder`            | `modules/ai/services/meeting-prompt-builder.ts`                    | Portar                       |
| `MeetingProcessor`                | `modules/ai/services/meeting-processor.ts`                         | Portar                       |
| `MeetingDocumentService`          | `modules/notes/services/meeting-document.service.ts` (isomórfico)  | Portar                       |
| `MeetingNoteService`              | `modules/notes/services/notes.service.ts` (Supabase)               | Reescribir                   |
| `ProjectService`                  | `modules/projects/services/projects.service.ts` (Supabase)         | Reescribir                   |
| `ProjectKnowledgeService`         | `modules/knowledge/services/knowledge.service.ts` (Supabase)       | Reescribir                   |
| `ProjectManagerService`           | `modules/projects/services/managers.service.ts` (Supabase)         | Reescribir                   |
| `UserSettingsService`             | fusión con `modules/auth` + `modules/settings`                     | Reescribir                   |
| `ticketDraftService.ts` (cliente) | `modules/tickets/utils/ticket-draft.utils.ts`                      | Portar                       |
| Storage (JSON en disco)           | Supabase (Postgres + Storage)                                      | Reemplazo total              |
| Auth                              | **Ya existe en V2** (Supabase) — V1 no tenía ninguna               | —                            |

Regla heredada de ambos proyectos y que el contrato fija: **ningún componente llama a un SDK/API externa directamente**; siempre a través del servicio del módulo.

## 10. Modelos (interfaces, types, enums, schemas)

**Portar tal cual** (renombrando archivo, no forma): `LocalProject`, `MeetingNote`, `MeetingDocument` (= `JSONContent`), `TicketTracking`, `TicketDraftStatus` (`"frozen"` — unión de un valor, extensible), `ProjectKnowledge`, `ProjectManager`, `TicketDraft`, `TicketSection`, `ImageInput`, `CreateWorkPackageInput`, `WorkPackage`, `Attachment`, `Project` (OpenProject), `Board`, `BoardColumn`, `OpenProjectUser`, `CurrentUser`, `WorkPackageType`, `MeetingParticipant` (`"PROJECT_MANAGER" | "EXTERNAL"`, preparado para crecer), `MeetingBlockAttrs`, `MeetingBlockStatus` (`"draft"`), `MetadataItem`, `MetadataTypeDefinition`, `MetadataRegistry`, `AuthenticatedUser`, `DefaultResponsible`, `PublicUserSettings` (→ se adapta), `OpenProjectApiError`.

**Schemas Zod existentes**: `TicketSectionSchema`, `TicketDraftSchema`, `AnalysisResponseSchema` (respuesta de la IA). **Schemas a crear** (V1 validaba a mano en Express): inputs de proyecto, nota, manager, knowledge, settings — en `modules/*/schemas/`, reutilizados por RHF y Route Handlers (patrón ya establecido por `auth.schemas.ts`).

**Cambio de identidad**: los `id: string` (randomUUID) de V1 se conservan como UUID en Postgres — los datos existentes migran con sus ids intactos (las notas referencian `projectId`).

## 11. Seguridad

### Hallazgos en V1

| Hallazgo                                                         | Severidad         | Detalle                                                                                                                        |
| ---------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| API Key de OpenProject **en claro** en `data/user-settings.json` | Alta              | Cualquier lectura del disco la expone. Además existe una key real en el archivo actual → **rotar al migrar**.                  |
| `ANTHROPIC_API_KEY` en `.env` (server)                           | OK                | Patrón correcto; V1 nunca la envía al cliente.                                                                                 |
| Token de OpenProject fijo en `.env` (CLI)                        | Media             | Se elimina con la CLI.                                                                                                         |
| **Sin autenticación de ningún tipo**                             | Alta (por diseño) | App single-user en localhost; todos los endpoints abiertos. V2 lo resuelve con Supabase + proxy.                               |
| Sin autorización por recurso                                     | Alta              | Cualquier `projectId`/`noteId` es accesible. En V2: RLS por `auth_id` en TODAS las tablas nuevas.                              |
| XSS mitigado a mano (`escapeHtml`) en render de tarjetas         | Baja              | Correcto en V1; en React desaparece el riesgo por defecto (nunca usar `dangerouslySetInnerHTML` con contenido de la IA/notas). |
| Imágenes como data-URL dentro del documento                      | Media (DoS/peso)  | 11,6 MB de JSON; límite Express `25mb`. Migrar a Supabase Storage (§12).                                                       |
| `pendingAnalyses` en memoria                                     | Baja (fiabilidad) | Se pierde en reinicio; en serverless directamente no funciona.                                                                 |

### Reglas de migración (obligatorias)

1. **Ningún secreto en frontend**: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENPROJECT_BASE_URL`+API Keys viven solo en env de servidor (`lib/env.ts`). Toda llamada a OpenProject/Anthropic ocurre en Route Handlers/Server Actions.
2. **API Key de OpenProject por usuario**: ya se almacena en `users.openproject_api_key` con `SELECT` revocado (write-only desde el cliente). El servidor la lee con service role **solo** dentro del servicio OpenProject; nunca se loguea, nunca se devuelve, nunca entra a estado global ni a React Query. Mejora recomendada: cifrarla en reposo con Supabase Vault/pgsodium.
3. **RLS en todas las tablas nuevas** (§12): `using (auth.uid() = owner_auth_id)` (o join a `users`); sin acceso `anon`.
4. **Validación Zod en el borde**: todo body de Route Handler pasa por schema antes de tocar servicios (V1 validaba a mano; V2 ya fijó el patrón).
5. **Sesión**: cookies httpOnly gestionadas por `@supabase/ssr` (ya en V2); `proxy.ts` valida el JWT con `getUser()`. No usar localStorage para tokens.
6. **Rate limiting** en endpoints costosos (`/analyze` llama a Claude: dinero real) — patrón ya existente en `verification-status`.
7. **Autorización por fila, no por ruta**: cada servicio verifica pertenencia del recurso (RLS lo garantiza incluso si el código falla).
8. El estado `pay`/rol se sigue verificando en `proxy.ts` para todas las rutas nuevas del dashboard (matcher a ampliar).

## 12. Base de datos

### Lo que V1 guarda hoy (5 JSON)

| Archivo                  | Entidad          | Campos                                                                                                             |
| ------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `projects.json`          | LocalProject     | id, name, openProjectId, openProjectName, boardId?, boardName?, boardListId?, boardListName?                       |
| `notes.json` (11,6 MB)   | MeetingNote      | id, projectId, title, document (JSON TipTap con imágenes base64 y attrs `metadata`/`ticket`), createdAt, updatedAt |
| `project-knowledge.json` | ProjectKnowledge | projectId, document, updatedAt                                                                                     |
| `project-managers.json`  | ProjectManager   | id, projectId, name, email, phone?, createdAt, updatedAt                                                           |
| `user-settings.json`     | UserSettings     | openProjectApiKey (¡en claro!), currentUser {id,name,login}, defaultResponsible {overrideEnabled,userId,userName}  |

### Propuesta de tablas en Supabase (documental — sin SQL aquí)

Todas con `id uuid pk`, `created_at`, `updated_at` (trigger existente `set_updated_at`), **RLS activada** y pertenencia al usuario:

- **`projects`** — `owner_id → users.id` (o `auth_id` directo), `name`, `openproject_id int`, `openproject_name`, `board_id int null`, `board_name null`, `board_list_id int null`, `board_list_name null`. Índice por owner. _Nota multiusuario_: V1 era single-user; V2 introduce el dueño. Decisión de producto pendiente: proyectos privados por usuario (default propuesto) vs. compartidos por organización (dejaría de bastar RLS por `auth_id`).
- **`notes`** — `project_id → projects.id on delete cascade` (la cascada reemplaza `deleteByProject`), `title text`, `document jsonb` (JSON nativo TipTap: **se conserva el formato**, incluidos attrs `metadata` y `ticket`), índice `(project_id, created_at)`.
- **`project_knowledge`** — `project_id unique → projects.id on delete cascade`, `document jsonb` (relación 1:1 real, hoy implícita).
- **`project_managers`** — `project_id → projects.id on delete cascade`, `name`, `email`, `phone null`.
- **`user_settings`** (o columnas extra en `users`) — `user_id unique`, `op_current_user_id int null`, `op_current_user_name null`, `op_current_user_login null`, `responsible_override_enabled bool default false`, `responsible_user_id int null`, `responsible_user_name null`. La API Key **no** va aquí: ya vive en `users.openproject_api_key`.
- **`ticket_analyses`** (nueva — reemplaza el Map en memoria) — `id uuid`, `note_id`, `project_id`, `drafts jsonb` (los `TicketDraft[]` **sin** buffers de imagen: las imágenes se re-extraen del documento al confirmar, o se referencian por Storage), `status ('pending'|'confirmed'|'expired')`, `expires_at`. RLS por dueño. Esto hace el flujo analyze→confirm resistente a reinicios y a serverless.
- **Supabase Storage — bucket `note-images`** (privado): las imágenes dejan de ser data-URLs embebidas; el nodo `image` de TipTap guarda la ruta/URL firmada. Un documento pasa de MB a KB. La extracción para OpenProject descarga del bucket en el servidor.

### Migración de datos existentes

Script one-shot (Node, fuera del runtime de la app): lee los 5 JSON → inserta `projects` (conservando UUIDs) → por cada nota, **extrae los data-URLs, sube cada imagen al bucket y reescribe el nodo `image`** → inserta `notes`/`project_knowledge`/`project_managers` → settings al usuario que corresponda. La API Key vieja se rota, no se copia.

### Prisma vs. cliente Supabase

V2 tiene Prisma instalado sin modelos. **Recomendación: no usar Prisma para estas tablas** — el cliente Supabase respeta RLS con el JWT del usuario (Prisma se conectaría con credencial de servidor y saltaría RLS, reintroduciendo la autorización a mano). Mantener el patrón de `auth.service.ts`. Retirar Prisma si al final de la migración sigue sin usos (decisión en Fase 6).

## 13. Flujo de autenticación (integración con lo ya construido)

- **Usuarios**: `auth.users` (Supabase) + fila pública `users` creada por trigger. Nada cambia.
- **Roles**: `ROLES` centralizado ya existe. Uso futuro propuesto: `project_manager` = usuario estándar; `admin`/`superadmin` habilitarán gestión de pagos/usuarios. Las policies nuevas pueden leer el rol vía subconsulta a `users` cuando haga falta (p. ej. superadmin ve todo).
- **Pay**: `pay = 0` bloquea TODO el dashboard, incluidas las rutas migradas — basta ampliar el `matcher` del `proxy.ts` existente; la regla central `resolvePostLoginRoute` no cambia.
- **Protección de rutas**: las páginas nuevas (`/dashboard/projects/...`) caen bajo el prefijo `/dashboard` ya protegido.
- **API Key de OpenProject**: capturada en el registro (paso 4) → columna write-only. El modal de Configuración migrado permite **reemplazarla** (nunca verla) y dispara la verificación `/users/me` server-side, guardando `op_current_user_*` en settings — reproduce el flujo de V1 con el modelo de seguridad de V2.
- **Policies/RLS**: patrón único — `select/insert/update/delete` solo si el recurso pertenece al usuario (`projects.owner` y cadena `note → project → owner`). Los Route Handlers usan el cliente SSR con el JWT del usuario para que RLS aplique; la service role queda reservada a operaciones administrativas (leer la API Key para llamar a OpenProject, verification-status).
- **Middleware**: Next 16 = `proxy.ts` (ya existe). No crear un segundo mecanismo.

## 14. Riesgos

| #   | Riesgo                                                                                                                              | Impacto                                                  | Mitigación                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Endpoint no documentado** `PATCH /api/v3/queries/{id}/order` (ubicar ticket en columna) puede romperse con updates de OpenProject | Tickets no aparecen en el tablero                        | Ya es best-effort en V1 (no aborta la creación). Mantener ese diseño + log; test manual tras cada upgrade de OpenProject  |
| 2   | Reescritura del editor (856 líneas imperativas → React) es el mayor bloque de trabajo y de regresión                                | UX núcleo                                                | Portar extensiones sin cambios (son agnósticas); migrar por sub-piezas con la nota real de `data/` como fixture de prueba |
| 3   | `pendingAnalyses` en memoria no funciona en serverless                                                                              | Flujo crear-tickets roto en prod                         | Tabla `ticket_analyses` (§12) desde el primer día de la Fase 4                                                            |
| 4   | Documentos con imágenes base64 (hasta 25 MB) vs. límites de body de Next/Supabase                                                   | Guardado falla                                           | Migrar a Storage ANTES de exponer el editor (Fase 2); límite de tamaño validado con Zod                                   |
| 5   | Deriva de versiones TipTap 3.27 → 3.28 (attrs globales, decoraciones, NodeViews)                                                    | Extensiones portadas fallan sutilmente                   | Diff de changelogs + fixture real de `notes.json` renderizada en tests manuales                                           |
| 6   | Estructura de respuesta de Anthropic (`messages.parse`, `output_config`) entre 0.110 → 0.112                                        | Pipeline IA roto                                         | Contrato cubierto por `AnalysisResponseSchema`; probar el endpoint aislado en Fase 4                                      |
| 7   | Duplicación de criterio "bloque activo" (cliente `ticketDraftService` vs. servidor `prepareForAI`) — hoy ya duplicado en V1         | Divergencia silenciosa (bug histórico del párrafo vacío) | Unificar en un único módulo isomórfico (§15)                                                                              |
| 8   | Multiusuario nuevo: V1 asumía un solo PM; decisiones de compartición no tomadas                                                     | Modelo de datos incorrecto                               | Decisión explícita antes de Fase 1 (default: todo privado por usuario)                                                    |
| 9   | CORS/latencia si se intentara llamar a OpenProject desde el navegador                                                               | Fuga de API Key                                          | Prohibido por contrato: siempre server-side                                                                               |
| 10  | Código muerto/artefactos V1 (`dist/`, bundles, CLI) copiados por error                                                              | Ruido                                                    | Solo se migra lo listado en §3; nada de `public/*.js`, `dist/`                                                            |
| 11  | Funciones enormes heredadas (archivos monolíticos de 850-940 líneas)                                                                | Mantenibilidad                                           | La descomposición de §6/§7 es parte del contrato, no opcional                                                             |
| 12  | Costo Claude sin control multiusuario                                                                                               | Facturación                                              | Rate limit + (mejora) contador de análisis por usuario/día                                                                |
| 13  | Datos reales existentes (11,6 MB) mal migrados                                                                                      | Pérdida de notas                                         | Script idempotente + verificación por conteo/checksum + conservar los JSON como backup                                    |

## 15. Refactorizaciones recomendadas (por módulo)

| Módulo                      | Mantener                                                             | Reescribir                                        | Eliminar                                                                | Fusionar                                                                                                                             | Separar                                                                                   |
| --------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| OpenProject client/service  | Toda la lógica y comentarios de investigación                        | —                                                 | CLI `createTicket`                                                      | `config.ts` → `lib/env.ts`                                                                                                           | —                                                                                         |
| IA                          | Prompt, schemas, extractImages, separación Builder/Service/Processor | —                                                 | —                                                                       | —                                                                                                                                    | —                                                                                         |
| Documento (MeetingDocument) | `prepareForAI`, `applyTicketTracking`, `blockIndex` real             | —                                                 | —                                                                       | **Fusionar** `ticketDraftService` (cliente) + criterio de `prepareForAI` (servidor) en un único módulo isomórfico `active-blocks.ts` | —                                                                                         |
| Notas                       | Contratos CRUD, debounce 600 ms                                      | Persistencia → Supabase                           | —                                                                       | —                                                                                                                                    | Separar editor en ~10 componentes + hooks (era 1 archivo de 856 líneas)                   |
| Proyectos                   | Semántica update-reemplazo-completo, cascada de borrado (ahora FK)   | Persistencia → Supabase; modal → RHF+Zod          | —                                                                       | —                                                                                                                                    | Sidebar (938 líneas) → árbol, fila-proyecto, fila-nota, modales, como componentes propios |
| Encargados / KB             | Modelos y contratos                                                  | Persistencia + UI React                           | —                                                                       | —                                                                                                                                    | —                                                                                         |
| Settings                    | `resolveDefaultResponsible`, patrón hasApiKey                        | Fuente → Supabase `users`/`user_settings`         | JSON en disco                                                           | **Fusionar** con auth de V2                                                                                                          | —                                                                                         |
| Extensiones TipTap          | Las 3, casi intactas                                                 | NodeView de meetingBlock → React NodeView         | —                                                                       | —                                                                                                                                    | —                                                                                         |
| UI global                   | Spec visual (CSS como referencia)                                    | Todo el DOM imperativo → React + design system V2 | `index.html`, CSS, toasts propios, confirm modal, Tom Select, flatpickr | —                                                                                                                                    | —                                                                                         |

## 16. Orden de migración (fases independientes; el proyecto queda funcional al cierre de cada una)

- **Fase 0 — Contrato y datos base** _(sin UI)_: decisión multiusuario (§14.8); migración SQL de `projects`, `notes`, `project_knowledge`, `project_managers`, `user_settings`, `ticket_analyses` + RLS + bucket `note-images`; ampliar `lib/env.ts`; copiar README V1 a `docs/`. Producción no cambia en nada visible.
- **Fase 1 — Proyectos y navegación**: `modules/projects` (servicio, schemas, hooks), sidebar del dashboard con árbol proyecto/notas (notas aún como filas sin editor), modal Crear/Editar Proyecto con selects OpenProject (requiere los 5 Route Handlers proxy de OpenProject + lectura server-side de la API Key del usuario), CRUD Encargados, modal Configuración. Al cierre: el dashboard gestiona proyectos reales de punta a punta.
- **Fase 2 — Editor de notas**: `modules/notes` (servicio Supabase + `MeetingDocumentService` portado), NoteEditor React (`useEditor`), extensiones BlockMetadata/TicketTracking portadas, título Notion, bubble menu, botón "+", modales de metadatos, imágenes → Storage, autoguardado; script de migración de datos V1 ejecutado aquí. Al cierre: se toman notas reales con metadatos.
- **Fase 3 — Bloque de Reunión y participantes**: extensión meetingBlock con React NodeView, modal de participantes (Encargados + externos). Independiente del pipeline de IA.
- **Fase 4 — Pipeline IA → OpenProject**: `modules/ai` + `modules/tickets`; Route Handlers `analyze` (con `ticket_analyses` persistido + rate limit) y `create-tickets` (creación WP + adjuntos + congelado + documento actualizado); modales de revisión y éxito; indicadores Frozen. Al cierre: paridad funcional total con V1.
- **Fase 5 — Base de conocimiento y export**: KnowledgePanel + servicio KB + botón exportar JSON.
- **Fase 6 — Pulido y deuda**: unificación active-blocks, cifrado de API Key en reposo (Vault), lazy loading del editor, historial de reuniones (listByProject ya lo permite), retirar Prisma/`features/` si siguen sin uso, accesibilidad y performance (§19).

Reglas: ninguna fase toca lo ya entregado por auth/landing; cada fase termina con `tsc` + lint limpios y smoke test del flujo cerrado; `main` siempre desplegable.

## 17. Estimación por fase

| Fase      | Archivos nuevos aprox. | Componentes | Hooks   | Servicios/Handlers       | Esfuerzo*        | Riesgo                                        | Depende de     |
| --------- | ---------------------- | ----------- | ------- | ------------------------ | ---------------- | --------------------------------------------- | -------------- |
| 0         | 3–5 (SQL, env, docs)   | 0           | 0       | 0                        | 0,5–1 d          | Bajo                                          | Decisión §14.8 |
| 1         | ~18                    | 8–10        | 6–8     | 6 servicios + 5 handlers | 3–5 d            | Medio (selects cascada + API Key server-side) | F0             |
| 2         | ~16                    | 8–10        | 3–4     | 2 servicios + Storage    | 4–6 d            | **Alto** (editor + migración de datos)        | F0, F1         |
| 3         | ~5                     | 2–3         | 1       | 0                        | 1,5–2 d          | Medio (React NodeView)                        | F2             |
| 4         | ~12                    | 4–5         | 2       | 4–5 (IA + tickets)       | 3–5 d            | **Alto** (dinero real: Claude + OpenProject)  | F1, F2         |
| 5         | ~6                     | 2–3         | 2       | 1                        | 1–2 d            | Bajo                                          | F1             |
| 6         | variable               | —           | —       | —                        | 2–3 d            | Bajo                                          | F1–F5          |
| **Total** | **~60–65**             | **~28**     | **~15** | **~18**                  | **≈ 15–24 días** |                                               |                |

\* Esfuerzo de una persona a tiempo completo, incluyendo verificación. El pipeline de IA y el editor concentran el riesgo; el resto es CRUD con el design system ya hecho.

## 18. Checklist de migración

**Fundaciones** — ☐ Decidir modelo multiusuario ☐ Migración SQL 6 tablas + RLS ☐ Bucket `note-images` ☐ Ampliar `lib/env.ts` (OpenProject/Anthropic) ☐ `docs/V1-ARCHITECTURE.md` ☐ Rotar API Key expuesta en `user-settings.json`

**OpenProject** — ☐ Portar `openProjectClient` ☐ Portar `OpenProjectService` (key desde DB) ☐ Portar `duration.ts` ☐ Handler proyectos ☐ Handler boards ☐ Handler columnas ☐ Handler assignable-users ☐ Handler responsible-users ☐ Verificación `/users/me` al guardar key

**Proyectos** — ☐ Servicio + schemas + hooks ☐ Sidebar árbol ☐ Carga perezosa de notas ☐ Renombrado inline ☐ Modal Crear/Editar (tabs) ☐ Selects en cascada ☐ Eliminar con confirmación (cascada por FK)

**Encargados** — ☐ Servicio ☐ Lista en tab ☐ Modal crear/editar ☐ Eliminar

**Configuración** — ☐ Reemplazo de API Key (write-only) ☐ Mostrar dueño (`currentUser`) ☐ Override Responsable ☐ `resolveDefaultResponsible` portado

**Notas/Editor** — ☐ Servicio Supabase ☐ Portar `MeetingDocumentService` ☐ NoteEditor (`useEditor`) ☐ Título Notion ☐ Bubble menu ☐ Botón "+" + menú ☐ Modal Asignado ☐ Modal Horas ☐ Modal Fecha ☐ Extensión BlockMetadata ☐ Chips + drag&drop ☐ Extensión TicketTracking (barra + chip) ☐ Imágenes → Storage (paste/drop) ☐ Autosave 600 ms ☐ Export JSON ☐ Script migración de datos V1 ☐ Verificar nota real de 11 MB migrada

**Reuniones** — ☐ Extensión meetingBlock (React NodeView) ☐ Modal participantes ☐ Invitados externos

**IA/Tickets** — ☐ Portar PromptBuilder ☐ Portar MeetingAIService ☐ Portar MeetingProcessor ☐ Portar ticket-draft.utils ☐ Handler analyze (+`ticket_analyses`+rate limit) ☐ Handler create-tickets ☐ Modal revisión ☐ Modal éxito ☐ Congelado aplicado sin recargar ☐ Ubicación en tablero best-effort

**Conocimiento** — ☐ Servicio ☐ Panel + editor ☐ Autosave ☐ Estado abierto persistido

**Transversal** — ☐ Ampliar matcher de `proxy.ts` si hay rutas nuevas ☐ Estados carga/vacío/error en cada vista ☐ Sin `console.log` de datos sensibles ☐ `tsc`+lint por fase ☐ Eliminar `features/` ☐ Decidir retiro de Prisma ☐ README nuevo de V2 ☐ Backup de `data/*.json`

## 19. Mejoras (no migración literal)

1. **TanStack Query en todo el estado de servidor** (ya instalado): reemplaza `fetchJSON` + Maps manuales; invalidación por claves tras mutaciones (p. ej. congelar tickets invalida la nota).
2. **RHF + Zod en todos los formularios** (patrón ya fijado en auth): los 6+ formularios de V1 validaban a mano.
3. **RSC donde aplique**: listas iniciales (proyectos) pueden llegar del servidor; el editor es client puro con `dynamic(() => import(...), { ssr: false })` → **code splitting** real del bundle TipTap.
4. **Supabase Storage para imágenes** (la mejora de mayor impacto): documentos ligeros, carga incremental, URLs firmadas.
5. **Realtime opcional** (Supabase channels) para sincronizar sidebar/título entre pestañas — reemplaza los CustomEvents con algo mejor que lo original.
6. **Motion/React Bits** en la UI migrada: transiciones del sidebar, aparición de chips, modales — coherentes con la identidad de V2.
7. **Memoización dirigida**: el editor re-renderiza mucho; `React.memo` en filas del árbol y tarjetas de revisión; selectors de TanStack Query.
8. **Accesibilidad**: los modales de V1 no tenían focus-trap ni aria; `ui/dialog` (Base UI) lo da gratis. Añadir labels/roles en chips y bloques congelados.
9. **Seguridad reforzada**: cifrado de API Key en reposo, rate limit en `/analyze`, presupuesto de análisis por usuario, sanitización estricta de tamaños de imagen.
10. **Observabilidad**: log estructurado de fallos de OpenProject (hoy `console.error`) y del endpoint no documentado (§14.1).
11. **Historial de reuniones** (el README de V1 lo deja listo: `listByProject` + una vista) — quick win post-migración.
12. **Testing mínimo**: fixtures reales de `notes.json` contra `prepareForAI`/`applyTicketTracking`/`extractImages` — la lógica más valiosa y más fácil de testear (pura).

---

_Fin del contrato. Cualquier desviación durante la implementación debe registrarse como enmienda en este documento._
