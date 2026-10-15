import { getSupabase } from '../lib/supabaseClient';
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
import { INITIAL_VENDOR, INITIAL_PACKAGE, INITIAL_TEMPLATES } from '../lib/storageFallback';

export const dataService = {
  async getVendorProfile(): Promise<VendorProfile> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return INITIAL_VENDOR;
    }
    return data as VendorProfile;
  },

  async updateVendorProfile(profile: Partial<VendorProfile>): Promise<VendorProfile> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('vendor_profiles')
      .upsert({
        ...profile,
        id: profile.id || INITIAL_VENDOR.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal menyimpan ke Supabase: ${error.message}`);
    }
    return data as VendorProfile;
  },

  async getPackages(): Promise<Package[]> {
    const supabase = getSupabase();
    const { data: pkgs, error: pkgErr } = await supabase
      .from('packages')
      .select(`
        *,
        terms:package_terms(*),
        fields:package_fields(*)
      `)
      .order('created_at', { ascending: false });

    if (pkgErr || !pkgs || pkgs.length === 0) {
      return [INITIAL_PACKAGE];
    }

    return pkgs.map((p) => ({
      ...p,
      terms: (p.terms || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
      fields: (p.fields || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    })) as Package[];
  },

  async savePackage(pkg: Partial<Package>): Promise<Package> {
    const supabase = getSupabase();
    const isNew = !pkg.id || pkg.id.startsWith('pkg-');
    const packageId = isNew ? crypto.randomUUID() : pkg.id;

    const { error: upsertErr } = await supabase.from('packages').upsert({
      id: packageId,
      vendor_id: pkg.vendor_id || INITIAL_VENDOR.id,
      name: pkg.name,
      code: pkg.code,
      price: pkg.price,
      description: pkg.description,
      max_duration_hours: pkg.max_duration_hours,
      attire_policy: pkg.attire_policy,
      extra_time_policy: pkg.extra_time_policy,
      is_active: pkg.is_active ?? true,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      throw new Error(`Gagal menyimpan paket di Supabase: ${upsertErr.message}`);
    }

    if (pkg.terms) {
      await supabase.from('package_terms').delete().eq('package_id', packageId);
      const termsToInsert = pkg.terms.map((t, idx) => ({
        id: crypto.randomUUID(),
        package_id: packageId,
        term_text: t.term_text,
        sort_order: t.sort_order ?? idx + 1,
      }));
      if (termsToInsert.length > 0) {
        await supabase.from('package_terms').insert(termsToInsert);
      }
    }

    if (pkg.fields) {
      await supabase.from('package_fields').delete().eq('package_id', packageId);
      const fieldsToInsert = pkg.fields.map((f, idx) => ({
        id: crypto.randomUUID(),
        package_id: packageId,
        field_key: f.field_key,
        field_label: f.field_label,
        field_type: f.field_type,
        placeholder: f.placeholder,
        is_required: f.is_required,
        min_val: f.min_val,
        max_val: f.max_val,
        unit: f.unit,
        helper_text: f.helper_text,
        sort_order: f.sort_order ?? idx + 1,
        is_active: f.is_active ?? true,
      }));
      if (fieldsToInsert.length > 0) {
        await supabase.from('package_fields').insert(fieldsToInsert);
      }
    }

    return { ...pkg, id: packageId } as Package;
  },

  async deletePackage(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) {
      throw new Error(`Gagal menghapus paket di Supabase: ${error.message}`);
    }
    return true;
  },

  async getClients(): Promise<Client[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }
    return (data as Client[]) || [];
  },

  async getBookingForms(): Promise<BookingForm[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('booking_forms')
      .select(`
        *,
        client:clients(*),
        package:packages(*),
        responses:booking_responses(*)
      `)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return (data || []).map((item) => {
      const resObj: Record<string, string> = {};
      if (Array.isArray(item.responses)) {
        item.responses.forEach((r: { field_key: string; response_value: string }) => {
          resObj[r.field_key] = r.response_value;
        });
      }
      return {
        ...item,
        responses: resObj,
      };
    }) as BookingForm[];
  },

  async getBookingFormByToken(token: string): Promise<BookingForm | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('booking_forms')
      .select(`
        *,
        client:clients(*),
        package:packages(*),
        responses:booking_responses(*)
      `)
      .eq('public_token', token)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const resObj: Record<string, string> = {};
    if (Array.isArray(data.responses)) {
      data.responses.forEach((r: { field_key: string; response_value: string }) => {
        resObj[r.field_key] = r.response_value;
      });
    }

    return {
      ...data,
      responses: resObj,
    } as BookingForm;
  },

  async createClientWithBooking(payload: {
    groom_bride_names: string;
    whatsapp_number: string;
    internal_notes?: string;
    package_id: string;
    public_token: string;
  }): Promise<BookingForm> {
    const supabase = getSupabase();

    // 1. Insert Client in Supabase
    const { data: clientData, error: clientErr } = await supabase
      .from('clients')
      .insert({
        vendor_id: INITIAL_VENDOR.id,
        groom_bride_names: payload.groom_bride_names,
        whatsapp_number: payload.whatsapp_number,
        internal_notes: payload.internal_notes,
      })
      .select()
      .single();

    if (clientErr || !clientData) {
      throw new Error(`Gagal menyimpan klien di Supabase: ${clientErr?.message}`);
    }

    // 2. Fetch package snapshot from Supabase
    const { data: pkgData, error: pkgErr } = await supabase
      .from('packages')
      .select(`*, terms:package_terms(*), fields:package_fields(*)`)
      .eq('id', payload.package_id)
      .single();

    if (pkgErr || !pkgData) {
      throw new Error(`Paket tidak ditemukan di Supabase: ${pkgErr?.message}`);
    }

    const termsSnap = (pkgData.terms || []).map((t: { term_text: string }) => t.term_text);
    const fieldsSnap = pkgData.fields || [];

    // 3. Insert Booking Form in Supabase
    const { data: formData, error: formErr } = await supabase
      .from('booking_forms')
      .insert({
        client_id: clientData.id,
        package_id: pkgData.id,
        public_token: payload.public_token,
        status_form: 'awaiting_response',
        status_booking: 'not_confirmed',
        terms_agreed: false,
        package_name_snapshot: pkgData.name,
        package_price_snapshot: pkgData.price,
        terms_text_snapshot: termsSnap,
        fields_snapshot: fieldsSnap,
      })
      .select()
      .single();

    if (formErr || !formData) {
      throw new Error(`Gagal membuat booking form di Supabase: ${formErr?.message}`);
    }

    return {
      ...formData,
      client: clientData,
      package: pkgData,
      responses: {},
    };
  },

  async submitBookingForm(
    token: string,
    responses: Record<string, string>,
    agreed: boolean
  ): Promise<{ success: boolean; error?: string; form?: BookingForm }> {
    const supabase = getSupabase();

    const { data: form, error: formFetchErr } = await supabase
      .from('booking_forms')
      .select('*, client:clients(*), package:packages(*)')
      .eq('public_token', token)
      .maybeSingle();

    if (formFetchErr || !form) {
      return { success: false, error: 'Formulir tidak ditemukan atau link tidak valid.' };
    }

    const now = new Date().toISOString();

    // 1. Insert responses first while form is still valid
    const responseRows = Object.entries(responses).map(([key, val]) => ({
      booking_form_id: form.id,
      field_key: key,
      field_label: key,
      response_value: val,
    }));

    if (responseRows.length > 0) {
      await supabase.from('booking_responses').insert(responseRows);
    }

    // 2. Update booking_forms in Supabase
    const { error: updateErr } = await supabase
      .from('booking_forms')
      .update({
        status_form: 'submitted',
        terms_agreed: agreed,
        submitted_at: now,
        updated_at: now,
      })
      .eq('id', form.id);

    if (updateErr) {
      return { success: false, error: `Gagal submit di Supabase: ${updateErr.message}` };
    }

    return {
      success: true,
      form: {
        ...form,
        status_form: 'submitted',
        terms_agreed: agreed,
        submitted_at: now,
        responses,
      },
    };
  },

  async updateBookingStatus(formId: string, status: BookingStatus): Promise<BookingForm | null> {
    const supabase = getSupabase();
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status_booking: status,
      updated_at: now,
    };
    if (status === 'confirmed') {
      updatePayload.confirmed_at = now;
    }

    const { data, error } = await supabase
      .from('booking_forms')
      .update(updatePayload)
      .eq('id', formId)
      .select('*, client:clients(*), package:packages(*)')
      .single();

    if (error) {
      throw new Error(`Gagal update status booking di Supabase: ${error.message}`);
    }

    return data as BookingForm;
  },

  async updateFormStatus(formId: string, status: FormStatus): Promise<BookingForm | null> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('booking_forms')
      .update({
        status_form: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', formId)
      .select('*, client:clients(*), package:packages(*)')
      .single();

    if (error) {
      throw new Error(`Gagal update status form di Supabase: ${error.message}`);
    }

    return data as BookingForm;
  },

  async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('whatsapp_templates').select('*');

    if (error || !data || data.length === 0) {
      return INITIAL_TEMPLATES;
    }
    return data as WhatsAppTemplate[];
  },

  async saveWhatsAppTemplate(template: WhatsAppTemplate): Promise<WhatsAppTemplate> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .upsert({
        id: template.id || crypto.randomUUID(),
        vendor_id: INITIAL_VENDOR.id,
        template_type: template.template_type,
        title: template.title,
        message_body: template.message_body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal menyimpan template WhatsApp di Supabase: ${error.message}`);
    }
    return data as WhatsAppTemplate;
  },

  async getActivityLogs(formId?: string): Promise<BookingActivityLog[]> {
    const supabase = getSupabase();
    let q = supabase
      .from('booking_activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (formId) {
      q = q.eq('booking_form_id', formId);
    }

    const { data } = await q;
    return (data as BookingActivityLog[]) || [];
  },
};
