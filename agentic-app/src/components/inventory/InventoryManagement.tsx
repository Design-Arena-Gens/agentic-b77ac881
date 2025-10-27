"use client";

import { useMemo, useState } from "react";
import { useDataContext } from "@/context/DataContext";
import { formatCurrency } from "@/lib/utils";

export const InventoryManagement = () => {
  const {
    products,
    rawMaterials,
    lowStockProducts,
    lowStockRawMaterials,
    createProduct,
    updateProductStock,
    createRawMaterial,
    updateRawMaterialQuantity,
    productionBatches,
    createProductionBatch,
    userProfile,
  } = useDataContext();

  const [finishedGoodForm, setFinishedGoodForm] = useState({
    name: "",
    category: "Classic",
    unitPrice: 60,
    costPerUnit: 32,
    stock: 100,
    reorderLevel: 50,
  });

  const [rawMaterialForm, setRawMaterialForm] = useState({
    name: "",
    unit: "kg",
    quantity: 50,
    reorderLevel: 25,
    unitCost: 50,
  });

  const [productionForm, setProductionForm] = useState({
    productId: products[0]?.id ?? "",
    quantityProduced: 100,
    productionDate: new Date().toISOString().slice(0, 10),
  });

  const canEdit = userProfile?.role === "Admin" || userProfile?.role === "Staff";
  const canViewCosting = userProfile?.role === "Admin" || userProfile?.role === "Accountant";

  const rawMaterialCost = useMemo(
    () => rawMaterials.reduce((sum, material) => sum + material.quantity * material.unitCost, 0),
    [rawMaterials],
  );

  const finishedGoodsValue = useMemo(
    () => products.reduce((sum, product) => sum + product.stock * product.costPerUnit, 0),
    [products],
  );

  return (
    <section id="inventory" className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">Inventory & Production</h2>
        <p className="text-sm text-slate-500">
          Manage raw materials, finished goods, replenishment cycles and batch production runs.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Finished Goods</h3>
            {canViewCosting && (
              <span className="text-xs font-semibold text-slate-500">
                Inventory Value {formatCurrency(finishedGoodsValue)}
              </span>
            )}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-700">{product.name}</td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(product.unitPrice)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {canViewCosting ? formatCurrency(product.costPerUnit) : "Restricted"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      <span className={product.stock <= product.reorderLevel ? "text-red-500" : ""}>
                        {product.stock}
                      </span>
                      {canEdit && (
                        <div className="mt-2">
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(event) => updateProductStock(product.id, parseInt(event.target.value) || 0)}
                            className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Raw Materials</h3>
            {canViewCosting && (
              <span className="text-xs font-semibold text-slate-500">On-Hand Value {formatCurrency(rawMaterialCost)}</span>
            )}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-700">{material.name}</td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {material.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {canViewCosting ? formatCurrency(material.unitCost) : "Restricted"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      <span className={material.quantity <= material.reorderLevel ? "text-red-500" : ""}>
                        {material.quantity}
                      </span>
                      {canEdit && (
                        <div className="mt-2">
                          <input
                            type="number"
                            value={material.quantity}
                            onChange={(event) =>
                              updateRawMaterialQuantity(material.id, parseInt(event.target.value) || 0)
                            }
                            className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(lowStockProducts.length > 0 || lowStockRawMaterials.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            Low Stock Alerts
          </h3>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-amber-600">
            {lowStockProducts.map((product) => (
              <span key={product.id} className="rounded-full bg-white px-3 py-1">
                {product.name} • {product.stock} units left
              </span>
            ))}
            {lowStockRawMaterials.map((material) => (
              <span key={material.id} className="rounded-full bg-white px-3 py-1">
                {material.name} • {material.quantity} {material.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {canEdit && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Add Finished Good</h3>
            <div className="mt-4 space-y-3 text-sm">
              <input
                placeholder="Name"
                value={finishedGoodForm.name}
                onChange={(event) => setFinishedGoodForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <select
                value={finishedGoodForm.category}
                onChange={(event) =>
                  setFinishedGoodForm((prev) => ({ ...prev, category: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option>Classic</option>
                <option>Premium</option>
                <option>Diet</option>
                <option>Fusion</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Selling Price"
                  value={finishedGoodForm.unitPrice}
                  onChange={(event) =>
                    setFinishedGoodForm((prev) => ({ ...prev, unitPrice: parseFloat(event.target.value) || 0 }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <input
                  type="number"
                  placeholder="Cost per Unit"
                  value={finishedGoodForm.costPerUnit}
                  onChange={(event) =>
                    setFinishedGoodForm((prev) => ({ ...prev, costPerUnit: parseFloat(event.target.value) || 0 }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Stock"
                  value={finishedGoodForm.stock}
                  onChange={(event) =>
                    setFinishedGoodForm((prev) => ({ ...prev, stock: parseInt(event.target.value) || 0 }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <input
                  type="number"
                  placeholder="Reorder Level"
                  value={finishedGoodForm.reorderLevel}
                  onChange={(event) =>
                    setFinishedGoodForm((prev) => ({ ...prev, reorderLevel: parseInt(event.target.value) || 0 }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!finishedGoodForm.name.trim()) return;
                  createProduct(finishedGoodForm);
                  setFinishedGoodForm({
                    name: "",
                    category: "Classic",
                    unitPrice: 60,
                    costPerUnit: 32,
                    stock: 100,
                    reorderLevel: 50,
                  });
                }}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Save Product
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Add Raw Material</h3>
            <div className="mt-4 space-y-3 text-sm">
              <input
                placeholder="Material Name"
                value={rawMaterialForm.name}
                onChange={(event) => setRawMaterialForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  placeholder="Unit"
                  value={rawMaterialForm.unit}
                  onChange={(event) =>
                    setRawMaterialForm((prev) => ({ ...prev, unit: event.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={rawMaterialForm.quantity}
                  onChange={(event) =>
                    setRawMaterialForm((prev) => ({ ...prev, quantity: parseFloat(event.target.value) || 0 }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <input
                  type="number"
                  placeholder="Reorder"
                  value={rawMaterialForm.reorderLevel}
                  onChange={(event) =>
                    setRawMaterialForm((prev) => ({ ...prev, reorderLevel: parseFloat(event.target.value) || 0 }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <input
                type="number"
                placeholder="Unit Cost"
                value={rawMaterialForm.unitCost}
                onChange={(event) =>
                  setRawMaterialForm((prev) => ({ ...prev, unitCost: parseFloat(event.target.value) || 0 }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <button
                type="button"
                onClick={() => {
                  if (!rawMaterialForm.name.trim()) return;
                  createRawMaterial(rawMaterialForm);
                  setRawMaterialForm({
                    name: "",
                    unit: "kg",
                    quantity: 50,
                    reorderLevel: 25,
                    unitCost: 50,
                  });
                }}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Save Material
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Log Production Batch</h3>
            <div className="mt-4 space-y-3 text-sm">
              <select
                value={productionForm.productId}
                onChange={(event) =>
                  setProductionForm((prev) => ({ ...prev, productId: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Quantity Produced"
                  value={productionForm.quantityProduced}
                  onChange={(event) =>
                    setProductionForm((prev) => ({
                      ...prev,
                      quantityProduced: parseInt(event.target.value) || 0,
                    }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <input
                  type="date"
                  value={productionForm.productionDate}
                  onChange={(event) =>
                    setProductionForm((prev) => ({
                      ...prev,
                      productionDate: event.target.value,
                    }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!productionForm.productId) return;
                  createProductionBatch({
                    productId: productionForm.productId,
                    quantityProduced: productionForm.quantityProduced,
                    productionDate: new Date(productionForm.productionDate).toISOString(),
                    rawMaterialUsage: [],
                  });
                }}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Record Batch
              </button>
            </div>
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recent Batches
              </h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {productionBatches.slice(-3).map((batch) => {
                  const product = products.find((candidate) => candidate.id === batch.productId);
                  return (
                    <li key={batch.id} className="rounded-md bg-slate-100 px-3 py-2">
                      {product?.name} • {batch.quantityProduced} units •{" "}
                      {new Date(batch.productionDate).toLocaleDateString("en-IN")}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
