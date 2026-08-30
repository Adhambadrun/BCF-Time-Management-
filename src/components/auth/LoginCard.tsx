import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { GlassPanel } from '../shared/GlassPanel';
import { Loader2, ShieldCheck, AlertCircle, Lock } from 'lucide-react';
import { playSound } from '../../lib/sound';

export const LoginCard: React.FC = () => {
  const { loginWithRedirect, error: auth0Error, isLoading } = useAuth0();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsRedirecting(true);
    setLocalError(null);
    try {
      playSound('click');
      await loginWithRedirect({
        authorizationParams: {
          prompt: 'select_account',
        },
      });
    } catch (err: any) {
      console.error('Auth0 login redirect error:', err);
      const msg = err?.message || 'Authentication failed. Please verify your @bcflights.com account.';
      setLocalError(msg);
      setIsRedirecting(false);
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
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-white via-zinc-50 to-zinc-100 hover:from-white hover:to-zinc-200 text-zinc-950 font-inter font-bold text-sm sm:text-base shadow-[0_0_35px_rgba(255,215,0,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer border-2 border-yellow-400/40"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
                <span>Redirecting to Auth0 Login...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>Sign in with @bcflights.com</span>
              </>
            )}
          </button>

          {displayError && (
            <div className="w-full text-xs text-red-300 bg-red-950/70 border border-red-800/80 p-3 rounded-xl text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}
        </div>

        {/* Floor Security Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Enterprise Floor Access</span>
          <span className="font-mono text-[10px] text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Auth0 SPA Secured
          </span>
        </div>
      </GlassPanel>
    </div>
  );
};

