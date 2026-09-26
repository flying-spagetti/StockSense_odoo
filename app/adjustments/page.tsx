import React from "react";
import { AdjustmentsIcon } from "@/components/ui/icons";

export default function AdjustmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AdjustmentsIcon className="h-6 w-6 text-amber-400" />
            Inventory Adjustments
          </h2>
          <p className="mt-1 text-sm text-zinc-400 font-mono">
            Perform physical count audits, reconcile discrepancies, and correct stock.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 font-mono text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span>Module Ready (Placeholder)</span>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center">
        <AdjustmentsIcon className="mx-auto h-12 w-12 text-zinc-600" />
        <h3 className="mt-4 text-base font-semibold text-white">Stock Adjustments & Audit</h3>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          Adjustments record corrective movements to match real-world counts. This module is configured as a working placeholder for Checkpoint 2.
        </p>
      </div>
    </div>
  );
}
