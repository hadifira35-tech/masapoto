-- ====================================================================
-- MASSA PHOTO BOOKING MANAGEMENT SYSTEM — INITIAL MIGRATION
-- Database: Supabase PostgreSQL with Row Level Security (RLS)
-- Version: 20261015000000
-- ====================================================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running
DROP TABLE IF EXISTS booking_activity_logs CASCADE;
DROP TABLE IF EXISTS booking_responses CASCADE;
DROP TABLE IF EXISTS booking_forms CASCADE;
DROP TABLE IF EXISTS package_versions CASCADE;
DROP TABLE IF EXISTS package_fields CASCADE;
DROP TABLE IF EXISTS package_terms CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS vendor_profiles CASCADE;

-- 3. VENDOR PROFILES
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name VARCHAR(150) NOT NULL DEFAULT 'Massa Photo',
  business_name VARCHAR(200) NOT NULL DEFAULT 'Massa Photo Wedding Photography',
  logo_url TEXT DEFAULT '/src/assets/images/massa_photo_logo_1792077881993.jpg',
  phone VARCHAR(50) NOT NULL DEFAULT '0895406181407',
  email VARCHAR(100) DEFAULT 'hello@massaphoto.id',
  address TEXT DEFAULT 'Jakarta & Sekitarnya, Indonesia',
  website VARCHAR(150) DEFAULT 'https://massaphoto.id',
  instagram VARCHAR(100) DEFAULT '@massaphoto',
  opening_text TEXT DEFAULT 'Terima kasih telah mempercayakan kebutuhan dokumentasi pernikahan Anda kepada Massa Photo. Mohon lengkapi formulir kebutuhan acara di bawah ini agar tim kami dapat mempersiapkan timeline terbaik untuk hari bahagia Anda.',
  closing_text TEXT DEFAULT 'Setelah Anda menyetujui syarat & ketentuan serta mengirimkan formulir ini, tim Massa Photo akan segera menindaklanjuti dan mengonfirmasi ketersediaan jadwal serta langkah selanjutnya.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. USER PROFILES (Linked to Supabase Auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- 'admin' or 'staff'
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. PACKAGES
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  description TEXT,
  max_duration_hours INTEGER NOT NULL DEFAULT 5,
  attire_policy TEXT NOT NULL DEFAULT 'Pergantian attire atau lebih dari 1 attire wajib upgrade paket.',
  extra_time_policy TEXT NOT NULL DEFAULT 'Tidak tersedia extra time.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. PACKAGE TERMS
CREATE TABLE package_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  term_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. PACKAGE CONFIGURABLE FIELDS
CREATE TABLE package_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  field_key VARCHAR(100) NOT NULL,
  field_label VARCHAR(150) NOT NULL,
  field_type VARCHAR(50) NOT NULL DEFAULT 'number', -- 'number', 'text', 'time', 'select'
  placeholder VARCHAR(200),
  is_required BOOLEAN NOT NULL DEFAULT true,
  min_val INTEGER,
  max_val INTEGER,
  unit VARCHAR(50),
  helper_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. PACKAGE VERSIONS (Immutable snapshot)
CREATE TABLE package_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL DEFAULT 1,
  name VARCHAR(150) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  terms_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  fields_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. CLIENTS
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  groom_bride_names VARCHAR(200) NOT NULL,
  whatsapp_number VARCHAR(50) NOT NULL,
  internal_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. BOOKING FORMS
CREATE TABLE booking_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  package_version_id UUID REFERENCES package_versions(id) ON DELETE SET NULL,
  public_token VARCHAR(100) UNIQUE NOT NULL,
  status_form VARCHAR(50) NOT NULL DEFAULT 'awaiting_response', 
  -- 'draft', 'awaiting_response', 'submitted', 'expired', 'revoked'
  status_booking VARCHAR(50) NOT NULL DEFAULT 'not_confirmed', 
  -- 'not_confirmed', 'pending_confirmation', 'confirmed', 'cancelled', 'completed'
  terms_agreed BOOLEAN NOT NULL DEFAULT false,
  terms_text_snapshot JSONB DEFAULT '[]'::jsonb,
  fields_snapshot JSONB DEFAULT '[]'::jsonb,
  package_name_snapshot VARCHAR(150),
  package_price_snapshot NUMERIC(12, 2),
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. BOOKING RESPONSES
CREATE TABLE booking_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_form_id UUID NOT NULL REFERENCES booking_forms(id) ON DELETE CASCADE,
  field_key VARCHAR(100) NOT NULL,
  field_label VARCHAR(150) NOT NULL,
  response_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_form_field UNIQUE (booking_form_id, field_key)
);

