"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Atom,
  Bell,
  Component,
  Copy,
  Database,
  Download,
  FileCode,
  FolderInput,
  FolderKanban,
  Globe,
  Inbox,
  LogOut,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  StickyNote,
  Ticket,
  Trash2,
  User,
} from "lucide-react";

import {
  ScrollProgress as ScrollProgressPrimitive,
  ScrollProgressProvider,
} from "@/components/animate-ui/primitives/animate/scroll-progress";
import { ElectricBorder } from "@/components/effects/electric-border";
import { GradualBlur } from "@/components/effects/gradual-blur";
import { LogoLoop, type LogoItem } from "@/components/effects/logo-loop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/shared/accordion";
import { AlertDialog } from "@/components/shared/alert-dialog";
import { AnimatedButton } from "@/components/shared/animated-button";
import { AnimatedCheckbox } from "@/components/shared/animated-checkbox";
import { AnimatedLoader } from "@/components/shared/animated-loader";
import { Avatar } from "@/components/shared/avatar";
import { DraggableSpring } from "@/components/shared/draggable-spring";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/shared/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { FileTree, type FileTreeNode } from "@/components/shared/file-tree";
import { FloatingActionButton } from "@/components/shared/floating-action-button";
import { FloatingPanel } from "@/components/shared/floating-panel";
import { FormField } from "@/components/shared/form-field";
import { GlassBadge } from "@/components/shared/glass-badge";
import { HoverLift } from "@/components/shared/hover-lift";
import { ImagePreview } from "@/components/shared/image-preview";
import { LoadingButton } from "@/components/shared/loading-button";
import { Modal } from "@/components/shared/modal";
import { NoteCard } from "@/components/shared/note-card";
import { PinnedList, type PinnedListEntry } from "@/components/shared/pinned-list";
import { ProjectCard } from "@/components/shared/project-card";
import { ScrollProgressBar } from "@/components/shared/scroll-progress";
import { SectionDivider } from "@/components/shared/section-divider";
import { SidebarGroup } from "@/components/shared/sidebar-group";
import { SidebarItem } from "@/components/shared/sidebar-item";
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from "@/components/shared/tabs";

import { NoteEditor } from "@/features/editor/note-editor";

const TOKEN_SWATCHES = [
  { label: "Background", className: "bg-background border-border border" },
  { label: "Foreground", className: "bg-foreground" },
  { label: "Primary", className: "bg-primary" },
  { label: "Secondary", className: "bg-secondary" },
  { label: "Muted", className: "bg-muted" },
  { label: "Accent", className: "bg-accent" },
  { label: "Border", className: "bg-border" },
  { label: "Destructive", className: "bg-destructive" },
  { label: "Success", className: "bg-success" },
];

const MOCK_PROJECTS: PinnedListEntry[] = [
  {
    id: "p1",
    title: "Migración Design System",
    description: "12 tickets abiertos",
    icon: <FolderKanban className="text-muted-foreground size-4" />,
  },
  {
    id: "p2",
    title: "Integración OpenProject",
    description: "4 tickets abiertos",
    icon: <FolderKanban className="text-muted-foreground size-4" />,
  },
  {
    id: "p3",
    title: "Notas de reunión IA",
    description: "8 notas",
    icon: <StickyNote className="text-muted-foreground size-4" />,
  },
];

const SIDEBAR_ITEMS = [
  { id: "inbox", label: "Bandeja", icon: <Inbox className="size-4" /> },
  { id: "projects", label: "Proyectos", icon: <FolderKanban className="size-4" /> },
  { id: "notes", label: "Notas", icon: <StickyNote className="size-4" /> },
  { id: "tickets", label: "Tickets", icon: <Ticket className="size-4" /> },
  { id: "settings", label: "Ajustes", icon: <Settings className="size-4" /> },
];

const FILE_TREE_DATA: FileTreeNode[] = [
  {
    type: "folder",
    id: "alpha",
    label: "Proyecto Alpha",
    children: [
      { type: "file", id: "alpha-kickoff", label: "Reunión inicial" },
      { type: "file", id: "alpha-ui", label: "Diseño UI" },
      {
        type: "folder",
        id: "alpha-backend",
        label: "Backend",
        children: [
          { type: "file", id: "alpha-api", label: "API" },
          { type: "file", id: "alpha-prisma", label: "Prisma" },
          { type: "file", id: "alpha-auth", label: "Auth" },
        ],
      },
      {
        type: "folder",
        id: "alpha-frontend",
        label: "Frontend",
        children: [
          { type: "file", id: "alpha-dashboard", label: "Dashboard" },
          { type: "file", id: "alpha-kanban", label: "Kanban" },
          { type: "file", id: "alpha-login", label: "Login" },
        ],
      },
    ],
  },
  {
    type: "folder",
    id: "beta",
    label: "Proyecto Beta",
    children: [
      { type: "file", id: "beta-doc", label: "Documento" },
      { type: "file", id: "beta-ideas", label: "Ideas" },
    ],
  },
  {
    type: "folder",
    id: "personal",
    label: "Proyecto Personal",
    children: [
      { type: "folder", id: "personal-finanzas", label: "Finanzas", children: [] },
      { type: "folder", id: "personal-viajes", label: "Viajes", children: [] },
      { type: "file", id: "personal-pendientes", label: "Pendientes" },
    ],
  },
];

