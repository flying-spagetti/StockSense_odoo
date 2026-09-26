import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProduct } from "@/app/actions/products";
import { ProductForm } from "@/components/products/product-form";
import { Panel } from "@/components/ui/panel";
import { getProductById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function EditProductPage(
  props: PageProps<"/products/[id]">,
) {
  const { id } = await props.params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/products"
        className="text-sm text-zinc-600 underline hover:text-zinc-900"
      >
        Back to products
      </Link>

      <h1 className="mt-4 text-xl font-semibold text-zinc-900">Edit product</h1>

      <div className="mt-6">
        <Panel
          title={product.name}
          description="The SKU identifies the product and cannot be changed."
        >
          <ProductForm
            action={updateProduct}
            submitLabel="Save changes"
            product={product}
          />
        </Panel>
      </div>
    </main>
  );
}
