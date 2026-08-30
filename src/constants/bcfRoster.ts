export interface BCFRosterAgent {
  name: string;
  displayName: string;
  email: string;
  role: string;
}

export interface BCFRosterTeam {
  teamId: string;
  teamName: string;
  supervisor: {
    name: string;
    email: string;
  };
  agents: BCFRosterAgent[];
}

export const BCF_TEAMS: BCFRosterTeam[] = [
  {
    teamId: "cai-1",
    teamName: "CAI 1",
    supervisor: { name: "Dominick Grant", email: "dominick@bcflights.com" },
    agents: [
      { name: "Dominick Grant", displayName: "Dominick", email: "dominick@bcflights.com", role: "Independent Agent" }
    ]
  },
  {
    teamId: "cai-2",
    teamName: "CAI 2",
    supervisor: { name: "Jay Morgan", email: "jay@bcflights.com" },
    agents: [
      { name: "Thomas Miller", displayName: "Thomas", email: "thomas@bcflights.com", role: "Agent" },
      { name: "Lamar Garcia", displayName: "Lamar", email: "lamar@bcflights.com", role: "Agent" },
      { name: "Leo Vento", displayName: "Leo", email: "leo@bcflights.com", role: "Agent" },
      { name: "Wesley Navarro", displayName: "Wesley", email: "wesley@bcflights.com", role: "Agent" },
      { name: "Eric Williams", displayName: "Eric", email: "eric@bcflights.com", role: "Agent" },
      { name: "Solomon Morris", displayName: "Solomon", email: "solomon@bcflights.com", role: "Agent" },
      { name: "Fabiola Evans", displayName: "Fabiola", email: "fabiola@bcflights.com", role: "Agent" },
      { name: "Shay Lopez", displayName: "Shay", email: "shay@bcflights.com", role: "Agent" },
      { name: "Ilaya Rosewood", displayName: "Ilaya", email: "ilaya@bcflights.com", role: "Agent" },
      { name: "Brodie Fisher", displayName: "Brodie", email: "brodie@bcflights.com", role: "Agent" },
      { name: "Salma Wilson", displayName: "Salma", email: "salma@bcflights.com", role: "Agent" }
    ]
  },
  {
    teamId: "cai-3",
    teamName: "CAI 3",
    supervisor: { name: "Albert Cooper", email: "albert@bcflights.com" },
    agents: [
      { name: "Avery Parker", displayName: "Avery", email: "avery@bcflights.com", role: "Agent" },
      { name: "Morgan Stein", displayName: "Morgan", email: "morgan@bcflights.com", role: "Agent" },
      { name: "Emma Quinn", displayName: "Emma", email: "emma@bcflights.com", role: "Agent" },
      { name: "Luka Ricci", displayName: "Luka", email: "luka@bcflights.com", role: "Agent" },
      { name: "Tyler Valente", displayName: "Tyler", email: "tyler@bcflights.com", role: "Agent" },
      { name: "Crosby Zaki", displayName: "Crosby", email: "crosby@bcflights.com", role: "Agent" },
      { name: "Oscar Reed", displayName: "Oscar", email: "oscar@bcflights.com", role: "Agent" },
      { name: "Jordan Glassman", displayName: "Jordan", email: "jordan@bcflights.com", role: "Agent" },
      { name: "Cillian O'connor", displayName: "Cillian", email: "cillian@bcflights.com", role: "Agent" },
      { name: "Joe Green", displayName: "Joe", email: "joe@bcflights.com", role: "Agent" }
    ]
  },
  {
    teamId: "cai-4",
    teamName: "CAI 4",
    supervisor: { name: "Watkins West", email: "watkins@bcflights.com" },
    agents: [
      { name: "Alexander Fleming", displayName: "Alexander", email: "alexander@bcflights.com", role: "Agent" },
      { name: "Tony Carter", displayName: "Tony", email: "tony@bcflights.com", role: "Agent" },
      { name: "Jason Owen", displayName: "Jason", email: "jason@bcflights.com", role: "Agent" },
      { name: "Forbes Whitlock", displayName: "Forbes", email: "forbes@bcflights.com", role: "Agent" },
      { name: "Scott Daskin", displayName: "Scott", email: "scott@bcflights.com", role: "Agent" },
      { name: "Rufus Kennett", displayName: "Rufus", email: "rufus@bcflights.com", role: "Agent" },
      { name: "Jacob Adams", displayName: "Jacob", email: "jacob@bcflights.com", role: "Agent" },
      { name: "Noah Hayes", displayName: "Noah", email: "noah@bcflights.com", role: "Agent" },
      { name: "Henry Bennet", displayName: "Henry", email: "henry@bcflights.com", role: "Agent" },
      { name: "William Jackson", displayName: "William", email: "william@bcflights.com", role: "Agent" },
      { name: "Max Evans", displayName: "Max", email: "max@bcflights.com", role: "Agent" }
    ]
  },
  {
    teamId: "cai-5",
    teamName: "CAI 5",
    supervisor: { name: "Amir Malik", email: "amir@bcflights.com" },
    agents: [
      { name: "Zane Wilson", displayName: "Zane", email: "zane@bcflights.com", role: "Agent" },
      { name: "Avicci Cade", displayName: "Avicci", email: "avicci@bcflights.com", role: "Agent" },
      { name: "Lorraine Harper", displayName: "Lorraine", email: "lorraine@bcflights.com", role: "Agent" },
      { name: "Vella Watson", displayName: "Vella", email: "vella@bcflights.com", role: "Agent" },
      { name: "Miller Smith", displayName: "Miller", email: "miller@bcflights.com", role: "Agent" },
      { name: "Adryana Noelle", displayName: "Adryana", email: "adryana@bcflights.com", role: "Agent" },
      { name: "Mccoy Sullivan", displayName: "Mccoy", email: "mccoy@bcflights.com", role: "Agent" }
    ]
  }
];

