import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { Loader2, ShieldCheck, AlertCircle, Lock, KeyRound, Terminal, X, RefreshCw } from 'lucide-react';
import { playSound } from '../../lib/sound';
import { INITIAL_USERS } from '../../lib/storage';
import { syncAuth0UserToApp } from '../../lib/auth0Service';

export const LoginCard: React.FC = () => {
  const { loginWithRedirect, loginWithPopup, error: auth0Error, isLoading } = useAuth0();
  const { setUserDirectly } = useApp();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPin, setDevPin] = useState('');
  const [devPinError, setDevPinError] = useState(false);

  const clearUrlError = () => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setLocalError(null);
  };

  const handleSignIn = async () => {
    setIsRedirecting(true);
    clearUrlError();
    try {
      playSound('click');
      await loginWithRedirect({
        authorizationParams: {
          prompt: 'select_account',
        },
      });
    } catch (err: any) {
      console.error('Auth0 login redirect error:', err);
      const msg = err?.message || 'Authentication failed. Please verify your @bcflights.com account or use popup login.';
      setLocalError(msg);
      setIsRedirecting(false);
    }
  };

  const handlePopupSignIn = async () => {
    setIsRedirecting(true);
    clearUrlError();
    try {
      playSound('click');
      await loginWithPopup({
        authorizationParams: {
          prompt: 'select_account',
        },
      });
    } catch (err: any) {
      console.error('Auth0 popup login error:', err);
      const msg = err?.message || 'Popup sign-in cancelled or failed.';
      setLocalError(msg);
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleDevUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const devUser =
      INITIAL_USERS.find((u) => u.email === 'adhambadraan@gmail.com') ||
      INITIAL_USERS.find((u) => u.role === 'developer') ||
      INITIAL_USERS[0];

    if (devPin.trim() === '141220') {
      playSound('bonus');
      setUserDirectly({
        ...devUser,
        name: 'Adham Badraan',
        email: 'adhambadraan@gmail.com',
        role: 'developer',
      });
      setShowDevModal(false);
      setDevPin('');
      setDevPinError(false);
    } else {
      setDevPinError(true);
      playSound('click');
    }
  };

  const displayError = localError || (auth0Error ? auth0Error.message : null);
  const isBusy = isLoading || isRedirecting;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <GlassPanel
        material="thick"
        concentricRadius="2xl"
        className="w-full max-w-md p-6 sm:p-8 border border-white/20 shadow-[0_0_90px_rgba(0,0,0,0.85)] text-center space-y-6"
      >
        {/* Official 3D Gold Logo Asset */}
        <div>
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="Time Management Logo"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain filter drop-shadow-[0_0_24px_rgba(255,204,0,0.35)] transition-transform duration-300 hover:scale-105"
            />
          </div>

          <h1 className="font-orbitron font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 tracking-wider">
            Time Management
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
          <div className="mt-3 flex flex-col items-center gap-1">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-[11px] font-orbitron font-medium tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan shrink-0" />
              <span>Authorized Domain: @bcflights.com</span>
            </div>
          </div>
        </div>

        {/* Primary Sign-In Actions */}
        <div className="space-y-3 pt-2">
          <button
            id="auth-signin-primary-btn"
            onClick={handleSignIn}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-white via-zinc-50 to-zinc-100 hover:from-white hover:to-zinc-200 text-zinc-950 font-inter font-bold text-sm sm:text-base shadow-[0_0_35px_rgba(255,215,0,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer border-2 border-yellow-400/40"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
                <span>Redirecting to Auth0...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>Sign in with @bcflights.com</span>
              </>
            )}
          </button>

          {/* Error display with clear & retry options */}
          {displayError && (
            <div className="w-full text-xs text-red-300 bg-red-950/70 border border-red-800/80 p-3.5 rounded-xl text-left space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-red-200">Authentication Error: </span>
                  <span>{displayError}</span>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePopupSignIn}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-orbitron text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Try Popup Login
                </button>
                <button
                  type="button"
                  onClick={clearUrlError}
                  className="px-2.5 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800/80 text-red-200 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Clear Error</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floor Security Footer with Made by Badran */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Enterprise Floor Access</span>
          <button
            type="button"
            onClick={() => {
              setShowDevModal(true);
              playSound('click');
            }}
            className="hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer group"
            title="Made by Badran · Developer Console"
          >
            <span className="font-orbitron text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] group-hover:brightness-125">
              Made by Badran
            </span>
          </button>
        </div>
      </GlassPanel>

      {/* Developer Access Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <GlassPanel
            material="thick"
            className="w-full max-w-sm p-5 border border-yellow-400/40 shadow-2xl relative space-y-4"
          >
            <button
              onClick={() => {
                setShowDevModal(false);
                setDevPin('');
                setDevPinError(false);
              }}
              className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-yellow-400 font-orbitron text-sm font-bold">
              <Terminal className="w-4 h-4" />
              <span>Developer God Mode Access</span>
            </div>

            <p className="text-xs text-zinc-300 font-inter">
              Authorized developer authentication for Lead System Architect.
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
                  placeholder="Enter Developer PIN"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-mono"
                  autoFocus
                />
                {devPinError && (
                  <p className="text-[10px] text-red-400 mt-1">Invalid PIN. Please try again.</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-orbitron font-bold text-xs transition-colors cursor-pointer"
                >
                  Unlock Developer Mode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDevModal(false);
                    setDevPin('');
                    setDevPinError(false);
                  }}
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


