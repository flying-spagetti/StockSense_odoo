import Link from "next/link";
import {
  listReceipts,
  listDeliveries,
  listInventory,
  listMoveHistory,
} from "@/lib/db/queries";
import {
  ReceiptsIcon,
  DeliveriesIcon,
  ProductsIcon,
  AlertTriangleIcon,
  MoveHistoryIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { ArrowRightIcon, HugeiconsIcon } from "@hugeicons/core-free-icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [receipts, deliveries, inventory, moveHistory] = await Promise.all([
    listReceipts(),
    listDeliveries(),
    listInventory(),
    listMoveHistory(),
  ]);

  // Operational metrics for Receipts
  const receiptsToReceive = receipts.filter(
    (r) => r.status === "draft" || r.status === "ready",
  ).length;
  const receiptsDone = receipts.filter((r) => r.status === "done").length;
  const receiptsTotal = receipts.length;

  // Operational metrics for Deliveries
  const deliveriesToDeliver = deliveries.filter(
    (d) => d.status === "draft" || d.status === "ready",
  ).length;
  const deliveriesWaiting = deliveries.filter((d) => d.status === "waiting").length;
  const deliveriesDone = deliveries.filter((d) => d.status === "done").length;
  const deliveriesTotal = deliveries.length;

  // Derived stock metrics
  const totalProducts = inventory.length;
  const totalAvailable = inventory.reduce((sum, item) => sum + item.onHand, 0);
  const lowStockItems = inventory.filter((item) => item.onHand <= item.reorderLevel);

  // Recent 5 movements for Stock Ledger preview
  const recentMovements = moveHistory.slice(0, 5);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Operational Control Room Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Live operational control room. Real-time monitoring of warehouse movements and derived stock.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 font-mono text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE ENGINE AGGREGATION</span>
        </div>
      </div>

      {/* Top Section: Operational Cards (Side-by-Side on Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receipt Operational Card */}
        <div className="rounded-xl border border-emerald-500/30 bg-zinc-900/90 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20 text-emerald-400">
                  <ReceiptsIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Receipts</h3>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/90 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                Inbound
              </span>
            </div>

            {/* Main Outlined Stat CTA Box */}
            <div className="mt-5 rounded-lg border-2 border-emerald-500/40 bg-zinc-950/80 p-5 text-center shadow-inner">
              <div className="text-4xl font-extrabold font-mono text-emerald-400">
                {receiptsToReceive}
              </div>
              <div className="mt-1 text-xs font-mono font-semibold uppercase tracking-widest text-zinc-200">
                to receive
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-400 font-sans">
                Incoming supplier shipments with status draft or ready.
              </p>
            </div>

            {/* Supporting Live Lines */}
            <div className="mt-5 grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
                <span className="text-zinc-500 uppercase text-[10px] block">Completed</span>
                <span className="font-bold text-white text-base">{receiptsDone}</span>
                <span className="text-zinc-400 text-[10px] ml-1">done</span>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
                <span className="text-zinc-500 uppercase text-[10px] block">Total Inbound</span>
                <span className="font-bold text-white text-base">{receiptsTotal}</span>
                <span className="text-zinc-400 text-[10px] ml-1">operations</span>
              </div>
            </div>
          </div>

          {/* Footer Link / CTA */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80">
            <Link
              href="/receipts"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-mono font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition"
            >
              <span>Open receipts</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Delivery Operational Card */}
        <div className="rounded-xl border border-amber-500/30 bg-zinc-900/90 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-amber-500/10 p-2 border border-amber-500/20 text-amber-400">
                  <DeliveriesIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Deliveries</h3>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                Outbound
              </span>
            </div>

            {/* Main Outlined Stat CTA Box */}
            <div className="mt-5 rounded-lg border-2 border-amber-500/40 bg-zinc-950/80 p-5 text-center shadow-inner">
              <div className="text-4xl font-extrabold font-mono text-amber-400">
                {deliveriesToDeliver}
              </div>
              <div className="mt-1 text-xs font-mono font-semibold uppercase tracking-widest text-zinc-200">
                to deliver
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-400 font-sans">
                Outgoing sales dispatches with status draft or ready.
              </p>
            </div>

            {/* Supporting Live Lines */}
            <div className="mt-5 grid grid-cols-3 gap-2 font-mono text-xs">
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2.5 text-center">
                <span className="text-zinc-500 uppercase text-[10px] block">Waiting</span>
                <span className="font-bold text-purple-300 text-sm">{deliveriesWaiting}</span>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2.5 text-center">
                <span className="text-zinc-500 uppercase text-[10px] block">Dispatched</span>
                <span className="font-bold text-white text-sm">{deliveriesDone}</span>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2.5 text-center">
                <span className="text-zinc-500 uppercase text-[10px] block">Total</span>
                <span className="font-bold text-white text-sm">{deliveriesTotal}</span>
              </div>
            </div>
          </div>

          {/* Footer Link / CTA */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80">
            <Link
              href="/deliveries"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-mono font-semibold text-amber-300 hover:bg-amber-500/20 hover:text-white transition"
            >
              <span>Open deliveries</span>
              <HugeiconsIcon icon={ArrowRightIcon} className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Derived Stock Inventory Summary Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-zinc-400">
            Derived Inventory Stock Summary
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            Computed strictly from done movements
          </span>
        </div>

        {/* Double-Entry Stock Engine Banner */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 font-mono text-xs text-zinc-300 flex items-start gap-3">
          <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">DOUBLE-ENTRY STOCK ENGINE ACTIVE</p>
            <p className="mt-0.5 text-zinc-400 text-[11px]">
              Stock Sense derives on-hand product quantities directly by aggregating completed stock movements (<span className="text-emerald-400">+receipts</span>, <span className="text-amber-400">-deliveries</span>, transfers & adjustments).
            </p>
          </div>
        </div>

        {/* 3 Summary Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase tracking-wider">Total Available Stock</span>
              <ReceiptsIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
              {totalAvailable} <span className="text-xs font-normal text-zinc-500">units</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 font-mono">Aggregated across all warehouses</p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase tracking-wider">Products Tracked</span>
              <ProductsIcon className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              {totalProducts} <span className="text-xs font-normal text-zinc-500">active SKUs</span>
            </div>
            <Link href="/products" className="mt-1 inline-block text-[11px] text-amber-400 hover:underline font-mono">
              View Product Catalog &rarr;
            </Link>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono uppercase tracking-wider">Reorder Alerts</span>
              <AlertTriangleIcon className={`h-4 w-4 ${lowStockItems.length > 0 ? "text-amber-400" : "text-zinc-600"}`} />
            </div>
            <div className={`mt-2 text-2xl font-bold font-mono ${lowStockItems.length > 0 ? "text-amber-400" : "text-white"}`}>
              {lowStockItems.length} <span className="text-xs font-normal text-zinc-500">items</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 font-mono">
              {lowStockItems.length > 0 ? "Stock below or equal reorder level" : "All stock levels optimal"}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Movement Activity Preview & Low-Stock Attention List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Recent Movement Activity (2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-zinc-400 flex items-center gap-2">
              <MoveHistoryIcon className="h-4 w-4 text-indigo-400" />
              Recent Movement Activity
            </h3>
            <Link
              href="/move-history"
              className="text-xs font-mono text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
            >
              <span>View full ledger</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th scope="col" className="px-3.5 py-2.5 font-medium">Date</th>
                    <th scope="col" className="px-3.5 py-2.5 font-medium">Reference</th>
                    <th scope="col" className="px-3.5 py-2.5 font-medium">Type</th>
                    <th scope="col" className="px-3.5 py-2.5 font-medium">Product</th>
                    <th scope="col" className="px-3.5 py-2.5 font-medium">Qty</th>
                    <th scope="col" className="px-3.5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans text-xs">
                  {recentMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 font-mono text-xs">
                        No movement activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentMovements.map((move) => (
                      <tr key={move.id} className="hover:bg-zinc-800/30">
                        <td className="px-3.5 py-2.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                          {formatDate(move.createdAt)}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-xs font-semibold text-zinc-200">
                          {move.reference}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[11px]">
                          {move.kind === "receipt" && (
                            <span className="text-emerald-400 font-bold">Receipt</span>
                          )}
                          {move.kind === "issue" && (
                            <span className="text-amber-400 font-bold">Delivery</span>
                          )}
                          {move.kind === "transfer" && (
                            <span className="text-sky-400 font-bold">Transfer</span>
                          )}
                          {move.kind === "adjustment" && (
                            <span className="text-purple-400 font-bold">Adjustment</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="font-medium text-white truncate max-w-[140px]">{move.productName}</div>
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-xs font-bold">
                          {move.signedQuantity > 0 ? (
                            <span className="text-emerald-400">+{move.signedQuantity}</span>
                          ) : move.signedQuantity < 0 ? (
                            <span className="text-amber-400">{move.signedQuantity}</span>
                          ) : (
                            <span className="text-sky-300">{move.quantity}</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[11px]">
                          {move.status === "done" ? (
                            <span className="text-emerald-400 font-semibold">Done</span>
                          ) : (
                            <span className="text-amber-300 capitalize">{move.status}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Attention List (1 Column) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-zinc-400 flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-amber-400" />
              Reorder Attention
            </h3>
            <Link
              href="/products"
              className="text-xs font-mono text-amber-400 hover:text-amber-300 hover:underline"
            >
              All products
            </Link>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3 font-mono text-xs">
            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 font-sans text-xs">
                <CheckCircleIcon className="mx-auto h-8 w-8 text-emerald-500/60 mb-2" />
                <p className="font-semibold text-zinc-300">All stock optimal</p>
                <p className="text-[11px] text-zinc-500 mt-1">No SKUs currently at or below reorder level.</p>
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/5 p-3"
                >
                  <div>
                    <p className="font-bold text-white font-sans truncate max-w-[150px]">{item.name}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-400 text-sm">{item.onHand} {item.unit}</span>
                    <span className="block text-[10px] text-zinc-500">Reorder @ {item.reorderLevel}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}