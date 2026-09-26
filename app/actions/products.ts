"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DuplicateSkuError,
  insertProduct,
  updateProductById,
} from "@/lib/db/queries";
import { parseProductForm, type ProductFormState } from "@/lib/validation";

function readId(formData: FormData): string {
  const value = formData.get("id");
  return typeof value === "string" ? value.trim() : "";
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const result = parseProductForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  try {
    await insertProduct(result.data);
  } catch (error) {
    if (error instanceof DuplicateSkuError) {
      return { errors: { sku: error.message } };
    }
    throw error;
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const id = readId(formData);

  if (!id) {
    return { errors: { form: "Missing product id." } };
  }

  const result = parseProductForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  const { name, category, unit, reorderLevel } = result.data;

  const updated = await updateProductById(id, { name, category, unit, reorderLevel });

  if (!updated) {
    return { errors: { form: "That product no longer exists." } };
  }

  revalidatePath("/products");
  redirect("/products");
}
