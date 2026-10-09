"use client";

import React, { useState, useMemo } from "react";
import {
  Truck,
  Plus,
  Search,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Trash2,
  FileText,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { Purchase, PurchaseCategory, PurchaseItem, PurchasePaymentStatus, PurchaseReceiveStatus } from "@/types";
import { formatRupiah, formatNumber, formatDateID } from "@/lib/utils";
import { Modal } from "../ui/modal";

export function PurchasesView() {
  const { purchases, suppliers, products, addPurchase, recordSupplierPayment } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Create Purchase Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [purchaseCategory, setPurchaseCategory] = useState<PurchaseCategory>("rutin");
  const [paymentMethod, setPaymentMethod] = useState<"tunai" | "transfer_bank" | "utang">("tunai");
  const [receiveStatus, setReceiveStatus] = useState<PurchaseReceiveStatus>("diterima");
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Items in new purchase
  const [items, setItems] = useState<
    { product_id: string; product_name: string; quantity: number; cost_price: number; discount: number }[]
  >([]);

  // Pay Debt Modal
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [targetDebtPurchase, setTargetDebtPurchase] = useState<Purchase | null>(null);
  const [payDebtAmount, setPayDebtAmount] = useState<number>(0);
  const [payDebtMethod, setPayDebtMethod] = useState<"tunai" | "transfer_bank">("transfer_bank");
  const [payDebtNotes, setPayDebtNotes] = useState("");

  // View detail modal
  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<Purchase | null>(null);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        p.purchase_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "all" || p.purchase_category === categoryFilter;
      const matchPay = paymentFilter === "all" || p.payment_status === paymentFilter;
      return matchSearch && matchCat && matchPay;
    });
  }, [purchases, searchQuery, categoryFilter, paymentFilter]);

  // Aggregates
  const totalPurchaseAmount = useMemo(() => purchases.reduce((sum, p) => sum + p.total_amount, 0), [purchases]);
  const totalOutstandingDebt = useMemo(() => purchases.reduce((sum, p) => sum + p.remaining_debt, 0), [purchases]);

  // Calculate items subtotal for add modal
  const calculatedItemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.cost_price - item.discount, 0);
  }, [items]);

  const finalTotalAmount = Math.max(0, calculatedItemsSubtotal - discountTotal);

  const handleOpenAddModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || "");
    setPurchaseCategory("rutin");
    setPaymentMethod("tunai");
    setReceiveStatus("diterima");
    setDiscountTotal(0);
    setNotes("");

    // Initial 1 item
    if (products[0]) {
      setItems([
        {
          product_id: products[0].id,
          product_name: products[0].name,
          quantity: 10,
          cost_price: products[0].cost_price,
          discount: 0,
        },
      ]);
    } else {
      setItems([]);
    }

    setShowAddModal(true);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: defaultProd.id,
        product_name: defaultProd.name,
        quantity: 10,
        cost_price: defaultProd.cost_price,
        discount: 0,
      },
    ]);
  };

  const handleUpdateItem = (index: number, updates: Partial<(typeof items)[0]>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      // if product_id changed, auto update name and cost
      if (updates.product_id) {
        const p = products.find((prod) => prod.id === updates.product_id);
        if (p) {
          next[index].product_name = p.name;
          next[index].cost_price = p.cost_price;
        }
      }
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Harap masukkan minimal 1 barang dalam pembelian.");
      return;
    }

    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    if (!sup) {
      alert("Pilih supplier terlebih dahulu.");
      return;
    }

    let effectivePaid = 0;
    if (paymentMethod === "utang") {
      effectivePaid = Math.min(paidAmountInput, finalTotalAmount);
    } else {
      effectivePaid = finalTotalAmount;
    }

    const remainingDebt = Math.max(0, finalTotalAmount - effectivePaid);
    let payStatus: PurchasePaymentStatus = "lunas";
    if (remainingDebt === finalTotalAmount) payStatus = "belum_lunas";
    else if (remainingDebt > 0) payStatus = "sebagian";

    const purchaseItems: PurchaseItem[] = items.map((it) => ({
      id: "pi-" + Math.random().toString(36).substring(2, 8),
      purchase_id: "",
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: it.quantity,
      cost_price: it.cost_price,
      discount: it.discount,
      subtotal: it.quantity * it.cost_price - it.discount,
    }));

    addPurchase({
      purchase_date: new Date().toISOString(),
      supplier_id: sup.id,
      supplier_name: sup.name,
      purchase_category: purchaseCategory,
      items: purchaseItems,
      subtotal: calculatedItemsSubtotal,
      discount: discountTotal,
      tax: 0,
      total_amount: finalTotalAmount,
      paid_amount: effectivePaid,
      remaining_debt: remainingDebt,
      payment_method: paymentMethod,
      payment_status: payStatus,
      receive_status: receiveStatus,
      notes,
    });

    setShowAddModal(false);
  };

  const handleOpenPayDebt = (purchase: Purchase) => {
    setTargetDebtPurchase(purchase);
    setPayDebtAmount(purchase.remaining_debt);
    setPayDebtMethod("transfer_bank");
    setPayDebtNotes("Pelunasan invoice pembelian " + purchase.purchase_number);
    setShowPayDebtModal(true);
  };

  const handleSubmitPayDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDebtPurchase) return;
    if (payDebtAmount <= 0 || payDebtAmount > targetDebtPurchase.remaining_debt) {
      alert("Nominal pembayaran tidak valid.");
      return;
    }

    recordSupplierPayment(targetDebtPurchase.id, payDebtAmount, payDebtMethod, payDebtNotes);
    setShowPayDebtModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Pembelian Barang Dagangan & Modal</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Catat pengadaan persediaan dari supplier, pembelian tunai/kredit, dan pelunasan hutang usaha.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Pembelian Baru</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Total Nilai Pembelian</span>
          <p className="text-xl font-black text-slate-100 mt-1">{formatRupiah(totalPurchaseAmount)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Seluruh pesanan masuk</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Total Hutang Supplier (Tempo)</span>
          <p className="text-xl font-black text-amber-400 mt-1">{formatRupiah(totalOutstandingDebt)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Kewajiban bayar yang belum lunas</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Total Transaksi Pengadaan</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{purchases.length} Faktur PO</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tercatat di sistem</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. PO atau supplier..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Kategori Pengadaan</option>
            <option value="modal_awal">Modal Stok Awal</option>
            <option value="rutin">Pembelian Stok Rutin</option>
            <option value="tambahan">Pembelian Stok Tambahan</option>
          </select>
        </div>

        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status Pembayaran</option>
            <option value="lunas">Lunas</option>
            <option value="belum_lunas">Belum Lunas (Utang)</option>
            <option value="sebagian">Dibayar Sebagian</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-4">No. PO & Tanggal</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5 text-right">Total Tagihan</th>
                <th className="p-3.5 text-right">Sisa Hutang</th>
                <th className="p-3.5 text-center">Status Bayar</th>
                <th className="p-3.5 text-center">Status Barang</th>
                <th className="p-3.5 pr-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada transaksi pembelian yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-3.5 pl-4">
                      <p className="font-bold text-slate-100">{p.purchase_number}</p>
                      <p className="text-[10px] text-slate-500">{formatDateID(p.purchase_date, true)}</p>
                    </td>
                    <td className="p-3.5 font-medium text-slate-200">{p.supplier_name}</td>
                    <td className="p-3.5">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300">
                        {p.purchase_category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-100">
                      {formatRupiah(p.total_amount)}
                    </td>
                    <td className="p-3.5 text-right font-bold">
                      {p.remaining_debt > 0 ? (
                        <span className="text-amber-400">{formatRupiah(p.remaining_debt)}</span>
                      ) : (
                        <span className="text-slate-500">Rp 0</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.payment_status === "lunas"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : p.payment_status === "sebagian"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {p.payment_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.receive_status === "diterima"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {p.receive_status}
                      </span>
                    </td>
                    <td className="p-3.5 pr-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedPurchaseDetail(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                        >
                          Detail
                        </button>
                        {p.remaining_debt > 0 && (
                          <button
                            onClick={() => handleOpenPayDebt(p)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold"
                          >
                            Bayar Hutang
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Buat Faktur Pembelian Supplier"
        description="Pilih supplier, masukkan barang yang dibeli, dan tentukan metode pembayaran tunai/utang."
        maxWidth="3xl"
      >
        <form onSubmit={handleSavePurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Supplier *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Pembelian</label>
              <select
                value={purchaseCategory}
                onChange={(e) => setPurchaseCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="modal_awal">Modal Stok Awal</option>
                <option value="rutin">Pembelian Stok Rutin</option>
                <option value="tambahan">Pembelian Tambahan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Metode Bayar</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="tunai">Tunai (Lunas)</option>
                <option value="transfer_bank">Transfer Bank (Lunas)</option>
                <option value="utang">Hutang / Kredit (Tempo)</option>
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Daftar Barang yang Dipesan</span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2 max-h-56 overflow-y-auto">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-5">
                    <select
                      value={it.product_id}
                      onChange={(e) => handleUpdateItem(idx, { product_id: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => handleUpdateItem(idx, { quantity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="Harga Beli"
                      value={it.cost_price}
                      onChange={(e) => handleUpdateItem(idx, { cost_price: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs font-bold text-right"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <span className="font-bold text-emerald-400 text-xs truncate">
                      {formatRupiah(it.quantity * it.cost_price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded text-rose-400 hover:bg-slate-800 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary and Payment Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="space-y-2">
              <div>
                <label className="block text-slate-400 mb-0.5">Diskon Faktur (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={discountTotal}
                  onChange={(e) => setDiscountTotal(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-0.5">Catatan Faktur</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan pengiriman / nomor DO..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-800 sm:pl-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Item:</span>
                  <span>{formatRupiah(calculatedItemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(discountTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-100 pt-1 border-t border-slate-800">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-400">{formatRupiah(finalTotalAmount)}</span>
                </div>
              </div>

              {paymentMethod === "utang" && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-amber-400 mb-0.5">
                    Nominal Dibayar di Muka (DP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={finalTotalAmount}
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(parseInt(e.target.value) || 0)}
                    placeholder="0 jika full utang"
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-1 text-slate-100 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Sisa hutang tempo: {formatRupiah(Math.max(0, finalTotalAmount - paidAmountInput))}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
            >
              Simpan & Terima Stok
            </button>
          </div>
        </form>
      </Modal>

      {/* PAY SUPPLIER DEBT MODAL */}
      <Modal
        isOpen={showPayDebtModal}
        onClose={() => setShowPayDebtModal(false)}
        title="Pembayaran Hutang Supplier"
        description={`Faktur PO: ${targetDebtPurchase?.purchase_number} (${targetDebtPurchase?.supplier_name})`}
      >
        <form onSubmit={handleSubmitPayDebt} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Total Tagihan PO:</span>
              <span>{formatRupiah(targetDebtPurchase?.total_amount || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Telah Dibayar:</span>
              <span>{formatRupiah(targetDebtPurchase?.paid_amount || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-slate-800">
              <span>Sisa Hutang:</span>
              <span>{formatRupiah(targetDebtPurchase?.remaining_debt || 0)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nominal Pembayaran *</label>
            <input
              type="number"
              min="1000"
              max={targetDebtPurchase?.remaining_debt || 0}
              required
              value={payDebtAmount}
              onChange={(e) => setPayDebtAmount(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Metode Pembayaran</label>
            <select
              value={payDebtMethod}
              onChange={(e) => setPayDebtMethod(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            >
              <option value="transfer_bank">Transfer Bank</option>
              <option value="tunai">Tunai</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan</label>
            <input
              type="text"
              value={payDebtNotes}
              onChange={(e) => setPayDebtNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPayDebtModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Konfirmasi Pelunasan
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedPurchaseDetail)}
        onClose={() => setSelectedPurchaseDetail(null)}
        title="Detail Faktur Pembelian"
        description={`No: ${selectedPurchaseDetail?.purchase_number}`}
      >
        {selectedPurchaseDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-slate-500 block">Supplier:</span>
                <strong className="text-slate-100">{selectedPurchaseDetail.supplier_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Tanggal:</span>
                <span className="text-slate-200">{formatDateID(selectedPurchaseDetail.purchase_date, true)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Bayar:</span>
                <span className="text-emerald-400 capitalize">{selectedPurchaseDetail.payment_status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Metode:</span>
                <span className="text-slate-200 uppercase">{selectedPurchaseDetail.payment_method}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-300">Rincian Barang:</span>
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {selectedPurchaseDetail.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center bg-slate-950">
                    <div>
                      <p className="font-bold text-slate-200">{it.product_name}</p>
                      <p className="text-[10px] text-slate-500">
                        {it.quantity} x {formatRupiah(it.cost_price)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-100">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Pembelian:</span>
                <strong className="text-slate-100">{formatRupiah(selectedPurchaseDetail.total_amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sudah Dibayar:</span>
                <span className="text-emerald-400">{formatRupiah(selectedPurchaseDetail.paid_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-400 border-t border-slate-800 pt-1">
                <span>Sisa Hutang:</span>
                <span>{formatRupiah(selectedPurchaseDetail.remaining_debt)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
