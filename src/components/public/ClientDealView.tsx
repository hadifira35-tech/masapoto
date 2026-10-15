import React from 'react';
import { BookingForm, VendorProfile } from '../../types';
import { formatRupiah, formatPhoneNumber } from '../../utils/formatters';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { generateWhatsAppLink } from '../../utils/whatsapp';

interface ClientDealViewProps {
  form: BookingForm;
  vendor: VendorProfile;
}

export const ClientDealView: React.FC<ClientDealViewProps> = ({ form, vendor }) => {
  const packageName = form.package_name_snapshot || form.package?.name || 'INTIMATE WEDDING PACKAGE';
  const packagePrice = form.package_price_snapshot || form.package?.price || 0;
  
  const handleOpenWhatsAppChat = () => {
    if (!vendor.phone) return;
    const msg = `Halo Massa Photo, saya ${form.client?.groom_bride_names} 👋✨. Saya ingin mengonfirmasi booking untuk paket ${packageName}. Terima kasih! 🙏✨`;
    const waUrl = generateWhatsAppLink(vendor.phone, msg);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-black p-8 space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 mx-auto" />
          <h2 className="text-xl font-bold uppercase tracking-widest">Booking Dikonfirmasi</h2>
          <p className="text-sm">Terima kasih, {form.client?.groom_bride_names}.</p>
        </div>

        <div className="border-t border-b border-black py-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">Nama Pengantin:</span>
            <span>{form.client?.groom_bride_names}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Paket:</span>
            <span>{packageName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Total Investasi:</span>
            <span className="font-bold">{formatRupiah(packagePrice)}</span>
          </div>
        </div>

        <button
          onClick={handleOpenWhatsAppChat}
          className="w-full py-3 bg-black text-white font-bold flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat Admin</span>
        </button>

        <div className="text-center text-xs border-t border-black pt-4">
          © 2026 {vendor.brand_name} • {vendor.phone}
        </div>
      </div>
    </div>
  );
};
