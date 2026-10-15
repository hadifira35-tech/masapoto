import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Clock,
  Shirt,
  AlertCircle,
} from 'lucide-react';
import { Package, PackageTerm, PackageField } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { dataService } from '../../services/dataService';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';

interface PackagesViewProps {
  packages: Package[];
  onPackagesUpdated: (packages: Package[]) => void;
}

export const PackagesView: React.FC<PackagesViewProps> = ({
  packages,
  onPackagesUpdated,
}) => {
  const { showToast } = useToast();
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [maxDuration, setMaxDuration] = useState<number>(5);
  const [attirePolicy, setAttirePolicy] = useState('');
  const [extraTimePolicy, setExtraTimePolicy] = useState('');
  const [terms, setTerms] = useState<PackageTerm[]>([]);
  const [fields, setFields] = useState<PackageField[]>([]);
  const [newTermText, setNewTermText] = useState('');

  const openCreateModal = () => {
    setEditingPkg(null);
    setName('');
    setCode('PKG-' + Math.floor(100 + Math.random() * 900));
    setPrice(2000000);
    setDescription('');
    setMaxDuration(5);
    setAttirePolicy('Pergantian attire atau lebih dari 1 attire wajib upgrade paket.');
    setExtraTimePolicy('Tidak tersedia extra time.');
    setTerms([
      { id: 't1', term_text: 'Durasi dokumentasi maksimal 5 jam, terhitung 1 jam sebelum acara dimulai.', sort_order: 1 },
      { id: 't2', term_text: 'Dokumentasi menyesuaikan durasi paket.', sort_order: 2 },
      { id: 't3', term_text: 'Pergantian attire atau lebih dari 1 attire wajib upgrade paket.', sort_order: 3 },
      { id: 't4', term_text: 'Tidak tersedia extra time.', sort_order: 4 },
    ]);
    setFields([
      {
        id: 'f1',
        field_key: 'guest_count',
        field_label: 'Jumlah Tamu Undangan',
        field_type: 'number',
        placeholder: '100',
        is_required: true,
        min_val: 10,
        max_val: 150,
        unit: 'Orang',
        helper_text: 'Maks. 150 tamu',
        sort_order: 1,
        is_active: true,
      },
      {
        id: 'f2',
        field_key: 'attire_count',
        field_label: 'Jumlah Attire',
        field_type: 'number',
        placeholder: '1',
        is_required: true,
        min_val: 1,
        max_val: 1,
        unit: 'Attire',
        helper_text: 'Maks. 1 attire',
        sort_order: 2,
        is_active: true,
      },
      {
        id: 'f3',
        field_key: 'event_duration',
        field_label: 'Durasi Acara',
        field_type: 'number',
        placeholder: '5',
        is_required: true,
        min_val: 1,
        max_val: 5,
        unit: 'Jam',
        helper_text: 'Maks. 5 jam',
        sort_order: 3,
        is_active: true,
      },
      {
        id: 'f4',
        field_key: 'finish_time_estimate',
        field_label: 'Estimasi Waktu Selesai',
        field_type: 'time',
        placeholder: '13:00',
        is_required: true,
        unit: 'WIB',
        sort_order: 4,
        is_active: true,
      },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setCode(pkg.code);
    setPrice(pkg.price);
    setDescription(pkg.description);
    setMaxDuration(pkg.max_duration_hours);
    setAttirePolicy(pkg.attire_policy);
    setExtraTimePolicy(pkg.extra_time_policy);
    setTerms([...(pkg.terms || [])]);
    setFields([...(pkg.fields || [])]);
    setIsModalOpen(true);
  };

  const handleAddTerm = () => {
    if (!newTermText.trim()) return;
    setTerms([
      ...terms,
      { id: 'term-' + Date.now(), term_text: newTermText.trim(), sort_order: terms.length + 1 },
    ]);
    setNewTermText('');
  };

  const handleRemoveTerm = (id: string) => {
    setTerms(terms.filter((t) => t.id !== id));
  };

  const handleUpdateField = (index: number, updates: Partial<PackageField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama paket wajib diisi', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const payload: Partial<Package> = {
        id: editingPkg ? editingPkg.id : undefined,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        price: Number(price),
        description: description.trim(),
        max_duration_hours: Number(maxDuration),
        attire_policy: attirePolicy.trim(),
        extra_time_policy: extraTimePolicy.trim(),
        is_active: true,
        terms: terms.map((t, i) => ({ ...t, sort_order: i + 1 })),
        fields: fields.map((f, i) => ({ ...f, sort_order: i + 1 })),
      };

      await dataService.savePackage(payload);
      const updatedPkgs = await dataService.getPackages();
      onPackagesUpdated(updatedPkgs);
      setIsModalOpen(false);
      showToast('Paket tersimpan!', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (packages.length <= 1) {
      showToast('Minimal 1 paket aktif di sistem.', 'error');
      return;
    }
    if (!window.confirm(`Hapus paket "${name}"?`)) return;

    try {
      await dataService.deletePackage(id);
      const updated = await dataService.getPackages();
      onPackagesUpdated(updated);
      showToast(`Paket "${name}" dihapus`, 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal menghapus', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-950">Paket & Ketentuan</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Atur harga, durasi, syarat ketentuan, dan batasan isian formulir.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Paket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-semibold">
                    {pkg.code}
                  </span>
                  <h3 className="text-base font-bold text-zinc-950 mt-1">{pkg.name}</h3>
                  <p className="text-xl font-extrabold text-zinc-950 tabular-nums">
                    {formatRupiah(pkg.price)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(pkg)}
                    className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {packages.length > 1 && (
                    <button
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Core Policies */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Durasi</span>
                  <span className="font-bold text-zinc-950">{pkg.max_duration_hours} Jam</span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Attire</span>
                  <span className="font-medium text-zinc-900 text-[11px] truncate block">
                    {pkg.attire_policy}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Extra Time</span>
                  <span className="font-medium text-zinc-900 text-[11px] truncate block">
                    {pkg.extra_time_policy}
                  </span>
                </div>
              </div>

              {/* Ketentuan Ringkas */}
              <div className="border-t border-zinc-100 pt-3">
                <span className="text-xs font-bold text-zinc-900 block mb-1.5">
                  Syarat & Ketentuan ({pkg.terms?.length || 0}):
                </span>
                <ul className="space-y-1 text-xs text-zinc-600">
                  {pkg.terms?.map((term, i) => (
                    <li key={term.id || i} className="flex items-start gap-1.5">
                      <span className="text-zinc-400 shrink-0">{i + 1}.</span>
                      <span>{term.term_text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Batasan Field Acara */}
              <div className="border-t border-zinc-100 pt-3">
                <span className="text-xs font-bold text-zinc-900 block mb-1.5">
                  Batasan Field Formulir:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {pkg.fields?.map((field) => (
                    <div key={field.id} className="p-2 bg-zinc-50 rounded border border-zinc-200">
                      <span className="font-semibold text-zinc-900 block text-[11px]">{field.field_label}</span>
                      <span className="text-[10px] text-zinc-500 tabular-nums">
                        {field.min_val !== null && field.max_val !== null
                          ? `${field.min_val}-${field.max_val} ${field.unit || ''}`
                          : field.unit || field.field_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => openEditModal(pkg)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold"
              >
                Edit Paket
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPkg ? `Edit Paket: ${editingPkg.name}` : 'Tambah Paket Baru'}
        subtitle={editingPkg ? 'Perbarui harga, durasi, syarat ketentuan, dan batasan isian formulir.' : 'Tambahkan paket dokumentasi foto baru beserta ketentuannya.'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Paket</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Kode</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono uppercase border border-zinc-300 rounded-lg text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Harga (Rp)</label>
              <input
                type="number"
                required
                min={0}
                step={50000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg text-zinc-950 tabular-nums focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Durasi Maksimal (Jam)</label>
              <input
                type="number"
                required
                min={1}
                max={24}
                value={maxDuration}
                onChange={(e) => setMaxDuration(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg text-zinc-950 tabular-nums focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Kebijakan Attire</label>
              <input
                type="text"
                value={attirePolicy}
                onChange={(e) => setAttirePolicy(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Kebijakan Extra Time</label>
              <input
                type="text"
                value={extraTimePolicy}
                onChange={(e) => setExtraTimePolicy(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-2 pt-2 border-t border-zinc-200">
            <label className="block text-xs font-bold text-zinc-900">Syarat & Ketentuan</label>
            <div className="space-y-1.5">
              {terms.map((t, idx) => (
                <div key={t.id || idx} className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-400">{idx + 1}.</span>
                  <input
                    type="text"
                    value={t.term_text}
                    onChange={(e) => {
                      const updated = [...terms];
                      updated[idx].term_text = e.target.value;
                      setTerms(updated);
                    }}
                    className="flex-1 px-2.5 py-1 text-xs border border-zinc-200 rounded text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(t.id)}
                    className="p-1 text-zinc-400 hover:text-black"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Tambah ketentuan..."
                value={newTermText}
                onChange={(e) => setNewTermText(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs border border-zinc-300 rounded text-zinc-900"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold rounded text-zinc-800"
              >
                + Tambah
              </button>
            </div>
          </div>

          {/* Fields Configuration */}
          <div className="space-y-2 pt-2 border-t border-zinc-200">
            <label className="block text-xs font-bold text-zinc-900">Batas Isian Formulir Klien</label>
            <div className="space-y-2">
              {fields.map((f, idx) => (
                <div key={f.id || idx} className="p-2.5 bg-zinc-50 rounded border border-zinc-200 grid grid-cols-3 gap-2 text-xs">
                  <div className="col-span-3 sm:col-span-1 font-semibold text-zinc-900 text-xs self-center">
                    {f.field_label}
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500">Maksimal</label>
                    <input
                      type="number"
                      value={f.max_val ?? ''}
                      onChange={(e) =>
                        handleUpdateField(idx, {
                          max_val: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500">Satuan</label>
                    <input
                      type="text"
                      value={f.unit || ''}
                      onChange={(e) => handleUpdateField(idx, { unit: e.target.value })}
                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs text-zinc-600 hover:text-black"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
