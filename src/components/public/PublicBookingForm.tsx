import React, { useState, useEffect } from 'react';
import { BookingForm, VendorProfile } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { dataService } from '../../services/dataService';
import { generateWhatsAppLink } from '../../utils/whatsapp';
import {
  AlertCircle,
  Send,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { ClientDealView } from './ClientDealView';
import { ClientAgreementReceipt } from './ClientAgreementReceipt';

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
          setErrorMessage('Tautan formulir booking tidak ditemukan atau sudah kedaluwarsa.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form) return;

    if (form.status_form === 'submitted' || submittedSuccessfully) {
      setSubmitError('Formulir ini sudah pernah disubmit sebelumnya.');
      return;
    }

    if (agreementChoice === null) {
      setSubmitError('Mohon pilih opsi persetujuan Syarat & Ketentuan di bawah.');
      return;
    }

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
          if (f.field_key === 'event_duration') {
            const maxAllowed = f.max_val ?? form.package?.max_duration_hours ?? 5;
            if (num > maxAllowed) {
              setSubmitError(`Durasi acara maksimal ${maxAllowed} jam sesuai durasi paket.`);
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

      setSubmittedSuccessfully(true);
      if (result.form) {
        setForm(result.form);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const clientName = form.client?.groom_bride_names || 'Klien';
        const pkgName = form.package_name_snapshot || 'Paket Dokumentasi';
        const msg = `Halo Massa Photo, saya ${clientName} 👋✨\n\nSaya telah mengisi formulir kebutuhan acara untuk *${pkgName}* dan menyetujui ketentuan.\n\nMohon konfirmasi jadwal selanjutnya. Terima kasih! 🙏✨`;
        const waUrl = generateWhatsAppLink(vendor.phone, msg);
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Auto WhatsApp failed:', err);
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mengirim formulir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 max-w-sm w-full text-center space-y-3 shadow-xs">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-950 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-zinc-900">Memuat Formulir Klien...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !form) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-zinc-950">Formulir Tidak Ditemukan</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">{errorMessage}</p>
        </div>
      </div>
    );
  }

  const packageName = form.package_name_snapshot || form.package?.name || 'INTIMATE WEDDING PACKAGE';
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

  if (form.status_booking === 'confirmed') {
    return <ClientDealView form={form} vendor={vendor} />;
  }

  if (submittedSuccessfully || form.status_form === 'submitted') {
    return <ClientAgreementReceipt form={form} vendor={vendor} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 py-6 sm:py-12 px-3 sm:px-6">
      <div className="max-w-xl mx-auto space-y-5">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                {vendor.logo_url ? (
                  <div className="w-12 h-12 rounded-xl border border-zinc-200 overflow-hidden bg-white flex items-center justify-center p-1.5 shadow-xs shrink-0">
                    <img
                      src={vendor.logo_url}
                      alt={vendor.brand_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    MP
                  </div>
                )}
                <div>
                  <h1 className="text-sm font-bold text-zinc-950 tracking-tight">{vendor.brand_name}</h1>
                  <p className="text-[11px] text-zinc-500 font-medium">Official Wedding Documentation</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border border-zinc-200">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Form Publik
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 tracking-tight">
                Halo, {form.client?.groom_bride_names || 'Calon Pengantin'} 👋
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {vendor.opening_text}
              </p>
            </div>

            {/* Selected Package Banner */}
            <div className="p-4 rounded-xl bg-zinc-950 text-white flex items-center justify-between gap-4 shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">
                  Paket Pilihan Klien
                </span>
                <span className="font-extrabold text-sm sm:text-base block tracking-tight">{packageName}</span>
              </div>
              <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1: Event Fields */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 sm:p-8 space-y-4">
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                1. Rincian & Kebutuhan Acara
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Silakan lengkapi informasi di bawah ini untuk persiapan timeline hari bahagia Anda.
              </p>
            </div>

            <div className="space-y-4">
              {fields.map((field) => {
                const isDurationField = field.field_key === 'event_duration';
                const isTimeField = field.field_type === 'time';
                const isGuestField = field.field_key === 'guest_count';
                const isAttireField = field.field_key === 'attire_count';

                return (
                  <div key={field.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-zinc-900">
                        {field.field_label} {field.is_required && <span className="text-zinc-950">*</span>}
                      </label>
                      
                      {isDurationField ? (
                        <span className="text-[11px] text-zinc-500 font-semibold tabular-nums">
                          Maks. {field.max_val ?? form.package?.max_duration_hours ?? 5} Jam
                        </span>
                      ) : isGuestField ? (
                        <span className="text-[11px] text-zinc-400 tabular-nums">
                          Batas intimate 10–150 Orang
                        </span>
                      ) : isAttireField ? (
                        <span className="text-[11px] text-zinc-400 tabular-nums">
                          Standar 1 Attire
                        </span>
                      ) : null}
                    </div>

                    <div className="relative">
                      <input
                        type={field.field_type === 'number' ? 'number' : field.field_type}
                        required={field.is_required}
                        value={answers[field.field_key] || ''}
                        min={field.min_val ?? 1}
                        max={isDurationField ? (field.max_val ?? form.package?.max_duration_hours ?? 5) : undefined}
                        placeholder={field.placeholder || ''}
                        onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-950 bg-white text-zinc-950 tabular-nums shadow-2xs transition-all"
                      />
                      {field.unit && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 pointer-events-none">
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
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 sm:p-8 space-y-4">
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                2. Syarat & Ketentuan Layanan
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Harap baca ketentuan dokumentasi di bawah ini dengan saksama.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-2 text-zinc-800 leading-relaxed">
              <ul className="space-y-2">
                {termsList.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-bold text-zinc-950 shrink-0">{idx + 1}.</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Agreement Options */}
            <div className="pt-2 space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-950 uppercase tracking-wider text-[11px]">
                  Persetujuan Resmi Klien *
                </label>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Pilih salah satu status persetujuan di bawah sebelum mengirimkan data.
                </p>
              </div>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  agreementChoice === true
                    ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
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
                  className="mt-0.5 accent-zinc-950"
                />
                <span className="font-medium leading-relaxed text-xs sm:text-sm">
                  Saya telah membaca, memahami, dan <strong className="font-bold">menyetujui</strong> seluruh syarat dan ketentuan di atas.
                </span>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  agreementChoice === false
                    ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
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
                  className="mt-0.5 accent-zinc-950"
                />
                <span className="font-medium leading-relaxed text-xs sm:text-sm">
                  Saya <strong className="font-bold">tidak menyetujui</strong> syarat dan ketentuan.
                </span>
              </label>
            </div>
          </div>

          {/* Error Banner */}
          {submitError && (
            <div className="p-3.5 bg-zinc-950 text-white rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-zinc-300 shrink-0" />
              <span className="font-medium">{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Mengirimkan Ringkasan Acara...' : 'Kirim Formulir & Setujui Ketentuan'}</span>
          </button>
        </form>

        <div className="text-center text-[11px] text-zinc-400 py-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
          <span>Protected by {vendor.brand_name} Secure Digital Agreement</span>
        </div>
      </div>
    </div>
  );
};
