"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Receipt,
  QrCode,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  CheckCircle,
  Percent,
  Printer,
  Download,
  AlertCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { useStore } from "@/lib/storage/store-context";
import { Product, CartItem, PaymentMethod, PaymentRecord, Sale } from "@/types";
import { formatRupiah, formatNumber, formatDateID } from "@/lib/utils";
import { generateReceiptPDF } from "@/lib/pdf/generator";
import { Modal } from "../ui/modal";

export function PosView() {
  const { products, categories, settings, completeCheckout } = useStore();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [barcodeInput, setBarcodeInput] = useState("");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactionDiscountPercent, setTransactionDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tunai");
  const [cashPaidAmount, setCashPaidAmount] = useState<number>(0);
  const [paymentRefNo, setPaymentRefNo] = useState("");
  const [splitMethod1, setSplitMethod1] = useState<PaymentMethod>("tunai");
  const [splitAmount1, setSplitAmount1] = useState<number>(0);
  const [splitMethod2, setSplitMethod2] = useState<PaymentMethod>("qris");
  const [splitAmount2, setSplitAmount2] = useState<number>(0);
  const [splitRef2, setSplitRef2] = useState("");

  // Completed receipt modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Search input ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== "active") return false;
      const matchCategory = selectedCategory === "all" || p.category_id === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const grossSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((grossSubtotal * transactionDiscountPercent) / 100);
  }, [grossSubtotal, transactionDiscountPercent]);

  const afterDiscount = grossSubtotal - discountAmount;

  const taxAmount = useMemo(() => {
    return settings.enable_tax ? Math.round((afterDiscount * settings.tax_rate) / 100) : 0;
  }, [settings.enable_tax, settings.tax_rate, afterDiscount]);

  const totalAmount = afterDiscount + taxAmount;

  // Change amount
  const changeAmount = useMemo(() => {
    if (paymentMethod === "tunai") {
      return Math.max(0, cashPaidAmount - totalAmount);
    }
    return 0;
  }, [paymentMethod, cashPaidAmount, totalAmount]);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot exceed stock
        const newQty = existing.quantity + 1;
        const discountAmt = Math.round((product.sell_price * existing.discount_percent) / 100) * newQty;
        const subtotal = product.sell_price * newQty - discountAmt;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, discount_amount: discountAmt, subtotal }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            discount_percent: 0,
            discount_amount: 0,
            price: product.sell_price,
            subtotal: product.sell_price,
            cost_price: product.cost_price,
          },
        ];
      }
    });
  };

  // Adjust quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item; // Cannot exceed stock
            const discountAmt = Math.round((item.price * item.discount_percent) / 100) * newQty;
            const subtotal = item.price * newQty - discountAmt;
            return { ...item, quantity: newQty, discount_amount: discountAmt, subtotal };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Set item discount percent
  const setItemDiscount = (productId: string, percent: number) => {
    const validPercent = Math.min(100, Math.max(0, percent || 0));
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const discountAmt = Math.round((item.price * validPercent) / 100) * item.quantity;
          const subtotal = item.price * item.quantity - discountAmt;
          return { ...item, discount_percent: validPercent, discount_amount: discountAmt, subtotal };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setTransactionDiscountPercent(0);
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
  };

  // Handle barcode simulation
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput("");
    } else {
      alert(`Produk dengan Barcode/SKU "${barcodeInput}" tidak ditemukan.`);
    }
  };

  // Open checkout modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashPaidAmount(totalAmount); // default exact amount
    setSplitAmount1(Math.round(totalAmount / 2));
    setSplitAmount2(totalAmount - Math.round(totalAmount / 2));
    setShowCheckoutModal(true);
  };

  // Process checkout
  const handleProcessPayment = () => {
    let payments: PaymentRecord[] = [];
    let effectivePaid = 0;

    if (paymentMethod === "tunai") {
      if (cashPaidAmount < totalAmount) {
        alert("Nominal uang tunai kurang dari total belanja!");
        return;
      }
      effectivePaid = cashPaidAmount;
      payments = [{ method: "tunai", amount: totalAmount, status: "verified" }];
    } else if (paymentMethod === "split") {
      if (splitAmount1 + splitAmount2 < totalAmount) {
        alert("Kombinasi split payment kurang dari total transaksi!");
        return;
      }
      effectivePaid = splitAmount1 + splitAmount2;
      payments = [
        { method: splitMethod1, amount: splitAmount1, status: "verified" },
        { method: splitMethod2, amount: splitAmount2, reference_no: splitRef2 || "SPLIT-REF", status: "verified" },
      ];
    } else {
      // Non cash
      effectivePaid = totalAmount;
      payments = [
        {
          method: paymentMethod,
          amount: totalAmount,
          reference_no: paymentRefNo || `${paymentMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
          status: "verified",
        },
      ];
    }

    const result = completeCheckout({
      cart,
      customerName,
      customerPhone,
      discountPercent: transactionDiscountPercent,
      payments,
      paidAmount: effectivePaid,
      notes,
    });

    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      setShowCheckoutModal(false);
      clearCart();
      setShowReceiptModal(true);
    } else {
      alert(result.message || "Gagal memproses transaksi!");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-6rem)]">
      {/* LEFT SECTION: CATALOG & SEARCH (7 COLS) */}
      <div className="lg:col-span-7 flex flex-col h-full space-y-4">
        {/* Top Control Bar */}
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk (Nama atau SKU)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="relative sm:w-52">
              <Barcode className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan / Ketik Barcode"
                className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </form>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                selectedCategory === "all"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                  selectedCategory === c.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
              <ShoppingBag className="w-12 h-12 mb-2 stroke-1 opacity-50" />
              <p className="font-semibold text-slate-400">Tidak ada produk ditemukan</p>
              <p className="mt-1">Coba kata kunci pencarian atau kategori lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.min_stock;
                const inCart = cart.find((ci) => ci.product.id === product.id);

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`relative p-3 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
                      isOutOfStock
                        ? "bg-slate-950/60 border-slate-900 opacity-60 cursor-not-allowed"
                        : inCart
                        ? "bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/30"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                    }`}
                  >
                    {/* Image Thumbnail */}
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-950 relative mb-2">
                      <Image
                        src={product.image_url || "https://picsum.photos/seed/pos/300/300"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      {inCart && (
                        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow">
                          {inCart.quantity}x di keranjang
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
                        {product.sku}
                      </p>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-2 mt-0.5 leading-snug">
                        {product.name}
                      </h4>
                    </div>

                    {/* Price & Stock Badge */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-xs font-black text-emerald-400">
                          {formatRupiah(product.sell_price)}
                        </span>
                        <p className="text-[10px] text-slate-500">/{product.unit}</p>
                      </div>

                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          isOutOfStock
                            ? "bg-rose-500/20 text-rose-300"
                            : isLowStock
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {isOutOfStock ? "Habis" : `${product.stock} ${product.unit}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: CART & CHECKOUT (5 COLS) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Keranjang Kasir</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} item
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>

        {/* Customer Quick Inputs */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 grid grid-cols-2 gap-2 text-xs shrink-0">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama Pelanggan (opsional)"
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="No. Telp / WA"
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShoppingBag className="w-12 h-12 mb-3 stroke-1 opacity-40 text-slate-400" />
              <p className="text-xs font-bold text-slate-300">Keranjang masih kosong</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Klik produk dari katalog atau scan barcode untuk menambahkan barang ke kasir.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatRupiah(item.price)} / {item.product.unit} • Stok: {item.product.stock}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 shrink-0">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  {/* Item Discount percent */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Percent className="w-3 h-3 text-slate-500" />
                    <span>Diskon:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount_percent || ""}
                      onChange={(e) => setItemDiscount(item.product.id, parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-12 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-200 text-xs"
                    />
                    <span>%</span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-slate-100 text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-slate-800 ml-1 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-3 shrink-0">
          {/* Subtotal, Discount & Tax breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Barang</span>
              <span>{formatRupiah(grossSubtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                Diskon Transaksi ({transactionDiscountPercent}%)
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={transactionDiscountPercent || ""}
                  onChange={(e) => setTransactionDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  placeholder="0"
                  className="w-12 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-200 text-xs"
                />
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
            </div>

            {settings.enable_tax && (
              <div className="flex justify-between text-slate-400">
                <span>Pajak PPN ({settings.tax_rate}%)</span>
                <span>{formatRupiah(taxAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-slate-100">
              <span>Total Tagihan</span>
              <span className="text-lg font-black text-emerald-400">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              cart.length === 0
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 hover:scale-101"
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Bayar Transaksi ({formatRupiah(totalAmount)})</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL WITH ALL 7 PAYMENT METHODS */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title="Pembayaran Transaksi Kasir"
        description={`Total Tagihan: ${formatRupiah(totalAmount)}`}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Pilih Metode Pembayaran</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "tunai" as PaymentMethod, label: "Tunai (Cash)", icon: Banknote },
                { id: "qris" as PaymentMethod, label: "QRIS", icon: QrCode },
                { id: "transfer_bank" as PaymentMethod, label: "Transfer Bank", icon: Building2MethodIcon },
                { id: "kartu_debit" as PaymentMethod, label: "Kartu Debit", icon: CreditCard },
                { id: "kartu_kredit" as PaymentMethod, label: "Kartu Kredit", icon: CreditCard },
                { id: "ewallet" as PaymentMethod, label: "E-Wallet", icon: Smartphone },
                { id: "split" as PaymentMethod, label: "Split Payment", icon: Wallet },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? "bg-emerald-900/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* METHOD-SPECIFIC INTERFACES */}

          {/* 1. TUNAI INTERFACE */}
          {paymentMethod === "tunai" && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Uang Diterima (Rp)
                </label>
                <input
                  type="number"
                  value={cashPaidAmount || ""}
                  onChange={(e) => setCashPaidAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Uang Pas", val: totalAmount },
                  { label: "Rp 20.000", val: 20000 },
                  { label: "Rp 50.000", val: 50000 },
                  { label: "Rp 100.000", val: 100000 },
                  { label: "Rp 200.000", val: 200000 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashPaidAmount(preset.val)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Change Info */}
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400">Kembalian:</span>
                <span
                  className={`text-base font-extrabold ${
                    cashPaidAmount < totalAmount ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {cashPaidAmount < totalAmount
                    ? `Kurang ${formatRupiah(totalAmount - cashPaidAmount)}`
                    : formatRupiah(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {/* 2. QRIS INTERFACE */}
          {paymentMethod === "qris" && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className="p-4 bg-white rounded-2xl shadow-md inline-block">
                {/* Simulated dynamic QR code preview */}
                <div className="w-36 h-36 bg-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-400 rounded-xl relative overflow-hidden">
                  <QrCode className="w-24 h-24 text-slate-900" />
                  <span className="text-[9px] font-bold text-slate-800 uppercase tracking-tighter mt-1">
                    QRIS DINAMIS
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-200">Pindai QRIS untuk Pembayaran</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Nominal otomatis terkunci: <strong className="text-emerald-400">{formatRupiah(totalAmount)}</strong>
                </p>
              </div>

              <div className="w-full pt-2">
                <input
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  placeholder="Kode Referensi / RRN QRIS (opsional)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>
          )}

          {/* 3. NON-CASH (Transfer, Debit, Kredit, E-Wallet) */}
          {["transfer_bank", "kartu_debit", "kartu_kredit", "ewallet"].includes(paymentMethod) && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase">
                    Pembayaran {paymentMethod.replace("_", " ")}
                  </h4>
                  <p className="text-[11px] text-slate-400">Total ditagihkan: {formatRupiah(totalAmount)}</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nomor Referensi / Nomor Approval EDC / ID Transaksi
                </label>
                <input
                  type="text"
                  value={paymentRefNo}
                  onChange={(e) => setPaymentRefNo(e.target.value)}
                  placeholder="Contoh: REF-88192038 / Approval 991823"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* 4. SPLIT PAYMENT */}
          {paymentMethod === "split" && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Method 1 */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Metode 1</label>
                  <select
                    value={splitMethod1}
                    onChange={(e) => setSplitMethod1(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="tunai">Tunai</option>
                    <option value="transfer_bank">Transfer Bank</option>
                    <option value="kartu_debit">Kartu Debit</option>
                  </select>
                  <input
                    type="number"
                    value={splitAmount1 || ""}
                    onChange={(e) => {
                      const v1 = parseInt(e.target.value) || 0;
                      setSplitAmount1(v1);
                      setSplitAmount2(Math.max(0, totalAmount - v1));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-bold"
                  />
                </div>

                {/* Method 2 */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Metode 2</label>
                  <select
                    value={splitMethod2}
                    onChange={(e) => setSplitMethod2(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="qris">QRIS</option>
                    <option value="transfer_bank">Transfer Bank</option>
                    <option value="kartu_debit">Kartu Debit</option>
                    <option value="ewallet">E-Wallet</option>
                  </select>
                  <input
                    type="number"
                    value={splitAmount2 || ""}
                    onChange={(e) => setSplitAmount2(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
                <span className="text-slate-400">Total Terbayar:</span>
                <span className="font-bold text-emerald-400">{formatRupiah(splitAmount1 + splitAmount2)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleProcessPayment}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-102"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Selesaikan & Cetak Struk</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* RECEIPT PREVIEW & PRINT MODAL */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Transaksi Berhasil!"
        description={`Invoice: ${completedSale?.invoice_number}`}
        maxWidth="md"
      >
        {completedSale && (
          <div className="space-y-4">
            {/* Thermal Struk Preview Box */}
            <div
              id="printable-receipt"
              className="p-5 bg-white text-slate-900 font-mono text-[11px] rounded-xl shadow-inner border border-slate-300 space-y-2 select-text"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <p className="font-bold text-sm text-slate-950">{settings.name}</p>
                <p className="text-[10px] text-slate-600">{settings.address}</p>
                <p className="text-[10px] text-slate-600">Telp: {settings.phone}</p>
              </div>

              <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>No. Invoice</span>
                  <span className="font-bold">{completedSale.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu</span>
                  <span>{formatDateID(completedSale.transaction_date, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir</span>
                  <span>{completedSale.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan</span>
                  <span>{completedSale.customer_name || "Umum"}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-400">
                {completedSale.items.map((i, idx) => (
                  <div key={idx}>
                    <div className="font-bold text-slate-950">{i.product_name}</div>
                    <div className="flex justify-between text-slate-700">
                      <span>
                        {i.quantity} x {formatRupiah(i.sell_price)}
                      </span>
                      <span>{formatRupiah(i.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupiah(completedSale.subtotal)}</span>
                </div>
                {completedSale.transaction_discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon</span>
                    <span>-{formatRupiah(completedSale.transaction_discount)}</span>
                  </div>
                )}
                {completedSale.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>PPN ({settings.tax_rate}%)</span>
                    <span>{formatRupiah(completedSale.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL BAYAR</span>
                  <span>{formatRupiah(completedSale.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode: {completedSale.payment_method.toUpperCase()}</span>
                  <span>{formatRupiah(completedSale.paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembalian</span>
                  <span>{formatRupiah(completedSale.change_amount)}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[9px] text-slate-500 pt-1 leading-snug">
                {settings.receipt_footer}
              </div>
            </div>

            {/* Print & PDF Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Printer Kasir</span>
              </button>
              <button
                onClick={() => generateReceiptPDF(completedSale, settings)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Unduh PDF Struk</span>
              </button>
            </div>

            <button
              onClick={() => setShowReceiptModal(false)}
              className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-semibold"
            >
              Transaksi Baru (Selesai)
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Building2MethodIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
