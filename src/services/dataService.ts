import {
  VendorProfile,
  Package,
  Client,
  BookingForm,
  WhatsAppTemplate,
  BookingActivityLog,
  FormStatus,
  BookingStatus,
} from '../types';

export const dataService = {
  async getVendorProfile(): Promise<VendorProfile> {
    const res = await fetch('/api/vendor');
    if (!res.ok) throw new Error('Gagal memuat profil vendor');
    return await res.json();
  },

  async updateVendorProfile(profile: Partial<VendorProfile>): Promise<VendorProfile> {
    const res = await fetch('/api/vendor', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Gagal menyimpan profil vendor');
    return await res.json();
  },

  async getPackages(): Promise<Package[]> {
    const res = await fetch('/api/packages');
    if (!res.ok) throw new Error('Gagal memuat paket');
    return await res.json();
  },

  async savePackage(pkg: Partial<Package>): Promise<Package> {
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
    if (!res.ok) throw new Error('Gagal menyimpan paket');
    return await res.json();
  },

  async deletePackage(id: string): Promise<boolean> {
    const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Gagal menghapus paket');
    return true;
  },

  async getClients(): Promise<Client[]> {
    // Note: Clients are fetched as part of booking forms, or could add an endpoint
    return [];
  },

  async getBookingForms(): Promise<BookingForm[]> {
    const res = await fetch('/api/forms');
    if (!res.ok) throw new Error('Gagal memuat form');
    return await res.json();
  },

  async getBookingFormByToken(token: string): Promise<BookingForm | null> {
    const res = await fetch(`/api/forms/token/${encodeURIComponent(token)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Gagal memuat form');
    return await res.json();
  },

  async createClientWithBooking(payload: {
    groom_bride_names: string;
    whatsapp_number: string;
    internal_notes?: string;
    package_id: string;
    public_token: string;
  }): Promise<BookingForm> {
    const res = await fetch('/api/forms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Gagal membuat booking form');
    return await res.json();
  },

  async submitBookingForm(
    token: string,
    responses: Record<string, string>,
    agreed: boolean
  ): Promise<{ success: boolean; error?: string; form?: BookingForm }> {
    const res = await fetch('/api/forms/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, responses, agreed }),
    });
    if (!res.ok) {
        const errorData = await res.json();
        return { success: false, error: errorData.error || 'Gagal submit form' };
    }
    const json = await res.json();
    return { success: true, form: json.form };
  },

  async updateBookingStatus(formId: string, status: BookingStatus): Promise<BookingForm | null> {
    const res = await fetch('/api/forms/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, statusType: 'booking', value: status }),
      });
      if (!res.ok) throw new Error('Gagal update status booking');
      return await res.json();
  },

  async updateFormStatus(formId: string, status: FormStatus): Promise<BookingForm | null> {
    const res = await fetch('/api/forms/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, statusType: 'form', value: status }),
      });
      if (!res.ok) throw new Error('Gagal update status form');
      return await res.json();
  },

  async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    const res = await fetch('/api/templates');
    if (!res.ok) throw new Error('Gagal memuat template');
    return await res.json();
  },

  async saveWhatsAppTemplate(template: WhatsAppTemplate): Promise<WhatsAppTemplate> {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error('Gagal menyimpan template');
    return await res.json();
  },

  async getActivityLogs(formId?: string): Promise<BookingActivityLog[]> {
    // TODO: implement endpoint
    return [];
  },
};
