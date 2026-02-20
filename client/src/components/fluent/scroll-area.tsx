import * as React from "react";
import { cn } from "@/lib/utils";

export function ScrollArea({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("overflow-auto", className)}>{children}</div>;
}
