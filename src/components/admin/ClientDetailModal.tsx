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
    showToast('Link formulir disalin!', 'success');
  };

  const handleUpdateBookingStatus = async (newStatus: BookingStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await dataService.updateBookingStatus(form.id, newStatus);
      if (res) {
        onFormUpdated({ ...form, status_booking: newStatus });
        showToast(`Status booking: ${newStatus}`, 'success');
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal update status', 'error');
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
        showToast(`Status form: ${newStatus}`, 'success');
      }
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal update status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!form.client?.whatsapp_number) {
      showToast('Nomor WhatsApp klien tidak ditemukan', 'error');
      return;
    }
    const defaultTpl = `Halo Kak [NAMA KLIEN] 👋✨\n\nTerima kasih telah mempercayakan kebutuhan dokumentasi pernikahan kepada Massa Photo.\nMohon melengkapi formulir kebutuhan acara berikut:\n\n📋 *[NAMA PAKET] — Booking Form*\n💰 Investasi: [HARGA]\n🔗 Link Form: [LINK PUBLIK]\n\nTerima kasih! 🙏✨`;
    const message = interpolateTemplate(shareTemplate || defaultTpl, {
      'NAMA KLIEN': form.client.groom_bride_names,
      'NAMA PAKET': form.package_name_snapshot || form.package?.name || 'Paket Dokumentasi',
      'HARGA': formatRupiah(form.package_price_snapshot || form.package?.price || 0),
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
    const defaultTpl = `Halo Kak [NAMA KLIEN] 👋✨\n\nTerima kasih, kami telah menerima formulir kebutuhan dokumentasi pernikahan Kakak.\n\n• Paket: [NAMA PAKET]\n• Investasi: [HARGA]\n• Tamu: [JAWABAN TAMU]\n• Attire: [JAWABAN ATTIRE]\n• Durasi: [JAWABAN DURASI]\n• Selesai: [JAWABAN WAKTU]\n\nTim Massa Photo akan segera menindaklanjuti ketersediaan jadwal. Terima kasih! 🙏✨`;
    const responses = form.responses || {};
    const guestAnswer = responses['guest_count'] ? `${responses['guest_count']} Orang` : '-';
    const attireAnswer = responses['attire_count'] ? `${responses['attire_count']} Attire` : '-';
    const durationAnswer = responses['event_duration'] ? `${responses['event_duration']} Jam` : '-';
    const finishAnswer = responses['finish_time_estimate'] ? `${responses['finish_time_estimate']} WIB` : '-';

    const message = interpolateTemplate(confirmTemplate || defaultTpl, {
      'NAMA KLIEN': form.client.groom_bride_names,
      'NAMA PAKET': form.package_name_snapshot || form.package?.name || 'Paket Dokumentasi',
      'HARGA': formatRupiah(form.package_price_snapshot || form.package?.price || 0),
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
      subtitle="Rincian formulir acara, persetujuan ketentuan, dan tindakan WhatsApp."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Status bar */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FormStatusBadge status={form.status_form} />
            <BookingStatusBadge status={form.status_booking} />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenPublicForm(form.public_token)}
              className="px-2.5 py-1 rounded border border-zinc-300 bg-white text-zinc-900 font-medium flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Buka Form</span>
            </button>
            <button
              onClick={copyLink}
              className="px-2.5 py-1 rounded bg-zinc-950 text-white font-medium flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Salin Link</span>
            </button>
          </div>
        </div>

        {/* Client & Package info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 border border-zinc-200 rounded-lg space-y-1">
            <span className="font-bold text-zinc-900 block">Klien</span>
            <p className="text-zinc-700">{form.client?.groom_bride_names}</p>
            <p className="text-zinc-500 tabular-nums">{formatPhoneNumber(form.client?.whatsapp_number || '')}</p>
            {form.client?.internal_notes && (
              <p className="text-[11px] text-zinc-400 italic mt-1">{form.client.internal_notes}</p>
            )}
          </div>

          <div className="p-3 border border-zinc-200 rounded-lg space-y-1">
            <span className="font-bold text-zinc-900 block">Paket</span>
            <p className="text-zinc-700">{form.package_name_snapshot || form.package?.name}</p>
            <p className="font-bold text-zinc-950 tabular-nums">
              {formatRupiah(form.package_price_snapshot || form.package?.price || 0)}
            </p>
          </div>
        </div>

        {/* Answers */}
        <div className="p-3 border border-zinc-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900">Jawaban Acara</span>
            {form.submitted_at && (
              <span className="text-[11px] text-zinc-500 tabular-nums">
                Submit: {formatDateTime(form.submitted_at)}
              </span>
            )}
          </div>

          {hasResponses ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                <span className="text-[10px] text-zinc-500 block">Tamu</span>
                <span className="font-bold text-zinc-950 block">{responses['guest_count'] ? `${responses['guest_count']} Orang` : '-'}</span>
              </div>
              <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                <span className="text-[10px] text-zinc-500 block">Attire</span>
                <span className="font-bold text-zinc-950 block">{responses['attire_count'] ? `${responses['attire_count']} Attire` : '-'}</span>
              </div>
              <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                <span className="text-[10px] text-zinc-500 block">Durasi</span>
                <span className="font-bold text-zinc-950 block">{responses['event_duration'] ? `${responses['event_duration']} Jam` : '-'}</span>
              </div>
              <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                <span className="text-[10px] text-zinc-500 block">Estimasi Selesai</span>
                <span className="font-bold text-zinc-950 block">{responses['finish_time_estimate'] ? `${responses['finish_time_estimate']} WIB` : '-'}</span>
              </div>
            </div>
          ) : (
            <p className="text-zinc-400 py-3 text-center">Belum disubmit oleh klien.</p>
          )}
        </div>

        {/* WhatsApp Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleShareWhatsApp}
            className="py-2 px-3 border border-zinc-300 rounded-lg font-semibold text-zinc-800 hover:bg-zinc-50 flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan Link via WA</span>
          </button>
          <button
            onClick={handleConfirmWhatsApp}
            className="py-2 px-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5"
          >
            <span>Kirim Konfirmasi WA</span>
          </button>
        </div>

        {/* Status Selectors */}
        <div className="pt-2 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-semibold">Booking:</span>
            <select
              value={form.status_booking}
              disabled={isUpdatingStatus}
              onChange={(e) => handleUpdateBookingStatus(e.target.value as BookingStatus)}
              className="px-2 py-1 border border-zinc-300 rounded bg-white text-zinc-900"
            >
              <option value="not_confirmed">Belum Deal</option>
              <option value="pending_confirmation">Follow-Up</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Batal</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-semibold">Link:</span>
            <select
              value={form.status_form}
              disabled={isUpdatingStatus}
              onChange={(e) => handleUpdateFormStatus(e.target.value as FormStatus)}
              className="px-2 py-1 border border-zinc-300 rounded bg-white text-zinc-900"
            >
              <option value="awaiting_response">Menunggu Form</option>
              <option value="submitted">Terkirim</option>
              <option value="revoked">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
};
