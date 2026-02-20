import * as React from "react";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{ value: string; onChange: (v: string) => void } | null>(null);

export function Tabs({ value, onValueChange, children, className }: React.PropsWithChildren<{ value: string; onValueChange: (value: string) => void; className?: string }>) {
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex gap-2", className)} {...props} />;
}

export function TabsTrigger({ value, children, className }: React.PropsWithChildren<{ value: string; className?: string }>) {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button type="button" className={cn("px-3 py-1 rounded", active && "bg-primary text-primary-foreground", className)} onClick={() => ctx?.onChange(value)}>
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: React.PropsWithChildren<{ value: string; className?: string }>) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={className}>{children}</div>;
}
