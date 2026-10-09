// SMART STORE POS MANAGEMENT SYSTEM - Data Types

export type UserRole = "admin" | "kasir" | "owner";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  store_id: string;
}

export interface StoreSettings {
  id: string;
  name: string;
  logo_url: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  tax_rate: number; // e.g. 11 for 11%
  enable_tax: boolean;
  default_discount: number;
  invoice_prefix: string;
  receipt_footer: string;
  min_stock_alert: number;
  active_payment_methods: PaymentMethod[];
}

export type PaymentMethod =
  | "tunai"
  | "qris"
  | "transfer_bank"
  | "kartu_debit"
  | "kartu_kredit"
  | "ewallet"
  | "split";

export type ProductStatus = "active" | "inactive";

export interface Category {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category_id: string;
  category_name?: string;
  description: string;
  image_url: string;
  cost_price: number; // Harga beli/modal HPP
  sell_price: number; // Harga jual
  stock: number;
  min_stock: number;
  unit: string; // Pcs, Box, Botol, Kg, dll
  supplier_id: string;
  supplier_name?: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductPriceHistory {
  id: string;
  product_id: string;
  old_cost_price: number;
  new_cost_price: number;
  old_sell_price: number;
  new_sell_price: number;
  changed_by: string;
  changed_at: string;
  reason: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  status: "active" | "inactive";
  total_debt: number;
  created_at: string;
}

export type PurchaseCategory = "modal_awal" | "rutin" | "tambahan";
export type PurchasePaymentStatus = "lunas" | "belum_lunas" | "sebagian";
export type PurchaseReceiveStatus = "diterima" | "menunggu" | "batal";

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost_price: number;
  discount: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_id: string;
  supplier_name: string;
  purchase_category: PurchaseCategory;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  paid_amount: number;
  remaining_debt: number;
  payment_method: "tunai" | "transfer_bank" | "utang";
  payment_status: PurchasePaymentStatus;
  receive_status: PurchaseReceiveStatus;
  notes: string;
  proof_url?: string;
  created_by: string;
  created_at: string;
}

export interface SupplierPayment {
  id: string;
  purchase_id: string;
  purchase_number: string;
  supplier_id: string;
  supplier_name: string;
  payment_date: string;
  amount: number;
  payment_method: "tunai" | "transfer_bank";
  reference_no: string;
  notes: string;
  created_by: string;
}

export type ExpenseCategory =
  | "Sewa Tempat"
  | "Listrik"
  | "Air"
  | "Internet"
  | "Gaji Karyawan"
  | "Transportasi"
  | "Perawatan Toko"
  | "Perlengkapan"
  | "Biaya Administrasi"
  | "Lain-lain";

export interface Expense {
  id: string;
  expense_number: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  payment_method: "tunai" | "transfer_bank" | "kartu_debit";
  proof_url?: string;
  created_by: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount_percent: number; // e.g. 5%
  discount_amount: number; // calculated rupiah
  price: number;
  subtotal: number;
  cost_price: number; // for HPP
}

export type TransactionStatus = "completed" | "refunded" | "cancelled";

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  unit: string;
  cost_price: number; // HPP per unit
  sell_price: number;
  quantity: number;
  discount_amount: number;
  subtotal: number;
}

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
  reference_no?: string;
  status: "verified" | "pending";
}

export interface Sale {
  id: string;
  invoice_number: string;
  transaction_date: string;
  cashier_id: string;
  cashier_name: string;
  customer_name?: string;
  customer_phone?: string;
  items: SaleItem[];
  subtotal: number; // Gross items total
  item_discounts: number;
  transaction_discount: number;
  tax_amount: number;
  total_amount: number; // Final payable
  total_cost_price: number; // Total HPP
  gross_profit: number; // total_amount - tax - total_cost_price
  paid_amount: number;
  change_amount: number;
  payment_method: PaymentMethod;
  payments: PaymentRecord[]; // Supports split payments
  status: TransactionStatus;
  notes?: string;
  cancel_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
}

export type MovementType =
  | "stok_masuk" // Dari pembelian
  | "stok_keluar" // Dari penjualan kasir
  | "penyesuaian" // Stock opname / koreksi
  | "retur_pembelian" // Retur ke supplier
  | "retur_penjualan"; // Retur dari pelanggan

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: MovementType;
  quantity: number; // positive or negative
  previous_stock: number;
  current_stock: number;
  reference_no: string; // INV-xxx or PO-xxx or ADJ-xxx
  reason: string;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  module: string;
  details: string;
  created_at: string;
}

export interface FinancialSummary {
  period: string;
  gross_sales: number;
  discounts: number;
  net_sales: number;
  cogs_hpp: number;
  gross_profit: number;
  operating_expenses: number;
  estimated_net_profit: number;
  stock_purchases: number;
  cash_in: number;
  cash_out: number;
  net_cash_flow: number;
  total_transactions: number;
  average_transaction: number;
  low_stock_count: number;
  total_products: number;
}
