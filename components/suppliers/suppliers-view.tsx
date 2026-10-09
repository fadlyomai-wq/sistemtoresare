"use client";

import React, { useState } from "react";
import { Building2, Plus, Edit2, Trash2, Phone, Mail, MapPin, Truck, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/storage/store-context";
import { Supplier } from "@/types";
import { formatRupiah, formatDateID } from "@/lib/utils";
import { Modal } from "../ui/modal";
import { ConfirmDialog } from "../ui/confirm-dialog";

export function SuppliersView() {
  const { suppliers, purchases, addSupplier, updateSupplier, deleteSupplier } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // History modal
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState<Supplier | null>(null);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setStatus("active");
    setShowModal(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contact_person || "");
    setPhone(s.phone || "");
    setEmail(s.email || "");
    setAddress(s.address || "");
    setNotes(s.notes || "");
    setStatus(s.status);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name,
        contact_person: contactPerson,
        phone,
        email,
        address,
        notes,
        status,
      });
    } else {
      addSupplier({
        name,
        contact_person: contactPerson,
        phone,
        email,
        address,
        notes,
        status,
        total_debt: 0,
      });
    }

    setShowModal(false);
  };

  const handleDelete = (s: Supplier) => {
    setSupplierToDelete(s);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Mitra Supplier & Vendor</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data kontak vendor pemasok, riwayat pesanan barang dagangan, dan status saldo kewajiban hutang.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => {
          const supplierPurchases = purchases.filter((p) => p.supplier_id === s.id);
          const totalSpent = supplierPurchases.reduce((sum, p) => sum + p.total_amount, 0);

          return (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === "active"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {s.status === "active" ? "Aktif" : "Non-Aktif"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Hapus Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-100 mt-2">{s.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">PIC: {s.contact_person || "-"}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Financial Footprint */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Transaksi:</span>
                  <strong className="text-slate-200">{formatRupiah(totalSpent)}</strong>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Saldo Hutang:</span>
                  <span className={`font-bold ${s.total_debt > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {formatRupiah(s.total_debt)}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedSupplierForHistory(s)}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Riwayat Pembelian ({supplierPurchases.length})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? "Edit Supplier" : "Tambah Supplier Baru"}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Perusahaan / Supplier *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="PT Sumber Makmur Nusantara"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Kontak PIC</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Budi Santoso"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">No. Telepon / WA</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sales@supplier.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Gudang / Kantor</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Tambahan</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Syarat tempo, no rekening transfer..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* SUPPLIER PURCHASE HISTORY MODAL */}
      <Modal
        isOpen={Boolean(selectedSupplierForHistory)}
        onClose={() => setSelectedSupplierForHistory(null)}
        title={`Riwayat Pembelian: ${selectedSupplierForHistory?.name}`}
        description="Faktur pesanan dan mutasi hutang supplier."
        maxWidth="2xl"
      >
        <div className="space-y-3">
          {purchases.filter((p) => p.supplier_id === selectedSupplierForHistory?.id).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Belum ada riwayat pembelian dari supplier ini.
            </p>
          ) : (
            purchases
              .filter((p) => p.supplier_id === selectedSupplierForHistory?.id)
              .map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-slate-100">{p.purchase_number}</span>
                    <span className="text-slate-500 block text-[10px]">
                      {formatDateID(p.purchase_date, true)} • {p.items.length} Barang
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-100 block">{formatRupiah(p.total_amount)}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        p.payment_status === "lunas" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {p.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDialog
        isOpen={Boolean(supplierToDelete)}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={() => {
          if (supplierToDelete) {
            deleteSupplier(supplierToDelete.id);
            setSupplierToDelete(null);
          }
        }}
        title="Hapus Data Supplier"
        description={`Apakah Anda yakin ingin menghapus supplier "${supplierToDelete?.name}"? Data supplier akan dihapus dari sistem.`}
        confirmText="Hapus Supplier"
        cancelText="Batal"
      />
    </div>
  );
}
