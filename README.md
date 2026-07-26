# NoName

Asistente de notas de reunión con generación de tickets en OpenProject: se dicta o escribe una nota de reunión, se analiza con IA (Claude) para extraer tickets propuestos, y se crean como Work Packages reales en OpenProject. Incluye un panel administrador con métricas agregadas (tickets, horas, ranking de desarrolladores) leídas en vivo desde OpenProject.

## Arquitectura

Next.js App Router, patrón por **módulos de dominio** bajo `src/modules/<dominio>/`, cada uno con su propia separación interna:

```
components/   UI del módulo
hooks/        estado y orquestación del lado del cliente
services/     acceso a datos (Supabase) y lógica de negocio del cliente
repositories/ acceso de solo-lectura a fuentes externas (solo admin, server-only)
schemas/      validación con Zod
types/        tipos del dominio
utils/        funciones puras
```

Módulos: `auth`, `admin`, `ai`, `dashboard`, `knowledge`, `notes`, `openproject`, `projects`, `settings`, `speech`, `tickets`.

Piezas transversales:

- `src/proxy.ts` — proxy de Next 16 (reemplazo de `middleware.ts`): protege `/dashboard/*`, `/login`, `/verificar-email`, `/payment-required` según el estado de sesión/verificación/pago del usuario. Las rutas de `/api/**` no están cubiertas por el proxy porque cada Route Handler valida su propia sesión (y rol, en `/api/admin/*`) — ver `src/modules/openproject/services/route-helpers.ts` (`withOpenProject`) y `src/modules/admin/services/admin-route-helpers.ts` (`withAdminAuth`).
- `src/lib/env.ts` / `src/lib/env.public.ts` — única puerta a variables de entorno, validadas con Zod y separadas por dominio (server) o explícitamente públicas (cliente). No leer `process.env` directamente en otro lugar.
- `src/lib/logger.ts` — punto único de logging (hoy delega a `console`; preparado para enchufar Sentry/Better Stack sin tocar los call-sites).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Supabase** — Auth (OAuth Google + email/password) y Postgres (tabla `users`, RLS)
- **OpenProject** — vía API v3 (Basic Auth con API Key por usuario, nunca en el navegador)
- **Anthropic (Claude)** — análisis de notas de reunión y extracción de tickets
- **TanStack Query**, **React Hook Form + Zod**, **Tiptap** (editor de notas), **Tailwind CSS v4** + `shadcn`/`@base-ui/react`/`radix-ui`, **motion**, **three.js** (fondo decorativo)

## Requisitos

- Node.js 20+
- Un proyecto de [Supabase](https://supabase.com) (URL + claves)
- Acceso a una instancia de [OpenProject](https://www.openproject.org) con un token de API
- Una API Key de [Anthropic](https://console.anthropic.com)

## Variables de entorno

Ver `.env.example`. Todas se validan al arrancar (`src/lib/env.ts` / `src/lib/env.public.ts`) — si falta una, la app falla rápido en vez de comportarse de forma inconsistente.

| Variable                        | Dónde se usa       | Notas                                                                                       |
| ------------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Cliente y servidor | Pública                                                                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y servidor | Pública                                                                                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Servidor           | Nunca exponer al cliente                                                                    |
| `OPENPROJECT_BASE_URL`          | Servidor           | Solo la URL; la API Key de OpenProject es por usuario y vive en `users.openproject_api_key` |
| `ANTHROPIC_API_KEY`             | Servidor           | Una key para toda la app                                                                    |

## Instalación

```bash
npm install
cp .env.example .env   # y completar con tus credenciales
```

El esquema de base de datos vive en `supabase/migrations/` (SQL). Aplicarlo contra tu proyecto de Supabase desde el SQL Editor del dashboard, o con la Supabase CLI (`supabase link` + `supabase db push`).

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Calidad

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript, sin build completo
npm run build       # build de producción (incluye type-check)
```

## Producción

```bash
npm run build
npm run start
```

## Deploy en Vercel

El proyecto no requiere ninguna configuración adicional más allá de las variables de entorno:

1. Importar el repositorio en Vercel (autodetecta Next.js).
2. Configurar en el proyecto de Vercel (Settings → Environment Variables) las 5 variables de la tabla anterior.
3. Deploy. Vercel construye y sirve la app, incluidos los Route Handlers como Serverless/Edge Functions según corresponda.

No hay `vercel.json`: no hace falta, Vercel detecta build/output/Route Handlers automáticamente.

## Estructura del proyecto

```
src/
  app/            rutas (App Router), incluyendo Route Handlers bajo app/api/
  components/     UI compartida y de efectos visuales
  hooks/          hooks compartidos
  lib/            env, logger, utilidades transversales
  modules/        módulos de dominio (ver Arquitectura)
  proxy.ts        protección de rutas (Next 16)
supabase/
  migrations/     esquema SQL
scripts/
  migrate-v1-data.mjs   migración one-shot de datos de NoNameV1 (no se ejecuta en el build)
```

## Resolución de problemas frecuentes

- **La app no arranca / error de Zod al iniciar**: falta o está mal escrita alguna variable de entorno. Revisa `.env.example` y `src/lib/env.ts`.
- **`409` en el panel admin o al crear tickets**: el usuario no tiene una API Key de OpenProject configurada todavía (se guarda desde Configuración, no es una variable de entorno global).
- **Cambios en OpenProject tardan hasta 60s en verse en el panel admin**: es la caché corta de `withAdminAuth` (evita golpear OpenProject en cada carga); cambiar cualquier filtro fuerza una consulta fresca.
- **Un rango de fechas del Dashboard General muestra "No disponible temporalmente"**: bug conocido del lado del servidor de OpenProject en ciertos rangos que incluyen "hoy"; el resto de las tarjetas sigue funcionando (degradación aislada, no es un error de la app).
