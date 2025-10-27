"use client";

import { useMemo } from "react";
import { useDataContext } from "@/context/DataContext";
import { calculateOrderTotals, findCustomer, findProduct, formatCurrency } from "@/lib/utils";

export const SalesInsights = () => {
  const { orders, customers, products } = useDataContext();

  const insights = useMemo(() => {
    const customerFrequency = new Map<string, number>();
    const productPopularity = new Map<string, number>();
    const monthWiseRevenue = new Map<string, number>();

    orders.forEach((order) => {
      customerFrequency.set(order.customerId, (customerFrequency.get(order.customerId) ?? 0) + 1);

      order.items.forEach((item) => {
        productPopularity.set(item.productId, (productPopularity.get(item.productId) ?? 0) + item.quantity);
      });

      const { netAmount } = calculateOrderTotals(order);
      const monthKey = new Date(order.orderDate).toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });
      monthWiseRevenue.set(monthKey, (monthWiseRevenue.get(monthKey) ?? 0) + netAmount);
    });

    const topCustomerId = Array.from(customerFrequency.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCustomer = topCustomerId ? findCustomer(customers, topCustomerId) : undefined;

    const repeatCustomers = Array.from(customerFrequency.values()).filter((count) => count > 1).length;
    const repeatRate = customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0;

    const topProducts = Array.from(productPopularity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([productId, units]) => {
        const product = findProduct(products, productId);
        return {
          name: product?.name ?? productId,
          units,
        };
      });

    const seasonalPeak = Array.from(monthWiseRevenue.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      topCustomer,
      repeatRate,
      topProducts,
      seasonalPeak: seasonalPeak ? { period: seasonalPeak[0], revenue: seasonalPeak[1] } : null,
      averageOrderValue:
        orders.length > 0 ? orders.reduce((sum, order) => sum + calculateOrderTotals(order).netAmount, 0) / orders.length : 0,
    };
  }, [orders, customers, products]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" id="analytics">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Sales Analytics</h2>
          <p className="text-sm text-slate-500">Identify growth levers across customers, channels and menus.</p>
        </div>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
          Avg Order {formatCurrency(insights.averageOrderValue)}
        </span>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Customer</p>
          <p className="mt-2 text-lg font-semibold text-slate-800">
            {insights.topCustomer ? insights.topCustomer.name : "Data pending"}
          </p>
          <p className="text-xs text-slate-500">
            Orders placed:{" "}
            {insights.topCustomer
              ? orders.filter((order) => order.customerId === insights.topCustomer?.id).length
              : 0}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Repeat Rate</p>
          <p className="mt-2 text-lg font-semibold text-slate-800">{insights.repeatRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-500">Customers ordering more than once</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seasonal Peak</p>
          <p className="mt-2 text-lg font-semibold text-slate-800">
            {insights.seasonalPeak ? insights.seasonalPeak.period : "NA"}
          </p>
          <p className="text-xs text-slate-500">
            {insights.seasonalPeak ? formatCurrency(insights.seasonalPeak.revenue) : "Awaiting data"}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top SKUs</p>
          <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-700">
            {insights.topProducts.map((product) => (
              <li key={product.name} className="flex justify-between">
                <span>{product.name}</span>
                <span>{product.units} units</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