const FILE_TREE_ANATOMY: [string, string][] = [
  [
    "Files",
    "Raíz del árbol; controla qué carpetas están abiertas (Accordion múltiple por debajo).",
  ],
  ["FolderItem", "Una carpeta individual — su value es el id que se abre/cierra."],
  ["FolderTrigger", "Área clicable que expande o colapsa la carpeta."],
  ["FolderContent", "Contenido colapsable: los archivos y subcarpetas dentro."],
  [
    "FolderHighlight / FileHighlight",
    "Resaltado animado al pasar el mouse (Highlight compartido).",
  ],
  ["File", "Archivo hoja — dispara la selección (fondo persistente, distinto del hover)."],
];

const TECH_LOGOS: LogoItem[] = [
  {
    node: (
      <span className="flex items-center gap-1.5">
        <Component className="size-4" />
        Next.js
      </span>
    ),
    title: "Next.js",
  },
  {
    node: (
      <span className="flex items-center gap-1.5">
        <Atom className="size-4" />
        React
      </span>
    ),
    title: "React",
  },
  {
    node: (
      <span className="flex items-center gap-1.5">
        <Database className="size-4" />
        Prisma
      </span>
    ),
    title: "Prisma",
  },
  {
    node: (
      <span className="flex items-center gap-1.5">
        <Palette className="size-4" />
        Tailwind CSS
      </span>
    ),
    title: "Tailwind CSS",
  },
  {
    node: (
      <span className="flex items-center gap-1.5">
        <FileCode className="size-4" />
        TypeScript
      </span>
    ),
    title: "TypeScript",
  },
  {
    node: (
      <span className="flex items-center gap-1.5">
        <FolderKanban className="size-4" />
        OpenProject
      </span>
    ),
    title: "OpenProject",
  },
  {
    node: (
      <span className="flex items-center gap-1.5">
        <Sparkles className="size-4" />
        Claude
      </span>
    ),
    title: "Claude",
  },
];

const demoFormSchema = z.object({
  name: z.string().min(2, "Muy corto"),
  email: z.string().email("Email inválido"),
  role: z.string().min(1, "Selecciona un rol"),
  notes: z.string().optional(),
  notify: z.boolean(),
});

type DemoFormValues = z.infer<typeof demoFormSchema>;

type CatalogEntry = {
  name: string;
  description: string;
  status?: "Listo para producción" | "Arquitectura lista";
  when: string;
  useCases: string[];
  demo: React.ReactNode;
};

