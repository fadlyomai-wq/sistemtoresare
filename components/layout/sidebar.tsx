"use client";

import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Boxes,
  Truck,
  Building2,
  ReceiptText,
  TrendingUp,
  LineChart,
  FileSpreadsheet,
  History,
  Settings,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { UserRole } from "@/types";

export type NavTab =
  | "dashboard"
  | "pos"
  | "products"
  | "categories"
  | "inventory"
  | "purchases"
  | "suppliers"
  | "expenses"
  | "revenue"
  | "financials"
  | "reports"
  | "transactions"
  | "settings";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: string;
}

export function Sidebar({ activeTab, setActiveTab, isOpenMobile, setIsOpenMobile }: SidebarProps) {
  const { currentUser, products } = useStore();

  const lowStockCount = products.filter((p) => p.status === "active" && p.stock <= p.min_stock).length;

  const navItems: { section: string; items: NavItem[] }[] = [
    {
      section: "Operasional Kasir",
      items: [
        { id: "pos", label: "Point of Sale (POS)", icon: ShoppingCart, roles: ["admin", "kasir"], badge: "Kasir" },
        { id: "transactions", label: "Riwayat Transaksi", icon: History, roles: ["admin", "kasir", "owner"] },
      ],
    },
    {
      section: "Manajemen Toko",
      items: [
        { id: "dashboard", label: "Dashboard Utama", icon: LayoutDashboard, roles: ["admin", "owner"] },
        { id: "products", label: "Katalog Produk", icon: Package, roles: ["admin", "owner"] },
        { id: "categories", label: "Kategori Produk", icon: Layers, roles: ["admin", "owner"] },
        {
          id: "inventory",
          label: "Inventaris & Stok",
          icon: Boxes,
          roles: ["admin", "owner"],
          badge: lowStockCount > 0 ? `${lowStockCount} Menipis` : undefined,
        },
      ],
    },
    {
      section: "Rantai Pasok & Biaya",
      items: [
        { id: "purchases", label: "Pembelian Barang", icon: Truck, roles: ["admin", "owner"] },
        { id: "suppliers", label: "Data Supplier", icon: Building2, roles: ["admin", "owner"] },
        { id: "expenses", label: "Pengeluaran Toko", icon: ReceiptText, roles: ["admin", "owner"] },
      ],
    },
    {
      section: "Keuangan & Laporan",
      items: [
        { id: "revenue", label: "Rekap Pendapatan", icon: TrendingUp, roles: ["admin", "owner"] },
        { id: "financials", label: "Analisis Laba Rugi", icon: LineChart, roles: ["admin", "owner"] },
        { id: "reports", label: "Pusat Laporan & PDF", icon: FileSpreadsheet, roles: ["admin", "owner"] },
      ],
    },
    {
      section: "Sistem & Konfigurasi",
      items: [
        { id: "settings", label: "Pengaturan & DB", icon: Settings, roles: ["admin"] },
      ],
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-white truncate">SMART STORE</h1>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400">POS Management</p>
          </div>
        </div>

        {/* User Role Card */}
        <div className="mx-3 my-3 p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-emerald-300">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-100 truncate">{currentUser.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  currentUser.role === "admin"
                    ? "bg-purple-400"
                    : currentUser.role === "owner"
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
              />
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {navItems.map((sec, sIdx) => {
            // Filter items visible to role
            const visibleItems = sec.items.filter((item) => item.roles.includes(currentUser.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {sec.section}
                </p>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isActive
                              ? "bg-emerald-700 text-white"
                              : item.badge.includes("Menipis")
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-slate-800 text-slate-300 border border-slate-750"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-center bg-slate-950/20">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Versi Produksi 2.5 (IDR)</span>
          </div>
        </div>
      </aside>
    </>
  );
}
