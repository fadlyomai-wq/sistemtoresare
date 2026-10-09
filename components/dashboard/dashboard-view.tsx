"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Truck,
  Receipt,
  PiggyBank,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { filterByPeriod, calculateFinancialSummary, PeriodFilter } from "@/lib/calculations/financials";
import { formatRupiah, formatNumber } from "@/lib/utils";
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

export function DashboardView() {
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

  // Filtered collections
  const filteredSales = useMemo(() => filterByPeriod(sales, periodFilter), [sales, periodFilter]);
  const filteredExpenses = useMemo(() => filterByPeriod(expenses, periodFilter), [expenses, periodFilter]);
  const filteredPurchases = useMemo(() => filterByPeriod(purchases, periodFilter), [purchases, periodFilter]);

  // Financial summary based on selected period
  const summary = useMemo(
    () => calculateFinancialSummary(filteredSales, filteredExpenses, filteredPurchases, products),
    [filteredSales, filteredExpenses, filteredPurchases, products]
  );

  // Sales Today calculation
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const salesToday = useMemo(() => {
    return sales
      .filter((s) => s.status === "completed" && new Date(s.transaction_date) >= todayStart)
      .reduce((sum, s) => sum + s.total_amount, 0);
  }, [sales, todayStart]);

  const countToday = useMemo(() => {
    return sales.filter((s) => s.status === "completed" && new Date(s.transaction_date) >= todayStart).length;
  }, [sales, todayStart]);

  // Chart data: Aggregate daily/monthly series for the selected period
  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; Pendapatan: number; Pengeluaran: number; LabaBersih: number; Pembelian: number }>();

    // Add sales
    filteredSales.filter((s) => s.status === "completed").forEach((s) => {
      const d = new Date(s.transaction_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      const current = map.get(d) || { date: d, Pendapatan: 0, Pengeluaran: 0, LabaBersih: 0, Pembelian: 0 };
      current.Pendapatan += s.total_amount;
      // Add gross profit for that sale
      current.LabaBersih += s.gross_profit;
      map.set(d, current);
    });

    // Add expenses
    filteredExpenses.forEach((e) => {
      const d = new Date(e.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      const current = map.get(d) || { date: d, Pendapatan: 0, Pengeluaran: 0, LabaBersih: 0, Pembelian: 0 };
      current.Pengeluaran += e.amount;
      current.LabaBersih -= e.amount;
      map.set(d, current);
    });

    // Add purchases
    filteredPurchases.forEach((p) => {
      const d = new Date(p.purchase_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      const current = map.get(d) || { date: d, Pendapatan: 0, Pengeluaran: 0, LabaBersih: 0, Pembelian: 0 };
      current.Pembelian += p.total_amount;
      map.set(d, current);
    });

    const arr = Array.from(map.values());
    if (arr.length === 0) {
      // Default empty placeholder
      return [
        { date: "Data 1", Pendapatan: 0, Pengeluaran: 0, LabaBersih: 0, Pembelian: 0 },
        { date: "Data 2", Pendapatan: 0, Pengeluaran: 0, LabaBersih: 0, Pembelian: 0 },
      ];
    }
    return arr;
  }, [filteredSales, filteredExpenses, filteredPurchases]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Dashboard & Metrik Bisnis</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ringkasan kinerja operasional, penjualan kasir, margin HPP, dan kesehatan kas toko.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
              />
              <span className="text-slate-500 text-xs">s/d</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* 10 Statistical Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Penjualan Hari Ini */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Penjualan Hari Ini</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-100 mt-2">{formatRupiah(salesToday)}</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>{countToday} transaksi hari ini</span>
          </p>
        </div>

        {/* 2. Total Transaksi Periode */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Transaksi</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-100 mt-2">{formatNumber(summary.total_transactions)}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Rata-rata: {formatRupiah(summary.average_transaction)}
          </p>
        </div>

        {/* 3. Estimasi Pendapatan Bersih */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pendapatan Bersih</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-400 mt-2">{formatRupiah(summary.net_sales)}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Kotor: {formatRupiah(summary.gross_sales)}
          </p>
        </div>

        {/* 4. Total HPP */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total HPP Barang</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-indigo-300 mt-2">{formatRupiah(summary.cogs_hpp)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Modal barang terjual</p>
        </div>

        {/* 5. Estimasi Laba Kotor */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Estimasi Laba Kotor</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-300 mt-2">{formatRupiah(summary.gross_profit)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Net Sales - HPP</p>
        </div>

        {/* 6. Pengeluaran Operasional */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Beban Operasional</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-rose-400 mt-2">{formatRupiah(summary.operating_expenses)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Sewa, listrik, gaji, dll</p>
        </div>

        {/* 7. Estimasi Laba Bersih */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Estimasi Laba Bersih</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-lg font-bold mt-2 ${
              summary.estimated_net_profit >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatRupiah(summary.estimated_net_profit)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Laba Kotor - Beban Opex</p>
        </div>

        {/* 8. Total Pembelian Stok */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pembelian Stok</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-200 mt-2">{formatRupiah(summary.stock_purchases)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Persediaan dari supplier</p>
        </div>

        {/* 9. Jumlah Produk Aktif */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Produk Aktif</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-100 mt-2">{formatNumber(summary.total_products)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Katalog toko</p>
        </div>

        {/* 10. Stok Menipis */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Stok Menipis</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-rose-400 mt-2">{formatNumber(summary.low_stock_count)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Perlu restock segera</p>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue vs Expense & Net Profit Trend */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Tren Pendapatan vs Beban Operasional</h3>
              <p className="text-xs text-slate-400">Pergerakan arus penjualan dan biaya harian</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Rp ${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value) || 0), ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area type="monotone" dataKey="Pendapatan" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Net Profit & Stock Purchases Bar Comparison */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Perbandingan Laba Bersih & Pembelian Stok</h3>
              <p className="text-xs text-slate-400">Analisis penguatan margin dan penambahan persediaan</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `Rp ${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value) || 0), ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="LabaBersih" name="Laba Bersih" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pembelian" name="Beli Stok" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