-- 12. WHATSAPP TEMPLATES
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL, -- 'share_form', 'confirm_form'
  title VARCHAR(150) NOT NULL,
  message_body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT unique_vendor_template UNIQUE (vendor_id, template_type)
);

-- 13. BOOKING ACTIVITY LOGS (Append-Only Audit Trail)
CREATE TABLE booking_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_form_id UUID NOT NULL REFERENCES booking_forms(id) ON DELETE CASCADE,
  actor_name VARCHAR(100) NOT NULL DEFAULT 'System',
  action_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 14. CREATE INDEXES FOR OPTIMAL QUERY PERFORMANCE
CREATE INDEX idx_booking_forms_public_token ON booking_forms(public_token);
CREATE INDEX idx_booking_forms_client ON booking_forms(client_id);
CREATE INDEX idx_booking_forms_status ON booking_forms(status_form, status_booking);
CREATE INDEX idx_booking_responses_form ON booking_responses(booking_form_id);
CREATE INDEX idx_package_terms_pkg ON package_terms(package_id, sort_order);
CREATE INDEX idx_package_fields_pkg ON package_fields(package_id, sort_order);
CREATE INDEX idx_clients_phone ON clients(whatsapp_number);
CREATE INDEX idx_activity_logs_form ON booking_activity_logs(booking_form_id);

-- 15. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_activity_logs ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES (Full Access for authenticated users)
CREATE POLICY "Admins full access to vendor_profiles" ON vendor_profiles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access to packages" ON packages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access to package_terms" ON package_terms
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access to package_fields" ON package_fields
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access to package_versions" ON package_versions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access to clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access to booking_forms" ON booking_forms
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access to booking_responses" ON booking_responses
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access to whatsapp_templates" ON whatsapp_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins full access to booking_activity_logs" ON booking_activity_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- PUBLIC ANON POLICIES (Strictly token-governed for Client Form)
-- Public can view vendor profile details for form header
CREATE POLICY "Public read vendor profiles" ON vendor_profiles
  FOR SELECT TO anon USING (true);

-- Public can view active packages, terms, and fields
CREATE POLICY "Public read packages" ON packages
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Public read package_terms" ON package_terms
  FOR SELECT TO anon USING (true);

CREATE POLICY "Public read package_fields" ON package_fields
  FOR SELECT TO anon USING (is_active = true);

-- Public can read client info if tied to a valid booking form token
CREATE POLICY "Public read client by token" ON clients
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM booking_forms bf
      WHERE bf.client_id = clients.id
      AND bf.public_token IS NOT NULL
    )
  );

-- Public can read ONLY their specific booking form via valid token
CREATE POLICY "Public read booking form by token" ON booking_forms
  FOR SELECT TO anon
  USING (
    public_token IS NOT NULL AND
    (expires_at IS NULL OR expires_at > now()) AND
    status_form IN ('awaiting_response', 'submitted')
  );

-- Public can update booking form to submit (supports both agree and disagree)
CREATE POLICY "Public submit booking form" ON booking_forms
  FOR UPDATE TO anon
  USING (
    public_token IS NOT NULL AND
    (expires_at IS NULL OR expires_at > now())
  )
  WITH CHECK (
    status_form = 'submitted'
  );

-- Public can read responses of their submitted form
CREATE POLICY "Public read booking responses" ON booking_responses
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM booking_forms bf
      WHERE bf.id = booking_responses.booking_form_id
      AND bf.public_token IS NOT NULL
    )
  );

-- Public can insert and update responses for their booking form
CREATE POLICY "Public insert booking responses" ON booking_responses
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM booking_forms bf
      WHERE bf.id = booking_responses.booking_form_id
      AND (bf.expires_at IS NULL OR bf.expires_at > now())
    )
  );

CREATE POLICY "Public update booking responses" ON booking_responses
  FOR UPDATE TO anon
  USING (
    EXISTS (
      SELECT 1 FROM booking_forms bf
      WHERE bf.id = booking_responses.booking_form_id
      AND (bf.expires_at IS NULL OR bf.expires_at > now())
    )
  );

-- Public can append to audit log upon submission
CREATE POLICY "Public insert activity log" ON booking_activity_logs
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM booking_forms bf
      WHERE bf.id = booking_activity_logs.booking_form_id
      AND (bf.expires_at IS NULL OR bf.expires_at > now())
    )
  );

