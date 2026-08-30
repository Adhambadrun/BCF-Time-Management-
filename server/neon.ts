import { neon } from '@neondatabase/serverless';
import { INITIAL_USERS, INITIAL_TEAMS, INITIAL_CONFIG } from '../src/lib/storage';

export function getNeonSql() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    'postgresql://neondb_owner:npg_JY98zBEpKxQH@ep-mute-surf-aub8xth6-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require';

  return neon(connectionString);
}

// 1. Initialize Tables (Idempotent)
export async function initNeonTables() {
  const sql = getNeonSql();
  try {
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
    console.error('Failed to initialize Neon tables:', err);
  }
}

// 2. Seed Initial Roster if Database is empty
export async function seedNeonInitialData() {
  const sql = getNeonSql();
  try {
    const userCountRes = await sql`SELECT COUNT(*)::int as count FROM bcf_users`;
    const count = userCountRes[0]?.count || 0;

    if (count === 0) {
      console.log('⚡ Seeding initial teams and users to Neon PostgreSQL...');

      // Seed teams
      for (const team of INITIAL_TEAMS) {
        await sql`
          INSERT INTO bcf_teams (id, data, updated_at)
          VALUES (${team.teamId}, ${JSON.stringify(team)}, NOW())
          ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(team)}, updated_at = NOW()
        `;
      }

      // Seed users
      for (const user of INITIAL_USERS) {
        await sql`
          INSERT INTO bcf_users (id, email, data, updated_at)
          VALUES (${user.id}, ${user.email.toLowerCase()}, ${JSON.stringify(user)}, NOW())
          ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(user)}, updated_at = NOW()
        `;
      }

      // Seed config
      await sql`
        INSERT INTO bcf_config (key, data, updated_at)
        VALUES ('current_shift', ${JSON.stringify(INITIAL_CONFIG)}, NOW())
        ON CONFLICT (key) DO UPDATE SET data = ${JSON.stringify(INITIAL_CONFIG)}, updated_at = NOW()
      `;

      console.log(`✅ Seeded ${INITIAL_TEAMS.length} teams and ${INITIAL_USERS.length} users into Neon`);
    }
  } catch (err) {
    console.error('Error during Neon seeding:', err);
  }
}

// 3. Fetch Full Application State from Neon
export async function getNeonState() {
  const sql = getNeonSql();
  try {
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

    return {
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
  } catch (err) {
    console.error('Failed to get state from Neon:', err);
    throw err;
  }
}

// 4. Save Record to Neon
export async function saveNeonRecord(type: string, data: any) {
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
    default:
      throw new Error(`Unsupported record type: ${type}`);
  }

  return { success: true };
}

// 5. Delete Record from Neon
export async function deleteNeonRecord(type: string, id: string) {
  const sql = getNeonSql();
  if (type === 'team') {
    await sql`DELETE FROM bcf_teams WHERE id = ${id}`;
  } else if (type === 'user') {
    await sql`DELETE FROM bcf_users WHERE id = ${id} OR email = ${id.toLowerCase()}`;
  }
  return { success: true };
}