// Color and preset theme map
export const TEAM_ACCENTS: Record<string, { color: string; name: string }> = {
  'cai-1': { color: '#FFD700', name: 'CAI 1' },
  'cai-2': { color: '#00E5FF', name: 'CAI 2' },
  'cai-3': { color: '#FF003C', name: 'CAI 3' },
  'cai-4': { color: '#8338EC', name: 'CAI 4' },
  'cai-5': { color: '#FF8800', name: 'CAI 5' },
};

// Preset Avatars
const AVATARS: Record<string, string> = {
  'dominick@bcflights.com': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'jay@bcflights.com': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'albert@bcflights.com': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'watkins@bcflights.com': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'amir@bcflights.com': 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
  'adhambadraan@gmail.com': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'adham@bcflights.com': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'adhambadrun@gmail.com': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'meredith@bcflights.com': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'atlas@bcflights.com': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
};

const DEFAULT_AVATAR_POOL = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
];

const EMOJI_POOL = ['⚡', '💎', '🚀', '🔥', '💼', '🎯', '✨', '🏎️', '🌟', '🕶️', '🍕', '🛡️'];

export function getSupervisorTeam(email: string): BCFRosterTeam | undefined {
  if (!email) return undefined;
  const lower = email.trim().toLowerCase();
  return BCF_TEAMS.find(t => t.supervisor.email.toLowerCase() === lower);
}

export function getAgentTeam(email: string): BCFRosterTeam | undefined {
  if (!email) return undefined;
  const lower = email.trim().toLowerCase();
  return BCF_TEAMS.find(t =>
    t.supervisor.email.toLowerCase() === lower ||
    t.agents.some(a => a.email.toLowerCase() === lower)
  );
}

export function getTeamById(teamId: string): BCFRosterTeam | undefined {
  if (!teamId) return undefined;
  return BCF_TEAMS.find(t => t.teamId.toLowerCase() === teamId.toLowerCase());
}

export function isSupervisorEmail(email: string): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return BCF_TEAMS.some(t => t.supervisor.email.toLowerCase() === lower);
}

/**
 * Generate full User models for all agents and supervisors in BCF_TEAMS + Admins/Developers
 */
