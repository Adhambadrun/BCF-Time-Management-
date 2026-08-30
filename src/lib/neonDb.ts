import {
  User,
  Team,
  BreakRecord,
  WCTracking,
  Warning,
  SNNHeadline,
  ShiftConfig,
  Broadcast,
  ActivityLogExport,
  BatchActionType,
} from '../types';
import {
  generateCanonicalRosterUsers,
  generateCanonicalRosterTeams,
} from '../constants/bcfRoster';

type Listener<T> = (data: T) => void;

interface NeonDbState {
  users: User[];
  teams: Team[];
  breaks: BreakRecord[];
  wcTracking: Record<string, WCTracking>;
  warnings: Warning[];
  headlines: SNNHeadline[];
  broadcasts: Broadcast[];
  config: ShiftConfig | null;
  dailyLogs: ActivityLogExport[];
}

// In-memory state cache seeded with canonical roster defaults
let stateCache: NeonDbState = {
  users: generateCanonicalRosterUsers(),
  teams: generateCanonicalRosterTeams(),
  breaks: [],
  wcTracking: {},
  warnings: [],
  headlines: [],
  broadcasts: [],
  config: null,
  dailyLogs: [],
};

// Subscriber Registries
const userListeners = new Set<Listener<User[]>>();
const teamListeners = new Set<Listener<Team[]>>();
const breakListeners = new Set<Listener<BreakRecord[]>>();
const wcListeners = new Set<Listener<Record<string, WCTracking>>>();
const warningListeners = new Set<Listener<Warning[]>>();
const headlineListeners = new Set<Listener<SNNHeadline[]>>();
const broadcastListeners = new Set<Listener<Broadcast[]>>();
const configListeners = new Set<Listener<ShiftConfig>>();
const dailyLogListeners = new Set<Listener<ActivityLogExport[]>>();

let pollTimer: any = null;
let isPolling = false;

// Notify helper
function notifySubscribers() {
  if (stateCache.users.length > 0) {
    userListeners.forEach((fn) => fn(stateCache.users));
  }
  if (stateCache.teams.length > 0) {
    teamListeners.forEach((fn) => fn(stateCache.teams));
  }
  if (stateCache.breaks.length >= 0) {
    breakListeners.forEach((fn) => fn(stateCache.breaks));
  }
  if (Object.keys(stateCache.wcTracking).length > 0) {
    wcListeners.forEach((fn) => fn(stateCache.wcTracking));
  }
  if (stateCache.headlines.length > 0) {
    headlineListeners.forEach((fn) => fn(stateCache.headlines));
  }
  if (stateCache.broadcasts.length > 0) {
    broadcastListeners.forEach((fn) => fn(stateCache.broadcasts));
  }
  if (stateCache.config) {
    configListeners.forEach((fn) => fn(stateCache.config!));
  }
  if (stateCache.dailyLogs.length > 0) {
    dailyLogListeners.forEach((fn) => fn(stateCache.dailyLogs));
  }
}

// Fetch Full State from Neon API
export async function fetchNeonState(): Promise<NeonDbState | null> {
  try {
    const res = await fetch('/api/db');
    if (!res.ok) {
      // Fallback try /api/db/state
      const res2 = await fetch('/api/db/state');
      if (!res2.ok) return null;
      const data = await res2.json();
      return updateCache(data);
    }
    const data = await res.json();
    return updateCache(data);
  } catch (err) {
    // Silent fail in dev or offline mode
    return null;
  }
}

export async function getNeonState(): Promise<NeonDbState> {
  const state = await fetchNeonState();
  return state || stateCache;
}

function updateCache(data: any): NeonDbState {
  if (!data) return stateCache;

  if (Array.isArray(data.users) && data.users.length > 0) {
    stateCache.users = data.users;
  }
  if (Array.isArray(data.teams) && data.teams.length > 0) {
    stateCache.teams = data.teams;
  }
  if (Array.isArray(data.breaks)) {
    stateCache.breaks = data.breaks;
  }
  if (data.wcTracking && typeof data.wcTracking === 'object') {
    stateCache.wcTracking = data.wcTracking;
  }
  if (Array.isArray(data.warnings)) {
    stateCache.warnings = data.warnings;
  }
  if (Array.isArray(data.headlines) && data.headlines.length > 0) {
    stateCache.headlines = data.headlines;
  }
  if (Array.isArray(data.broadcasts)) {
    stateCache.broadcasts = data.broadcasts;
  }
  if (data.config && typeof data.config === 'object') {
    stateCache.config = data.config;
  }
  if (Array.isArray(data.dailyLogs)) {
    stateCache.dailyLogs = data.dailyLogs;
  }

  notifySubscribers();
  return stateCache;
}

