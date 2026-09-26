import Link from "next/link";
import { listInventory } from "@/lib/db/queries";
import { ProductsIcon, ReceiptsIcon, DeliveriesIcon, AlertTriangleIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const inventory = await listInventory();

  const totalProducts = inventory.length;
  const totalAvailable = inventory.reduce((sum, item) => sum + item.onHand, 0);
  const lowStockItems = inventory.filter((item) => item.onHand <= item.reorderLevel);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 font-mono text-xs text-amber-300 flex items-start gap-3">
        <AlertTriangleIcon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-200">DOUBLE-ENTRY STOCK ENGINE RULE ACTIVE</p>
          <p className="mt-1 text-amber-300/80">
            In StockSense, stock quantities are <span className="underline font-bold">never stored</span>. Total Available for every product is computed strictly by aggregating done stock movements (`receipts` add, `issues` subtract).
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-zinc-400 uppercase">Master Products</span>
            <ProductsIcon className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{totalProducts}</span>
            <span className="text-xs text-zinc-500 font-mono">active SKUs</span>
          </div>
          <Link
            href="/products"
            className="mt-3 inline-block text-xs font-medium text-amber-400 hover:text-amber-300 hover:underline"
          >
            Manage Products &rarr;
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-zinc-400 uppercase">Total Available</span>
            <ReceiptsIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 font-mono">{totalAvailable}</span>
            <span className="text-xs text-zinc-500 font-mono">derived units</span>
          </div>
          <span className="mt-3 inline-block text-xs text-zinc-400 font-mono">
            Sum of completed moves
          </span>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-zinc-400 uppercase">Reorder Alerts</span>
            <AlertTriangleIcon className={`h-5 w-5 ${lowStockItems.length > 0 ? "text-amber-400" : "text-zinc-600"}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono ${lowStockItems.length > 0 ? "text-amber-400" : "text-white"}`}>
              {lowStockItems.length}
            </span>
            <span className="text-xs text-zinc-500 font-mono">below reorder lvl</span>
          </div>
          <span className="mt-3 inline-block text-xs text-zinc-400 font-mono">
            {lowStockItems.length > 0 ? "Attention required" : "Inventory optimal"}
          </span>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-zinc-400 uppercase">Engine Status</span>
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white font-mono">ONLINE</span>
          </div>
          <span className="mt-3 inline-block text-xs text-zinc-500 font-mono">
            Realtime SQL Aggregation
          </span>
        </div>
      </div>

      {/* Quick Navigation Panel */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-zinc-400 mb-4">
          Quick Access Modules
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/products"
            className="group flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-amber-500/50 hover:bg-zinc-800/50"
          >
            <div>
              <div className="flex items-center gap-3">
                <ProductsIcon className="h-5 w-5 text-amber-400" />
                <span className="font-semibold text-white">Products Catalog</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                View, search, create, and edit products. Total Available is computed from stock moves.
              </p>
            </div>
            <span className="mt-4 text-xs font-mono text-amber-400 group-hover:underline">
              Open Master Catalog &rarr;
            </span>
          </Link>

          <Link
            href="/receipts"
            className="group flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-emerald-500/50 hover:bg-zinc-800/50"
          >
            <div>
              <div className="flex items-center gap-3">
                <ReceiptsIcon className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold text-white">Receipts (Incoming)</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Log incoming shipments from suppliers to increase available stock upon completion.
              </p>
            </div>
            <span className="mt-4 text-xs font-mono text-emerald-400 group-hover:underline">
              View Receipts &rarr;
            </span>
          </Link>

          <Link
            href="/deliveries"
            className="group flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-sky-500/50 hover:bg-zinc-800/50"
          >
            <div>
              <div className="flex items-center gap-3">
                <DeliveriesIcon className="h-5 w-5 text-sky-400" />
                <span className="font-semibold text-white">Deliveries (Outgoing)</span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Process customer sales orders and outgoing issues to deduct from available stock.
              </p>
            </div>
            <span className="mt-4 text-xs font-mono text-sky-400 group-hover:underline">
              View Deliveries &rarr;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}