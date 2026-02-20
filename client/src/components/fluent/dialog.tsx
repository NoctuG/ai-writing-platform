import * as React from "react";
import {
  Dialog as FluentDialog,
  DialogBody,
  DialogContent as FluentDialogContent,
  DialogSurface,
  DialogTitle as FluentDialogTitle,
  DialogTrigger as FluentDialogTrigger,
} from "@fluentui/react-components";

export function Dialog({ children, open, onOpenChange }: any) {
  return (
    <FluentDialog open={open} onOpenChange={(_, data) => onOpenChange?.(data.open)}>
      {children}
    </FluentDialog>
  );
}

export function DialogTrigger({ children, asChild }: any) {
  if (asChild && React.isValidElement(children)) {
    return <FluentDialogTrigger disableButtonEnhancement>{children}</FluentDialogTrigger>;
  }
  return <FluentDialogTrigger>{children}</FluentDialogTrigger>;
}

export function DialogContent({ children, ...props }: any) {
  return (
    <DialogSurface {...props}>
      <DialogBody>
        <FluentDialogContent>{children}</FluentDialogContent>
      </DialogBody>
    </DialogSurface>
  );
}

export function DialogHeader({ children }: any) {
  return <div>{children}</div>;
}

export function DialogTitle({ children }: any) {
  return <FluentDialogTitle>{children}</FluentDialogTitle>;
}

export function DialogDescription({ children }: any) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export const DialogFooter = ({ children, className }: any) => <div className={className}>{children}</div>;

export const DialogClose = ({ children }: any) => <>{children}</>;
