import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "0";
  return new Intl.NumberFormat("id-ID").format(amount);
}

export function formatDateID(dateStringOrObj: string | Date | null | undefined, includeTime = false): string {
  if (!dateStringOrObj) return "-";
  const date = typeof dateStringOrObj === "string" ? new Date(dateStringOrObj) : dateStringOrObj;
  if (isNaN(date.getTime())) return "-";

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      : {}),
  };

  return new Intl.DateTimeFormat("id-ID", options).format(date);
}

export function generateInvoiceCode(prefix = "INV"): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${random}`;
}

export function generateSKU(categoryName: string, id: number | string): string {
  const code = (categoryName || "GEN").slice(0, 3).toUpperCase();
  const rand = String(id).padStart(4, "0");
  return `${code}-${rand}`;
}