-- ====================================================================
-- SEED INITIAL DATA: MASSA PHOTO & INTIMATE WEDDING PACKAGE
-- ====================================================================

-- 1. Insert Default Vendor Profile
INSERT INTO vendor_profiles (id, brand_name, business_name, phone, email, address, website, instagram)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Massa Photo',
  'Massa Photo Wedding Documentation',
  '0895406181407',
  'booking@massaphoto.id',
  'Jakarta & Sekitarnya, Indonesia',
  'https://massaphoto.id',
  '@massaphoto'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Initial Package: INTIMATE WEDDING PACKAGE
INSERT INTO packages (
  id,
  vendor_id,
  name,
  code,
  price,
  description,
  max_duration_hours,
  attire_policy,
  extra_time_policy,
  is_active
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'INTIMATE WEDDING PACKAGE',
  'INTIMATE-WED',
  2000000,
  'Paket dokumentasi pernikahan intimate elegan dengan cakupan dokumentasi foto komprehensif, natural documentary style, dan tim fotografer profesional.',
  5,
  'Pergantian attire atau lebih dari 1 attire wajib upgrade paket.',
  'Tidak tersedia extra time.',
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert Terms for INTIMATE WEDDING PACKAGE
INSERT INTO package_terms (id, package_id, term_text, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Durasi dokumentasi maksimal 5 jam, terhitung 1 jam sebelum acara dimulai.', 1),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Dokumentasi menyesuaikan durasi paket.', 2),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Pergantian attire atau lebih dari 1 attire wajib upgrade paket.', 3),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Tidak tersedia extra time.', 4)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Configurable Event Inquiry Fields
INSERT INTO package_fields (
  id,
  package_id,
  field_key,
  field_label,
  field_type,
  placeholder,
  is_required,
  min_val,
  max_val,
  unit,
  helper_text,
  sort_order,
  is_active
) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'guest_count', 'Jumlah Tamu Undangan', 'number', 'Contoh: 100', true, 10, 150, 'Orang', 'Batas intimate maksimal 150 tamu undangan.', 1, true),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'attire_count', 'Jumlah Attire / Busana Pengantin', 'number', '1', true, 1, 1, 'Attire', 'Maksimal 1 attire untuk paket Intimate (lebih dari 1 wajib upgrade paket).', 2, true),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'event_duration', 'Durasi Acara', 'number', '5', true, 1, 5, 'Jam', 'Maksimal 5 jam terhitung 1 jam sebelum acara dimulai.', 3, true),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'finish_time_estimate', 'Estimasi Waktu Selesai Acara', 'time', '13:00', true, NULL, NULL, 'WIB', 'Waktu perkiraan acara selesai.', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Package Version Snapshot
INSERT INTO package_versions (
  id,
  package_id,
  version_number,
  name,
  price,
  terms_snapshot,
  fields_snapshot
) VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  1,
  'INTIMATE WEDDING PACKAGE',
  2000000,
  '[
    {"term_text": "Durasi dokumentasi maksimal 5 jam, terhitung 1 jam sebelum acara dimulai.", "sort_order": 1},
    {"term_text": "Dokumentasi menyesuaikan durasi paket.", "sort_order": 2},
    {"term_text": "Pergantian attire atau lebih dari 1 attire wajib upgrade paket.", "sort_order": 3},
    {"term_text": "Tidak tersedia extra time.", "sort_order": 4}
  ]'::jsonb,
  '[
    {"field_key": "guest_count", "field_label": "Jumlah Tamu Undangan", "field_type": "number", "min_val": 10, "max_val": 150, "unit": "Orang", "is_required": true},
    {"field_key": "attire_count", "field_label": "Jumlah Attire / Busana Pengantin", "field_type": "number", "min_val": 1, "max_val": 1, "unit": "Attire", "is_required": true},
    {"field_key": "event_duration", "field_label": "Durasi Acara", "field_type": "number", "min_val": 1, "max_val": 5, "unit": "Jam", "is_required": true},
    {"field_key": "finish_time_estimate", "field_label": "Estimasi Waktu Selesai Acara", "field_type": "time", "unit": "WIB", "is_required": true}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 6. Insert Example Client: Rendi dan Nita (0895406181407)
