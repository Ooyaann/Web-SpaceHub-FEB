import { useState } from 'react';
import { Compass, Eye, EyeOff, Lock, Mail, Moon, Sparkles, Sun, User } from 'lucide-react';
import { useSpaceHub } from '../context/SpaceHubContext';
import { useTheme } from '../context/ThemeContext';
import { isValidUnnesEmail } from '../lib/validation';

export default function LoginView() {
  const { loginOrRegister } = useSpaceHub();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('mahasiswa@student.unnes.ac.id');
  const [password, setPassword] = useState('contoh123');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidUnnesEmail(email)) {
      setError('Gunakan email domain UNNES (@student.unnes.ac.id / @unnes.ac.id).');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginOrRegister({ email, password, fullName, mode });
      if (!res?.ok) setError(res?.error || 'Gagal masuk.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setMode('login');
    setEmail('mahasiswa@student.unnes.ac.id');
    setPassword('contoh123');
    setError('');
  };

  return (
    <div className="grid min-h-screen bg-unnes-surface dark:bg-unnes-surface-dark lg:grid-cols-2">
      {/* Form Column */}
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Ubah tema"
          className="absolute right-5 top-5 rounded-xl border border-unnes-border bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-unnes-blue dark:border-unnes-border-dark dark:bg-unnes-card-dark dark:text-slate-300"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-unnes-navy text-unnes-gold shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-none tracking-tight text-unnes-navy dark:text-white">
                Space<span className="text-unnes-blue dark:text-unnes-gold">Hub</span>
              </h1>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Booking Ruang FEB UNNES
              </p>
            </div>
          </div>

          <h2 className="mt-7 text-2xl font-extrabold tracking-tight text-[#0f1d3d] dark:text-white">
            {mode === 'login' ? 'Masuk ke akunmu' : 'Daftar akun baru'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Gunakan email UNNES untuk mengakses 64 ruang kelas & lab.
          </p>

          {/* Tabs */}
          <div className="mt-5 grid grid-cols-2 rounded-xl bg-[#e3ecfc] p-1 dark:bg-[#142042]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`rounded-lg py-2 text-xs font-bold transition ${
                mode === 'login'
                  ? 'bg-white text-unnes-navy shadow-sm dark:bg-unnes-navy dark:text-unnes-gold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                if (email === 'mahasiswa@student.unnes.ac.id') {
                  setEmail('');
                  setPassword('');
                }
              }}
              className={`rounded-lg py-2 text-xs font-bold transition ${
                mode === 'register'
                  ? 'bg-white text-unnes-navy shadow-sm dark:bg-unnes-navy dark:text-unnes-gold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            {mode === 'register' && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Nama</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="sh-input pl-9"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Email UNNES</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@student.unnes.ac.id"
                  className="sh-input pl-9"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="sh-input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label="Toggle password"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="sh-btn-primary w-full py-2.5">
              {submitting ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar & Masuk'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-unnes-border bg-white/80 px-3 py-2.5 text-[11px] dark:border-unnes-border-dark dark:bg-unnes-card-dark">
            <span className="font-mono text-slate-500 dark:text-slate-400">Demo: contoh123</span>
            <button
              type="button"
              onClick={fillDemo}
              className="inline-flex items-center gap-1 font-bold text-unnes-blue hover:underline dark:text-unnes-gold"
            >
              <Sparkles className="h-3 w-3" />
              Isi demo
            </button>
          </div>
        </div>
      </div>

      {/* Visual Column */}
      <div
        className="relative hidden overflow-hidden bg-unnes-navy lg:flex lg:flex-col lg:justify-end lg:p-12"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(11, 42, 111, 0.25) 0%, rgba(7, 22, 63, 0.92) 100%), url(/images/login-bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-md text-white">
          <span className="inline-block rounded-full bg-unnes-gold px-3 py-1 text-xs font-extrabold text-unnes-gold-ink">
            Gedung L2 · L4 · L5
          </span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight">
            Cari ruang kosong, cek tarif, booking instan.
          </h2>
        </div>
      </div>
    </div>
  );
}
