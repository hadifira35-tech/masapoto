import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { BookingForm, BookingStatus, FormStatus } from '../../types';
import { FormStatusBadge, BookingStatusBadge } from '../ui/Badge';
import { formatRupiah, formatDateTime, formatPhoneNumber } from '../../utils/formatters';
import { generateWhatsAppLink, interpolateTemplate } from '../../utils/whatsapp';
import { dataService } from '../../services/dataService';
import { useToast } from '../ui/Toast';
import {
  Share2,
  Copy,
  ExternalLink,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: BookingForm | null;
  onFormUpdated: (updatedForm: BookingForm) => void;
  onOpenPublicForm: (token: string) => void;
  shareTemplate?: string;
  confirmTemplate?: string;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  form,
  onFormUpdated,
  onOpenPublicForm,
  shareTemplate,
  confirmTemplate,
}) => {
  const { showToast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!form) return null;

  const publicUrl = `${window.location.origin}?token=${form.public_token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    showToast('Tautan formulir berhasil disalin!', 'success');
  };

  const handleUpdateBookingStatus = async (newStatus: BookingStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await dataService.updateBookingStatus(form.id, newStatus);
      if (res) {
        onFormUpdated({ ...form, status_booking: newStatus });
        showToast(`Status booking diperbarui: ${newStatus}`, 'success');
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal memperbarui status booking', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateFormStatus = async (newStatus: FormStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await dataService.updateFormStatus(form.id, newStatus);
      if (res) {
        onFormUpdated({ ...form, status_form: newStatus });
        showToast(`Status formulir diperbarui: ${newStatus}`, 'success');
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal memperbarui status formulir', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!form.client?.whatsapp_number) {
      showToast('Nomor WhatsApp klien tidak ditemukan', 'error');
      return;
    }
    const defaultTpl = `Halo Kak [NAMA KLIEN] 👋✨\n\nTerima kasih telah mempercayakan kebutuhan dokumentasi pernikahan kepada Massa Photo.\nMohon melengkapi formulir kebutuhan acara berikut:\n\n📋 *[NAMA PAKET] — Booking Form*\n🔗 Link Form: [LINK PUBLIK]\n\nTerima kasih! 🙏✨`;
    const message = interpolateTemplate(shareTemplate || defaultTpl, {
      'NAMA KLIEN': form.client.groom_bride_names,
      'NAMA PAKET': form.package_name_snapshot || form.package?.name || 'Paket Dokumentasi',
      'LINK PUBLIK': publicUrl,
    });

    const waLink = generateWhatsAppLink(form.client.whatsapp_number, message);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmWhatsApp = () => {
    if (!form.client?.whatsapp_number) {
      showToast('Nomor WhatsApp klien tidak ditemukan', 'error');
      return;
    }
    const defaultTpl = `Halo Kak [NAMA KLIEN] 👋✨\n\nTerima kasih, kami telah menerima formulir kebutuhan dokumentasi pernikahan Kakak.\n\n• Paket: [NAMA PAKET]\n• Jumlah Tamu: [JAWABAN TAMU]\n• Jumlah Attire: [JAWABAN ATTIRE]\n• Durasi: [JAWABAN DURASI]\n• Selesai: [JAWABAN WAKTU]\n\nTim Massa Photo akan segera menindaklanjuti proses selanjutnya. Terima kasih! 🙏✨`;
    const responses = form.responses || {};
    const guestAnswer = responses['guest_count'] ? `${responses['guest_count']} Orang` : '-';
    const attireAnswer = responses['attire_count'] ? `${responses['attire_count']} Attire` : '-';
    const durationAnswer = responses['event_duration'] ? `${responses['event_duration']} Jam` : '-';
    const finishAnswer = responses['finish_time_estimate'] ? `${responses['finish_time_estimate']} WIB` : '-';

    const message = interpolateTemplate(confirmTemplate || defaultTpl, {
      'NAMA KLIEN': form.client.groom_bride_names,
      'NAMA PAKET': form.package_name_snapshot || form.package?.name || 'Paket Dokumentasi',
      'JAWABAN TAMU': guestAnswer,
      'JAWABAN ATTIRE': attireAnswer,
      'JAWABAN DURASI': durationAnswer,
      'JAWABAN WAKTU': finishAnswer,
    });

    const waLink = generateWhatsAppLink(form.client.whatsapp_number, message);
    window.open(waLink, '_blank', 'noopener,noreferrer');
  };

  const responses = form.responses || {};
  const hasResponses = Object.keys(responses).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={form.client?.groom_bride_names || 'Detail Klien'}
      subtitle="Kelola rincian acara, status pemesanan, dan komunikasi WhatsApp."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Status bar */}
        <div className="p-3.5 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block">Status Saat Ini</span>
            <div className="flex items-center gap-2">
              <FormStatusBadge status={form.status_form} />
              <BookingStatusBadge status={form.status_booking} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPublicForm(form.public_token)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 font-semibold flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Form</span>
            </button>
            <button
              onClick={copyLink}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-semibold flex items-center gap-1 transition-colors shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Link</span>
            </button>
          </div>
        </div>

        {/* Client & Package info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Informasi Klien</span>
            <p className="font-bold text-sm text-zinc-950">{form.client?.groom_bride_names}</p>
            <p className="text-zinc-600 tabular-nums font-medium">{formatPhoneNumber(form.client?.whatsapp_number || '')}</p>
            {form.client?.internal_notes && (
              <p className="text-xs text-zinc-500 italic pt-1 border-t border-zinc-100">{form.client.internal_notes}</p>
            )}
          </div>

          <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-1.5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Pilihan Paket Acara</span>
            <p className="font-bold text-sm text-zinc-950">{form.package_name_snapshot || form.package?.name}</p>
            <p className="text-xs text-zinc-500">Paket dokumentasi pernikahan terpilih.</p>
          </div>
        </div>

        {/* Answers */}
        <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <div>
              <span className="font-bold text-zinc-950 block text-xs">Jawaban Formulir Acara</span>
              <span className="text-[11px] text-zinc-400">Rincian isian dari calon pengantin</span>
            </div>
            {form.submitted_at && (
              <span className="text-[11px] text-zinc-500 tabular-nums font-medium">
                Diusulkan: {formatDateTime(form.submitted_at)}
              </span>
            )}
          </div>

          {hasResponses ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Tamu</span>
                <span className="font-bold text-zinc-950 text-xs block mt-0.5">{responses['guest_count'] ? `${responses['guest_count']} Orang` : '-'}</span>
              </div>
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Attire</span>
                <span className="font-bold text-zinc-950 text-xs block mt-0.5">{responses['attire_count'] ? `${responses['attire_count']} Attire` : '-'}</span>
              </div>
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Durasi</span>
                <span className="font-bold text-zinc-950 text-xs block mt-0.5">{responses['event_duration'] ? `${responses['event_duration']} Jam` : '-'}</span>
              </div>
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">Selesai</span>
                <span className="font-bold text-zinc-950 text-xs block mt-0.5">{responses['finish_time_estimate'] ? `${responses['finish_time_estimate']} WIB` : '-'}</span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-zinc-400 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
              Klien belum mengisi formulir acara.
            </div>
          )}
        </div>

        {/* WhatsApp Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3.5 border border-zinc-300 rounded-lg font-semibold text-zinc-800 hover:bg-zinc-50 flex items-center justify-center gap-2 transition-colors bg-white text-xs"
          >
            <Share2 className="w-4 h-4 text-zinc-600" />
            <span>Bagikan Link via WhatsApp</span>
          </button>
          <button
            onClick={handleConfirmWhatsApp}
            className="py-2.5 px-3.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs text-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Kirim Pesan Konfirmasi WA</span>
          </button>
        </div>

        {/* Status Management with short descriptions */}
        <div className="pt-3 border-t border-zinc-200 space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
          <div>
            <h4 className="font-bold text-zinc-950 text-xs">Pengaturan Status & Alur Klien</h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Ubah status booking untuk alur kerja atau buka negosiasi ulang.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Booking Status */}
            <div className="space-y-1">
              <label className="block font-semibold text-zinc-700 text-[11px]">Status Booking:</label>
              <select
                value={form.status_booking}
                disabled={isUpdatingStatus}
                onChange={(e) => handleUpdateBookingStatus(e.target.value as BookingStatus)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950"
              >
                <option value="not_confirmed">Belum Deal (Proses awal)</option>
                <option value="pending_confirmation">Follow-Up (Menunggu konfirmasi)</option>
                <option value="confirmed">Confirmed (Deal / Selesai)</option>
                <option value="cancelled">Batal (Pemesanan dibatalkan)</option>
                <option value="completed">Selesai (Acara terlaksana)</option>
              </select>
            </div>

            {/* Form Access Status */}
            <div className="space-y-1">
              <label className="block font-semibold text-zinc-700 text-[11px]">Akses Formulir Publik:</label>
              <div className="flex items-center gap-2">
                <select
                  value={form.status_form}
                  disabled={isUpdatingStatus}
                  onChange={(e) => handleUpdateFormStatus(e.target.value as FormStatus)}
                  className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950"
                >
                  <option value="awaiting_response">Menunggu Form (Aktif diisi)</option>
                  <option value="submitted">Terkirim (Terkunci / Read-only)</option>
                  <option value="revoked">Nonaktif (Link ditutup)</option>
                </select>
                
                {form.status_form === 'submitted' && (
                  <button
                    onClick={() => handleUpdateFormStatus('awaiting_response')}
                    title="Buka kembali form agar klien dapat input ulang (Negosiasi)"
                    className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Negosiasi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
