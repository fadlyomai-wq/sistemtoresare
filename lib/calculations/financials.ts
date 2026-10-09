import { Sale, Expense, Purchase, FinancialSummary, Product } from "@/types";

export interface PeriodFilter {
  type: "weekly" | "monthly" | "yearly" | "custom";
  startDate?: string;
  endDate?: string;
}

export function filterByPeriod<T extends { transaction_date?: string; date?: string; purchase_date?: string; created_at?: string }>(
  items: T[],
  filter: PeriodFilter
): T[] {
  const now = new Date();
  let start = new Date(0);
  let end = new Date();

  if (filter.type === "weekly") {
    start = new Date();
    start.setDate(now.getDate() - 7);
  } else if (filter.type === "monthly") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filter.type === "yearly") {
    start = new Date(now.getFullYear(), 0, 1);
  } else if (filter.type === "custom") {
    if (filter.startDate) start = new Date(filter.startDate);
    if (filter.endDate) {
      end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
    }
  }

  return items.filter((item) => {
    const rawDate = item.transaction_date || item.date || item.purchase_date || item.created_at;
    if (!rawDate) return false;
    const d = new Date(rawDate);
    return d >= start && d <= end;
  });
}

export function calculateFinancialSummary(
  sales: Sale[],
  expenses: Expense[],
  purchases: Purchase[],
  products: Product[],
  periodLabel = "Periode Ini"
): FinancialSummary {
  // Only completed sales count toward revenue and HPP (cancelled/refunded don't generate revenue)
  const validSales = sales.filter((s) => s.status === "completed");

  const gross_sales = validSales.reduce((sum, s) => sum + s.subtotal, 0);
  const discounts = validSales.reduce((sum, s) => sum + (s.item_discounts + s.transaction_discount), 0);
  const net_sales = gross_sales - discounts;

  // HPP / COGS calculation: each sold item * product cost price at the moment of sale
  const cogs_hpp = validSales.reduce((sum, s) => sum + (s.total_cost_price || 0), 0);

  // Laba kotor = Net sales - HPP
  const gross_profit = net_sales - cogs_hpp;

  // Operating Expenses (strictly operational: rent, electric, salary, internet, etc. - NEVER include stock purchases here!)
  const operating_expenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Estimasi laba bersih = Laba kotor - Pengeluaran operasional
  const estimated_net_profit = gross_profit - operating_expenses;

  // Stock Purchases Total
  const stock_purchases = purchases.reduce((sum, p) => sum + p.total_amount, 0);

  // Cash In (Total cash collected from sales + paid amounts)
  const cash_in = validSales.reduce((sum, s) => sum + s.paid_amount, 0);

  // Cash Out (Paid OPEX + Paid purchases)
  const paid_expenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paid_purchases = purchases.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  const cash_out = paid_expenses + paid_purchases;

  // Arus kas bersih = Kas Masuk - Kas Keluar
  const net_cash_flow = cash_in - cash_out;

  const total_transactions = validSales.length;
  const average_transaction = total_transactions > 0 ? Math.round(net_sales / total_transactions) : 0;

  const low_stock_count = products.filter((p) => p.status === "active" && p.stock <= p.min_stock).length;
  const total_products = products.filter((p) => p.status === "active").length;

  return {
    period: periodLabel,
    gross_sales,
    discounts,
    net_sales,
    cogs_hpp,
    gross_profit,
    operating_expenses,
    estimated_net_profit,
    stock_purchases,
    cash_in,
    cash_out,
    net_cash_flow,
    total_transactions,
    average_transaction,
    low_stock_count,
    total_products,
  };
}

export function groupSalesByDay(sales: Sale[]): { date: string; sales: number; profit: number; count: number }[] {
  const map = new Map<string, { sales: number; profit: number; count: number }>();
  
  sales.filter((s) => s.status === "completed").forEach((s) => {
    const d = new Date(s.transaction_date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    const current = map.get(d) || { sales: 0, profit: 0, count: 0 };
    current.sales += s.total_amount;
    current.profit += s.gross_profit;
    current.count += 1;
    map.set(d, current);
  });

  return Array.from(map.entries()).map(([date, val]) => ({
    date,
    ...val,
  }));
}
