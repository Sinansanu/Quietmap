import React, { useState } from 'react';
import { Compass, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { api, ApiError } from '../../api/client';
import type { User } from '../../types';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (mode === 'register') {
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setErrorMessage('Password must contain at least one letter and one number.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.auth.login({ email: cleanEmail, password });
        onAuthSuccess(res.user);
      } else {
        const res = await api.auth.register({
          email: cleanEmail,
          password,
          full_name: fullName.trim() || undefined,
        });
        onAuthSuccess(res.user);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected authentication error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-sage-50 flex items-center justify-center p-4 font-sans text-sage-800">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-sage-200 shadow-xl overflow-hidden p-8 sm:p-10">
        {/* Aesthetic contour rings */}
        <div className="absolute -right-16 -top-16 w-52 h-52 border border-forest-100/80 contour-orbit pointer-events-none" />
        <div className="absolute -right-8 -top-8 w-36 h-36 border border-coral-100/70 contour-orbit pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-forest-600 text-white flex items-center justify-center shadow-xs">
            <Compass size={22} />
          </div>
          <div>
            <span className="font-extrabold text-xl text-forest-950 tracking-tight block leading-tight">
              QuietMap
            </span>
            <span className="text-[11px] font-semibold text-sage-400 uppercase tracking-wider block">
              Personal Focus Cartographer
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-sage-100 p-1 rounded-xl mb-6 border border-sage-200" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-forest-900 shadow-xs'
                : 'text-sage-500 hover:text-forest-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-forest-900 shadow-xs'
                : 'text-sage-500 hover:text-forest-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-forest-950 tracking-tight">
            {mode === 'login' ? 'Welcome back.' : 'Begin your focus map.'}
          </h1>
          <p className="text-xs text-sage-500 mt-1">
            {mode === 'login'
              ? 'Access your private workspace calm ratings and history.'
              : 'Create your private account to start mapping your acoustic environment.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="full-name-input" className="text-xs font-semibold text-forest-900">
                Full Name (Optional)
              </label>
              <div className="relative">
                <input
                  id="full-name-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full bg-sage-50 border border-sage-300 rounded-xl px-3.5 py-2.5 pl-9 text-xs text-forest-950 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
                <UserIcon size={14} className="absolute left-3 top-3 text-sage-400" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="email-input" className="text-xs font-semibold text-forest-900">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-sage-50 border border-sage-300 rounded-xl px-3.5 py-2.5 pl-9 text-xs text-forest-950 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
              <Mail size={14} className="absolute left-3 top-3 text-sage-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password-input" className="text-xs font-semibold text-forest-900">
              Password
            </label>
            <div className="relative">
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 8 chars (letters & numbers)' : '••••••••'}
                className="w-full bg-sage-50 border border-sage-300 rounded-xl px-3.5 py-2.5 pl-9 text-xs text-forest-950 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
              <Lock size={14} className="absolute left-3 top-3 text-sage-400" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading}
            className="mt-2"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In to QMap' : 'Create My Account'}
          </Button>
        </form>

        {/* Security & Privacy Commitment */}
        <div className="mt-8 pt-5 border-t border-sage-100 flex items-center gap-2 text-[11px] text-sage-500 font-medium">
          <ShieldCheck size={15} className="text-forest-600 shrink-0" />
          <span>Encrypted sessions. Zero audio storage guarantee.</span>
        </div>
      </div>
    </main>
  );
};
