"use server";

import { revalidatePath } from "next/cache";
import {
  insertTransfer,
  validateTransferById,
  cancelTransferById,
} from "@/lib/db/queries";
import { parseTransferForm, type TransferFormState } from "@/lib/validation";

export async function createTransfer(
  _prevState: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  const result = parseTransferForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  try {
    const newTransfer = await insertTransfer(result.data);

    revalidatePath("/transfers");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");

    const message =
      result.data.status === "done"
        ? `Transferred ${result.data.quantity} units from ${result.data.fromLocationId} to ${result.data.toLocationId}.`
        : `Transfer ${result.data.reference} saved as Draft.`;

    return {
      success: true,
      message,
      transferId: newTransfer.id,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Insufficient available stock") ||
        error.message.includes("cannot be the same"))
    ) {
      return {
        success: false,
        errors: { form: error.message },
        message: error.message,
      };
    }
    return {
      success: false,
      errors: { form: "Failed to create internal transfer." },
    };
  }
}

export async function validateTransferAction(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Missing transfer ID." };
  }

  const res = await validateTransferById(id);

  if (res.success) {
    revalidatePath("/transfers");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");
  }

  return res;
}

export async function cancelTransferAction(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Missing transfer ID." };
  }

  const success = await cancelTransferById(id);

  if (success) {
    revalidatePath("/transfers");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");
    return { success: true, message: "Transfer order canceled." };
  }

  return { success: false, message: "Failed to cancel transfer order." };
}
