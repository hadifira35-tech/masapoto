import React, { useState, useEffect } from 'react';
import { BookingForm, VendorProfile } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { dataService } from '../../services/dataService';
import { generateWhatsAppLink } from '../../utils/whatsapp';
import {
  CheckCircle2,
  AlertCircle,
  Send,
  MessageSquare,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface PublicBookingFormProps {
  token: string;
  vendor: VendorProfile;
}

export const PublicBookingForm: React.FC<PublicBookingFormProps> = ({
  token,
  vendor,
}) => {
  const [form, setForm] = useState<BookingForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [agreementChoice, setAgreementChoice] = useState<boolean | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadForm() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await dataService.getBookingFormByToken(token);
        if (!isMounted) return;
        if (!data) {
          setErrorMessage('Tautan formulir booking tidak ditemukan.');
        } else {
          setForm(data);
          if (data.status_form === 'submitted') {
            if (data.responses) setAnswers(data.responses);
            setAgreementChoice(data.terms_agreed ?? false);
            setSubmittedSuccessfully(true);
          } else {
            const initial: Record<string, string> = {};
            (data.fields_snapshot || []).forEach((f) => {
              if (f.field_key === 'guest_count') initial[f.field_key] = '100';
              else if (f.field_key === 'attire_count') initial[f.field_key] = '1';
              else if (f.field_key === 'event_duration') initial[f.field_key] = '5';
              else if (f.field_key === 'finish_time_estimate') initial[f.field_key] = '13:00';
              else initial[f.field_key] = '';
            });
            setAnswers(initial);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Gagal memuat formulir');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadForm();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleInputChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
  };

  const generateWhatsAppMessage = (agreed: boolean) => {
    const clientName = form?.client?.groom_bride_names || 'Klien';
    const pkgName = form?.package_name_snapshot || 'Paket Dokumentasi';
    const guest = answers['guest_count'] ? `${answers['guest_count']} Orang` : '-';
    const attire = answers['attire_count'] ? `${answers['attire_count']} Attire` : '-';
    const duration = answers['event_duration'] ? `${answers['event_duration']} Jam` : '-';
    const finish = answers['finish_time_estimate'] ? `${answers['finish_time_estimate']} WIB` : '-';
    const persetujuan = agreed ? 'SETUJU DENGAN KETENTUAN' : 'TIDAK MENYETUJUI KETENTUAN';

    return `Halo Massa Photo, saya ${clientName} 👋✨\n\nSaya telah mengisi formulir kebutuhan acara untuk *${pkgName}*:\n\n• Jumlah Tamu: ${guest}\n• Jumlah Attire: ${attire}\n• Durasi Acara: ${duration}\n• Estimasi Selesai: ${finish}\n• Status Ketentuan: *${persetujuan}*\n\nMohon dilakukan tindak lanjut dan konfirmasi jadwal booking selanjutnya. Terima kasih! 🙏✨`;
  };

  const handleOpenWhatsAppChat = () => {
    if (!vendor.phone) return;
    const msg = generateWhatsAppMessage(agreementChoice === true);
    const waUrl = generateWhatsAppLink(vendor.phone, msg);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form) return;

    if (form.status_form === 'submitted' || submittedSuccessfully) {
      setSubmitError('Formulir ini sudah pernah disubmit sebelumnya.');
      return;
    }

    // 1. Agreement choice must be explicitly picked (Setuju OR Tidak Setuju)
    if (agreementChoice === null) {
      setSubmitError('Mohon pilih salah satu opsi persetujuan (Setuju atau Tidak setuju).');
      return;
    }

    // 2. Validate required fields
    const fields = form.fields_snapshot || [];
    for (const f of fields) {
      if (f.is_required) {
        const val = answers[f.field_key];
        if (val === undefined || val === null || val.trim() === '') {
          setSubmitError(`Field "${f.field_label}" wajib diisi.`);
          return;
        }

        if (f.field_type === 'number') {
          const num = Number(val);
          if (isNaN(num)) {
            setSubmitError(`Field "${f.field_label}" harus berupa angka valid.`);
            return;
          }
          if (f.min_val !== null && f.min_val !== undefined && num < f.min_val) {
            setSubmitError(`"${f.field_label}" minimal ${f.min_val} ${f.unit || ''}.`);
            return;
          }
          // ONLY event_duration has strict max limit
          if (f.field_key === 'event_duration') {
            const maxAllowed = f.max_val ?? form.package?.max_duration_hours ?? 5;
            if (num > maxAllowed) {
              setSubmitError(`Durasi acara maksimal ${maxAllowed} jam sesuai durasi paket yang dipilih.`);
              return;
            }
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      const isAgreed = agreementChoice === true;
      const result = await dataService.submitBookingForm(token, answers, isAgreed);
      if (!result.success) {
        setSubmitError(result.error || 'Gagal mengirimkan formulir.');
        return;
      }

      // Close the form and show the chat modal view
      setSubmittedSuccessfully(true);
      if (result.form) {
        setForm(result.form);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger WhatsApp chat directly
      try {
        const msg = generateWhatsAppMessage(isAgreed);
        const waUrl = generateWhatsAppLink(vendor.phone, msg);
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Could not auto-open WhatsApp:', err);
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mengirim formulir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-8 max-w-sm w-full text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-950 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-zinc-900">Memuat Formulir...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !form) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-zinc-900" />
          <h2 className="text-sm font-bold text-zinc-950">Formulir Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-600">{errorMessage}</p>
        </div>
      </div>
    );
  }

  const packageName = form.package_name_snapshot || form.package?.name || 'INTIMATE WEDDING PACKAGE';
  const packagePrice = form.package_price_snapshot || form.package?.price || 2000000;
  const termsList =
    form.terms_text_snapshot && form.terms_text_snapshot.length > 0
      ? form.terms_text_snapshot
      : [
          'Durasi dokumentasi maksimal 5 jam, terhitung 1 jam sebelum acara dimulai.',
          'Dokumentasi menyesuaikan durasi paket.',
          'Pergantian attire atau lebih dari 1 attire wajib upgrade paket.',
          'Tidak tersedia extra time.',
        ];
  const fields = form.fields_snapshot || [];

  // =========================================================================
  // JIKA FORM TELAH DISUBMIT: FORM DITUTUP DAN LANGSUNG MENAMPILKAN MODAL CHAT
  // =========================================================================
  if (submittedSuccessfully || form.status_form === 'submitted') {
    const isAgreed = form.terms_agreed ?? (agreementChoice === true);
    return (
      <div className="min-h-screen bg-zinc-100 text-zinc-950 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-md p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
          {/* Header Icon */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-zinc-950 tracking-tight">
              Formulir Ditutup & Berhasil Terkirim
            </h2>
            <p className="text-xs text-zinc-600">
              Terima kasih, <strong>{form.client?.groom_bride_names}</strong>. Data kebutuhan acara Anda telah resmi tersimpan di sistem Massa Photo.
            </p>
          </div>

          {/* Submission Summary Card */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2 text-zinc-800">
            <div className="flex justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-500">Paket:</span>
              <span className="font-bold text-zinc-950">{packageName}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-500">Jumlah Tamu:</span>
              <span className="font-semibold text-zinc-950">{answers['guest_count'] ? `${answers['guest_count']} Orang` : '-'}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-500">Jumlah Attire:</span>
              <span className="font-semibold text-zinc-950">{answers['attire_count'] ? `${answers['attire_count']} Attire` : '-'}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-500">Durasi Acara:</span>
              <span className="font-semibold text-zinc-950">{answers['event_duration'] ? `${answers['event_duration']} Jam` : '-'}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-500">Estimasi Selesai:</span>
              <span className="font-semibold text-zinc-950">{answers['finish_time_estimate'] ? `${answers['finish_time_estimate']} WIB` : '-'}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-500">Status Ketentuan:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isAgreed
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-200 text-zinc-900'
                }`}
              >
                {isAgreed ? 'Menyetujui Ketentuan' : 'Tidak Menyetujui Ketentuan'}
              </span>
            </div>
          </div>

          {/* Primary Action: Direct WhatsApp Chat */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleOpenWhatsAppChat}
              className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Buka Chat WhatsApp Sekarang</span>
            </button>

            <p className="text-[11px] text-center text-zinc-400">
              Formulir kini telah terkunci (*read-only*). Klik tombol di atas untuk mengirimkan hasil pengisian langsung ke WhatsApp Massa Photo.
            </p>
          </div>

          <div className="text-center text-[10px] text-zinc-400 border-t border-zinc-100 pt-3">
            © 2026 {vendor.brand_name} • WhatsApp: {vendor.phone}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TAMPILAN FORMULIR PENGISIAN (BELUM SUBMIT)
  // =========================================================================
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Brand Header */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                {vendor.logo_url ? (
                  <div className="w-10 h-10 rounded-lg border border-zinc-200 overflow-hidden shrink-0 bg-white flex items-center justify-center p-1 shadow-xs">
                    <img
                      src={vendor.logo_url}
                      alt={vendor.brand_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    MP
                  </div>
                )}
                <div>
                  <h1 className="text-sm font-bold text-zinc-950 leading-tight">{vendor.brand_name}</h1>
                  <p className="text-[11px] text-zinc-500">Wedding Documentary</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {token.slice(0, 10)}
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-950">
                Halo, {form.client?.groom_bride_names || 'Calon Pengantin'}
              </h2>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                {vendor.opening_text}
              </p>
            </div>

            {/* Selected Package Banner */}
            <div className="p-3.5 rounded-xl bg-zinc-950 text-white flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                  Paket Pilihan
                </span>
                <span className="font-bold text-xs sm:text-sm block">{packageName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Event Questions */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5 sm:p-6 space-y-3.5">
            <div className="border-b border-zinc-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Informasi Acara
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Lengkapi rincian acara berikut untuk penyesuaian tim dokumentasi kami.
              </p>
            </div>

            <div className="space-y-3">
              {fields.map((field) => {
                const isDurationField = field.field_key === 'event_duration';
                const isTimeField = field.field_type === 'time';
                const isGuestField = field.field_key === 'guest_count';
                const isAttireField = field.field_key === 'attire_count';

                return (
                  <div key={field.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-zinc-900">
                        {field.field_label} {field.is_required && '*'}
                      </label>
                      
                      {/* Clean helper badge without awkward 'Batas: - WIB' */}
                      {isDurationField ? (
                        <span className="text-[11px] text-zinc-500 font-medium tabular-nums">
                          Maks. {field.max_val ?? form.package?.max_duration_hours ?? 5} Jam
                        </span>
                      ) : isGuestField ? (
                        <span className="text-[11px] text-zinc-400 tabular-nums">
                          Paket: 10–150 Orang (bisa input lebih)
                        </span>
                      ) : isAttireField ? (
                        <span className="text-[11px] text-zinc-400 tabular-nums">
                          Paket: 1 Attire (bisa input lebih)
                        </span>
                      ) : !isTimeField && field.min_val !== null && field.max_val !== null ? (
                        <span className="text-[11px] text-zinc-400 tabular-nums">
                          {field.min_val}–{field.max_val} {field.unit}
                        </span>
                      ) : null}
                    </div>

                    <div className="relative">
                      <input
                        type={field.field_type === 'number' ? 'number' : field.field_type}
                        required={field.is_required}
                        value={answers[field.field_key] || ''}
                        min={field.min_val ?? 1}
                        // Only duration enforces max limit on HTML input
                        max={isDurationField ? (field.max_val ?? form.package?.max_duration_hours ?? 5) : undefined}
                        placeholder={field.placeholder || ''}
                        onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-950 bg-white border-zinc-300 text-zinc-950 tabular-nums"
                      />
                      {field.unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 pointer-events-none">
                          {field.unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Terms and Conditions */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-5 sm:p-6 space-y-3.5">
            <div className="border-b border-zinc-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Syarat & Ketentuan Paket
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Ketentuan dokumentasi foto yang disepakati bersama sebelum pelaksanaan acara.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1.5 text-zinc-700">
              <ul className="space-y-1.5">
                {termsList.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-zinc-400 font-semibold shrink-0">{idx + 1}.</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Agreement Radio Options (Both Setuju and Tidak Setuju can submit) */}
            <div className="pt-2 space-y-2 text-xs">
              <div>
                <label className="block font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                  Persetujuan Ketentuan *
                </label>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Pilih salah satu opsi di bawah ini sebelum mengirimkan formulir acara.
                </p>
              </div>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  agreementChoice === true
                    ? 'bg-zinc-950 border-zinc-950 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <input
                  type="radio"
                  name="agreement"
                  checked={agreementChoice === true}
                  onChange={() => {
                    setAgreementChoice(true);
                    setSubmitError(null);
                  }}
                  className="mt-0.5"
                />
                <span className="font-medium leading-relaxed">
                  Saya telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan di atas.
                </span>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  agreementChoice === false
                    ? 'bg-zinc-950 border-zinc-950 text-white'
                    : 'bg-white border-zinc-300 text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <input
                  type="radio"
                  name="agreement"
                  checked={agreementChoice === false}
                  onChange={() => {
                    setAgreementChoice(false);
                    setSubmitError(null);
                  }}
                  className="mt-0.5"
                />
                <span className="font-medium leading-relaxed">
                  Saya tidak menyetujui syarat dan ketentuan.
                </span>
              </label>
            </div>
          </div>

          {/* Error Banner */}
          {submitError && (
            <div className="p-3 bg-zinc-950 text-white rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-zinc-300 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Mengirimkan Formulir...' : 'Kirim Formulir Acara'}</span>
          </button>
        </form>

        <div className="text-center text-[11px] text-zinc-400 py-3">
          © 2026 {vendor.brand_name} • WhatsApp: {vendor.phone}
        </div>
      </div>
    </div>
  );
};
