import Link from "next/link";

const links = [
  {
    href: "/inventory",
    title: "Inventory",
    description:
      "On-hand quantities derived from completed stock movements.",
  },
  {
    href: "/products",
    title: "Products",
    description: "Create products and maintain their details.",
  },
] as const;

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        StockSense
      </h1>
      <p className="mt-2 max-w-prose text-zinc-600">
        Inventory is never stored on a product. Every on-hand quantity is
        derived by aggregating completed stock movements, so the ledger is the
        single source of truth.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400"
          >
            <h2 className="font-semibold text-zinc-900">{link.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{link.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
