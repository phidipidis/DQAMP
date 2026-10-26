import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ClipboardList, Activity, ShieldCheck } from 'lucide-react';

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
      <section aria-label="About DQAMP" className="bg-[#1E3A5F] px-6 py-10 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">
        <div className="flex items-center gap-3">
          <img
            src="/deped-lucena-logo.jpg"
            alt="Schools Division of Lucena City logo"
            className="h-12 w-12 rounded-full bg-white object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <p className="text-lg font-bold leading-tight">DQAMP</p>
            <p className="text-sm text-blue-100">Schools Division of Lucena City</p>
          </div>
        </div>

        <div className="mt-10 lg:mt-0">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Plan it. Track it. Prove it.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-blue-100">
            DQAMP: Division Quality Assurance and Monitoring Portal
          </p>

          <ul className="mt-10 hidden max-w-lg space-y-6 sm:block">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-blue-100">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 hidden text-xs text-blue-200 lg:block">
          Runs on this computer. Your records stay in this office.
        </p>
      </section>

      {/* Sign-in */}
      <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:py-14">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5" aria-labelledby="signin-heading">
          <div>
            <h2 id="signin-heading" className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-600">Use the email and password from your administrator.</p>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
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
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30"
            />
          </label>
          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-md bg-[#1E3A5F] px-4 font-semibold text-white hover:bg-[#1E3A5F]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-xs text-slate-500">Forgot your password? Ask your DQAMP administrator.</p>
        </form>
      </main>
    </div>
  );
}
