import React from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  MessageSquare,
  Settings,
  Plus,
  Camera,
  X,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

export type NavTab =
  | 'dashboard'
  | 'clients'
  | 'packages'
  | 'templates'
  | 'vendor';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreateBooking: () => void;
  brandName?: string;
  logoUrl?: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateBooking,
  brandName = 'Massa Photo',
  logoUrl,
  isMobileOpen,
  onCloseMobile,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'clients' as NavTab,
      label: 'Data Klien',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'packages' as NavTab,
      label: 'Paket & Ketentuan',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'templates' as NavTab,
      label: 'Template WhatsApp',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'vendor' as NavTab,
      label: 'Pengaturan Vendor',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-zinc-950 border-r border-zinc-800 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="w-9 h-9 rounded-lg bg-white overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src={logoUrl}
                    alt={brandName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
              )}
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                  {brandName}
                </h1>
                <p className="text-[11px] text-zinc-400">Admin Booking</p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-zinc-400 hover:text-white"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick CTA */}
          <div className="px-3 pt-3">
            <button
              onClick={() => {
                onOpenCreateBooking();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Form Baru</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors text-left ${
                    isActive
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-zinc-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Account & Logout Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 space-y-2">
          {currentUser && (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs">
              <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-200 truncate text-[11px]">
                  {currentUser.email}
                </p>
                <p className="text-[10px] text-zinc-500">Supabase Auth</p>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
