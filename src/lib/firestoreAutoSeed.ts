import {
  db,
  collection,
  getDocs,
  writeBatch,
  doc,
  onSnapshot,
  setDoc,
} from './firebase';
import {
  BCF_TEAMS,
  generateCanonicalRosterUsers,
  generateCanonicalRosterTeams,
} from '../constants/bcfRoster';
import { User, Team } from '../types';

let isBootstrapRunning = false;
let isBootstrapped = false;

/**
 * Bootstrap function that automatically writes all teams (CAI 1 - CAI 5)
 * and all agents/supervisors from BCF_TEAMS into Firestore if empty or missing.
 */
export async function bootstrapFirestoreRoster(): Promise<{ success: boolean; seededCount: number }> {
  if (isBootstrapRunning || isBootstrapped) {
    return { success: true, seededCount: 0 };
  }

  isBootstrapRunning = true;

  try {
    if (!db) {
      console.warn('[Firestore] No DB instance available for bootstrapping');
      isBootstrapRunning = false;
      return { success: false, seededCount: 0 };
    }

    const canonicalUsers = generateCanonicalRosterUsers();
    const canonicalTeams = generateCanonicalRosterTeams();

    console.log('[Firestore] Checking collections for initial seeding...');
    
    // Check existing users in Firestore
    const usersCollectionRef = collection(db, 'users');
    const teamsCollectionRef = collection(db, 'teams');

    let existingUserCount = 0;
    try {
      const usersSnap = await getDocs(usersCollectionRef);
      existingUserCount = usersSnap.size;
    } catch (readErr) {
      console.warn('[Firestore] Could not read existing users, proceeding with batch seed attempt:', readErr);
    }

    // If fewer than canonical agents exist, seed/upsert all teams and users
    if (existingUserCount < canonicalUsers.length) {
      console.log(`[Firestore] Seeding ${canonicalTeams.length} teams and ${canonicalUsers.length} agents into Firestore...`);
      
      const batch = writeBatch(db);

      // Seed Teams
      for (const team of canonicalTeams) {
        const teamDocRef = doc(db, 'teams', team.teamId);
        batch.set(teamDocRef, team, { merge: true });
      }

      // Seed Users
      for (const user of canonicalUsers) {
        const userDocRef = doc(db, 'users', user.id);
        batch.set(userDocRef, user, { merge: true });
      }

      await batch.commit();
      console.log('✅ [Firestore] Successfully bootstrapped all BCF agent pods and teams into Firestore!');
      isBootstrapped = true;
      isBootstrapRunning = false;
      return { success: true, seededCount: canonicalUsers.length };
    } else {
      console.log(`[Firestore] Database already seeded with ${existingUserCount} users.`);
      isBootstrapped = true;
      isBootstrapRunning = false;
      return { success: true, seededCount: 0 };
    }
  } catch (err: any) {
    console.warn('[Firestore] Auto-seed note (fallback in-memory active):', err?.message || err);
    isBootstrapRunning = false;
    return { success: false, seededCount: 0 };
  }
}

/**
 * Realtime Firestore User Subscription with fallback to canonical roster
 */
export function subscribeToFirestoreUsersDirect(callback: (users: User[]) => void) {
  if (!db) {
    callback(generateCanonicalRosterUsers());
    return () => {};
  }

  try {
    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map((docSnap) => docSnap.data() as User);
          if (docs.length >= 10) {
            callback(docs);
            return;
          }
        }
        // Fallback to canonical roster if empty
        callback(generateCanonicalRosterUsers());
      },
      (err) => {
        console.warn('[Firestore] users snapshot error, using canonical fallback:', err);
        callback(generateCanonicalRosterUsers());
      }
    );

    // Trigger auto-seed check in background
    bootstrapFirestoreRoster().catch(() => {});

    return unsubscribe;
  } catch (e) {
    callback(generateCanonicalRosterUsers());
    return () => {};
  }
}

/**
 * Realtime Firestore Team Subscription with fallback to canonical teams
 */
export function subscribeToFirestoreTeamsDirect(callback: (teams: Team[]) => void) {
  if (!db) {
    callback(generateCanonicalRosterTeams());
    return () => {};
  }

  try {
    const q = collection(db, 'teams');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map((docSnap) => docSnap.data() as Team);
          if (docs.length >= 5) {
            callback(docs);
            return;
          }
        }
        callback(generateCanonicalRosterTeams());
      },
      (err) => {
        console.warn('[Firestore] teams snapshot error, using canonical fallback:', err);
        callback(generateCanonicalRosterTeams());
      }
    );

    return unsubscribe;
  } catch (e) {
    callback(generateCanonicalRosterTeams());
    return () => {};
  }
}
