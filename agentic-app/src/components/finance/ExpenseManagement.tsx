"use client";

import { useMemo, useState } from "react";
import { useDataContext } from "@/context/DataContext";
import { formatCurrency, formatDate } from "@/lib/utils";

const categories = ["Packaging", "Delivery", "Utilities", "Labor", "Marketing", "Miscellaneous"] as const;

type ExpenseFormState = {
  title: string;
  amount: number;
  category: (typeof categories)[number];
  date: string;
  notes: string;
};

export const ExpenseManagement = () => {
  const { expenses, createExpense, userProfile } = useDataContext();
  const [formState, setFormState] = useState<ExpenseFormState>({
    title: "",
    amount: 1000,
    category: categories[0],
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const canEdit = userProfile?.role === "Admin" || userProfile?.role === "Accountant";

  const totalsByCategory = useMemo(() => {
    return expenses.reduce<Record<string, number>>((accumulator, expense) => {
      accumulator[expense.category] = (accumulator[expense.category] ?? 0) + expense.amount;
      return accumulator;
    }, {});
  }, [expenses]);

  const weeklySpend = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return expenses
      .filter((expense) => new Date(expense.date) >= cutoff)
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const monthToDateSpend = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses
      .filter((expense) => new Date(expense.date) >= monthStart)
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  return (
    <section id="expenses" className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">Expense Controls</h2>
        <p className="text-sm text-slate-500">
          Contain manufacturing and logistics costs with category budgets and rolling trends.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Spend Snapshot</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li className="flex justify-between">
              <span>Last 7 days</span>
              <span className="font-semibold text-slate-800">{formatCurrency(weeklySpend)}</span>
            </li>
            <li className="flex justify-between">
              <span>Month-to-date</span>
              <span className="font-semibold text-slate-800">{formatCurrency(monthToDateSpend)}</span>
            </li>
            {categories.map((category) => (
              <li key={category} className="flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{category}</span>
                <span className="text-slate-700">{formatCurrency(totalsByCategory[category] ?? 0)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Expense Ledger</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Expense</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                      <p>{expense.title}</p>
                      {expense.notes && <p className="text-xs text-slate-500">{expense.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {expense.category}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Log New Expense</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
              <input
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
              <select
                value={formState.category}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, category: event.target.value as typeof categories[number] }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
              <input
                type="date"
                value={formState.date}
                onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Amount
              <input
                type="number"
                value={formState.amount}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, amount: parseFloat(event.target.value) || 0 }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
          </div>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes
            <textarea
              value={formState.notes}
              onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              if (!formState.title.trim()) return;
              createExpense({
                title: formState.title,
                amount: formState.amount,
                category: formState.category,
                date: new Date(formState.date).toISOString(),
                notes: formState.notes,
              });
              setFormState({
                title: "",
                amount: 1000,
                category: categories[0],
                date: new Date().toISOString().slice(0, 10),
                notes: "",
              });
            }}
            className="mt-4 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Record Expense
          </button>
        </div>
      )}
    </section>
  );
};