export function generateCanonicalRosterUsers(): any[] {
  const users: any[] = [];
  const addedEmails = new Set<string>();

  // 1. Developers
  const devAdham = {
    id: 'user_dev_adham',
    name: 'Adham Badraan',
    email: 'adhambadraan@gmail.com',
    role: 'developer',
    teamId: 'cai-1',
    avatarUrl: AVATARS['adhambadraan@gmail.com'],
    personalMotto: 'System Architect & God Mode Overseer ⚡',
    powerEmoji: '⚡',
    podColorTheme: '#FFD700',
    preferredLanguage: 'en',
    themeMode: 'dark',
    notificationsEnabled: true,
    soundEnabled: true,
    reducedMotion: false,
    reducedTransparency: false,
    fontSize: 'md',
    isOnline: true,
    lastSeen: 'Now',
    totalBreaksTaken: 12,
    totalBreakTime: 95,
    totalWarnings: 0,
    totalBonusReceived: 4,
    currentStreak: 45,
    longestStreak: 45,
  };
  users.push(devAdham);
  addedEmails.add(devAdham.email.toLowerCase());

  const devAdham2 = {
    ...devAdham,
    id: 'user_dev_adham_corp',
    email: 'adham@bcflights.com',
  };
  users.push(devAdham2);
  addedEmails.add(devAdham2.email.toLowerCase());

  const devAdham3 = {
    ...devAdham,
    id: 'user_dev_adhambadrun',
    email: 'adhambadrun@gmail.com',
  };
  users.push(devAdham3);
  addedEmails.add(devAdham3.email.toLowerCase());

  // 2. Executive Admins
  const adminMeredith = {
    id: 'user_admin_meredith',
    name: 'Meredith Devereux',
    email: 'meredith@bcflights.com',
    role: 'admin',
    teamId: 'cai-1',
    avatarUrl: AVATARS['meredith@bcflights.com'],
    personalMotto: 'Executive Leadership & Global Operations 👑',
    powerEmoji: '👑',
    preferredLanguage: 'en',
    themeMode: 'dark',
    notificationsEnabled: true,
    soundEnabled: true,
    reducedMotion: false,
    reducedTransparency: false,
    fontSize: 'md',
    isOnline: true,
    lastSeen: 'Now',
    totalBreaksTaken: 18,
    totalBreakTime: 160,
    totalWarnings: 0,
    totalBonusReceived: 6,
    currentStreak: 40,
    longestStreak: 40,
  };
  users.push(adminMeredith);
  addedEmails.add(adminMeredith.email.toLowerCase());

  const adminAtlas = {
    id: 'user_admin_atlas',
    name: 'Atlas Mavridis',
    email: 'atlas@bcflights.com',
    role: 'admin',
    teamId: 'cai-1',
    avatarUrl: AVATARS['atlas@bcflights.com'],
    personalMotto: 'Executive Precision & Floor Discipline 💎',
    powerEmoji: '💎',
    preferredLanguage: 'en',
    themeMode: 'dark',
    notificationsEnabled: true,
    soundEnabled: true,
    reducedMotion: false,
    reducedTransparency: false,
    fontSize: 'md',
    isOnline: true,
    lastSeen: 'Now',
    totalBreaksTaken: 20,
    totalBreakTime: 180,
    totalWarnings: 0,
    totalBonusReceived: 5,
    currentStreak: 38,
    longestStreak: 38,
  };
  users.push(adminAtlas);
  addedEmails.add(adminAtlas.email.toLowerCase());

  // 3. Supervisors and Agents for CAI 1 through CAI 5
  let avatarIdx = 0;
  let emojiIdx = 0;

  BCF_TEAMS.forEach((team) => {
    const teamAccent = TEAM_ACCENTS[team.teamId]?.color || '#00E5FF';

    // Supervisor
    const supEmail = team.supervisor.email.toLowerCase();
    if (!addedEmails.has(supEmail)) {
      const supUser = {
        id: `user_sup_${supEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: team.supervisor.name,
        email: team.supervisor.email,
        role: 'supervisor',
        teamId: team.teamId,
        avatarUrl: AVATARS[supEmail] || DEFAULT_AVATAR_POOL[avatarIdx % DEFAULT_AVATAR_POOL.length],
        personalMotto: `${team.teamName} Floor Command Lead ⚡`,
        powerEmoji: '⚡',
        podColorTheme: teamAccent,
        preferredLanguage: 'en',
        themeMode: 'dark',
        notificationsEnabled: true,
        soundEnabled: true,
        reducedMotion: false,
        reducedTransparency: false,
        fontSize: 'md',
        isOnline: true,
        lastSeen: 'Now',
        totalBreaksTaken: 25,
        totalBreakTime: 230,
        totalWarnings: 0,
        totalBonusReceived: 5,
        currentStreak: 20,
        longestStreak: 25,
      };
      users.push(supUser);
      addedEmails.add(supEmail);
      avatarIdx++;
    }

    // Agents
    team.agents.forEach((agent, idx) => {
      const agEmail = agent.email.toLowerCase();
      if (!addedEmails.has(agEmail)) {
        const isIndependent = agent.role.toLowerCase().includes('independent');
        const agUser = {
          id: `user_agent_${agEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: agent.name,
          email: agent.email,
          role: isIndependent ? 'independent' : 'agent',
          teamId: team.teamId,
          avatarUrl: AVATARS[agEmail] || DEFAULT_AVATAR_POOL[(avatarIdx + idx) % DEFAULT_AVATAR_POOL.length],
          personalMotto: `${team.teamName} High Performance Operative ✈️`,
          powerEmoji: EMOJI_POOL[(emojiIdx + idx) % EMOJI_POOL.length],
          podColorTheme: teamAccent,
          preferredLanguage: 'en',
          themeMode: 'dark',
          notificationsEnabled: true,
          soundEnabled: true,
          reducedMotion: false,
          reducedTransparency: false,
          fontSize: 'md',
          isOnline: true,
          status: 'FLOOR',
          lastSeen: 'Now',
          totalBreaksTaken: 24 + ((idx * 3) % 18),
          totalBreakTime: 220 + ((idx * 25) % 150),
          totalWarnings: 0,
          totalBonusReceived: 2 + (idx % 5),
          currentStreak: 10 + ((idx * 2) % 15),
          longestStreak: 15 + ((idx * 3) % 18),
        };
        users.push(agUser);
        addedEmails.add(agEmail);
      }
    });
    avatarIdx += 2;
    emojiIdx += 3;
  });

  return users;
}

