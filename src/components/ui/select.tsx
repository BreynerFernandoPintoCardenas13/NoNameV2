"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";

import { cn } from "@/lib/utils";
import { ChevronDownIcon, CheckIcon, SearchIcon } from "lucide-react";

/**
 * Select buscable construido sobre Combobox de Base UI (ya instalado junto a Select,
 * mismo autor/API): añade un input de búsqueda dentro del popup sin tocar la superficie
 * pública (Select, SelectTrigger, SelectContent, SelectItem, ...) que ya usan los formularios.
 */

function getNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join(" ");
  if (React.isValidElement(node)) {
    return getNodeText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

/** Recorre los children de <Select> (Trigger + Content) para mapear value -> label mostrado en SelectValue. */
function collectSelectLabels(node: React.ReactNode, out: Map<unknown, React.ReactNode>) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      const props = child.props as { value: unknown; children?: React.ReactNode };
      out.set(props.value, props.children);
      return;
    }
    const props = child.props as { children?: React.ReactNode } | undefined;
    if (props?.children != null) collectSelectLabels(props.children, out);
  });
}

/** Filtra recursivamente los SelectItem/SelectGroup de SelectContent según la búsqueda. */
function filterSelectChildren(
  node: React.ReactNode,
  matches: (text: string) => boolean,
): { node: React.ReactNode; count: number } {
  let count = 0;
  const filtered = React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === SelectItem) {
      const props = child.props as { children?: React.ReactNode };
      if (!matches(getNodeText(props.children))) return null;
      count += 1;
      return child;
    }
    if (child.type === SelectGroup) {
      const props = child.props as { children?: React.ReactNode };
      const result = filterSelectChildren(props.children, matches);
      count += result.count;
      return result.count > 0 ? React.cloneElement(child, undefined, result.node) : null;
    }
    return child;
  });
  return { node: filtered, count };
}

const SelectQueryContext = React.createContext<{
  query: string;
  setQuery: (query: string) => void;
}>({ query: "", setQuery: () => {} });

const SelectLabelsContext = React.createContext<Map<unknown, React.ReactNode>>(new Map());

function Select<Value = string, Multiple extends boolean | undefined = false>({
  children,
  onOpenChange,
  ...props
}: ComboboxPrimitive.Root.Props<Value, Multiple> & { children?: React.ReactNode }) {
  const [query, setQuery] = React.useState("");

  const labels = React.useMemo(() => {
    const map = new Map<unknown, React.ReactNode>();
    collectSelectLabels(children, map);
    return map;
  }, [children]);

  return (
    <SelectLabelsContext.Provider value={labels}>
      <SelectQueryContext.Provider value={{ query, setQuery }}>
        <ComboboxPrimitive.Root
          inputValue={query}
          onInputValueChange={setQuery}
          onOpenChange={(open, eventDetails) => {
            if (!open) setQuery("");
            onOpenChange?.(open, eventDetails);
          }}
          {...props}
        >
          {children}
        </ComboboxPrimitive.Root>
      </SelectQueryContext.Provider>
    </SelectLabelsContext.Provider>
  );
}

function SelectGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({
  className,
  placeholder,
}: {
  className?: string;
  placeholder?: React.ReactNode;
}) {
  const labels = React.useContext(SelectLabelsContext);
  return (
    <span data-slot="select-value" className={cn("flex flex-1 text-left", className)}>
      <ComboboxPrimitive.Value>
        {(selectedValue: unknown) =>
          selectedValue == null ? placeholder : (labels.get(selectedValue) ?? String(selectedValue))
        }
      </ComboboxPrimitive.Value>
    </span>
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 flex w-fit items-center justify-between gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.Icon
        render={<ChevronDownIcon className="text-muted-foreground pointer-events-none size-4" />}
      />
    </ComboboxPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  searchPlaceholder = "Buscar…",
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset"> & {
    searchPlaceholder?: string;
  }) {
  const { query } = React.useContext(SelectQueryContext);
  const filter = ComboboxPrimitive.useFilter();
  const { node: filteredChildren, count } = filterSelectChildren(children, (text) =>
    filter.contains(text, query),
  );

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "bg-popover text-popover-foreground ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg shadow-md ring-1 duration-100",
            className,
          )}
          {...props}
        >
          <div
            data-slot="select-search"
            className="border-border/50 flex items-center gap-2 border-b px-2 py-1.5"
          >
            <SearchIcon className="text-muted-foreground size-3.5 shrink-0" />
            <ComboboxPrimitive.Input
              placeholder={searchPlaceholder}
              className="placeholder:text-muted-foreground h-6 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <SelectScrollUpButton />
          <ComboboxPrimitive.List data-slot="select-list" className="scroll-my-1 p-1">
            {count > 0 ? (
              filteredChildren
            ) : (
              <div className="text-muted-foreground px-2 py-6 text-center text-sm">
                No se encontraron resultados.
              </div>
            )}
          </ComboboxPrimitive.List>
          <SelectScrollDownButton />
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("text-muted-foreground px-1.5 py-1 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">{children}</span>
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

// Combobox de Base UI no expone un equivalente a Select.ScrollUpArrow/ScrollDownArrow
// (el popup ya hace scroll nativo vía overflow-y-auto). Se mantienen exportados como
// no-op para no romper imports existentes.
function SelectScrollUpButton() {
  return null;
}

function SelectScrollDownButton() {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
