import Link from "next/link";

const links = [
  { href: "/products", label: "Products" },
  { href: "/inventory", label: "Inventory" },
] as const;

export function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-6">
        <Link href="/" className="font-semibold text-zinc-900">
          StockSense
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
