import type { LucideIcon } from "lucide-react";
import { Atom, Boxes, Code2, Database, FileCode, Sparkles, Wind } from "lucide-react";

import { LogoLoop, type LogoItem } from "@/components/effects/logo-loop";

export type TechLogo = {
  name: string;
  icon: LucideIcon;
};

/** Cambiar el stack mostrado es solo editar esta lista (o pasar `stack` al componente). */
export const DEFAULT_TECH_STACK: TechLogo[] = [
  { name: "React", icon: Atom },
  { name: "Tailwind CSS", icon: Wind },
  { name: "TypeScript", icon: FileCode },
  { name: "Claude", icon: Sparkles },
  { name: "OpenProject", icon: Boxes },
  { name: "PHP", icon: Code2 },
  { name: "MySQL", icon: Database },
];

type TechLoopProps = {
  stack?: TechLogo[];
  className?: string;
};

/** Sección de tecnologías bajo el Hero — arquitectura lista, aún sin backend detrás. */
export function TechLoop({ stack = DEFAULT_TECH_STACK, className }: TechLoopProps) {
  const logos: LogoItem[] = stack.map(({ name, icon: Icon }) => ({
    node: (
      <span className="flex items-center gap-2 text-white/50">
        <Icon className="size-4" />
        <span className="text-sm tracking-wide">{name}</span>
      </span>
    ),
    title: name,
  }));

  return (
    <div className={className}>
      <LogoLoop
        logos={logos}
        speed={50}
        direction="left"
        logoHeight={18}
        gap={56}
        hoverSpeed={12}
        fadeOut
        fadeOutColor="#050505"
        ariaLabel="Tecnologías utilizadas en NoName"
      />
    </div>
  );
}
