import { listMoveHistory } from "@/lib/db/queries";
import { MoveHistoryClient } from "@/components/move-history/move-history-client";

export const dynamic = "force-dynamic";

export default async function MoveHistoryPage() {
  const movements = await listMoveHistory();

  return <MoveHistoryClient movements={movements} />;
}
