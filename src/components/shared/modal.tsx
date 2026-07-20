import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ModalProps = React.ComponentProps<typeof Dialog> & {
  title: string;
  description?: string;
  trigger?: React.ReactElement;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

/** Base única para todos los modales de la app: mismo header/footer/motion en todas partes. */
export function Modal({
  title,
  description,
  trigger,
  footer,
  children,
  className,
  ...props
}: ModalProps) {
  return (
    <Dialog {...props}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
