import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMART STORE POS — Sistem Kasir & Manajemen Toko Terpadu',
  description: 'Aplikasi manajemen toko terpadu yang memiliki sistem kasir (Point of Sale), manajemen inventaris, pencatatan keuangan, pengelolaan pembelian barang, dan laporan bisnis.',
  openGraph: {
    title: 'SMART STORE POS — Sistem Kasir & Manajemen Toko Terpadu',
    description: 'Aplikasi manajemen toko terpadu yang memiliki sistem kasir (Point of Sale), manajemen inventaris, pencatatan keuangan, pengelolaan pembelian barang, dan laporan bisnis.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SMART STORE POS — Sistem Kasir & Manajemen Toko Terpadu',
    description: 'Aplikasi manajemen toko terpadu yang memiliki sistem kasir (Point of Sale), manajemen inventaris, pencatatan keuangan, pengelolaan pembelian barang, dan laporan bisnis.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className="dark">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
