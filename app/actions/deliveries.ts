"use server";

import { revalidatePath } from "next/cache";
import {
  insertDelivery,
  updateDeliveryById,
  validateDeliveryById,
  cancelDeliveryById,
} from "@/lib/db/queries";
import { parseDeliveryForm, type DeliveryFormState } from "@/lib/validation";

export async function createDelivery(
  _prevState: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  const result = parseDeliveryForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  try {
    const newDelivery = await insertDelivery(result.data);

    revalidatePath("/deliveries");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");

    const statusLabel =
      result.data.status === "done"
        ? "validated (Derived stock decreased)"
        : "saved as Draft";

    return {
      success: true,
      message: `Delivery ${result.data.reference} successfully ${statusLabel}.`,
      deliveryId: newDelivery.id,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Insufficient available stock at")) {
      return {
        success: false,
        errors: { form: error.message },
        message: error.message,
      };
    }
    return {
      success: false,
      errors: { form: "Failed to create delivery order." },
    };
  }
}

export async function validateDeliveryAction(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Missing delivery ID." };
  }

  const res = await validateDeliveryById(id);

  if (res.success) {
    revalidatePath("/deliveries");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");
  }

  return res;
}

export async function cancelDeliveryAction(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Missing delivery ID." };
  }

  const success = await cancelDeliveryById(id);

  if (success) {
    revalidatePath("/deliveries");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");
    return { success: true, message: "Delivery order canceled." };
  }

  return { success: false, message: "Failed to cancel delivery order." };
}

export async function updateDelivery(
  _prevState: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { errors: { form: "Missing delivery ID for update." } };
  }

  const result = parseDeliveryForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  try {
    const updated = await updateDeliveryById(id, result.data);

    if (!updated) {
      return { errors: { form: "Draft delivery not found or not in draft status." } };
    }

    revalidatePath("/deliveries");
    revalidatePath("/products");
    revalidatePath("/");
    revalidatePath("/move-history");

    const statusLabel =
      result.data.status === "done"
        ? "validated (Derived stock decreased)"
        : "updated as Draft";

    return {
      success: true,
      message: `Delivery ${result.data.reference} successfully ${statusLabel}.`,
      deliveryId: updated.id,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Insufficient available stock at")) {
      return {
        success: false,
        errors: { form: error.message },
        message: error.message,
      };
    }
    if (error instanceof Error) {
      return { errors: { form: error.message } };
    }
    return { errors: { form: "Failed to update delivery order." } };
  }
}

