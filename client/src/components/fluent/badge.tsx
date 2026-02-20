import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: any) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs",
        variant === "outline" && "border",
        variant === "secondary" && "bg-secondary",
        variant === "destructive" && "bg-destructive text-destructive-foreground",
        className
      )}
      {...props}
    />
  );
}
