import {
  listTransfers,
  listProducts,
  listInventory,
  getNextTransferReference,
} from "@/lib/db/queries";
import { TransfersClient } from "@/components/transfers/transfers-client";

export const dynamic = "force-dynamic";

export default async function TransfersPage() {
  const transfers = await listTransfers();
  const products = await listProducts();
  const inventory = await listInventory();
  const nextReference = await getNextTransferReference();

  return (
    <TransfersClient
      transfers={transfers}
      products={products}
      inventory={inventory}
      nextReference={nextReference}
    />
  );
}
