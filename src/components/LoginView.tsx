import { useState, FormEvent } from 'react';
import { Lock, User, LogIn, AlertCircle, HelpCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (role: 'Admin' | 'Anggota', username: string) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Silakan masukkan username dan password Anda.');
      return;
    }

    if (trimmedUser === 'admin' && trimmedPass === 'kayaudigital2026') {
      onLogin('Admin', 'Super Admin');
    } else if (trimmedUser === 'peserta' && trimmedPass === 'kayaudigital') {
      onLogin('Anggota', 'Peserta/Anggota');
    } else {
      setError('Kredensial salah. Gunakan detail akun demo di bawah.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[500px] bg-white rounded-[32px] p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 animate-fade-in relative overflow-hidden">
        
        {/* Branch Icon Badge Container */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-700/35">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-7 h-7"
            >
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <rect x="3" y="17" width="6" height="4" rx="1" />
              <rect x="15" y="17" width="6" height="4" rx="1" />
              <path d="M12 7v6" />
              <path d="M6 13h12v4" />
              <path d="M6 17v-4" />
            </svg>
          </div>
        </div>

        {/* Corporate Titles Header */}
        <div className="text-center mb-8">
          <h1 className="text-slate-900 font-extrabold text-xl sm:text-2xl tracking-tight">
            Jereh Digital Management System
          </h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide mt-1.5 font-sans">
            Portal Silsilah & Arsip Digital Keluarga
          </p>
        </div>

        {/* Authentication submission form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 font-semibold leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Username area */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 mb-2">
              USERNAME
            </label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                id="username-field"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full text-xs font-semibold pl-11 pr-4 py-3.5 border border-slate-100 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-100 bg-slate-50/50 text-slate-800 transition-all font-sans"
              />
            </div>
          </div>

          {/* Password area */}
          <div>
            <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                id="password-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs font-mono tracking-widest pl-11 pr-4 py-3.5 border border-slate-100 rounded-xl focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-100 bg-slate-50/50 text-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Action Sign-In Button */}
          <button
            type="submit"
            className="w-full py-4 bg-blue-700 hover:bg-blue-850 active:scale-98 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-700/20 active:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogIn size={16} />
            <span>Masuk ke Sistem</span>
          </button>
        </form>

        {/* Demo Mode / Preview Credentials block */}
        <div className="mt-8 p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3.5">
          <div className="flex items-center gap-2 text-xs text-blue-700 font-bold">
            <HelpCircle size={15} className="shrink-0" />
            <span className="font-bold">Mode Demo / Preview Aktif</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 leading-normal">
            Silakan gunakan kredensial demo berikut:
          </p>
          <div className="grid grid-cols-2 gap-4 text-[11px] font-mono leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">Super Admin:</p>
              <p className="font-bold text-slate-700">admin <span className="text-slate-400">/</span></p>
              <p className="font-bold text-slate-600">kayaudigital2026</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">Peserta/Anggota:</p>
              <p className="font-bold text-slate-700">peserta <span className="text-slate-400">/</span></p>
              <p className="font-bold text-slate-600">kayaudigital</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
