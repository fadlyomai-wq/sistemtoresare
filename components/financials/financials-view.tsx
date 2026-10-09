"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Wallet,
  PiggyBank,
  Receipt,
  Truck,
  Layers,
  HelpCircle,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { filterByPeriod, calculateFinancialSummary, PeriodFilter } from "@/lib/calculations/financials";
import { formatRupiah } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export function FinancialsView() {
  const { sales, expenses, purchases, products } = useStore();

  const [periodType, setPeriodType] = useState<"weekly" | "monthly" | "yearly" | "custom">("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const periodFilter: PeriodFilter = useMemo(
    () => ({
      type: periodType,
      startDate: customStart,
      endDate: customEnd,
    }),
    [periodType, customStart, customEnd]
  );

  const filteredSales = useMemo(() => filterByPeriod(sales, periodFilter), [sales, periodFilter]);
  const filteredExpenses = useMemo(() => filterByPeriod(expenses, periodFilter), [expenses, periodFilter]);
  const filteredPurchases = useMemo(() => filterByPeriod(purchases, periodFilter), [purchases, periodFilter]);

  const summary = useMemo(
    () => calculateFinancialSummary(filteredSales, filteredExpenses, filteredPurchases, products),
    [filteredSales, filteredExpenses, filteredPurchases, products]
  );

  // Comparison Chart Data
  const financialComparisonData = useMemo(() => {
    return [
      {
        kategori: "Pendapatan Bersih",
        Nilai: summary.net_sales,
        fill: "#10b981",
      },
      {
        kategori: "HPP (Modal Terjual)",
        Nilai: summary.cogs_hpp,
        fill: "#6366f1",
      },
      {
        kategori: "Laba Kotor",
        Nilai: summary.gross_profit,
        fill: "#0ea5e9",
      },
      {
        kategori: "Beban Operasional",
        Nilai: summary.operating_expenses,
        fill: "#f43f5e",
      },
      {
        kategori: "Laba Bersih",
        Nilai: Math.max(0, summary.estimated_net_profit),
        fill: "#f59e0b",
      },
      {
        kategori: "Pembelian Stok",
        Nilai: summary.stock_purchases,
        fill: "#8b5cf6",
      },
    ];
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Analisis Keuangan & Laba Rugi</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Laporan laba rugi komprehensif, evaluasi margin kotor, pemisahan beban operasional vs persediaan, dan arus kas.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            {(
              [
                { id: "weekly", label: "7 Hari" },
                { id: "monthly", label: "Bulan Ini" },
                { id: "yearly", label: "Tahun Ini" },
                { id: "custom", label: "Kustom" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setPeriodType(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  periodType === item.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {periodType === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
              />
              <span className="text-slate-500 text-xs">s/d</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4 Pillars of Financial Statement */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar A: Pendapatan */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">A. Pendapatan</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Penjualan Bersih (Net Sales)</span>
            <p className="text-lg font-black text-emerald-400">{formatRupiah(summary.net_sales)}</p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Penjualan Kotor:</span>
              <span>{formatRupiah(summary.gross_sales)}</span>
            </div>
            <div className="flex justify-between">
              <span>Diskon Diberikan:</span>
              <span className="text-rose-400">-{formatRupiah(summary.discounts)}</span>
            </div>
          </div>
        </div>

        {/* Pillar B: HPP & Laba Kotor */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">B. Margin HPP</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Estimasi Laba Kotor</span>
            <p className="text-lg font-black text-indigo-300">{formatRupiah(summary.gross_profit)}</p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Total HPP Barang Terjual:</span>
              <span className="text-indigo-400">{formatRupiah(summary.cogs_hpp)}</span>
            </div>
            <div className="flex justify-between">
              <span>Gross Profit Margin:</span>
              <span className="text-emerald-400 font-bold">
                {summary.net_sales > 0 ? Math.round((summary.gross_profit / summary.net_sales) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Pillar C: Beban Operasional */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">C. Pengeluaran (OPEX)</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Beban Operasional Toko</span>
            <p className="text-lg font-black text-rose-400">{formatRupiah(summary.operating_expenses)}</p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Sewa, Listrik, Internet:</span>
              <span>Operasional</span>
            </div>
            <div className="flex justify-between">
              <span>Rasio Beban thd Penjualan:</span>
              <span className="text-rose-400 font-bold">
                {summary.net_sales > 0 ? Math.round((summary.operating_expenses / summary.net_sales) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Pillar D: Laba Bersih */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">D. Keuntungan Bersih</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Estimasi Laba Bersih (Net Profit)</span>
            <p
              className={`text-lg font-black ${
                summary.estimated_net_profit >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatRupiah(summary.estimated_net_profit)}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Rumus:</span>
              <span>Laba Kotor - Beban Opex</span>
            </div>
            <div className="flex justify-between">
              <span>Net Profit Margin:</span>
              <span className="font-bold text-emerald-300">
                {summary.net_sales > 0
                  ? Math.round((summary.estimated_net_profit / summary.net_sales) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Distinction Reminder Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/20 flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
        <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-100 font-semibold block">
            Prinsip Standar Akuntansi Toko (PSAK):
          </strong>
          Pembelian stok (sebesar <strong className="text-indigo-300">{formatRupiah(summary.stock_purchases)}</strong>)
          memengaruhi nilai aset persediaan gudang dan arus kas keluar, BUKAN beban pengeluaran operasional. HPP
          (sebesar <strong className="text-indigo-300">{formatRupiah(summary.cogs_hpp)}</strong>) hanya memotong laba
          secara proporsional saat barang berhasil terjual di kasir.
        </div>
      </div>

      {/* Visual Bar Comparison Chart */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-100 mb-1">Struktur Nilai Keuangan Periode Ini</h3>
        <p className="text-xs text-slate-400 mb-4">
          Visualisasi perbandingan antara Penjualan, HPP, Margin Kotor, Biaya Operasional, dan Laba Bersih.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="kategori" stroke="#64748b" fontSize={11} interval={0} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Rp ${val / 1000}k`} />
              <Tooltip
                formatter={(val: any) => [formatRupiah(Number(val) || 0), "Nilai"]}
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "10px", fontSize: "11px" }}
              />
              <Bar dataKey="Nilai" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Kas Masuk (Cash In)</span>
          <p className="text-lg font-bold text-emerald-400 mt-1">{formatRupiah(summary.cash_in)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Penerimaan riil dari kasir</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Kas Keluar (Cash Out)</span>
          <p className="text-lg font-bold text-rose-400 mt-1">{formatRupiah(summary.cash_out)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Biaya operasional + bayar PO supplier</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Arus Kas Bersih (Net Cash Flow)</span>
          <p
            className={`text-lg font-bold mt-1 ${
              summary.net_cash_flow >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatRupiah(summary.net_cash_flow)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Kas Masuk dikurangi Kas Keluar</p>
        </div>
      </div>
    </div>
  );
}
