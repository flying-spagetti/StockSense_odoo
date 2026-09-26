"use server";

import { revalidatePath } from "next/cache";
import {
  insertAdjustment,
  validateAdjustmentById,
  cancelAdjustmentById,
} from "@/lib/db/queries";
import { parseAdjustmentForm, type AdjustmentFormState } from "@/lib/validation";

export async function createAdjustment(
  _prevState: AdjustmentFormState,
  formData: FormData,
): Promise<AdjustmentFormState> {
  const result = parseAdjustmentForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  try {
    const newAdjustment = await insertAdjustment(result.data);

    revalidatePath("/adjustments");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");

    const statusLabel =
      result.data.status === "done"
        ? "posted (Derived stock updated)"
        : "saved as Draft";

    const deltaSign = result.data.delta > 0 ? `+${result.data.delta}` : `${result.data.delta}`;

    return {
      success: true,
      message: `Adjustment ${result.data.reference} (${deltaSign} units) ${statusLabel}.`,
      adjustmentId: newAdjustment.id,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("already matches recorded stock")
    ) {
      return {
        success: false,
        errors: { physicalCount: error.message, form: error.message },
        message: error.message,
      };
    }
    return {
      success: false,
      errors: { form: "Failed to record stock adjustment." },
    };
  }
}

export async function validateAdjustmentAction(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Missing adjustment ID." };
  }

  const res = await validateAdjustmentById(id);

  if (res.success) {
    revalidatePath("/adjustments");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");
  }

  return res;
}

export async function cancelAdjustmentAction(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Missing adjustment ID." };
  }

  const success = await cancelAdjustmentById(id);

  if (success) {
    revalidatePath("/adjustments");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");
    return { success: true, message: "Stock adjustment canceled." };
  }

  return { success: false, message: "Failed to cancel stock adjustment." };
}
