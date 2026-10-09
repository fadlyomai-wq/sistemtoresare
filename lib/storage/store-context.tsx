"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  UserProfile,
  UserRole,
  StoreSettings,
  Category,
  Product,
  Supplier,
  Purchase,
  PurchasePaymentStatus,
  Expense,
  Sale,
  InventoryMovement,
  AuditLog,
  CartItem,
  PaymentRecord,
  PaymentMethod,
  ProductPriceHistory,
} from "@/types";
import {
  initialStoreSettings,
  initialCategories,
  initialProducts,
  initialSuppliers,
  initialPurchases,
  initialExpenses,
  initialSales,
  initialInventoryMovements,
  initialAuditLogs,
} from "./initial-data";
import { generateInvoiceCode } from "@/lib/utils";
import confetti from "canvas-confetti";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface StoreContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;

  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  products: Product[];
  addProduct: (product: Omit<Product, "id" | "created_at" | "updated_at">) => boolean;
  updateProduct: (id: string, updates: Partial<Product>, priceReason?: string) => boolean;
  deleteProduct: (id: string) => { success: boolean; message: string };

  categories: Category[];
  addCategory: (cat: Omit<Category, "id" | "created_at">) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => { success: boolean; message: string };

  suppliers: Supplier[];
  addSupplier: (sup: Omit<Supplier, "id" | "created_at">) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => { success: boolean; message: string };
  recordSupplierPayment: (purchaseId: string, amount: number, paymentMethod: "tunai" | "transfer_bank", notes: string) => boolean;

  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, "id" | "purchase_number" | "created_at" | "created_by">) => boolean;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id" | "expense_number" | "created_at" | "created_by">) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  sales: Sale[];
  completeCheckout: (params: {
    cart: CartItem[];
    customerName: string;
    customerPhone: string;
    discountPercent: number;
    payments: PaymentRecord[];
    paidAmount: number;
    notes?: string;
  }) => { success: boolean; sale?: Sale; message?: string };
  cancelSale: (saleId: string, reason: string) => { success: boolean; message: string };

  inventoryMovements: InventoryMovement[];
  addStockAdjustment: (params: {
    productId: string;
    type: "stok_masuk" | "stok_keluar" | "penyesuaian";
    quantity: number;
    reason: string;
  }) => boolean;

  auditLogs: AuditLog[];
  priceHistories: ProductPriceHistory[];

  toasts: ToastMessage[];
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
  removeToast: (id: string) => void;

  resetToDefaultData: () => void;
  isLoaded: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETTINGS: "smartpos_settings",
  PRODUCTS: "smartpos_products",
  CATEGORIES: "smartpos_categories",
  SUPPLIERS: "smartpos_suppliers",
  PURCHASES: "smartpos_purchases",
  EXPENSES: "smartpos_expenses",
  SALES: "smartpos_sales",
  MOVEMENTS: "smartpos_movements",
  AUDIT_LOGS: "smartpos_audit_logs",
  USER: "smartpos_current_user",
  PRICE_HISTORIES: "smartpos_price_histories",
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const [currentUser, setCurrentUserState] = useState<UserProfile>({
    id: "usr-admin",
    name: "Ahmad Dahlan",
    email: "admin@smartstore.id",
    role: "admin",
    store_id: "store-001",
  });

  const [settings, setSettingsState] = useState<StoreSettings>(initialStoreSettings);
  const [categories, setCategoriesState] = useState<Category[]>(initialCategories);
  const [products, setProductsState] = useState<Product[]>(initialProducts);
  const [suppliers, setSuppliersState] = useState<Supplier[]>(initialSuppliers);
  const [purchases, setPurchasesState] = useState<Purchase[]>(initialPurchases);
  const [expenses, setExpensesState] = useState<Expense[]>(initialExpenses);
  const [sales, setSalesState] = useState<Sale[]>(initialSales);
  const [inventoryMovements, setInventoryMovementsState] = useState<InventoryMovement[]>(initialInventoryMovements);
  const [auditLogs, setAuditLogsState] = useState<AuditLog[]>(initialAuditLogs);
  const [priceHistories, setPriceHistoriesState] = useState<ProductPriceHistory[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hydrate from localStorage on client-side mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    queueMicrotask(() => {
      try {
        const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (storedSettings) setSettingsState(JSON.parse(storedSettings));

        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (storedUser) setCurrentUserState(JSON.parse(storedUser));

        const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (storedCategories) setCategoriesState(JSON.parse(storedCategories));

        const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (storedProducts) setProductsState(JSON.parse(storedProducts));

        const storedSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
        if (storedSuppliers) setSuppliersState(JSON.parse(storedSuppliers));

        const storedPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
        if (storedPurchases) setPurchasesState(JSON.parse(storedPurchases));

        const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
        if (storedExpenses) setExpensesState(JSON.parse(storedExpenses));

        const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);
        if (storedSales) setSalesState(JSON.parse(storedSales));

        const storedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
        if (storedMovements) setInventoryMovementsState(JSON.parse(storedMovements));

        const storedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
        if (storedAudit) setAuditLogsState(JSON.parse(storedAudit));

        const storedPriceHist = localStorage.getItem(STORAGE_KEYS.PRICE_HISTORIES);
        if (storedPriceHist) setPriceHistoriesState(JSON.parse(storedPriceHist));
      } catch (e) {
        console.error("Error reading localStorage:", e);
      } finally {
        setIsLoaded(true);
      }
    });
  }, []);

  // Helper to persist and log
  const logAudit = useCallback((action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: "log-" + Date.now(),
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: currentUser.role,
      action,
      module,
      details,
      created_at: new Date().toISOString(),
    };
    setAuditLogsState((prev) => {
      const updated = [newLog, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUser]);

  const switchRole = useCallback((role: UserRole) => {
    let name = "Ahmad Dahlan";
    let email = "admin@smartstore.id";
    let id = "usr-admin";

    if (role === "kasir") {
      name = "Sarah Melinda";
      email = "kasir@smartstore.id";
      id = "usr-kasir";
    } else if (role === "owner") {
      name = "Hendra Gunawan";
      email = "owner@smartstore.id";
      id = "usr-owner";
    }

    const updatedUser: UserProfile = {
      id,
      name,
      email,
      role,
      store_id: "store-001",
    };

    setCurrentUserState(updatedUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
    showToast(`Beralih ke akun ${name} (Role: ${role.toUpperCase()})`, "info");
  }, [showToast]);

  const setCurrentUser = useCallback((user: UserProfile) => {
    setCurrentUserState(user);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<StoreSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      }
      return updated;
    });
    logAudit("UPDATE_SETTINGS", "Pengaturan", "Memperbarui konfigurasi sistem toko");
    showToast("Pengaturan toko berhasil diperbarui!", "success");
  }, [logAudit, showToast]);

  // Product CRUD
  const addProduct = useCallback(
    (data: Omit<Product, "id" | "created_at" | "updated_at">): boolean => {
      const now = new Date().toISOString();
      const newProd: Product = {
        ...data,
        id: "prod-" + Date.now(),
        created_at: now,
        updated_at: now,
      };

      setProductsState((prev) => {
        const updated = [newProd, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        }
        return updated;
      });

      // If initial stock > 0, log movement
      if (newProd.stock > 0) {
        const movement: InventoryMovement = {
          id: "mov-" + Date.now(),
          product_id: newProd.id,
          product_name: newProd.name,
          movement_type: "stok_masuk",
          quantity: newProd.stock,
          previous_stock: 0,
          current_stock: newProd.stock,
          reference_no: "INIT-" + newProd.sku,
          reason: "Stok awal produk baru",
          created_by: currentUser.name,
          created_at: now,
        };
        setInventoryMovementsState((prev) => {
          const upd = [movement, ...prev];
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(upd));
          }
          return upd;
        });
      }

      logAudit("TAMBAH_PRODUK", "Produk", `Menambahkan produk baru: ${newProd.name} (${newProd.sku})`);
      showToast(`Produk ${newProd.name} berhasil ditambahkan!`, "success");
      return true;
    },
    [currentUser.name, logAudit, showToast]
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>, priceReason?: string): boolean => {
      let priceChangeRecorded = false;
      const target = products.find((p) => p.id === id);
      if (!target) return false;

      // Price change history check
      if (
        (updates.cost_price !== undefined && updates.cost_price !== target.cost_price) ||
        (updates.sell_price !== undefined && updates.sell_price !== target.sell_price)
      ) {
        const hist: ProductPriceHistory = {
          id: "ph-" + Date.now(),
          product_id: id,
          old_cost_price: target.cost_price,
          new_cost_price: updates.cost_price ?? target.cost_price,
          old_sell_price: target.sell_price,
          new_sell_price: updates.sell_price ?? target.sell_price,
          changed_by: currentUser.name,
          changed_at: new Date().toISOString(),
          reason: priceReason || "Perubahan harga satuan",
        };
        setPriceHistoriesState((prev) => {
          const upd = [hist, ...prev];
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEYS.PRICE_HISTORIES, JSON.stringify(upd));
          }
          return upd;
        });
        priceChangeRecorded = true;
      }

      setProductsState((prev) => {
        const updated = prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        }
        return updated;
      });

      logAudit("EDIT_PRODUK", "Produk", `Memperbarui data produk: ${target.name}${priceChangeRecorded ? " (Termasuk harga)" : ""}`);
      showToast("Data produk berhasil disimpan!", "success");
      return true;
    },
    [products, currentUser.name, logAudit, showToast]
  );

  const deleteProduct = useCallback(
    (id: string): { success: boolean; message: string } => {
      // Check if product exists in any historical sales
      const isUsedInSales = sales.some((s) => s.items.some((i) => i.product_id === id));
      if (isUsedInSales) {
        return {
          success: false,
          message: "Produk ini tidak dapat dihapus permanen karena memiliki riwayat transaksi penjualan. Anda dapat menonaktifkan status produk menjadi Non-Aktif.",
        };
      }

      const target = products.find((p) => p.id === id);
      setProductsState((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        }
        return updated;
      });

      logAudit("HAPUS_PRODUK", "Produk", `Menghapus produk: ${target?.name || id}`);
      showToast(`Produk ${target?.name || ""} berhasil dihapus!`, "info");
      return { success: true, message: "Produk berhasil dihapus." };
    },
    [products, sales, logAudit, showToast]
  );

  // Category CRUD
  const addCategory = useCallback(
    (cat: Omit<Category, "id" | "created_at">) => {
      const newCat: Category = {
        ...cat,
        id: "cat-" + Date.now(),
        created_at: new Date().toISOString(),
      };
      setCategoriesState((prev) => {
        const upd = [newCat, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(upd));
        }
        return upd;
      });
      logAudit("TAMBAH_KATEGORI", "Kategori", `Menambahkan kategori: ${newCat.name}`);
      showToast(`Kategori ${newCat.name} berhasil ditambahkan!`, "success");
    },
    [logAudit, showToast]
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      setCategoriesState((prev) => {
        const upd = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(upd));
        }
        return upd;
      });
      logAudit("EDIT_KATEGORI", "Kategori", `Memperbarui kategori ID: ${id}`);
      showToast("Kategori berhasil diperbarui!", "success");
    },
    [logAudit, showToast]
  );

  const deleteCategory = useCallback(
    (id: string): { success: boolean; message: string } => {
      const hasProducts = products.some((p) => p.category_id === id);
      if (hasProducts) {
        return {
          success: false,
          message: "Kategori tidak dapat dihapus karena masih digunakan oleh beberapa produk aktif.",
        };
      }
      setCategoriesState((prev) => {
        const upd = prev.filter((c) => c.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(upd));
        }
        return upd;
      });
      showToast("Kategori berhasil dihapus!", "info");
      return { success: true, message: "Kategori berhasil dihapus." };
    },
    [products, showToast]
  );

  // Supplier CRUD
  const addSupplier = useCallback(
    (sup: Omit<Supplier, "id" | "created_at">) => {
      const newSup: Supplier = {
        ...sup,
        id: "sup-" + Date.now(),
        created_at: new Date().toISOString(),
      };
      setSuppliersState((prev) => {
        const upd = [newSup, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(upd));
        }
        return upd;
      });
      logAudit("TAMBAH_SUPPLIER", "Supplier", `Menambahkan supplier: ${newSup.name}`);
      showToast(`Supplier ${newSup.name} berhasil ditambahkan!`, "success");
    },
    [logAudit, showToast]
  );

  const updateSupplier = useCallback(
    (id: string, updates: Partial<Supplier>) => {
      setSuppliersState((prev) => {
        const upd = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(upd));
        }
        return upd;
      });
      showToast("Data supplier berhasil diperbarui!", "success");
    },
    [showToast]
  );

  const deleteSupplier = useCallback(
    (id: string): { success: boolean; message: string } => {
      const hasPurchases = purchases.some((p) => p.supplier_id === id);
      if (hasPurchases) {
        return {
          success: false,
          message: "Supplier ini memiliki riwayat transaksi pembelian dan tidak dapat dihapus.",
        };
      }
      setSuppliersState((prev) => {
        const upd = prev.filter((s) => s.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(upd));
        }
        return upd;
      });
      showToast("Supplier berhasil dihapus.", "info");
      return { success: true, message: "Supplier berhasil dihapus." };
    },
    [purchases, showToast]
  );

  const recordSupplierPayment = useCallback(
    (purchaseId: string, amount: number, paymentMethod: "tunai" | "transfer_bank", notes: string): boolean => {
      const purchase = purchases.find((p) => p.id === purchaseId);
      if (!purchase) return false;

      const newRemainingDebt = Math.max(0, purchase.remaining_debt - amount);
      const newPaidAmount = purchase.paid_amount + amount;
      const newStatus: PurchasePaymentStatus = newRemainingDebt === 0 ? "lunas" : "sebagian";

      // Update purchase record
      setPurchasesState((prev) => {
        const upd = prev.map((p) =>
          p.id === purchaseId
            ? { ...p, paid_amount: newPaidAmount, remaining_debt: newRemainingDebt, payment_status: newStatus }
            : p
        );
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(upd));
        }
        return upd;
      });

      // Update supplier debt total
      setSuppliersState((prev) => {
        const upd = prev.map((s) =>
          s.id === purchase.supplier_id ? { ...s, total_debt: Math.max(0, s.total_debt - amount) } : s
        );
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(upd));
        }
        return upd;
      });

      logAudit(
        "BAYAR_HUTANG_SUPPLIER",
        "Pembelian",
        `Membayar hutang pembelian ${purchase.purchase_number} ke ${purchase.supplier_name} sebesar Rp ${amount.toLocaleString()}`
      );
      showToast("Pembayaran hutang supplier berhasil dicatat!", "success");
      return true;
    },
    [purchases, logAudit, showToast]
  );

  // Purchase Order with automatic stock increment
  const addPurchase = useCallback(
    (purchaseData: Omit<Purchase, "id" | "purchase_number" | "created_at" | "created_by">): boolean => {
      const now = new Date().toISOString();
      const purchaseNumber = "PO-" + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, "0") + "-" + Math.floor(1000 + Math.random() * 9000);

      const newPurchase: Purchase = {
        ...purchaseData,
        id: "po-" + Date.now(),
        purchase_number: purchaseNumber,
        created_by: currentUser.name,
        created_at: now,
      };

      // 1. Save purchase
      setPurchasesState((prev) => {
        const upd = [newPurchase, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(upd));
        }
        return upd;
      });

      // 2. If status is received ("diterima"), immediately increment products stock & log movements!
      if (newPurchase.receive_status === "diterima") {
        setProductsState((prev) => {
          const updated = [...prev];
          newPurchase.items.forEach((item) => {
            const idx = updated.findIndex((p) => p.id === item.product_id);
            if (idx !== -1) {
              const prevStock = updated[idx].stock;
              const newStock = prevStock + item.quantity;
              updated[idx] = {
                ...updated[idx],
                stock: newStock,
                cost_price: item.cost_price, // Update latest purchase cost
                updated_at: now,
              };

              // Movement log
              const movement: InventoryMovement = {
                id: "mov-" + Math.random().toString(36).substring(2, 9),
                product_id: item.product_id,
                product_name: item.product_name,
                movement_type: "stok_masuk",
                quantity: item.quantity,
                previous_stock: prevStock,
                current_stock: newStock,
                reference_no: purchaseNumber,
                reason: `Pembelian dari ${newPurchase.supplier_name} (${newPurchase.purchase_category})`,
                created_by: currentUser.name,
                created_at: now,
              };

              setInventoryMovementsState((mPrev) => {
                const mUpd = [movement, ...mPrev];
                if (typeof window !== "undefined") {
                  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(mUpd));
                }
                return mUpd;
              });
            }
          });

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
          }
          return updated;
        });
      }

      // 3. If utang (remaining debt > 0), increase supplier debt
      if (newPurchase.remaining_debt > 0) {
        setSuppliersState((prev) => {
          const upd = prev.map((s) =>
            s.id === newPurchase.supplier_id ? { ...s, total_debt: s.total_debt + newPurchase.remaining_debt } : s
          );
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(upd));
          }
          return upd;
        });
      }

      logAudit("PEMBELIAN_BARU", "Pembelian", `Mencatat pembelian ${purchaseNumber} dari ${newPurchase.supplier_name}`);
      showToast(`Pembelian ${purchaseNumber} berhasil disimpan!`, "success");
      return true;
    },
    [currentUser.name, logAudit, showToast]
  );

  // Expenses CRUD
  const addExpense = useCallback(
    (exp: Omit<Expense, "id" | "expense_number" | "created_at" | "created_by">) => {
      const now = new Date().toISOString();
      const expNumber = "EXP-" + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, "0") + "-" + Math.floor(1000 + Math.random() * 9000);

      const newExpense: Expense = {
        ...exp,
        id: "exp-" + Date.now(),
        expense_number: expNumber,
        created_by: currentUser.name,
        created_at: now,
      };

      setExpensesState((prev) => {
        const upd = [newExpense, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(upd));
        }
        return upd;
      });

      logAudit("TAMBAH_PENGELUARAN", "Pengeluaran", `Mencatat pengeluaran ${newExpense.category}: Rp ${newExpense.amount.toLocaleString()}`);
      showToast("Pengeluaran operasional berhasil dicatat!", "success");
    },
    [currentUser.name, logAudit, showToast]
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<Expense>) => {
      setExpensesState((prev) => {
        const upd = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(upd));
        }
        return upd;
      });
      showToast("Pengeluaran berhasil diperbarui!", "success");
    },
    [showToast]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setExpensesState((prev) => {
        const upd = prev.filter((e) => e.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(upd));
        }
        return upd;
      });
      showToast("Pengeluaran berhasil dihapus.", "info");
    },
    [showToast]
  );

  // ATOMIC POINT OF SALE CHECKOUT
  const completeCheckout = useCallback(
    ({
      cart,
      customerName,
      customerPhone,
      discountPercent,
      payments,
      paidAmount,
      notes,
    }: {
      cart: CartItem[];
      customerName: string;
      customerPhone: string;
      discountPercent: number;
      payments: PaymentRecord[];
      paidAmount: number;
      notes?: string;
    }): { success: boolean; sale?: Sale; message?: string } => {
      if (cart.length === 0) {
        return { success: false, message: "Keranjang belanja masih kosong." };
      }

      // Step 1: Pre-flight stock validation
      for (const item of cart) {
        const liveProd = products.find((p) => p.id === item.product.id);
        if (!liveProd) {
          return { success: false, message: `Produk ${item.product.name} tidak ditemukan di sistem.` };
        }
        if (liveProd.stock < item.quantity) {
          return {
            success: false,
            message: `Stok tidak mencukupi untuk "${liveProd.name}". Stok tersisa: ${liveProd.stock}, diminta: ${item.quantity}`,
          };
        }
      }

      // Step 2: Accurate financial calculation
      const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
      const itemDiscounts = cart.reduce((sum, item) => sum + item.discount_amount, 0);
      const transactionDiscount = Math.round((subtotal * discountPercent) / 100);
      const afterDiscount = subtotal - transactionDiscount;

      const taxAmount = settings.enable_tax ? Math.round((afterDiscount * settings.tax_rate) / 100) : 0;
      const totalAmount = afterDiscount + taxAmount;

      // Validate payment coverage
      if (paidAmount < totalAmount) {
        return {
          success: false,
          message: `Uang pembayaran kurang! Total tagihan: Rp ${totalAmount.toLocaleString()}, Dibayar: Rp ${paidAmount.toLocaleString()}`,
        };
      }

      const changeAmount = paidAmount - totalAmount;

      // HPP calculation per unit
      const totalCostPrice = cart.reduce((sum, item) => sum + item.product.cost_price * item.quantity, 0);
      const grossProfit = afterDiscount - totalCostPrice;

      const now = new Date().toISOString();
      const invoiceNumber = generateInvoiceCode(settings.invoice_prefix || "INV");

      // Primary payment method label
      const primaryMethod: PaymentMethod = payments.length === 1 ? payments[0].method : "split";

      const newSale: Sale = {
        id: "sale-" + Date.now(),
        invoice_number: invoiceNumber,
        transaction_date: now,
        cashier_id: currentUser.id,
        cashier_name: currentUser.name,
        customer_name: customerName || "Pelanggan Umum",
        customer_phone: customerPhone,
        items: cart.map((ci) => ({
          id: "si-" + Math.random().toString(36).substring(2, 9),
          sale_id: "",
          product_id: ci.product.id,
          product_name: ci.product.name,
          sku: ci.product.sku,
          unit: ci.product.unit,
          cost_price: ci.product.cost_price,
          sell_price: ci.price,
          quantity: ci.quantity,
          discount_amount: ci.discount_amount,
          subtotal: ci.subtotal,
        })),
        subtotal,
        item_discounts: itemDiscounts,
        transaction_discount: transactionDiscount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        total_cost_price: totalCostPrice,
        gross_profit: grossProfit,
        paid_amount: paidAmount,
        change_amount: changeAmount,
        payment_method: primaryMethod,
        payments,
        status: "completed",
        notes,
        created_at: now,
      };

      // Step 3: Atomic stock decrement & inventory movement creation
      const updatedMovements: InventoryMovement[] = [];
      const updatedProducts = products.map((prod) => {
        const inCart = cart.find((ci) => ci.product.id === prod.id);
        if (inCart) {
          const prevStock = prod.stock;
          const currentStock = prevStock - inCart.quantity;

          updatedMovements.push({
            id: "mov-" + Math.random().toString(36).substring(2, 9),
            product_id: prod.id,
            product_name: prod.name,
            movement_type: "stok_keluar",
            quantity: -inCart.quantity,
            previous_stock: prevStock,
            current_stock: currentStock,
            reference_no: invoiceNumber,
            reason: `Penjualan Kasir - Invoice ${invoiceNumber}`,
            created_by: currentUser.name,
            created_at: now,
          });

          return {
            ...prod,
            stock: currentStock,
            updated_at: now,
          };
        }
        return prod;
      });

      // Commit changes to state and localStorage atomically
      setProductsState(updatedProducts);
      setInventoryMovementsState((prev) => [ ...updatedMovements, ...prev ]);
      setSalesState((prev) => [newSale, ...prev]);

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
        localStorage.setItem(
          STORAGE_KEYS.MOVEMENTS,
          JSON.stringify([...updatedMovements, ...inventoryMovements])
        );
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([newSale, ...sales]));
      }

      logAudit(
        "TRANSAKSI_KASIR_SELESAI",
        "POS",
        `Invoice ${invoiceNumber} berhasil diselesaikan. Total: Rp ${totalAmount.toLocaleString()} oleh ${currentUser.name}`
      );

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // ignore if not rendered
      }

      showToast(`Transaksi ${invoiceNumber} sukses disimpan!`, "success");
      return { success: true, sale: newSale };
    },
    [currentUser, products, settings, inventoryMovements, sales, logAudit, showToast]
  );

  // Cancel transaction with stock restoration & audit trail
  const cancelSale = useCallback(
    (saleId: string, reason: string): { success: boolean; message: string } => {
      const targetSale = sales.find((s) => s.id === saleId);
      if (!targetSale) {
        return { success: false, message: "Transaksi tidak ditemukan." };
      }
      if (targetSale.status === "cancelled") {
        return { success: false, message: "Transaksi ini sudah dibatalkan sebelumnya." };
      }

      const now = new Date().toISOString();

      // Step 1: Restore stock for all items
      const updatedMovements: InventoryMovement[] = [];
      const updatedProducts = products.map((prod) => {
        const item = targetSale.items.find((si) => si.product_id === prod.id);
        if (item) {
          const prevStock = prod.stock;
          const restoredStock = prevStock + item.quantity;

          updatedMovements.push({
            id: "mov-" + Math.random().toString(36).substring(2, 9),
            product_id: prod.id,
            product_name: prod.name,
            movement_type: "retur_penjualan",
            quantity: item.quantity,
            previous_stock: prevStock,
            current_stock: restoredStock,
            reference_no: targetSale.invoice_number,
            reason: `Pembatalan Transaksi: ${reason}`,
            created_by: currentUser.name,
            created_at: now,
          });

          return {
            ...prod,
            stock: restoredStock,
            updated_at: now,
          };
        }
        return prod;
      });

      // Step 2: Mark sale as cancelled
      const updatedSales = sales.map((s) =>
        s.id === saleId
          ? {
              ...s,
              status: "cancelled" as const,
              cancel_reason: reason,
              cancelled_by: currentUser.name,
              cancelled_at: now,
            }
          : s
      );

      setProductsState(updatedProducts);
      setInventoryMovementsState((prev) => [...updatedMovements, ...prev]);
      setSalesState(updatedSales);

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
        localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([...updatedMovements, ...inventoryMovements]));
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));
      }

      logAudit(
        "BATALKAN_TRANSAKSI",
        "Transaksi",
        `Membatalkan invoice ${targetSale.invoice_number}. Alasan: ${reason}`
      );

      showToast(`Transaksi ${targetSale.invoice_number} berhasil dibatalkan dan stok dikembalikan!`, "warning");
      return { success: true, message: "Transaksi berhasil dibatalkan." };
    },
    [sales, products, currentUser.name, inventoryMovements, logAudit, showToast]
  );

  // Manual stock adjustment / opname
  const addStockAdjustment = useCallback(
    ({
      productId,
      type,
      quantity,
      reason,
    }: {
      productId: string;
      type: "stok_masuk" | "stok_keluar" | "penyesuaian";
      quantity: number;
      reason: string;
    }): boolean => {
      const prod = products.find((p) => p.id === productId);
      if (!prod) return false;

      const prevStock = prod.stock;
      let newStock = prevStock;

      if (type === "stok_masuk") {
        newStock = prevStock + Math.abs(quantity);
      } else if (type === "stok_keluar") {
        newStock = Math.max(0, prevStock - Math.abs(quantity));
      } else if (type === "penyesuaian") {
        // Direct set
        newStock = Math.max(0, quantity);
      }

      const diff = newStock - prevStock;
      const now = new Date().toISOString();

      const movement: InventoryMovement = {
        id: "mov-" + Date.now(),
        product_id: prod.id,
        product_name: prod.name,
        movement_type: type,
        quantity: diff,
        previous_stock: prevStock,
        current_stock: newStock,
        reference_no: "ADJ-" + Math.floor(1000 + Math.random() * 9000),
        reason: reason || "Penyesuaian stok opname",
        created_by: currentUser.name,
        created_at: now,
      };

      setProductsState((prev) => {
        const upd = prev.map((p) => (p.id === productId ? { ...p, stock: newStock, updated_at: now } : p));
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(upd));
        }
        return upd;
      });

      setInventoryMovementsState((prev) => {
        const upd = [movement, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(upd));
        }
        return upd;
      });

      logAudit("PENYESUAIAN_STOK", "Inventaris", `Penyesuaian stok ${prod.name} dari ${prevStock} menjadi ${newStock}. Alasan: ${reason}`);
      showToast(`Stok ${prod.name} berhasil diperbarui menjadi ${newStock}!`, "success");
      return true;
    },
    [products, currentUser.name, logAudit, showToast]
  );

  const resetToDefaultData = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    setSettingsState(initialStoreSettings);
    setCategoriesState(initialCategories);
    setProductsState(initialProducts);
    setSuppliersState(initialSuppliers);
    setPurchasesState(initialPurchases);
    setExpensesState(initialExpenses);
    setSalesState(initialSales);
    setInventoryMovementsState(initialInventoryMovements);
    setAuditLogsState(initialAuditLogs);
    setPriceHistoriesState([]);
    showToast("Data aplikasi berhasil direset ke data default!", "info");
  }, [showToast]);

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        settings,
        updateSettings,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        recordSupplierPayment,
        purchases,
        addPurchase,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        sales,
        completeCheckout,
        cancelSale,
        inventoryMovements,
        addStockAdjustment,
        auditLogs,
        priceHistories,
        toasts,
        showToast,
        removeToast,
        resetToDefaultData,
        isLoaded,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
