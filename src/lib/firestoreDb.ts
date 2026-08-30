import {
  db,
  doc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  getDocs,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from './firebase';
import {
  User,
  Team,
  BreakRecord,
  WCTracking,
  Warning,
  SNNHeadline,
  ShiftConfig,
  ChatMessage,
  Broadcast,
  AuditLogEntry,
  ShiftNote,
  ActivityLogExport,
  BatchActionType,
} from '../types';

// Helper to sanitize Firestore document ID
const sanitizeDocId = (id: string) => id.replace(/[/\\#?]/g, '_');

// Deeply strip any `undefined` values to prevent Firestore invalid data errors
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data as any)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

// Realtime listeners
export function subscribeToFirestoreTeams(callback: (teams: Team[]) => void) {
  try {
    const colRef = collection(db, 'teams');
    return onSnapshot(colRef, (snapshot) => {
      const records: Team[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as Team);
      });
      if (records.length > 0) {
        callback(records);
      }
    }, (err) => {
      console.warn('Firestore teams subscription warning:', err);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToFirestoreUsers(callback: (users: User[]) => void) {
  try {
    const colRef = collection(db, 'users');
    return onSnapshot(colRef, (snapshot) => {
      const records: User[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as User);
      });
      if (records.length > 0) {
        callback(records);
      }
    }, (err) => {
      console.warn('Firestore users subscription warning:', err);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToFirestoreBreaks(callback: (breaks: BreakRecord[]) => void) {
  try {
    const colRef = collection(db, 'breaks');
    return onSnapshot(colRef, (snapshot) => {
      const records: BreakRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as BreakRecord);
      });
      if (records.length > 0) {
        callback(records);
      }
    }, (err) => {
      console.warn('Firestore breaks subscription warning:', err);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToFirestoreWCTracking(callback: (tracking: Record<string, WCTracking>) => void) {
  try {
    const colRef = collection(db, 'wcTracking');
    return onSnapshot(colRef, (snapshot) => {
      const result: Record<string, WCTracking> = {};
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as WCTracking;
        result[item.agentEmail] = item;
      });
      if (Object.keys(result).length > 0) {
        callback(result);
      }
    }, (err) => {
      console.warn('Firestore wcTracking subscription warning:', err);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToFirestoreHeadlines(callback: (headlines: SNNHeadline[]) => void) {
  try {
    const colRef = collection(db, 'headlines');
    return onSnapshot(colRef, (snapshot) => {
      const items: SNNHeadline[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as SNNHeadline);
      });
      if (items.length > 0) {
        items.sort((a, b) => b.timestamp - a.timestamp);
        callback(items);
      }
    }, (err) => {
      console.warn('Firestore headlines subscription warning:', err);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToFirestoreBroadcasts(callback: (broadcasts: Broadcast[]) => void) {
  try {
    const colRef = collection(db, 'broadcasts');
    return onSnapshot(colRef, (snapshot) => {
      const items: Broadcast[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Broadcast);
      });
      if (items.length > 0) {
        items.sort((a, b) => b.sentAt - a.sentAt);
        callback(items);
      }
    }, (err) => {
      console.warn('Firestore broadcasts subscription warning:', err);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToFirestoreConfig(callback: (config: ShiftConfig) => void) {
  try {
    const docRef = doc(db, 'config', 'current_shift');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as ShiftConfig);
      }
    }, (err) => {
      console.warn('Firestore config subscription warning:', err);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToFirestoreDailyLogs(callback: (logs: ActivityLogExport[]) => void) {
  try {
    const colRef = collection(db, 'daily_logs');
    return onSnapshot(colRef, (snapshot) => {
      const logs: ActivityLogExport[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as ActivityLogExport);
      });
      if (logs.length > 0) {
        callback(logs);
      }
    }, (err) => {
      console.warn('Firestore daily_logs subscription warning:', err);
    });
  } catch (e) {
    console.warn('Firestore daily_logs subscription unavailable:', e);
    return () => {};
  }
}

// Writers
export async function firestoreSaveBreak(breakRecord: BreakRecord) {
  try {
    const docRef = doc(db, 'breaks', sanitizeDocId(breakRecord.breakId));
    await setDoc(docRef, cleanForFirestore(breakRecord), { merge: true });
  } catch (err) {
    console.error('Failed to persist break to Firestore:', err);
  }
}

export async function firestoreSaveWCTracking(tracking: WCTracking) {
  try {
    const docRef = doc(db, 'wcTracking', sanitizeDocId(tracking.agentEmail));
    await setDoc(docRef, cleanForFirestore(tracking), { merge: true });
  } catch (err) {
    console.error('Failed to persist WC tracking to Firestore:', err);
  }
}

export async function firestoreSaveWarning(warning: Warning) {
  try {
    const docRef = doc(db, 'warnings', sanitizeDocId(warning.warningId));
    await setDoc(docRef, cleanForFirestore(warning), { merge: true });
  } catch (err) {
    console.error('Failed to persist warning to Firestore:', err);
  }
}

export async function firestoreSaveHeadline(headline: SNNHeadline) {
  try {
    const docRef = doc(db, 'headlines', sanitizeDocId(headline.headlineId));
    await setDoc(docRef, cleanForFirestore(headline), { merge: true });
  } catch (err) {
    console.error('Failed to persist headline to Firestore:', err);
  }
}

export async function firestoreSaveConfig(config: ShiftConfig) {
  try {
    const docRef = doc(db, 'config', 'current_shift');
    await setDoc(docRef, cleanForFirestore(config), { merge: true });
  } catch (err) {
    console.error('Failed to persist shift config to Firestore:', err);
  }
}

export async function firestoreSaveBroadcast(broadcast: Broadcast) {
  try {
    const docRef = doc(db, 'broadcasts', sanitizeDocId(broadcast.broadcastId));
    await setDoc(docRef, cleanForFirestore(broadcast), { merge: true });
  } catch (err) {
    console.error('Failed to persist broadcast to Firestore:', err);
  }
}

export async function firestoreSaveTeam(team: Team) {
  try {
    const docRef = doc(db, 'teams', sanitizeDocId(team.teamId));
    await setDoc(docRef, cleanForFirestore(team), { merge: true });
  } catch (err) {
    console.error('Failed to persist team to Firestore:', err);
  }
}

export async function firestoreDeleteTeam(teamId: string) {
  try {
    const docRef = doc(db, 'teams', sanitizeDocId(teamId));
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete team from Firestore:', err);
  }
}

export async function firestoreDeleteUser(email: string) {
  try {
    const docRef = doc(db, 'users', sanitizeDocId(email));
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete user from Firestore:', err);
  }
}

export async function firestoreSaveUser(user: User) {
  try {
    const docRef = doc(db, 'users', sanitizeDocId(user.email));
    await setDoc(docRef, cleanForFirestore(user), { merge: true });
  } catch (err) {
    console.error('Failed to persist user to Firestore:', err);
  }
}

export async function firestoreHeartbeat(email: string) {
  try {
    const docRef = doc(db, 'users', sanitizeDocId(email));
    await updateDoc(docRef, {
      lastActiveTimestamp: Date.now(),
      isOnline: true,
      lastSeen: 'Now',
    });
  } catch (err) {
    // Non-blocking pulse
  }
}

export async function firestoreSaveDailyLog(log: ActivityLogExport) {
  try {
    const docRef = doc(db, 'daily_logs', sanitizeDocId(log.logId));
    await setDoc(docRef, cleanForFirestore(log), { merge: true });
  } catch (err) {
    console.error('Failed to save daily activity log:', err);
  }
}

// BATCH OPERATION HANDLER
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
) {
  try {
    const batch = writeBatch(db);
    const now = Date.now();

    selectedAgentEmails.forEach((email) => {
      const userRef = doc(db, 'users', sanitizeDocId(email));
      const agentActiveBreak = activeBreaks.find(b => b.agentEmail === email && b.isActive);

      if (action === 'END_BREAK') {
        batch.update(userRef, {
          status: 'FLOOR',
          isBreakAllowed: true,
          lastSeen: 'Now',
        });
        if (agentActiveBreak) {
          const breakRef = doc(db, 'breaks', sanitizeDocId(agentActiveBreak.breakId));
          batch.update(breakRef, {
            isActive: false,
            endTime: now,
            duration: Math.floor((now - agentActiveBreak.startTime) / 1000),
            isForcedEnded: true,
            forcedEndBy: options?.forcedBy || 'SUPERVISOR_BATCH',
          });
        }
      } else if (action === 'HOLD') {
        batch.update(userRef, {
          status: 'HOLD',
          isBreakAllowed: false,
          lastSeen: 'Now',
        });
      } else if (action === 'BLOCK') {
        batch.update(userRef, {
          status: 'BLOCKED',
          isBreakAllowed: false,
          isBlocked: true,
          blockReason: options?.warningReason || 'Supervisor Batch Break Block',
          lastSeen: 'Now',
        });
        if (agentActiveBreak) {
          const breakRef = doc(db, 'breaks', sanitizeDocId(agentActiveBreak.breakId));
          batch.update(breakRef, {
            isActive: false,
            endTime: now,
            duration: Math.floor((now - agentActiveBreak.startTime) / 1000),
            isForcedEnded: true,
            forcedEndBy: options?.forcedBy || 'SUPERVISOR_BATCH_BLOCK',
          });
        }
      } else if (action === 'WARN') {
        const agent = users.find(u => u.email === email);
        const warnId = 'warn_batch_' + now + '_' + sanitizeDocId(email);
        const warnRef = doc(db, 'warnings', warnId);
        const newWarn: Warning = {
          warningId: warnId,
          agentEmail: email,
          agentName: agent?.name || email,
          teamId: agent?.teamId || 'team_strikers',
          level: 1,
          reason: options?.warningReason || 'Supervisor Batch Warning Issued',
          customNote: options?.warningNote || 'Batch action applied from Supervisor Deck',
          issuedBy: options?.forcedBy || 'SUPERVISOR',
          issuedByName: 'Supervisor',
          issuedAt: now,
          expiresAt: now + (3 * 24 * 60 * 60 * 1000), // 3 shifts
          cleanShiftsCount: 0,
          requiredCleanShifts: 3,
          status: 'active',
          penalties: { maxBreakTime: 50, maxSlots: 4 },
        };
        batch.set(warnRef, cleanForFirestore(newWarn));
      }
    });

    await batch.commit();
    return { success: true };
  } catch (err) {
    console.error('Error committing batch action:', err);
    return { success: false, error: err };
  }
}

