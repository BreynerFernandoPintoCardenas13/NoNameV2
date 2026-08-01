"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import styles from "./Folder.module.css";

const darkenColor = (hex: string, percent: number) => {
  let color = hex.startsWith("#") ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(color.slice(0, 6), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export type FolderProps = {
  /** Color primario de la carpeta. */
  color?: string;
  /** Factor de escala del tamaño de la carpeta. */
  size?: number;
  /** Hasta 3 elementos renderizados como "papeles" dentro de la carpeta. */
  items?: React.ReactNode[];
  className?: string;
};

type PaperOffset = { x: number; y: number };

const MAX_ITEMS = 3;

/**
 * Folder (React Bits, adaptado a TS) — carpeta interactiva 3D-ish con papeles
 * que se abren al hacer click/Enter/Space. Comportamiento sin modificar; solo
 * tipado y colores adaptados a la paleta del proyecto vía la prop `color`.
 */
export function Folder({ color = "#f7f7f7", size = 1, items = [], className }: FolderProps) {
  const papers = items.slice(0, MAX_ITEMS);
  while (papers.length < MAX_ITEMS) {
    papers.push(null);
  }

  const [open, setOpen] = React.useState(false);
  const [paperOffsets, setPaperOffsets] = React.useState<PaperOffset[]>(
    Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 })),
  );

  const folderBackColor = darkenColor(color, 0.08);
  const paper1 = darkenColor("#ffffff", 0.1);
  const paper2 = darkenColor("#ffffff", 0.05);
  const paper3 = "#ffffff";

  const handleClick = () => {
    setOpen((prev) => !prev);
    if (open) {
      setPaperOffsets(Array.from({ length: MAX_ITEMS }, () => ({ x: 0, y: 0 })));
    }
  };

  const handlePaperMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: offsetX, y: offsetY };
      return newOffsets;
    });
  };

  const handlePaperMouseLeave = (index: number) => {
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: 0, y: 0 };
      return newOffsets;
    });
  };

  const folderStyle = {
    "--folder-color": color,
    "--folder-back-color": folderBackColor,
    "--paper-1": paper1,
    "--paper-2": paper2,
    "--paper-3": paper3,
  } as React.CSSProperties;

  const scaleStyle = { transform: `scale(${size})` };

  return (
    <div style={scaleStyle} className={className}>
      <div
        className={cn(styles.folder, open && styles.open)}
        style={folderStyle}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        aria-label={open ? "Cerrar carpeta" : "Abrir carpeta"}
      >
        <div className={styles.folderBack}>
          {papers.map((item, i) => (
            <div
              key={i}
              className={styles.paper}
              onMouseMove={(e) => handlePaperMouseMove(e, i)}
              onMouseLeave={() => handlePaperMouseLeave(i)}
              style={
                open
                  ? ({
                      "--magnet-x": `${paperOffsets[i]?.x || 0}px`,
                      "--magnet-y": `${paperOffsets[i]?.y || 0}px`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {item}
            </div>
          ))}
          <div className={styles.folderFront} />
          <div className={cn(styles.folderFront, styles.frontRight)} />
        </div>
      </div>
    </div>
  );
}

export default Folder;
