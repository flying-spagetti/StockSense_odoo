"use server";

import { revalidatePath } from "next/cache";
import {
  insertWarehouse,
  updateWarehouseById,
  toggleWarehouseStatusById,
} from "@/lib/db/queries";
import { parseWarehouseForm, type WarehouseFormState } from "@/lib/validation";

export async function createWarehouse(
  _prevState: WarehouseFormState,
  formData: FormData,
): Promise<WarehouseFormState> {
  const result = parseWarehouseForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  try {
    const newWh = await insertWarehouse(result.data);

    revalidatePath("/settings");

    return {
      success: true,
      message: `Warehouse ${newWh.name} (${newWh.code}) created successfully.`,
      warehouseId: newWh.id,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { errors: { form: error.message } };
    }
    return { errors: { form: "Failed to create warehouse." } };
  }
}

export async function updateWarehouse(
  _prevState: WarehouseFormState,
  formData: FormData,
): Promise<WarehouseFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { errors: { form: "Missing warehouse ID." } };
  }

  const result = parseWarehouseForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  try {
    const updated = await updateWarehouseById(id, result.data);

    if (!updated) {
      return { errors: { form: "Warehouse not found." } };
    }

    revalidatePath("/settings");

    return {
      success: true,
      message: `Warehouse ${updated.name} (${updated.code}) updated successfully.`,
      warehouseId: updated.id,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { errors: { form: error.message } };
    }
    return { errors: { form: "Failed to update warehouse." } };
  }
}

export async function toggleWarehouseStatusAction(
  id: string,
): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: "Missing warehouse ID." };
  }

  const updated = await toggleWarehouseStatusById(id);

  if (updated) {
    revalidatePath("/settings");
    const statusText = updated.isActive ? "enabled (Active)" : "disabled (Inactive)";
    return {
      success: true,
      message: `Warehouse ${updated.name} (${updated.code}) is now ${statusText}.`,
    };
  }

  return { success: false, message: "Failed to update warehouse status." };
}
