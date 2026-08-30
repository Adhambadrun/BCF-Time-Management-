import { neon } from '@neondatabase/serverless';
import { INITIAL_USERS, INITIAL_TEAMS, INITIAL_CONFIG } from '../src/lib/storage';

// In-memory fallback store for offline/ephemeral operation
const memoryStore = {
  users: [...INITIAL_USERS],
  teams: [...INITIAL_TEAMS],
  breaks: [] as any[],
  wcTracking: {} as Record<string, any>,
  warnings: [] as any[],
  headlines: [] as any[],
  broadcasts: [] as any[],
  config: { ...INITIAL_CONFIG },
  dailyLogs: [] as any[],
};

export function getNeonSql() {
  // Check for various environment variable naming patterns (Neon, Vercel, standard PG)
  let connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString && process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD) {
    const host = process.env.PGHOST;
    const user = encodeURIComponent(process.env.PGUSER);
    const pass = encodeURIComponent(process.env.PGPASSWORD);
    const db = process.env.PGDATABASE || 'neondb';
    connectionString = `postgresql://${user}:${pass}@${host}/${db}?sslmode=require`;
  }

  if (!connectionString) {
    connectionString = 'postgresql://neondb_owner:npg_JY98zBEpKxQH@ep-mute-surf-aub8xth6-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require';
  }

  return neon(connectionString);
}

