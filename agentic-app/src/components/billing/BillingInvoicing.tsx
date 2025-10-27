"use client";

import { useMemo, useState } from "react";
import { useDataContext } from "@/context/DataContext";
import { calculateOrderTotals, findCustomer, formatCurrency, formatDate } from "@/lib/utils";

export const BillingInvoicing = () => {
  const { orders, invoices, createInvoice, customers, userProfile } = useDataContext();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id ?? "");
  const [gstNumber, setGstNumber] = useState("24ABCDE1234F1Z5");
  const [dueDate, setDueDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 10),
  );

  const canCreateInvoice = userProfile?.role === "Admin" || userProfile?.role === "Accountant";

  const orderToInvoice = useMemo(
    () => orders.find((order) => order.id === selectedOrderId),
    [orders, selectedOrderId],
  );

  const totals = orderToInvoice ? calculateOrderTotals(orderToInvoice) : null;

  const handleCreateInvoice = () => {
    if (!orderToInvoice || !totals) return;
    createInvoice({
      orderId: orderToInvoice.id,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      gstNumber,
      totalAmount: totals.netAmount,
      cgst: totals.tax / 2,
      sgst: totals.tax / 2,
      igst: 0,
      paid: false,
    });
  };

  return (
    <section id="billing" className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">Billing & GST Invoicing</h2>
        <p className="text-sm text-slate-500">
          Issue GST-ready invoices with auto tax breakup, payment tracking and compliance history.
        </p>
      </header>

      {canCreateInvoice && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Generate Invoice</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Order
              <select
                value={selectedOrderId}
                onChange={(event) => setSelectedOrderId(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.id.toUpperCase()} • {formatCurrency(calculateOrderTotals(order).netAmount)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              GST Number
              <input
                value={gstNumber}
                onChange={(event) => setGstNumber(event.target.value.toUpperCase())}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due Date
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
          </div>

          {orderToInvoice && totals && (
            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary
              </h4>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Taxable Value</p>
                  <p className="text-lg font-semibold text-slate-800">{formatCurrency(totals.taxableValue)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CGST</p>
                  <p className="text-lg font-semibold text-slate-800">{formatCurrency(totals.tax / 2)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SGST</p>
                  <p className="text-lg font-semibold text-slate-800">{formatCurrency(totals.tax / 2)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Grand Total</p>
                  <p className="text-lg font-semibold text-slate-800">{formatCurrency(totals.netAmount)}</p>
                </div>
              </div>
              <div className="mt-4">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Line Items</h5>
                <ul className="mt-2 space-y-1">
                  {orderToInvoice.items.map((item, index) => (
                    <li key={index} className="flex justify-between text-xs text-slate-600">
                      <span>{item.productId}</span>
                      <span>
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateInvoice}
            className="mt-6 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Issue Invoice
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Invoice Ledger</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">GST Breakdown</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => {
                const order = orders.find((candidate) => candidate.id === invoice.orderId);
                const customer = order ? findCustomer(customers, order.customerId) : undefined;
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      <span>{invoice.id.toUpperCase()}</span>
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          invoice.paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {invoice.paid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p className="font-semibold">{customer?.name ?? "Unknown Customer"}</p>
                      <p>{customer?.phone ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>Invoice: {formatDate(invoice.invoiceDate)}</p>
                      <p>Due: {formatDate(invoice.dueDate)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>CGST: {formatCurrency(invoice.cgst)}</p>
                      <p>SGST: {formatCurrency(invoice.sgst)}</p>
                      {invoice.igst > 0 && <p>IGST: {formatCurrency(invoice.igst)}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      {formatCurrency(invoice.totalAmount)}
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
