"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Printer,
  Download,
  Ban,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { Sale } from "@/types";
import { formatRupiah, formatDateID } from "@/lib/utils";
import { generateReceiptPDF } from "@/lib/pdf/generator";
import { Modal } from "../ui/modal";

export function TransactionsView() {
  const { sales, cancelSale, settings, currentUser } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Detail Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Cancel Transaction Modal
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.cashier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.items.some((i) => i.product_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMethod = methodFilter === "all" || s.payment_method === methodFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;

      return matchSearch && matchMethod && matchStatus;
    });
  }, [sales, searchQuery, methodFilter, statusFilter]);

  const handleOpenCancel = (sale: Sale) => {
    if (currentUser.role === "kasir") {
      alert("Kasir tidak memiliki izin untuk membatalkan transaksi. Otorisasi Admin atau Owner diperlukan.");
      return;
    }
    setSaleToCancel(sale);
    setCancelReason("");
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToCancel || !cancelReason.trim()) {
      alert("Harap masukkan alasan pembatalan transaksi.");
      return;
    }

    const res = cancelSale(saleToCancel.id, cancelReason);
    if (res.success) {
      setSaleToCancel(null);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Riwayat Transaksi Penjualan</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit trail faktur kasir, cetak ulang struk thermal, unduh invoice PDF, dan pembatalan dengan reversal stok.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari invoice, pelanggan, produk..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Metode Pembayaran</option>
            <option value="tunai">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="transfer_bank">Transfer Bank</option>
            <option value="kartu_debit">Kartu Debit</option>
            <option value="kartu_kredit">Kartu Kredit</option>
            <option value="ewallet">E-Wallet</option>
            <option value="split">Split Payment</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status Transaksi</option>
            <option value="completed">Selesai (Completed)</option>
            <option value="cancelled">Dibatalkan (Cancelled)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-4">No. Invoice & Waktu</th>
                <th className="p-3.5">Kasir</th>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5 text-center">Item</th>
                <th className="p-3.5 text-right">Total Transaksi</th>
                <th className="p-3.5">Metode Bayar</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 pr-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada riwayat transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isCancelled = sale.status === "cancelled";
                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-slate-850/50 transition-colors ${
                        isCancelled ? "opacity-60 bg-rose-950/10" : ""
                      }`}
                    >
                      <td className="p-3.5 pl-4">
                        <span className="font-bold text-slate-100">{sale.invoice_number}</span>
                        <span className="block text-[10px] text-slate-500">
                          {formatDateID(sale.transaction_date, true)}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-300">{sale.cashier_name}</td>
                      <td className="p-3.5 text-slate-400">{sale.customer_name || "Umum"}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-300">
                        {sale.items.reduce((sum, i) => sum + i.quantity, 0)} Pcs
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        {formatRupiah(sale.total_amount)}
                      </td>
                      <td className="p-3.5 uppercase font-medium text-slate-300">
                        {sale.payment_method.replace("_", " ")}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCancelled
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          }`}
                        >
                          {isCancelled ? "DIBATALKAN" : "SELESAI"}
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            title="Lihat Detail Transaksi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generateReceiptPDF(sale, settings)}
                            title="Unduh Invoice PDF"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {!isCancelled && (
                            <button
                              onClick={() => handleOpenCancel(sale)}
                              title="Batalkan Transaksi (Otorisasi)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedSale)}
        onClose={() => setSelectedSale(null)}
        title="Detail Faktur Penjualan"
        description={`No. Invoice: ${selectedSale?.invoice_number}`}
        maxWidth="xl"
      >
        {selectedSale && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-500 block">Waktu Transaksi:</span>
                <span className="text-slate-200">{formatDateID(selectedSale.transaction_date, true)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kasir Bertugas:</span>
                <strong className="text-slate-100">{selectedSale.cashier_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Pelanggan:</span>
                <span className="text-slate-200">{selectedSale.customer_name || "Pelanggan Umum"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status:</span>
                <span
                  className={`font-bold ${
                    selectedSale.status === "cancelled" ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {selectedSale.status.toUpperCase()}
                </span>
              </div>
            </div>

            {selectedSale.status === "cancelled" && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Transaksi Ini Telah Dibatalkan</span>
                </p>
                <p className="text-[11px]">Dibatalkan oleh: {selectedSale.cancelled_by}</p>
                <p className="text-[11px]">Alasan: {selectedSale.cancel_reason}</p>
              </div>
            )}

            {/* Items */}
            <div className="space-y-1">
              <span className="font-bold text-slate-300">Rincian Barang Terjual:</span>
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {selectedSale.items.map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center bg-slate-950">
                    <div>
                      <p className="font-bold text-slate-100">{it.product_name}</p>
                      <p className="text-[10px] text-slate-500">
                        {it.quantity} {it.unit} x {formatRupiah(it.sell_price)} • HPP Modal: {formatRupiah(it.cost_price)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-100">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Barang:</span>
                <span>{formatRupiah(selectedSale.subtotal)}</span>
              </div>
              {selectedSale.transaction_discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Diskon Transaksi:</span>
                  <span>-{formatRupiah(selectedSale.transaction_discount)}</span>
                </div>
              )}
              {selectedSale.tax_amount > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>PPN:</span>
                  <span>{formatRupiah(selectedSale.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-100 pt-1 border-t border-slate-800">
                <span>Total Tagihan:</span>
                <span className="text-emerald-400">{formatRupiah(selectedSale.total_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Dibayar ({selectedSale.payment_method.toUpperCase()}):</span>
                <span>{formatRupiah(selectedSale.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Kembalian:</span>
                <span>{formatRupiah(selectedSale.change_amount)}</span>
              </div>
              <div className="flex justify-between text-indigo-400 pt-1 border-t border-slate-800 font-semibold">
                <span>HPP Barang Terjual:</span>
                <span>{formatRupiah(selectedSale.total_cost_price)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Laba Kotor Transaksi:</span>
                <span>{formatRupiah(selectedSale.gross_profit)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => generateReceiptPDF(selectedSale, settings)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF Struk</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CANCEL SALE REVERSAL MODAL */}
      <Modal
        isOpen={Boolean(saleToCancel)}
        onClose={() => setSaleToCancel(null)}
        title="Otorisasi Pembatalan Transaksi"
        description={`Invoice ${saleToCancel?.invoice_number}`}
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Peringatan Pembatalan Transaksi:</span>
            </p>
            <p>
              Pembatalan tidak akan menghapus data dari database, melainkan mencatat audit trail pembatalan dan secara
              otomatis mengembalikan stok seluruh barang ke inventaris toko.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Alasan Pembatalan / Retur Transaksi *
            </label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Contoh: Kesalahan input kasir / Pelanggan membatalkan pesanan di tempat"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSaleToCancel(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              Konfirmasi Batalkan Transaksi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
