import React, { useEffect, useState } from 'react';
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
    loginWithRedirect,
  } = useAuth0();

  const { currentUser, setUserDirectly } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthSync() {
      if (isAuthenticated && auth0User) {
        const email = auth0User.email || '';

        // Verify company domain
        if (!isEmailAllowedToLogin(email)) {
          setDomainError(
            `Access Denied: ${email} is not authorized. Only accounts with the @bcflights.com domain are allowed.`
          );
          return;
        }

        setDomainError(null);
        setIsSyncing(true);

        try {
          const syncedUser = await syncAuth0UserToApp(auth0User);
          if (isMounted) {
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
    }

    handleAuthSync();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, auth0User, setUserDirectly]);

  // Auth0 is initializing or token is refreshing
  if (isAuth0Loading || isSyncing) {
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
              alt="BCF Logo"
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
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Switch Account</span>
          </button>
        </GlassPanel>
      </div>
    );
  }

  // Not authenticated: render LoginCard
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="relative min-h-screen w-full bg-black text-white select-none">
        <ShaderBackground />
        <LoginCard />
      </div>
    );
  }

  // Authenticated and authorized: render protected floor view
  return <>{children}</>;
};
