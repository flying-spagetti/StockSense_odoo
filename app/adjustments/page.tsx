import {
  listAdjustments,
  listProducts,
  listInventory,
  listWarehouses,
  listMoveHistory,
  getNextAdjustmentReference,
} from "@/lib/db/queries";
import { AdjustmentsClient } from "@/components/adjustments/adjustments-client";

export const dynamic = "force-dynamic";

export default async function AdjustmentsPage() {
  const adjustments = await listAdjustments();
  const products = await listProducts();
  const inventory = await listInventory();
  const warehouses = await listWarehouses();
  const movements = await listMoveHistory();
  const nextReference = await getNextAdjustmentReference();

  return (
    <AdjustmentsClient
      adjustments={adjustments}
      products={products}
      inventory={inventory}
      warehouses={warehouses}
      movements={movements}
      nextReference={nextReference}
    />
  );
}
