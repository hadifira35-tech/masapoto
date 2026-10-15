import React from 'react';
import { BookingForm, VendorProfile } from '../../types';
import { formatRupiah, formatDateTime, formatPhoneNumber } from '../../utils/formatters';
import { CheckCircle2, MessageSquare, Printer } from 'lucide-react';
import { generateWhatsAppLink } from '../../utils/whatsapp';

interface ClientAgreementReceiptProps {
  form: BookingForm;
  vendor: VendorProfile;
}

export const ClientAgreementReceipt: React.FC<ClientAgreementReceiptProps> = ({ form, vendor }) => {
  const packageName = form.package_name_snapshot || form.package?.name || 'INTIMATE WEDDING PACKAGE';
  const packagePrice = form.package_price_snapshot || form.package?.price || 0;
  const responses = form.responses || {};
  const termsList = form.terms_text_snapshot || [];
  const isAgreed = form.terms_agreed ?? false;
  const submittedAt = form.submitted_at ? formatDateTime(form.submitted_at) : formatDateTime(form.updated_at);

  const handleOpenWhatsAppChat = () => {
    if (!vendor.phone) return;
    const msg = `Halo Massa Photo, saya ${form.client?.groom_bride_names} 👋✨. Saya ingin mengonfirmasi Bukti Persetujuan Digital untuk paket ${packageName}. Terima kasih! 🙏✨`;
    const waUrl = generateWhatsAppLink(vendor.phone, msg);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 py-6 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-black shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none">
        
        {/* Header / Vendor Branding */}
        <div className="flex items-center justify-between border-b border-black pb-4">
          <div className="flex items-center gap-3">
            {vendor.logo_url ? (
              <div className="w-12 h-12 rounded border border-black overflow-hidden bg-white flex items-center justify-center p-1">
                <img src={vendor.logo_url} alt={vendor.brand_name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded bg-black text-white flex items-center justify-center font-bold text-sm">
                MP
              </div>
            )}
            <div>
              <h1 className="text-base font-bold uppercase tracking-wider text-black">{vendor.brand_name}</h1>
              <p className="text-xs text-zinc-600">Bukti Validasi & Ringkasan Persetujuan Digital</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 bg-black text-white px-2.5 py-1 rounded text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> SAH & VALID
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-extrabold uppercase tracking-tight text-black">Surat Persetujuan & Ringkasan Pesanan</h2>
          <p className="text-xs text-zinc-600">Dokumen ini merupakan bukti validasi digital sah atas pengisian formulir acara.</p>
        </div>

        {/* Client & Package Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-black space-y-1">
            <span className="font-bold uppercase text-[10px] tracking-wider text-zinc-500 block">Data Pengantin</span>
            <p className="font-bold text-sm text-black">{form.client?.groom_bride_names}</p>
            <p className="text-zinc-600 tabular-nums">{formatPhoneNumber(form.client?.whatsapp_number || '')}</p>
          </div>

          <div className="p-3.5 rounded-lg border border-black space-y-1">
            <span className="font-bold uppercase text-[10px] tracking-wider text-zinc-500 block">Paket & Investasi</span>
            <p className="font-bold text-sm text-black">{packageName}</p>
            <p className="font-extrabold text-black tabular-nums text-sm">{formatRupiah(packagePrice)}</p>
          </div>
        </div>

        {/* Event Answers */}
        <div className="p-4 rounded-lg border border-black text-xs space-y-2">
          <span className="font-bold uppercase text-[10px] tracking-wider text-zinc-500 block">Rincian Kebutuhan Acara</span>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex justify-between border-b border-zinc-200 pb-1">
              <span className="text-zinc-600">Jumlah Tamu:</span>
              <span className="font-bold text-black">{responses['guest_count'] ? `${responses['guest_count']} Orang` : '-'}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 pb-1">
              <span className="text-zinc-600">Jumlah Attire:</span>
              <span className="font-bold text-black">{responses['attire_count'] ? `${responses['attire_count']} Attire` : '-'}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 pb-1">
              <span className="text-zinc-600">Durasi Acara:</span>
              <span className="font-bold text-black">{responses['event_duration'] ? `${responses['event_duration']} Jam` : '-'}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 pb-1">
              <span className="text-zinc-600">Estimasi Selesai:</span>
              <span className="font-bold text-black">{responses['finish_time_estimate'] ? `${responses['finish_time_estimate']} WIB` : '-'}</span>
            </div>
          </div>
        </div>

        {/* Terms Snapshot */}
        {termsList.length > 0 && (
          <div className="p-4 rounded-lg border border-black text-xs space-y-2">
            <span className="font-bold uppercase text-[10px] tracking-wider text-zinc-500 block">Syarat & Ketentuan Disetujui</span>
            <ul className="space-y-1 text-zinc-700">
              {termsList.map((term, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-black shrink-0">{idx + 1}.</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Digital Validation Log Stamp */}
        <div className="p-4 rounded-lg bg-zinc-50 border border-black text-xs space-y-1 text-center">
          <p className="font-bold uppercase tracking-wider text-[11px] text-black">Status Persetujuan Digital</p>
          <p className="text-zinc-700">
            {isAgreed ? '✔ Klien telah menekan tombol "SETUJU" pada syarat dan ketentuan.' : 'Status Persetujuan: Tercatat'}
          </p>
          <p className="font-mono font-bold text-black text-xs pt-1">
            Log Waktu Validasi: {submittedAt}
          </p>
          <p className="font-mono text-[10px] text-zinc-400 pt-0.5">
            Token Validasi: {form.public_token}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 print:hidden">
          <button
            onClick={handleOpenWhatsAppChat}
            className="flex-1 py-3 px-4 bg-black text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Kirim Konfirmasi ke WhatsApp Admin</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="py-3 px-4 bg-white text-black border border-black rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-50"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan Bukti</span>
          </button>
        </div>

        <div className="text-center text-[10px] text-zinc-400 border-t border-zinc-200 pt-3">
          © 2026 {vendor.brand_name} • Dokumen Resmi Validasi Digital Klien
        </div>

      </div>
    </div>
  );
};
