import React from "react";
import { TransfersIcon } from "@/components/ui/icons";

export default function TransfersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TransfersIcon className="h-6 w-6 text-purple-400" />
            Internal Transfers
          </h2>
          <p className="mt-1 text-sm text-zinc-400 font-mono">
            Relocate stock between internal warehouse racks, zones, and locations.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 font-mono text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          <span>Module Ready (Placeholder)</span>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center">
        <TransfersIcon className="mx-auto h-12 w-12 text-zinc-600" />
        <h3 className="mt-4 text-base font-semibold text-white">Stock Transfers</h3>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          Move stock seamlessly across internal locations. This module is configured as a working placeholder for Checkpoint 2.
        </p>
      </div>
    </div>
  );
}
