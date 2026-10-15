import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Copy,
  Share2,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { BookingForm } from '../../types';
import { FormStatusBadge, BookingStatusBadge } from '../ui/Badge';
import { formatRupiah, formatPhoneNumber } from '../../utils/formatters';
import { generateWhatsAppLink, interpolateTemplate } from '../../utils/whatsapp';
import { useToast } from '../ui/Toast';

interface ClientsViewProps {
  forms: BookingForm[];
  onOpenCreateBooking: () => void;
  onOpenClientDetail: (form: BookingForm) => void;
  onOpenPublicForm: (token: string) => void;
  shareTemplate?: string;
  confirmTemplate?: string;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  forms,
  onOpenCreateBooking,
  onOpenClientDetail,
  onOpenPublicForm,
  shareTemplate,
  confirmTemplate,
}) => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [formStatusFilter, setFormStatusFilter] = useState<string>('ALL');
  const [activeBookingTab, setActiveBookingTab] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const bookingTabs = [
    { label: 'Semua', value: 'ALL' },
    { label: 'Belum Deal', value: 'not_confirmed' },
    { label: 'Pending', value: 'pending_confirmation' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Dibatalkan', value: 'cancelled' },
    { label: 'Selesai', value: 'completed' },
  ];

  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const matchSearch =
        !searchTerm.trim() ||
        f.client?.groom_bride_names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.client?.whatsapp_number?.includes(searchTerm) ||
        f.package_name_snapshot?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFormStatus = formStatusFilter === 'ALL' || f.status_form === formStatusFilter;
      const matchBookingTab = activeBookingTab === 'ALL' || f.status_booking === activeBookingTab;

      const createdDate = f.created_at.split('T')[0];
      const matchDate =
        (!startDate || createdDate >= startDate) &&
        (!endDate || createdDate <= endDate);

      return matchSearch && matchFormStatus && matchBookingTab && matchDate;
    });
  }, [forms, searchTerm, formStatusFilter, activeBookingTab, startDate, endDate]);

  const copyFormLink = (e: React.MouseEvent, token: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}?token=${token}`;
    navigator.clipboard.writeText(url);
    showToast('Link formulir disalin!', 'success');
  };

  const handleShareWhatsApp = (e: React.MouseEvent, form: BookingForm) => {
    e.stopPropagation();
    if (!form.client?.whatsapp_number) {
      showToast('Nomor WhatsApp klien tidak valid', 'error');
      return;
    }
    const publicUrl = `${window.location.origin}?token=${form.public_token}`;
    const defaultTpl = `Halo Kak [NAMA KLIEN] 👋✨\n\nTerima kasih telah mempercayakan kebutuhan dokumentasi pernikahan kepada Massa Photo.\n\nMohon melengkapi formulir kebutuhan acara berikut:\n\n📋 *[NAMA PAKET] — Booking Form*\n🔗 Link Form: [LINK PUBLIK]\n\nTerima kasih! 🙏✨`;
    const message = interpolateTemplate(shareTemplate || defaultTpl, {
      'NAMA KLIEN': form.client.groom_bride_names,
      'NAMA PAKET': form.package_name_snapshot || form.package?.name || 'Paket Dokumentasi',
      'LINK PUBLIK': publicUrl,
    });
    const waUrl = generateWhatsAppLink(form.client.whatsapp_number, message);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmWhatsApp = (e: React.MouseEvent, form: BookingForm) => {
    e.stopPropagation();
    if (!form.client?.whatsapp_number) {
      showToast('Nomor WhatsApp klien tidak valid', 'error');
      return;
    }
    const defaultTpl = `Halo Kak [NAMA KLIEN] 👋✨\n\nTerima kasih, kami telah menerima formulir kebutuhan dokumentasi pernikahan Kakak.\n\n• Paket: [NAMA PAKET]\n• Jumlah Tamu: [JAWABAN TAMU]\n• Jumlah Attire: [JAWABAN ATTIRE]\n• Durasi: [JAWABAN DURASI]\n• Selesai: [JAWABAN WAKTU]\n\nTim Massa Photo akan segera menindaklanjuti proses booking selanjutnya. Terima kasih! 🙏✨`;
    const res = form.responses || {};
    const guestAnswer = res['guest_count'] ? `${res['guest_count']} Orang` : '-';
    const attireAnswer = res['attire_count'] ? `${res['attire_count']} Attire` : '-';
    const durationAnswer = res['event_duration'] ? `${res['event_duration']} Jam` : '-';
    const finishAnswer = res['finish_time_estimate'] ? `${res['finish_time_estimate']} WIB` : '-';

    const message = interpolateTemplate(confirmTemplate || defaultTpl, {
      'NAMA KLIEN': form.client.groom_bride_names,
      'NAMA PAKET': form.package_name_snapshot || form.package?.name || 'Paket Dokumentasi',
      'JAWABAN TAMU': guestAnswer,
      'JAWABAN ATTIRE': attireAnswer,
      'JAWABAN DURASI': durationAnswer,
      'JAWABAN WAKTU': finishAnswer,
    });
    const waUrl = generateWhatsAppLink(form.client.whatsapp_number, message);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-950">Data Klien</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kelola calon pengantin, tautan formulir publik, dan konfirmasi WhatsApp.
          </p>
        </div>
        <button
          onClick={onOpenCreateBooking}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Form Baru</span>
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-2.5 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pengantin atau nomor WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 text-xs"
          />
        </div>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1.5 border border-zinc-300 rounded-lg bg-white text-zinc-800 text-xs focus:outline-none"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1.5 border border-zinc-300 rounded-lg bg-white text-zinc-800 text-xs focus:outline-none"
        />

        <select
          value={formStatusFilter}
          onChange={(e) => setFormStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-zinc-300 rounded-lg bg-white text-zinc-800 text-xs focus:outline-none"
        >
          <option value="ALL">Semua Form</option>
          <option value="awaiting_response">Menunggu Form</option>
          <option value="submitted">Form Terkirim</option>
        </select>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-zinc-200">
        {bookingTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveBookingTab(tab.value)}
            className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition-colors ${
              activeBookingTab === tab.value
                ? 'bg-zinc-950 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        {filteredForms.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Tidak ada data klien yang cocok.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase font-semibold text-[11px]">
                    <th className="py-3 px-4 pl-6">Pengantin</th>
                    <th className="py-3 px-4">Paket</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">Status Form</th>
                    <th className="py-3 px-4">Status Booking</th>
                    <th className="py-3 px-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredForms.map((form) => (
                    <tr
                      key={form.id}
                      onClick={() => onOpenClientDetail(form)}
                      className="hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 pl-6 font-semibold text-zinc-950 whitespace-nowrap">
                        {form.client?.groom_bride_names}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-zinc-900 block">
                          {form.package_name_snapshot || form.package?.name}
                        </span>
                        <span className="text-[11px] text-zinc-500 tabular-nums">
                          {formatRupiah(form.package_price_snapshot || form.package?.price || 0)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-zinc-700 whitespace-nowrap">
                        {formatPhoneNumber(form.client?.whatsapp_number || '')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <FormStatusBadge status={form.status_form} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <BookingStatusBadge status={form.status_booking} />
                      </td>
                      <td className="py-3.5 px-4 pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={(e) => copyFormLink(e, form.public_token)}
                            title="Salin Link"
                            className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-md transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenPublicForm(form.public_token)}
                            title="Buka Form"
                            className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleShareWhatsApp(e, form)}
                            title="Bagikan WA"
                            className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-md transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          {form.status_form === 'submitted' && (
                            <button
                              onClick={(e) => handleConfirmWhatsApp(e, form)}
                              title="Kirim Konfirmasi WA"
                              className="p-1.5 text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenClientDetail(form)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors ml-1"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-zinc-200">
              {filteredForms.map((form) => (
                <div
                  key={form.id}
                  onClick={() => onOpenClientDetail(form)}
                  className="p-4 space-y-3 hover:bg-zinc-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-950">
                        {form.client?.groom_bride_names}
                      </h4>
                      <p className="text-xs text-zinc-500 tabular-nums">
                        {formatPhoneNumber(form.client?.whatsapp_number || '')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-zinc-950 block tabular-nums">
                        {formatRupiah(form.package_price_snapshot || form.package?.price || 0)}
                      </span>
                      <span className="text-[11px] text-zinc-500 block truncate max-w-[120px]">
                        {form.package_name_snapshot || form.package?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FormStatusBadge status={form.status_form} />
                    <BookingStatusBadge status={form.status_booking} />
                  </div>

                  <div
                    className="flex items-center justify-between pt-2 border-t border-zinc-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => copyFormLink(e, form.public_token)}
                        className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-medium text-zinc-800 flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Link</span>
                      </button>
                      <button
                        onClick={(e) => handleShareWhatsApp(e, form)}
                        className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WA</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onOpenClientDetail(form)}
                      className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800"
                    >
                      Buka Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
