import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { Loader2, ShieldCheck, AlertCircle, Terminal, KeyRound, X, Lock } from 'lucide-react';
import { INITIAL_USERS } from '../../lib/storage';
import { playSound } from '../../lib/sound';

export const LoginCard: React.FC = () => {
  const { loginWithAuth0, setUserDirectly } = useApp();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devPin, setDevPin] = useState('');
  const [devPinError, setDevPinError] = useState(false);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await loginWithAuth0();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Popup window closed') || msg.includes('cancelled')) {
        setAuthError('Authentication cancelled.');
      } else {
        setAuthError(
          msg || 'Authentication failed. Please verify your @bcflights.com account.'
        );
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDevUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const devUser =
      INITIAL_USERS.find((u) => u.role === 'developer') || INITIAL_USERS[0];
    if (devPin.trim() === '141220') {
      playSound('bonus');
      setUserDirectly(devUser);
      setShowDevModal(false);
      setDevPin('');
      setDevPinError(false);
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

        {/* Single, High-Visibility Sign-In Button with Auth0 */}
        <div className="space-y-3 pt-2">
          <button
            id="auth-signin-primary-btn"
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-white via-zinc-50 to-zinc-100 hover:from-white hover:to-zinc-200 text-zinc-950 font-inter font-bold text-sm sm:text-base shadow-[0_0_35px_rgba(255,215,0,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer border-2 border-yellow-400/40"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
                <span>Authenticating with @bcflights.com...</span>
              </>
            ) : (
              <>
                {/* Auth Shield Icon */}
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
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

      {/* Secure Developer Access Modal */}
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
              <span>Developer Console Access</span>
            </div>

            <p className="text-xs text-zinc-400 font-inter">
              Security verification required to access the developer console.
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
                  placeholder="Enter PIN"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-mono"
                  autoFocus
                />
                {devPinError && (
                  <p className="text-[10px] text-red-400 mt-1">Invalid PIN.</p>
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
