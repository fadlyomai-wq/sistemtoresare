"use client";

import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  History,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { useStore } from "@/lib/storage/store-context";
import { Product, ProductStatus } from "@/types";
import { formatRupiah, formatNumber, formatDateID, generateSKU } from "@/lib/utils";
import { Modal } from "../ui/modal";

export function ProductsView() {
  const { products, categories, suppliers, addProduct, updateProduct, deleteProduct, priceHistories } = useStore();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "normal">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add/Edit Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formSku, setFormSku] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formSellPrice, setFormSellPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(5);
  const [formUnit, setFormUnit] = useState("Pcs");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formStatus, setFormStatus] = useState<ProductStatus>("active");
  const [priceChangeReason, setPriceChangeReason] = useState("");

  // Price History Modal
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = categoryFilter === "all" || p.category_id === categoryFilter;
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      let matchesStock = true;
      if (stockFilter === "low") matchesStock = p.stock > 0 && p.stock <= p.min_stock;
      else if (stockFilter === "out") matchesStock = p.stock <= 0;
      else if (stockFilter === "normal") matchesStock = p.stock > p.min_stock;

      return matchesSearch && matchesCat && matchesStatus && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, statusFilter, stockFilter]);

  // Paginated Products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    const cat = categories[0];
    const catName = cat ? cat.name : "GEN";
    setFormSku(generateSKU(catName, products.length + 1));
    setFormBarcode(String(Math.floor(1000000000 + Math.random() * 9000000000)));
    setFormName("");
    setFormCategoryId(cat ? cat.id : "");
    setFormDescription("");
    setFormImageUrl("https://picsum.photos/seed/" + Math.floor(Math.random() * 1000) + "/300/300");
    setFormCostPrice(0);
    setFormSellPrice(0);
    setFormStock(10);
    setFormMinStock(5);
    setFormUnit("Pcs");
    setFormSupplierId(suppliers[0]?.id || "");
    setFormStatus("active");
    setPriceChangeReason("");
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormSku(p.sku);
    setFormBarcode(p.barcode || "");
    setFormName(p.name);
    setFormCategoryId(p.category_id);
    setFormDescription(p.description || "");
    setFormImageUrl(p.image_url || "");
    setFormCostPrice(p.cost_price);
    setFormSellPrice(p.sell_price);
    setFormStock(p.stock);
    setFormMinStock(p.min_stock);
    setFormUnit(p.unit || "Pcs");
    setFormSupplierId(p.supplier_id || "");
    setFormStatus(p.status);
    setPriceChangeReason("");
    setShowFormModal(true);
  };

  // Save product (Add or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) {
      alert("Nama produk dan SKU wajib diisi!");
      return;
    }

    const selectedCat = categories.find((c) => c.id === formCategoryId);
    const selectedSup = suppliers.find((s) => s.id === formSupplierId);

    if (editingProduct) {
      updateProduct(
        editingProduct.id,
        {
          sku: formSku,
          barcode: formBarcode,
          name: formName,
          category_id: formCategoryId,
          category_name: selectedCat?.name || "",
          description: formDescription,
          image_url: formImageUrl,
          cost_price: Number(formCostPrice),
          sell_price: Number(formSellPrice),
          stock: Number(formStock),
          min_stock: Number(formMinStock),
          unit: formUnit,
          supplier_id: formSupplierId,
          supplier_name: selectedSup?.name || "",
          status: formStatus,
        },
        priceChangeReason
      );
    } else {
      addProduct({
        sku: formSku,
        barcode: formBarcode,
        name: formName,
        category_id: formCategoryId,
        category_name: selectedCat?.name || "",
        description: formDescription,
        image_url: formImageUrl,
        cost_price: Number(formCostPrice),
        sell_price: Number(formSellPrice),
        stock: Number(formStock),
        min_stock: Number(formMinStock),
        unit: formUnit,
        supplier_id: formSupplierId,
        supplier_name: selectedSup?.name || "",
        status: formStatus,
      });
    }

    setShowFormModal(false);
  };

  // Delete product with safety warning
  const handleDelete = (p: Product) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${p.name}"?`)) {
      const res = deleteProduct(p.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["ID", "SKU", "Barcode", "Nama Produk", "Kategori", "Harga Beli", "Harga Jual", "Stok", "Satuan", "Status"];
    const rows = products.map((p) => [
      p.id,
      p.sku,
      p.barcode,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category_name || "",
      p.cost_price,
      p.sell_price,
      p.stock,
      p.unit,
      p.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Produk_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Katalog Produk & Harga</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola master data produk, harga modal (HPP), harga jual, barcode, dan batas stok minimum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari SKU, nama, barcode..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status Stok</option>
            <option value="normal">Stok Aman</option>
            <option value="low">Stok Menipis (Di bawah Min)</option>
            <option value="out">Stok Habis (0)</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Status Produk</option>
            <option value="active">Aktif Dijual</option>
            <option value="inactive">Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-4">Produk</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5 text-right">Harga Modal (HPP)</th>
                <th className="p-3.5 text-right">Harga Jual</th>
                <th className="p-3.5 text-right">Margin / Unit</th>
                <th className="p-3.5 text-center">Stok</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 pr-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada data produk yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const margin = p.sell_price - p.cost_price;
                  const marginPct = p.cost_price > 0 ? Math.round((margin / p.cost_price) * 100) : 0;
                  const isLow = p.stock <= p.min_stock;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 shrink-0 relative border border-slate-800">
                            <Image
                              src={p.image_url || "https://picsum.photos/seed/p/100/100"}
                              alt={p.name}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-100 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-500">
                              SKU: <strong className="text-slate-400">{p.sku}</strong> • Barcode: {p.barcode || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">
                          {p.category_name || "Umum"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-300">
                        {formatRupiah(p.cost_price)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        {formatRupiah(p.sell_price)}
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="font-semibold text-emerald-300">+{formatRupiah(margin)}</span>
                        <span className="text-[10px] text-slate-500 block">({marginPct}%)</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isOut
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : isLow
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                        {isLow && !isOut && (
                          <span className="block text-[9px] text-amber-400 mt-0.5">Min: {p.min_stock}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "active"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {p.status === "active" ? "Aktif" : "Non-Aktif"}
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedProductForHistory(p)}
                            title="Riwayat Perubahan Harga"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Produk"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            title="Hapus Produk"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>
            Menampilkan {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredProducts.length)} dari {filteredProducts.length} produk
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              Sebelumnya
            </button>
            <span className="px-2 font-bold text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingProduct ? "Edit Data Produk" : "Tambah Produk Baru"}
        description="Lengkapi detail produk, penetapan harga jual, HPP, serta minimum peringatan stok."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kode SKU / Kode Produk *</label>
              <input
                type="text"
                required
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="FNB-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Barcode / EAN</label>
              <input
                type="text"
                value={formBarcode}
                onChange={(e) => setFormBarcode(e.target.value)}
                placeholder="899123456789"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Produk *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Kopi Susu Aren 250ml"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Produk</label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier Utama</label>
              <select
                value={formSupplierId}
                onChange={(e) => setFormSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Tanpa Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Harga Beli Modal (HPP)</label>
              <input
                type="number"
                min="0"
                required
                value={formCostPrice}
                onChange={(e) => setFormCostPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Harga Jual Satuan *</label>
              <input
                type="number"
                min="0"
                required
                value={formSellPrice}
                onChange={(e) => setFormSellPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Stok Tersedia</label>
              <input
                type="number"
                min="0"
                required
                value={formStock}
                onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Batas Minimum Stok (Alert)</label>
              <input
                type="number"
                min="1"
                required
                value={formMinStock}
                onChange={(e) => setFormMinStock(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Satuan Barang</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="Pcs / Botol / Karung / Kg / Box"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Penjualan</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="active">Aktif (Dapat Dijual)</option>
                <option value="inactive">Non-Aktif (Disembunyikan)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Foto Produk</label>
              <input
                type="text"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://picsum.photos/seed/item/300/300"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {editingProduct && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Alasan Perubahan (Jika Mengubah Harga/Data)
                </label>
                <input
                  type="text"
                  value={priceChangeReason}
                  onChange={(e) => setPriceChangeReason(e.target.value)}
                  placeholder="Contoh: Kenaikan modal dari supplier per awal bulan"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40"
            >
              Simpan Data Produk
            </button>
          </div>
        </form>
      </Modal>

      {/* PRICE HISTORY AUDIT MODAL */}
      <Modal
        isOpen={Boolean(selectedProductForHistory)}
        onClose={() => setSelectedProductForHistory(null)}
        title="Riwayat Perubahan Harga"
        description={`Audit trail penyesuaian harga untuk: ${selectedProductForHistory?.name}`}
      >
        <div className="space-y-3">
          {priceHistories.filter((h) => h.product_id === selectedProductForHistory?.id).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Belum ada riwayat perubahan harga pada produk ini sejak pembuatan awal.
            </p>
          ) : (
            priceHistories
              .filter((h) => h.product_id === selectedProductForHistory?.id)
              .map((h) => (
                <div key={h.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>
                      Harga Jual: {formatRupiah(h.old_sell_price)} ➔{" "}
                      <strong className="text-emerald-400">{formatRupiah(h.new_sell_price)}</strong>
                    </span>
                    <span className="text-slate-500 text-[10px]">{formatDateID(h.changed_at, true)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>
                      HPP Modal: {formatRupiah(h.old_cost_price)} ➔ {formatRupiah(h.new_cost_price)}
                    </span>
                    <span>Diubah oleh: {h.changed_by}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] italic">Alasan: {h.reason}</p>
                </div>
              ))
          )}
        </div>
      </Modal>
    </div>
  );
}
