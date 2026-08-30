import { createAuth0Client, Auth0Client, User as Auth0User } from '@auth0/auth0-spa-js';
import { User } from '../types';
import { INITIAL_USERS } from './storage';
import { isEmailAllowedToLogin, determineRoleForEmail } from './authService';
import { firestoreSaveUser } from './neonDb';

let auth0ClientInstance: Auth0Client | null = null;

// Auth0 Configuration with Neon + Auth0 integration defaults
export function getAuth0Config() {
  const domain =
    import.meta.env.VITE_AUTH0_DOMAIN ||
    (typeof window !== 'undefined' && (window as any).__AUTH0_DOMAIN__) ||
    'icfg-5qgdjxyskxeyawhf3smwvjne.us.auth0.com';

  const clientId =
    import.meta.env.VITE_AUTH0_CLIENT_ID ||
    (typeof window !== 'undefined' && (window as any).__AUTH0_CLIENT_ID__) ||
    'XJS0prsHuy59Gxp15wG3sByvv8sYnyGv';

  const audience =
    import.meta.env.VITE_AUTH0_AUDIENCE ||
    (typeof window !== 'undefined' && (window as any).__AUTH0_AUDIENCE__) ||
    undefined;

  return { domain, clientId, audience };
}

/**
 * Initializes and returns the Auth0 client instance
 */
export async function getAuth0Client(): Promise<Auth0Client> {
  if (auth0ClientInstance) {
    return auth0ClientInstance;
  }

  const { domain, clientId, audience } = getAuth0Config();

  if (!domain || !clientId) {
    throw new Error(
      'Auth0 is not fully configured. Please ensure VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID are set in your environment.'
    );
  }

  const redirectUri = typeof window !== 'undefined' ? window.location.origin : 'https://bcflights.vercel.app';

  auth0ClientInstance = await createAuth0Client({
    domain,
    clientId,
    authorizationParams: {
      redirect_uri: redirectUri,
      audience: audience || undefined,
      scope: 'openid profile email',
    },
    useRefreshTokens: true,
    cacheLocation: 'localstorage',
  });

  return auth0ClientInstance;
}

/**
 * Converts an Auth0 profile into the BCF application User schema
 */
export async function syncAuth0UserToApp(auth0User: Auth0User): Promise<User> {
  const email = auth0User.email || '';

  // Enforce company domain access restriction (@bcflights.com and developer adhambadraan@gmail.com)
  if (!isEmailAllowedToLogin(email)) {
    try {
      const client = await getAuth0Client();
      await client.logout({ logoutParams: { returnTo: window.location.origin } });
    } catch {
      // ignore
    }
    throw new Error(
      `Access Denied: ${email} is not authorized. Only accounts with the @bcflights.com domain (or developer adhambadraan@gmail.com) are allowed to access the floor.`
    );
  }

  const userId = auth0User.sub || `auth0_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const meta = determineRoleForEmail(email);

  const seeded = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());

  const userObj: User = {
    id: userId,
    name: auth0User.name || meta.name || seeded?.name || email.split('@')[0],
    email: email,
    role: seeded?.role || meta.role,
    teamId: seeded?.teamId || meta.teamId,
    avatarUrl:
      auth0User.picture ||
      seeded?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    personalMotto: seeded?.personalMotto || 'Sales Floor Champion 🚀',
    powerEmoji: seeded?.powerEmoji || '⚡',
    podColorTheme: seeded?.podColorTheme || '#00E5FF',
    preferredLanguage: seeded?.preferredLanguage || 'en',
    themeMode: seeded?.themeMode || 'dark',
    notificationsEnabled: true,
    soundEnabled: true,
    reducedMotion: false,
    reducedTransparency: false,
    fontSize: 'md',
    isOnline: true,
    isBlocked: false,
    blockReason: undefined,
    lastSeen: new Date().toISOString(),
    totalBreaksTaken: seeded?.totalBreaksTaken ?? 0,
    totalBreakTime: seeded?.totalBreakTime ?? 0,
    totalWarnings: seeded?.totalWarnings ?? 0,
    totalBonusReceived: seeded?.totalBonusReceived ?? 0,
    currentStreak: seeded?.currentStreak ?? 1,
    longestStreak: seeded?.longestStreak ?? 5,
  };

  // Sync to Neon PostgreSQL for real-time presence and shift persistence
  try {
    await firestoreSaveUser(userObj);
  } catch (err) {
    console.warn('Neon save failed for Auth0 user:', err);
  }

  return userObj;
}

/**
 * Primary Auth0 login using popup
 */
export async function loginWithAuth0Popup(): Promise<User> {
  const client = await getAuth0Client();
  await client.loginWithPopup({
    authorizationParams: {
      prompt: 'select_account',
    },
  });

  const auth0User = await client.getUser();
  if (!auth0User || !auth0User.email) {
    throw new Error('Auth0 authentication completed, but no user profile or email was returned.');
  }

  return await syncAuth0UserToApp(auth0User);
}

/**
 * Alternative Auth0 login using full-page redirect
 */
export async function loginWithAuth0Redirect(): Promise<void> {
  const client = await getAuth0Client();
  await client.loginWithRedirect({
    authorizationParams: {
      prompt: 'select_account',
    },
  });
}

/**
 * Checks and handles redirect callback if returning from Auth0 Universal Login
 */
export async function handleAuth0RedirectCallback(): Promise<User | null> {
  if (typeof window === 'undefined') return null;

  const search = window.location.search;
  if (!search.includes('code=') || !search.includes('state=')) {
    return null;
  }

  try {
    const client = await getAuth0Client();
    await client.handleRedirectCallback();

    // Clean query parameters from URL
    window.history.replaceState({}, document.title, window.location.pathname);

    const auth0User = await client.getUser();
    if (auth0User) {
      return await syncAuth0UserToApp(auth0User);
    }
  } catch (err) {
    console.error('Error handling Auth0 redirect callback:', err);
    throw err;
  }

  return null;
}

/**
 * Auth0 Sign Out
 */
export async function logoutAuth0(): Promise<void> {
  if (!auth0ClientInstance) {
    const { domain, clientId } = getAuth0Config();
    if (!domain || !clientId) return;
    try {
      auth0ClientInstance = await getAuth0Client();
    } catch {
      return;
    }
  }

  try {
    await auth0ClientInstance.logout({
      logoutParams: {
        returnTo: typeof window !== 'undefined' ? window.location.origin : 'https://bcflights.vercel.app',
      },
    });
  } catch (err) {
    console.warn('Auth0 logout warning:', err);
  }
}
