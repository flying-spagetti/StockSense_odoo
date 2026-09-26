import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:bg-zinc-900/60 disabled:text-zinc-500 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
