"use client";

import React, { useState } from "react";
import {
  Settings,
  Store,
  Database,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Save,
  RotateCcw,
  Percent,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { PaymentMethod } from "@/types";
import { testSupabaseConnection } from "@/lib/supabase/client";
import { formatDateID } from "@/lib/utils";

export function SettingsView() {
  const { settings, updateSettings, auditLogs, resetToDefaultData, showToast } = useStore();

  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [taxRate, setTaxRate] = useState(settings.tax_rate);
  const [enableTax, setEnableTax] = useState(settings.enable_tax);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoice_prefix);
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer);
  const [minStockAlert, setMinStockAlert] = useState(settings.min_stock_alert);

  // Supabase test form
  const [supabaseUrl, setSupabaseUrl] = useState(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name,
      address,
      phone,
      email,
      tax_rate: Number(taxRate),
      enable_tax: Boolean(enableTax),
      invoice_prefix: invoicePrefix,
      receipt_footer: receiptFooter,
      min_stock_alert: Number(minStockAlert),
    });
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setConnectionStatus("Harap masukkan Supabase URL dan Anon Key terlebih dahulu.");
      return;
    }
    setIsTesting(true);
    setConnectionStatus("Menguji sambungan ke Supabase PostgreSQL...");
    const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setIsTesting(false);
    setConnectionStatus(res.message);
  };

  const sqlMigrationCode = `-- SMART STORE POS MIGRATION (20 TABLES)
-- Silakan jalankan script ini di SQL Editor dashboard Supabase Anda.
-- File lengkap tersimpan di: /supabase/migrations/20240101_init_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Tabel: stores, profiles, store_settings, categories, suppliers,
-- products, product_price_history, purchases, purchase_items,
-- supplier_payments, expense_categories, expenses, sales,
-- sale_items, payments, inventory_movements, stock_adjustments,
-- returns, return_items, cash_sessions, audit_logs.`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    showToast("SQL snippet berhasil disalin ke clipboard!", "info");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Pengaturan Toko & Database Supabase</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi identitas gerai, format invoice, tarif pajak PPN, struk printer kasir, dan integrasi PostgreSQL.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Store Profile Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleSaveStoreSettings}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Store className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Identitas Gerai & Struk Kasir</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Toko / Bisnis *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">No. Telepon Toko</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Toko</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Lengkap Toko</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Awalan Nomor Invoice</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ambang Peringatan Stok Min</label>
                <input
                  type="number"
                  min="1"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>
            </div>

            {/* Tax Settings */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200">Pajak Penjualan (PPN)</span>
                  <p className="text-[11px] text-slate-500">Otomatis hitung pajak saat kasir checkout</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTax}
                    onChange={(e) => setEnableTax(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {enableTax && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-slate-400">Tarif Pajak (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-100 font-bold"
                  />
                  <span className="text-xs text-slate-500">Standar Indonesia: 11%</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Kaki Struk (Footer)</label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi Toko</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Database & Supabase & Audit Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Supabase PostgreSQL Configuration Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Koneksi Supabase PostgreSQL</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Aplikasi ini memiliki sistem penyimpanan permanen ganda: saat kredensial Supabase diatur, sistem dapat
              langsung berkomunikasi dengan 20 tabel database PostgreSQL dengan Row Level Security (RLS).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">NEXT_PUBLIC_SUPABASE_URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  {isTesting ? "Menguji..." : "Uji Koneksi DB"}
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSql ? "Disalin!" : "Salin Schema 20 Tabel"}</span>
                </button>
              </div>

              {connectionStatus && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400">
                  {connectionStatus}
                </div>
              )}
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Audit Trail Aktivitas</h3>
              </div>
              <span className="text-[10px] text-slate-500">{auditLogs.length} Log Tercatat</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-500">{formatDateID(log.created_at, true)}</span>
                  </div>
                  <p className="text-slate-400 mt-0.5 line-clamp-1">{log.details}</p>
                  <span className="text-[9px] text-slate-500 block mt-1">
                    Oleh: {log.user_name} ({log.user_role})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
