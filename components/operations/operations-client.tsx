"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReceiptsClient } from "@/components/receipts/receipts-client";
import { DeliveriesClient } from "@/components/deliveries/deliveries-client";
import { TransfersClient } from "@/components/transfers/transfers-client";
import { AdjustmentsClient } from "@/components/adjustments/adjustments-client";
import {
  ReceiptsIcon,
  DeliveriesIcon,
  TransfersIcon,
  AdjustmentsIcon,
  PackageIcon,
} from "@/components/ui/icons";
import type {
  ReceiptDetailRow,
  DeliveryDetailRow,
  TransferDetailRow,
  AdjustmentDetailRow,
  ProductRow,
  InventoryRow,
} from "@/lib/db/queries";

interface OperationsClientProps {
  receipts: ReceiptDetailRow[];
  deliveries: DeliveryDetailRow[];
  transfers: TransferDetailRow[];
  adjustments: AdjustmentDetailRow[];
  products: ProductRow[];
  inventory: InventoryRow[];
  nextReceiptRef: string;
  nextDeliveryRef: string;
  nextTransferRef: string;
  nextAdjustmentRef: string;
}

type TabType = "receipts" | "deliveries" | "transfers" | "adjustments";

function OperationsContent({
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
}: OperationsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryType = searchParams.get("type") as TabType | null;
  const initialTab: TabType =
    queryType && ["receipts", "deliveries", "transfers", "adjustments"].includes(queryType)
      ? queryType
      : "receipts";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    if (queryType && ["receipts", "deliveries", "transfers", "adjustments"].includes(queryType)) {
      setActiveTab(queryType as TabType);
    }
  }, [queryType]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/operations?type=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Header & Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <PackageIcon className="h-6 w-6 text-amber-400" />
            Operations Workspace
          </h2>
          <p className="mt-1 text-xs text-zinc-400 font-mono">
            Unified inventory operations hub. Select a tab to manage Receipts, Deliveries, Transfers, or Adjustments.
          </p>
        </div>

        {/* Top-Level Tabs */}
        <div className="flex items-center rounded-lg bg-zinc-950 p-1 border border-zinc-800 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => handleTabChange("receipts")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 transition ${
              activeTab === "receipts"
                ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ReceiptsIcon className="h-4 w-4 text-emerald-400" />
            <span>Receipts</span>
            <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-300">
              {receipts.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("deliveries")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 transition ${
              activeTab === "deliveries"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <DeliveriesIcon className="h-4 w-4 text-amber-400" />
            <span>Deliveries</span>
            <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-300">
              {deliveries.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("transfers")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 transition ${
              activeTab === "transfers"
                ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <TransfersIcon className="h-4 w-4 text-sky-400" />
            <span>Transfers</span>
            <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-300">
              {transfers.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("adjustments")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 transition ${
              activeTab === "adjustments"
                ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <AdjustmentsIcon className="h-4 w-4 text-purple-400" />
            <span>Adjustments</span>
            <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-300">
              {adjustments.length}
            </span>
          </button>
        </div>
      </div>

      {/* Operation View Content */}
      {activeTab === "receipts" && (
        <ReceiptsClient
          receipts={receipts}
          products={products}
          inventory={inventory}
          nextReference={nextReceiptRef}
        />
      )}

      {activeTab === "deliveries" && (
        <DeliveriesClient
          deliveries={deliveries}
          products={products}
          inventory={inventory}
          nextReference={nextDeliveryRef}
        />
      )}

      {activeTab === "transfers" && (
        <TransfersClient
          transfers={transfers}
          products={products}
          inventory={inventory}
          nextReference={nextTransferRef}
        />
      )}

      {activeTab === "adjustments" && (
        <AdjustmentsClient
          adjustments={adjustments}
          products={products}
          inventory={inventory}
          nextReference={nextAdjustmentRef}
        />
      )}
    </div>
  );
}

export function OperationsClient(props: OperationsClientProps) {
  return (
    <Suspense fallback={<div className="text-sm font-mono text-zinc-400">Loading operations...</div>}>
      <OperationsContent {...props} />
    </Suspense>
  );
}