// 1. Initialize Tables (Idempotent)
export async function initNeonTables() {
  try {
    const sql = getNeonSql();
    await sql`
      CREATE TABLE IF NOT EXISTS bcf_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bcf_teams (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bcf_breaks (
        id TEXT PRIMARY KEY,
        agent_email TEXT NOT NULL,
        is_active BOOLEAN DEFAULT false,
        start_time BIGINT,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bcf_wc_tracking (
        agent_email TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bcf_warnings (
        id TEXT PRIMARY KEY,
        agent_email TEXT NOT NULL,
        status TEXT,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bcf_headlines (
        id TEXT PRIMARY KEY,
        timestamp BIGINT,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bcf_broadcasts (
        id TEXT PRIMARY KEY,
        sent_at BIGINT,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bcf_config (
        key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS bcf_daily_logs (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('✅ Neon PostgreSQL tables verified');
  } catch (err) {
    console.warn('Neon tables init warning (in-memory mode active):', err);
  }
}

// 2. Seed and Pre-Populate Initial Teams & Roster Pods
export async function seedNeonInitialData() {
  try {
    const sql = getNeonSql();
    console.log('⚡ Pre-populating and ensuring all teams (CAI 1-5) and pods exist in Neon PostgreSQL...');

    // Upsert all canonical teams (CAI 1, CAI 2, CAI 3, CAI 4, CAI 5)
    for (const team of INITIAL_TEAMS) {
      await sql`
        INSERT INTO bcf_teams (id, data, updated_at)
        VALUES (${team.teamId}, ${JSON.stringify(team)}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW()
      `;
    }

    // Upsert all canonical users, supervisors, and agents
    for (const user of INITIAL_USERS) {
      await sql`
        INSERT INTO bcf_users (id, email, data, updated_at)
        VALUES (${user.id}, ${user.email.toLowerCase()}, ${JSON.stringify(user)}, NOW())
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // Ensure config exists
    await sql`
      INSERT INTO bcf_config (key, data, updated_at)
      VALUES ('current_shift', ${JSON.stringify(INITIAL_CONFIG)}, NOW())
      ON CONFLICT (key) DO NOTHING
    `;

    console.log(`✅ Permanently synchronized ${INITIAL_TEAMS.length} teams and ${INITIAL_USERS.length} canonical roster users into Neon`);
  } catch (err) {
    console.warn('Neon pre-population notice (in-memory mode active):', err);
  }
}

// 3. Fetch Full Application State from Neon or Fallback
export async function getNeonState() {
  try {
    const sql = getNeonSql();
    const [users, teams, breaks, wcTracking, warnings, headlines, broadcasts, config, dailyLogs] =
      await Promise.all([
        sql`SELECT data FROM bcf_users ORDER BY (data->>'name') ASC`,
        sql`SELECT data FROM bcf_teams ORDER BY id ASC`,
        sql`SELECT data FROM bcf_breaks ORDER BY updated_at DESC LIMIT 500`,
        sql`SELECT agent_email, data FROM bcf_wc_tracking`,
        sql`SELECT data FROM bcf_warnings ORDER BY (data->>'issuedAt')::bigint DESC LIMIT 200`,
        sql`SELECT data FROM bcf_headlines ORDER BY (data->>'timestamp')::bigint DESC LIMIT 100`,
        sql`SELECT data FROM bcf_broadcasts ORDER BY (data->>'sentAt')::bigint DESC LIMIT 50`,
        sql`SELECT key, data FROM bcf_config`,
        sql`SELECT data FROM bcf_daily_logs ORDER BY updated_at DESC LIMIT 100`,
      ]);

    const wcMap: Record<string, any> = {};
    wcTracking.forEach((r: any) => {
      if (r.data && r.data.agentEmail) {
        wcMap[r.data.agentEmail] = r.data;
      }
    });

    const shiftConfig = config.find((r: any) => r.key === 'current_shift')?.data || INITIAL_CONFIG;

    const liveState = {
      users: users.map((r: any) => r.data),
      teams: teams.map((r: any) => r.data),
      breaks: breaks.map((r: any) => r.data),
      wcTracking: wcMap,
      warnings: warnings.map((r: any) => r.data),
      headlines: headlines.map((r: any) => r.data),
      broadcasts: broadcasts.map((r: any) => r.data),
      config: shiftConfig,
      dailyLogs: dailyLogs.map((r: any) => r.data),
    };

    // Keep memory store synced
    if (liveState.users.length > 0) memoryStore.users = liveState.users;
    if (liveState.teams.length > 0) memoryStore.teams = liveState.teams;
    memoryStore.breaks = liveState.breaks;
    memoryStore.wcTracking = liveState.wcTracking;
    memoryStore.warnings = liveState.warnings;
    if (liveState.headlines.length > 0) memoryStore.headlines = liveState.headlines;
    memoryStore.broadcasts = liveState.broadcasts;
    memoryStore.config = liveState.config;
    memoryStore.dailyLogs = liveState.dailyLogs;

    return liveState;
  } catch (err) {
    console.warn('Neon connection unavailable — serving from in-memory store:', err);
    return { ...memoryStore };
  }
}

// 4. Save Record to Neon or in-memory fallback
export async function saveNeonRecord(type: string, data: any) {
  // Update memoryStore optimistically
  switch (type) {
    case 'break': {
      const idx = memoryStore.breaks.findIndex((b: any) => b.breakId === data.breakId);
      if (idx >= 0) memoryStore.breaks[idx] = data;
      else memoryStore.breaks.unshift(data);
      break;
    }
    case 'user': {
      const idx = memoryStore.users.findIndex((u: any) => u.email.toLowerCase() === (data.email || '').toLowerCase() || u.id === data.id);
      if (idx >= 0) memoryStore.users[idx] = data;
      else memoryStore.users.push(data);
      break;
    }
    case 'team': {
      const idx = memoryStore.teams.findIndex((t: any) => t.teamId === data.teamId);
      if (idx >= 0) memoryStore.teams[idx] = data;
      else memoryStore.teams.push(data);
      break;
    }
    case 'wcTracking': {
      if (data.agentEmail) memoryStore.wcTracking[data.agentEmail] = data;
      break;
    }
    case 'warning': {
      memoryStore.warnings.unshift(data);
      break;
    }
    case 'headline': {
      memoryStore.headlines.unshift(data);
      break;
    }
    case 'broadcast': {
      memoryStore.broadcasts.unshift(data);
      break;
    }
    case 'config': {
      memoryStore.config = data;
      break;
    }
    case 'dailyLog': {
      memoryStore.dailyLogs.unshift(data);
      break;
    }
  }

  try {
    const sql = getNeonSql();
    const jsonStr = JSON.stringify(data);

    switch (type) {
      case 'break': {
        const id = data.breakId;
        const agentEmail = (data.agentEmail || '').toLowerCase();
        const isActive = !!data.isActive;
        const startTime = data.startTime || Date.now();
        await sql`
          INSERT INTO bcf_breaks (id, agent_email, is_active, start_time, data, updated_at)
          VALUES (${id}, ${agentEmail}, ${isActive}, ${startTime}, ${jsonStr}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            agent_email = ${agentEmail},
            is_active = ${isActive},
            start_time = ${startTime},
            data = ${jsonStr},
            updated_at = NOW()
        `;
        break;
      }
      case 'user': {
        const id = data.id || data.email;
        const email = (data.email || '').toLowerCase();
        await sql`
          INSERT INTO bcf_users (id, email, data, updated_at)
          VALUES (${id}, ${email}, ${jsonStr}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            email = ${email},
            data = ${jsonStr},
            updated_at = NOW()
        `;
        break;
      }
      case 'team': {
        const id = data.teamId;
        await sql`
          INSERT INTO bcf_teams (id, data, updated_at)
          VALUES (${id}, ${jsonStr}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            data = ${jsonStr},
            updated_at = NOW()
        `;
        break;
      }
      case 'wcTracking': {
        const agentEmail = (data.agentEmail || '').toLowerCase();
        await sql`
          INSERT INTO bcf_wc_tracking (agent_email, data, updated_at)
          VALUES (${agentEmail}, ${jsonStr}, NOW())
          ON CONFLICT (agent_email) DO UPDATE SET
            data = ${jsonStr},
            updated_at = NOW()
        `;
        break;
      }
      case 'warning': {
        const id = data.warningId;
        const agentEmail = (data.agentEmail || '').toLowerCase();
        const status = data.status || 'active';
        await sql`
          INSERT INTO bcf_warnings (id, agent_email, status, data, updated_at)
          VALUES (${id}, ${agentEmail}, ${status}, ${jsonStr}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            agent_email = ${agentEmail},
            status = ${status},
            data = ${jsonStr},
            updated_at = NOW()
        `;
        break;
      }
      case 'headline': {
        const id = data.headlineId;
        const timestamp = data.timestamp || Date.now();
        await sql`
          INSERT INTO bcf_headlines (id, timestamp, data, updated_at)
          VALUES (${id}, ${timestamp}, ${jsonStr}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            timestamp = ${timestamp},
            data = ${jsonStr},
            updated_at = NOW()
        `;
        break;
      }
      case 'broadcast': {
        const id = data.broadcastId;
        const sentAt = data.sentAt || Date.now();
        await sql`
          INSERT INTO bcf_broadcasts (id, sent_at, data, updated_at)
          VALUES (${id}, ${sentAt}, ${jsonStr}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            sent_at = ${sentAt},
            data = ${jsonStr},
            updated_at = NOW()
        `;
        break;
      }
      case 'config': {
        await sql`
          INSERT INTO bcf_config (key, data, updated_at)
          VALUES ('current_shift', ${jsonStr}, NOW())
          ON CONFLICT (key) DO UPDATE SET
            data = ${jsonStr},
            updated_at = NOW()
        `;
        break;
      }
      case 'dailyLog': {
        const id = data.logId;
        await sql`
          INSERT INTO bcf_daily_logs (id, data, updated_at)
          VALUES (${id}, ${jsonStr}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            data = ${jsonStr},
            updated_at = NOW()
        `;
        break;
      }
    }
  } catch (err) {
    console.warn('Neon save record fallback to memoryStore:', err);
  }

  return { success: true };
}

// 5. Delete Record from Neon
export async function deleteNeonRecord(type: string, id: string) {
  if (type === 'team') {
    memoryStore.teams = memoryStore.teams.filter((t: any) => t.teamId !== id);
  } else if (type === 'user') {
    memoryStore.users = memoryStore.users.filter((u: any) => u.id !== id && u.email.toLowerCase() !== id.toLowerCase());
  }

  try {
    const sql = getNeonSql();
    if (type === 'team') {
      await sql`DELETE FROM bcf_teams WHERE id = ${id}`;
    } else if (type === 'user') {
      await sql`DELETE FROM bcf_users WHERE id = ${id} OR email = ${id.toLowerCase()}`;
    }
  } catch (err) {
    console.warn('Neon delete record fallback to memoryStore:', err);
  }
  return { success: true };
}

// 6. User Heartbeat
export async function neonHeartbeat(email: string) {
  const user = memoryStore.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() || u.id === email);
  if (user) {
    user.isOnline = true;
    user.lastSeen = 'Now';
  }

  try {
    const sql = getNeonSql();
    const lowerEmail = email.toLowerCase();
    await sql`
      UPDATE bcf_users
      SET data = jsonb_set(
        jsonb_set(data, '{isOnline}', to_jsonb(true)),
        '{lastSeen}', to_jsonb('Now'::text)
      ),
      updated_at = NOW()
      WHERE email = ${lowerEmail} OR id = ${lowerEmail}
    `;
  } catch (err) {
    console.warn('Neon heartbeat fallback to memoryStore:', err);
  }
  return { success: true };
}

