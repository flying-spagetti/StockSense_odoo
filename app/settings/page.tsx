import React from "react";
import { SettingsIcon } from "@/components/ui/icons";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-zinc-400" />
            System Settings & Warehouse Config
          </h2>
          <p className="mt-1 text-sm text-zinc-400 font-mono">
            Configure default UoM, reorder rules, and stock valuation engine parameters.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 font-mono text-xs text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-zinc-400" />
          <span>Module Ready (Placeholder)</span>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50 p-12 text-center">
        <SettingsIcon className="mx-auto h-12 w-12 text-zinc-600" />
        <h3 className="mt-4 text-base font-semibold text-white">System Settings</h3>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          Manage system configurations and database preferences. This module is configured as a working placeholder for Checkpoint 2.
        </p>
      </div>
    </div>
  );
}
