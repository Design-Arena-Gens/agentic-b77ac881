"use client";

import dynamic from "next/dynamic";
import { useMemo, type ComponentType } from "react";
import { useDataContext } from "@/context/DataContext";
import { calculateOrderTotals, formatCurrency } from "@/lib/utils";

const ResponsiveContainer = dynamic(
  async () => (await import("recharts")).ResponsiveContainer,
  { ssr: false },
);
const LineChart = dynamic(async () => (await import("recharts")).LineChart, { ssr: false });
const Line = dynamic(async () => (await import("recharts")).Line, { ssr: false });
const XAxis = dynamic(async () => (await import("recharts")).XAxis, { ssr: false });
const YAxis = dynamic(async () => (await import("recharts")).YAxis, { ssr: false });
const CartesianGrid = dynamic(async () => (await import("recharts")).CartesianGrid, { ssr: false });
const Tooltip = dynamic(async () => (await import("recharts")).Tooltip, { ssr: false });
const Legend = dynamic(
  async () => (await import("recharts")).Legend as unknown as ComponentType<Record<string, unknown>>,
  { ssr: false },
);
const BarChart = dynamic(async () => (await import("recharts")).BarChart, { ssr: false });
const Bar = dynamic(async () => (await import("recharts")).Bar, { ssr: false });

export const SalesPerformanceChart = () => {
  const { orders, products, invoices, expenses } = useDataContext();

  const revenueTrend = useMemo(() => {
    const grouped = new Map<string, { revenue: number; orders: number }>();
    orders.forEach((order) => {
      const dateKey = new Date(order.orderDate).toLocaleDateString("en-IN");
      const { netAmount } = calculateOrderTotals(order);
      const current = grouped.get(dateKey) ?? { revenue: 0, orders: 0 };
      grouped.set(dateKey, {
        revenue: current.revenue + netAmount,
        orders: current.orders + 1,
      });
    });
    return Array.from(grouped.entries()).map(([date, value]) => ({
      date,
      revenue: value.revenue,
      orders: value.orders,
    }));
  }, [orders]);

  const productPerformance = useMemo(() => {
    const totals = new Map<
      string,
      { name: string; units: number; revenue: number; repeatCustomers: number }
    >();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) return;
        const current = totals.get(item.productId) ?? {
          name: product.name,
          units: 0,
          revenue: 0,
          repeatCustomers: 0,
        };
        const { taxableValue } = calculateOrderTotals(order);
        totals.set(item.productId, {
          name: product.name,
          units: current.units + item.quantity,
          revenue: current.revenue + taxableValue,
          repeatCustomers: current.repeatCustomers + (item.quantity >= 10 ? 1 : 0),
        });
      });
    });
    return Array.from(totals.values()).sort((a, b) => b.units - a.units);
  }, [orders, products]);

  const paymentSplit = useMemo(() => {
    const payments = new Map<string, number>();
    orders.forEach((order) => {
      const { netAmount } = calculateOrderTotals(order);
      payments.set(order.paymentMethod, (payments.get(order.paymentMethod) ?? 0) + netAmount);
    });
    return Array.from(payments.entries()).map(([mode, amount]) => ({
      mode,
      amount,
    }));
  }, [orders]);

  const outstandingAging = useMemo(() => {
    const buckets = {
      current: 0,
      upTo15: 0,
      upTo30: 0,
      above30: 0,
    };
    const nowTimestamp = new Date().getTime();
    invoices
      .filter((invoice) => !invoice.paid)
      .forEach((invoice) => {
        const diffDays = Math.floor(
          (nowTimestamp - new Date(invoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays <= 0) buckets.current += invoice.totalAmount;
        else if (diffDays <= 15) buckets.upTo15 += invoice.totalAmount;
        else if (diffDays <= 30) buckets.upTo30 += invoice.totalAmount;
        else buckets.above30 += invoice.totalAmount;
      });
    return [
      { bucket: "Current", amount: buckets.current },
      { bucket: "1-15 Days", amount: buckets.upTo15 },
      { bucket: "16-30 Days", amount: buckets.upTo30 },
      { bucket: "30+ Days", amount: buckets.above30 },
    ];
  }, [invoices]);

  const netProfit = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + calculateOrderTotals(order).netAmount, 0);
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return totalRevenue - totalExpense;
  }, [orders, expenses]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Revenue Trend</h3>
            <p className="text-xs text-slate-500">
              Monitor daily sales velocity, repeat orders and fulfillment momentum.
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Net Profit {formatCurrency(netProfit)}
          </span>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5F5" />
              <XAxis dataKey="date" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip
                formatter={(value: number | string | Array<number | string>) => {
                  const resolvedValue = Array.isArray(value)
                    ? Number(value[0])
                    : typeof value === "number"
                      ? value
                      : Number(value);
                  return formatCurrency(resolvedValue);
                }}
                labelStyle={{ color: "#1e293b", fontWeight: 600 }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={3} />
              <Line type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Payment Mix</h3>
          <ul className="mt-4 space-y-3">
            {paymentSplit.map((item) => (
              <li key={item.mode} className="flex items-center justify-between text-sm font-medium text-slate-700">
                <span>{item.mode}</span>
                <span>{formatCurrency(item.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Invoice Aging</h3>
          <div className="mt-4 h-48">
            <ResponsiveContainer>
              <BarChart data={outstandingAging} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5F5" />
                <XAxis type="number" stroke="#475569" />
                <YAxis dataKey="bucket" type="category" stroke="#475569" />
                <Tooltip
                  formatter={(value: number | string | Array<number | string>) => {
                    const resolvedValue = Array.isArray(value)
                      ? Number(value[0])
                      : typeof value === "number"
                        ? value
                        : Number(value);
                    return formatCurrency(resolvedValue);
                  }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Product Velocity</h3>
            <p className="text-xs text-slate-500">
              Tracks movement of each flavour, factoring in repeat orders beyond 10 packs.
            </p>
          </div>
          <span className="text-xs font-semibold text-orange-500">Demand Forecast</span>
        </div>
        <div className="mt-6 h-72">
          <ResponsiveContainer>
            <BarChart data={productPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5F5" />
              <XAxis dataKey="name" interval={0} angle={-10} textAnchor="end" height={60} stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip
                formatter={(value: number | string | Array<number | string>) => {
                  const resolvedValue = Array.isArray(value)
                    ? Number(value[0])
                    : typeof value === "number"
                      ? value
                      : Number(value);
                  return formatCurrency(resolvedValue);
                }}
              />
              <Legend />
              <Bar dataKey="units" name="Units Sold" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="repeatCustomers" name="Repeat Indicators" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
