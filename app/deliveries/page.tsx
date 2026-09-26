import {
  listDeliveries,
  listProducts,
  listInventory,
  getNextDeliveryReference,
  listWarehouses,
  listMoveHistory,
} from "@/lib/db/queries";
import { DeliveriesClient } from "@/components/deliveries/deliveries-client";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const deliveries = await listDeliveries();
  const products = await listProducts();
  const inventory = await listInventory();
  const nextReference = await getNextDeliveryReference();
  const warehouses = await listWarehouses();
  const movements = await listMoveHistory();

  return (
    <DeliveriesClient
      deliveries={deliveries}
      products={products}
      inventory={inventory}
      nextReference={nextReference}
      warehouses={warehouses}
      movements={movements}
    />
  );
}