// Start polling Neon API
function ensurePolling() {
  if (pollTimer) return;
  fetchNeonState();

  pollTimer = setInterval(async () => {
    if (typeof document !== 'undefined' && document.hidden) {
      return; // Skip poll when tab is in background to save bandwidth
    }
    if (isPolling) return;
    isPolling = true;
    try {
      await fetchNeonState();
    } finally {
      isPolling = false;
    }
  }, 2500);

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      fetchNeonState();
    });
  }
}

// Helper to POST to Neon
async function postNeon(action: string, payload: any) {
  try {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch (err) {
    console.warn('Neon DB POST warning:', err);
  }
}

// ----------------------------------------------------
// Realtime Subscriptions (Compatible with Firestore API)
// ----------------------------------------------------
export function subscribeToFirestoreTeams(callback: (teams: Team[]) => void) {
  teamListeners.add(callback);
  callback(stateCache.teams.length > 0 ? stateCache.teams : generateCanonicalRosterTeams());
  ensurePolling();
  return () => {
    teamListeners.delete(callback);
  };
}

export function subscribeToFirestoreUsers(callback: (users: User[]) => void) {
  userListeners.add(callback);
  callback(stateCache.users.length > 0 ? stateCache.users : generateCanonicalRosterUsers());
  ensurePolling();
  return () => {
    userListeners.delete(callback);
  };
}

export function subscribeToFirestoreBreaks(callback: (breaks: BreakRecord[]) => void) {
  breakListeners.add(callback);
  if (stateCache.breaks.length >= 0) callback(stateCache.breaks);
  ensurePolling();
  return () => {
    breakListeners.delete(callback);
  };
}

export function subscribeToFirestoreWCTracking(callback: (tracking: Record<string, WCTracking>) => void) {
  wcListeners.add(callback);
  if (Object.keys(stateCache.wcTracking).length > 0) callback(stateCache.wcTracking);
  ensurePolling();
  return () => {
    wcListeners.delete(callback);
  };
}

export function subscribeToFirestoreHeadlines(callback: (headlines: SNNHeadline[]) => void) {
  headlineListeners.add(callback);
  if (stateCache.headlines.length > 0) callback(stateCache.headlines);
  ensurePolling();
  return () => {
    headlineListeners.delete(callback);
  };
}

export function subscribeToFirestoreBroadcasts(callback: (broadcasts: Broadcast[]) => void) {
  broadcastListeners.add(callback);
  if (stateCache.broadcasts.length > 0) callback(stateCache.broadcasts);
  ensurePolling();
  return () => {
    broadcastListeners.delete(callback);
  };
}

export function subscribeToFirestoreConfig(callback: (config: ShiftConfig) => void) {
  configListeners.add(callback);
  if (stateCache.config) callback(stateCache.config);
  ensurePolling();
  return () => {
    configListeners.delete(callback);
  };
}

export function subscribeToFirestoreDailyLogs(callback: (logs: ActivityLogExport[]) => void) {
  dailyLogListeners.add(callback);
  if (stateCache.dailyLogs.length > 0) callback(stateCache.dailyLogs);
  ensurePolling();
  return () => {
    dailyLogListeners.delete(callback);
  };
}

// ----------------------------------------------------
// Writers to Neon PostgreSQL
// ----------------------------------------------------
export async function firestoreSaveBreak(breakRecord: BreakRecord) {
  // Optimistic update
  const idx = stateCache.breaks.findIndex((b) => b.breakId === breakRecord.breakId);
  if (idx >= 0) {
    stateCache.breaks[idx] = breakRecord;
  } else {
    stateCache.breaks.unshift(breakRecord);
  }
  breakListeners.forEach((fn) => fn(stateCache.breaks));

  await postNeon('save', { type: 'break', data: breakRecord });
}

export async function firestoreSaveWCTracking(tracking: WCTracking) {
  stateCache.wcTracking[tracking.agentEmail] = tracking;
  wcListeners.forEach((fn) => fn({ ...stateCache.wcTracking }));

  await postNeon('save', { type: 'wcTracking', data: tracking });
}

export async function firestoreSaveWarning(warning: Warning) {
  stateCache.warnings.unshift(warning);
  warningListeners.forEach((fn) => fn(stateCache.warnings));

  await postNeon('save', { type: 'warning', data: warning });
}

export async function firestoreSaveHeadline(headline: SNNHeadline) {
  stateCache.headlines.unshift(headline);
  headlineListeners.forEach((fn) => fn(stateCache.headlines));

  await postNeon('save', { type: 'headline', data: headline });
}

export async function firestoreSaveConfig(config: ShiftConfig) {
  stateCache.config = config;
  configListeners.forEach((fn) => fn(config));

  await postNeon('save', { type: 'config', data: config });
}

export async function firestoreSaveBroadcast(broadcast: Broadcast) {
  stateCache.broadcasts.unshift(broadcast);
  broadcastListeners.forEach((fn) => fn(stateCache.broadcasts));

  await postNeon('save', { type: 'broadcast', data: broadcast });
}

export async function firestoreSaveTeam(team: Team) {
  const idx = stateCache.teams.findIndex((t) => t.teamId === team.teamId);
  if (idx >= 0) {
    stateCache.teams[idx] = team;
  } else {
    stateCache.teams.push(team);
  }
  teamListeners.forEach((fn) => fn(stateCache.teams));

  await postNeon('save', { type: 'team', data: team });
}

export async function firestoreDeleteTeam(teamId: string) {
  stateCache.teams = stateCache.teams.filter((t) => t.teamId !== teamId);
  teamListeners.forEach((fn) => fn(stateCache.teams));

  await postNeon('delete', { type: 'team', id: teamId });
}

export async function firestoreDeleteUser(email: string) {
  stateCache.users = stateCache.users.filter(
    (u) => u.email.toLowerCase() !== email.toLowerCase() && u.id !== email
  );
  userListeners.forEach((fn) => fn(stateCache.users));

  await postNeon('delete', { type: 'user', id: email });
}

export async function firestoreSaveUser(user: User) {
  const idx = stateCache.users.findIndex(
    (u) => u.email.toLowerCase() === user.email.toLowerCase() || u.id === user.id
  );
  if (idx >= 0) {
    stateCache.users[idx] = user;
  } else {
    stateCache.users.push(user);
  }
  userListeners.forEach((fn) => fn(stateCache.users));

  await postNeon('save', { type: 'user', data: user });
}

export async function firestoreHeartbeat(email: string) {
  const user = stateCache.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    user.isOnline = true;
    user.lastSeen = 'Now';
    userListeners.forEach((fn) => fn(stateCache.users));
  }
  await postNeon('heartbeat', { email });
}

