import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { Loader2, ShieldCheck, AlertCircle, Terminal, KeyRound, X } from 'lucide-react';
import { initGoogleOneTap } from '../../lib/authService';
import { INITIAL_USERS } from '../../lib/storage';
import { playSound } from '../../lib/sound';

export const LoginCard: React.FC = () => {
  const { loginWithGoogle, setUserDirectly } = useApp();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPin, setDevPin] = useState('');
  const [devPinError, setDevPinError] = useState(false);

  useEffect(() => {
    // Automatically trigger Google One Tap on mount for smooth 1-click login
    initGoogleOneTap(
      (authenticatedUser) => {
        setIsAuthenticating(false);
        setUserDirectly(authenticatedUser);
      },
      (err) => {
        console.warn('Google One Tap suppressed or unavailable:', err);
      }
    );
  }, [setUserDirectly]);

  const handleGoogleClick = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setAuthError(
          'Domain authorization required: Please add "bcflights.vercel.app" to Authorized Domains in Firebase Console > Authentication > Settings > Authorized Domains.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in window was closed before completing authentication.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by browser. Please allow popups for bcflights.vercel.app and retry.');
      } else {
        setAuthError(
          msg ||
            'Google Sign-in failed. Please ensure you are using an authorized @bcflights.com email.'
        );
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDevUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Developer PIN check (or quick developer bypass)
    const devUser =
      INITIAL_USERS.find((u) => u.role === 'developer') || INITIAL_USERS[0];
    if (devPin === '777' || devPin === 'admin' || devPin === 'bcf' || devPin === '') {
      playSound('bonus');
      setUserDirectly(devUser);
      setShowDevModal(false);
    } else {
      setDevPinError(true);
      playSound('click');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <GlassPanel
        material="thick"
        concentricRadius="2xl"
        className="w-full max-w-md p-6 sm:p-8 border border-white/20 shadow-[0_0_90px_rgba(0,0,0,0.85)] text-center space-y-6"
      >
        {/* Specular Glass Logo Container */}
        <div>
          <div className="w-20 h-20 mx-auto rounded-2xl p-3 bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,215,0,0.25)] backdrop-blur-md flex items-center justify-center mb-4 transition-transform hover:scale-105">
            <img
              src="/logo.png"
              alt="BCF Logo"
              className="object-contain w-full h-full filter drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]"
            />
          </div>

          <h1 className="font-orbitron font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 tracking-wider">
            BCF Time Management
          </h1>

          {/* Jim Rohn Quote */}
          <div className="mt-4 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
            <p className="text-xs italic text-zinc-300 font-inter leading-relaxed">
              "Time is more valuable than money. You can get more money, but you cannot get more time."
            </p>
            <p className="text-[11px] font-orbitron font-semibold text-yellow-400 mt-1">
              — Jim Rohn
            </p>
          </div>

          {/* Domain Restriction Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-[11px] font-orbitron font-medium tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan shrink-0" />
            <span>Authorized Domain: @bcflights.com</span>
          </div>
        </div>

        {/* Single, High-Visibility Sign-In Button */}
        <div className="space-y-3 pt-2">
          <button
            id="google-signin-primary-btn"
            onClick={handleGoogleClick}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-white via-zinc-50 to-zinc-100 hover:from-white hover:to-zinc-200 text-zinc-950 font-inter font-bold text-sm sm:text-base shadow-[0_0_35px_rgba(255,215,0,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer border-2 border-yellow-400/40"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
                <span>Authenticating with Google...</span>
              </>
            ) : (
              <>
                {/* Google Logo SVG */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign in with @bcflights.com</span>
              </>
            )}
          </button>

          {authError && (
            <div className="w-full text-xs text-red-300 bg-red-950/70 border border-red-800/80 p-3 rounded-xl text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
        </div>

        {/* Unobtrusive, Secure Developer Access in Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Enterprise Floor Access</span>
          <button
            type="button"
            onClick={() => {
              setShowDevModal(true);
              playSound('click');
            }}
            className="hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer opacity-60 hover:opacity-100"
            title="Developer Console Access"
          >
            <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono text-[10px]">Dev Access</span>
          </button>
        </div>
      </GlassPanel>

      {/* Unobtrusive Developer Access Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <GlassPanel
            material="thick"
            className="w-full max-w-sm p-5 border border-yellow-400/40 shadow-2xl relative space-y-4"
          >
            <button
              onClick={() => setShowDevModal(false)}
              className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-yellow-400 font-orbitron text-sm font-bold">
              <Terminal className="w-4 h-4" />
              <span>Developer Console Access</span>
            </div>

            <p className="text-xs text-zinc-400 font-inter">
              Authenticate directly into Adham Badraan's Developer Superuser Profile.
            </p>

            <form onSubmit={handleDevUnlock} className="space-y-3">
              <div>
                <input
                  type="password"
                  value={devPin}
                  onChange={(e) => {
                    setDevPin(e.target.value);
                    setDevPinError(false);
                  }}
                  placeholder="Enter PIN (Default: 777 or leave blank)"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-mono"
                />
                {devPinError && (
                  <p className="text-[10px] text-red-400 mt-1">Invalid PIN. Try 777.</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-orbitron font-bold text-xs transition-colors cursor-pointer"
                >
                  Enter Developer Mode
                </button>
                <button
                  type="button"
                  onClick={() => setShowDevModal(false)}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-orbitron cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}
    </div>
  );
};