INSERT INTO clients (
  id,
  vendor_id,
  groom_bride_names,
  whatsapp_number,
  internal_notes
) VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Rendi dan Nita',
  '0895406181407',
  'Klien referensi Intimate Wedding 2026. Jadwal akad & resepsi pagi.'
) ON CONFLICT (id) DO NOTHING;

-- 7. Insert Initial Booking Form with Unique Cryptographic Token
INSERT INTO booking_forms (
  id,
  client_id,
  package_id,
  package_version_id,
  public_token,
  status_form,
  status_booking,
  terms_agreed,
  package_name_snapshot,
  package_price_snapshot,
  terms_text_snapshot,
  fields_snapshot
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000001',
  'MP_rendi_nita_intimate_77a9',
  'awaiting_response',
  'not_confirmed',
  false,
  'INTIMATE WEDDING PACKAGE',
  2000000,
  '[
    "Durasi dokumentasi maksimal 5 jam, terhitung 1 jam sebelum acara dimulai.",
    "Dokumentasi menyesuaikan durasi paket.",
    "Pergantian attire atau lebih dari 1 attire wajib upgrade paket.",
    "Tidak tersedia extra time."
  ]'::jsonb,
  '[
    {"field_key": "guest_count", "field_label": "Jumlah Tamu Undangan", "field_type": "number", "placeholder": "Contoh: 100", "min_val": 10, "max_val": 150, "unit": "Orang", "helper_text": "Batas intimate maksimal 150 tamu undangan.", "is_required": true},
    {"field_key": "attire_count", "field_label": "Jumlah Attire / Busana Pengantin", "field_type": "number", "placeholder": "1", "min_val": 1, "max_val": 1, "unit": "Attire", "helper_text": "Maksimal 1 attire untuk paket Intimate.", "is_required": true},
    {"field_key": "event_duration", "field_label": "Durasi Acara", "field_type": "number", "placeholder": "5", "min_val": 1, "max_val": 5, "unit": "Jam", "helper_text": "Maksimal 5 jam dokumentasi.", "is_required": true},
    {"field_key": "finish_time_estimate", "field_label": "Estimasi Waktu Selesai Acara", "field_type": "time", "placeholder": "13:00", "unit": "WIB", "helper_text": "Perkiraan waktu acara selesai.", "is_required": true}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 8. Insert WhatsApp Templates
INSERT INTO whatsapp_templates (id, vendor_id, template_type, title, message_body) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'share_form',
  'Bagikan Link Form Booking',
  'Halo Kak [NAMA KLIEN] 👋✨

Terima kasih telah mempercayakan kebutuhan dokumentasi pernikahan Kakak kepada Massa Photo.

Untuk membantu kami mempersiapkan kebutuhan dokumentasi serta menyesuaikan timeline acara, mohon Kakak melengkapi formulir berikut:

📋 *[NAMA PAKET] — Booking Form*
💰 Investasi: [HARGA]
🔗 Link Form: [LINK PUBLIK]

Mohon lengkapi informasi acara dan baca syarat serta ketentuan yang tersedia pada formulir.
Jika sudah selesai, silakan klik Submit.

Terima kasih, Kak. Kami tunggu informasinya 🙏✨

*Massa Photo — Wedding Documentation*'
),
(
  '20000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'confirm_form',
  'Konfirmasi Penerimaan Form',
  'Halo Kak [NAMA KLIEN] 👋✨

Terima kasih, kami telah menerima formulir kebutuhan dokumentasi pernikahan Kakak.

Berikut rangkuman informasi yang telah kami terima:
• Paket: [NAMA PAKET]
• Investasi Paket: [HARGA]
• Jumlah Tamu Undangan: [JAWABAN TAMU]
• Jumlah Attire: [JAWABAN ATTIRE]
• Durasi Acara: [JAWABAN DURASI]
• Estimasi Waktu Selesai: [JAWABAN WAKTU]

Informasi ini akan kami gunakan untuk menyesuaikan persiapan dan timeline dokumentasi. Tim Massa Photo akan segera melakukan tindak lanjut untuk memastikan ketersediaan jadwal dan proses booking selanjutnya.

Terima kasih atas kepercayaan Kakak kepada Massa Photo 🙏✨'
) ON CONFLICT (id) DO NOTHING;

-- 9. Insert Initial Activity Log
INSERT INTO booking_activity_logs (
  booking_form_id,
  actor_name,
  action_type,
  description
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  'Admin Massa Photo',
  'CREATE_FORM',
  'Formulir booking dibuat untuk klien Rendi dan Nita dengan paket INTIMATE WEDDING PACKAGE.'
);
