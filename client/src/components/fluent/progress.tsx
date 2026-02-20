export function Progress({ value = 0, className = "h-2 w-full bg-secondary rounded" }: { value?: number; className?: string }) {
  return (
    <div className={className}>
      <div className="h-full bg-primary rounded" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
