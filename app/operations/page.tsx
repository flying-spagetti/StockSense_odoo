import {
  listReceipts,
  listDeliveries,
  listTransfers,
  listAdjustments,
  listProducts,
  listInventory,
  getNextReceiptReference,
  getNextDeliveryReference,
  getNextTransferReference,
  getNextAdjustmentReference,
} from "@/lib/db/queries";
import { OperationsClient } from "@/components/operations/operations-client";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const [
    receipts,
    deliveries,
    transfers,
    adjustments,
    products,
    inventory,
    nextReceiptRef,
    nextDeliveryRef,
    nextTransferRef,
    nextAdjustmentRef,
  ] = await Promise.all([
    listReceipts(),
    listDeliveries(),
    listTransfers(),
    listAdjustments(),
    listProducts(),
    listInventory(),
    getNextReceiptReference(),
    getNextDeliveryReference(),
    getNextTransferReference(),
    getNextAdjustmentReference(),
  ]);

  return (
    <OperationsClient
      receipts={receipts}
      deliveries={deliveries}
      transfers={transfers}
      adjustments={adjustments}
      products={products}
      inventory={inventory}
      nextReceiptRef={nextReceiptRef}
      nextDeliveryRef={nextDeliveryRef}
      nextTransferRef={nextTransferRef}
      nextAdjustmentRef={nextAdjustmentRef}
    />
  );
}
