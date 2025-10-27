"use client";

import { useMemo } from "react";
import { useDataContext } from "@/context/DataContext";
import { calculateOrderTotals, formatCurrency } from "@/lib/utils";

const bgVariants = [
  "bg-gradient-to-r from-orange-200 to-orange-100",
  "bg-gradient-to-r from-emerald-200 to-emerald-100",
  "bg-gradient-to-r from-blue-200 to-blue-100",
  "bg-gradient-to-r from-purple-200 to-purple-100",
];

export const OverviewCards = () => {
  const { orders, invoices, expenses, products, dailyRevenue, weeklyRevenue, monthlyRevenue } = useDataContext();

  const totalRevenue = useMemo(
    () =>
      orders.reduce((sum, order) => {
        const { netAmount } = calculateOrderTotals(order);
        return sum + netAmount;
      }, 0),
    [orders],
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const totalInvoicesOutstanding = useMemo(
    () => invoices.filter((invoice) => !invoice.paid).reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    [invoices],
  );

  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + product.stock, 0),
    [products],
  );

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      subtext: `Today ${formatCurrency(dailyRevenue)} • Week ${formatCurrency(weeklyRevenue)} • Month ${formatCurrency(monthlyRevenue)}`,
    },
    {
      title: "Outstanding Invoices",
      value: formatCurrency(totalInvoicesOutstanding),
      subtext: `${invoices.filter((invoice) => !invoice.paid).length} invoices pending`,
    },
    {
      title: "Current Inventory",
      value: `${totalStock} units`,
      subtext: `${products.length} khakhra SKUs being tracked`,
    },
    {
      title: "Operational Expenses",
      value: formatCurrency(totalExpenses),
      subtext: `${expenses.length} expenses logged this cycle`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <div key={card.title} className={`${bgVariants[index % bgVariants.length]} rounded-xl p-5 shadow-sm`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">{card.title}</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-900">{card.value}</h3>
          <p className="mt-2 text-xs font-medium text-slate-600">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
};