// 7. Batch Actions (Supervisor Deck)
export async function executeNeonBatchAction(
  action: string,
  selectedAgentEmails: string[],
  options?: {
    forcedBy?: string;
    warningNote?: string;
    warningReason?: string;
  }
) {
  const now = Date.now();
  const forcedBy = options?.forcedBy || 'SUPERVISOR';

  // Apply to memoryStore
  for (const rawEmail of selectedAgentEmails) {
    const email = rawEmail.toLowerCase();
    const user = memoryStore.users.find((u: any) => u.email.toLowerCase() === email || u.id === email);
    if (user) {
      if (action === 'RESET_FLOOR') {
        user.status = 'FLOOR';
        user.isBreakAllowed = true;
        user.isBlocked = false;
        user.blockReason = undefined;
      } else if (action === 'END_BREAK') {
        user.status = 'FLOOR';
        user.isBreakAllowed = true;
      } else if (action === 'HOLD') {
        user.status = 'HOLD';
        user.isBreakAllowed = false;
      } else if (action === 'BLOCK') {
        user.status = 'BLOCKED';
        user.isBreakAllowed = false;
        user.isBlocked = true;
      }
    }
    if (action === 'RESET_FLOOR' || action === 'END_BREAK' || action === 'BLOCK') {
      memoryStore.breaks.forEach((b: any) => {
        if (b.agentEmail?.toLowerCase() === email && b.isActive) {
          b.isActive = false;
          b.endTime = now;
          b.isForcedEnded = true;
          b.forcedEndBy = forcedBy;
        }
      });
    }
  }

  try {
    const sql = getNeonSql();
    for (const rawEmail of selectedAgentEmails) {
      const email = rawEmail.toLowerCase();

      if (action === 'RESET_FLOOR') {
        await sql`
          UPDATE bcf_users
          SET data = jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(data, '{status}', to_jsonb('FLOOR'::text)),
                '{isBreakAllowed}', to_jsonb(true)
              ),
              '{isBlocked}', to_jsonb(false)
            ),
            '{blockReason}', to_jsonb(null::text)
          ),
          updated_at = NOW()
          WHERE email = ${email} OR id = ${email}
        `;
        await sql`
          UPDATE bcf_breaks
          SET is_active = false,
              data = jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(data, '{isActive}', to_jsonb(false)),
                    '{endTime}', to_jsonb(${now}::bigint)
                  ),
                  '{isForcedEnded}', to_jsonb(true)
                ),
                '{forcedEndBy}', to_jsonb(${options?.forcedBy || 'END_OF_SHIFT_CLEANUP'}::text)
              ),
              updated_at = NOW()
          WHERE agent_email = ${email} AND is_active = true
        `;
      } else if (action === 'END_BREAK') {
        await sql`
          UPDATE bcf_users
          SET data = jsonb_set(
            jsonb_set(data, '{status}', to_jsonb('FLOOR'::text)),
            '{isBreakAllowed}', to_jsonb(true)
          ),
          updated_at = NOW()
          WHERE email = ${email} OR id = ${email}
        `;
        await sql`
          UPDATE bcf_breaks
          SET is_active = false,
              data = jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(data, '{isActive}', to_jsonb(false)),
                    '{endTime}', to_jsonb(${now}::bigint)
                  ),
                  '{isForcedEnded}', to_jsonb(true)
                ),
                '{forcedEndBy}', to_jsonb(${forcedBy}::text)
              ),
              updated_at = NOW()
          WHERE agent_email = ${email} AND is_active = true
        `;
      } else if (action === 'HOLD') {
        await sql`
          UPDATE bcf_users
          SET data = jsonb_set(
            jsonb_set(data, '{status}', to_jsonb('HOLD'::text)),
            '{isBreakAllowed}', to_jsonb(false)
          ),
          updated_at = NOW()
          WHERE email = ${email} OR id = ${email}
        `;
      } else if (action === 'BLOCK') {
        await sql`
          UPDATE bcf_users
          SET data = jsonb_set(
            jsonb_set(
              jsonb_set(data, '{status}', to_jsonb('BLOCKED'::text)),
              '{isBreakAllowed}', to_jsonb(false)
            ),
            '{isBlocked}', to_jsonb(true)
          ),
          updated_at = NOW()
          WHERE email = ${email} OR id = ${email}
        `;
        await sql`
          UPDATE bcf_breaks
          SET is_active = false,
              data = jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(data, '{isActive}', to_jsonb(false)),
                    '{endTime}', to_jsonb(${now}::bigint)
                  ),
                  '{isForcedEnded}', to_jsonb(true)
                ),
                '{forcedEndBy}', to_jsonb(${options?.forcedBy || 'SUPERVISOR_BATCH_BLOCK'}::text)
              ),
              updated_at = NOW()
          WHERE agent_email = ${email} AND is_active = true
        `;
      } else if (action === 'WARN') {
        const warnId = 'warn_batch_' + now + '_' + email.replace(/[^a-zA-Z0-9]/g, '_');
        const newWarn = {
          warningId: warnId,
          agentEmail: email,
          agentName: email,
          teamId: 'cai-1',
          level: 1,
          reason: options?.warningReason || 'Supervisor Batch Warning Issued',
          customNote: options?.warningNote || 'Batch action applied from Supervisor Deck',
          issuedBy: forcedBy,
          issuedByName: 'Supervisor',
          issuedAt: now,
          expiresAt: now + 3 * 24 * 60 * 60 * 1000,
          cleanShiftsCount: 0,
          requiredCleanShifts: 3,
          status: 'active',
          penalties: { maxBreakTime: 50, maxSlots: 4 },
        };
        await sql`
          INSERT INTO bcf_warnings (id, agent_email, status, data, updated_at)
          VALUES (${warnId}, ${email}, 'active', ${JSON.stringify(newWarn)}, NOW())
        `;
      }
    }
  } catch (err) {
    console.warn('Neon batch action fallback:', err);
  }

  return { success: true };
}

