import {
  listDeliveries,
  listProducts,
  listInventory,
  getNextDeliveryReference,
} from "@/lib/db/queries";
import { DeliveriesClient } from "@/components/deliveries/deliveries-client";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const deliveries = await listDeliveries();
  const products = await listProducts();
  const inventory = await listInventory();
  const nextReference = await getNextDeliveryReference();

  return (
    <DeliveriesClient
      deliveries={deliveries}
      products={products}
      inventory={inventory}
      nextReference={nextReference}
    />
  );
}
