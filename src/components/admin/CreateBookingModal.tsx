import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Package, BookingForm } from '../../types';
import { generateSecureToken } from '../../utils/crypto';
import { formatRupiah } from '../../utils/formatters';
import { isValidWhatsAppNumber, generateWhatsAppLink, interpolateTemplate } from '../../utils/whatsapp';
import { dataService } from '../../services/dataService';
import { useToast } from '../ui/Toast';
import { Copy, Share2, Check } from 'lucide-react';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: Package[];
  onBookingCreated: (form: BookingForm) => void;
  shareTemplate?: string;
}

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  isOpen,
  onClose,
  packages,
  onBookingCreated,
  shareTemplate,
}) => {
  const { showToast } = useToast();
  const [groomBrideNames, setGroomBrideNames] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || '');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<BookingForm | null>(null);

  const handleClose = () => {
    setGroomBrideNames('');
    setWhatsappNumber('');
    setInternalNotes('');
    setCreatedResult(null);
    onClose();
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackageId) || packages[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groomBrideNames.trim()) {
      showToast('Masukkan nama pengantin', 'error');
      return;
    }
    if (!whatsappNumber.trim()) {
      showToast('Masukkan nomor WhatsApp', 'error');
      return;
    }
    if (!isValidWhatsAppNumber(whatsappNumber)) {
      showToast('Format WhatsApp salah (contoh: 0895406181407)', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const publicToken = 'MP_' + generateSecureToken(16);
      const newForm = await dataService.createClientWithBooking({
        groom_bride_names: groomBrideNames.trim(),
        whatsapp_number: whatsappNumber.trim(),
        internal_notes: internalNotes.trim(),
        package_id: selectedPackageId || packages[0]?.id,
        public_token: publicToken,
      });

      setCreatedResult(newForm);
      onBookingCreated(newForm);
      showToast('Link booking berhasil dibuat!', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal membuat booking', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCreatedLink = () => {
    if (!createdResult) return;
    const url = `${window.location.origin}?token=${createdResult.public_token}`;
    navigator.clipboard.writeText(url);
    showToast('Link disalin!', 'success');
  };

  const shareCreatedWhatsApp = () => {
    if (!createdResult || !createdResult.client) return;
    const publicUrl = `${window.location.origin}?token=${createdResult.public_token}`;
    const defaultTpl = `Halo Kak [NAMA KLIEN] 👋✨\n\nTerima kasih telah mempercayakan kebutuhan dokumentasi pernikahan kepada Massa Photo.\nMohon melengkapi formulir berikut:\n\n📋 *[NAMA PAKET] — Booking Form*\n💰 Investasi: [HARGA]\n🔗 Link Form: [LINK PUBLIK]\n\nTerima kasih! 🙏✨`;

    const message = interpolateTemplate(shareTemplate || defaultTpl, {
      'NAMA KLIEN': createdResult.client.groom_bride_names,
      'NAMA PAKET': createdResult.package_name_snapshot || createdResult.package?.name || 'Paket Dokumentasi',
      'HARGA': formatRupiah(createdResult.package_price_snapshot || createdResult.package?.price || 0),
      'LINK PUBLIK': publicUrl,
    });

    const waLink = generateWhatsAppLink(createdResult.client.whatsapp_number, message);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdResult ? 'Link Form Siap Dibagikan' : 'Buat Form Booking Baru'}
      subtitle={createdResult ? 'Tautan unik telah aktif dan siap dikirimkan ke calon pengantin.' : 'Input data calon pengantin dan pilih paket untuk membuat formulir.'}
      maxWidth="max-w-md"
    >
      {createdResult ? (
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900">
            <span className="font-semibold block">{createdResult.client?.groom_bride_names}</span>
            <span className="text-zinc-600 block">{createdResult.package_name_snapshot} ({formatRupiah(createdResult.package_price_snapshot || 0)})</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Tautan Publik</label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}?token=${createdResult.public_token}`}
                className="w-full text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-zinc-800 select-all"
              />
              <button
                onClick={copyCreatedLink}
                className="px-3 py-1.5 bg-zinc-950 text-white rounded-lg text-xs font-semibold shrink-0"
              >
                Salin
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={shareCreatedWhatsApp}
              className="flex-1 py-2 px-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan via WhatsApp</span>
            </button>
            <button
              onClick={handleClose}
              className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Nama Pengantin *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Rendi dan Nita"
              value={groomBrideNames}
              onChange={(e) => setGroomBrideNames(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Nomor WhatsApp *</label>
            <input
              type="tel"
              required
              placeholder="Contoh: 0895406181407"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-950 tabular-nums focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Pilih Paket *</label>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-950 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — {formatRupiah(pkg.price)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Catatan Internal (Opsional)</label>
            <input
              type="text"
              placeholder="Catatan admin..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-zinc-600 hover:text-black"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg"
            >
              {isSubmitting ? 'Memproses...' : 'Simpan & Buat Link'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
