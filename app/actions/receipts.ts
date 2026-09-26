"use server";

import { revalidatePath } from "next/cache";
import {
  insertReceipt,
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
