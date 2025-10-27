"use client";

import { useMemo, useState } from "react";
import { useDataContext } from "@/context/DataContext";
import {
  calculateCOGSForOrder,
  calculateOrderTotals,
  calculateRevenue,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

const ranges = [
  { label: "Daily", days: 1 },
  { label: "Weekly", days: 7 },
  { label: "Monthly", days: 30 },
  { label: "Quarterly", days: 90 },
];

export const ProfitLossSummary = () => {
  const { orders, products, expenses, grossProfitByOrder } = useDataContext();
  const [range, setRange] = useState(ranges[1]);

  const filteredOrders = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    return orders.filter((order) => new Date(order.orderDate) >= cutoff);
  }, [orders, range]);

  const revenue = useMemo(() => calculateRevenue(filteredOrders), [filteredOrders]);
  const cogs = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + calculateCOGSForOrder(order, products), 0),
    [filteredOrders, products],
  );

  const operatingExpenses = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    return expenses
      .filter((expense) => new Date(expense.date) >= cutoff)
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, range]);

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - operatingExpenses;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return (
    <section id="profit-loss" className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Profit & Loss Control Room</h2>
          <p className="text-sm text-slate-500">
            Understand cost of goods, contribution margins and profitability across horizons.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ranges.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                option.label === range.label
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue</p>
          <p className="mt-3 text-2xl font-semibold text-slate-800">{formatCurrency(revenue)}</p>
          <p className="mt-2 text-xs text-slate-500">Orders: {filteredOrders.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">COGS</p>
          <p className="mt-3 text-2xl font-semibold text-slate-800">{formatCurrency(cogs)}</p>
          <p className="mt-2 text-xs text-slate-500">Raw material & production cost</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operating Expense</p>
          <p className="mt-3 text-2xl font-semibold text-slate-800">{formatCurrency(operatingExpenses)}</p>
          <p className="mt-2 text-xs text-slate-500">Logistics, labor, utilities, etc.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Margin</p>
          <p className="mt-3 text-2xl font-semibold text-emerald-600">{margin.toFixed(1)}%</p>
          <p className="mt-2 text-xs text-slate-500">Net Profit {formatCurrency(netProfit)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Order Level Profitability</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Net Sales</th>
                <th className="px-4 py-3">COGS</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const totals = calculateOrderTotals(order);
                const cogsValue = calculateCOGSForOrder(order, products);
                const gross = grossProfitByOrder[order.id] ?? totals.taxableValue - cogsValue;
                return (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-700">{order.id.toUpperCase()}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(order.orderDate)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(totals.netAmount)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(cogsValue)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">
                      {formatCurrency(gross)}
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
