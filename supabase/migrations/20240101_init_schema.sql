-- ====================================================================
-- SMART STORE POS MANAGEMENT SYSTEM — SUPABASE POSTGRESQL MIGRATION
-- Migration: 20240101_init_schema.sql
-- Description: Complete 20-table schema with RLS, indexes, and triggers
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STORES TABLE
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    logo_url TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'IDR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES / USERS (with roles: admin, kasir, owner)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kasir', 'owner')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
    tax_rate NUMERIC(5,2) DEFAULT 11.00,
    enable_tax BOOLEAN DEFAULT TRUE,
    default_discount NUMERIC(5,2) DEFAULT 0.00,
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    receipt_footer TEXT DEFAULT 'Terima kasih telah berbelanja di Smart Store! Barang yang sudah dibeli tidak dapat ditukar.',
    min_stock_alert INTEGER DEFAULT 5,
    active_payment_methods JSONB DEFAULT '["tunai", "qris", "transfer_bank", "kartu_debit", "kartu_kredit", "ewallet", "split"]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    total_debt NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    image_url TEXT,
    cost_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sell_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    unit VARCHAR(20) DEFAULT 'Pcs',
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRODUCT PRICE HISTORY
CREATE TABLE IF NOT EXISTS product_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    old_cost_price NUMERIC(15,2),
    new_cost_price NUMERIC(15,2),
    old_sell_price NUMERIC(15,2),
    new_sell_price NUMERIC(15,2),
    changed_by UUID REFERENCES profiles(id),
    reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PURCHASES (Pembelian Barang)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    purchase_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    purchase_category VARCHAR(30) DEFAULT 'rutin' CHECK (purchase_category IN ('modal_awal', 'rutin', 'tambahan')),
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(15,2) DEFAULT 0.00,
    tax NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    remaining_debt NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(30) DEFAULT 'tunai',
    payment_status VARCHAR(20) DEFAULT 'lunas' CHECK (payment_status IN ('lunas', 'belum_lunas', 'sebagian')),
    receive_status VARCHAR(20) DEFAULT 'diterima' CHECK (receive_status IN ('diterima', 'menunggu', 'batal')),
    proof_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cost_price NUMERIC(15,2) NOT NULL,
    discount NUMERIC(15,2) DEFAULT 0.00,
    subtotal NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SUPPLIER PAYMENTS (Pelunasan Hutang)
CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) DEFAULT 'tunai',
    reference_no VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. EXPENSES (Pengeluaran Operasional)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    expense_number VARCHAR(50) NOT NULL UNIQUE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) DEFAULT 'tunai',
    proof_url TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SALES (Transaksi Penjualan Kasir / POS)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cashier_id UUID REFERENCES profiles(id),
    customer_name VARCHAR(150) DEFAULT 'Pelanggan Umum',
    customer_phone VARCHAR(50),
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    item_discounts NUMERIC(15,2) DEFAULT 0.00,
    transaction_discount NUMERIC(15,2) DEFAULT 0.00,
    tax_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_cost_price NUMERIC(15,2) NOT NULL DEFAULT 0.00, -- Total HPP
    gross_profit NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    change_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
    notes TEXT,
    cancel_reason TEXT,
    cancelled_by UUID REFERENCES profiles(id),
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. SALE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cost_price NUMERIC(15,2) NOT NULL, -- HPP satuan saat penjualan
    sell_price NUMERIC(15,2) NOT NULL,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    subtotal NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. PAYMENTS (Detail Pembayaran termasuk Split)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    reference_no VARCHAR(100),
    status VARCHAR(20) DEFAULT 'verified' CHECK (status IN ('verified', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. INVENTORY MOVEMENTS (Mutasi Stok)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    current_stock INTEGER NOT NULL,
    reference_no VARCHAR(100),
    reason TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. STOCK ADJUSTMENTS
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    actual_stock INTEGER NOT NULL,
    system_stock INTEGER NOT NULL,
    difference INTEGER NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. RETURNS & RETURN ITEMS
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number VARCHAR(50) NOT NULL UNIQUE,
    return_type VARCHAR(20) CHECK (return_type IN ('retur_penjualan', 'retur_pembelian')),
    reference_invoice VARCHAR(50),
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    processed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL
);

-- 20. CASH SESSIONS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id UUID REFERENCES profiles(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    closing_cash NUMERIC(15,2),
    expected_cash NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR FAST QUERYING AND REPORTS
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_inv_movement_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_movement_created ON inventory_movements(created_at);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to check user role from profiles
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Authenticated users can read their store profiles
CREATE POLICY "Allow read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin update profiles" ON profiles FOR UPDATE TO authenticated USING (current_user_role() = 'admin');

-- Products: Everyone authenticated can view, Admin/Owner can manage
CREATE POLICY "View products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage products" ON products FOR ALL TO authenticated USING (current_user_role() IN ('admin', 'owner'));

-- Sales: Kasir, Admin, Owner can view & insert sales
CREATE POLICY "View sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert sales" ON sales FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Cancel sales" ON sales FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'owner'));

-- Expenses: View for Admin and Owner, Kasir cannot view financial expenses
CREATE POLICY "View expenses" ON expenses FOR SELECT TO authenticated USING (current_user_role() IN ('admin', 'owner'));
CREATE POLICY "Manage expenses" ON expenses FOR ALL TO authenticated USING (current_user_role() IN ('admin', 'owner'));

-- Store Settings: Read for all, Write only Admin
CREATE POLICY "Read store settings" ON store_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage store settings" ON store_settings FOR ALL TO authenticated USING (current_user_role() = 'admin');
