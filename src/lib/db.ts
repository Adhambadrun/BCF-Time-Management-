import { BCF_TEAMS, generateCanonicalRosterTeams, generateCanonicalRosterUsers } from '../constants/bcfRoster';
import { Team, User } from '../types';
import { firestoreSaveTeam, firestoreSaveUser, getNeonState } from './neonDb';

export { BCF_TEAMS };

export interface SeedDatabaseResult {
  success: boolean;
  teams: Team[];
  users: User[];
  source: 'neon_postgres' | 'fallback_roster';
}

/**
 * Seed and pre-populate all teams (CAI 1 - CAI 5), supervisors, and assigned agent pods
 * directly into the Neon PostgreSQL database.
 * Falls back safely to the canonical BCF_TEAMS array if the database call returns empty or fails.
 */
export async function seedDatabase(): Promise<SeedDatabaseResult> {
  const fallbackTeams = generateCanonicalRosterTeams() as Team[];
  const fallbackUsers = generateCanonicalRosterUsers() as User[];

  try {
    // 1. Trigger server-side Neon PostgreSQL seed endpoint
    const response = await fetch('/api/db/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teams: BCF_TEAMS }),
    });

    if (response.ok) {
      const data = await response.json();
      const teams = (data.teams && data.teams.length > 0) ? data.teams : fallbackTeams;
      const users = (data.users && data.users.length > 0) ? data.users : fallbackUsers;
      return {
        success: true,
        teams,
        users,
        source: 'neon_postgres',
      };
    }
  } catch (err) {
    console.warn('Neon database server seed request failed; attempting client-side upsert pipeline:', err);
  }

  // 2. Client-side upsert pipeline for each team and user
  try {
    for (const team of fallbackTeams) {
      await firestoreSaveTeam(team);
    }
    for (const user of fallbackUsers) {
      await firestoreSaveUser(user);
    }

    const state = await getNeonState();
    const finalTeams = (state.teams && state.teams.length > 0) ? state.teams : fallbackTeams;
    const finalUsers = (state.users && state.users.length > 0) ? state.users : fallbackUsers;

    return {
      success: true,
      teams: finalTeams,
      users: finalUsers,
      source: 'neon_postgres',
    };
  } catch (clientErr) {
    console.warn('Database upsert fallback triggered, using raw BCF_TEAMS constants:', clientErr);
    return {
      success: false,
      teams: fallbackTeams,
      users: fallbackUsers,
      source: 'fallback_roster',
    };
  }
}
