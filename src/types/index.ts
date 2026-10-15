export interface VendorProfile {
  id: string;
  brand_name: string;
  business_name: string;
  logo_url: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  instagram: string;
  opening_text: string;
  closing_text: string;
  created_at: string;
  updated_at: string;
}

export interface PackageTerm {
  id: string;
  package_id?: string;
  term_text: string;
  sort_order: number;
}

export type FieldInputType = 'number' | 'text' | 'time' | 'select';

export interface PackageField {
  id: string;
  package_id?: string;
  field_key: string;
  field_label: string;
  field_type: FieldInputType;
  placeholder?: string;
  is_required: boolean;
  min_val?: number | null;
  max_val?: number | null;
  unit?: string;
  helper_text?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Package {
  id: string;
  vendor_id?: string;
  name: string;
  code: string;
  price: number;
  description: string;
  max_duration_hours: number;
  attire_policy: string;
  extra_time_policy: string;
  is_active: boolean;
  terms: PackageTerm[];
  fields: PackageField[];
  created_at: string;
  updated_at: string;
}

export interface PackageVersion {
  id: string;
  package_id: string;
  version_number: number;
  name: string;
  price: number;
  terms_snapshot: PackageTerm[];
  fields_snapshot: PackageField[];
  created_at: string;
}

export interface Client {
  id: string;
  vendor_id?: string;
  groom_bride_names: string;
  whatsapp_number: string;
  internal_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type FormStatus = 'draft' | 'awaiting_response' | 'submitted' | 'expired' | 'revoked';
export type BookingStatus = 'not_confirmed' | 'pending_confirmation' | 'confirmed' | 'cancelled' | 'completed';

export interface BookingResponse {
  id?: string;
  booking_form_id: string;
  field_key: string;
  field_label: string;
  response_value: string;
  created_at?: string;
}

export interface BookingForm {
  id: string;
  client_id: string;
  package_id: string;
  package_version_id?: string;
  public_token: string;
  status_form: FormStatus;
  status_booking: BookingStatus;
  terms_agreed: boolean;
  terms_text_snapshot?: string[];
  fields_snapshot?: PackageField[];
  package_name_snapshot?: string;
  package_price_snapshot?: number;
  submitted_at?: string | null;
  confirmed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations populated for display
  client?: Client;
  package?: Package;
  responses?: Record<string, string>;
}

export interface WhatsAppTemplate {
  id: string;
  vendor_id?: string;
  template_type: 'share_form' | 'confirm_form';
  title: string;
  message_body: string;
  created_at?: string;
  updated_at?: string;
}

export interface BookingActivityLog {
  id: string;
  booking_form_id: string;
  actor_name: string;
  action_type: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SupabaseConfigState {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
  error?: string | null;
}
