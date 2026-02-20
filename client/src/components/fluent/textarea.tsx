import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn("min-h-20 w-full rounded-md border bg-transparent px-3 py-2", className)} {...props} />
);
Textarea.displayName = "Textarea";
