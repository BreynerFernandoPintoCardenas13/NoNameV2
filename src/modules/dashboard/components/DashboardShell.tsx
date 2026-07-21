"use client";

import { ChartColumnBig, PanelLeftClose, PanelLeftOpen, Plus, Settings } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/modules/auth/components/SignOutButton";
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser";
import { ROLES } from "@/modules/auth/types";
import { ProjectModal } from "@/modules/projects/components/ProjectModal";
import { ProjectsTree } from "@/modules/projects/components/ProjectsTree";
import type { LocalProject } from "@/modules/projects/types";
import { SettingsDialog } from "@/modules/settings/components/SettingsDialog";

/**
 * Shell del dashboard: sidebar colapsable (árbol proyecto→notas, crear
 * proyecto, configuración) + área principal. Réplica funcional de la
 * sidebar de V1 sobre el design system de V2.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [projectModalOpen, setProjectModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<LocalProject | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [activeProject, setActiveProject] = React.useState<LocalProject | null>(null);
  const { data: currentUser } = useCurrentUser();
  // Ocultar el ítem para otros roles es solo cortesía de UX: la barrera real
  // vive en app/dashboard/admin/page.tsx, del lado del servidor.
  const isAdmin = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.SUPERADMIN;

  const openCreate = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };
  const openEdit = (project: LocalProject) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  return (
    <div className="bg-background text-foreground flex h-dvh overflow-hidden">
      <aside
        className={cn(
          "border-border/60 flex shrink-0 flex-col border-r transition-[width] duration-200",
          collapsed ? "w-12" : "w-64",
        )}
        aria-label="Navegación de proyectos"
      >
        <div className="flex items-center gap-1 px-2 py-2.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-sm font-semibold tracking-tight">NoName</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Configuración"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings />
              </Button>
            </>
          )}
        </div>

        {!collapsed && (
          <>
            <div className="flex flex-col gap-2 px-3 pb-2">
              <Button variant="outline" size="sm" className="w-full" onClick={openCreate}>
                <Plus /> Crear proyecto
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  nativeButton={false}
                  render={<a href="/dashboard/admin" target="_blank" rel="noopener noreferrer" />}
                >
                  <ChartColumnBig /> Panel Administrador
                </Button>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto pb-2" aria-label="Proyectos">
              <ProjectsTree onEditProject={openEdit} onActiveProjectChange={setActiveProject} />
            </nav>

            <div className="border-border/60 border-t px-4 py-3">
              <SignOutButton className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline" />
            </div>
          </>
        )}
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>

      <ProjectModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        project={editingProject}
        onOpenSettings={() => {
          setProjectModalOpen(false);
          setSettingsOpen(true);
        }}
      />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        activeProject={activeProject}
      />
    </div>
  );
}
