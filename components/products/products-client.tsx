"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { createProduct, updateProduct } from "@/app/actions/products";
import { createReceipt } from "@/app/actions/receipts";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  AlertTriangleIcon,
  XIcon,
  FilterIcon,
  PackageIcon,
  CheckCircleIcon,
  ReceiptsIcon,
} from "@/components/ui/icons";
import type { InventoryRow, WarehouseRow, MoveHistoryRow } from "@/lib/db/queries";
import { SmartFilterBar } from "@/components/ui/smart-filter-bar";

interface ProductsClientProps {
  products: InventoryRow[];
  warehouses?: WarehouseRow[];
  movements?: MoveHistoryRow[];
  nextReceiptRef?: string;
}

export function ProductsClient({
  products,
  warehouses = [],
  movements = [],
  nextReceiptRef = "WH/IN/0001",
}: ProductsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockFilter, setSelectedStockFilter] = useState("all");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryRow | null>(null);
  const [locationBreakdownProduct, setLocationBreakdownProduct] = useState<InventoryRow | null>(null);
  const [reorderProduct, setReorderProduct] = useState<InventoryRow | null>(null);

  // Extract all active locations across warehouses
  const allLocations = useMemo(() => {
    const locs: { id: string; label: string; warehouseName: string }[] = [];
    warehouses.forEach((wh) => {
      if (wh.isActive) {
        wh.locations.forEach((loc) => {
          locs.push({
            id: loc,
            label: `${loc} (${wh.name})`,
            warehouseName: wh.name,
          });
        });
      }
    });

    if (locs.length === 0) {
      return [
        { id: "WH/Stock", label: "WH/Stock (Main Warehouse)", warehouseName: "Main Warehouse" },
        { id: "Production Floor", label: "Production Floor (Main Warehouse)", warehouseName: "Main Warehouse" },
        { id: "Packaging Zone", label: "Packaging Zone (Main Warehouse)", warehouseName: "Main Warehouse" },
        { id: "SF/Stock", label: "SF/Stock (San Francisco Hub)", warehouseName: "San Francisco Hub" },
        { id: "SF/Receiving", label: "SF/Receiving (San Francisco Hub)", warehouseName: "San Francisco Hub" },
      ];
    }

    return locs;
  }, [warehouses]);

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Calculate location-by-location stock availability breakdown for all products
  const productLocationStockMap = useMemo(() => {
    const map = new Map<string, { locationId: string; warehouseName: string; onHand: number }[]>();

    products.forEach((prod) => {
      const doneMoves = movements.filter(
        (m) => m.productId === prod.id && m.status === "done"
      );

      const breakdown = allLocations.map((loc) => {
        const stock = doneMoves.reduce((acc, m) => {
          if (m.toLocationId === loc.id) return acc + m.quantity;
          if (m.fromLocationId === loc.id) return acc - m.quantity;
          return acc;
        }, 0);

        return {
          locationId: loc.id,
          warehouseName: loc.warehouseName,
          onHand: Math.max(0, stock),
        };
      });

      map.set(prod.id, breakdown);
    });

    return map;
  }, [products, movements, allLocations]);

  // Filter products based on search term, category, and stock filter
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Text search
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        (product.category && product.category.toLowerCase().includes(q));

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      // Stock status filter
      let matchesStock = true;
      if (selectedStockFilter === "reorder") {
        matchesStock = product.onHand <= product.reorderLevel;
      } else if (selectedStockFilter === "instock") {
        matchesStock = product.onHand > product.reorderLevel;
      } else if (selectedStockFilter === "zero") {
        matchesStock = product.onHand === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, selectedCategory, selectedStockFilter]);

  // Summary Metrics
  const totalSkus = products.length;
  const totalDerivedStock = products.reduce((acc, curr) => acc + curr.onHand, 0);
  const reorderCount = products.filter((p) => p.onHand <= p.reorderLevel).length;

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Products</p>
            <p className="mt-1 text-2xl font-bold font-mono text-white">{totalSkus}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
            <PackageIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Derived Stock</p>
            <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">{totalDerivedStock} units</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="font-mono text-xs font-bold">SUM</span>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-amber-400">Reordering Rules Triggered</p>
            <p className={`mt-1 text-2xl font-bold font-mono ${reorderCount > 0 ? "text-amber-400" : "text-zinc-300"}`}>
              {reorderCount} SKUs
            </p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${reorderCount > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-zinc-800 text-zinc-500"}`}>
            <AlertTriangleIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Smart Filter Bar: SKU-search & Smart Filters */}
      <div className="flex flex-col gap-3">
        <SmartFilterBar
          values={{
            search,
            category: selectedCategory,
            stockStatus: selectedStockFilter,
          }}
          onChange={(newVals) => {
            setSearch(newVals.search);
            setSelectedCategory(newVals.category || "all");
            setSelectedStockFilter(newVals.stockStatus || "all");
          }}
          categories={categories}
          showCategoryFilter={true}
          showStockStatusFilter={true}
          showStatusFilter={false}
          placeholder="Search by SKU, product name, or category..."
        />

        <div className="flex justify-end">
          <Button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Main Products Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Product Item</th>
                <th scope="col" className="px-4 py-3 font-medium">SKU</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">Stock per Location</th>
                <th scope="col" className="px-4 py-3 font-medium">Reordering Rule</th>
                <th scope="col" className="px-4 py-3 font-medium">Total Available</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 font-mono text-xs">
                    {products.length === 0 ? (
                      <div>
                        <p className="text-zinc-400 text-sm font-sans mb-1">No products in catalog yet.</p>
                        <p>Click "Add Product" above to create your first item.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-zinc-400 text-sm font-sans mb-1">No matching products found.</p>
                        <p>Try refining your search terms or clearing active filters.</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.onHand <= product.reorderLevel;
                  const isZeroStock = product.onHand === 0;
                  const locBreakdown = productLocationStockMap.get(product.id) || [];
                  const activeLocs = locBreakdown.filter((b) => b.onHand > 0);

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-zinc-800/40"
                    >
                      {/* Product Name */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{product.name}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">UoM: {product.unit}</div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800 text-amber-400 font-bold">
                          {product.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-xs font-mono">
                        <span className="inline-block rounded-full bg-zinc-800 px-2.5 py-0.5 text-zinc-300 font-semibold border border-zinc-700/60">
                          {product.category || "General"}
                        </span>
                      </td>

                      {/* Stock availability per location pill */}
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <button
                          onClick={() => setLocationBreakdownProduct(product)}
                          className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-left text-zinc-300 hover:border-zinc-700 hover:text-white transition"
                          title="Click to view full location stock breakdown"
                        >
                          <span className="h-2 w-2 rounded-full bg-indigo-400" />
                          <span>
                            {activeLocs.length > 0
                              ? `${activeLocs[0].locationId}: ${activeLocs[0].onHand}`
                              : "No Stock in Locations"}
                          </span>
                          {activeLocs.length > 1 && (
                            <span className="text-[10px] text-zinc-400 bg-zinc-900 px-1 rounded">
                              +{activeLocs.length - 1} more
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Reordering Rules Column */}
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-400 text-[11px]">Min:</span>
                            <span className="font-bold text-white">{product.reorderLevel} {product.unit}</span>
                          </div>

                          {isZeroStock ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400 font-bold border border-red-500/30">
                              <AlertTriangleIcon className="h-3 w-3" /> Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300 font-bold border border-amber-500/30">
                              <AlertTriangleIcon className="h-3 w-3" /> Reorder Triggered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 font-bold border border-emerald-500/30">
                              <CheckCircleIcon className="h-3 w-3" /> Healthy Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Available (Derived) */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-bold ${
                            isLowStock
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          <span>{product.onHand}</span>
                          <span className="text-[10px] opacity-75">{product.unit}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {isLowStock && (
                          <button
                            onClick={() => setReorderProduct(product)}
                            className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition"
                            title="Trigger quick replenishment receipt"
                          >
                            <ReceiptsIcon className="h-3.5 w-3.5" />
                            <span>Reorder</span>
                          </button>
                        )}

                        <button
                          onClick={() => setEditingProduct(product)}
                          className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition"
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>

                        <Link
                          href={`/products/${product.id}`}
                          className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-500 transition"
                          title="View product detail page"
                        >
                          Page
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/60 px-4 py-3 font-mono text-xs text-zinc-400">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <span className="hidden sm:inline text-zinc-500">
            Total Available derived from done stock movements across all locations
          </span>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Add New Product</h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Products hold master data. On-hand quantity is derived automatically.
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <ProductForm
              action={createProduct}
              submitLabel="Create Product"
              onSuccess={() => setIsAddOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Edit Product: {editingProduct.name}
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  SKU <span className="text-amber-400">{editingProduct.sku}</span> is locked.
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <ProductForm
              action={updateProduct}
              submitLabel="Save Changes"
              product={editingProduct}
              onSuccess={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}

      {/* Location-by-Location Stock Breakdown Modal */}
      {locationBreakdownProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <PackageIcon className="h-5 w-5 text-indigo-400" />
                  Stock Availability per Location
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {locationBreakdownProduct.name} (<span className="text-amber-400 font-bold">{locationBreakdownProduct.sku}</span>)
                </p>
              </div>
              <button
                onClick={() => setLocationBreakdownProduct(null)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-400">Total Derived On-Hand Stock:</span>
              <span className="text-base font-bold text-emerald-400">
                {locationBreakdownProduct.onHand} {locationBreakdownProduct.unit}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Location breakdown across warehouses:
              </span>
              {(productLocationStockMap.get(locationBreakdownProduct.id) || []).map((loc) => (
                <div
                  key={loc.locationId}
                  className="flex justify-between items-center p-3 rounded-lg border border-zinc-800 bg-zinc-950"
                >
                  <div>
                    <span className="font-bold text-zinc-200 block">{loc.locationId}</span>
                    <span className="text-[10px] text-zinc-500">{loc.warehouseName}</span>
                  </div>
                  <span
                    className={`font-bold px-2.5 py-1 rounded ${
                      loc.onHand > 0
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                    }`}
                  >
                    {loc.onHand} {locationBreakdownProduct.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setLocationBreakdownProduct(null)} variant="secondary">
                Close Breakdown
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Replenish / Reorder Form Modal */}
      {reorderProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <ReceiptsIcon className="h-5 w-5 text-amber-400" />
                  Quick Replenishment Order
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Reorder trigger for {reorderProduct.name} (<span className="text-amber-400 font-bold">{reorderProduct.sku}</span>)
                </p>
              </div>
              <button
                onClick={() => setReorderProduct(null)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangleIcon className="h-4 w-4" /> Reorder Rule Alert
              </p>
              <p className="text-[11px]">
                Current stock ({reorderProduct.onHand} {reorderProduct.unit}) is at or below minimum reorder threshold ({reorderProduct.reorderLevel} {reorderProduct.unit}).
              </p>
            </div>

            <form
              action={async (formData) => {
                await createReceipt({}, formData);
                setReorderProduct(null);
              }}
              className="space-y-3 font-sans"
            >
              <input type="hidden" name="productId" value={reorderProduct.id} />
              <input type="hidden" name="actionType" value="validate" />
              <input type="hidden" name="reference" value={nextReceiptRef} />
              <input type="hidden" name="supplier" value="Automated Reorder Rule" />
              <input type="hidden" name="toLocationId" value="WH/Stock" />

              <Field label="Replenishment Quantity to Receive" htmlFor="quantity">
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  defaultValue={Math.max(20, reorderProduct.reorderLevel * 2)}
                  required
                  className="font-mono bg-zinc-950 border-zinc-700"
                />
              </Field>

              <Field label="Destination Location" htmlFor="destLoc">
                <Input
                  id="destLoc"
                  type="text"
                  defaultValue="WH/Stock (Main Warehouse)"
                  readOnly
                  className="font-mono bg-zinc-950 text-zinc-400 border-zinc-800"
                />
              </Field>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setReorderProduct(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex items-center gap-1.5 font-mono">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Receive Replenishment Now</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
