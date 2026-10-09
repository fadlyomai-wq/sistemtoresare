"use client";

import React, { useState, useMemo } from "react";
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Download,
  Calendar,
  DollarSign,
  PieChart,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { Expense, ExpenseCategory } from "@/types";
import { formatRupiah, formatDateID } from "@/lib/utils";
import { generateReportPDF } from "@/lib/pdf/generator";
import { Modal } from "../ui/modal";
import { ConfirmDialog } from "../ui/confirm-dialog";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Sewa Tempat",
  "Listrik",
  "Air",
  "Internet",
  "Gaji Karyawan",
  "Transportasi",
  "Perawatan Toko",
  "Perlengkapan",
  "Biaya Administrasi",
  "Lain-lain",
];

export function ExpensesView() {
  const { expenses, addExpense, updateExpense, deleteExpense, settings, showToast } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [category, setCategory] = useState<ExpenseCategory>("Listrik");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"tunai" | "transfer_bank" | "kartu_debit">("transfer_bank");
  const [proofUrl, setProofUrl] = useState("");

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat = selectedCategory === "all" || e.category === selectedCategory;
      const matchSearch =
        e.expense_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [expenses, selectedCategory, searchQuery]);

  const totalOpex = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setCategory("Listrik");
    setDescription("");
    setAmount(0);
    setPaymentMethod("transfer_bank");
    setProofUrl("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (e: Expense) => {
    setEditingExpense(e);
    setCategory(e.category);
    setDescription(e.description);
    setAmount(e.amount);
    setPaymentMethod(e.payment_method);
    setProofUrl(e.proof_url || "");
    setShowAddModal(true);
  };

  const handleSave = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!description.trim() || amount <= 0) {
      showToast("Deskripsi dan nominal pengeluaran wajib diisi dengan benar.", "error");
      return;
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        category,
        description,
        amount,
        payment_method: paymentMethod,
        proof_url: proofUrl,
      });
    } else {
      addExpense({
        date: new Date().toISOString(),
        category,
        description,
        amount,
        payment_method: paymentMethod,
        proof_url: proofUrl,
      });
    }

    setShowAddModal(false);
  };

  const handleDelete = (e: Expense) => {
    setExpenseToDelete(e);
  };

  const handleExportPDF = () => {
    const columns = ["No. Pengeluaran", "Tanggal", "Kategori", "Deskripsi", "Metode", "Nominal (Rp)"];
    const data = filteredExpenses.map((e) => [
      e.expense_number,
      formatDateID(e.date, true),
      e.category,
      e.description,
      e.payment_method.toUpperCase(),
      formatRupiah(e.amount),
    ]);

    generateReportPDF({
      title: "Laporan Pengeluaran Operasional Toko",
      dateRange: "Semua Data Tercatat",
      columns,
      data,
      summaryData: [
        { label: "Total Transaksi Beban", value: `${filteredExpenses.length} Bukti` },
        { label: "Total Biaya Operasional", value: formatRupiah(totalOpex) },
      ],
      settings,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Beban Operasional Toko (OPEX)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Catat sewa tempat, listrik, internet, gaji, dan biaya pemeliharaan. Terpisah dari pembelian stok.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Biaya Operasional</span>
            <p className="text-xl font-black text-rose-400 mt-1">{formatRupiah(totalOpex)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Mengurangi laba kotor</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Bukti Pengeluaran</span>
            <p className="text-xl font-black text-slate-100 mt-1">{filteredExpenses.length} Transaksi</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sesuai filter pencarian</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <ReceiptText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Rata-rata Pengeluaran</span>
            <p className="text-xl font-black text-amber-400 mt-1">
              {formatRupiah(filteredExpenses.length > 0 ? Math.round(totalOpex / filteredExpenses.length) : 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Per catatan bukti</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <PieChart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor bukti, deskripsi pengeluaran..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Kategori Beban</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-4">No. Pengeluaran & Tanggal</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Deskripsi Biaya</th>
                <th className="p-3.5 text-right">Nominal</th>
                <th className="p-3.5">Metode Bayar</th>
                <th className="p-3.5">Dicatat Oleh</th>
                <th className="p-3.5 pr-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Tidak ada catatan pengeluaran operasional.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-3.5 pl-4">
                      <p className="font-bold text-slate-100">{exp.expense_number}</p>
                      <p className="text-[10px] text-slate-500">{formatDateID(exp.date, true)}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-200 font-semibold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-300 max-w-xs">{exp.description}</td>
                    <td className="p-3.5 text-right font-bold text-rose-400">
                      {formatRupiah(exp.amount)}
                    </td>
                    <td className="p-3.5 text-slate-300 uppercase text-[11px]">
                      {exp.payment_method.replace("_", " ")}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">{exp.created_by}</td>
                    <td className="p-3.5 pr-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(exp);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingExpense ? "Edit Pengeluaran" : "Catat Pengeluaran Operasional Baru"}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Pengeluaran *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Pengeluaran *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Tagihan Listrik PLN Bulan Ini"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nominal Biaya (Rp) *</label>
              <input
                type="number"
                min="1000"
                required
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="transfer_bank">Transfer Bank</option>
                <option value="tunai">Tunai (Kas Toko)</option>
                <option value="kartu_debit">Kartu Debit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">URL / Link Bukti Nota (Opsional)</label>
            <input
              type="text"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://... atau nomor resi kasir"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Simpan Pengeluaran
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
        title="Hapus Pengeluaran"
        description={`Apakah Anda yakin ingin menghapus catatan pengeluaran "${expenseToDelete?.description}" sebesar ${formatRupiah(expenseToDelete?.amount || 0)}?`}
        confirmText="Hapus Pengeluaran"
        cancelText="Batal"
      />
    </div>
  );
}
