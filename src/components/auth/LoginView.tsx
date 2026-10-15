import React, { useState } from 'react';
import { authService } from '../../lib/supabaseClient';
import { Camera, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface LoginViewProps {
  onLoginSuccess: () => void;
  brandName?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  brandName = 'Massa Photo',
}) => {
  const { showToast } = useToast();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegisterMode) {
        await authService.signUp(email.trim(), password, fullName.trim());
        showToast('Akun berhasil dibuat! Silakan masuk.', 'success');
        setIsRegisterMode(false);
      } else {
        await authService.signIn(email.trim(), password);
        showToast('Login berhasil. Selamat datang di Massa Photo Admin!', 'success');
        onLoginSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan autentikasi.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center mx-auto shadow-xs">
            <Camera className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-zinc-950 tracking-tight">{brandName}</h1>
          <p className="text-xs text-zinc-500">
            {isRegisterMode ? 'Pendaftaran Admin Supabase' : 'Login Admin Dashboard'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-zinc-950 text-white text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegisterMode && (
            <div>
              <label className="block font-semibold text-zinc-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Nama admin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@massaphoto.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>{isRegisterMode ? 'Daftar Akun' : 'Masuk ke Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2 border-t border-zinc-100 text-xs">
          {isRegisterMode ? (
            <p className="text-zinc-500">
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMsg(null);
                }}
                className="font-bold text-zinc-950 hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          ) : (
            <p className="text-zinc-500">
              Belum punya akun admin?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMsg(null);
                }}
                className="font-bold text-zinc-950 hover:underline"
              >
                Buat akun admin
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
