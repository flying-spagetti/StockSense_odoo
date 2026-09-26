import {
  listAdjustments,
  listProducts,
  listInventory,
  getNextAdjustmentReference,
} from "@/lib/db/queries";
import { AdjustmentsClient } from "@/components/adjustments/adjustments-client";

export const dynamic = "force-dynamic";

export default async function AdjustmentsPage() {
  const adjustments = await listAdjustments();
  const products = await listProducts();
  const inventory = await listInventory();
  const nextReference = await getNextAdjustmentReference();

  return (
    <AdjustmentsClient
      adjustments={adjustments}
      products={products}
      inventory={inventory}
      nextReference={nextReference}
    />
  );
}
