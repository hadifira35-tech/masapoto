import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'massa_supabase_url';
const STORAGE_KEY_KEY = 'massa_supabase_anon_key';

export const DEFAULT_SUPABASE_URL = 'https://xyqdhhgnqhqfvnuiyxiu.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cWRoaGducWhxZnZudWl5eGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNzM3ODUsImV4cCI6MjEwNzY0OTc4NX0.kuKDGOARCDJhbkiXPPixMfikY6_Cp2xuQ19ug7UWF9E';

export function getSupabaseCredentials() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const localUrl = localStorage.getItem(STORAGE_KEY_URL)?.trim() || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY)?.trim() || '';

  const url = envUrl || localUrl || DEFAULT_SUPABASE_URL;
  const key = envKey || localKey || DEFAULT_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project-ref')
  );

  return { url, key, isConfigured };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url && key) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    supabaseInstance = createClient(url.trim(), key.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseCredentials();

  // If not configured, instantiate with a placeholder so app doesn't crash on boot
  const safeUrl = url || 'https://placeholder.supabase.co';
  const safeKey = key || 'placeholder-anon-key';

  supabaseInstance = createClient(safeUrl, safeKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
}

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;

    // Also insert user profile if session exists
    if (data.user) {
      try {
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || data.user.email?.split('@')[0] || 'Admin',
          role: 'admin',
        });
      } catch (e) {
        console.warn('Could not insert user profile:', e);
      }
    }

    return data;
  },

  async signOut() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabase();
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch {
      return null;
    }
  },

  async getSession() {
    const supabase = getSupabase();
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session || null;
    } catch {
      return null;
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = getSupabase();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  },
};
