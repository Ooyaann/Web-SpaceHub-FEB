import { useState } from 'react';
import {
  Compass,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { ADMIN_PIN } from '../lib/constants';
import { useSpaceHub } from '../context/SpaceHubContext';
import { useTheme } from '../context/ThemeContext';
import { isValidUnnesEmail } from '../lib/validation';

export default function LoginView() {
  const { loginOrRegister, loginAsAdmin } = useSpaceHub();
  const { theme, toggleTheme } = useTheme();

  const [portal, setPortal] = useState('student'); // 'student' | 'admin'
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('mahasiswa@student.unnes.ac.id');
  const [password, setPassword] = useState('contoh123');
  const [fullName, setFullName] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleStudentSubmit = async (e) => {
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

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = loginAsAdmin(adminPin);
    if (!res?.ok) setError(res?.error || 'PIN tidak sesuai.');
  };

  return (
    <div className="grid min-h-screen bg-canvas-light dark:bg-canvas-dark lg:grid-cols-2">
      {/* Left Form Column */}
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Ubah tema"
          className="absolute right-5 top-5 rounded-xl border border-line-light bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-line-dark dark:bg-surface-dark dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-gold shadow-sm dark:bg-brand-dark/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white">
                Space<span className="text-brand dark:text-brand-dark">Hub</span>
              </h1>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Ruang Kelas FEB UNNES</p>
            </div>
          </div>

          {/* Role Switch: Mahasiswa vs Pengelola */}
          <div className="mt-7 grid grid-cols-2 rounded-xl border border-line-light bg-slate-100 p-1 dark:border-line-dark dark:bg-surface-dark">
            <button
              type="button"
              onClick={() => {
                setPortal('student');
                setError('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                portal === 'student'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Mahasiswa
            </button>
            <button
              type="button"
              onClick={() => {
                setPortal('admin');
                setError('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                portal === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Pengelola
            </button>
          </div>

          {portal === 'student' ? (
            <>
              <div className="mt-6 flex items-baseline justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {mode === 'login' ? 'Masuk Mahasiswa' : 'Daftar Akun Baru'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const next = mode === 'login' ? 'register' : 'login';
                    setMode(next);
                    setError('');
                    if (next === 'register' && email === 'mahasiswa@student.unnes.ac.id') {
                      setEmail('');
                      setPassword('');
                    }
                  }}
                  className="text-xs font-semibold text-brand hover:underline dark:text-blue-400"
                >
                  {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                </button>
              </div>

              <form onSubmit={handleStudentSubmit} className="mt-4 space-y-3.5">
                {mode === 'register' && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Nama Lengkap
                    </span>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama lengkap"
                        className="sh-control pl-9"
                      />
                    </div>
                  </label>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Email UNNES
                  </span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@student.unnes.ac.id"
                      className="sh-control pl-9"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Password
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="sh-control pl-9 pr-10"
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

                <button type="submit" disabled={submitting} className="sh-btn-primary w-full">
                  {submitting ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar & Masuk'}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-line-light bg-white px-3 py-2.5 text-[11px] dark:border-line-dark dark:bg-surface-dark">
                <span className="font-mono text-slate-500 dark:text-slate-400">Demo: contoh123</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setEmail('mahasiswa@student.unnes.ac.id');
                    setPassword('contoh123');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1 font-bold text-brand hover:underline dark:text-blue-400"
                >
                  <Sparkles className="h-3 w-3" />
                  Isi akun demo
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-6">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Portal Pengelola</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Pantau tingkat keterisian gedung & riwayat pemakaian ruang.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="mt-4 space-y-3.5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    PIN Pengelola
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="Masukkan PIN pengelola"
                      className="sh-control pl-9"
                    />
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

                <button type="submit" className="sh-btn-primary w-full">
                  Masuk sebagai Pengelola
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-line-light bg-white px-3 py-2.5 text-[11px] dark:border-line-dark dark:bg-surface-dark">
                <span className="font-mono text-slate-500 dark:text-slate-400">PIN Demo: {ADMIN_PIN}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminPin(ADMIN_PIN);
                    setError('');
                  }}
                  className="inline-flex items-center gap-1 font-bold text-brand hover:underline dark:text-blue-400"
                >
                  <Sparkles className="h-3 w-3" />
                  Isi PIN
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Visual Column */}
      <div
        className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-end lg:p-12"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.22) 0%, rgba(9, 13, 22, 0.88) 100%), url(/images/login-bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-md text-white">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-slate-100 backdrop-blur-md">
            64 Ruang · Gedung L2, L4, L5
          </span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
            Cari ruang kosong, cek tarif, booking tanpa bentrok.
          </h2>
        </div>
      </div>
    </div>
  );
}
