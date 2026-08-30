import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { Loader2, ShieldCheck, AlertCircle, Sparkles, ChevronDown, UserCheck, Bot, ArrowRight } from 'lucide-react';
import { initGoogleOneTap } from '../../lib/authService';
import { INITIAL_USERS } from '../../lib/storage';
import { UserRole } from '../../types';
import { playSound } from '../../lib/sound';

export const LoginCard: React.FC = () => {
  const { loginWithGoogle, setUserDirectly } = useApp();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showRosterQuickSelect, setShowRosterQuickSelect] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | UserRole>('all');

  // GenAI Identity Router state
  const [aiQuery, setAiQuery] = useState('');
  const [isAiRouting, setIsAiRouting] = useState(false);
  const [aiResult, setAiResult] = useState<{
    matchedEmail?: string;
    matchedName?: string;
    role?: string;
    route?: string;
    reasoning?: string;
    confidence?: number;
  } | null>(null);

  useEffect(() => {
    // Automatically trigger Google One Tap on mount
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
      setAuthError(err?.message || 'Google Sign-in failed. Please ensure you are using an authorized @bcflights.com email.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAiIdentityRoute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiQuery.trim() || isAiRouting) return;

    setIsAiRouting(true);
    setAuthError(null);
    setAiResult(null);
    playSound('hover_tick');

    try {
      const roster = INITIAL_USERS.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        teamId: u.teamId,
      }));

      const res = await fetch('/api/auth/resolve-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery, roster }),
      });

      if (!res.ok) throw new Error('AI Identity Router failed to respond');

      const data = await res.json();
      setAiResult(data);

      if (data.matchedEmail) {
        const targetUser = INITIAL_USERS.find(u => u.email.toLowerCase() === data.matchedEmail.toLowerCase());
        if (targetUser) {
          playSound('bonus');
          setTimeout(() => {
            setUserDirectly(targetUser);
          }, 800);
        } else {
          setAuthError(`Resolved to ${data.matchedName || data.matchedEmail}, but account is not found in master storage.`);
        }
      } else {
        setAuthError(data.reasoning || 'No matching personnel found for this name variation.');
      }
    } catch (err: any) {
      console.error(err);
      // Fallback local match if server is offline or key not provided
      const lower = aiQuery.toLowerCase().trim();
      const localMatch = INITIAL_USERS.find(
        u => u.name.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower)
      );
      if (localMatch) {
        setAiResult({
          matchedName: localMatch.name,
          matchedEmail: localMatch.email,
          role: localMatch.role,
          confidence: 0.9,
          reasoning: 'Resolved via local fast-match fallback',
        });
        playSound('bonus');
        setTimeout(() => {
          setUserDirectly(localMatch);
        }, 800);
      } else {
        setAuthError('Could not resolve identity. Try typing full name or email.');
      }
    } finally {
      setIsAiRouting(false);
    }
  };

  const filteredUsers = INITIAL_USERS.filter(u => {
    if (selectedRoleFilter === 'all') return true;
    return u.role === selectedRoleFilter;
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <GlassPanel
        material="thick"
        concentricRadius="2xl"
        className="w-full max-w-md p-6 md:p-8 border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.85)] text-center space-y-6"
      >
        {/* Specular Glass Logo Container */}
        <div>
          <div className="w-20 h-20 mx-auto rounded-2xl p-3 bg-white/5 border border-white/10 shadow-[0_0_25px_rgba(255,215,0,0.2)] backdrop-blur-md flex items-center justify-center mb-4 transition-transform hover:scale-105">
            <img
              src="/logo.png"
              alt="BCF Logo"
              className="object-contain w-full h-full filter drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]"
            />
          </div>

          <h1 className="font-orbitron font-black text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 tracking-wider">
            BCF Time Management
          </h1>

          {/* Jim Rohn Quote */}
          <div className="mt-4 px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
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

        {/* Primary Direct Google Sign-In Trigger */}
        <div className="space-y-3 pt-1">
          {/* Target for Google Identity Services GSI button if rendered */}
          <div id="google-signin-button" className="min-h-[44px] flex justify-center w-full empty:hidden" />

          <button
            onClick={handleGoogleClick}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-100 font-inter font-semibold text-sm shadow-[0_0_30px_rgba(255,215,0,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer border border-yellow-400/30"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-zinc-700" />
                <span>Authenticating with Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 'G' Logo */}
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
            <div className="w-full text-xs text-red-300 bg-red-950/60 border border-red-800/80 p-3 rounded-xl text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
        </div>

        {/* Google GenAI Identity Router Input (gemini-2.5-flash) */}
        <form onSubmit={handleAiIdentityRoute} className="pt-2 border-t border-white/10 text-left space-y-2">
          <div className="flex items-center justify-between text-[11px] font-orbitron text-zinc-300">
            <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
              <Bot className="w-3.5 h-3.5 text-yellow-400" />
              GenAI Identity Router (gemini-2.5-flash)
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Auto-Route</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder="Type name (e.g. 'Meredith', 'Dom', 'Adham')..."
              className="w-full bg-black/60 border border-white/15 rounded-xl pl-3 pr-20 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-inter"
            />
            <button
              type="submit"
              disabled={isAiRouting || !aiQuery.trim()}
              className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/50 text-yellow-300 text-[10px] font-orbitron font-bold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
            >
              {isAiRouting ? (
                <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
              ) : (
                <>
                  <span>Route</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>

          {aiResult && aiResult.matchedName && (
            <div className="p-2.5 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-xs font-inter text-yellow-200 flex items-center justify-between animate-fadeIn">
              <div>
                <span className="font-bold text-white">{aiResult.matchedName}</span>
                <span className="text-[10px] text-zinc-400 ml-1">({aiResult.role?.toUpperCase()})</span>
                <div className="text-[10px] text-zinc-400 italic mt-0.5">{aiResult.reasoning}</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-yellow-400 text-black font-orbitron font-bold text-[10px]">
                Routing...
              </span>
            </div>
          )}
        </form>

        {/* Quick Floor Identity Switcher (For Floor Testing & Demo) */}
        <div className="pt-1 border-t border-white/10">
          <button
            onClick={() => setShowRosterQuickSelect(!showRosterQuickSelect)}
            className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-orbitron text-zinc-300 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Quick Floor Identity Sign-In
            </span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showRosterQuickSelect ? 'rotate-180' : ''}`} />
          </button>

          {showRosterQuickSelect && (
            <div className="mt-3 space-y-2 text-left">
              {/* Role filter buttons */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {(['all', 'developer', 'admin', 'supervisor', 'agent'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRoleFilter(role)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-orbitron uppercase transition-all whitespace-nowrap ${
                      selectedRoleFilter === role
                        ? 'bg-yellow-400 text-black font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Roster list */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setUserDirectly(user)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-yellow-400/15 border border-white/5 hover:border-yellow-400/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-white/20"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200 group-hover:text-yellow-300 font-inter">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                        {user.role}
                      </span>
                      <UserCheck className="w-3.5 h-3.5 text-zinc-500 group-hover:text-yellow-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
};
