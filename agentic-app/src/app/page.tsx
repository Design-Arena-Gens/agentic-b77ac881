import { AppShell } from "@/components/AppShell";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { SalesPerformanceChart } from "@/components/dashboard/SalesPerformanceChart";
import { OrderManagement } from "@/components/orders/OrderManagement";
import { InventoryManagement } from "@/components/inventory/InventoryManagement";
import { BillingInvoicing } from "@/components/billing/BillingInvoicing";
import { ExpenseManagement } from "@/components/finance/ExpenseManagement";
import { ProfitLossSummary } from "@/components/finance/ProfitLossSummary";
import { SalesInsights } from "@/components/analytics/SalesInsights";
import { DataExports } from "@/components/reports/DataExports";

export default function Home() {
  return (
    <AppShell>
      <section id="dashboard" className="space-y-8">
        <OverviewCards />
        <SalesInsights />
        <SalesPerformanceChart />
      </section>
      <div className="mt-12 space-y-12">
        <OrderManagement />
        <InventoryManagement />
        <BillingInvoicing />
        <ExpenseManagement />
        <ProfitLossSummary />
        <DataExports />
      </div>
    </AppShell>
  );
}
