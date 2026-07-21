# ADMIN_ANALYTICS_PLAN.md — Contrato técnico del Panel de Administrador

> Documento de investigación y arquitectura para `src/modules/admin/`. Ningún archivo del proyecto fue modificado para producirlo — es exclusivamente un contrato de diseño, previo a cualquier implementación. Todo lo afirmado sobre la API v3 de OpenProject proviene de fetches en vivo a `https://www.openproject.org/docs/api/*` (citados por sección); donde la documentación oficial no fue concluyente, se marca explícitamente como **NO CONFIRMADO** en lugar de asumirse.

---

## 0. El hallazgo que determina toda la arquitectura

`GET /api/v3/work_packages` acepta `groupBy=<campo>&showSums=true` y devuelve **agregación real del lado del servidor**: `_embedded.groups[]` (valor + conteo por grupo, y suma por grupo de las propiedades numéricas sumables) y `_embedded.totalSums`. Es el **único** endpoint de las ~50 categorías de la API con esta capacidad — proyectos, usuarios, memberships y time_entries no la tienen bajo ninguna forma. Además, no existe una API de "Reports"/"Cost reports": el endpoint `/api/v3/budgets` está explícitamente documentado como _"currently only implemented as a stub"_ (solo `id`+`subject`, sin costos ni tiempo). Todo reporte que no encaje en un `groupBy` de una sola dimensión debe construirse trayendo filas crudas (paginadas, con proyección `select` ajustada) y agregando en nuestro propio servidor.

Esto convierte la estrategia en **híbrida** por diseño, no por elección estética: usar `groupBy`+`showSums` (y `select=total,...` para conteos sueltos) en todo lo que encaje en una sola dimensión, y caer a fetch-y-agregar únicamente donde la API genuinamente no ofrece otra cosa.

