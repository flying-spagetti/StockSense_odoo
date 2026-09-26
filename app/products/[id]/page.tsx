import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProduct } from "@/app/actions/products";
import { ProductForm } from "@/components/products/product-form";
import { Panel } from "@/components/ui/panel";
import { getProductById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-amber-400 transition"
      >
        &larr; Back to Products Catalog
      </Link>

      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Edit Product</h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          SKU <span className="text-amber-400">{product.sku}</span> is fixed and cannot be modified.
        </p>
      </div>

      <Panel
        title={product.name}
        description="Update product configuration, category, unit, or reorder threshold."
      >
        <ProductForm
          action={updateProduct}
          submitLabel="Save Changes"
          product={product}
        />
      </Panel>
    </div>
  );
}
