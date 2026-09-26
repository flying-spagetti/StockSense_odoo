import { listInventory, listMoveHistory, listWarehouses, getNextReceiptReference } from "@/lib/db/queries";
import { ProductsClient } from "@/components/products/products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const inventory = await listInventory();
  const movements = await listMoveHistory();
  const warehouses = await listWarehouses();
  const nextReceiptRef = await getNextReceiptReference();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Master Products Catalog</h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Manage product catalog, reordering rules, category filters, and location-by-location stock availability.
          </p>
        </div>
      </div>

      <ProductsClient
        products={inventory}
        movements={movements}
        warehouses={warehouses}
        nextReceiptRef={nextReceiptRef}
      />
    </div>
  );
}
