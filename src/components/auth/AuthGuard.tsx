import React, { useEffect, useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useApp } from '../../context/AppContext';
import { LoginCard } from './LoginCard';
import { ShaderBackground } from '../shared/ShaderBackground';
import { GlassPanel } from '../shared/GlassPanel';
import { Loader2, ShieldAlert, LogOut } from 'lucide-react';
import { syncAuth0UserToApp } from '../../lib/auth0Service';
import { isEmailAllowedToLogin } from '../../lib/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const {
    isAuthenticated,
    isLoading: isAuth0Loading,
    user: auth0User,
    logout,
  } = useAuth0();

  const { currentUser, setUserDirectly } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const lastSyncedEmailRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthSync() {
      if (!isAuthenticated || !auth0User) return;
      const email = (auth0User.email || '').trim().toLowerCase();
      if (!email) return;

      // Avoid re-syncing if already synced for this exact email
      if (lastSyncedEmailRef.current === email && currentUser?.email?.toLowerCase() === email) {
        return;
      }

      // Verify company domain
      if (!isEmailAllowedToLogin(email)) {
        if (isMounted) {
          setDomainError(
            `Access Denied: ${email} is not authorized. Only accounts with the @bcflights.com domain (or developer adhambadraan@gmail.com) are allowed to access the sales floor.`
          );
          setIsSyncing(false);
        }
        return;
      }

      if (isMounted) {
        setDomainError(null);
        setIsSyncing(true);
      }

      try {
        const syncedUser = await syncAuth0UserToApp(auth0User);
        if (isMounted) {
          lastSyncedEmailRef.current = email;
          setUserDirectly(syncedUser);
        }
      } catch (err: any) {
        console.error('Error syncing Auth0 user:', err);
        if (isMounted) {
          setDomainError(err?.message || 'Failed to authorize user session.');
        }
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    }

    handleAuthSync();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, auth0User?.email, currentUser?.email]);

  // If user already has a valid authorized session in context/localStorage, let them access the app immediately
  const hasValidUserSession = Boolean(
    currentUser && isEmailAllowedToLogin(currentUser.email)
  );

  // Domain access violation (e.g. non-company email signed in)
  if (domainError) {
    return (
      <div className="relative min-h-screen w-full bg-black text-white select-none flex items-center justify-center p-4">
        <ShaderBackground />
        <GlassPanel
          material="thick"
          concentricRadius="2xl"
          className="w-full max-w-md p-8 text-center space-y-6 border border-red-500/40 shadow-[0_0_80px_rgba(255,0,60,0.3)] relative z-10"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-orbitron font-black text-xl text-red-400">
              Access Restricted
            </h2>
            <p className="text-xs text-zinc-300 font-inter leading-relaxed">
              {domainError}
            </p>
          </div>

          <button
            onClick={() => {
              setDomainError(null);
              logout({ logoutParams: { returnTo: window.location.origin } });
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Switch Account</span>
          </button>
        </GlassPanel>
      </div>
    );
  }

  // If we have an active authorized user session, render the app
  if (hasValidUserSession) {
    return <>{children}</>;
  }

  // Auth0 is initializing token only when there is NO user session yet
  if ((isAuth0Loading || isSyncing) && !hasValidUserSession) {
    return (
      <div className="relative min-h-screen w-full bg-black text-white select-none flex items-center justify-center p-4">
        <ShaderBackground />
        <GlassPanel
          material="thick"
          concentricRadius="2xl"
          className="w-full max-w-sm p-8 text-center space-y-4 border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.9)] relative z-10"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl p-2 bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.2)]">
            <img
              src="/logo.png"
              alt="Time Management Logo"
              className="object-contain w-full h-full filter drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]"
            />
          </div>
          <div className="flex items-center justify-center gap-2.5 text-yellow-400 font-orbitron font-bold text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying Enterprise Session...</span>
          </div>
          <p className="text-xs text-zinc-400 font-inter">
            Connecting to Auth0 Single Page Application provider...
          </p>
        </GlassPanel>
      </div>
    );
  }

  // Not authenticated: render LoginCard
  return (
    <div className="relative min-h-screen w-full bg-black text-white select-none">
      <ShaderBackground />
      <LoginCard />
    </div>
  );
};

