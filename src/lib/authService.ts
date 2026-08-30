import { User, UserRole } from '../types';
import { INITIAL_USERS, BCF_TEAMS } from './storage';
import { loginWithAuth0Popup, logoutAuth0, getAuth0Config } from './auth0Service';
import { auth, googleProvider, signInWithPopup } from './firebase';
import { firestoreSaveUser } from './neonDb';

// Domain security validation: Only name@bcflights.com allowed, plus adhambadraan@gmail.com for developer access
export function isEmailAllowedToLogin(email: string): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  // Allowed domain is @bcflights.com, with adhambadraan@gmail.com as the only external developer email
  return (
    lower.endsWith('@bcflights.com') ||
    lower === 'adhambadraan@gmail.com' ||
    lower === 'adhambadrun@gmail.com' ||
    lower === 'adhambadran@bcflights.com' ||
    lower === 'adham@bcflights.com'
  );
}

// Helper to determine role from email or defaults with automatic supervisor & agent binding to BCF_TEAMS
export function determineRoleForEmail(email: string): { role: UserRole; teamId: string; name?: string } {
  const lower = email.toLowerCase().trim();
  // Developer override: adhambadraan@gmail.com / adhambadrun@gmail.com is granted Full Developer God Mode access
  if (
    lower === 'adhambadraan@gmail.com' ||
    lower === 'adhambadrun@gmail.com' ||
    lower === 'adham@bcflights.com' ||
    lower === 'adhambadran@bcflights.com'
  ) {
    return { role: 'developer', teamId: 'cai-1', name: 'Adham Badraan' };
  }

  // Executive Admins
  if (lower === 'meredith@bcflights.com' || lower.includes('meredith')) {
    return { role: 'admin', teamId: 'cai-1', name: 'Meredith Devereux' };
  }
  if (lower === 'atlas@bcflights.com' || lower.includes('atlas')) {
    return { role: 'admin', teamId: 'cai-1', name: 'Atlas Mavridis' };
  }

  // 1. Instant Supervisor Binding against BCF_TEAMS
  const supTeam = BCF_TEAMS.find(
    (t) => t.supervisor.email.toLowerCase() === lower
  );
  if (supTeam) {
    return {
      role: 'supervisor',
      teamId: supTeam.teamId,
      name: supTeam.supervisor.name,
    };
  }

  // 2. Instant Agent Binding against BCF_TEAMS
  for (const team of BCF_TEAMS) {
    const matchedAgent = team.agents.find(
      (a) => a.email.toLowerCase() === lower
    );
    if (matchedAgent) {
      return {
        role: (matchedAgent.role === 'Independent Agent' ? 'independent' : 'agent') as UserRole,
        teamId: team.teamId,
        name: matchedAgent.name,
      };
    }
  }

  // Check if matches any existing seeded user
  const seeded = INITIAL_USERS.find((u) => u.email.toLowerCase() === lower);
  if (seeded) {
    return { role: seeded.role, teamId: seeded.teamId, name: seeded.name };
  }

  // Default fallback
  return { role: 'agent', teamId: 'cai-2' };
}

/**
 * Sign in using Auth0 Universal Login / Popup or Firebase Google OAuth
 */
export async function loginWithGooglePopup(): Promise<User> {
  const auth0Conf = getAuth0Config();
  if (auth0Conf.domain && auth0Conf.clientId) {
    return await loginWithAuth0Popup();
  }

  // Direct Firebase Google Popup fallback
  const cred = await signInWithPopup(auth, googleProvider);
  const fbUser = cred.user;
  const email = fbUser.email || '';
  if (!isEmailAllowedToLogin(email)) {
    throw new Error(`Access restricted: ${email} is not authorized. Only @bcflights.com emails can access the floor.`);
  }

  let googlePhoto = fbUser.photoURL;
  if (googlePhoto && typeof googlePhoto === 'string') {
    if (googlePhoto.includes('googleusercontent.com')) {
      googlePhoto = googlePhoto.replace(/=s\d+(-c)?/, '=s384-c');
    }
  }

  const meta = determineRoleForEmail(email);
  const seeded = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  const resolvedAvatar =
    googlePhoto ||
    seeded?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

  const userObj: User = {
    id: fbUser.uid || `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name: fbUser.displayName || meta.name || seeded?.name || email.split('@')[0],
    email: email,
    role: meta.role || seeded?.role || 'agent',
    teamId: meta.teamId || seeded?.teamId || 'cai-2',
    avatarUrl: resolvedAvatar,
    personalMotto: seeded?.personalMotto || 'Sales Floor Champion 🚀',
    powerEmoji: seeded?.powerEmoji || '⚡',
    podColorTheme: seeded?.podColorTheme || '#00E5FF',
    preferredLanguage: 'en',
    themeMode: 'dark',
    notificationsEnabled: true,
    soundEnabled: true,
    reducedMotion: false,
    reducedTransparency: false,
    fontSize: 'md',
    isOnline: true,
    isBlocked: false,
    lastSeen: new Date().toISOString(),
    totalBreaksTaken: seeded?.totalBreaksTaken ?? 0,
    totalBreakTime: seeded?.totalBreakTime ?? 0,
    totalWarnings: seeded?.totalWarnings ?? 0,
    totalBonusReceived: seeded?.totalBonusReceived ?? 0,
    currentStreak: seeded?.currentStreak ?? 1,
    longestStreak: seeded?.longestStreak ?? 5,
  };

  // Sync to Neon PostgreSQL and Firestore
  try {
    await firestoreSaveUser(userObj);
  } catch (err) {
    console.warn('Error persisting user avatar to database:', err);
  }

  return userObj;
}

/**
 * Sign out
 */
export async function logoutFirebaseAuth(): Promise<void> {
  await logoutAuth0();
}
