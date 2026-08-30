import { User, UserRole } from '../types';
import { INITIAL_USERS, BCF_TEAMS } from './storage';
import { loginWithAuth0Popup, logoutAuth0 } from './auth0Service';

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
 * Sign in using Auth0 Universal Login / Popup
 */
export async function loginWithGooglePopup(): Promise<User> {
  return await loginWithAuth0Popup();
}

/**
 * Sign out
 */
export async function logoutFirebaseAuth(): Promise<void> {
  await logoutAuth0();
}
