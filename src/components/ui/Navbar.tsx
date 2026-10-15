import React from 'react';
import { Menu, Plus, ExternalLink } from 'lucide-react';
import { NavTab } from './Sidebar';

interface NavbarProps {
  activeTab: NavTab;
  onOpenMobileMenu: () => void;
  onOpenCreateBooking: () => void;
  samplePublicToken?: string;
  onOpenPublicForm: (token: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenCreateBooking,
  samplePublicToken,
  onOpenPublicForm,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'clients':
        return 'Data Klien';
      case 'packages':
        return 'Paket & Ketentuan';
      case 'templates':
        return 'Template WhatsApp';
      case 'vendor':
        return 'Pengaturan Vendor';
      default:
        return 'Admin';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
      {/* Zone 1: Mobile toggle & Clean Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors shrink-0"
          aria-label="Buka navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-sm sm:text-base font-bold text-zinc-950 truncate">
          {getTabTitle(activeTab)}
        </h2>
      </div>

      {/* Zone 2: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {samplePublicToken && (
          <button
            onClick={() => onOpenPublicForm(samplePublicToken)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-800 hover:bg-zinc-100 text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Form Rendi & Nita</span>
          </button>
        )}

        <button
          onClick={onOpenCreateBooking}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Buat Booking</span>
        </button>
      </div>
    </header>
  );
};
