import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ClipboardList, Activity, ShieldCheck, Eye, EyeOff } from 'lucide-react';

// Colours taken from the Schools Division of Lucena City seal.
const SEAL_BLUE = '#1B2A8F';
const SEAL_GOLD = '#FFD200';

const PILLARS = [
  { icon: ClipboardList, title: 'Plan it', text: 'Goals, division objectives, projects and outputs in one connected chain.' },
  { icon: Activity, title: 'Track it', text: 'Activities, schedules, budgets and status for every division.' },
  { icon: ShieldCheck, title: 'Prove it', text: 'QA reviews, QAME ratings and OneDrive evidence behind every result.' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Enter your email.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email, like name@deped.gov.ph.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

const inputClass = (invalid) =>
  `mt-1 w-full rounded-lg border px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-4 ${
    invalid
      ? 'border-red-500 focus:border-red-600 focus:ring-red-500/25'
      : 'border-slate-300 focus:border-[#1B2A8F] focus:ring-[#1B2A8F]/25'
  }`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const fieldErrors = validate({ email, password });
  const emailError = touched.email && fieldErrors.email;
  const passwordError = touched.password && fieldErrors.password;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setTouched({ email: true, password: true });
    if (Object.keys(fieldErrors).length) return;
    setSubmitting(true);
    try {
      await base44.auth.login(email.trim(), password);
      window.location.href = '/';
    } catch (err) {
      setError(err.status === 401 ? 'Incorrect email or password.' : 'Could not reach the DQAMP server. Is it still running?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.15fr_1fr]">
      <a
        href="#signin"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-[#1B2A8F] focus:shadow-lg"
      >
        Skip to sign in
      </a>

      {/* Brand panel */}
      <section
        aria-label="About DQAMP"
        className="relative z-10 overflow-hidden px-6 py-6 text-white sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:px-16 lg:py-8 lg:shadow-[12px_0_32px_-8px_rgba(15,23,80,0.35)]"
        style={{ background: `radial-gradient(120% 90% at 0% 0%, #2A3BA8 0%, ${SEAL_BLUE} 45%, #121D66 100%)` }}
      >
        {/* Concentric rings echo the seal */}
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -right-64 hidden h-[560px] w-[560px] rounded-full border border-white/20 lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 -right-44 hidden h-[400px] w-[400px] rounded-full border border-white/20 lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 hidden h-[240px] w-[240px] rounded-full border-2 lg:block" style={{ borderColor: `${SEAL_GOLD}80` }} />

        {/* Header: seal and wordmark share one centred row */}
        <header className="relative flex h-16 items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-lg ring-[3px]" style={{ '--tw-ring-color': SEAL_GOLD }}>
            <img
              src="/deped-lucena-logo.jpg"
              alt="Schools Division of Lucena City seal"
              className="h-full w-full rounded-full object-contain"
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: SEAL_GOLD }}>DQAMP 2026</p>
            <p className="mt-0.5 text-sm text-blue-100">Schools Division of Lucena City</p>
          </div>
        </header>

        <div className="relative mt-8 lg:my-auto lg:py-10">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="whitespace-nowrap">Plan it.</span>{' '}
            <span className="whitespace-nowrap">Track it.</span>{' '}
            <span className="whitespace-nowrap" style={{ color: SEAL_GOLD }}>Prove it.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-blue-100">
            Division Quality Assurance and Monitoring Portal
          </p>

          <ul className="mt-10 hidden max-w-xl space-y-5 sm:block">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-5 w-5" style={{ color: SEAL_GOLD }} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-blue-50">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden text-sm uppercase tracking-[0.12em] text-blue-100 lg:block">
          Kagawaran ng Edukasyon · Rehiyon IV-A CALABARZON
        </p>
      </section>

      {/* Sign-in */}
      <main id="signin" tabIndex={-1} className="flex items-center justify-center px-6 py-10 focus:outline-none sm:px-10 lg:py-14">
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-labelledby="signin-heading">
            <div>
              <h2 id="signin-heading" className="text-2xl font-semibold text-slate-900">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-600">Sign in with the email and password from your administrator.</p>
            </div>

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">Email</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'login-email-error' : undefined}
                className={inputClass(emailError)}
              />
              {emailError && <p id="login-email-error" className="mt-1 text-sm text-red-700">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'login-password-error' : undefined}
                  className={`${inputClass(passwordError)} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 mt-0.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A8F]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {passwordError && <p id="login-password-error" className="mt-1 text-sm text-red-700">{passwordError}</p>}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowForgot((v) => !v)}
                  aria-expanded={showForgot}
                  aria-controls="forgot-help"
                  className="rounded text-sm font-medium text-[#1B2A8F] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A8F] focus-visible:ring-offset-2"
                >
                  Forgot your password?
                </button>
              </div>
              {showForgot && (
                <p id="forgot-help" className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-700">
                  Your DQAMP administrator can set a new password for you. Ask them, then sign in with the password they give you.
                </p>
              )}
            </div>

            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-lg bg-[#1B2A8F] px-4 font-semibold text-white shadow-sm transition-colors hover:bg-[#16237A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1B2A8F]/40 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-500">
            <p>Need an account? Ask your DQAMP administrator.</p>
            <p className="mt-1">Runs on this computer. Your records stay in this office.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
