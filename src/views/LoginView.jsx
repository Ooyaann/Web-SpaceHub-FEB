import { useState } from 'react';
import { Eye, EyeOff, GraduationCap, Lock, Mail, Moon, ShieldCheck, Sun, User } from 'lucide-react';
import { ADMIN_PIN } from '../lib/constants';
import { useSpaceHub } from '../context/SpaceHubContext';
import { useTheme } from '../context/ThemeContext';
import { isValidUnnesEmail } from '../lib/validation';

export default function LoginView() {
  const { loginOrRegister, loginAsAdmin } = useSpaceHub();
  const { theme, toggleTheme } = useTheme();

  const [portal, setPortal] = useState('student');
  const [mode, setMode] = useState('login');
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
    <div className="grid min-h-screen bg-[#F8F9FB] dark:bg-ink-canvas lg:grid-cols-2">
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Ubah tema"
          className="sh-btn-secondary absolute right-5 top-5 h-9 w-9 px-0"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-unnes-gold" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="animate-view-in mx-auto w-full max-w-sm">
          <div>
            <h1 className="text-3xl font-extrabold leading-none tracking-[-0.03em] text-unnes-navy dark:text-white">
              Space<span className="text-unnes-gold">Hub</span>
            </h1>
            <p className="mt-1.5 text-[13px] text-[#475467] dark:text-[#B0B8C9]">
              Pencarian & booking ruang kelas kosong · FEB UNNES
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 rounded-xl border border-[#DCE2EC] bg-[#EEF1F6] p-1 dark:border-ink-line dark:bg-ink-card">
            <button
              type="button"
              onClick={() => {
                setPortal('student');
                setError('');
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                portal === 'student'
                  ? 'bg-white text-[#101828] shadow-sm dark:bg-ink-subtle dark:text-[#F5F7FA]'
                  : 'text-[#475467] dark:text-[#B0B8C9]'
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
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                portal === 'admin'
                  ? 'bg-white text-[#101828] shadow-sm dark:bg-ink-subtle dark:text-[#F5F7FA]'
                  : 'text-[#475467] dark:text-[#B0B8C9]'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Pengelola
            </button>
          </div>

          {portal === 'student' ? (
            <div className="sh-panel mt-5 p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold text-[#101828] dark:text-[#F5F7FA]">
                  {mode === 'login' ? 'Masuk akun' : 'Buat akun'}
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
                  className="text-xs font-semibold text-unnes-navy hover:underline dark:text-unnes-gold"
                >
                  {mode === 'login' ? 'Daftar akun baru' : 'Sudah punya akun'}
                </button>
              </div>

              <form onSubmit={handleStudentSubmit} className="mt-4 space-y-3.5">
                {mode === 'register' && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                      Nama lengkap
                    </span>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085] dark:text-[#8F98AD]" />
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
                  <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                    Email UNNES
                  </span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085] dark:text-[#8F98AD]" />
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
                  <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                    Password
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085] dark:text-[#8F98AD]" />
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#667085] hover:text-[#101828] dark:text-[#8F98AD] dark:hover:text-[#F5F7FA]"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                {error && (
                  <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={submitting} className="sh-btn-primary w-full">
                  {submitting ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar & masuk'}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between border-t border-[#ECEFF4] pt-4 text-xs text-[#667085] dark:border-ink-line dark:text-[#8A93A6]">
                <span>Akun demo: contoh123</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setEmail('mahasiswa@student.unnes.ac.id');
                    setPassword('contoh123');
                    setError('');
                  }}
                  className="font-semibold text-unnes-navy hover:underline dark:text-unnes-gold"
                >
                  Isi otomatis
                </button>
              </div>
            </div>
          ) : (
            <div className="sh-panel mt-5 p-6">
              <div>
                <h2 className="text-lg font-bold text-[#101828] dark:text-[#F5F7FA]">Portal pengelola</h2>
                <p className="mt-1 text-xs text-[#475467] dark:text-[#B0B8C9]">
                  Akses ringkasan keterisian gedung & riwayat pemakaian.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} className="mt-4 space-y-3.5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#475467] dark:text-[#B0B8C9]">
                    PIN pengelola
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085] dark:text-[#8F98AD]" />
                    <input
                      type="password"
                      required
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="Masukkan PIN"
                      className="sh-control pl-9"
                    />
                  </div>
                </label>

                {error && (
                  <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                )}

                <button type="submit" className="sh-btn-primary w-full">
                  Masuk pengelola
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between border-t border-[#ECEFF4] pt-4 text-xs text-[#667085] dark:border-ink-line dark:text-[#8A93A6]">
                <span>PIN demo: {ADMIN_PIN}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminPin(ADMIN_PIN);
                    setError('');
                  }}
                  className="font-semibold text-unnes-navy hover:underline dark:text-unnes-gold"
                >
                  Isi otomatis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campus Photo */}
      <div className="relative hidden overflow-hidden bg-unnes-navy lg:block">
        <img
          src="/images/login-bg.jpg"
          alt="Gedung FEB UNNES"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
