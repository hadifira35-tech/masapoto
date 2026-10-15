import React, { useState, useRef } from 'react';
import { VendorProfile } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../ui/Toast';
import {
  Save,
  UploadCloud,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';

interface VendorSettingsViewProps {
  vendor: VendorProfile;
  onVendorUpdated: (vendor: VendorProfile) => void;
}

const DEFAULT_LOGO = '/src/assets/images/massa_photo_logo_1792077881993.jpg';

export const VendorSettingsView: React.FC<VendorSettingsViewProps> = ({
  vendor,
  onVendorUpdated,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<VendorProfile>(vendor);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [imageMeta, setImageMeta] = useState<{ size?: string; format?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Compress and resize image before saving to optimize Supabase PostgreSQL payload
   */
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Hanya format gambar (PNG, JPG, WEBP, SVG) yang didukung.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 10MB.', 'error');
      return;
    }

    const fileSizeKb = Math.round(file.size / 1024);
    const fileFormat = file.type.split('/')[1]?.toUpperCase() || 'IMG';

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Resize down if wider than 1000px
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.88);
          setFormData((prev) => ({ ...prev, logo_url: compressedDataUrl }));
          setImageMeta({
            size: `${fileSizeKb} KB (${width}x${height}px)`,
            format: 'WEBP',
          });
        } else {
          setFormData((prev) => ({ ...prev, logo_url: result }));
          setImageMeta({
            size: `${fileSizeKb} KB`,
            format: fileFormat,
          });
        }
        showToast('Logo berhasil dipilih! Klik "Simpan Pengaturan" untuk menyimpan ke Supabase.', 'success');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    setFormData((prev) => ({ ...prev, logo_url: customUrl.trim() }));
    setImageMeta({ format: 'URL Eksternal' });
    setShowUrlInput(false);
    setCustomUrl('');
    showToast('Tautan URL logo berhasil diterapkan!', 'success');
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo_url: '' }));
    setImageMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Logo dihapus.', 'info');
  };

  const handleResetDefaultLogo = () => {
    setFormData((prev) => ({ ...prev, logo_url: DEFAULT_LOGO }));
    setImageMeta({ format: 'Logo Standar Massa Photo' });
    showToast('Logo standar Massa Photo dipulihkan.', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand_name.trim()) {
      showToast('Nama brand wajib diisi', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await dataService.updateVendorProfile(formData);
      onVendorUpdated(updated);
      showToast('Pengaturan vendor berhasil tersimpan!', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-black">Pengaturan Vendor</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-black p-5 space-y-6 text-sm">
        <div className="space-y-3">
          <div className="border-b border-black pb-2">
            <h3 className="font-bold text-black uppercase tracking-wider">Identitas Studio</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-black mb-1">Nama Brand Studio *</label>
              <input
                type="text"
                name="brand_name"
                required
                value={formData.brand_name}
                onChange={handleChange}
                placeholder="Massa Photo"
                className="w-full px-3 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">WhatsApp Bisnis Resmi *</label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="0895406181407"
                className="w-full px-3 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            
            <div>
              <label className="block font-semibold text-black mb-1">Email Resmi</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="hello@massaphoto.id"
                className="w-full px-3 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">Instagram Bisnis</label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@massaphoto"
                className="w-full px-3 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: UPLOAD LOGO STUDIO */}
        <div className="space-y-3">
          <div className="border-b border-black pb-2">
            <h3 className="font-bold text-black uppercase tracking-wider">Logo Studio</h3>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border border-black rounded p-4 transition-all ${
              isDragOver
                ? 'bg-gray-100'
                : 'bg-white'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative shrink-0">
                {formData.logo_url ? (
                  <div className="w-20 h-20 rounded border border-black overflow-hidden flex items-center justify-center p-1">
                    <img
                      src={formData.logo_url}
                      alt="Logo studio"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded border border-black flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left space-y-2 w-full">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-black text-white rounded text-xs font-semibold flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{formData.logo_url ? 'Ganti' : 'Pilih'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-3 py-1.5 bg-white text-black border border-black rounded text-xs font-semibold"
                  >
                    URL
                  </button>
                  
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 bg-white text-black border border-black rounded text-xs font-semibold"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                {showUrlInput && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-black rounded"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-2 py-1 bg-black text-white rounded text-xs"
                    >
                      Terapkan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TEKS FORMULIR PUBLIK */}
        <div className="space-y-3">
          <div className="border-b border-black pb-2">
            <h3 className="font-bold text-black uppercase tracking-wider">Teks Formulir Publik</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-black mb-1">Teks Pembuka</label>
              <textarea
                name="opening_text"
                rows={2}
                value={formData.opening_text}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block font-semibold text-black mb-1">Teks Penutup</label>
              <textarea
                name="closing_text"
                rows={2}
                value={formData.closing_text}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-black rounded focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-black flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-black text-white rounded text-sm font-bold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
