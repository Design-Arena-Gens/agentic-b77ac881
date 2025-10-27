"use client";

import { useState } from "react";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useDataContext } from "@/context/DataContext";
import { calculateOrderTotals, formatCurrency } from "@/lib/utils";

export const DataExports = () => {
  const { exportData } = useDataContext();
  const [isExporting, setIsExporting] = useState(false);

  const handleExcelExport = () => {
    const payload = exportData();
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.json_to_sheet(payload.orders), "Orders");
    utils.book_append_sheet(workbook, utils.json_to_sheet(payload.invoices), "Invoices");
    utils.book_append_sheet(workbook, utils.json_to_sheet(payload.expenses), "Expenses");
    utils.book_append_sheet(workbook, utils.json_to_sheet(payload.products), "Products");
    utils.book_append_sheet(workbook, utils.json_to_sheet(payload.rawMaterials), "Raw Materials");
    utils.book_append_sheet(workbook, utils.json_to_sheet(payload.customers), "Customers");
    utils.book_append_sheet(workbook, utils.json_to_sheet(payload.productionBatches), "Production");
    writeFile(workbook, "khakhra-business-data.xlsx");
  };

  const handlePdfExport = () => {
    const payload = exportData();
    const doc = new jsPDF("p", "pt", "a4");
    doc.setFontSize(16);
    doc.text("Khakhra Business Snapshot", 40, 40);
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString("en-IN")}`,
      40,
      60,
    );

    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: [
        ["Total Orders", payload.orders.length.toString()],
        [
          "Total Revenue",
          formatCurrency(
            payload.orders.reduce((sum, order) => sum + calculateOrderTotals(order).netAmount, 0),
          ),
        ],
        [
          "Outstanding Invoices",
          formatCurrency(
            payload.invoices.filter((invoice) => !invoice.paid).reduce((sum, invoice) => sum + invoice.totalAmount, 0),
          ),
        ],
        [
          "Expense Count",
          payload.expenses.length.toString(),
        ],
        [
          "Finished Goods SKUs",
          payload.products.length.toString(),
        ],
        ["Raw Materials", payload.rawMaterials.length.toString()],
      ],
      startY: 80,
    });

    autoTable(doc, {
      head: [["Order ID", "Status", "Net Amount"]],
      body: payload.orders.map((order) => [
        order.id.toUpperCase(),
        order.status,
        formatCurrency(calculateOrderTotals(order).netAmount),
      ]),
      startY: (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
        ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30
        : 120,
    });

    doc.save("khakhra-business-overview.pdf");
  };

  return (
    <section id="reports" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Exports & Reporting</h2>
        <p className="text-sm text-slate-500">
          Download data for audits, banking conversations, franchise partners or statutory submissions.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          disabled={isExporting}
          onClick={() => {
            setIsExporting(true);
            try {
              handleExcelExport();
            } finally {
              setIsExporting(false);
            }
          }}
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Export Excel Workbook
        </button>
        <button
          type="button"
          disabled={isExporting}
          onClick={() => {
            setIsExporting(true);
            try {
              handlePdfExport();
            } finally {
              setIsExporting(false);
            }
          }}
          className="rounded-lg border border-orange-400 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
        >
          Export PDF Briefing
        </button>
      </div>
    </section>
  );
};
