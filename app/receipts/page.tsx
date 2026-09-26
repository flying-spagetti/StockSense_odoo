import {
  listReceipts,
  listProducts,
  listInventory,
  listWarehouses,
  listMoveHistory,
  getNextReceiptReference,
} from "@/lib/db/queries";
import { ReceiptsClient } from "@/components/receipts/receipts-client";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const receipts = await listReceipts();
  const products = await listProducts();
  const inventory = await listInventory();
  const warehouses = await listWarehouses();
  const movements = await listMoveHistory();
  const nextReference = await getNextReceiptReference();

  return (
    <ReceiptsClient
      receipts={receipts}
      products={products}
      inventory={inventory}
      warehouses={warehouses}
      movements={movements}
      nextReference={nextReference}
    />
  );
}
