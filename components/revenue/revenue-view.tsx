"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Percent,
  CreditCard,
  QrCode,
  Banknote,
  Smartphone,
  Wallet,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { filterByPeriod, PeriodFilter } from "@/lib/calculations/financials";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function RevenueView() {
  const { sales } = useStore();

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

  const filteredSales = useMemo(() => {
    return filterByPeriod(sales, periodFilter).filter((s) => s.status === "completed");
  }, [sales, periodFilter]);

  // Aggregate metrics
  const grossSales = useMemo(() => filteredSales.reduce((sum, s) => sum + s.subtotal, 0), [filteredSales]);
  const totalDiscounts = useMemo(
    () => filteredSales.reduce((sum, s) => sum + s.item_discounts + s.transaction_discount, 0),
    [filteredSales]
  );
  const netSales = grossSales - totalDiscounts;
  const totalHPP = useMemo(() => filteredSales.reduce((sum, s) => sum + s.total_cost_price, 0), [filteredSales]);
  const grossProfit = netSales - totalHPP;
  const totalTransactions = filteredSales.length;
  const avgBasket = totalTransactions > 0 ? Math.round(netSales / totalTransactions) : 0;

  // Breakdown by payment method
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};

    filteredSales.forEach((s) => {
      s.payments.forEach((p) => {
        const method = p.method;
        if (!map[method]) map[method] = { count: 0, total: 0 };
        map[method].count += 1;
        map[method].total += p.amount;
      });
    });

    return Object.entries(map).map(([method, data]) => ({
      method,
      ...data,
    }));
  }, [filteredSales]);

  // Chart data
  const chartData = useMemo(() => {
    return paymentBreakdown.map((item) => ({
      name: item.method.replace("_", " ").toUpperCase(),
      Total: item.total,
    }));
  }, [paymentBreakdown]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Rekapitulasi Pendapatan Penjualan</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analisis penjualan kotor, potongan diskon, pendapatan bersih, dan distribusi metode pembayaran kasir.
          </p>
        </div>

        {/* Filter */}
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

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Penjualan Kotor (Gross)</span>
          <p className="text-lg font-bold text-slate-100 mt-1">{formatRupiah(grossSales)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Total sebelum diskon</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Total Potongan Diskon</span>
          <p className="text-lg font-bold text-rose-400 mt-1">-{formatRupiah(totalDiscounts)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Item & transaksi</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Pendapatan Bersih (Net Sales)</span>
          <p className="text-lg font-black text-emerald-400 mt-1">{formatRupiah(netSales)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Gross - Diskon</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-medium text-slate-400">Rata-rata Nilai Transaksi</span>
          <p className="text-lg font-bold text-sky-400 mt-1">{formatRupiah(avgBasket)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dari {totalTransactions} struk kasir</p>
        </div>
      </div>

      {/* Margin & HPP Deep Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Kalkulasi Laba Kotor Penjualan</h3>
          <p className="text-xs text-slate-400 mt-1">
            Laba kotor dihitung dari Pendapatan Bersih dikurangi modal barang terjual (HPP).
          </p>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Pendapatan Bersih (Net Sales):</span>
              <strong className="text-slate-100">{formatRupiah(netSales)}</strong>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Harga Pokok Penjualan (HPP):</span>
              <strong className="text-indigo-400">-{formatRupiah(totalHPP)}</strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold text-sm">
              <span>Estimasi Laba Kotor (Gross Margin):</span>
              <span>{formatRupiah(grossProfit)}</span>
            </div>
          </div>
        </div>

        {/* Chart Payment Methods */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 mb-3">Distribusi Nilai Metode Pembayaran</h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `Rp ${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), "Total"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "10px", fontSize: "11px" }}
                />
                <Bar dataKey="Total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Rekap Berdasarkan Kanal Pembayaran
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-4">Kanal Pembayaran</th>
                <th className="p-3.5 text-center">Jumlah Transaksi</th>
                <th className="p-3.5 text-right">Total Dana Diterima</th>
                <th className="p-3.5 pr-4 text-right">Porsi (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paymentBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Belum ada transaksi pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                paymentBreakdown.map((p, idx) => {
                  const share = netSales > 0 ? Math.round((p.total / netSales) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-3.5 pl-4 font-bold text-slate-100 uppercase">
                        {p.method.replace("_", " ")}
                      </td>
                      <td className="p-3.5 text-center font-medium text-slate-300">{p.count} Transaksi</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">{formatRupiah(p.total)}</td>
                      <td className="p-3.5 pr-4 text-right font-semibold text-slate-300">{share}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
