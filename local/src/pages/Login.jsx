import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ClipboardList, Activity, ShieldCheck } from 'lucide-react';

// Colours taken from the Schools Division of Lucena City seal.
const SEAL_BLUE = '#1B2A8F';
const SEAL_GOLD = '#FFD200';

const PILLARS = [
  { icon: ClipboardList, title: 'Plan it', text: 'Goals, division objectives, projects and outputs in one connected chain.' },
  { icon: Activity, title: 'Track it', text: 'Activities, schedules, budgets and status for every division.' },
  { icon: ShieldCheck, title: 'Prove it', text: 'QA reviews, QAME ratings and OneDrive evidence behind every result.' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
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
      {/* Brand panel */}
      <section
        aria-label="About DQAMP"
        className="relative overflow-hidden px-6 py-10 text-white sm:px-10 lg:flex lg:flex-col lg:justify-center lg:px-16 lg:py-14"
        style={{ background: `radial-gradient(120% 90% at 0% 0%, #2A3BA8 0%, ${SEAL_BLUE} 45%, #121D66 100%)` }}
      >
        {/* Concentric rings echo the seal */}
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -right-64 hidden h-[560px] w-[560px] rounded-full border border-white/10 lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 -right-44 hidden h-[400px] w-[400px] rounded-full border border-white/10 lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 hidden h-[240px] w-[240px] rounded-full border-2 lg:block" style={{ borderColor: `${SEAL_GOLD}55` }} />

        <div className="relative flex items-center gap-5 lg:block">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-lg ring-4 sm:h-24 sm:w-24 lg:h-32 lg:w-32" style={{ '--tw-ring-color': SEAL_GOLD }}>
            <img
              src="/deped-lucena-logo.jpg"
              alt="Schools Division of Lucena City seal"
              className="h-full w-full rounded-full object-contain"
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
          </div>
          <div className="lg:mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: SEAL_GOLD }}>DQAMP 2026</p>
            <p className="mt-1 text-sm text-blue-100">Schools Division of Lucena City</p>
          </div>
        </div>

        <div className="relative mt-8 lg:mt-10">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="whitespace-nowrap">Plan it.</span>{' '}
            <span className="whitespace-nowrap">Track it.</span>{' '}
            <span className="whitespace-nowrap" style={{ color: SEAL_GOLD }}>Prove it.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-blue-100">
            DQAMP: Division Quality Assurance and Monitoring Portal
          </p>

          <ul className="mt-10 hidden max-w-xl space-y-5 sm:block">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-5 w-5" style={{ color: SEAL_GOLD }} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-blue-100">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-12 hidden text-xs uppercase tracking-[0.14em] text-blue-200 lg:block">
          Kagawaran ng Edukasyon · Rehiyon IV-A CALABARZON
        </p>
      </section>

      {/* Sign-in */}
      <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:py-14">
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="signin-heading">
            <div>
              <h2 id="signin-heading" className="text-2xl font-semibold text-slate-900">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-600">Sign in with the email and password from your administrator.</p>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-[#1B2A8F] focus:outline-none focus:ring-2 focus:ring-[#1B2A8F]/25"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-[#1B2A8F] focus:outline-none focus:ring-2 focus:ring-[#1B2A8F]/25"
              />
            </label>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-lg bg-[#1B2A8F] px-4 font-semibold text-white shadow-sm transition-colors hover:bg-[#16237A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A8F] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">
            <p>Forgot your password or need an account? Ask your DQAMP administrator.</p>
            <p className="mt-1">Runs on this computer. Your records stay in this office.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