function ComponentEntry({
  name,
  description,
  status = "Listo para producción",
  when,
  useCases,
  demo,
}: CatalogEntry) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex flex-col gap-1">
          <CardTitle>{name}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge
          variant={status === "Listo para producción" ? "secondary" : "outline"}
          className="shrink-0"
        >
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">Cuándo usarlo — </span>
          {when}
        </p>
        <div className="bg-background/60 border-border/60 flex flex-wrap items-center gap-3 rounded-lg border p-4">
          {demo}
        </div>
        <Accordion type="single" collapsible>
          <AccordionItem value="use-cases">
            <AccordionTrigger>Casos de uso en NoName V2</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc space-y-1 pl-4">
                {useCases.map((useCase) => (
                  <li key={useCase}>{useCase}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function GlobalScrollProgressDemo() {
  return (
    <ScrollProgressProvider global>
      <div className="bg-border/40 fixed inset-x-0 top-0 z-[60] h-0.5">
        <ScrollProgressPrimitive className="bg-foreground h-0.5" />
      </div>
      <p className="text-muted-foreground text-sm">
        Activo ahora mismo: mira la línea superior de toda la ventana mientras haces scroll en{" "}
        <span className="text-foreground">esta página</span> — así se ve el modo{" "}
        <code className="text-foreground">global</code> (sigue el documento completo, no un
        contenedor).
      </p>
    </ScrollProgressProvider>
  );
}

function CheckboxSettingsDemo() {
  const [state, setState] = React.useState({
    remember: true,
    dark: false,
    notifications: true,
    backups: false,
  });

  const rows: { key: keyof typeof state; label: string }[] = [
    { key: "remember", label: "Recordarme" },
    { key: "dark", label: "Modo oscuro" },
    { key: "notifications", label: "Notificaciones" },
    { key: "backups", label: "Copias de seguridad" },
  ];

  const values = rows.map((row) => state[row.key]);
  const allChecked = values.every(Boolean);
  const noneChecked = values.every((value) => !value);
  const parentState: boolean | "indeterminate" = allChecked
    ? true
    : noneChecked
      ? false
      : "indeterminate";

  function toggleAll(next: boolean | "indeterminate") {
    const value = next === true;
    setState({ remember: value, dark: value, notifications: value, backups: value });
  }

  return (
    <Card className="w-full max-w-xs p-4">
      <div className="flex items-center gap-2 pb-3">
        <AnimatedCheckbox checked={parentState} onCheckedChange={toggleAll} id="select-all" />
        <label htmlFor="select-all" className="text-sm font-medium">
          Configuración del usuario
        </label>
      </div>
      <div className="border-border/60 flex flex-col gap-2.5 border-t pt-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2">
            <AnimatedCheckbox
              checked={state[row.key]}
              onCheckedChange={(next) =>
                setState((prev) => ({ ...prev, [row.key]: next === true }))
              }
              id={row.key}
            />
            <label htmlFor={row.key} className="text-muted-foreground text-sm">
              {row.label}
            </label>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Home() {
  const [pinnedIds, setPinnedIds] = React.useState<string[]>(["p1"]);
  const [activeSidebarId, setActiveSidebarId] = React.useState("projects");
  const [loading, setLoading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<string>("alpha-api");

  const form = useForm<DemoFormValues>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: { name: "", email: "", role: "", notes: "", notify: true },
  });

  function handleSubmit(values: DemoFormValues) {
    toast.success("Formulario enviado", { description: values.name });
  }

  function handleLoadingDemo() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1800);
  }

  const CATEGORIES: { value: string; label: string; entries: CatalogEntry[] }[] = [
    {
      value: "inputs",
      label: "Inputs",
      entries: [
        {
          name: "Form Field",
          description: "Label + control + descripción + error, unificado sobre ui/form.tsx.",
          when: "Para cualquier campo dentro de un formulario con react-hook-form — nunca reimplementes label+error a mano.",
          useCases: [
            "Formulario de creación de proyecto/ticket",
            "Configuración (General, API, OpenProject, IA)",
            "Cualquier formulario de la app — un solo patrón de validación",
          ],
          demo: (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex w-full max-w-sm flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  label="Nombre"
                  placeholder="Ada Lovelace"
                />
                <FormField
                  control={form.control}
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="ada@nonamev2.dev"
                />
                <FormField
                  control={form.control}
                  name="role"
                  type="select"
                  label="Rol"
                  placeholder="Selecciona un rol"
                  options={[
                    { value: "admin", label: "Administrador" },
                    { value: "editor", label: "Editor" },
                    { value: "viewer", label: "Lector" },
                  ]}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  type="textarea"
                  label="Notas"
                  placeholder="Contexto adicional…"
                />
                <FormField
                  control={form.control}
                  name="notify"
                  type="switch"
                  label="Notificarme por email"
                />
                <Button type="submit" className="w-fit">
                  Enviar
                </Button>
              </form>
            </Form>
          ),
        },
        {
          name: "Checkbox (animado)",
          description:
            "Trazo de check/indeterminate dibujado a mano (path animation), sobre Radix.",
          when: "Para listas de opciones standalone fuera de un formulario — ajustes, preferencias, selección múltiple en una lista. Dentro de un <FormField> se sigue usando el checkbox base (ui/checkbox.tsx).",
          useCases: [
            "Configuración del usuario (esta demo)",
            "Selección múltiple en listas de notas/tickets",
          ],
          demo: <CheckboxSettingsDemo />,
        },
      ],
    },
    {
      value: "navegacion",
      label: "Navegación",
      entries: [
        {
          name: "Sidebar",
          description: "SidebarGroup + SidebarItem con indicador de selección animado (layoutId).",
          when: "Para la navegación principal persistente de la app, no para menús contextuales puntuales (usa Dropdown Menu para eso).",
          useCases: [
            "Navegación principal de la app (Bandeja, Proyectos, Notas, Tickets, Ajustes)",
            "Con `asChild` puede volverse <Link> cuando exista routing real",
          ],
          demo: (
            <Card className="w-full max-w-xs p-2">
              <SidebarGroup label="Espacio de trabajo">
                {SIDEBAR_ITEMS.map((item) => (
                  <SidebarItem
                    key={item.id}
                    icon={item.icon}
                    active={activeSidebarId === item.id}
                    onClick={() => setActiveSidebarId(item.id)}
                  >
                    {item.label}
                  </SidebarItem>
                ))}
              </SidebarGroup>
            </Card>
          ),
        },
        {
          name: "Dropdown Menu",
          description: "Radix + animate-ui, con highlight deslizante y soporte de submenús.",
          when: "El menú por defecto para cualquier acción secundaria (perfil, acciones de fila). Usa Context Menu solo para el clic derecho.",
          useCases: [
            "Botón de usuario: perfil, configuración, tema (submenú), idioma, cerrar sesión",
            "Acciones de un proyecto: duplicar, exportar, mover, renombrar, eliminar",
          ],
          demo: (
            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Avatar fallback="AL" className="size-5" />
                    Ada Lovelace
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <User />
                      Perfil
                      <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings />
                      Configuración
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Palette />
                        Tema
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>Claro</DropdownMenuItem>
                        <DropdownMenuItem>Oscuro</DropdownMenuItem>
                        <DropdownMenuItem>Sistema</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem>
                      <Globe />
                      Idioma
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <LogOut />
                    Cerrar sesión
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Acciones del proyecto">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Copy />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download />
                    Exportar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FolderInput />
                    Mover
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pencil />
                    Renombrar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <Trash2 />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
        },
        {
          name: "Context Menu",
          description: "Menú de clic derecho, mismo lenguaje visual que Dropdown Menu.",
          when: "Solo para acciones invocadas con clic derecho sobre un elemento (fila de lista, sidebar); para botones usa Dropdown Menu.",
          useCases: ["Clic derecho sobre una nota/proyecto en una lista o el sidebar"],
          demo: (
            <ContextMenu>
              <ContextMenuTrigger
                render={
                  <div className="border-border text-muted-foreground flex h-9 items-center rounded-lg border border-dashed px-3 text-sm">
                    Clic derecho aquí
                  </div>
                }
              />
              <ContextMenuContent>
                <ContextMenuItem>Fijar</ContextMenuItem>
                <ContextMenuItem>Renombrar</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ),
        },
        {
          name: "Tabs",
          description:
            "Animate Tabs con highlight deslizante (spring). Reemplaza cualquier implementación de pestañas — esta misma galería las usa para agrupar categorías.",
          when: "Para agrupar vistas relacionadas dentro de una misma pantalla (nunca pestañas HTML/CSS a mano).",
          useCases: [
            "Configuración → General / Encargados / API / OpenProject / IA",
            "Proyecto → Información / Notas / Estadísticas",
            "Vista futura → Tickets / Historial / Actividad",
          ],
          demo: (
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
                <TabsTrigger value="notas">Notas</TabsTrigger>
                <TabsTrigger value="configuracion">Configuración</TabsTrigger>
              </TabsList>
              <TabsContents>
                <TabsContent value="dashboard" className="grid grid-cols-3 gap-2">
                  <Card className="p-3">
                    <p className="text-muted-foreground text-xs">Tickets abiertos</p>
                    <p className="text-xl font-semibold">24</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-muted-foreground text-xs">Proyectos activos</p>
                    <p className="text-xl font-semibold">3</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-muted-foreground text-xs">Notas esta semana</p>
                    <p className="text-xl font-semibold">9</p>
                  </Card>
                </TabsContent>
                <TabsContent value="proyectos" className="flex flex-col gap-2">
                  {MOCK_PROJECTS.map((project) => (
                    <div key={project.id} className="flex items-center gap-2 text-sm">
                      <FolderKanban className="text-muted-foreground size-4" />
                      {project.title}
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="notas" className="text-muted-foreground text-sm">
                  &quot;Reunión kickoff — rediseño UI&quot;, actualizada hace 2 horas.
                </TabsContent>
                <TabsContent
                  value="configuracion"
                  className="flex items-center justify-between text-sm"
                >
                  <span>Modo oscuro</span>
                  <Switch defaultChecked disabled />
                </TabsContent>
              </TabsContents>
            </Tabs>
          ),
        },
        {
          name: "Accordion",
          description:
            'Sobre Radix + animate-ui, con máscara de recorte al abrir/cerrar. Esta misma galería lo usa para los "Casos de uso" de cada componente.',
          when: "Para contenido opcional/secundario que no necesita estar visible siempre — preguntas frecuentes, detalles expandibles, configuración avanzada.",
          useCases: [
            "Preguntas frecuentes del sistema (esta demo)",
            "Información del proyecto / detalle del ticket",
            "Documentación, ayuda, panel de IA",
          ],
          demo: (
            <Accordion type="single" collapsible className="w-full max-w-md">
              <AccordionItem value="q1">
                <AccordionTrigger>¿Cómo se generan los tickets desde una nota?</AccordionTrigger>
                <AccordionContent>
                  La IA analiza el contenido de la nota y propone tickets; cada uno se puede editar
                  antes de enviarlo a OpenProject.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>¿Los cambios se sincronizan automáticamente?</AccordionTrigger>
                <AccordionContent>
                  Sí, cada actualización de estado se refleja en OpenProject en segundos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>¿Puedo usar NoName V2 sin conexión?</AccordionTrigger>
                <AccordionContent>
                  Las notas se guardan localmente y se sincronizan al recuperar conexión.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ),
        },
      ],
    },
    {
      value: "feedback",
      label: "Feedback",
      entries: [
        {
          name: "Motion Grid / Animated Loader",
          description:
            "Barrido diagonal sobre una grilla — reemplazo directo de cualquier spinner.",
          when: "En cualquier estado de espera con feedback visual — nunca un spinner tradicional en esta app.",
          useCases: ["Creando ticket", "IA pensando", "Guardando", "Sincronizando con OpenProject"],
          demo: (
            <div className="flex flex-wrap gap-6">
              <AnimatedLoader size="sm" label="Creando ticket" />
              <AnimatedLoader size="sm" label="IA pensando" />
              <AnimatedLoader size="sm" label="Guardando" />
              <AnimatedLoader size="sm" label="Sincronizando" />
            </div>
          ),
        },
        {
          name: "Loading Button",
          description: "Botón que reemplaza su contenido por AnimatedLoader mientras carga.",
          when: "En cualquier botón que dispare una acción con espera de red — evita el parpadeo de deshabilitar sin feedback.",
          useCases: ["Guardar cambios", "Crear ticket", "Cualquier acción con espera de red"],
          demo: (
            <LoadingButton loading={loading} onClick={handleLoadingDemo}>
              Guardar cambios
            </LoadingButton>
          ),
        },
        {
          name: "Scroll Progress",
          description: "Barra discreta que indica cuánto se ha recorrido un contenido largo.",
          when: "Cuando el contenido puede exceder el alto/ancho visible y quieres dar orientación sin ocupar espacio permanente — editor, documentación, paneles largos.",
          useCases: [
            "Editor de notas (pestaña “En el editor”, integración real)",
            "Documentación",
            "Vistas largas y paneles de configuración (arquitectura lista, mismo componente)",
          ],
          demo: (
            <Tabs defaultValue="vertical" className="w-full">
              <TabsList>
                <TabsTrigger value="vertical">Vertical</TabsTrigger>
                <TabsTrigger value="horizontal">Horizontal</TabsTrigger>
                <TabsTrigger value="global">Global</TabsTrigger>
                <TabsTrigger value="editor">En el editor</TabsTrigger>
              </TabsList>
              <TabsContents>
                <TabsContent value="vertical">
                  <ScrollProgressBar containerClassName="h-40 px-4 py-3">
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <p key={i} className="text-muted-foreground text-sm">
                          Línea de contenido {i + 1} — sigue desplazándote para ver el progreso.
                        </p>
                      ))}
                    </div>
                  </ScrollProgressBar>
                </TabsContent>
                <TabsContent value="horizontal">
                  <ScrollProgressBar direction="horizontal" containerClassName="h-32 px-4 py-3">
                    <div className="flex h-full items-center gap-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-muted text-muted-foreground flex h-20 w-28 shrink-0 items-center justify-center rounded-lg text-sm"
                        >
                          Bloque {i + 1}
                        </div>
                      ))}
                    </div>
                  </ScrollProgressBar>
                </TabsContent>
                <TabsContent value="global">
                  <GlobalScrollProgressDemo />
                </TabsContent>
                <TabsContent value="editor">
                  <NoteEditor className="w-full" />
                </TabsContent>
              </TabsContents>
            </Tabs>
          ),
        },
        {
          name: "Toast (Sonner)",
          description: "Notificaciones no bloqueantes, tema sincronizado con el Design System.",
          when: "Para confirmar que una acción terminó sin interrumpir el flujo del usuario con un modal.",
          useCases: ["Confirmaciones de guardado", "Errores de sincronización con OpenProject"],
          demo: (
            <Button variant="outline" onClick={() => toast("Sincronización completa")}>
              Mostrar toast
            </Button>
          ),
        },
        {
          name: "Empty State",
          description: "Icono + texto + acción opcional para colecciones vacías.",
          when: "Cuando una lista/colección no tiene elementos todavía — nunca dejar un espacio en blanco sin explicación.",
          useCases: ["Sin tickets todavía", "Sin notas en un proyecto", "Bandeja vacía"],
          demo: (
            <EmptyState
              icon={Ticket}
              title="Sin tickets todavía"
              description="Los tickets generados desde tus notas aparecerán aquí."
              action={
                <Button size="sm" variant="outline">
                  <Plus />
                  Crear ticket
                </Button>
              }
            />
          ),
        },
        {
          name: "Skeleton & Scroll Area",
          description: "Placeholders de carga y contenedor con scrollbar propia.",
          when: "Skeleton mientras se resuelve una petición inicial; Scroll Area para contenido largo dentro de un contenedor de tamaño fijo (modal, popover).",
          useCases: ["Carga inicial de listas", "Paneles largos dentro de un modal/popover"],
          demo: (
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
              </div>
              <ScrollArea className="h-24 w-56 rounded-lg border">
                <div className="flex flex-col gap-1 p-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <p key={i} className="text-muted-foreground text-xs">
                      Elemento de lista {i + 1}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ),
        },
      ],
    },
    {
      value: "animaciones",
      label: "Animaciones",
      entries: [
        {
          name: "Cursor",
          description:
            "Cursor global (punto + halo) montado en Providers. Crece sobre botones, links, inputs.",
          when: "No se invoca por pantalla: vive una sola vez en providers.tsx y aplica a toda la app automáticamente.",
          useCases: ["Toda la app — no es un efecto aislado, vive en providers.tsx"],
          demo: (
            <p className="text-muted-foreground text-sm">
              Pasa el cursor sobre cualquier botón de esta página para verlo reaccionar.
            </p>
          ),
        },
        {
          name: "Spring",
          description: "Arrastre con retorno elástico (drag + snap-back), no un easing genérico.",
          when: "SpringProvider guarda el punto de anclaje y calcula el resorte; SpringElement es el elemento que se arrastra (drag + snap-back al soltar); Spring dibuja opcionalmente el hilo elástico (SVG) entre ambos. shared/draggable-spring.tsx los combina en un solo wrapper — úsalo con moderación, solo donde un gesto físico aporte.",
          useCases: [
            "Avatar del usuario",
            "Preview de imágenes insertadas en una nota",
            "Tarjetas, logos o iconos flotantes",
          ],
          demo: (
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <Avatar draggable fallback="AL" />
                <span className="text-muted-foreground text-xs">Avatar</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <DraggableSpring showCord>
                  <Card className="flex w-28 items-center justify-center p-4 text-xs">Tarjeta</Card>
                </DraggableSpring>
                <span className="text-muted-foreground text-xs">Tarjeta (con hilo)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <DraggableSpring>
                  <div className="bg-foreground text-background font-heading flex size-12 items-center justify-center rounded-2xl text-lg font-semibold">
                    N
                  </div>
                </DraggableSpring>
                <span className="text-muted-foreground text-xs">Logo</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <DraggableSpring>
                  <button
                    type="button"
                    className="bg-muted flex size-10 items-center justify-center rounded-full"
                    aria-label="Icono arrastrable"
                  >
                    <Sparkles className="size-4" />
                  </button>
                </DraggableSpring>
                <span className="text-muted-foreground text-xs">Icono</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ImagePreview
                  draggable
                  alt="Preview arrastrable"
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='64'%3E%3Crect width='96' height='64' fill='%23232326'/%3E%3C/svg%3E"
                  className="size-16 object-cover"
                />
                <span className="text-muted-foreground text-xs">Imagen</span>
              </div>
            </div>
          ),
        },
        {
          name: "Slot",
          description:
            "Polimorfismo (asChild) de animate-ui: aplica motion sobre el hijo real sin envolver en un div extra.",
          when: "Cuando un componente necesita a veces ser un <button> y a veces un <a>/<Link> — sin duplicar su implementación para cada caso.",
          useCases: [
            "AnimatedButton (motion directo sobre ui/button.tsx, sin wrapper)",
            "HoverLift compartido entre ProjectCard y NoteCard",
            "SidebarItem `asChild` para volverse <Link>",
          ],
          demo: (
            <div className="flex flex-wrap items-center gap-6">
              <AnimatedButton>Animated Button</AnimatedButton>
              <HoverLift asChild>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="border-border bg-card block rounded-lg border px-4 py-2 text-sm"
                >
                  Card-link con HoverLift (asChild)
                </a>
              </HoverLift>
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">
                  Mismo SidebarItem, dos elementos distintos:
                </span>
                <div className="flex gap-2">
                  <SidebarItem icon={<FolderKanban className="size-4" />} active className="w-auto">
                    Botón
                  </SidebarItem>
                  <SidebarItem asChild active className="w-auto">
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      <FolderKanban className="size-4" />
                      Link
                    </a>
                  </SidebarItem>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      value: "overlays",
      label: "Overlays",
      entries: [
        {
          name: "Modal",
          description: "Base única para todos los modales: mismo header, footer y motion.",
          when: "Para formularios y contenido que el usuario puede cerrar sin consecuencias (clic fuera, Escape).",
          useCases: [
            "Crear/editar proyecto",
            "Confirmaciones no destructivas",
            "Cualquier diálogo de la app",
          ],
          demo: (
            <Modal
              title="Nuevo proyecto"
              description="Todos los modales de la app comparten esta misma base."
              trigger={
                <Button>
                  <Plus />
                  Nuevo proyecto
                </Button>
              }
              footer={
                <>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Crear</Button>
                </>
              }
            >
              <p className="text-muted-foreground text-sm">
                Contenido del modal — reutiliza ui/dialog.tsx.
              </p>
            </Modal>
          ),
        },
        {
          name: "Alert Dialog",
          description:
            "Confirmación crítica: no cierra al hacer clic fuera, siempre exige una decisión.",
          when: "En vez de Modal, cuando la acción es destructiva o irreversible y necesitas forzar Cancelar/Continuar en lugar de un formulario normal.",
          useCases: ["Eliminar proyecto", "Eliminar nota", "Cerrar sesión", "Eliminar usuario"],
          demo: (
            <div className="flex flex-wrap gap-3">
              <AlertDialog
                title="¿Eliminar este proyecto?"
                description="Se eliminarán también sus notas y tickets vinculados. Esta acción no se puede deshacer."
                trigger={<Button variant="destructive">Eliminar proyecto</Button>}
                actionLabel="Eliminar proyecto"
                destructive
                onConfirm={() => toast.success("Proyecto eliminado")}
              />
              <AlertDialog
                title="¿Eliminar esta nota?"
                description="La nota y su historial se perderán permanentemente."
                trigger={<Button variant="outline">Eliminar nota</Button>}
                actionLabel="Eliminar nota"
                destructive
                onConfirm={() => toast.success("Nota eliminada")}
              />
              <AlertDialog
                title="¿Cerrar sesión?"
                description="Tendrás que volver a iniciar sesión para acceder a tus proyectos."
                trigger={<Button variant="outline">Cerrar sesión</Button>}
                actionLabel="Cerrar sesión"
                onConfirm={() => toast("Sesión cerrada")}
              />
              <AlertDialog
                title="¿Eliminar este usuario?"
                description="Perderá acceso a todos los proyectos compartidos con él."
                trigger={<Button variant="destructive">Eliminar usuario</Button>}
                actionLabel="Eliminar usuario"
                destructive
                onConfirm={() => toast.success("Usuario eliminado")}
              />
            </div>
          ),
        },
        {
          name: "Tooltip",
          description: "Ayuda contextual breve sobre elementos interactivos.",
          when: "Para aclarar un icono sin etiqueta o un atajo — nunca para contenido esencial (no todos lo verán).",
          useCases: ["Explicar iconos sin etiqueta", "Atajos de teclado"],
          demo: (
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost">Tooltip</Button>} />
              <TooltipContent>Texto de ayuda contextual</TooltipContent>
            </Tooltip>
          ),
        },
        {
          name: "Floating Panel",
          description: "Superficie glass elevada sobre ui/popover.tsx.",
          when: "Para paneles contextuales cortos anclados a un trigger — no para formularios largos (usa Modal).",
          useCases: ["Selector rápido de estado de un ticket", "Panel de filtros"],
          demo: (
            <FloatingPanel trigger={<Button variant="outline">Floating Panel</Button>}>
              <p className="text-sm font-medium">Panel flotante</p>
              <p className="text-muted-foreground text-xs">
                Superficie glass para paneles contextuales.
              </p>
            </FloatingPanel>
          ),
        },
        {
          name: "Floating Action Button",
          description: "Acción flotante circular; opcionalmente arrastrable (Spring).",
          when: "Para la acción principal de una vista larga donde conviene un atajo siempre visible.",
          useCases: ["Nueva nota rápida", "Acción principal de una vista larga"],
          demo: (
            <FloatingActionButton draggable aria-label="Nueva nota">
              <Plus />
            </FloatingActionButton>
          ),
        },
      ],
    },
    {
      value: "contenido",
      label: "Contenido",
      entries: [
        {
          name: "Badges",
          description: "Estados y etiquetas — incluye variante glass translúcida.",
          when: "Para comunicar estado/prioridad de un vistazo, nunca como botón (no son interactivas).",
          useCases: [
            "Prioridad de un ticket",
            "Estado de un proyecto",
            "Etiquetas sobre imágenes/cards",
          ],
          demo: (
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Primario</Badge>
              <Badge variant="secondary">Secundario</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructivo</Badge>
              <GlassBadge>Glass</GlassBadge>
            </div>
          ),
        },
        {
          name: "Avatar",
          description: "Con fallback de iniciales; arrastrable opcionalmente vía Spring.",
          when: "Para representar usuarios/encargados; usa `draggable` solo en superficies donde el gesto tenga sentido (perfil), no en listas densas.",
          useCases: ["Usuario actual en la barra superior", "Encargados de un proyecto/ticket"],
          demo: (
            <div className="flex items-center gap-3">
              <Avatar fallback="AL" />
              <Avatar fallback="BP" src={undefined} />
            </div>
          ),
        },
      ],
    },
    {
      value: "listas",
      label: "Listas",
      entries: [
        {
          name: "Pinned List",
          description:
            "Fijar/reordenar con layout animations. Arquitectura lista para proyectos y notas.",
          status: "Arquitectura lista",
          when: "Para colecciones donde el usuario quiere priorizar manualmente algunos elementos por encima del orden natural.",
          useCases: ["Lista de proyectos fijados", "Notas fijadas", "Priorización manual futura"],
          demo: (
            <PinnedList
              items={MOCK_PROJECTS}
              pinnedIds={pinnedIds}
              onTogglePin={(id) =>
                setPinnedIds((prev) =>
                  prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
                )
              }
              className="w-full"
            />
          ),
        },
        {
          name: "Project Card / Note Card",
          description: "Comparten la misma animación de hover (HoverLift) para no duplicar motion.",
          when: "Para grids donde cada elemento es un destino navegable (clic abre el proyecto/nota).",
          useCases: ["Grid de proyectos", "Grid de notas recientes"],
          demo: (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
              <ProjectCard title="Migración Design System" description="Sprint activo · 12 tickets">
                <div className="flex gap-1.5">
                  <Badge variant="secondary">En progreso</Badge>
                  <GlassBadge>Prioridad alta</GlassBadge>
                </div>
              </ProjectCard>
              <NoteCard
                title="Reunión kickoff — rediseño UI"
                excerpt="Definimos alcance del design system: tema, cursor global, motion grid y pinned list."
                updatedAt="Hace 2 horas"
              />
            </div>
          ),
        },
      ],
    },
    {
      value: "archivos",
      label: "Archivos",
      entries: [
        {
          name: "Files",
          description:
            "Explorador jerárquico: carpetas expandibles con líneas guía, iconos dinámicos y resaltado al pasar el mouse y al seleccionar.",
          when: "Uno de los componentes principales de NoName V2: representa la jerarquía real de proyectos → subcarpetas → notas, tanto en el sidebar como en vistas de exploración.",
          useCases: [
            "Árbol de proyectos y notas en el sidebar",
            "Explorador de subcarpetas dentro de un proyecto (Backend/Frontend, etc.)",
            "Selector de destino al mover una nota/ticket",
          ],
          demo: (
            <div className="flex w-full flex-col gap-4">
              <FileTree
                data={FILE_TREE_DATA}
                defaultOpen={["alpha", "alpha-backend"]}
                selectedId={selectedFile}
                onSelect={setSelectedFile}
                className="bg-card w-full max-w-sm rounded-lg border"
              />
              <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                {FILE_TREE_ANATOMY.map(([term, def]) => (
                  <p key={term}>
                    <span className="text-foreground font-medium">{term}</span>{" "}
                    <span className="text-muted-foreground">— {def}</span>
                  </p>
                ))}
              </div>
            </div>
          ),
        },
      ],
    },
    {
      value: "efectos",
      label: "Efectos",
      entries: [
        {
          name: "Gradual Blur",
          description:
            "Overlay de blur progresivo en un borde — desenfoca el contenido antes de que salga del viewport.",
          when: "En vistas con scroll donde quieras insinuar que hay más contenido debajo/al lado sin un borde duro — listas largas, hero de landing, paneles.",
          useCases: [
            "Transición suave al final de una lista larga de notas/tickets",
            "Efecto de scroll en una futura página de aterrizaje (landing)",
            "Bordes de paneles con overflow (sidebar, feed)",
          ],
          demo: (
            <div
              style={{ position: "relative", height: 220, width: "100%", overflow: "hidden" }}
              className="rounded-lg border"
            >
              <div style={{ height: "100%", overflowY: "auto" }} className="px-4 py-3">
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <p key={i} className="text-muted-foreground text-sm">
                      Contenido de ejemplo {i + 1} — desplázate para ver cómo se desvanece antes de
                      salir.
                    </p>
                  ))}
                </div>
              </div>
              <GradualBlur
                target="parent"
                position="bottom"
                height="4.5rem"
                strength={2}
                divCount={5}
                curve="bezier"
                exponential
                opacity={1}
              />
            </div>
          ),
        },
        {
          name: "Electric Border",
          description:
            'Borde animado con textura de "descarga eléctrica" sobre canvas, para destacar una tarjeta.',
          when: 'Para UN elemento que quieras que destaque de verdad (tarjeta destacada, plan recomendado, "la IA está trabajando") — no lo uses en más de un lugar visible a la vez.',
          useCases: [
            "Tarjeta de proyecto destacado en el dashboard",
            "Plan/feature recomendado en una futura pantalla de precios",
            "Resaltar visualmente que la IA está generando algo sobre una tarjeta",
          ],
          demo: (
            <ElectricBorder color="#f4f4f5" speed={1} chaos={0.12} borderRadius={16}>
              <div className="bg-card w-64 rounded-2xl p-5">
                <p className="text-sm font-medium">Componente destacado</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Envuelve cualquier tarjeta para darle un borde animado.
                </p>
              </div>
            </ElectricBorder>
          ),
        },
        {
          name: "Logo Loop",
          description:
            "Carrusel infinito de logos con velocidad configurable y fundido en los bordes.",
          when: "Para mostrar un stack tecnológico, integraciones o marcas de forma continua y elegante — sin flechas ni paginación.",
          useCases: [
            "Stack tecnológico de NoName V2 (esta demo)",
            "Integraciones disponibles (OpenProject, Claude, futuras)",
            "Logos de clientes/partners en una futura landing",
          ],
          demo: (
            <div className="h-16 w-full">
              <LogoLoop
                logos={TECH_LOGOS}
                speed={60}
                direction="left"
                logoHeight={20}
                gap={40}
                hoverSpeed={10}
                fadeOut
                ariaLabel="Stack tecnológico de NoName V2"
              />
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit gap-1.5">
          <Sparkles className="size-3" />
          Design System / Playground
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">NoName</h1>
        <p className="text-muted-foreground max-w-lg text-sm">
          Laboratorio de componentes reutilizables: base shadcn/ui en{" "}
          <code className="text-foreground">src/components/ui</code>, composiciones con motion en{" "}
          <code className="text-foreground">src/components/shared</code>. Pasa el cursor sobre
          cualquier elemento interactivo para ver el cursor animado global.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <SectionDivider label="Fundamentos" />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {TOKEN_SWATCHES.map((swatch) => (
            <div key={swatch.label} className="flex flex-col gap-1.5">
              <div className={`h-12 rounded-lg ${swatch.className}`} />
              <span className="text-muted-foreground text-xs">{swatch.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionDivider label="Botones" />
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Danger</Button>
          <Button variant="link">Link</Button>
          <Button size="icon" variant="outline">
            <Bell />
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionDivider label="Galería de componentes" />
        <Tabs defaultValue={CATEGORIES[0].value}>
          <TabsList className="w-full sm:w-fit">
            {CATEGORIES.map((category) => (
              <TabsTrigger key={category.value} value={category.value}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContents>
            {CATEGORIES.map((category) => (
              <TabsContent
                key={category.value}
                value={category.value}
                className="flex flex-col gap-4"
              >
                {category.entries.map((entry) => (
                  <ComponentEntry key={entry.name} {...entry} />
                ))}
              </TabsContent>
            ))}
          </TabsContents>
        </Tabs>
      </section>

      <footer className="text-muted-foreground border-t pt-6 text-xs">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Organización</CardTitle>
            <CardDescription>
              <code className="text-foreground">src/components/ui</code> — primitivas
              shadcn/base-ui. <code className="text-foreground">src/components/animate-ui</code> —
              primitivos headless de Animate UI (cursor, motion grid, pinned list, scroll progress,
              spring, tabs, accordion, slot, alert dialog, checkbox, dropdown menu, files), sin
              adaptar visualmente todavía.{" "}
              <code className="text-foreground">src/components/shared</code> — la capa que sí se
              adapta a la identidad visual del proyecto y compone ambas anteriores.{" "}
              <code className="text-foreground">src/features/editor</code> — shell presentacional
              del editor de notas (sin persistencia), aloja Scroll Progress de forma real.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Todos los colores provienen de los tokens definidos en{" "}
            <code className="text-foreground">globals.css</code>.
          </CardContent>
        </Card>
      </footer>
    </main>
  );
}
