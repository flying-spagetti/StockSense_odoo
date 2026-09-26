import {
  listTransfers,
  listProducts,
  listInventory,
  listWarehouses,
  listMoveHistory,
  getNextTransferReference,
} from "@/lib/db/queries";
import { TransfersClient } from "@/components/transfers/transfers-client";

export const dynamic = "force-dynamic";

export default async function TransfersPage() {
  const transfers = await listTransfers();
  const products = await listProducts();
  const inventory = await listInventory();
  const warehouses = await listWarehouses();
  const movements = await listMoveHistory();
  const nextReference = await getNextTransferReference();

  return (
    <TransfersClient
      transfers={transfers}
      products={products}
      inventory={inventory}
      warehouses={warehouses}
      movements={movements}
      nextReference={nextReference}
    />
  );
}
