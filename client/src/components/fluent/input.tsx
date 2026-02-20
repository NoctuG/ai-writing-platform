import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn("h-9 w-full rounded-md border bg-transparent px-3 py-1", className)} {...props} />
);
Input.displayName = "Input";
