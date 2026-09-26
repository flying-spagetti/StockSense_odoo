import { listInventory } from "@/lib/db/queries";
import { ProductsClient } from "@/components/products/products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const inventory = await listInventory();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Master Products Catalog</h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            On-hand Total Available quantity is strictly derived from done stock movements.
          </p>
        </div>
      </div>

      <ProductsClient products={inventory} />
    </div>
  );
}
