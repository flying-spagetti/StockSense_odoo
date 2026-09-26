import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold shadow-sm active:translate-y-[0.5px]",
  secondary: "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:border-zinc-600",
  danger: "bg-red-600/90 text-white hover:bg-red-600 shadow-sm",
  ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-9 items-center justify-center rounded-md px-3.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
