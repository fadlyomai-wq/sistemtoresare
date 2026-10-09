"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Eye,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { filterByPeriod, calculateFinancialSummary, PeriodFilter } from "@/lib/calculations/financials";
import { formatRupiah, formatDateID } from "@/lib/utils";
import { generateReportPDF } from "@/lib/pdf/generator";

type ReportType =
  | "penjualan"
  | "kasir"
  | "pendapatan"
  | "pengeluaran"
  | "laba_rugi"
  | "arus_kas"
  | "pembelian"
  | "stok"
  | "produk"
  | "supplier"
  | "metode_bayar";

export function ReportsView() {
  const { sales, expenses, purchases, products, suppliers, settings } = useStore();

  const [selectedReport, setSelectedReport] = useState<ReportType>("penjualan");
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

  const dateRangeLabel = useMemo(() => {
    if (periodType === "weekly") return "7 Hari Terakhir";
    if (periodType === "monthly") return "Bulan Berjalan";
    if (periodType === "yearly") return "Tahun Berjalan";
    if (periodType === "custom") return `${customStart || "Awal"} s/d ${customEnd || "Sekarang"}`;
    return "Semua Data";
  }, [periodType, customStart, customEnd]);

  // Construct table columns & data for preview and PDF export
  const reportConfig = useMemo(() => {
    switch (selectedReport) {
      case "penjualan": {
        const columns = ["No. Invoice", "Tanggal", "Kasir", "Pelanggan", "Subtotal", "Diskon", "Total Bayar", "Metode"];
        const data = filteredSales.map((s) => [
          s.invoice_number,
          formatDateID(s.transaction_date, true),
          s.cashier_name,
          s.customer_name || "Umum",
          formatRupiah(s.subtotal),
          formatRupiah(s.item_discounts + s.transaction_discount),
          formatRupiah(s.total_amount),
          s.payment_method.toUpperCase(),
        ]);
        const summaryData = [
          { label: "Total Transaksi", value: `${filteredSales.length} Faktur` },
          { label: "Total Penjualan", value: formatRupiah(summary.net_sales) },
          { label: "Estimasi Laba Kotor", value: formatRupiah(summary.gross_profit) },
        ];
        return { title: "Laporan Penjualan Kasir", columns, data, summaryData };
      }
      case "kasir": {
        const columns = ["Kasir", "Jumlah Transaksi", "Total Nominal", "Rata-rata / Struk"];
        const map: Record<string, { count: number; total: number }> = {};
        filteredSales.filter((s) => s.status === "completed").forEach((s) => {
          if (!map[s.cashier_name]) map[s.cashier_name] = { count: 0, total: 0 };
          map[s.cashier_name].count += 1;
          map[s.cashier_name].total += s.total_amount;
        });
        const data = Object.entries(map).map(([cashier, val]) => [
          cashier,
          `${val.count} Struk`,
          formatRupiah(val.total),
          formatRupiah(Math.round(val.total / val.count)),
        ]);
        return {
          title: "Laporan Kinerja Transaksi Kasir",
          columns,
          data,
          summaryData: [{ label: "Total Kasir Aktif", value: `${Object.keys(map).length} Orang` }],
        };
      }
      case "pendapatan": {
        const columns = ["Komponen Pendapatan", "Keterangan", "Total Nilai (Rp)"];
        const data = [
          ["Penjualan Kotor (Gross Sales)", "Nilai barang sebelum diskon", formatRupiah(summary.gross_sales)],
          ["Potongan Diskon Produk & Struk", "Diskon promosi", `-${formatRupiah(summary.discounts)}`],
          ["Pendapatan Bersih (Net Sales)", "Penjualan kotor - Diskon", formatRupiah(summary.net_sales)],
          ["Harga Pokok Penjualan (HPP)", "Total modal barang terjual", `-${formatRupiah(summary.cogs_hpp)}`],
          ["Laba Kotor (Gross Profit)", "Net Sales - HPP", formatRupiah(summary.gross_profit)],
        ];
        return { title: "Laporan Rekapitulasi Pendapatan", columns, data };
      }
      case "pengeluaran": {
        const columns = ["No. Bukti", "Tanggal", "Kategori Beban", "Deskripsi", "Metode", "Nominal (Rp)"];
        const data = filteredExpenses.map((e) => [
          e.expense_number,
          formatDateID(e.date, true),
          e.category,
          e.description,
          e.payment_method.toUpperCase(),
          formatRupiah(e.amount),
        ]);
        const summaryData = [{ label: "Total Biaya Operasional", value: formatRupiah(summary.operating_expenses) }];
        return { title: "Laporan Beban Pengeluaran Operasional", columns, data, summaryData };
      }
      case "laba_rugi": {
        const columns = ["Akun Laba Rugi", "Kategori", "Jumlah (Rp)"];
        const data = [
          ["Pendapatan Bersih Penjualan", "Pendapatan Operasional", formatRupiah(summary.net_sales)],
          ["Harga Pokok Penjualan (HPP)", "Beban Pokok", `(${formatRupiah(summary.cogs_hpp)})`],
          ["Laba Kotor (Gross Profit)", "Margin Operasi", formatRupiah(summary.gross_profit)],
          ["Total Beban Operasional (OPEX)", "Beban Usaha", `(${formatRupiah(summary.operating_expenses)})`],
          ["Estimasi Laba Bersih (Net Profit)", "Laba Bersih Usaha", formatRupiah(summary.estimated_net_profit)],
        ];
        const summaryData = [
          { label: "Margin Laba Bersih", value: `${summary.net_sales > 0 ? Math.round((summary.estimated_net_profit / summary.net_sales) * 100) : 0}%` },
          { label: "Laba Bersih", value: formatRupiah(summary.estimated_net_profit) },
        ];
        return { title: "Laporan Laba Rugi Komprehensif", columns, data, summaryData };
      }
      case "arus_kas": {
        const columns = ["Kategori Arus Kas", "Aktivitas", "Arus Masuk (Rp)", "Arus Keluar (Rp)"];
        const data = [
          ["Aktivitas Penjualan Kasir", "Penerimaan Kas dari Pelanggan", formatRupiah(summary.cash_in), "-"],
          ["Aktivitas Beban Operasional", "Biaya Listrik, Sewa, Gaji, dll", "-", formatRupiah(summary.operating_expenses)],
          ["Aktivitas Pembelian Persediaan", "Pembayaran Tunai ke Supplier", "-", formatRupiah(summary.stock_purchases)],
          ["TOTAL ARUS KAS BERSIH", "Kas Masuk - Kas Keluar", formatRupiah(summary.net_cash_flow), "-"],
        ];
        return { title: "Laporan Arus Kas (Cash Flow)", columns, data };
      }
      case "pembelian": {
        const columns = ["No. PO", "Tanggal", "Supplier", "Kategori", "Total Tagihan", "Status Bayar", "Sisa Hutang"];
        const data = filteredPurchases.map((p) => [
          p.purchase_number,
          formatDateID(p.purchase_date, true),
          p.supplier_name,
          p.purchase_category.replace("_", " "),
          formatRupiah(p.total_amount),
          p.payment_status.toUpperCase(),
          formatRupiah(p.remaining_debt),
        ]);
        const summaryData = [{ label: "Total Pembelian", value: formatRupiah(summary.stock_purchases) }];
        return { title: "Laporan Pembelian Barang & Modal", columns, data, summaryData };
      }
      case "stok": {
        const columns = ["SKU", "Nama Produk", "Kategori", "Harga Modal", "Harga Jual", "Stok Fisik", "Total Nilai Aset"];
        const data = products.map((p) => [
          p.sku,
          p.name,
          p.category_name || "-",
          formatRupiah(p.cost_price),
          formatRupiah(p.sell_price),
          `${p.stock} ${p.unit}`,
          formatRupiah(p.stock * p.cost_price),
        ]);
        const totalValuation = products.reduce((sum, p) => sum + p.stock * p.cost_price, 0);
        return {
          title: "Laporan Persediaan & Valuasi Stok",
          columns,
          data,
          summaryData: [{ label: "Total Nilai Persediaan Gudang", value: formatRupiah(totalValuation) }],
        };
      }
      case "produk": {
        const columns = ["SKU", "Nama Produk", "Harga Beli", "Harga Jual", "Margin Unit", "Margin (%)"];
        const data = products.map((p) => {
          const margin = p.sell_price - p.cost_price;
          const pct = p.cost_price > 0 ? Math.round((margin / p.cost_price) * 100) : 0;
          return [p.sku, p.name, formatRupiah(p.cost_price), formatRupiah(p.sell_price), formatRupiah(margin), `${pct}%`];
        });
        return { title: "Laporan Margin & Valuasi Produk", columns, data };
      }
      case "supplier": {
        const columns = ["Nama Supplier", "Kontak Person", "Telepon", "Total Hutang Berjalan", "Status"];
        const data = suppliers.map((s) => [
          s.name,
          s.contact_person || "-",
          s.phone || "-",
          formatRupiah(s.total_debt),
          s.status.toUpperCase(),
        ]);
        return { title: "Laporan Mitra Supplier & Hutang Dagang", columns, data };
      }
      case "metode_bayar": {
        const columns = ["Metode Pembayaran", "Jumlah Transaksi", "Total Nominal", "Porsi Pendapatan"];
        const map: Record<string, { count: number; total: number }> = {};
        filteredSales.filter((s) => s.status === "completed").forEach((s) => {
          s.payments.forEach((p) => {
            if (!map[p.method]) map[p.method] = { count: 0, total: 0 };
            map[p.method].count += 1;
            map[p.method].total += p.amount;
          });
        });
        const totalAll = Object.values(map).reduce((sum, v) => sum + v.total, 0);
        const data = Object.entries(map).map(([m, val]) => [
          m.replace("_", " ").toUpperCase(),
          `${val.count}x`,
          formatRupiah(val.total),
          `${totalAll > 0 ? Math.round((val.total / totalAll) * 100) : 0}%`,
        ]);
        return { title: "Laporan Rekapitulasi Kanal Pembayaran", columns, data };
      }
      default:
        return { title: "Laporan Toko", columns: [], data: [] };
    }
  }, [selectedReport, filteredSales, filteredExpenses, filteredPurchases, products, suppliers, summary]);

  const handleExportPDF = () => {
    generateReportPDF({
      title: reportConfig.title,
      dateRange: dateRangeLabel,
      columns: reportConfig.columns,
      data: reportConfig.data,
      summaryData: reportConfig.summaryData,
      settings,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Pusat Laporan & Ekspor Dokumen</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Unduh 11 modul laporan resmi toko berformat PDF profesional lengkap dengan header identitas dan nomor halaman.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-102"
        >
          <Download className="w-4 h-4" />
          <span>Unduh PDF Dokumen</span>
        </button>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { id: "penjualan", label: "Penjualan" },
          { id: "kasir", label: "Kasir" },
          { id: "pendapatan", label: "Pendapatan" },
          { id: "pengeluaran", label: "Pengeluaran" },
          { id: "laba_rugi", label: "Laba Rugi" },
          { id: "arus_kas", label: "Arus Kas" },
          { id: "pembelian", label: "Pembelian" },
          { id: "stok", label: "Stok Gudang" },
          { id: "produk", label: "Margin Produk" },
          { id: "supplier", label: "Hutang Supplier" },
          { id: "metode_bayar", label: "Metode Bayar" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedReport(item.id as ReportType)}
            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
              selectedReport === item.id
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">Pilih Rentang Waktu:</span>
        </div>

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

      {/* Live Report Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Document Header Representation */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Preview Dokumen Resmi
            </span>
            <h3 className="text-base font-bold text-slate-100">{reportConfig.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Periode: {dateRangeLabel} • Toko: {settings.name}
            </p>
          </div>

          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Simpan PDF</span>
          </button>
        </div>

        {/* Summary metrics if available */}
        {reportConfig.summaryData && reportConfig.summaryData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-950/30 border-b border-slate-800/80">
            {reportConfig.summaryData.map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">{s.label}</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{s.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                {reportConfig.columns.map((col, idx) => (
                  <th key={idx} className="p-3.5 pl-4">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reportConfig.data.length === 0 ? (
                <tr>
                  <td colSpan={reportConfig.columns.length} className="p-8 text-center text-slate-500">
                    Tidak ada baris data untuk laporan ini pada rentang waktu yang dipilih.
                  </td>
                </tr>
              ) : (
                reportConfig.data.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-850/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3.5 pl-4 text-slate-200 font-medium">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
