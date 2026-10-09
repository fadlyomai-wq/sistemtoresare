import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Sale, StoreSettings, FinancialSummary, Expense, Purchase, Product, Supplier } from "@/types";
import { formatRupiah, formatDateID } from "@/lib/utils";

export function generateReceiptPDF(sale: Sale, settings: StoreSettings) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200 + sale.items.length * 10], // Roll paper format
  });

  const pageWidth = 80;
  let y = 10;

  // Store Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(settings.name || "SMART STORE POS", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (settings.address) {
    const splitAddress = doc.splitTextToSize(settings.address, 70);
    doc.text(splitAddress, pageWidth / 2, y, { align: "center" });
    y += splitAddress.length * 3.5;
  }
  if (settings.phone) {
    doc.text(`Telp: ${settings.phone}`, pageWidth / 2, y, { align: "center" });
    y += 4;
  }

  // Divider
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 75, y);
  y += 4;

  // Metadata
  doc.setFontSize(7.5);
  doc.text(`No. Invoice : ${sale.invoice_number}`, 5, y);
  y += 3.5;
  doc.text(`Tanggal     : ${formatDateID(sale.transaction_date, true)}`, 5, y);
  y += 3.5;
  doc.text(`Kasir       : ${sale.cashier_name}`, 5, y);
  y += 3.5;
  doc.text(`Pelanggan   : ${sale.customer_name || "Umum"}`, 5, y);
  y += 4;

  doc.line(5, y, 75, y);
  y += 4;

  // Items table
  sale.items.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.text(item.product_name, 5, y);
    y += 3.5;

    doc.setFont("helvetica", "normal");
    const itemDetail = `${item.quantity} x ${formatRupiah(item.sell_price)}`;
    doc.text(itemDetail, 8, y);
    doc.text(formatRupiah(item.subtotal), 75, y, { align: "right" });
    y += 3.5;

    if (item.discount_amount > 0) {
      doc.text(`  (Diskon: -${formatRupiah(item.discount_amount)})`, 8, y);
      y += 3;
    }
  });

  doc.line(5, y, 75, y);
  y += 4;

  // Calculations
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", 5, y);
  doc.text(formatRupiah(sale.subtotal), 75, y, { align: "right" });
  y += 3.5;

  if (sale.transaction_discount > 0) {
    doc.text("Diskon Transaksi", 5, y);
    doc.text(`-${formatRupiah(sale.transaction_discount)}`, 75, y, { align: "right" });
    y += 3.5;
  }

  if (sale.tax_amount > 0) {
    doc.text(`Pajak (${settings.tax_rate}%)`, 5, y);
    doc.text(formatRupiah(sale.tax_amount), 75, y, { align: "right" });
    y += 3.5;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL BAYAR", 5, y);
  doc.text(formatRupiah(sale.total_amount), 75, y, { align: "right" });
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Metode Bayar: ${sale.payment_method.toUpperCase()}`, 5, y);
  y += 3.5;
  doc.text("Bayar", 5, y);
  doc.text(formatRupiah(sale.paid_amount), 75, y, { align: "right" });
  y += 3.5;
  doc.text("Kembalian", 5, y);
  doc.text(formatRupiah(sale.change_amount), 75, y, { align: "right" });
  y += 5;

  // Footer note
  doc.line(5, y, 75, y);
  y += 4;
  doc.setFontSize(7);
  const footerNote = doc.splitTextToSize(settings.receipt_footer, 70);
  doc.text(footerNote, pageWidth / 2, y, { align: "center" });

  doc.save(`Invoice_${sale.invoice_number}.pdf`);
}

// Universal Report PDF Generator (A4 format)
export function generateReportPDF({
  title,
  subtitle,
  dateRange,
  columns,
  data,
  summaryData,
  settings,
}: {
  title: string;
  subtitle?: string;
  dateRange: string;
  columns: string[];
  data: (string | number)[][];
  summaryData?: { label: string; value: string }[];
  settings: StoreSettings;
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner
  doc.setFillColor(15, 23, 42); // Dark slate
  doc.rect(0, 0, pageWidth, 28, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(settings.name || "SMART STORE POS", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(settings.address || "Sistem Manajemen Kasir & Toko Terpadu", 14, 18);
  doc.text(`Kontak: ${settings.phone || "-"} | ${settings.email || "-"}`, 14, 23);

  // Report Title Box
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title.toUpperCase(), 14, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Periode: ${dateRange}`, 14, 43);
  doc.text(`Dicetak pada: ${formatDateID(new Date(), true)} WIB`, 14, 48);

  let currentY = 52;

  // Optional summary metrics box
  if (summaryData && summaryData.length > 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 18, 2, 2, "FD");

    const colWidth = (pageWidth - 28) / summaryData.length;
    summaryData.forEach((item, index) => {
      const x = 18 + index * colWidth;
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, x, currentY + 6);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(item.value, x, currentY + 13);
    });

    currentY += 24;
  }

  // AutoTable
  autoTable(doc, {
    startY: currentY,
    head: [columns],
    body: data,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (pageData) => {
      // Footer page numbering
      const totalPages = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${pageData.pageNumber} dari ${totalPages} — Dokumen Resmi ${settings.name}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    },
  });

  const sanitizedTitle = title.replace(/\s+/g, "_");
  doc.save(`${sanitizedTitle}_${Date.now()}.pdf`);
}
