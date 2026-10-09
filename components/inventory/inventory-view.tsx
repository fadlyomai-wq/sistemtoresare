"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  Search,
  Plus,
  Coins,
  FileText,
  Package,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { MovementType } from "@/types";
import { formatRupiah, formatNumber, formatDateID } from "@/lib/utils";
import { Modal } from "../ui/modal";

export function InventoryView() {
  const { products, inventoryMovements, addStockAdjustment } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<"overview" | "movements" | "alerts">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [movementFilter, setMovementFilter] = useState<string>("all");

  // Stock Adjustment Modal
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [adjType, setAdjType] = useState<"stok_masuk" | "stok_keluar" | "penyesuaian">("penyesuaian");
  const [adjQty, setAdjQty] = useState<number>(0);
  const [adjReason, setAdjReason] = useState("");

  // Total Stock Valuation
  const totalValuation = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.cost_price, 0);
  }, [products]);

  const totalUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock, 0);
  }, [products]);

  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.status === "active" && p.stock <= p.min_stock);
  }, [products]);

  // Movements filtered
  const filteredMovements = useMemo(() => {
    return inventoryMovements.filter((m) => {
      const matchType = movementFilter === "all" || m.movement_type === movementFilter;
      const matchSearch =
        m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [inventoryMovements, movementFilter, searchQuery]);

  const handleOpenAdjustment = (productId?: string) => {
    setSelectedProductId(productId || products[0]?.id || "");
    const prod = products.find((p) => p.id === (productId || products[0]?.id));
    setAdjType("penyesuaian");
    setAdjQty(prod ? prod.stock : 0);
    setAdjReason("Stock opname bulanan");
    setShowAdjModal(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    addStockAdjustment({
      productId: selectedProductId,
      type: adjType,
      quantity: adjQty,
      reason: adjReason,
    });

    setShowAdjModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Valuation Stat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Manajemen Inventaris & Mutasi Stok</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kartu stok digital, pencatatan stok masuk, stok keluar, stock opname, dan valuasi aset persediaan.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdjustment()}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all hover:scale-102"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Penyesuaian / Stock Opname</span>
        </button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Nilai Persediaan (HPP)</span>
            <p className="text-xl font-black text-emerald-400 mt-1">{formatRupiah(totalValuation)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Berdasarkan harga modal satuan</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Fisik Barang</span>
            <p className="text-xl font-black text-slate-100 mt-1">{formatNumber(totalUnits)} Unit</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Dari {products.length} item katalog</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Peringatan Stok Menipis</span>
            <p className="text-xl font-black text-rose-400 mt-1">{lowStockItems.length} Produk</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Mencapai / di bawah batas minimum</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "overview", label: "Daftar Stok & Valuasi" },
          { id: "movements", label: "Riwayat Mutasi (Kartu Stok)" },
          { id: "alerts", label: `Peringatan Stok (${lowStockItems.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id
                ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & VALUATION TABLE */}
      {activeSubTab === "overview" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Produk</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5 text-right">Harga Modal (HPP)</th>
                  <th className="p-3.5 text-center">Stok Fisik</th>
                  <th className="p-3.5 text-right">Total Valuasi Aset</th>
                  <th className="p-3.5 pr-4 text-center">Aksi Opname</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => {
                  const assetValue = p.stock * p.cost_price;
                  const isLow = p.stock <= p.min_stock;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-3.5 pl-4">
                        <p className="font-bold text-slate-100">{p.name}</p>
                        <p className="text-[10px] text-slate-500">
                          SKU: {p.sku} • Min Alert: {p.min_stock} {p.unit}
                        </p>
                      </td>
                      <td className="p-3.5 text-slate-300">{p.category_name || "-"}</td>
                      <td className="p-3.5 text-right font-medium text-slate-300">
                        {formatRupiah(p.cost_price)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold ${
                            isOut
                              ? "bg-rose-500/20 text-rose-300"
                              : isLow
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-slate-800 text-slate-200"
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        {formatRupiah(assetValue)}
                      </td>
                      <td className="p-3.5 pr-4 text-center">
                        <button
                          onClick={() => handleOpenAdjustment(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                        >
                          Sesuaikan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY MOVEMENTS (KARTU STOK) */}
      {activeSubTab === "movements" && (
        <div className="space-y-4">
          {/* Movement Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk, invoice, alasan mutasi..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Jenis Mutasi</option>
              <option value="stok_masuk">Stok Masuk (Pembelian/Restock)</option>
              <option value="stok_keluar">Stok Keluar (Penjualan Kasir)</option>
              <option value="penyesuaian">Penyesuaian (Stock Opname)</option>
              <option value="retur_penjualan">Retur Penjualan</option>
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-3.5 pl-4">Tanggal & Waktu</th>
                    <th className="p-3.5">Produk</th>
                    <th className="p-3.5">Tipe Mutasi</th>
                    <th className="p-3.5 text-center">Perubahan</th>
                    <th className="p-3.5 text-center">Stok Sebelum</th>
                    <th className="p-3.5 text-center">Stok Akhir</th>
                    <th className="p-3.5">Referensi & Alasan</th>
                    <th className="p-3.5 pr-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Belum ada mutasi stok yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const isPositive = m.quantity > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="p-3.5 pl-4 text-slate-400 text-[11px]">
                            {formatDateID(m.created_at, true)}
                          </td>
                          <td className="p-3.5 font-bold text-slate-100">{m.product_name}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                m.movement_type === "stok_masuk"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : m.movement_type === "stok_keluar"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : "bg-sky-950 text-sky-400 border border-sky-800"
                              }`}
                            >
                              {m.movement_type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold">
                            <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
                              {isPositive ? `+${m.quantity}` : m.quantity}
                            </span>
                          </td>
                          <td className="p-3.5 text-center text-slate-400">{m.previous_stock}</td>
                          <td className="p-3.5 text-center font-bold text-slate-100">{m.current_stock}</td>
                          <td className="p-3.5 text-slate-300">
                            <span className="font-semibold text-slate-200">{m.reference_no}</span>
                            <span className="block text-[10px] text-slate-500">{m.reason}</span>
                          </td>
                          <td className="p-3.5 pr-4 text-slate-400 text-[11px]">{m.created_by}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOW STOCK ALERTS */}
      {activeSubTab === "alerts" && (
        <div className="space-y-3">
          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
              <Boxes className="w-12 h-12 mx-auto text-emerald-400 mb-2 opacity-60" />
              <p className="font-bold text-slate-200">Semua Persediaan Memadai</p>
              <p className="text-xs text-slate-400 mt-1">
                Tidak ada produk yang berada di bawah ambang minimum persediaan saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                        Peringatan Restock Segera
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 mt-0.5">{p.name}</h4>
                      <p className="text-[11px] text-slate-400">SKU: {p.sku}</p>
                    </div>
                    <span className="text-xs font-black text-rose-400 bg-rose-950 px-2.5 py-1 rounded-lg border border-rose-800">
                      Sisa: {p.stock} {p.unit}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Batas Min: {p.min_stock} {p.unit}</span>
                    <button
                      onClick={() => handleOpenAdjustment(p.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                    >
                      Restock / Sesuaikan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      <Modal
        isOpen={showAdjModal}
        onClose={() => setShowAdjModal(false)}
        title="Penyesuaian Stok (Stock Opname)"
        description="Lakukan koreksi jumlah fisik produk yang ada di gudang/etalase."
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Produk</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const prod = products.find((p) => p.id === e.target.value);
                if (prod && adjType === "penyesuaian") {
                  setAdjQty(prod.stock);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Stok Sekarang: {p.stock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Penyesuaian</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "penyesuaian", label: "Set Nilai Akhir" },
                { id: "stok_masuk", label: "+ Tambah Stok" },
                { id: "stok_keluar", label: "- Kurangi Stok" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setAdjType(opt.id as any)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                    adjType === opt.id
                      ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {adjType === "penyesuaian" ? "Jumlah Stok Fisik Sebenarnya" : "Nominal Kuantitas"}
            </label>
            <input
              type="number"
              min="0"
              required
              value={adjQty}
              onChange={(e) => setAdjQty(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Alasan Penyesuaian *
            </label>
            <input
              type="text"
              required
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="Contoh: Barang rusak saat display / Selisih opname fisik"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdjModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Simpan Penyesuaian
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
