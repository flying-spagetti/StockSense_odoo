"use server";

import { revalidatePath } from "next/cache";
import {
  insertReceipt,
  updateReceiptById,
  validateReceiptById,
  cancelReceiptById,
} from "@/lib/db/queries";
import { parseReceiptForm, type ReceiptFormState } from "@/lib/validation";

export async function createReceipt(
  _prevState: ReceiptFormState,
  formData: FormData,
): Promise<ReceiptFormState> {
  const result = parseReceiptForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  const newReceipt = await insertReceipt(result.data);

  revalidatePath("/receipts");
  revalidatePath("/products");
  revalidatePath("/");

  const statusLabel = result.data.status === "done" ? "validated (Stock increased)" : "saved as Draft";

  return {
    success: true,
    message: `Receipt ${result.data.reference} successfully ${statusLabel}.`,
    receiptId: newReceipt.id,
  };
}

export async function validateReceiptAction(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Missing receipt ID." };
  }

  const success = await validateReceiptById(id);

  if (success) {
    revalidatePath("/receipts");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true, message: "Receipt validated! Derived stock has been updated." };
  }

  return { success: false, message: "Failed to validate receipt." };
}

export async function cancelReceiptAction(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Missing receipt ID." };
  }

  const success = await cancelReceiptById(id);

  if (success) {
    revalidatePath("/receipts");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true, message: "Receipt canceled." };
  }

  return { success: false, message: "Failed to cancel receipt." };
}

export async function updateReceipt(
  _prevState: ReceiptFormState,
  formData: FormData,
): Promise<ReceiptFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { errors: { form: "Missing receipt ID for update." } };
  }

  const result = parseReceiptForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  try {
    const updated = await updateReceiptById(id, result.data);

    if (!updated) {
      return { errors: { form: "Draft receipt not found or not in draft status." } };
    }

    revalidatePath("/receipts");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");

    const statusLabel = result.data.status === "done" ? "validated (Stock increased)" : "updated as Draft";

    return {
      success: true,
      message: `Receipt ${result.data.reference} successfully ${statusLabel}.`,
      receiptId: updated.id,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { errors: { form: error.message } };
    }
    return { errors: { form: "Failed to update receipt." } };
  }
}