// 8. Team Break Lockdown
export async function executeNeonTeamBreakLock(
  teamId: string,
  block: boolean,
  options?: { forcedBy?: string }
) {
  const now = Date.now();
  const forcedBy = options?.forcedBy || 'SUPERVISOR';

  // Apply to memoryStore
  memoryStore.users.forEach((u: any) => {
    if (u.teamId === teamId) {
      if (block) {
        u.isBreakAllowed = false;
        u.isBlocked = true;
        u.status = 'BLOCKED';
      } else {
        u.isBreakAllowed = true;
        u.isBlocked = false;
        u.status = 'FLOOR';
      }
    }
  });

  try {
    const sql = getNeonSql();
    const agents = await sql`
      SELECT email FROM bcf_users WHERE (data->>'teamId') = ${teamId}
    `;

    for (const row of agents) {
      const email = row.email;
      if (block) {
        await sql`
          UPDATE bcf_users
          SET data = jsonb_set(
            jsonb_set(
              jsonb_set(data, '{isBreakAllowed}', to_jsonb(false)),
              '{isBlocked}', to_jsonb(true)
            ),
            '{status}', to_jsonb('BLOCKED'::text)
          ),
          updated_at = NOW()
          WHERE email = ${email}
        `;
        await sql`
          UPDATE bcf_breaks
          SET is_active = false,
              data = jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(data, '{isActive}', to_jsonb(false)),
                    '{endTime}', to_jsonb(${now}::bigint)
                  ),
                  '{isForcedEnded}', to_jsonb(true)
                ),
                '{forcedEndBy}', to_jsonb(${forcedBy}::text)
              ),
              updated_at = NOW()
          WHERE agent_email = ${email} AND is_active = true
        `;
      } else {
        await sql`
          UPDATE bcf_users
          SET data = jsonb_set(
            jsonb_set(
              jsonb_set(data, '{isBreakAllowed}', to_jsonb(true)),
              '{isBlocked}', to_jsonb(false)
            ),
            '{status}', to_jsonb('FLOOR'::text)
          ),
          updated_at = NOW()
          WHERE email = ${email}
        `;
      }
    }
  } catch (err) {
    console.warn('Neon team break lock fallback:', err);
  }

  return { success: true };
}
