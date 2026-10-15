import React from 'react';
import {
  Users,
  Send,
  Clock,
  CheckCircle,
  FileText,
  Share2,
  Eye,
  Copy,
  Trash2,
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { FormStatusBadge, BookingStatusBadge } from '../ui/Badge';
import { BookingForm } from '../../types';
import { formatRupiah, formatDateTime, formatPhoneNumber } from '../../utils/formatters';
import { generateWhatsAppLink, interpolateTemplate } from '../../utils/whatsapp';
import { useToast } from '../ui/Toast';

interface DashboardViewProps {
  forms: BookingForm[];
  onOpenClientDetail: (form: BookingForm) => void;
  onOpenCreateBooking: () => void;
  onOpenPublicForm: (token: string) => void;
  shareTemplate?: string;
  confirmTemplate?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  forms,
  onOpenClientDetail,
  onOpenCreateBooking,
  onOpenPublicForm,
  shareTemplate,
}) => {
  const { showToast } = useToast();

  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const filteredForms = React.useMemo(() => {
    return forms.filter((form) => {
      const formDate = new Date(form.created_at).toISOString().split('T')[0];
      const start = startDate || '0000-00-00';
      const end = endDate || '9999-12-31';
      return formDate >= start && formDate <= end;
    });
  }, [forms, startDate, endDate]);

  const totalClients = filteredForms.length;
  const awaitingResponse = filteredForms.filter((f) => f.status_form === 'awaiting_response').length;
  const submittedForms = filteredForms.filter((f) => f.status_form === 'submitted').length;
  const confirmedBookings = filteredForms.filter((f) => f.status_booking === 'confirmed').length;
  const cancelledBookings = filteredForms.filter((f) => f.status_booking === 'cancelled').length;

  const copyFormLink = (e: React.MouseEvent, token: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}?token=${token}`;
    navigator.clipboard.writeText(url);
    showToast('Link formulir disalin!', 'success');
  };

  const handleShareWhatsApp = (e: React.MouseEvent, form: BookingForm) => {
    e.stopPropagation();
    if (!form.client?.whatsapp_number) {
      showToast('Nomor WhatsApp tidak ada', 'error');
      return;
    }
    const publicUrl = `${window.location.origin}?token=${form.public_token}`;
    const defaultTpl = `Halo Kak [NAMA KLIEN] 👋✨\n\nTerima kasih telah mempercayakan kebutuhan dokumentasi pernikahan kepada Massa Photo.\nMohon melengkapi formulir kebutuhan acara berikut:\n\n📋 *[NAMA PAKET] — Booking Form*\n💰 Investasi: [HARGA]\n🔗 Link Form: [LINK PUBLIK]\n\nTerima kasih! 🙏✨`;
    const message = interpolateTemplate(shareTemplate || defaultTpl, {
      'NAMA KLIEN': form.client.groom_bride_names,
      'NAMA PAKET': form.package_name_snapshot || form.package?.name || 'Paket Dokumentasi',
      'HARGA': formatRupiah(form.package_price_snapshot || form.package?.price || 0),
      'LINK PUBLIK': publicUrl,
    });
    const waUrl = generateWhatsAppLink(form.client.whatsapp_number, message);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-zinc-950">Dashboard</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Ringkasan metrik pemesanan dan aktivitas formulir pengantin terkini.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Total Klien"
          value={totalClients}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="Menunggu Form"
          value={awaitingResponse}
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          title="Form Terkirim"
          value={submittedForms}
          icon={<FileText className="w-4 h-4" />}
        />
        <StatCard
          title="Confirmed"
          value={confirmedBookings}
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <StatCard
          title="Dibatalkan"
          value={cancelledBookings}
          icon={<Trash2 className="w-4 h-4" />}
        />
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Daftar Klien</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-[11px] border border-zinc-300 rounded-md px-2 py-1"
              />
              <span className="text-xs text-zinc-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-[11px] border border-zinc-300 rounded-md px-2 py-1"
              />
            </div>
          </div>
          <button
            onClick={onOpenCreateBooking}
            className="text-xs font-semibold text-zinc-900 hover:underline"
          >
            + Tambah
          </button>
        </div>

        {filteredForms.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Tidak ada klien dalam rentang tanggal tersebut.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4 pl-6">Pengantin</th>
                    <th className="py-3 px-4">Paket & Harga</th>
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
                      <td className="py-3.5 px-4 tabular-nums text-zinc-600 whitespace-nowrap">
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
                            title="Share WhatsApp"
                            className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-md transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
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

            {/* Mobile Stacked Card View */}
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
                      <span className="text-[11px] text-zinc-500 truncate max-w-[120px] block">
                        {form.package_name_snapshot || form.package?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
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
