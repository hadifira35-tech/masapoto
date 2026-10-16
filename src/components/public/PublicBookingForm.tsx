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
    <div className="min-h-screen bg-white text-zinc-950 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-10">
        
        {/* Top Header Card - Clean Editorial Style */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
            {vendor.logo_url ? (
              <div className="w-14 h-14 rounded-full border border-zinc-100 overflow-hidden bg-white flex items-center justify-center p-2 shrink-0">
                <img
                  src={vendor.logo_url}
                  alt={vendor.brand_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                MP
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-zinc-950 tracking-tight">{vendor.brand_name}</h1>
              <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Official Wedding Booking</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-light text-zinc-950 tracking-tight">
              Halo, <span className="font-semibold">{form.client?.groom_bride_names || 'Calon Pengantin'}</span>.
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-md">
              {vendor.opening_text}
            </p>
          </div>
        </div>

        {/* Selected Package Banner - Minimalist */}
        <div className="border-t border-b border-zinc-200 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                Paket Pilihan
              </span>
              <span className="font-semibold text-lg sm:text-xl text-zinc-950 tracking-tight">{packageName}</span>
            </div>
            <span className="text-sm font-medium text-zinc-950">{formatRupiah(form.package_price_snapshot || form.package?.price || 0)}</span>
          </div>
        </div>

        {/* Form Body - Refined Structure */}
        <form onSubmit={handleSubmit} className="space-y-10">
          
          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-900">
              01. Rincian Acara
            </h3>

            <div className="space-y-5">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-xs font-semibold text-zinc-950 uppercase tracking-wide">
                    {field.field_label} {field.is_required && <span className="text-zinc-400">*</span>}
                  </label>
                  <input
                    type={field.field_type === 'number' ? 'number' : field.field_type}
                    required={field.is_required}
                    value={answers[field.field_key] || ''}
                    placeholder={field.placeholder || ''}
                    onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                    className="w-full px-0 py-3 text-sm border-b border-zinc-200 focus:outline-none focus:border-zinc-950 bg-transparent text-zinc-950 tabular-nums transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-900">
              02. Syarat & Ketentuan
            </h3>

            <div className="space-y-3 text-xs text-zinc-600 leading-relaxed">
              {termsList.map((term, idx) => (
                <p key={idx} className="flex gap-3">
                  <span className="font-medium text-zinc-950 shrink-0">{idx + 1}.</span>
                  <span>{term}</span>
                </p>
              ))}
            </div>

            <div className="pt-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="agreement"
                  checked={agreementChoice === true}
                  onChange={() => setAgreementChoice(true)}
                  className="w-4 h-4 text-zinc-950 border-zinc-300 focus:ring-zinc-950"
                />
                <span className="text-sm text-zinc-900 group-hover:text-zinc-950 transition-colors">
                  Saya menyetujui seluruh ketentuan di atas.
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="agreement"
                  checked={agreementChoice === false}
                  onChange={() => setAgreementChoice(false)}
                  className="w-4 h-4 text-zinc-950 border-zinc-300 focus:ring-zinc-950"
                />
                <span className="text-sm text-zinc-900 group-hover:text-zinc-950 transition-colors">
                  Saya tidak menyetujui ketentuan.
                </span>
              </label>
            </div>
          </div>

          {submitError && (
            <div className="p-4 bg-zinc-50 border border-zinc-200 text-zinc-950 text-xs font-medium rounded">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-zinc-950 hover:bg-black text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim & Setujui'}
          </button>
        </form>

        <div className="text-center text-[10px] text-zinc-400 py-6 border-t border-zinc-100 uppercase tracking-widest">
          {vendor.brand_name} Digital Agreement
        </div>
      </div>
    </div>
  );

};
