"use client";

import * as React from "react";
import { Pin } from "lucide-react";

import {
  PinnedList as PinnedListPrimitive,
  PinnedListItem,
  PinnedListItems,
  PinnedListLabel,
  PinnedListPinned,
  PinnedListTrigger,
  PinnedListUnpinned,
} from "@/components/animate-ui/primitives/animate/pinned-list";
import { cn } from "@/lib/utils";

export type PinnedListEntry = {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

type PinnedListProps = {
  items: PinnedListEntry[];
  pinnedIds: string[];
  onTogglePin?: (id: string) => void;
  renderItem?: (item: PinnedListEntry) => React.ReactNode;
  className?: string;
};

/**
 * Base reutilizable para listas de proyectos/notas con fijado y reordenamiento animado.
 * Por ahora solo arquitectura + demo (fijar/orden aún no persiste en backend).
 */
export function PinnedList({
  items,
  pinnedIds,
  onTogglePin,
  renderItem,
  className,
}: PinnedListProps) {
  const pinned = items.filter((item) => pinnedIds.includes(item.id));
  const unpinned = items.filter((item) => !pinnedIds.includes(item.id));

  return (
    <PinnedListPrimitive
      className={cn("flex flex-col gap-4", className)}
      onPinnedChange={onTogglePin}
    >
      {pinned.length > 0 && (
        <PinnedListPinned className="flex flex-col gap-2">
          <PinnedListLabel className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Fijados
          </PinnedListLabel>
          <PinnedListItems className="flex flex-col gap-2">
            {pinned.map((item) => (
              <PinnedListRow key={item.id} item={item} pinned renderItem={renderItem} />
            ))}
          </PinnedListItems>
        </PinnedListPinned>
      )}
      <PinnedListUnpinned className="flex flex-col gap-2">
        <PinnedListLabel
          hide={pinned.length === 0}
          className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
        >
          Todos
        </PinnedListLabel>
        <PinnedListItems className="flex flex-col gap-2">
          {unpinned.map((item) => (
            <PinnedListRow key={item.id} item={item} pinned={false} renderItem={renderItem} />
          ))}
        </PinnedListItems>
      </PinnedListUnpinned>
    </PinnedListPrimitive>
  );
}

function PinnedListRow({
  item,
  pinned,
  renderItem,
}: {
  item: PinnedListEntry;
  pinned: boolean;
  renderItem?: (item: PinnedListEntry) => React.ReactNode;
}) {
  return (
    <PinnedListItem
      id={item.id}
      customTrigger
      className="bg-card ring-foreground/10 flex items-center gap-3 rounded-xl px-4 py-3 text-sm ring-1"
    >
      {renderItem ? (
        renderItem(item)
      ) : (
        <>
          {item.icon}
          <div className="flex-1">
            <p className="font-medium">{item.title}</p>
            {item.description && (
              <p className="text-muted-foreground text-xs">{item.description}</p>
            )}
          </div>
        </>
      )}
      <PinnedListTrigger
        className="text-muted-foreground hover:text-foreground rounded-md p-1.5"
        aria-label={pinned ? "Desfijar" : "Fijar"}
      >
        <Pin className={cn("size-3.5", pinned && "fill-current")} />
      </PinnedListTrigger>
    </PinnedListItem>
  );
}
