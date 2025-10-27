"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Customer,
  DataExportPayload,
  Expense,
  Invoice,
  Order,
  Product,
  ProductionBatch,
  RawMaterial,
  UserProfile,
} from "@/lib/types";
import {
  sampleCustomers,
  sampleExpenses,
  sampleInvoices,
  sampleOrders,
  sampleProducts,
  sampleProductionBatches,
  sampleRawMaterials,
} from "@/lib/sampleData";
import { calculateCOGSForOrder, calculateOrderTotals } from "@/lib/utils";

interface DataContextState {
  customers: Customer[];
  products: Product[];
  rawMaterials: RawMaterial[];
  orders: Order[];
  invoices: Invoice[];
  expenses: Expense[];
  productionBatches: ProductionBatch[];
  userProfile: UserProfile | null;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  grossProfitByOrder: Record<string, number>;
  lowStockProducts: Product[];
  lowStockRawMaterials: RawMaterial[];
  createOrder: (payload: Omit<Order, "id">) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  createCustomer: (customer: Customer) => void;
  createExpense: (expense: Omit<Expense, "id">) => void;
  createInvoice: (invoice: Omit<Invoice, "id">) => void;
  createProduct: (product: Omit<Product, "id">) => void;
  updateProductStock: (productId: string, stock: number) => void;
  createRawMaterial: (material: Omit<RawMaterial, "id">) => void;
  updateRawMaterialQuantity: (materialId: string, quantity: number) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  createProductionBatch: (batch: Omit<ProductionBatch, "id">) => void;
  exportData: () => DataExportPayload;
}

const DataContext = createContext<DataContextState | undefined>(undefined);

const LOCAL_STORAGE_KEY = "khakhra_manager_data_v1";

interface PersistedState {
  customers: Customer[];
  products: Product[];
  rawMaterials: RawMaterial[];
  orders: Order[];
  invoices: Invoice[];
  expenses: Expense[];
  productionBatches: ProductionBatch[];
  userProfile: UserProfile | null;
}

const initialState: PersistedState = {
  customers: sampleCustomers,
  products: sampleProducts,
  rawMaterials: sampleRawMaterials,
  orders: sampleOrders,
  invoices: sampleInvoices,
  expenses: sampleExpenses,
  productionBatches: sampleProductionBatches,
  userProfile: null,
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<PersistedState>(() => {
    if (typeof window === "undefined") return initialState;
    const persisted = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!persisted) return initialState;
    try {
      const parsed: PersistedState = JSON.parse(persisted);
      return parsed;
    } catch (error) {
      console.error("Failed to parse stored state", error);
      return initialState;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const createOrder = (payload: Omit<Order, "id">) => {
    setState((prev) => ({
      ...prev,
      orders: [...prev.orders, { ...payload, id: `order-${prev.orders.length + 1}` }],
    }));
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
    }));
  };

  const createCustomer = (customer: Customer) => {
    setState((prev) => ({
      ...prev,
      customers: [...prev.customers, customer],
    }));
  };

  const createExpense = (expense: Omit<Expense, "id">) => {
    setState((prev) => ({
      ...prev,
      expenses: [...prev.expenses, { ...expense, id: `exp-${prev.expenses.length + 1}` }],
    }));
  };

  const createInvoice = (invoice: Omit<Invoice, "id">) => {
    setState((prev) => ({
      ...prev,
      invoices: [...prev.invoices, { ...invoice, id: `inv-${prev.invoices.length + 1}` }],
    }));
  };

  const createProduct = (product: Omit<Product, "id">) => {
    setState((prev) => ({
      ...prev,
      products: [...prev.products, { ...product, id: `prod-${prev.products.length + 1}` }],
    }));
  };

  const updateProductStock = (productId: string, stock: number) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === productId ? { ...product, stock } : product,
      ),
    }));
  };

  const createRawMaterial = (material: Omit<RawMaterial, "id">) => {
    setState((prev) => ({
      ...prev,
      rawMaterials: [...prev.rawMaterials, { ...material, id: `raw-${prev.rawMaterials.length + 1}` }],
    }));
  };

  const updateRawMaterialQuantity = (materialId: string, quantity: number) => {
    setState((prev) => ({
      ...prev,
      rawMaterials: prev.rawMaterials.map((material) =>
        material.id === materialId ? { ...material, quantity } : material,
      ),
    }));
  };

  const setUserProfile = (profile: UserProfile | null) => {
    setState((prev) => ({
      ...prev,
      userProfile: profile,
    }));
  };

  const createProductionBatch = (batch: Omit<ProductionBatch, "id">) => {
    setState((prev) => ({
      ...prev,
      productionBatches: [
        ...prev.productionBatches,
        { ...batch, id: `batch-${prev.productionBatches.length + 1}` },
      ],
    }));
  };

  const lowStockProducts = useMemo(
    () => state.products.filter((product) => product.stock <= product.reorderLevel),
    [state.products],
  );

  const lowStockRawMaterials = useMemo(
    () => state.rawMaterials.filter((material) => material.quantity <= material.reorderLevel),
    [state.rawMaterials],
  );

  const grossProfitByOrder = useMemo(() => {
    return state.orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.id] = calculateOrderTotals(order).taxableValue - calculateCOGSForOrder(order, state.products);
      return acc;
    }, {});
  }, [state.orders, state.products]);

  const computePeriodRevenue = (days: number) => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days);
    return state.orders.reduce((sum, order) => {
      const orderDate = new Date(order.orderDate);
      if (orderDate >= cutoff) {
        const { netAmount } = calculateOrderTotals(order);
        return sum + netAmount;
      }
      return sum;
    }, 0);
  };

  const exportData = () => ({
    orders: state.orders,
    invoices: state.invoices,
    expenses: state.expenses,
    products: state.products,
    rawMaterials: state.rawMaterials,
    customers: state.customers,
    productionBatches: state.productionBatches,
  });

  const value: DataContextState = {
    customers: state.customers,
    products: state.products,
    rawMaterials: state.rawMaterials,
    orders: state.orders,
    invoices: state.invoices,
    expenses: state.expenses,
    productionBatches: state.productionBatches,
    userProfile: state.userProfile,
    dailyRevenue: computePeriodRevenue(1),
    weeklyRevenue: computePeriodRevenue(7),
    monthlyRevenue: computePeriodRevenue(30),
    grossProfitByOrder,
    lowStockProducts,
    lowStockRawMaterials,
    createOrder,
    updateOrderStatus,
    createCustomer,
    createExpense,
    createInvoice,
    createProduct,
    updateProductStock,
    createRawMaterial,
    updateRawMaterialQuantity,
    setUserProfile,
    createProductionBatch,
    exportData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
};