Fuentes verificadas: [API index](https://www.openproject.org/docs/api/) · [Work packages](https://www.openproject.org/docs/api/endpoints/work-packages/) · [Filters](https://www.openproject.org/docs/api/filters/) · [Collections](https://www.openproject.org/docs/api/collections/) · [Budgets](https://www.openproject.org/docs/api/endpoints/budgets/) (stub) · GitHub `opf/openproject` PR #18592 (tipos `groups`/`totalSums`/`sumsSchema`).

---

## 1. Investigación completa de la API v3 (Fase 1 obligatoria)

Formato por endpoint: ruta · método · auth · parámetros · filtros · paginación · limitaciones · datos devueltos.

### 1.1 Mecánica común a toda la API

| Aspecto                         | Detalle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth**                        | Basic Auth `apikey:<token>` (lo que ya usa `openproject-client.ts`) o `Authorization: Bearer <token>` equivalente. OAuth2 existe pero es irrelevante para nuestro modelo de token-por-usuario. Cookies de sesión solo funcionan same-origin — inutilizables desde nuestro servidor.                                                                                                                                                                                                                                                                                                                    |
| **Formato**                     | HAL+JSON: toda colección/recurso trae `_type`, `_links`, `_embedded`. Los recursos embebidos siempre vienen completos, nunca como stub.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Paginación**                  | `offset` + `pageSize`. `perPageOptions` por defecto `[20, 100]` (`GET /api/v3/configuration`). El techo real de `pageSize` es configurable por el admin de la instancia en _Administration → System settings → API_; fuentes secundarias (no oficiales) mencionan **~500 como valor común**, pero la documentación oficial nunca publica un máximo fijo. **NO CONFIRMADO — verificar empíricamente contra `op.softwaremedico.com.co` antes de asumir un número en el código** (pedir `pageSize=1000` y observar si trunca o rechaza).                                                                  |
| **Sparse fieldsets**            | Parámetro `select` existe (ej. `select=total,elements/id,elements/createdAt`) — permite pedir solo el conteo (`total`) sin traer los elementos, o proyectar solo los campos necesarios. Sintaxis exacta de campos anidados **no verificada en vivo** — confirmar con una petición real antes de codificarla como constante.                                                                                                                                                                                                                                                                            |
| **Filtros**                     | Parámetro `filters`, JSON URL-encoded, **solo AND** (no hay OR entre condiciones). Forma: `[{"<campo>":{"operator":"<op>","values":["..."]}}]`. Operadores: `=`, `!` (distinto), `~`/`!~` (LIKE), `**` (texto completo), `*`/`!*` (no-nulo/nulo), `&=` (contiene todos), `>=`/`<=` (numérico), `=d` (fecha exacta), `<>d` (**rango entre dos fechas ISO8601** — el que usaremos para "rango de fechas"), `t-`/`t+`/`<t+`/`>t+`/`<t-`/`>t-` (offsets relativos en días), `w` (esta semana), `t` (hoy), `o`/`c` (estado abierto/cerrado — evita resolver IDs de status), booleanos como `['t']`/`['f']`. |
| **Orden**                       | `sortBy`, JSON `[[campo, "asc"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | "desc"], ...]`. |
| **Rate limiting**               | **No documentado en ninguna parte** (ni Community ni Enterprise). No hay guía oficial de "no satures la API". Recomendación defensiva: tratar la instancia como recurso compartido y auto-pacer el cliente igual, sin asumir que existe protección del lado del servidor.                                                                                                                                                                                                                                                                                                                              |
| **ETag / conditional requests** | Sin evidencia de soporte en ninguna página de la documentación. Asumir que no existen — el polling debe ser "pedir de nuevo", no "preguntar si cambió".                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Reports / Cost reports**      | No existe como categoría de API (verificado contra el índice completo de +50 grupos de endpoints). "Time and cost reporting" existe solo como funcionalidad de UI (`/docs/user-guide/time-and-costs/reporting/`), sin equivalente en la API.                                                                                                                                                                                                                                                                                                                                                           |

Fuentes: [Introduction](https://www.openproject.org/docs/api/introduction/) · [Collections](https://www.openproject.org/docs/api/collections/) · [Filters](https://www.openproject.org/docs/api/filters/) · [Configuration](https://www.openproject.org/docs/api/endpoints/configuration/).

### 1.2 Work Packages — el endpoint central

|                         |                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Endpoint**            | `GET /api/v3/work_packages` (global, preferido). `GET /api/v3/projects/{id}/work_packages` está **deprecado** en favor de `GET /api/v3/workspaces/{id}/work_packages`.                                                                                                                                                                                                                                                                           |
| **Método**              | GET (listar/agregar), POST (crear — ya usado), PATCH `/{id}` (ya usado), DELETE `/{id}`.                                                                                                                                                                                                                                                                                                                                                         |
| **Auth**                | Token API + permiso "view work package" en el proyecto correspondiente.                                                                                                                                                                                                                                                                                                                                                                          |
| **Parámetros clave**    | `filters`, `sortBy`, `groupBy`, `showSums`, `select`, `offset`, `pageSize`.                                                                                                                                                                                                                                                                                                                                                                      |
| **Filtros disponibles** | `status`, `type`, `project`, `assignee`, `responsible`, `author`, `priority`, `category`, `version`, `subject`, `createdAt`, `updatedAt`, `dueDate`, `startDate`, `customField{N}` — se les aplican todos los operadores de §1.1.                                                                                                                                                                                                                |
| **Paginación**          | offset/pageSize estándar; sin override documentado específico de este endpoint.                                                                                                                                                                                                                                                                                                                                                                  |
| **Agregación**          | `groupBy=<campo>` (una sola dimensión: `status`, `assignee`, `responsible`, `project`, `type`...) + `showSums=true` → `_embedded.groups[]` con conteo y suma por grupo de props numéricas sumables (`estimatedTime` entre ellas), más `_embedded.totalSums` y `sumsSchema` (qué props son sumables). **Documentado explícitamente como exclusivo de esta colección** — "Aggregation is as of now only supported by the work package collection." |
| **Limitaciones**        | Ruta project-scoped deprecada; sin OR entre filtros (una condición "status A OR status B en campos distintos" exige varias peticiones); `groupBy` es de una sola dimensión — cruces multidimensionales (ej. PM × mes) requieren varias llamadas agrupadas o traer filas crudas.                                                                                                                                                                  |
| **Campos devueltos**    | `estimatedTime`, `derivedEstimatedTime` (rollup de hijos), `remainingTime`/`derivedRemainingTime`, `spentTime` (**requiere permiso "view time entries" aparte** — no es lo mismo que `estimatedTime`), `percentageDone`/`derivedPercentageDone`, `startDate`, `dueDate`, `createdAt`, `updatedAt`, `storyPoints`, enlaces a `assignee`, `responsible`, `author`, `project`, `type`, `status`, `priority`, `category`, `version`.                 |

Endpoints de apoyo ya parcialmente cubiertos por nuestro cliente: `available_assignees`, `available_watchers`, `available_relation_candidates`, `available_projects`.

Fuente: [Work packages](https://www.openproject.org/docs/api/endpoints/work-packages/).

### 1.3 Queries

`GET/POST /api/v3/queries`, `GET /api/v3/queries/{id}`, **`GET /api/v3/queries/default`** (ad-hoc: acepta `filters`/`sortBy`/`groupBy` como query params y devuelve resultados embebidos **sin persistir nada**), `GET /api/v3/queries/schema`. Una Query es solo un paquete nombrado de `filters`+`sortBy`+`groupBy`+`sums`. Confirma (sin novedad adicional) lo ya investigado en la migración anterior: Boards = Grids con `scope=/projects/{id}/boards`, columnas = Queries con orden manual.

### 1.4 Projects

|                   |                                                                                                                                                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**      | `GET /api/v3/projects`                                                                                                                                                                                                                                                                                                  |
| **Filtros**       | `active` (bool — activo/archivado), `ancestor`, `created_at`, `favorited`, `id`, `latest_activity_at`, `name_and_identifier` (`~`), `parent_id`, `principal`, `project_status_code`, `type_id`, `visible`.                                                                                                              |
| **Devuelve**      | `id`, `identifier`, `name`, `active`, `public`, `favorited`, `description`, `statusExplanation`, `createdAt`, `updatedAt`, campos custom. Enlaces: `parent`, `ancestors`, `categories`, `types`, `versions`, `memberships`, `workPackages`, **`status`** (recurso ProjectStatus — un semáforo real existe), `storages`. |
| **Detalle clave** | "Activo" = `active: true` (no archivado); **no** implica actividad reciente. Pero `latest_activity_at` **sí existe, es filtrable y ordenable** — permite "proyectos activos en los últimos N días" sin tocar work_packages.                                                                                             |
| **Gotcha**        | OpenProject 17+ fusiona proyectos/programas/portfolios bajo un concepto de "workspace" — verificar si la instancia real lo usa.                                                                                                                                                                                         |

Fuente: [Projects](https://www.openproject.org/docs/api/endpoints/projects/).

### 1.5 Users

|                     |                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Endpoint**        | `GET /api/v3/users`, `GET /api/v3/users/me` (ya usado)                                                                                                                                                                                                                                                                                              |
| **Filtros**         | `status` (`active`/`registered`/`locked`/`invited`), `group`, `name`, `login`.                                                                                                                                                                                                                                                                      |
| **Devuelve**        | `id`, `login`, `firstName`, `lastName`, `name`, `email`, `admin` (bool), `avatar`, `status`, `language`, `createdAt`, `updatedAt`.                                                                                                                                                                                                                  |
| **Limitación dura** | **No existe ningún campo de "último login"/"actividad reciente" en el recurso User.** "Usuarios activos" solo puede significar `status: active` (no bloqueado/invitado) — nunca "usó el sistema recientemente". Cualquier proxy de actividad real debe derivarse de work packages (autor/asignado/actualizado en un rango), no del recurso usuario. |

Fuente: [Users](https://www.openproject.org/docs/api/endpoints/users/).

### 1.6 Memberships y Roles — resolución de "quién es PM"

|                                       |                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Memberships** `/api/v3/memberships` | Filtros: `principal`, `project` (**opcional** — existen memberships globales sin proyecto), `role`, `group`, `name`, `status`, `blocked`, `created_at`, `updated_at`. Devuelve: `id`, `createdAt`, `updatedAt`, enlaces a `project`, `principal` (User o Group), **`roles` como colección** (una membership puede tener varios roles). Es la única tabla de unión usuario↔proyecto↔rol que existe. |
| **Roles** `/api/v3/roles`             | Solo lectura vía API (sin crear/editar/borrar). Filtros: `grantable`, `unit` (`project`\|`system`). Recurso trivial: `{id, name}`. **Roles por defecto confirmados en el ejemplo oficial**: `Non member`(1), `Anonymous`(2), **`Manager`(3)**, `Member`(4), `Reader`(5).                                                                                                                           |

**Veredicto — ¿se puede determinar "quién es Project Manager" desde OpenProject de forma confiable? NO.** El rol por defecto se llama literalmente `"Manager"`, no `"Project Manager"`; los nombres de rol son texto libre, renombrable por cualquier admin de la instancia, y se pueden crear roles adicionales arbitrarios. OpenProject **no tiene ningún concepto semántico de primera clase de "Project Manager"** — solo membership + una etiqueta de rol definida por el admin.

Esto confirma que el propio split que pide el usuario (Fase 1 = cualquier usuario seleccionable; fase futura = solo `project_manager`) es la única aproximación estructuralmente sólida: **Fase 1** deja elegir cualquier usuario de OpenProject en el reporte "Tickets por PM". **Fase futura**: usar `users.role` de **nuestra propia tabla** (ya existe, ya es confiable, ya está atada a `auth_id`) cruzada contra OpenProject **únicamente por email/login** (`users.email` ↔ `OpenProject.User.email`) — sin verificación posible desde la API de que ambos correos coincidan; es una asunción operativa a documentar, no una garantía estructural.

Fuentes: [Memberships](https://www.openproject.org/docs/api/endpoints/memberships/) · [Roles](https://www.openproject.org/docs/api/endpoints/roles/).

### 1.7 Time Entries (tiempo real registrado — distinto de `estimatedTime`)

|                                     |                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Endpoint**                        | `GET/POST /api/v3/time_entries`, `GET/DELETE /{id}`                                                                                                                                                                                                                                                                                                                                                                                  |
| **Auth**                            | Permisos granulares: `log time` (crear), `view time entries`/`view own time entries` (leer), `edit time entries`/`edit own time entries`.                                                                                                                                                                                                                                                                                            |
| **Filtros**                         | `entity_type` (`WorkPackage`\|`Meeting`), `entity_id`, `project_id`, `user_id`, `ongoing` (bool), `spent_on` (rango de fechas), `created_at`, `updated_at`, `activity_id`.                                                                                                                                                                                                                                                           |
| **Devuelve**                        | `id`, `comment`, `spentOn`, `hours` (duración ISO 8601, ej. `"PT5H"`), `ongoing`, `createdAt`/`updatedAt`, `startTime`/`endTime` (si el reloj está habilitado), enlaces a `project`/`entity`/`user`/`activity`.                                                                                                                                                                                                                      |
| **Edición Community vs Enterprise** | El registro básico de horas (`hours`/`spentOn`/`comment`) **está disponible en Community**. El reporte de costos monetarios (tarifas por hora) requiere el módulo Costs/Budget, orientado a Enterprise — podemos leer horas reales libremente, **no** asumir datos de costo en dinero.                                                                                                                                               |
| **Agregación**                      | **Ninguna.** Sin `groupBy`/`sums` documentados para esta colección — hay que traer y sumar nosotros.                                                                                                                                                                                                                                                                                                                                 |
| **Caveat crítico para NoName**      | Nuestro propio flujo (Fase 4 de la migración) **solo escribe `estimatedTime` al crear el ticket** — nunca registra Time Entries reales vía nuestra app. Un reporte de "horas reales" solo tendrá datos si el equipo usa la función de time-tracking de OpenProject **de forma independiente, directamente en su UI**. Debe diseñarse un empty-state que distinga "0 horas registradas" real de "esta función simplemente no se usa". |

Fuentes: [Time entries](https://www.openproject.org/docs/api/endpoints/time-entries/) · [Time and costs](https://www.openproject.org/docs/user-guide/time-and-costs/).

### 1.8 Activities — no sirve como feed global

`GET/PATCH /api/v3/activities/{id}` — **no existe colección global listable/filtrable**. Las actividades están ancladas por work package (`GET /api/v3/work_packages/{id}/activities`), no por instancia. **Confirmado: no se puede construir un feed de "Actividad reciente" cruzando toda la instancia desde este endpoint** — iterar work packages uno por uno para juntar actividades no escala. Alternativa viable: usar `work_packages` ordenado por `updatedAt` desc como proxy de actividad (se pierde el detalle campo-por-campo del diff, pero escala perfectamente con un solo request).

Fuente: [Activities](https://www.openproject.org/docs/api/endpoints/activities/).

### 1.9 Metadatos de apoyo

| Endpoint                 | Notas para analítica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v3/types`      | Global (`/projects/{id}/types` deprecado → `/workspaces/{id}/types`). Campos: `id`, `name`, `color`, `position`, `isDefault`, `isMilestone`. Sin filtros — colección completa por scope.                                                                                                                                                                                                                                                                                                                                                  |
| `GET /api/v3/statuses`   | **Global**, no por proyecto. Campo clave: **`isClosed`** (bool) — base de todo reporte abierto/cerrado; nunca hardcodear nombres de status, cada instancia los personaliza. También: `color`, `isDefault`, `excludedFromTotals`, `defaultDoneRatio`.                                                                                                                                                                                                                                                                                      |
| `GET /api/v3/versions`   | Sprints/milestones. `status` (open/locked/closed), `startDate`/`endDate`, `sharing`. Fuera del alcance de los reportes pedidos — útil como corte futuro opcional.                                                                                                                                                                                                                                                                                                                                                                         |
| `GET /api/v3/categories` | Por proyecto únicamente (`/workspaces/{id}/categories`). `{id, name, project, defaultAssignee?}` — tag ligero, no crítico para Fase 1.                                                                                                                                                                                                                                                                                                                                                                                                    |
| Custom Fields            | **No existe una colección pública `/api/v3/custom_fields` documentada** — vacío real de documentación, confirmado por búsqueda, no solo por 404 de una URL. Aparecen en work packages como `customField1`, `customField2`... dinámicos, descubribles solo vía el recurso `schema` de cada combinación proyecto+tipo (ej. `/projects/{id}/work_packages/form`). Sin lista fija cacheable para siempre. **Recomendación: fuera de alcance para Fase 1.**                                                                                    |
| Webhooks                 | **Soportados**, pero se configuran en _Administration → API and webhooks_ del lado de OpenProject — **requiere que el administrador de `op.softwaremedico.com.co` los active apuntando a nuestro endpoint**; no se puede activar con una API key personal. Eventos: create/update de proyectos, work packages, comentarios, time entries, adjuntos. Firma HMAC. **No se puede asumir disponible** — tratar como mejora opcional futura condicionada a cooperación del admin de la instancia; el polling es el único fallback garantizado. |

Fuentes: [Types](https://www.openproject.org/docs/api/endpoints/types/) · [Statuses](https://www.openproject.org/docs/api/endpoints/statuses/) · [Versions](https://www.openproject.org/docs/api/endpoints/versions/) · [Categories](https://www.openproject.org/docs/api/endpoints/categories/) · [Webhooks (admin guide)](https://www.openproject.org/docs/system-admin-guide/api-and-webhooks/).

---

## 2. Arquitectura del módulo

### 2.1 Independencia y reutilización

El módulo es funcionalmente independiente (no depende de `modules/projects`, `modules/notes` ni `modules/tickets` para operar), pero **reutiliza sin duplicar**:

- `modules/openproject/services/openproject-client.ts` y `openproject.service.ts` — el admin panel añade nuevos MÉTODOS a este cliente (listar work packages con filtros/groupBy, listar memberships, listar time entries), no un cliente HTTP paralelo. El patrón `OpenProjectService.forUser(authId)` se extiende, no se reemplaza.
- El design system completo (`components/ui`, `components/shared`, `components/effects`), en particular `effects/beams.tsx` (fondo, ya usado en la Landing), `shared/floating-panel.tsx`, `shared/glass-badge.tsx`, `shared/hover-lift.tsx`, `shared/empty-state.tsx`, `ui/skeleton.tsx`.
- El patrón de servicios "el cliente nunca llama a OpenProject directo" (`route-helpers.ts` → `withOpenProject`) — todo lo nuevo pasa por Route Handlers server-only bajo `app/api/admin/*`.
- TanStack Query como única capa de estado de servidor (ya provisto globalmente en `app/providers.tsx`).

### 2.2 Decisión de arquitectura: ¿con qué API Key consulta el panel? — **RESUELTO: Opción A**

El panel es una vista **transversal** (todos los proyectos, todos los usuarios), pero `OpenProjectService.forUser(authId)` hoy solo sabe actuar "como" un usuario concreto — y OpenProject **aplica los permisos reales del dueño de esa key**: si el admin de NoName no tiene membership en todos los proyectos de OpenProject, verá un subconjunto parcial sin que nuestra app pueda saberlo de antemano.

| Opción                                                         | Cómo funciona                                                                                                                                                                      | Pros                                                                            | Contras                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(A) API Key del propio admin** — ✅ **decidida para Fase 1** | El panel usa `OpenProjectService.forUser(authId)` con el `authId` del usuario `admin`/`superadmin` que abrió el panel — mismo mecanismo ya construido, cero infraestructura nueva. | Cero cambios de infraestructura; reutiliza el 100% del código existente; YAGNI. | Requiere que el usuario admin tenga membership de OpenProject en TODOS los proyectos que se quieren analizar. Si no es así, el panel muestra datos parciales sin aviso — **debe validarse manualmente en OpenProject antes de confiar en los números**. |
| (B) Cuenta de servicio dedicada — descartada por ahora         | Un token de OpenProject con visibilidad total, guardado en variable de entorno de servidor (no en `users`), usado solo por los endpoints de `/api/admin/*`.                        | Visibilidad completa garantizada, independiente de quién mire el panel.         | Requiere aprovisionar un usuario/token nuevo en OpenProject (tarea operativa del lado del cliente) + una env var nueva (`OPENPROJECT_ADMIN_API_KEY`) + un nuevo método `OpenProjectService.withServiceAccount()`.                                       |

Es honesto sobre lo que hoy podemos garantizar, no bloquea el arranque de la implementación con una tarea operativa externa, y (B) queda como una migración de una línea el día que se necesite (cambiar de dónde sale el `apiKey` dentro del mismo `OpenProjectService`). El panel debe documentar visiblemente esta limitación ("Los datos reflejan lo visible desde tu cuenta de OpenProject") para que sea transparente, no oculta — misma lección del incidente de la API Key mal diagnosticada de la sesión anterior: nunca dejar que una limitación real se disfrace de "todo funciona".

### 2.3 Control de acceso

`ROLES` ya distingue `superadmin`/`admin`/`project_manager` (`src/modules/auth/types/index.ts`). El panel debe ser visible solo para `admin`/`superadmin`. Hoy `src/proxy.ts` únicamente verifica sesión + `email_verified` + `pay` (nunca `role`) para las rutas bajo `/dashboard`. Para Fase 2 (implementación, NO ahora) hace falta:

- Verificación de rol en el propio Route Handler (`app/api/admin/*`) — **obligatoria**, es la barrera real de seguridad (datos server-side).
- Opcionalmente, ocultar el ítem del sidebar si `role === 'project_manager'` (mejora de UX, no de seguridad — nunca confiar solo en esto).
- No se necesita tocar `proxy.ts`: el gate correcto vive en los Route Handlers, igual que ya se hace para OpenProject/settings.

### 2.4 Acceso desde el sidebar y navegación

El botón **"📊 Panel Administrador"** va en `modules/dashboard/components/DashboardShell.tsx`, en la misma lista donde hoy vive el botón de Configuración — mismo componente `Button`, mismas clases de hover/spacing/tipografía ya establecidas (nada nuevo que diseñar ahí).

Interpretación literal del requisito **"NO debe reemplazar la vista actual. Debe abrir una NUEVA PESTAÑA del Dashboard"**: esto describe una **pestaña real del navegador** (`target="_blank"`), no un tab interno tipo SPA — si fuera navegación interna (`router.push`), sí reemplazaría la vista actual, contradiciendo el requisito explícito. Implementación: un `<a href="/dashboard/admin" target="_blank" rel="noopener noreferrer">` estilizado como el resto de los ítems del sidebar (mismo componente visual, distinto elemento semántico). La ruta nueva `app/dashboard/admin/page.tsx` cae automáticamente bajo el layout existente `app/dashboard/layout.tsx` (mismo `DashboardShell`, mismas protecciones), cumpliendo "debe seguir exactamente la navegación existente" — es una ruta hija más del dashboard, no un layout paralelo.

### 2.5 Organización de carpetas

```
src/modules/admin/
├─ components/
│  ├─ AdminDashboardShell.tsx        # fondo Beams + layout de la página completa
│  ├─ FilterBar.tsx                  # filtros globales (fecha, proyecto, usuario, PM, dev, tipo)
│  ├─ StatCard.tsx                   # card glass con número + tendencia (base de "Dashboard General")
│  ├─ TrendChart.tsx                 # wrapper Recharts para "Tendencia de Tickets"
│  ├─ DistributionChart.tsx          # wrapper Recharts (barras/donut) para PM/Proyecto/Dev
│  ├─ RankingTable.tsx               # tabla ordenable genérica (PM, Proyecto, Desarrolladores)
│  ├─ RecentActivityTable.tsx        # tabla de "Actividad Reciente"
│  ├─ TimeBreakdownPanel.tsx         # horas por proyecto/dev/PM + promedios
│  └─ skeletons/                     # esqueletos específicos por widget
├─ hooks/
│  ├─ useAdminFilters.ts             # estado de filtros sincronizado con la URL (useSearchParams)
│  ├─ useDashboardSummary.ts         # cards del Dashboard General
│  ├─ useTicketTrend.ts
│  ├─ useTicketsByPm.ts
│  ├─ useTicketsByProject.ts
│  ├─ useDeveloperRanking.ts
│  ├─ useTimeBreakdown.ts
│  └─ useRecentActivity.ts
├─ services/                         # orquestación cliente → nuestros Route Handlers (fetch + shape)
│  └─ admin-analytics.service.ts
├─ repositories/                     # SOLO servidor: construcción de queries contra OpenProject
│  ├─ work-packages.repository.ts    # groupBy/showSums/select builders, filtros compartidos
│  ├─ projects.repository.ts
│  ├─ memberships.repository.ts
│  ├─ time-entries.repository.ts
│  └─ internal-metrics.repository.ts # "reuniones procesadas" — Supabase, no OpenProject
├─ schemas/
│  └─ admin-filters.schema.ts        # Zod: valida filtros desde la URL y en cada Route Handler
├─ types/
│  └─ index.ts                       # AdminFilters, DashboardSummary, TrendPoint, Ranking*, etc.
├─ utils/
│  ├─ openproject-filters.ts         # construcción del JSON de `filters` a partir de AdminFilters
│  ├─ date-buckets.ts                # bucketing día/semana/mes + cálculo de variación %
│  └─ duration.ts                    # parseo de horas ISO8601 ("PT5H" → 5) — reutilizable, ya existe
│                                      # una versión equivalente en modules/openproject/utils/duration.ts
│                                      # (esa convierte horas→ISO8601; esta hace el camino inverso — evaluar
│                                      # fusionarlas en modules/openproject/utils si se implementan ambas)
└─ pages/
   └─ AdminDashboardPage.tsx
```

`app/dashboard/admin/page.tsx` (delgada, solo importa `AdminDashboardPage`) + `app/api/admin/*/route.ts` (Route Handlers server-only, uno por reporte pesado, más uno combinado para el resumen).

**Nota sobre `repositories/`**: es una carpeta nueva, no usada por ningún otro módulo hasta ahora (`auth`, `projects`, `notes`, `tickets`, `openproject`, `ai` solo tienen `services/`). Se introduce aquí porque el admin panel necesita separar claramente "construir la query contra OpenProject" (repositories — lógica de bajo nivel, filtros/groupBy, sin caché ni forma de respuesta al cliente) de "orquestar, cachear y dar forma a la respuesta para el cliente" (services). Es aditivo y experimental a este módulo — no se propone refactorizar los módulos existentes para adoptar el mismo patrón; si demuestra valor real, evaluarlo después.

---

## 3. Endpoints necesarios (resumen operativo)

| Reporte                               | Endpoint(s)                                                                               | Modo                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Tickets creados hoy/semana/mes        | `work_packages?filters=[createdAt <>d ...]&select=total`                                  | Conteo barato (1 request c/u)                   |
| Horas estimadas este mes              | `work_packages?filters=[createdAt <>d mes]&showSums=true`                                 | Suma servidor (1 request)                       |
| Proyectos activos                     | `projects?filters=[active=true]`                                                          | `total` del response (1 request)                |
| PMs activos / Usuarios activos        | Ver §4.3 — mezcla de `users?filters=[status=active]` y nuestra tabla `users`              | Mixto                                           |
| Reuniones procesadas                  | Supabase `ticket_analyses` (status='confirmed')                                           | 100% interno, NO OpenProject                    |
| Tendencia de tickets                  | `work_packages?filters=[createdAt <>d rango]&select=total,elements/id,elements/createdAt` | Fetch proyectado + bucketing propio             |
| Tickets por PM                        | `work_packages?groupBy=responsible&showSums=true&filters=[...]`                           | Agregación servidor (1 request)                 |
| Tickets por Proyecto                  | `work_packages?groupBy=project&showSums=true&filters=[...]`                               | Agregación servidor (1 request)                 |
| Desarrolladores: más tickets/horas    | `work_packages?groupBy=assignee&showSums=true`                                            | Agregación servidor (1 request)                 |
| Desarrolladores: más proyectos, carga | fetch proyectado `{assignee, project}` + dedupe propio                                    | Fetch + cómputo propio (no hay cruce 2D nativo) |
| Tiempo por proyecto/dev/PM            | igual que "por PM"/"por Proyecto" reutilizando `showSums`                                 | Agregación servidor                             |
| Tiempo real (horas logueadas)         | `time_entries?filters=[...]` paginado                                                     | Fetch + suma propia (sin agregación nativa)     |
| Actividad reciente                    | `work_packages?sortBy=[[updatedAt,desc]]&select=...`                                      | Fetch proyectado, NO `activities`               |
| Resolución PM (fase futura)           | `roles` + `memberships` (heurística por nombre) o `users.role` interno + email            | Hídrido, ver §1.6                               |

---

## 4. Datos disponibles vs. NO disponibles

### 4.1 Disponibles directamente

- Conteos y sumas de `estimatedTime` agrupados por status/proyecto/asignado/responsable/tipo (1 request c/u, vía `groupBy`+`showSums`).
- Fechas de creación/actualización/vencimiento por ticket, con filtros de rango — base de toda tendencia.
- Estado abierto/cerrado real (`isClosed` en `statuses`, o el atajo `o`/`c` en filtros).
- Horas realmente registradas (`time_entries`) — **si el equipo usa esa función de OpenProject**.
- Membership + rol por proyecto (quién pertenece a qué proyecto, con qué etiqueta de rol).
- `latest_activity_at` en proyectos — proxy barato de "proyecto activo recientemente" sin tocar work packages.
- Semáforo de estado del proyecto (`ProjectStatus`, campo `status` en Projects).

### 4.2 NO disponibles (limitaciones reales de la API, no de nuestra implementación)

- **Último login / última actividad de un usuario** — no existe ese campo en `User`. "Usuarios activos" solo puede significar `status !== locked/invited`.
- **Concepto nativo de "Project Manager"** — no existe; ver §1.6.
- **Feed global de actividad** — `activities` está scopeado por work package, no por instancia.
- **Reportes/agregaciones pre-calculadas fuera de `work_packages`** — proyectos, usuarios, memberships y time_entries no tienen `groupBy`/`sums`.
- **Costos monetarios** — requiere módulo Costs (orientado a Enterprise); no asumir disponible.
- **Lista fija de custom fields** — se descubren por proyecto+tipo, no hay catálogo global.
- **Garantía de rate limiting predecible** — no documentado; comportamiento real depende de la infraestructura propia del cliente.

### 4.3 El caso especial "PMs activos" / "Usuarios activos"

Ambas cards del Dashboard General son ambiguas tal como están redactadas en el pedido — hay que decidir su fuente antes de implementar:

- **"Usuarios activos" (de OpenProject)**: `users?filters=[status=active]` → cuenta cuentas no bloqueadas/invitadas. **No** significa "usaron el sistema esta semana". Requiere copy/tooltip honesto en la UI.
- **"Project Managers activos"**: recomendado usar **nuestra propia tabla `users`** (`role = 'project_manager' AND pay = 1`, o el criterio de "activo" que ya use el resto de la app) — es un dato 100% confiable que ya tenemos, en vez de inventar una heurística contra OpenProject. El cruce con OpenProject (para el reporte "Tickets por PM") sigue siendo por selección manual de usuario de OpenProject en Fase 1, según ya decidido en §1.6.

---

## 5. Estrategia de caché

Dos capas, deliberadamente distintas:

1. **TanStack Query (cliente)** — capa primaria, ya estándar en el proyecto. `staleTime` diferenciado por costo real del reporte:
   - Cards de conteo puro (`select=total`) y agregaciones de 1 request (`groupBy`+`showSums`): `staleTime` corto (60s) — son baratas, se pueden refrescar seguido.
   - Reportes que exigen fetch-y-agregar (tendencia, "más proyectos por dev", tiempo real logueado): `staleTime` largo (5–10 min) — son las caras, hay que evitar recalcularlas por cada apertura.
   - Todas las query keys incluyen los filtros serializados (`['admin', 'ticket-trend', filtersHash]`) — cambiar un filtro es, automáticamente, una entrada de caché distinta; no hace falta invalidación manual al cambiar filtros, solo al hacer una mutación (no aplica aquí, el panel es de solo lectura).
2. **Caché de servidor (opcional, Fase futura, no Fase 2 inicial)** — dado que OpenProject no soporta ETag/If-Modified-Since y no publica límites de tasa, un caché in-process de TTL corto (2–5 min) por hash de filtros en los Route Handlers más caros evitaría que dos administradores con pestañas abiertas dupliquen el mismo fetch-y-agregar pesado. Se propone como mejora, no como requisito de la primera implementación — la carga esperada (equipo pequeño, panel interno) probablemente no la justifica todavía. Si se implementa, el patrón ya existe en el proyecto: `ticket_analyses` demuestra que persistir resultados computados server-side en Supabase es un patrón aceptado, aunque ahí resuelve un problema distinto (propuesta pendiente de revisión humana, no caché).

Sin polling ni websockets en la primera versión: refetch al cambiar filtros + botón "Actualizar" manual + `staleTime` razonable es suficiente para un panel interno. Webhooks (§1.9) quedan como mejora condicionada a que el administrador de la instancia de OpenProject los configure — no se debe diseñar la arquitectura asumiendo que estarán disponibles.

---

## 6. Estrategia de consultas

- **Todo pasa por Route Handlers server-only** (`app/api/admin/*`), reutilizando/extendiendo el patrón `withOpenProject` ya existente — el cliente nunca ve la API key, igual que en `modules/openproject`.
- **Un handler "resumen" para el Dashboard General**: internamente hace `Promise.all` de sus ~6-8 sub-consultas (todas baratas: `select=total` o `groupBy`+`showSums`) y devuelve un solo payload combinado — minimiza los round-trips navegador→nuestro-servidor aunque contra OpenProject sí sean varias llamadas en paralelo.
- **Un handler por reporte pesado** (tendencia, ranking de desarrolladores por proyectos, tiempo real), cargado de forma perezosa/progresiva: cada widget se monta (y dispara su propio hook/Route Handler) cuando entra en viewport o el usuario expande esa sección — no todo el panel golpea OpenProject en el primer render.
- **Proyección agresiva con `select`** en cualquier fetch de filas crudas — nunca traer el work package completo cuando solo hacen falta 2-3 campos para el bucketing.
- **Filtros compartidos, un solo builder**: `utils/openproject-filters.ts` traduce `AdminFilters` (fecha, proyecto, usuario, PM, dev, tipo) al JSON de `filters` de OpenProject una sola vez, reutilizado por todos los repositories — evita que cada reporte reinvente su propia serialización de filtros y diverja (mismo espíritu que ya se aplicó al unificar `active-blocks` en la Fase 6 de la migración).

---

## 7. Estrategia de actualización

- **Manual + por cambio de filtro** (Fase 1): el usuario decide cuándo refrescar; cambiar cualquier filtro global dispara refetch de todos los widgets visibles vía cambio de query key.
- **Polling condicional (Fase futura, opcional)**: si en uso real se nota que los datos se sienten desactualizados, un intervalo de refetch de baja frecuencia (ej. cada 5 min) en TanStack Query (`refetchInterval`) es la vía más simple — no requiere infraestructura nueva.
- **Webhooks (Fase futura, condicionada)**: si el administrador de OpenProject los activa, un Route Handler receptor (`app/api/admin/webhooks/openproject/route.ts`, con verificación HMAC) podría invalidar el caché de servidor específico en tiempo real. No se debe empezar a construir hasta confirmar que el admin de la instancia real está dispuesto a configurarlos — es un prerequisito externo, no una tarea puramente nuestra.

---

## 8. Riesgos

| #   | Riesgo                                                                                                                                                                                                    | Mitigación                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Techo real de `pageSize` desconocido — puede truncar silenciosamente fetches grandes                                                                                                                      | Verificar empíricamente contra `op.softwaremedico.com.co` antes de escribir cualquier lógica de paginación en código; no asumir 500                                                                                     |
| 2   | "Usuarios activos"/"PMs activos" leídos como actividad reciente cuando OpenProject no la expone                                                                                                           | Copy/tooltip explícito en la UI; usar la fuente correcta por card (§4.3)                                                                                                                                                |
| 3   | Reporte de horas reales puede quedar vacío si el equipo no usa time-tracking de OpenProject                                                                                                               | Empty-state que distinga "0 real" de "función no usada"; no presentarlo como error                                                                                                                                      |
| 4   | El admin que abre el panel puede no tener membership en todos los proyectos de OpenProject (Opción A de §2.2)                                                                                             | Advertencia visible en el panel; validar manualmente contra OpenProject antes de confiar en cifras agregadas                                                                                                            |
| 5   | "Actividad reciente" mal interpretada como log de auditoría real (campo a campo)                                                                                                                          | Reformular expectativa desde el diseño: es "tickets actualizados recientemente", no un log de cambios — evitar el mismo ciclo de "no es lo que pedí" ya vivido con Beams en la landing                                  |
| 6   | Sin rate limiting documentado ≠ sin límites reales                                                                                                                                                        | Pacing defensivo del lado cliente/servidor igual, aunque no sea obligatorio según la documentación                                                                                                                      |
| 7   | `groupBy` es de una sola dimensión — reportes multidimensionales (PM × mes, dev × proyecto) requieren fetch crudo, más caros de lo que “parecen” a primera vista                                          | Presupuestar esos reportes específicos como más lentos/con `staleTime` más largo desde el diseño, no como sorpresa en producción                                                                                        |
| 8   | Webhooks no garantizados — diseñar la arquitectura de actualización asumiendo que nunca llegarán a activarse                                                                                              | Polling/manual como camino principal; webhooks estrictamente opcional                                                                                                                                                   |
| 9   | Custom fields sin documentación pública — cualquier intento de usarlos requiere descubrimiento por proyecto+tipo, caro                                                                                    | Fuera de alcance para Fase 1                                                                                                                                                                                            |
| 10  | Migraciones SQL nuevas (si `internal-metrics.repository.ts` necesita tablas/vistas propias) corren el mismo riesgo que ya ocurrió con `user_settings`: escritas pero nunca ejecutadas contra la base real | Recordar explícitamente en el checklist de implementación: correr y VERIFICAR (con una consulta real, no solo con `tsc`) cualquier migración nueva contra el proyecto de Supabase real antes de dar la fase por cerrada |

---

## 9. Coste de consultas

| Tipo de reporte                                              | Requests contra OpenProject                                                         | Costo relativo                                                                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Cards del Dashboard General (conteos + sumas de 1 dimensión) | 6–8 requests en paralelo, cada uno `select=total` o `groupBy`+`showSums`            | Bajo — todos devuelven agregados, nunca filas completas                                                                          |
| Tickets por PM / por Proyecto / por Dev                      | 1 request cada uno (`groupBy`+`showSums`)                                           | Bajo                                                                                                                             |
| Tendencia de tickets (con comparación vs. periodo anterior)  | 2 requests (rango actual + rango anterior), cada uno paginado con proyección mínima | Medio — depende del volumen de tickets en el rango, pero la proyección `select` lo mantiene liviano                              |
| Desarrolladores: "más proyectos", "carga"                    | 1 request paginado, proyección `{assignee, project}`, dedupe/cómputo propio         | Medio-alto — el único cruce genuinamente caro de los reportes pedidos                                                            |
| Tiempo real logueado                                         | 1+ requests paginados sobre `time_entries` (sin agregación nativa)                  | Medio — depende de cuántas time entries existan; probablemente bajo en la práctica dado que el equipo no las usa activamente hoy |
| Actividad reciente                                           | 1 request paginado, proyección mínima, ordenado por `updatedAt`                     | Bajo                                                                                                                             |

---

## 10. Límites de la API

- `pageSize`: techo real **no confirmado oficialmente**; verificar en vivo antes de codificar cualquier número.
- Sin límite de tasa (rate limit) documentado — no hay una cifra que respetar, pero tampoco garantía de que no exista a nivel de infraestructura (proxy inverso, firewall) fuera del control de OpenProject mismo.
- `groupBy` estrictamente de una dimensión — no hay `groupBy=[a,b]`.
- Filtros solo con AND — nunca OR entre condiciones distintas en una sola petición.
- Sin sparse-fieldset verificado en profundidad (`select` con rutas anidadas) — confirmar sintaxis exacta antes de depender de ella para minimizar payloads.

---

## 11. Posibles optimizaciones

- Usar `select=total` puro (sin `elements`) para cualquier card que solo necesite un número — el payload es mínimo.
- Preferir siempre `groupBy`+`showSums` sobre fetch-y-agregar cuando el reporte encaje en una sola dimensión (la mayoría de los pedidos por el usuario sí encaja: por PM, por Proyecto, por status).
- Cargar los widgets pesados (tendencia, "más proyectos por dev") de forma perezosa (solo cuando entran a viewport o el usuario los expande) en vez de disparar todo en el primer render del panel.
- Memoización de los cálculos derivados que sí corren en nuestro servidor (bucketing de fechas, % de variación, promedios) — son baratos pero no hay razón para recomputarlos si los filtros no cambiaron (ya lo resuelve TanStack Query por construcción, vía `staleTime`).
- Si el volumen real de tickets crece mucho, revisar hacia caché de servidor con TTL corto (§5) antes de considerar full-sync — no construir infraestructura de sincronización completa sin evidencia de que hace falta (YAGNI, misma filosofía que ya guió `MIGRATION_PLAN.md`).

---

## 12. Qué datos vendrán desde OpenProject vs. qué debe calcularse internamente

### Desde OpenProject (directo o vía agregación servidor)

Conteos y sumas de tickets por status/proyecto/asignado/responsable/tipo; fechas de creación/actualización/vencimiento; horas estimadas; horas reales logueadas (si existen); membership y roles por proyecto; estado abierto/cerrado; estado del proyecto (semáforo); "última actividad" a nivel de proyecto (`latest_activity_at`).

### Debe calcularse internamente (en nuestros Route Handlers/servicios, no en OpenProject)

- **Bucketing temporal** (día/semana/mes) para tendencias — `groupBy` no soporta agrupar por fecha.
- **Variación porcentual contra el período anterior** — resta y división simple sobre dos fetches.
- **"Más proyectos por desarrollador"** — cruce assignee×project, sin equivalente nativo de una sola llamada.
- **"Carga" de un desarrollador** — métrica compuesta definida por nosotros (ej. tickets abiertos + horas estimadas pendientes, ponderado), no un concepto de OpenProject.
- **Promedios** (tiempo promedio por ticket/proyecto) — división trivial sobre `totalSums`/conteo ya obtenidos.
- **Resolución heurística de "quién es PM"** en la fase futura — cruce `users.role` (Supabase) ↔ email de OpenProject, según §1.6.
- **"Reuniones procesadas"** — **100% interno**, no tiene ninguna relación con OpenProject; sale de `ticket_analyses`/`notes` en Supabase.
- **Actividad reciente unificada** (tabla con Ticket/Proyecto/Responsable/PM/Fecha) — se arma combinando el resultado de `work_packages` ordenado por `updatedAt` con los datos de proyecto/usuario ya resueltos, no viene así de OpenProject.

---

## 13. Viabilidad de los reportes propuestos

| Reporte                                                 | Viable en Fase 2                                                            | Cómo                                                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard General (8 cards)                             | ✅ Sí, todas                                                                | 7 de 8 desde OpenProject (agregado/conteo); "Reuniones procesadas" es interno                                                   |
| Tendencia de Tickets (día/semana/mes + comparación + %) | ✅ Sí                                                                       | Fetch proyectado + bucketing propio; sin agregación temporal nativa                                                             |
| Tickets por PM (ranking + gráfica + tabla)              | ✅ Sí, con la limitación ya documentada de "PM" = selección libre en Fase 1 | `groupBy=responsible&showSums=true`                                                                                             |
| Tickets por Proyecto                                    | ✅ Sí                                                                       | `groupBy=project&showSums=true`                                                                                                 |
| Desarrolladores (4 rankings)                            | ✅ Sí, con costos dispares                                                  | "más tickets"/"más horas": barato (`groupBy=assignee`). "más proyectos"/"carga": más caro, fetch+cómputo propio                 |
| Tiempo (5 cortes)                                       | ✅ Sí, con caveat de horas reales                                           | Horas estimadas: agregación servidor. Horas reales: depende de si el equipo usa time-tracking — puede estar vacío legítimamente |
| Actividad Reciente                                      | ✅ Sí, reformulado                                                          | No es un log de auditoría; es "tickets actualizados recientemente" — expectativa a alinear antes de construir                   |
| Filtros Globales                                        | ✅ Sí                                                                       | Ver §14                                                                                                                         |

---

## 14. Filtros globales

Estado único, serializado en la URL (`useSearchParams` de Next.js) para que sea compartible/recargable y para que cada combinación de filtros tenga su propia entrada de caché en TanStack Query. Un hook central `useAdminFilters()` lee/escribe esos params y expone un objeto `AdminFilters` tipado (validado con Zod en `schemas/admin-filters.schema.ts`, reutilizado también server-side en cada Route Handler para no confiar en el query string sin validar).

| Filtro          | Mapea a                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| Rango de fechas | Operador `<>d` sobre `createdAt` (o el campo de fecha relevante por reporte) |
| Proyecto        | Filtro `project` en `work_packages`                                          |
| Usuario         | Filtro `author` (o el rol que aplique según el reporte)                      |
| PM              | Filtro `responsible`                                                         |
| Desarrollador   | Filtro `assignee`                                                            |
| Tipo de ticket  | Filtro `type`                                                                |

No existe un date-range picker en el design system actual (el único input de fecha existente, en los modales de metadatos de notas, es de fecha única). Para Fase 1 del panel: dos `<input type="date">` (desde/hasta) reutilizando el mismo patrón ya usado en `MetadataDialogs`, en vez de construir o instalar un componente de rango — evaluar un date-range picker propio solo si la UX de dos inputs resulta insuficiente en uso real.

---

## 15. Componentes visuales

### 15.1 Reutilización directa (sin crear nada nuevo)

`effects/beams.tsx` (fondo, mismo usado en el Hero de la Landing), `shared/floating-panel.tsx` (superficie glass elevada), `shared/glass-badge.tsx`, `shared/hover-lift.tsx`, `shared/empty-state.tsx`, `shared/animated-loader.tsx`, `ui/skeleton.tsx`, `ui/card.tsx`, `effects/scroll-reveal.tsx` (entrada de secciones), `motion/react` para transiciones entre widgets (stagger de children, ya el patrón usado en toda la app).

### 15.2 Nuevos, pero componiendo sobre lo anterior

`StatCard` (glass card + número grande + flecha de tendencia, mismo patrón que `shared/project-card.tsx`: `Card` + `HoverLift`), `RankingTable` (tabla ordenable con avatar+nombre+barra de progreso), `TrendChart`/`DistributionChart` (wrappers delgados sobre la librería de gráficas elegida), skeletons específicos por widget (variantes de `ui/skeleton.tsx`, no un sistema nuevo).

### 15.3 Librería de gráficas — comparación (**RESUELTO: Recharts**)

|                                    | Recharts                                                                          | Tremor                                                                                           | Nivo                                                                              | Chart.js (react-chartjs-2)                                   |
| ---------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Render                             | SVG, componentes React nativos                                                    | SVG (usa Recharts internamente en versiones previas / primitivas propias en Tremor Raw)          | SVG + Canvas según el chart                                                       | Canvas (imperativo)                                          |
| Tema con Tailwind/CSS vars         | Directo — son elementos DOM reales                                                | Directo, pero trae su propia estética de dashboard ya definida                                   | Directo, con más superficie de configuración                                      | Fricción — hay que theming vía config JS, no CSS             |
| Encaje con Motion (`motion/react`) | Natural — son nodos SVG normales, se pueden envolver en `motion.div`/animar props | Igual de natural (mismo motor)                                                                   | Natural, aunque sus propias animaciones internas pueden competir con las nuestras | Difícil — canvas no se anima con Motion                      |
| Tamaño de bundle                   | Moderado, tree-shakeable por tipo de gráfica usada                                | Similar a Recharts + su propio CSS/componentes                                                   | Mayor — API más amplia de la que se necesita aquí                                 | Menor en general, pero irrelevante a nuestra escala de datos |
| Opinión visual impuesta            | Ninguna — solo primitivas de gráfica                                              | Fuerte — trae su propia estética de "dashboard SaaS", compite con el glassmorphism ya construido | Ninguna, pero API más compleja para casos simples                                 | Ninguna, pero requiere más código de theming manual          |
| Madurez/adopción                   | Muy alta, bajo riesgo                                                             | Alta pero más joven como librería de componentes completa                                        | Alta                                                                              | Muy alta (aunque el wrapper React es de terceros)            |

**Recomendación: Recharts.** Es SVG (se tematiza directo con las variables CSS/Tailwind ya definidas en el proyecto), es composición de componentes React normales (se envuelve fácilmente en `motion.div` para las "transiciones entre widgets" pedidas, sin fricción de canvas), no impone una estética propia que competiría con el glassmorphism ya construido (a diferencia de Tremor, que viene con su propio lenguaje visual de dashboard), y es más liviano/simple que Nivo para lo que estos reportes necesitan (barras, líneas, donuts — nada que requiera la sofisticación extra de Nivo). Chart.js queda descartado por la fricción de tematizar un canvas imperativo contra un design system 100% basado en Tailwind + Motion.

Instalar solo `recharts` — ninguna de las otras tres aporta valor suficiente sobre lo que ya existe en el proyecto para justificar su peso o su propia identidad visual.

---

## 16. Rendimiento

- **TanStack Query** como estado de servidor único (ya estándar); `staleTime` diferenciado por costo (§5); ninguna query se dispara sin que su widget esté montado (carga progresiva, no todo-a-la-vez).
- **Server Components donde tenga sentido**: `AdminDashboardPage` puede ser Server Component para el shell estático (fondo Beams, layout, filtros por defecto desde la URL en el primer render), delegando cada widget de datos a un Client Component con su propio hook — evita hidratar JS innecesario para las partes puramente visuales.
- **Code splitting**: si se usa Recharts (bundle no trivial), cargar los componentes de gráfica vía `next/dynamic` con `ssr: false`, mismo patrón ya aplicado al `NoteEditor` en la Fase 6 de la migración — el bundle de gráficas solo se descarga al abrir el panel admin, nunca en landing/login/dashboard normal.
- **Memoización**: cálculos derivados (bucketing, %, promedios) viven detrás de `useMemo`/en el propio Route Handler (ya cacheados por TanStack Query, no hace falta recomputar en cada render mientras la data no cambie).
- **Consultas en paralelo**: todo lo que no depende de un resultado previo se dispara junto (`Promise.all` en los Route Handlers agregados; hooks independientes en paralelo del lado cliente).
- **Invalidación de caché**: nunca manual salvo refresco explícito del usuario — el cambio de query key (por cambio de filtros) ya reemplaza la necesidad de invalidar nada a mano.

---

_Fin del contrato de investigación. Decisiones de arquitectura confirmadas: §2.2 (API Key del propio admin, Opción A) y §15.3 (Recharts). Pendiente antes de dar por cerrada cualquier fase de implementación: verificar empíricamente el techo real de `pageSize` contra la instancia de OpenProject real, según §1.1 y §10._
