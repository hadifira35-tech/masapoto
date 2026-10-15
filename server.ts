import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser with 10mb limit for logo base64 uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Supabase Admin client with service_role_key (bypasses RLS for guaranteed persistence)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xyqdhhgnqhqfvnuiyxiu.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const DEFAULT_VENDOR_ID = 'a0000000-0000-0000-0000-000000000001';

// =========================================================================
// API ROUTES — DIRECT SUPABASE POSTGRESQL PERSISTENCE
// =========================================================================

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('vendor_profiles')
      .select('*', { count: 'exact', head: true });
    if (error) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
    return res.json({ status: 'ok', database: 'supabase', count });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// 1. VENDOR PROFILE
app.get('/api/vendor', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('vendor_profiles')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/vendor', async (req, res) => {
  try {
    const profile = req.body;
    const vendorId = profile.id || DEFAULT_VENDOR_ID;

    const payload = {
      ...profile,
      id: vendorId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('vendor_profiles')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. PACKAGES
app.get('/api/packages', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('packages')
      .select(`
        *,
        terms:package_terms(*),
        fields:package_fields(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formatted = (data || []).map((pkg) => ({
      ...pkg,
      terms: (pkg.terms || []).sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
      fields: (pkg.fields || []).sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/packages', async (req, res) => {
  try {
    const pkg = req.body;
    const isNew = !pkg.id || pkg.id.startsWith('pkg-');
    const packageId = isNew ? crypto.randomUUID() : pkg.id;

    const { error: upsertErr } = await supabaseAdmin.from('packages').upsert({
      id: packageId,
      vendor_id: pkg.vendor_id || DEFAULT_VENDOR_ID,
      name: pkg.name,
      code: pkg.code,
      price: pkg.price,
      description: pkg.description,
      max_duration_hours: pkg.max_duration_hours ?? 5,
      attire_policy: pkg.attire_policy,
      extra_time_policy: pkg.extra_time_policy,
      is_active: pkg.is_active ?? true,
      updated_at: new Date().toISOString(),
    });

    if (upsertErr) {
      return res.status(500).json({ error: upsertErr.message });
    }

    // Sync terms
    if (pkg.terms) {
      await supabaseAdmin.from('package_terms').delete().eq('package_id', packageId);
      const termsToInsert = pkg.terms.map((t: any, idx: number) => ({
        id: crypto.randomUUID(),
        package_id: packageId,
        term_text: t.term_text,
        sort_order: t.sort_order ?? idx + 1,
      }));
      if (termsToInsert.length > 0) {
        await supabaseAdmin.from('package_terms').insert(termsToInsert);
      }
    }

    // Sync fields
    if (pkg.fields) {
      await supabaseAdmin.from('package_fields').delete().eq('package_id', packageId);
      const fieldsToInsert = pkg.fields.map((f: any, idx: number) => ({
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
        await supabaseAdmin.from('package_fields').insert(fieldsToInsert);
      }
    }

    const { data: updatedPkg, error: fetchErr } = await supabaseAdmin
      .from('packages')
      .select(`*, terms:package_terms(*), fields:package_fields(*)`)
      .eq('id', packageId)
      .single();

    if (fetchErr || !updatedPkg) {
      return res.json({ ...pkg, id: packageId });
    }
    return res.json(updatedPkg);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('packages').delete().eq('id', id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. BOOKING FORMS & CLIENTS
app.get('/api/forms', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('booking_forms')
      .select(`
        *,
        client:clients(*),
        package:packages(*),
        responses:booking_responses(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formatted = (data || []).map((item) => {
      const resObj: Record<string, string> = {};
      if (Array.isArray(item.responses)) {
        item.responses.forEach((r: any) => {
          resObj[r.field_key] = r.response_value;
        });
      }
      return {
        ...item,
        responses: resObj,
      };
    });

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/forms/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { data, error } = await supabaseAdmin
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
      return res.status(404).json({ error: 'Formulir tidak ditemukan.' });
    }

    const resObj: Record<string, string> = {};
    if (Array.isArray(data.responses)) {
      data.responses.forEach((r: any) => {
        resObj[r.field_key] = r.response_value;
      });
    }

    return res.json({
      ...data,
      responses: resObj,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/forms/create', async (req, res) => {
  try {
    const payload = req.body;

    // 1. Create client
    const { data: clientData, error: clientErr } = await supabaseAdmin
      .from('clients')
      .insert({
        vendor_id: DEFAULT_VENDOR_ID,
        groom_bride_names: payload.groom_bride_names,
        whatsapp_number: payload.whatsapp_number,
        internal_notes: payload.internal_notes,
      })
      .select()
      .single();

    if (clientErr || !clientData) {
      return res.status(500).json({ error: clientErr?.message || 'Gagal membuat klien' });
    }

    // 2. Fetch package snapshot
    const { data: pkgData, error: pkgErr } = await supabaseAdmin
      .from('packages')
      .select(`*, terms:package_terms(*), fields:package_fields(*)`)
      .eq('id', payload.package_id)
      .single();

    if (pkgErr || !pkgData) {
      return res.status(404).json({ error: 'Paket tidak ditemukan' });
    }

    const termsSnap = (pkgData.terms || []).map((t: any) => t.term_text);
    const fieldsSnap = pkgData.fields || [];

    // 3. Create booking form
    const { data: formData, error: formErr } = await supabaseAdmin
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
      return res.status(500).json({ error: formErr?.message || 'Gagal membuat booking form' });
    }

    // 4. Activity log
    await supabaseAdmin.from('booking_activity_logs').insert({
      booking_form_id: formData.id,
      actor_name: 'Admin Massa Photo',
      action_type: 'CREATE_FORM',
      description: `Link booking form baru dibuat untuk ${clientData.groom_bride_names}.`,
    });

    return res.json({
      ...formData,
      client: clientData,
      package: pkgData,
      responses: {},
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/forms/submit', async (req, res) => {
  try {
    const { token, responses, agreed } = req.body;

    const { data: form, error: formFetchErr } = await supabaseAdmin
      .from('booking_forms')
      .select('*, client:clients(*), package:packages(*)')
      .eq('public_token', token)
      .maybeSingle();

    if (formFetchErr || !form) {
      return res.status(404).json({ error: 'Formulir tidak ditemukan atau link tidak valid.' });
    }

    const now = new Date().toISOString();

    // 1. Delete old responses if any
    await supabaseAdmin.from('booking_responses').delete().eq('booking_form_id', form.id);

    // 2. Insert new responses
    const responseRows = Object.entries(responses || {}).map(([key, val]) => ({
      id: crypto.randomUUID(),
      booking_form_id: form.id,
      field_key: key,
      field_label: key,
      response_value: String(val ?? ''),
    }));

    if (responseRows.length > 0) {
      const { error: respErr } = await supabaseAdmin
        .from('booking_responses')
        .insert(responseRows);
      if (respErr) {
        console.error('Error inserting booking_responses:', respErr);
      }
    }

    // 3. Update booking form status and agreement
    const { error: updateErr } = await supabaseAdmin
      .from('booking_forms')
      .update({
        status_form: 'submitted',
        terms_agreed: Boolean(agreed),
        submitted_at: now,
        updated_at: now,
      })
      .eq('id', form.id);

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    // 4. Activity log
    await supabaseAdmin.from('booking_activity_logs').insert({
      booking_form_id: form.id,
      actor_name: form.client?.groom_bride_names || 'Klien',
      action_type: 'SUBMIT_FORM',
      description: `Klien telah mengirim formulir acara. Status ketentuan: ${
        agreed ? 'Menyetujui' : 'Tidak Menyetujui'
      }.`,
    });

    const updatedForm = {
      ...form,
      status_form: 'submitted',
      terms_agreed: Boolean(agreed),
      submitted_at: now,
      responses: responses || {},
    };

    return res.json({ success: true, form: updatedForm });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/forms/status', async (req, res) => {
  try {
    const { formId, statusType, value } = req.body;
    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      updated_at: now,
    };

    if (statusType === 'booking') {
      updatePayload.status_booking = value;
      if (value === 'confirmed') updatePayload.confirmed_at = now;
    } else {
      updatePayload.status_form = value;
    }

    const { data, error } = await supabaseAdmin
      .from('booking_forms')
      .update(updatePayload)
      .eq('id', formId)
      .select('*, client:clients(*), package:packages(*)')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await supabaseAdmin.from('booking_activity_logs').insert({
      booking_form_id: formId,
      actor_name: 'Admin Massa Photo',
      action_type: 'UPDATE_STATUS',
      description: `Status ${statusType} diubah menjadi "${value}".`,
    });

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. WHATSAPP TEMPLATES
app.get('/api/templates', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .select('*');

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(data || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const template = req.body;
    const { data, error } = await supabaseAdmin
      .from('whatsapp_templates')
      .upsert({
        id: template.id || crypto.randomUUID(),
        vendor_id: DEFAULT_VENDOR_ID,
        template_type: template.template_type,
        title: template.title,
        message_body: template.message_body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// VITE SPA MIDDLEWARE / PRODUCTION STATIC SERVER
// =========================================================================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Massa Photo Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
