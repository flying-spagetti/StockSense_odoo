import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wide">
          {label}
        </label>
        {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
      </div>
      {children}
      {error ? <p className="text-xs text-red-400 font-mono mt-0.5">{error}</p> : null}
    </div>
  );
}
