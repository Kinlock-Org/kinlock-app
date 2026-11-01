import type { ReactNode } from "react";

export interface StatePanelProps {
  role?: "status" | "alert" | "region";
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function StatePanel({
  role = "status",
  title,
  description,
  action,
  icon,
  children,
  className = "",
}: StatePanelProps) {
  return (
    <div
      role={role}
      className={`mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-ink/10 bg-paper px-6 py-12 text-center shadow-xs ${className}`}
    >
      {icon && <div className="mb-4 flex items-center justify-center">{icon}</div>}
      {title && <h2 className="text-xl font-medium tracking-tight text-ink">{title}</h2>}
      {description && <p className="mt-2 text-sm leading-relaxed text-ink/70">{description}</p>}
      {children && <div className="mt-4 w-full">{children}</div>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