export async function firestoreSaveDailyLog(log: ActivityLogExport) {
  stateCache.dailyLogs.unshift(log);
  dailyLogListeners.forEach((fn) => fn(stateCache.dailyLogs));

  await postNeon('save', { type: 'dailyLog', data: log });
}

// Supervisor Batch Action
export async function executeFirestoreBatchAction(
  action: BatchActionType,
  selectedAgentEmails: string[],
  activeBreaks: BreakRecord[],
  users: User[],
  options?: {
    forcedBy?: string;
    warningNote?: string;
    warningReason?: string;
  }
): Promise<{ success: boolean; error?: any }> {
  try {
    await postNeon('batch', {
      batchAction: action,
      selectedAgentEmails,
      options,
    });
    // Trigger immediate refresh from server
    await fetchNeonState();
    return { success: true };
  } catch (err) {
    console.error('Batch action error:', err);
    return { success: false, error: err };
  }
}

// Team Break Lockdown
export async function executeFirestoreTeamBreakLock(
  teamId: string,
  block: boolean,
  teamAgents: User[],
  activeBreaks: BreakRecord[],
  options?: { forcedBy?: string }
): Promise<{ success: boolean; error?: any }> {
  try {
    await postNeon('team-lock', {
      teamId,
      block,
      options,
    });
    await fetchNeonState();
    return { success: true };
  } catch (err) {
    console.error('Team lock error:', err);
    return { success: false, error: err };
  }
}

// Clean helper (no-op in Neon, preserved for backwards compatibility)
export function cleanForFirestore<T>(data: T): T {
  return data;
}
