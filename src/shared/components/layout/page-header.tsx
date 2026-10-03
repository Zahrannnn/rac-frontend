import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Trailing actions (e.g. the page's one primary button). */
  children?: ReactNode;
};

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 space-y-1">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </header>
  );
}
