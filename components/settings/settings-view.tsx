"use client";

import React, { useState, useEffect } from "react";
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
  UserCheck,
  User,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { testSupabaseConnection } from "@/lib/supabase/client";
import { formatDateID } from "@/lib/utils";
import { ConfirmDialog } from "../ui/confirm-dialog";

export function SettingsView() {
  const {
    currentUser,
    adminProfile,
    updateAdminProfile,
    settings,
    updateSettings,
    auditLogs,
    clearAllData,
    showToast,
  } = useStore();

  // Admin Profile State (Directly editable in Settings)
  const [adminName, setAdminName] = useState(adminProfile?.name || currentUser.name || "Administrator");
  const [adminEmail, setAdminEmail] = useState(adminProfile?.email || currentUser.email || "admin@smartstore.com");

  // Keep admin profile inputs in sync with store
  useEffect(() => {
    if (adminProfile?.name) {
      setAdminName(adminProfile.name);
    }
    if (adminProfile?.email) {
      setAdminEmail(adminProfile.email);
    }
  }, [adminProfile]);

  // Store Settings State
  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [taxRate, setTaxRate] = useState(settings.tax_rate);
  const [enableTax, setEnableTax] = useState(settings.enable_tax);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoice_prefix);
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer);
  const [minStockAlert, setMinStockAlert] = useState(settings.min_stock_alert);

  // Clear data confirm modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Supabase test form
  const [supabaseUrl, setSupabaseUrl] = useState(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Save Admin Name and Email
  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      showToast("Nama administrator tidak boleh kosong.", "error");
      return;
    }
    updateAdminProfile({
      name: adminName.trim(),
      email: adminEmail.trim(),
    });
  };

  // Save Store Settings
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
            <h2 className="text-xl font-bold text-slate-100">Pengaturan Toko, Admin & Database</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ubah nama administrator, identitas gerai, format invoice, struk printer kasir, dan integrasi Supabase PostgreSQL.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Admin Profile & Store Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* CARD 1: EDIT NAMA ADMINISTRATOR */}
          <form
            onSubmit={handleSaveAdminProfile}
            className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-lg shadow-purple-950/20 space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Profil & Nama Administrator</h3>
                  <p className="text-[11px] text-slate-400">Ubah nama akun administrator sistem toko</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                Super Admin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Administrator *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Contoh: Fadly Omai"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-medium"
                  />
                  <User className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Nama ini akan muncul pada header, sidebar, log audit, dan cetak faktur.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Administrator
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@smartstore.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Email notifikasi dan identifikasi akun admin utama.
                </span>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-xs">
                  {adminName.slice(0, 2).toUpperCase() || "AD"}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Pratinjau Nama di Sistem:</span>
                  <strong className="text-slate-200">{adminName || "Administrator"}</strong>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/40 transition-all hover:scale-102 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Nama Admin</span>
              </button>
            </div>
          </form>

          {/* CARD 2: STORE PROFILE & RECEIPT FORM */}
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
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi Toko</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (5 cols): Database, Reset Data, Audit Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD 3: PEMBERSIHAN DATA TOKO (HAPUS DATA DUMMY) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-slate-100">Manajemen Pembersihan Data</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Semua data dummy telah ditiadakan dari sistem. Jika Anda ingin mengosongkan riwayat transaksi, produk, dan faktur untuk memulai pencatatan dari nol:
            </p>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full px-4 py-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Bersihkan Seluruh Data Toko</span>
            </button>
          </div>

          {/* CARD 4: Supabase PostgreSQL Configuration Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Koneksi Supabase PostgreSQL</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Aplikasi ini memiliki penyimpanan permanen: saat kredensial Supabase diatur, sistem dapat
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
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isTesting ? "Menguji..." : "Uji Koneksi DB"}
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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

          {/* CARD 5: Recent Audit Logs */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Audit Trail Aktivitas</h3>
              </div>
              <span className="text-[10px] text-slate-500">{auditLogs.length} Log</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Belum ada aktivitas tercatat.</p>
              ) : (
                auditLogs.slice(0, 8).map((log) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM CLEAR ALL DATA MODAL */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearAllData();
          setShowClearConfirm(false);
        }}
        title="Bersihkan Seluruh Data Toko"
        description="Apakah Anda yakin ingin mengosongkan semua data produk, kategori, supplier, inventaris, faktur, dan riwayat penjualan? Seluruh data akan di-reset bersih tanpa data dummy."
        confirmText="Ya, Bersihkan Semua Data"
        cancelText="Batal"
      />
    </div>
  );
}
