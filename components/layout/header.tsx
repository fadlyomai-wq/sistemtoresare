"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  ShoppingCart,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { UserRole } from "@/types";
import { NavTab } from "./sidebar";
import { Modal } from "../ui/modal";

interface HeaderProps {
  onToggleMobile: () => void;
  setActiveTab: (tab: NavTab) => void;
}

export function Header({ onToggleMobile, setActiveTab }: HeaderProps) {
  const { currentUser, switchRole, settings, products, resetToDefaultData } = useStore();

  const [currentTime, setCurrentTime] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        }) + " WIB"
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const lowStockProducts = products.filter((p) => p.status === "active" && p.stock <= p.min_stock);

  return (
    <>
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">{settings.name}</h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} • {currentTime}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick POS Button */}
          <button
            onClick={() => setActiveTab("pos")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Kasir POS</span>
          </button>

          {/* Low Stock Alerts */}
          <button
            onClick={() => setShowNotificationModal(true)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Notifikasi & Peringatan Stok"
          >
            <Bell className="w-4 h-4" />
            {lowStockProducts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {/* Role Switcher Pill */}
          <button
            onClick={() => setShowRoleModal(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-all"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                currentUser.role === "admin"
                  ? "bg-purple-400 shadow-sm shadow-purple-400"
                  : currentUser.role === "owner"
                  ? "bg-amber-400 shadow-sm shadow-amber-400"
                  : "bg-emerald-400 shadow-sm shadow-emerald-400"
              }`}
            />
            <span className="capitalize font-semibold text-slate-100 hidden sm:inline">
              Role: {currentUser.role}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Role Selection Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Ganti Hak Akses Pengguna (Role Switcher)"
        description="Pilih role untuk menguji pembatasan fitur dan sistem keamanan multi-role."
      >
        <div className="space-y-3">
          {[
            {
              role: "admin" as UserRole,
              title: "Administrator (Akses Penuh)",
              desc: "Memiliki hak penuh mengelola produk, stok, kasir, supplier, pengeluaran, laporan, dan konfigurasi database.",
              color: "border-purple-500/40 bg-purple-950/20 text-purple-300",
            },
            {
              role: "kasir" as UserRole,
              title: "Kasir (Operasional Penjualan)",
              desc: "Hanya dapat mengakses Point of Sale (POS) dan Riwayat Transaksi. Tidak dapat mengubah biaya, laba rugi, dan konfigurasi.",
              color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300",
            },
            {
              role: "owner" as UserRole,
              title: "Owner / Pemilik Toko",
              desc: "Memantau dashboard statistik, seluruh laporan keuangan, pendapatan, pengeluaran, margin HPP, dan laba bersih.",
              color: "border-amber-500/40 bg-amber-950/20 text-amber-300",
            },
          ].map((item) => {
            const isSelected = currentUser.role === item.role;
            return (
              <button
                key={item.role}
                onClick={() => {
                  switchRole(item.role);
                  setShowRoleModal(false);
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-900/20 ring-1 ring-emerald-500"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-100">{item.title}</span>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Sedang Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => {
              resetToDefaultData();
              setShowRoleModal(false);
            }}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Contoh</span>
          </button>

          <button
            onClick={() => setShowRoleModal(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Tutup
          </button>
        </div>
      </Modal>

      {/* Notifications / Low Stock Modal */}
      <Modal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title="Pemberitahuan Sistem & Stok Menipis"
        description="Daftar produk yang telah mencapai batas minimum persediaan toko."
      >
        {lowStockProducts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <UserCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
            <p className="font-semibold text-slate-200">Semua persediaan aman</p>
            <p className="mt-1">Tidak ada produk yang berada di bawah stok minimum saat ini.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-rose-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-100">{p.name}</p>
                    <p className="text-[11px] text-slate-400">SKU: {p.sku} • Satuan: {p.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-400">{p.stock} {p.unit}</span>
                  <p className="text-[10px] text-slate-500">Min: {p.min_stock} {p.unit}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={() => {
              setShowNotificationModal(false);
              setActiveTab("inventory");
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            Buka Modul Inventaris
          </button>
        </div>
      </Modal>
    </>
  );
}
