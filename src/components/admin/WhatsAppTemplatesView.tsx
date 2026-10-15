import React, { useState } from 'react';
import { WhatsAppTemplate } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../ui/Toast';
import { Save, Send } from 'lucide-react';
import { interpolateTemplate, generateWhatsAppLink } from '../../utils/whatsapp';
import { formatRupiah } from '../../utils/formatters';

interface WhatsAppTemplatesViewProps {
  templates: WhatsAppTemplate[];
  onTemplatesUpdated: (templates: WhatsAppTemplate[]) => void;
}

export const WhatsAppTemplatesView: React.FC<WhatsAppTemplatesViewProps> = ({
  templates,
  onTemplatesUpdated,
}) => {
  const { showToast } = useToast();
  const [activeType, setActiveType] = useState<'share_form' | 'confirm_form'>('share_form');

  const shareTemplate = templates.find((t) => t.template_type === 'share_form') || {
    id: 'tpl-1',
    template_type: 'share_form',
    title: 'Bagikan Link Booking Form',
    message_body: '',
  };

  const confirmTemplate = templates.find((t) => t.template_type === 'confirm_form') || {
    id: 'tpl-2',
    template_type: 'confirm_form',
    title: 'Konfirmasi Penerimaan Form',
    message_body: '',
  };

  const [shareBody, setShareBody] = useState(shareTemplate.message_body);
  const [confirmBody, setConfirmBody] = useState(confirmTemplate.message_body);
  const [isSaving, setIsSaving] = useState(false);

  const currentBody = activeType === 'share_form' ? shareBody : confirmBody;
  const setCurrentBody = activeType === 'share_form' ? setShareBody : setConfirmBody;

  const insertVariable = (variableName: string) => {
    setCurrentBody((prev) => prev + ` [${variableName}]`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeType === 'share_form') {
        await dataService.saveWhatsAppTemplate({
          ...shareTemplate,
          message_body: shareBody,
        });
      } else {
        await dataService.saveWhatsAppTemplate({
          ...confirmTemplate,
          message_body: confirmBody,
        });
      }
      const all = await dataService.getWhatsAppTemplates();
      onTemplatesUpdated(all);
      showToast('Template disimpan!', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Gagal menyimpan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const previewVariables: Record<string, string> = {
    'NAMA KLIEN': 'Rendi dan Nita',
    'NAMA PAKET': 'INTIMATE WEDDING PACKAGE',
    'HARGA': formatRupiah(2000000),
    'LINK PUBLIK': `${window.location.origin}?token=MP_rendi_nita_intimate_77a9`,
    'JAWABAN TAMU': '100 Orang',
    'JAWABAN ATTIRE': '1 Attire',
    'JAWABAN DURASI': '5 Jam',
    'JAWABAN WAKTU': '13:00 WIB',
    'NAMA VENDOR': 'Massa Photo',
  };

  const previewMessage = interpolateTemplate(currentBody, previewVariables);

  const testSendWhatsApp = () => {
    const waUrl = generateWhatsAppLink('0895406181407', previewMessage);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-zinc-950">Template WhatsApp</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Format pesan otomatis untuk pengiriman link formulir dan konfirmasi acara.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-2 text-xs">
        <button
          onClick={() => setActiveType('share_form')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeType === 'share_form'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Bagikan Form
        </button>
        <button
          onClick={() => setActiveType('confirm_form')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeType === 'confirm_form'
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:bg-zinc-100'
          }`}
        >
          Konfirmasi Form
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-4 sm:p-5 space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              {activeType === 'share_form' ? 'Template Bagikan Link Form' : 'Template Konfirmasi Form'}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {activeType === 'share_form'
                ? 'Pesan otomatis yang dikirimkan ke calon pengantin saat link form dibagikan.'
                : 'Pesan otomatis rangkuman jawaban yang dikirimkan ke calon pengantin setelah form disubmit.'}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-zinc-500 block mb-1">
              Variabel otomatis (klik untuk menyisipkan):
            </span>
            <div className="flex flex-wrap gap-1">
              {Object.keys(previewVariables).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-mono"
                >
                  [{v}]
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={10}
            value={currentBody}
            onChange={(e) => setCurrentBody(e.target.value)}
            className="w-full p-3 text-xs font-sans border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 leading-relaxed"
          />

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Template'}</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-zinc-950 text-white rounded-xl border border-zinc-800 p-4 sm:p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs">
              <span className="font-semibold text-zinc-300">Preview Pesan</span>
              <span className="text-zinc-500 text-[11px]">0895406181407</span>
            </div>

            <div className="mt-3 p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-sans">
              {previewMessage}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex justify-end">
            <button
              onClick={testSendWhatsApp}
              className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Tes di WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
