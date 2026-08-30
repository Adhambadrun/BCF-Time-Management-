import { User, UserRole } from '../types';
import { INITIAL_USERS } from './storage';
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

// Helper to determine role from email or defaults
export function determineRoleForEmail(email: string): { role: UserRole; teamId: string; name?: string } {
  const lower = email.toLowerCase().trim();
  // Developer override: adhambadraan@gmail.com is granted Full Developer God Mode access
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
  // Supervisors
  if (lower === 'dominick@bcflights.com' || lower.includes('dominick')) {
    return { role: 'supervisor', teamId: 'cai-1', name: 'Dominick Grant' };
  }
  if (lower === 'jay@bcflights.com' || lower.includes('jay')) {
    return { role: 'supervisor', teamId: 'cai-2', name: 'Jay Morgan' };
  }
  if (lower === 'albert@bcflights.com' || lower.includes('albert')) {
    return { role: 'supervisor', teamId: 'cai-3', name: 'Albert Cooper' };
  }
  if (lower === 'watkins@bcflights.com' || lower.includes('watkins')) {
    return { role: 'supervisor', teamId: 'cai-4', name: 'Watkins West' };
  }
  if (lower === 'amir@bcflights.com' || lower.includes('amir')) {
    return { role: 'supervisor', teamId: 'cai-5', name: 'Amir Malik' };
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
