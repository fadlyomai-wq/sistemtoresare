import { StoreSettings, Category, Product, Supplier, Purchase, Expense, Sale, InventoryMovement, AuditLog } from "@/types";

export const initialStoreSettings: StoreSettings = {
  id: "store-001",
  name: "SMART STORE POS",
  logo_url: "",
  address: "Jl. Bisnis Utama No. 01, Jakarta",
  phone: "0812-3456-7890",
  email: "kontak@smartstore.com",
  currency: "IDR",
  tax_rate: 11,
  enable_tax: false,
  default_discount: 0,
  invoice_prefix: "INV",
  receipt_footer: "Terima kasih telah berbelanja di toko kami! Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian.",
  min_stock_alert: 5,
  active_payment_methods: ["tunai", "qris", "transfer_bank", "kartu_debit", "kartu_kredit", "ewallet", "split"],
};

// Clean initial data - No dummy data
export const initialCategories: Category[] = [];
export const initialSuppliers: Supplier[] = [];
export const initialProducts: Product[] = [];
export const initialPurchases: Purchase[] = [];
export const initialExpenses: Expense[] = [];
export const initialSales: Sale[] = [];
export const initialInventoryMovements: InventoryMovement[] = [];
export const initialAuditLogs: AuditLog[] = [];
