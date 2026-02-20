import * as React from "react";

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

type SelectItemProps = { value: string; children: React.ReactNode };

export function SelectItem(_props: SelectItemProps) {
  return null;
}

function collectItems(nodes: React.ReactNode, acc: SelectItemProps[] = []): SelectItemProps[] {
  React.Children.forEach(nodes, child => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      acc.push(child.props as SelectItemProps);
      return;
    }
    if ((child.props as { children?: React.ReactNode })?.children) {
      collectItems((child.props as { children?: React.ReactNode }).children, acc);
    }
  });
  return acc;
}

export function Select({ value, onValueChange, children, className }: SelectProps) {
  const items = collectItems(children);
  return (
    <select value={value} onChange={e => onValueChange?.(e.target.value)} className={className ?? "w-full h-9 rounded-md border bg-transparent px-3"}>
      {items.map(item => (
        <option key={item.value} value={item.value}>
          {item.children}
        </option>
      ))}
    </select>
  );
}

export function SelectTrigger({ children }: React.HTMLAttributes<HTMLDivElement>) {
  return <>{children}</>;
}

export function SelectContent({ children }: React.HTMLAttributes<HTMLDivElement>) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <SelectItem value="">{placeholder ?? "请选择"}</SelectItem>;
}
