import { listInventory } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const rows = await listInventory();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-xl font-semibold text-zinc-900">Inventory</h1>
      <p className="mt-1 max-w-prose text-sm text-zinc-600">
        On-hand quantities are derived from done stock movements. Other
        statuses are excluded.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                SKU
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Product
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                On hand
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Reorder at
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-zinc-500">
                  No products yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isLow = row.onHand <= row.reorderLevel;

                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {row.sku}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-900">
                      {row.onHand} {row.unit}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {row.reorderLevel}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isLow
                            ? "font-medium text-red-600"
                            : "text-zinc-600"
                        }
                      >
                        {isLow ? "Low" : "In stock"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
