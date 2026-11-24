// src/components/views/SignInView.tsx
'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowRight, Loader2, CheckCircle2, Shield, Sparkles } from 'lucide-react';

interface SignInViewProps {
  onSignInSuccess: (user: any) => void;
}

export function SignInView({ onSignInSuccess }: SignInViewProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
        }
      });
      if (signInError) throw signInError;
      setSentMessage(`Magic link sent to ${email}! Click the link in your email to sign in.`);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
        }
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/link-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'parent@sharma.demo', user_id: 'demo-parent-sharma' })
      });
      if (!res.ok) throw new Error('Could not initialize demo parent session');
      const data = await res.json();
      const sessionObj = {
        id: data.user_id,
        email: 'parent@sharma.demo',
        name: 'Sharma Family Parent'
      };
      localStorage.setItem('dudu_parent_session', JSON.stringify(sessionObj));
      onSignInSuccess(sessionObj);
    } catch (err: any) {
      setError(err.message || 'Demo sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full bg-[var(--bg-card)] rounded-3xl p-8 border border-[var(--border-card)] shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[var(--brand-orange)]/15 text-[var(--brand-orange)] rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-sm">
            🤖
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">DuDu Parent Access</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Sign in to manage Arjun&apos;s study window, review AI gradings, and control DuDu desk robot.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[#D8262B]/10 border border-[#D8262B]/20 rounded-xl text-xs text-[#D8262B]">
            {error}
          </div>
        )}

        {sentMessage ? (
          <div className="p-5 bg-[#17A34A]/10 border border-[#17A34A]/20 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#17A34A] mx-auto" />
            <h3 className="text-sm font-bold text-[#1F2328]">Check your inbox!</h3>
            <p className="text-xs text-[#6B7280]">{sentMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Parent Email (Magic Link)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] pl-10 focus:outline-none focus:border-[var(--brand-orange)]"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary text-xs py-3 flex items-center justify-center gap-2 shadow-sm font-semibold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Send Magic Link
            </button>
          </form>
        )}

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#ECE7DE]" />
          <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-[#6B7280] font-medium">Or</span>
          <div className="flex-grow border-t border-[#ECE7DE]" />
        </div>

        <div className="space-y-2.5">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full btn btn-secondary text-xs py-2.5 flex items-center justify-center gap-2.5 border-[#ECE7DE] hover:bg-[#FBF9F6]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full btn bg-[var(--badge-bg)] text-[var(--text-primary)] hover:opacity-90 text-xs py-2.5 flex items-center justify-center gap-2 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand-orange)]" />
            Continue as Demo Parent (Sharma Family)
          </button>
        </div>

        <div className="pt-2 text-center text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#17A34A]" />
          <span>Linked automatically to Sharma Family (Arjun · Class 3)</span>
        </div>
      </div>
    </div>
  );
}
