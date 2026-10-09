"use client";

import React, { useState } from "react";
import { StoreProvider, useStore } from "@/lib/storage/store-context";
import { Sidebar, NavTab } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ToastContainer } from "@/components/ui/toast-container";

// Views
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { PosView } from "@/components/pos/pos-view";
import { ProductsView } from "@/components/products/products-view";
import { CategoriesView } from "@/components/categories/categories-view";
import { InventoryView } from "@/components/inventory/inventory-view";
import { PurchasesView } from "@/components/purchases/purchases-view";
import { SuppliersView } from "@/components/suppliers/suppliers-view";
import { ExpensesView } from "@/components/expenses/expenses-view";
import { RevenueView } from "@/components/revenue/revenue-view";
import { FinancialsView } from "@/components/financials/financials-view";
import { ReportsView } from "@/components/reports/reports-view";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { SettingsView } from "@/components/settings/settings-view";
import { ShieldAlert, ShoppingCart } from "lucide-react";

function MainContent() {
  const { currentUser, isLoaded } = useStore();
  const [activeTab, setActiveTab] = useState<NavTab>("pos");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Role Access Control Checks
  const canAccessTab = (tab: NavTab): boolean => {
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "kasir") {
      return ["pos", "transactions"].includes(tab);
    }
    if (currentUser.role === "owner") {
      return tab !== "settings"; // Owner has read & financial access to everything except deep system settings
    }
    return true;
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-300">
          Memuat Sistem POS & Data Persediaan...
        </p>
      </div>
    );
  }

  const isAuthorized = canAccessTab(activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileOpen}
        setIsOpenMobile={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header */}
        <Header onToggleMobile={() => setIsMobileOpen(true)} setActiveTab={setActiveTab} />

        {/* View Container */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {!isAuthorized ? (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Akses Dibatasi (Role: {currentUser.role.toUpperCase()})</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Akun Anda dengan hak akses <strong>{currentUser.role}</strong> tidak memiliki otorisasi untuk mengakses
                  modul ini. Kasir hanya diizinkan membuka sistem Kasir (POS) dan Riwayat Transaksi.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("pos")}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Kembali ke Kasir POS</span>
              </button>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && <DashboardView />}
              {activeTab === "pos" && <PosView />}
              {activeTab === "products" && <ProductsView />}
              {activeTab === "categories" && <CategoriesView />}
              {activeTab === "inventory" && <InventoryView />}
              {activeTab === "purchases" && <PurchasesView />}
              {activeTab === "suppliers" && <SuppliersView />}
              {activeTab === "expenses" && <ExpensesView />}
              {activeTab === "revenue" && <RevenueView />}
              {activeTab === "financials" && <FinancialsView />}
              {activeTab === "reports" && <ReportsView />}
              {activeTab === "transactions" && <TransactionsView />}
              {activeTab === "settings" && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Interactive Toast Notification Host */}
      <ToastContainer />
    </div>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}
