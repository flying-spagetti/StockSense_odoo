import React from "react";
import { MoveHistoryIcon } from "@/components/ui/icons";

export default function MoveHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MoveHistoryIcon className="h-6 w-6 text-indigo-400" />
            Stock Move History Ledger
          </h2>
          <p className="mt-1 text-sm text-zinc-400 font-mono">
            Complete audit trail of all receipts, issues, drafts, and void movements.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 font-mono text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-indigo-400" />
          <span>Module Ready (Placeholder)</span>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center">
        <MoveHistoryIcon className="mx-auto h-12 w-12 text-zinc-600" />
        <h3 className="mt-4 text-base font-semibold text-white">Movement Audit Ledger</h3>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          Every single movement log is recorded here with status (`completed`, `draft`, `void`). This module is configured as a working placeholder for Checkpoint 2.
        </p>
      </div>
    </div>
  );
}
