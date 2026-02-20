import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/fluent/button";
import { cn } from "@/lib/utils";

export type EmptyStateCopy = {
  reason: string;
  nextStep: string;
  actionLabel: string;
};

export type EmptyStateAction = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "outline" | "ghost" | "destructive";
};

type FluentEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  copy: EmptyStateCopy;
  primaryAction: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
};

export function createEmptyStateCopy(copy: EmptyStateCopy): EmptyStateCopy {
  return copy;
}

export default function FluentEmptyState({
  icon: Icon,
  title,
  copy,
  primaryAction,
  secondaryAction,
  className,
}: FluentEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed bg-gradient-to-br from-muted/35 via-background to-background p-8 text-center",
        "dark:from-muted/55 dark:via-background dark:to-background",
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground/95">
        原因说明：{copy.reason}
      </p>
      <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground/95">
        下一步建议：{copy.nextStep}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button variant={primaryAction.variant ?? "default"} onClick={primaryAction.onClick}>
          {primaryAction.icon}
          {primaryAction.label || copy.actionLabel}
        </Button>
        {secondaryAction ? (
          <Button variant={secondaryAction.variant ?? "outline"} onClick={secondaryAction.onClick}>
            {secondaryAction.icon}
            {secondaryAction.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