// 6. User Heartbeat
export async function neonHeartbeat(email: string) {
  const sql = getNeonSql();
  const lowerEmail = email.toLowerCase();
  await sql`
    UPDATE bcf_users
    SET data = jsonb_set(
      jsonb_set(data, '{isOnline}', 'true'::jsonb),
      '{lastSeen}', '"Now"'::jsonb
    ),
    updated_at = NOW()
    WHERE email = ${lowerEmail} OR id = ${lowerEmail}
  `;
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
  const sql = getNeonSql();
  const now = Date.now();
  const forcedBy = options?.forcedBy || 'SUPERVISOR';

  for (const rawEmail of selectedAgentEmails) {
    const email = rawEmail.toLowerCase();

    if (action === 'RESET_FLOOR') {
      await sql`
        UPDATE bcf_users
        SET data = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(data, '{status}', '"FLOOR"'::jsonb),
              '{isBreakAllowed}', 'true'::jsonb
            ),
            '{isBlocked}', 'false'::jsonb
          ),
          '{blockReason}', 'null'::jsonb
        ),
        updated_at = NOW()
        WHERE email = ${email} OR id = ${email}
      `;
      // End any active breaks
      await sql`
        UPDATE bcf_breaks
        SET is_active = false,
            data = jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(data, '{isActive}', 'false'::jsonb),
                  '{endTime}', ${now}::text::jsonb
                ),
                '{isForcedEnded}', 'true'::jsonb
              ),
              '{forcedEndBy}', ${JSON.stringify(options?.forcedBy || 'END_OF_SHIFT_CLEANUP')}::jsonb
            ),
            updated_at = NOW()
        WHERE agent_email = ${email} AND is_active = true
      `;
    } else if (action === 'END_BREAK') {
      await sql`
        UPDATE bcf_users
        SET data = jsonb_set(
          jsonb_set(data, '{status}', '"FLOOR"'::jsonb),
          '{isBreakAllowed}', 'true'::jsonb
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
                  jsonb_set(data, '{isActive}', 'false'::jsonb),
                  '{endTime}', ${now}::text::jsonb
                ),
                '{isForcedEnded}', 'true'::jsonb
              ),
              '{forcedEndBy}', ${JSON.stringify(forcedBy)}::jsonb
            ),
            updated_at = NOW()
        WHERE agent_email = ${email} AND is_active = true
      `;
    } else if (action === 'HOLD') {
      await sql`
        UPDATE bcf_users
        SET data = jsonb_set(
          jsonb_set(data, '{status}', '"HOLD"'::jsonb),
          '{isBreakAllowed}', 'false'::jsonb
        ),
        updated_at = NOW()
        WHERE email = ${email} OR id = ${email}
      `;
    } else if (action === 'BLOCK') {
      const reason = options?.warningReason || 'Supervisor Batch Break Block';
      await sql`
        UPDATE bcf_users
        SET data = jsonb_set(
          jsonb_set(
            jsonb_set(data, '{status}', '"BLOCKED"'::jsonb),
            '{isBreakAllowed}', 'false'::jsonb
          ),
          '{isBlocked}', 'true'::jsonb
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
                  jsonb_set(data, '{isActive}', 'false'::jsonb),
                  '{endTime}', ${now}::text::jsonb
                ),
                '{isForcedEnded}', 'true'::jsonb
              ),
              '{forcedEndBy}', ${JSON.stringify(options?.forcedBy || 'SUPERVISOR_BATCH_BLOCK')}::jsonb
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

  return { success: true };
}

// 8. Team Break Lockdown
export async function executeNeonTeamBreakLock(
  teamId: string,
  block: boolean,
  options?: { forcedBy?: string }
) {
  const sql = getNeonSql();
  const now = Date.now();
  const forcedBy = options?.forcedBy || 'SUPERVISOR';

  // Find all users belonging to this team
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
            jsonb_set(data, '{isBreakAllowed}', 'false'::jsonb),
            '{isBlocked}', 'true'::jsonb
          ),
          '{status}', '"BLOCKED"'::jsonb
        ),
        updated_at = NOW()
        WHERE email = ${email}
      `;
      // Force end any active break
      await sql`
        UPDATE bcf_breaks
        SET is_active = false,
            data = jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(data, '{isActive}', 'false'::jsonb),
                  '{endTime}', ${now}::text::jsonb
                ),
                '{isForcedEnded}', 'true'::jsonb
              ),
              '{forcedEndBy}', ${JSON.stringify(forcedBy)}::jsonb
            ),
            updated_at = NOW()
        WHERE agent_email = ${email} AND is_active = true
      `;
    } else {
      await sql`
        UPDATE bcf_users
        SET data = jsonb_set(
          jsonb_set(
            jsonb_set(data, '{isBreakAllowed}', 'true'::jsonb),
            '{isBlocked}', 'false'::jsonb
          ),
          '{status}', '"FLOOR"'::jsonb
        ),
        updated_at = NOW()
        WHERE email = ${email}
      `;
    }
  }

  return { success: true };
}
