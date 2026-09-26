import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-white tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs text-zinc-400 font-mono">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
