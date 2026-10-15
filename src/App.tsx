/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/ui/Toast';
import { Sidebar, NavTab } from './components/ui/Sidebar';
import { Navbar } from './components/ui/Navbar';
import { DashboardView } from './components/admin/DashboardView';
import { ClientsView } from './components/admin/ClientsView';
import { PackagesView } from './components/admin/PackagesView';
import { VendorSettingsView } from './components/admin/VendorSettingsView';
import { WhatsAppTemplatesView } from './components/admin/WhatsAppTemplatesView';
import { CreateBookingModal } from './components/admin/CreateBookingModal';
import { ClientDetailModal } from './components/admin/ClientDetailModal';
import { PublicBookingForm } from './components/public/PublicBookingForm';
import { LoginView } from './components/auth/LoginView';

import { dataService } from './services/dataService';
import { authService } from './lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { VendorProfile, Package, BookingForm, WhatsAppTemplate } from './types';
import { INITIAL_VENDOR, INITIAL_PACKAGE, INITIAL_BOOKING_FORM, INITIAL_TEMPLATES } from './lib/storageFallback';

function AppContent() {
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);
  const [selectedFormDetail, setSelectedFormDetail] = useState<BookingForm | null>(null);

  const [publicToken, setPublicToken] = useState<string | null>(null);

  const [vendor, setVendor] = useState<VendorProfile>(INITIAL_VENDOR);
  const [packages, setPackages] = useState<Package[]>([INITIAL_PACKAGE]);
  const [forms, setForms] = useState<BookingForm[]>([INITIAL_BOOKING_FORM]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(INITIAL_TEMPLATES);
  const [isLoading, setIsLoading] = useState(false);

  // Check URL token for public client view
  useEffect(() => {
    const handleUrlCheck = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get('token');
      if (tokenParam) {
        setPublicToken(tokenParam);
        return;
      }
      const hash = window.location.hash;
      if (hash.startsWith('#form=')) {
        setPublicToken(hash.replace('#form=', ''));
      } else if (hash.startsWith('#token=')) {
        setPublicToken(hash.replace('#token=', ''));
      }
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, []);

  // Supabase Auth listener
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (e) {
        console.error('Error checking Supabase auth:', e);
      } finally {
        setIsAuthChecking(false);
      }
    }

    checkAuth();
    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load database records directly from Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vData, pData, fData, tData] = await Promise.all([
        dataService.getVendorProfile(),
        dataService.getPackages(),
        dataService.getBookingForms(),
        dataService.getWhatsAppTemplates(),
      ]);

      setVendor(vData);
      setPackages(pData);
      setForms(fData);
      setTemplates(tData);
    } catch (err) {
      console.error('Gagal mengambil data dari Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setCurrentUser(null);
      showToast('Berhasil logout dari akun admin.', 'info');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal logout', 'error');
    }
  };

  const handleOpenPublicForm = (token: string) => {
    const newUrl = `${window.location.pathname}?token=${token}`;
    window.history.pushState({ token }, '', newUrl);
    setPublicToken(token);
  };

  const handleBackToAdmin = () => {
    window.history.pushState({}, '', window.location.pathname);
    setPublicToken(null);
    if (currentUser) {
      loadData();
    }
  };

  const handleBookingCreated = (newForm: BookingForm) => {
    setForms((prev) => [newForm, ...prev]);
  };

  const handleFormUpdated = (updatedForm: BookingForm) => {
    setForms((prev) => prev.map((f) => (f.id === updatedForm.id ? updatedForm : f)));
    if (selectedFormDetail?.id === updatedForm.id) {
      setSelectedFormDetail(updatedForm);
    }
  };

  const shareTpl = templates.find((t) => t.template_type === 'share_form')?.message_body;
  const confirmTpl = templates.find((t) => t.template_type === 'confirm_form')?.message_body;
  const sampleToken = forms[0]?.public_token || 'MP_rendi_nita_intimate_77a9';

  // 1. If user is opening a client public form:
  if (publicToken) {
    return (
      <PublicBookingForm
        token={publicToken}
        vendor={vendor}
      />
    );
  }

  // 2. Auth Loading state
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-950 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-medium">Memverifikasi sesi Supabase Auth...</p>
        </div>
      </div>
    );
  }

  // 3. If Admin is NOT logged in: show Login/Register view
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={() => loadData()}
        brandName={vendor.brand_name}
      />
    );
  }

  // 4. If Admin is logged in: show Dashboard
  return (
    <div className="min-h-screen bg-zinc-100 flex">
      {/* Sidebar with User session & Logout */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCreateBooking={() => setIsCreateBookingOpen(true)}
        brandName={vendor.brand_name}
        logoUrl={vendor.logo_url}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenCreateBooking={() => setIsCreateBookingOpen(true)}
          samplePublicToken={sampleToken}
          onOpenPublicForm={handleOpenPublicForm}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="py-20 text-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-950 animate-spin mx-auto" />
              <p className="text-xs text-zinc-500">Memuat data dari Supabase...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  forms={forms}
                  onOpenClientDetail={setSelectedFormDetail}
                  onOpenCreateBooking={() => setIsCreateBookingOpen(true)}
                  onOpenPublicForm={handleOpenPublicForm}
                  shareTemplate={shareTpl}
                  confirmTemplate={confirmTpl}
                />
              )}

              {activeTab === 'clients' && (
                <ClientsView
                  forms={forms}
                  onOpenCreateBooking={() => setIsCreateBookingOpen(true)}
                  onOpenClientDetail={setSelectedFormDetail}
                  onOpenPublicForm={handleOpenPublicForm}
                  shareTemplate={shareTpl}
                  confirmTemplate={confirmTpl}
                />
              )}

              {activeTab === 'packages' && (
                <PackagesView
                  packages={packages}
                  onPackagesUpdated={(newPkgs) => setPackages(newPkgs)}
                />
              )}

              {activeTab === 'templates' && (
                <WhatsAppTemplatesView
                  templates={templates}
                  onTemplatesUpdated={(newTpls) => setTemplates(newTpls)}
                />
              )}

              {activeTab === 'vendor' && (
                <VendorSettingsView
                  vendor={vendor}
                  onVendorUpdated={(newVendor) => setVendor(newVendor)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateBookingModal
        isOpen={isCreateBookingOpen}
        onClose={() => setIsCreateBookingOpen(false)}
        packages={packages}
        onBookingCreated={handleBookingCreated}
        shareTemplate={shareTpl}
      />

      <ClientDetailModal
        isOpen={Boolean(selectedFormDetail)}
        onClose={() => setSelectedFormDetail(null)}
        form={selectedFormDetail}
        onFormUpdated={handleFormUpdated}
        onOpenPublicForm={handleOpenPublicForm}
        shareTemplate={shareTpl}
        confirmTemplate={confirmTpl}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