/**
 * Generate full Team models for CAI 1 through CAI 5
 */
export function generateCanonicalRosterTeams(): any[] {
  return BCF_TEAMS.map((t) => ({
    teamId: t.teamId,
    teamName: t.teamName,
    teamLogo: '/logo.png',
    teamColorAccent: TEAM_ACCENTS[t.teamId]?.color || '#00E5FF',
    supervisorEmail: t.supervisor.email,
    defaultLanguage: 'en',
    agentCount: t.agents.length,
    competitionScore: 1500 - (parseInt(t.teamId.replace('cai-', '')) || 1) * 30,
    isActive: true,
  }));
}

/**
 * Resolves floor agent pods for a given team ID (or ALL teams)
 * Guaranteed to NEVER return empty if BCF_TEAMS has members for that team!
 */
export function resolveTeamAgents(teamId: string, liveUsers: any[] = []): any[] {
  const canonicalUsers = generateCanonicalRosterUsers();
  const isAll = !teamId || teamId.toUpperCase() === 'ALL' || teamId === 'all';

  if (isAll) {
    const liveAgents = (liveUsers || []).filter(
      (u) =>
        u.role === 'agent' ||
        u.role === 'independent' ||
        (u.teamId === 'cai-1' && u.email.toLowerCase() === 'dominick@bcflights.com')
    );

    if (liveAgents.length >= 35) {
      return liveAgents;
    }

    // Merge live + canonical
    const map = new Map<string, any>();
    canonicalUsers
      .filter((u) => u.role === 'agent' || u.role === 'independent')
      .forEach((u) => map.set(u.email.toLowerCase(), u));
    liveAgents.forEach((u) => map.set(u.email.toLowerCase(), { ...map.get(u.email.toLowerCase()), ...u }));

    return Array.from(map.values());
  }

  const targetTeamId = teamId.toLowerCase();
  const liveTeamAgents = (liveUsers || []).filter(
    (u) =>
      u.teamId?.toLowerCase() === targetTeamId &&
      (u.role === 'agent' ||
        u.role === 'independent' ||
        (targetTeamId === 'cai-1' && u.email.toLowerCase() === 'dominick@bcflights.com'))
  );

  const canonicalForTeam = canonicalUsers.filter(
    (u) =>
      u.teamId?.toLowerCase() === targetTeamId &&
      (u.role === 'agent' ||
        u.role === 'independent' ||
        (targetTeamId === 'cai-1' && u.email.toLowerCase() === 'dominick@bcflights.com'))
  );

  if (liveTeamAgents.length >= canonicalForTeam.length && canonicalForTeam.length > 0) {
    return liveTeamAgents;
  }

  // Merge live agents with fallback canonical roster so every pod renders
  const map = new Map<string, any>();
  canonicalForTeam.forEach((u) => map.set(u.email.toLowerCase(), u));
  liveTeamAgents.forEach((u) => map.set(u.email.toLowerCase(), { ...map.get(u.email.toLowerCase()), ...u }));

  return Array.from(map.values());
}


