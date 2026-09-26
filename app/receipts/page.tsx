import { listReceipts, listProducts, getNextReceiptReference } from "@/lib/db/queries";
import { ReceiptsClient } from "@/components/receipts/receipts-client";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const receipts = await listReceipts();
  const products = await listProducts();
  const nextReference = await getNextReceiptReference();

  return (
    <ReceiptsClient
      receipts={receipts}
      products={products}
      nextReference={nextReference}
    />
  );
}
