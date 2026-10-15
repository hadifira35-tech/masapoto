import {
  VendorProfile,
  Package,
  Client,
  BookingForm,
  WhatsAppTemplate,
  BookingActivityLog,
  BookingResponse
} from '../types';

const STORAGE_KEY_DATA = 'massa_photo_db_v1';

export interface DatabaseState {
  vendor: VendorProfile;
  packages: Package[];
  clients: Client[];
  bookingForms: BookingForm[];
  bookingResponses: BookingResponse[];
  whatsappTemplates: WhatsAppTemplate[];
  activityLogs: BookingActivityLog[];
}

export const INITIAL_VENDOR: VendorProfile = {
  id: 'a0000000-0000-0000-0000-000000000001',
  brand_name: 'Massa Photo',
  business_name: 'Massa Photo Wedding Photography',
  logo_url: '/src/assets/images/massa_photo_logo_1792077881993.jpg',
  phone: '0895406181407',
  email: 'booking@massaphoto.id',
  address: 'Jakarta & Sekitarnya, Indonesia',
  website: 'https://massaphoto.id',
  instagram: '@massaphoto',
  opening_text: 'Terima kasih telah mempercayakan kebutuhan dokumentasi pernikahan Anda kepada Massa Photo. Mohon lengkapi formulir kebutuhan acara di bawah ini agar tim kami dapat mempersiapkan timeline terbaik untuk hari bahagia Anda.',
  closing_text: 'Setelah Anda menyetujui syarat & ketentuan serta mengirimkan formulir ini, tim Massa Photo akan segera menindaklanjuti dan mengonfirmasi ketersediaan jadwal serta langkah selanjutnya.',
  created_at: new Date('2026-01-01').toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_PACKAGE: Package = {
  id: 'b0000000-0000-0000-0000-000000000001',
  vendor_id: 'a0000000-0000-0000-0000-000000000001',
  name: 'INTIMATE WEDDING PACKAGE',
  code: 'INTIMATE-WED',
  price: 2000000,
  description: 'Paket dokumentasi pernikahan intimate elegan dengan cakupan dokumentasi foto komprehensif, natural documentary style, dan tim fotografer profesional.',
  max_duration_hours: 5,
  attire_policy: 'Pergantian attire atau lebih dari 1 attire wajib upgrade paket.',
  extra_time_policy: 'Tidak tersedia extra time.',
  is_active: true,
  created_at: new Date('2026-01-01').toISOString(),
  updated_at: new Date().toISOString(),
  terms: [
    {
      id: 'term-1',
      package_id: 'b0000000-0000-0000-0000-000000000001',
      term_text: 'Durasi dokumentasi maksimal 5 jam, terhitung 1 jam sebelum acara dimulai.',
      sort_order: 1,
    },
    {
      id: 'term-2',
      package_id: 'b0000000-0000-0000-0000-000000000001',
      term_text: 'Dokumentasi menyesuaikan durasi paket.',
      sort_order: 2,
    },
    {
      id: 'term-3',
      package_id: 'b0000000-0000-0000-0000-000000000001',
      term_text: 'Pergantian attire atau lebih dari 1 attire wajib upgrade paket.',
      sort_order: 3,
    },
    {
      id: 'term-4',
      package_id: 'b0000000-0000-0000-0000-000000000001',
      term_text: 'Tidak tersedia extra time.',
      sort_order: 4,
    },
  ],
  fields: [
    {
      id: 'field-1',
      package_id: 'b0000000-0000-0000-0000-000000000001',
      field_key: 'guest_count',
      field_label: 'Jumlah Tamu Undangan',
      field_type: 'number',
      placeholder: 'Contoh: 100',
      is_required: true,
      min_val: 10,
      max_val: 150,
      unit: 'Orang',
      helper_text: 'Batas intimate maksimal 150 tamu undangan.',
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'field-2',
      package_id: 'b0000000-0000-0000-0000-000000000001',
      field_key: 'attire_count',
      field_label: 'Jumlah Attire / Busana Pengantin',
      field_type: 'number',
      placeholder: '1',
      is_required: true,
      min_val: 1,
      max_val: 1,
      unit: 'Attire',
      helper_text: 'Maksimal 1 attire untuk paket Intimate (pergantian attire wajib upgrade paket).',
      sort_order: 2,
      is_active: true,
    },
    {
      id: 'field-3',
      package_id: 'b0000000-0000-0000-0000-000000000001',
      field_key: 'event_duration',
      field_label: 'Durasi Acara',
      field_type: 'number',
      placeholder: '5',
      is_required: true,
      min_val: 1,
      max_val: 5,
      unit: 'Jam',
      helper_text: 'Maksimal 5 jam terhitung 1 jam sebelum acara dimulai.',
      sort_order: 3,
      is_active: true,
    },
    {
      id: 'field-4',
      package_id: 'b0000000-0000-0000-0000-000000000001',
      field_key: 'finish_time_estimate',
      field_label: 'Estimasi Waktu Selesai Acara',
      field_type: 'time',
      placeholder: '13:00',
      is_required: true,
      min_val: null,
      max_val: null,
      unit: 'WIB',
      helper_text: 'Perkiraan waktu acara berakhir.',
      sort_order: 4,
      is_active: true,
    },
  ],
};

export const INITIAL_CLIENT: Client = {
  id: 'f0000000-0000-0000-0000-000000000001',
  vendor_id: 'a0000000-0000-0000-0000-000000000001',
  groom_bride_names: 'Rendi dan Nita',
  whatsapp_number: '0895406181407',
  internal_notes: 'Klien intimate wedding Jakarta. Rencana akad & resepsi intimate.',
  created_at: new Date('2026-02-10T10:00:00Z').toISOString(),
  updated_at: new Date('2026-02-10T10:00:00Z').toISOString(),
};

export const INITIAL_BOOKING_FORM: BookingForm = {
  id: '10000000-0000-0000-0000-000000000001',
  client_id: 'f0000000-0000-0000-0000-000000000001',
  package_id: 'b0000000-0000-0000-0000-000000000001',
  package_version_id: 'e0000000-0000-0000-0000-000000000001',
  public_token: 'MP_rendi_nita_intimate_77a9',
  status_form: 'awaiting_response',
  status_booking: 'not_confirmed',
  terms_agreed: false,
  package_name_snapshot: 'INTIMATE WEDDING PACKAGE',
  package_price_snapshot: 2000000,
  terms_text_snapshot: [
    'Durasi dokumentasi maksimal 5 jam, terhitung 1 jam sebelum acara dimulai.',
    'Dokumentasi menyesuaikan durasi paket.',
    'Pergantian attire atau lebih dari 1 attire wajib upgrade paket.',
    'Tidak tersedia extra time.',
  ],
  fields_snapshot: INITIAL_PACKAGE.fields,
  submitted_at: null,
  confirmed_at: null,
  created_at: new Date('2026-02-10T10:05:00Z').toISOString(),
  updated_at: new Date('2026-02-10T10:05:00Z').toISOString(),
};

export const INITIAL_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl-1',
    vendor_id: 'a0000000-0000-0000-0000-000000000001',
    template_type: 'share_form',
    title: 'Bagikan Link Booking Form',
    message_body: `Halo Kak [NAMA KLIEN] 👋✨
 
Terima kasih telah mempercayakan kebutuhan dokumentasi pernikahan Kakak kepada Massa Photo.
 
Untuk membantu kami mempersiapkan kebutuhan dokumentasi serta menyesuaikan timeline acara, mohon Kakak melengkapi formulir berikut:
 
📋 *[NAMA PAKET] — Booking Form*
💰 Investasi: [HARGA]
🔗 Link Form: [LINK PUBLIK]
 
Mohon lengkapi informasi acara dan baca syarat serta ketentuan yang tersedia pada formulir.
Jika sudah selesai, silakan klik Submit.
 
Terima kasih, Kak. Kami tunggu informasinya 🙏✨
 
*Massa Photo — Wedding Documentation*`,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tpl-2',
    vendor_id: 'a0000000-0000-0000-0000-000000000001',
    template_type: 'confirm_form',
    title: 'Konfirmasi Penerimaan Form',
    message_body: `Halo Kak [NAMA KLIEN] 👋✨
 
Terima kasih, kami telah menerima formulir kebutuhan dokumentasi pernikahan Kakak.
 
Berikut rangkuman informasi yang telah kami terima:
• Paket: [NAMA PAKET]
• Harga Paket: [HARGA]
• Jumlah Tamu Undangan: [JAWABAN TAMU]
• Jumlah Attire: [JAWABAN ATTIRE]
• Durasi Acara: [JAWABAN DURASI]
• Estimasi Waktu Selesai: [JAWABAN WAKTU]
 
Informasi ini akan kami gunakan untuk menyesuaikan persiapan dan timeline dokumentasi.
Tim Massa Photo akan melakukan tindak lanjut untuk memastikan ketersediaan jadwal dan proses booking selanjutnya.
 
Terima kasih atas kepercayaan Kakak kepada Massa Photo 🙏✨`,
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_LOGS: BookingActivityLog[] = [
  {
    id: 'log-1',
    booking_form_id: '10000000-0000-0000-0000-000000000001',
    actor_name: 'Admin Massa Photo',
    action_type: 'CREATE_FORM',
    description: 'Booking form dibuat untuk klien Rendi dan Nita (Token: MP_rendi_nita_intimate_77a9)',
    created_at: new Date('2026-02-10T10:05:00Z').toISOString(),
  },
];
