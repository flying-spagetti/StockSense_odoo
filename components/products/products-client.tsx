"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { createProduct, updateProduct } from "@/app/actions/products";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  AlertTriangleIcon,
  XIcon,
  FilterIcon,
  PackageIcon,
} from "@/components/ui/icons";
import type { InventoryRow } from "@/lib/db/queries";
import { SmartFilterBar } from "@/components/ui/smart-filter-bar";

interface ProductsClientProps {
  products: InventoryRow[];
}

export function ProductsClient({ products }: ProductsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStockFilter, setSelectedStockFilter] = useState("all");
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryRow | null>(null);

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

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
      {/* Metrics Row */}
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
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Reorder Alerts</p>
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
          placeholder="Search by SKU or product name..."
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

      {/* Products Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font.medium">Product</th>
                <th scope="col" className="px-4 py-3 font-medium">SKU</th>
                <th scope="col" className="px-4 py-3 font-medium">Category</th>
                <th scope="col" className="px-4 py-3 font-medium">UoM</th>
                <th scope="col" className="px-4 py-3 font-medium">Reorder Level</th>
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

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-zinc-800/40"
                    >
                      {/* Product Name */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{product.name}</div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <span className="inline-block rounded bg-zinc-950 px-2 py-0.5 border border-zinc-800 text-zinc-300 font-medium">
                          {product.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-xs">
                        <span className="inline-block rounded-full bg-zinc-800 px-2.5 py-0.5 text-zinc-300 font-medium border border-zinc-700/60">
                          {product.category || "General"}
                        </span>
                      </td>

                      {/* UoM */}
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-400">
                        {product.unit}
                      </td>

                      {/* Reorder Level */}
                      <td className="px-4 py-3.5 text-xs font-mono">
                        <span className="text-zinc-300 font-medium">{product.reorderLevel}</span>
                      </td>

                      {/* Total Available (Derived) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
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

                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400" title="Stock at or below reorder level">
                              <AlertTriangleIcon className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Low</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-2">
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
            Total Available derived from done stock movements
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
    </div>
  );
}
