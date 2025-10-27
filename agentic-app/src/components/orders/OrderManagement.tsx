"use client";

import { Fragment, useMemo, useState } from "react";
import { useDataContext } from "@/context/DataContext";
import { calculateOrderTotals, findCustomer, findProduct, formatCurrency, formatDate } from "@/lib/utils";
import { OrderItem, OrderStatus } from "@/lib/types";

const orderStatuses: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export const OrderManagement = () => {
  const { orders, customers, products, createOrder, updateOrderStatus, userProfile } = useDataContext();
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "All">("All");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id ?? "");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { productId: products[0]?.id ?? "", quantity: 5, unitPrice: products[0]?.unitPrice ?? 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0.12);
  const [expectedShipDate, setExpectedShipDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().slice(0, 10),
  );
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card" | "Net Banking">("UPI");
  const canEdit = userProfile?.role === "Admin" || userProfile?.role === "Staff";

  const filteredOrders = useMemo(
    () => (filterStatus === "All" ? orders : orders.filter((order) => order.status === filterStatus)),
    [orders, filterStatus],
  );

  const handleAddItem = () => {
    if (!products.length) return;
    setOrderItems((prev) => [...prev, { productId: products[0].id, quantity: 5, unitPrice: products[0].unitPrice }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const totals = useMemo(
    () =>
      orderItems.reduce(
        (acc, item) => {
          const product = findProduct(products, item.productId);
          if (!product) return acc;
          const lineTotal = item.quantity * item.unitPrice;
          return {
            subtotal: acc.subtotal + lineTotal,
            cogs: acc.cogs + product.costPerUnit * item.quantity,
          };
        },
        { subtotal: 0, cogs: 0 },
      ),
    [orderItems, products],
  );

  const tax = (totals.subtotal - discount) * taxRate;
  const netAmount = totals.subtotal - discount + tax;
  const grossProfit = totals.subtotal - discount - totals.cogs;

  const handleCreateOrder = () => {
    if (!selectedCustomerId || !orderItems.length) return;
    createOrder({
      customerId: selectedCustomerId,
      items: orderItems,
      status: "Pending",
      orderDate: new Date().toISOString(),
      expectedShipDate: new Date(expectedShipDate).toISOString(),
      discount,
      taxRate,
      paymentMethod,
    });
    setOrderItems([{ productId: products[0]?.id ?? "", quantity: 5, unitPrice: products[0]?.unitPrice ?? 0 }]);
    setDiscount(0);
  };

  return (
    <section id="orders" className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Customer Order Management</h2>
          <p className="text-sm text-slate-500">
            Track marketplace, B2B and website orders end-to-end with fulfilment visibility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Filter Status</span>
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as OrderStatus | "All")}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <option value="All">All</option>
            {orderStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </header>

      {canEdit && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Create New Order</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium text-slate-600">
              Customer
              <select
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Expected Ship Date
              <input
                type="date"
                value={expectedShipDate}
                onChange={(event) => setExpectedShipDate(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Payment Method
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Net Banking</option>
              </select>
            </label>
          </div>

          <div className="mt-6 space-y-4">
            {orderItems.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
                  Product
                  <select
                    value={item.productId}
                    onChange={(event) => {
                      const productId = event.target.value;
                      const product = findProduct(products, productId);
                      setOrderItems((prev) =>
                        prev.map((candidate, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...candidate,
                                productId,
                                unitPrice: product?.unitPrice ?? candidate.unitPrice,
                              }
                            : candidate,
                        ),
                      );
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.stock} in stock)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quantity
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => {
                      const quantity = parseInt(event.target.value) || 0;
                      setOrderItems((prev) =>
                        prev.map((candidate, itemIndex) =>
                          itemIndex === index ? { ...candidate, quantity } : candidate,
                        ),
                      );
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Unit Price
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(event) => {
                      const unitPrice = parseFloat(event.target.value) || 0;
                      setOrderItems((prev) =>
                        prev.map((candidate, itemIndex) =>
                          itemIndex === index ? { ...candidate, unitPrice } : candidate,
                        ),
                      );
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                </label>
                <div className="flex items-end justify-between">
                  <span className="text-sm font-semibold text-slate-600">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-xs font-semibold uppercase tracking-wide text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleAddItem}
                className="rounded-md border border-dashed border-orange-400 px-4 py-2 text-sm font-semibold text-orange-500"
              >
                Add Item
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <label className="text-sm font-medium text-slate-600">
              Discount (₹)
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(event) => setDiscount(parseFloat(event.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              GST Rate
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={taxRate}
                onChange={(event) => setTaxRate(parseFloat(event.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gross Profit</p>
              <p className="mt-2 text-lg font-semibold text-emerald-600">{formatCurrency(grossProfit)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Amount</p>
              <p className="mt-2 text-lg font-semibold text-slate-700">{formatCurrency(netAmount)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateOrder}
            className="mt-6 w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 md:w-auto"
          >
            Save Order
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Live Orders</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const customer = findCustomer(customers, order.customerId);
                const totals = calculateOrderTotals(order);
                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      <span>{order.id.toUpperCase()}</span>
                      <p className="text-xs font-normal text-slate-500">{formatDate(order.orderDate)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <p className="font-semibold">{customer?.name ?? "Walk-in Customer"}</p>
                      <p className="text-xs">{customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                      {order.items.map((item, index) => {
                        const product = findProduct(products, item.productId);
                        return (
                          <Fragment key={`${item.productId}-${index}`}>
                            <div className="flex justify-between">
                              <span>{product?.name}</span>
                              <span>
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </span>
                            </div>
                          </Fragment>
                        );
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>Expected: {order.expectedShipDate ? formatDate(order.expectedShipDate) : "TBC"}</p>
                      {order.deliveredDate && <p>Delivered: {formatDate(order.deliveredDate)}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {canEdit ? (
                        <select
                          value={order.status}
                          onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                        >
                          {orderStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{order.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                      <p>{formatCurrency(totals.netAmount)}</p>
                      <p className="text-[10px] text-slate-400">Margin: {formatCurrency(totals.taxableValue)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
