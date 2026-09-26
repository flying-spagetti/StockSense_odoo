import Link from "next/link";
import { createProduct } from "@/app/actions/products";
import { ProductForm } from "@/components/products/product-form";
import { Panel } from "@/components/ui/panel";
import { listProducts } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-xl font-semibold text-zinc-900">Products</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  SKU
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Unit
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Reorder at
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-zinc-500">
                    No products yet. Add one with the form.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{product.unit}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {product.reorderLevel}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-sm font-medium text-zinc-900 underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Panel
          title="Add product"
          description="A product has no stock field. Quantities come from stock movements."
        >
          <ProductForm action={createProduct} submitLabel="Create product" />
        </Panel>
      </div>
    </main>
  );
}
