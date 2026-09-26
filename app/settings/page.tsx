import React from "react";
import { listWarehouses } from "@/lib/db/queries";
import { SettingsClient } from "@/components/settings/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const warehouses = await listWarehouses();

  return <SettingsClient warehouses={warehouses} />;
}
