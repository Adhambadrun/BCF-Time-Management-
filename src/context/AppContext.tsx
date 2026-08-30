import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Team, BreakRecord, WCTracking, Warning, SNNHeadline, ShiftConfig, ChatMessage, Broadcast, AuditLogEntry, ShiftNote, BreakType, UserRole, ActivityLogExport, BatchActionType } from '../types';
import { getStoredData, setStoredData, getSessionData, setSessionData, STORAGE_KEYS, INITIAL_USERS, INITIAL_TEAMS, INITIAL_BREAKS, INITIAL_WC_TRACKING, INITIAL_WARNINGS, INITIAL_HEADLINES, INITIAL_CONFIG, INITIAL_DAILY_LOGS } from '../lib/storage';
import { BCF_TEAMS, getSupervisorTeam, getAgentTeam, getTeamById, isSupervisorEmail, generateCanonicalRosterUsers, generateCanonicalRosterTeams } from '../constants/bcfRoster';
import { seedDatabase } from '../lib/db';
import { playSound } from '../lib/sound';
import { loginWithGooglePopup, logoutFirebaseAuth, isEmailAllowedToLogin } from '../lib/authService';
import { loginWithAuth0Popup, logoutAuth0, handleAuth0RedirectCallback, getAuth0Config } from '../lib/auth0Service';
import {
  subscribeToFirestoreBreaks,
  subscribeToFirestoreWCTracking,
  subscribeToFirestoreHeadlines,
  subscribeToFirestoreBroadcasts,
  subscribeToFirestoreConfig,
  subscribeToFirestoreTeams,
  subscribeToFirestoreUsers,
  subscribeToFirestoreDailyLogs,
  firestoreSaveBreak,
  firestoreSaveWCTracking,
  firestoreSaveWarning,
  firestoreSaveHeadline,
  firestoreSaveConfig,
  firestoreSaveBroadcast,
  firestoreSaveUser,
  firestoreSaveTeam,
  firestoreDeleteTeam,
  firestoreDeleteUser,
  firestoreHeartbeat,
  firestoreSaveDailyLog,
  executeFirestoreBatchAction,
  executeFirestoreTeamBreakLock,
} from '../lib/firestoreDb';
import {
  sendBreakExceededNotification,
  requestNotificationPermission,
  getNotificationPermission,
  isNotificationSupported,
} from '../lib/notifications';
import confetti from 'canvas-confetti';

interface AppContextType {
  currentUser: User | null;
  realUser: User | null;
  isSimulating: boolean;
  exitSimulation: () => void;
  switchSimulatedUser: (email: string) => void;
  users: User[];
  teams: Team[];
  activeTeamId: string;
  breaks: BreakRecord[];
  wcTracking: Record<string, WCTracking>;
  warnings: Warning[];
  headlines: SNNHeadline[];
  shiftConfig: ShiftConfig;
  messages: ChatMessage[];
  broadcasts: Broadcast[];
  auditLogs: AuditLogEntry[];
  shiftNotes: ShiftNote[];
  dailyLogs: ActivityLogExport[];
  isShiftActive: boolean;
  timeRemainingInShift: string;
  activeBreaksCount: number;
  totalTeamBreakMinutes: number;
  
  // Modals / Panels
  activeModal: string | null;
  modalData: any;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
  isMessagesOpen: boolean;
  setIsMessagesOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isGodModeOpen: boolean;
  setIsGodModeOpen: (open: boolean) => void;
  isNewsPanelOpen: boolean;
  setIsNewsPanelOpen: (open: boolean) => void;
  isVoiceAssistantOpen: boolean;
  setIsVoiceAssistantOpen: (open: boolean) => void;
  isSearchGroundingOpen: boolean;
  setIsSearchGroundingOpen: (open: boolean) => void;

  // Actions
  loginAs: (email: string) => void;
  impersonateUser: (userOrEmail: User | string) => void;
  startSimulation: (userOrEmail: User | string) => void;
  loginWithAuth0: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  setUserDirectly: (user: User) => void;
  logout: () => void;
  setActiveTeamId: (teamId: string) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  createTeam: (teamData: Partial<Team> & { teamName: string }) => Team;
  deleteTeam: (teamId: string) => void;
  addAgentPod: (agentData: { name: string; email: string; teamId: string; role?: UserRole; avatarUrl?: string; personalMotto?: string; powerEmoji?: string }) => User;
  reassignAgentTeam: (agentEmail: string, newTeamId: string) => void;
  removeAgentPod: (agentEmail: string) => void;
  deleteUser: (agentEmail: string) => void;
  notificationPermission: NotificationPermission | 'unsupported';
  enableBrowserNotifications: () => Promise<NotificationPermission | 'unsupported'>;
  startBreak: (agentEmail: string, breakType: BreakType) => { success: boolean; message: string };
  endBreak: (breakId: string, forcedBy?: string) => void;
  grantBonusBreak: (agentEmail: string, reason: string) => void;
  issueWarning: (agentEmail: string, level: 1 | 2 | 3, reason: string, customNote: string) => void;
  appealWarning: (warningId: string, appealText: string) => void;
  decideAppeal: (warningId: string, decision: 'approved' | 'denied', reason: string) => void;
  dismissWarning: (warningId: string) => void;
  toggleBlockAgent: (agentEmail: string, reason?: string) => void;
  updateUserAvatar: (agentEmail: string, newUrl: string) => void;
  updateUserProfile: (agentEmail: string, updates: Partial<User>) => void;
  updateShiftConfig: (updates: Partial<ShiftConfig>) => void;
  triggerRallyMode: (durationMinutes: number, message: string) => void;
  endRallyMode: () => void;
  sendBroadcast: (broadcast: Omit<Broadcast, 'broadcastId' | 'sentAt' | 'acknowledgments'>) => void;
  acknowledgeBroadcast: (broadcastId: string) => void;
  sendMessage: (recipientEmail: string, text: string) => void;
  addShiftNote: (note: Omit<ShiftNote, 'noteId' | 'timestamp'>) => void;
  addHeadline: (text: string, category: SNNHeadline['category'], priority?: SNNHeadline['priority']) => void;
  resetAllBreaks: () => void;
  exportDataJSON: () => string;
  executeBatchAction: (action: BatchActionType, selectedAgentEmails: string[], options?: { forcedBy?: string; warningReason?: string; warningNote?: string }) => Promise<{ success: boolean }>;
  resetAllFloor: (teamId?: string) => Promise<{ success: boolean }>;
  blockTeamBreaks: (teamId: string) => Promise<{ success: boolean }>;
  unblockTeamBreaks: (teamId: string) => Promise<{ success: boolean }>;
  exportActivityLogsCSV: (timeframe: 'today' | 'yesterday' | '7days') => string;
  downloadActivityLogsCSV: (timeframe: 'today' | 'yesterday' | '7days') => void;
  downloadTeamBreakLogsCSV: (teamId?: string, days?: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getStoredData(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [teams, setTeams] = useState<Team[]>(() => getStoredData(STORAGE_KEYS.TEAMS, INITIAL_TEAMS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = getStoredData<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (saved && saved.email && isEmailAllowedToLogin(saved.email)) {
      const match = INITIAL_USERS.find(u => u.email.toLowerCase() === saved.email.toLowerCase());
      const baseUser = match ? { ...match, ...saved } : saved;
      const supTeam = getSupervisorTeam(baseUser.email);
      if (supTeam) {
        return { ...baseUser, role: 'supervisor', teamId: supTeam.teamId };
      }
      return baseUser;
    }
    return null;
  });

  const [realUser, setRealUser] = useState<User | null>(() => {
    const saved = getStoredData<User | null>(STORAGE_KEYS.REAL_USER, null);
    if (saved && saved.email && isEmailAllowedToLogin(saved.email)) {
      const match = INITIAL_USERS.find(u => u.email.toLowerCase() === saved.email.toLowerCase());
      const baseUser = match ? { ...match, ...saved } : saved;
      const supTeam = getSupervisorTeam(baseUser.email);
      if (supTeam) {
        return { ...baseUser, role: 'supervisor', teamId: supTeam.teamId };
      }
      return baseUser;
    }
    return null;
  });

  const isSimulating = Boolean(
    realUser &&
    currentUser &&
    (realUser.email.toLowerCase() !== currentUser.email.toLowerCase() ||
     realUser.role !== currentUser.role)
  );

  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    const sessionTeam = getSessionData<string | null>(STORAGE_KEYS.ACTIVE_TEAM_FILTER, null);
    if (sessionTeam) return sessionTeam;
    return currentUser?.teamId || 'cai-1';
  });
  const [breaks, setBreaks] = useState<BreakRecord[]>(() => getStoredData(STORAGE_KEYS.BREAKS, INITIAL_BREAKS));
  const [wcTracking, setWcTracking] = useState<Record<string, WCTracking>>(() => getStoredData(STORAGE_KEYS.WC_TRACKING, INITIAL_WC_TRACKING));
  const [warnings, setWarnings] = useState<Warning[]>(() => getStoredData(STORAGE_KEYS.WARNINGS, INITIAL_WARNINGS));
  const [headlines, setHeadlines] = useState<SNNHeadline[]>(() => getStoredData(STORAGE_KEYS.HEADLINES, INITIAL_HEADLINES));
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>(() => getStoredData(STORAGE_KEYS.CONFIG, INITIAL_CONFIG));
  const [messages, setMessages] = useState<ChatMessage[]>(() => getStoredData(STORAGE_KEYS.MESSAGES, []));
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(() => getStoredData(STORAGE_KEYS.BROADCASTS, []));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getStoredData(STORAGE_KEYS.AUDIT_LOGS, []));
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>(() => getStoredData(STORAGE_KEYS.NOTES, []));
  const [dailyLogs, setDailyLogs] = useState<ActivityLogExport[]>(() => getStoredData(STORAGE_KEYS.DAILY_LOGS, INITIAL_DAILY_LOGS));

  // Inactivity tracking reference
  const lastLocalInteractionRef = useRef<number>(Date.now());

  // Modal / panel states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGodModeOpen, setIsGodModeOpen] = useState(false);
  const [isNewsPanelOpen, setIsNewsPanelOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isSearchGroundingOpen, setIsSearchGroundingOpen] = useState(false);

  // User activity listeners
  useEffect(() => {
    const handleActivity = () => {
      lastLocalInteractionRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // Seed and synchronize database on AppProvider initialization
  useEffect(() => {
    seedDatabase()
      .then((res) => {
        if (res.teams && res.teams.length > 0) {
          setTeams((prev) => (prev.length >= res.teams.length ? prev : res.teams));
        }
        if (res.users && res.users.length > 0) {
          setUsers((prev) => (prev.length >= res.users.length ? prev : res.users));
        }
      })
      .catch((err) => {
        console.warn('Initial seedDatabase execution notice:', err);
      });
  }, []);

  // Real-time Firestore synchronization on mount
  useEffect(() => {
    const unsubBreaks = subscribeToFirestoreBreaks((remoteBreaks) => {
      if (remoteBreaks && remoteBreaks.length > 0) {
        setBreaks(remoteBreaks);
      }
    });

    const unsubWc = subscribeToFirestoreWCTracking((remoteWc) => {
      if (remoteWc && Object.keys(remoteWc).length > 0) {
        setWcTracking(remoteWc);
      }
    });

    const unsubHeadlines = subscribeToFirestoreHeadlines((remoteHeadlines) => {
      if (remoteHeadlines && remoteHeadlines.length > 0) {
        setHeadlines(remoteHeadlines);
      }
    });

    const unsubBroadcasts = subscribeToFirestoreBroadcasts((remoteBroadcasts) => {
      if (remoteBroadcasts && remoteBroadcasts.length > 0) {
        setBroadcasts(remoteBroadcasts);
      }
    });

    const unsubConfig = subscribeToFirestoreConfig((remoteConfig) => {
      if (remoteConfig) {
        setShiftConfig(remoteConfig);
      }
    });

    const unsubTeams = subscribeToFirestoreTeams((remoteTeams) => {
      if (remoteTeams && remoteTeams.length > 0) {
        setTeams(remoteTeams);
      }
    });

    const unsubUsers = subscribeToFirestoreUsers((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers(remoteUsers);
      }
    });

    const unsubDailyLogs = subscribeToFirestoreDailyLogs((remoteLogs) => {
      if (remoteLogs && remoteLogs.length > 0) {
        setDailyLogs(remoteLogs);
      }
    });

    return () => {
      unsubBreaks();
      unsubWc();
      unsubHeadlines();
      unsubBroadcasts();
      unsubConfig();
      unsubTeams();
      unsubUsers();
      unsubDailyLogs();
    };
  }, []);

  // Sync to storage
  useEffect(() => setStoredData(STORAGE_KEYS.USERS, users), [users]);
  useEffect(() => setStoredData(STORAGE_KEYS.TEAMS, teams), [teams]);
  useEffect(() => setStoredData(STORAGE_KEYS.CURRENT_USER, currentUser), [currentUser]);
  useEffect(() => setStoredData(STORAGE_KEYS.REAL_USER, realUser), [realUser]);
  useEffect(() => setStoredData(STORAGE_KEYS.BREAKS, breaks), [breaks]);
  useEffect(() => setStoredData(STORAGE_KEYS.WC_TRACKING, wcTracking), [wcTracking]);
  useEffect(() => setStoredData(STORAGE_KEYS.WARNINGS, warnings), [warnings]);
  useEffect(() => setStoredData(STORAGE_KEYS.HEADLINES, headlines), [headlines]);
  useEffect(() => setStoredData(STORAGE_KEYS.CONFIG, shiftConfig), [shiftConfig]);
  useEffect(() => setStoredData(STORAGE_KEYS.MESSAGES, messages), [messages]);
  useEffect(() => setStoredData(STORAGE_KEYS.BROADCASTS, broadcasts), [broadcasts]);
  useEffect(() => setStoredData(STORAGE_KEYS.AUDIT_LOGS, auditLogs), [auditLogs]);
  useEffect(() => setStoredData(STORAGE_KEYS.NOTES, shiftNotes), [shiftNotes]);
  useEffect(() => setStoredData(STORAGE_KEYS.DAILY_LOGS, dailyLogs), [dailyLogs]);

  // Persist activeTeam filter in sessionStorage
  useEffect(() => {
    if (activeTeamId) {
      setSessionData(STORAGE_KEYS.ACTIVE_TEAM_FILTER, activeTeamId);
    }
  }, [activeTeamId]);

  // If currentUser changes, ensure team aligns if agent (agents are restricted to their team)
  useEffect(() => {
    if (currentUser && currentUser.role === 'agent') {
      setActiveTeamId(currentUser.teamId);
    }
  }, [currentUser]);

  // Real-time break duration ticker & auto-warning threshold watcher (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let updatedBreaks = false;

      setBreaks(prevBreaks => {
        return prevBreaks.map(brk => {
          if (!brk.isActive) return brk;
          updatedBreaks = true;
          const elapsedSeconds = Math.floor((now - brk.startTime) / 1000);
          
          // Auto heartbeat sound between 13m and 15m (780s - 900s)
          if (elapsedSeconds === 780 || elapsedSeconds === 840) {
            playSound('heartbeat');
          }

          // High-priority subtle alert immediately when exceeding slot threshold
          if (elapsedSeconds === 900 || (brk.breakType === 'bonus' && elapsedSeconds === (brk.slotDuration || 600))) {
            playSound('limit_exceeded');
            addHeadline(`🚨 URGENCY ALERT: ${brk.agentName} has exceeded maximum allowed break time!`, 'warning', 'urgent');
            sendBreakExceededNotification({
              agentName: brk.agentName,
              agentEmail: brk.agentEmail,
              breakType: brk.breakType,
              durationMinutes: Math.round(elapsedSeconds / 60),
              allowedMinutes: brk.breakType === 'bonus' ? 10 : 15,
            });
          }

          // Auto-end regular break after 15 minutes (900s) + issue Level 1 Warning
          if (brk.breakType !== 'bonus' && elapsedSeconds >= 900 && !brk.isAutoEnded) {
            playSound('limit_exceeded');
            addHeadline(`⚠️ ${brk.agentName} auto-ended at 15m mark. Auto Level 1 warning issued.`, 'warning', 'urgent');
            
            // Auto issue warning
            issueWarning(
              brk.agentEmail,
              1,
              'Slot overrun exceeding 15 minutes limit',
              'Auto-detected by system clock. Break automatically terminated at 15m maximum.'
            );

            return {
              ...brk,
              duration: elapsedSeconds,
              endTime: now,
              isActive: false,
              isAutoEnded: true,
            };
          }

          return {
            ...brk,
            duration: elapsedSeconds,
          };
        });
      });

      // Update WC cumulative tracking for active WC breaks
      setBreaks(currentBreaks => {
        const activeWc = currentBreaks.filter(b => b.isActive && b.breakType === 'wc');
        if (activeWc.length > 0) {
          setWcTracking(prevWc => {
            const nextWc = { ...prevWc };
            activeWc.forEach(b => {
              const current = nextWc[b.agentEmail] || {
                agentEmail: b.agentEmail,
                agentName: b.agentName,
                teamId: b.teamId,
                date: new Date().toISOString().split('T')[0],
                totalWCTime: 0,
                wcBreakCount: 1,
                lastWCBreakAt: now,
                hasReceivedLimitWarning: false,
              };

              const newTotal = current.totalWCTime + 1;
              if (newTotal > 1200 && !current.hasReceivedLimitWarning) { // 20 minutes limit
                playSound('limit_exceeded');
                addHeadline(`🚻 ${b.agentName} exceeded daily 20m WC limit! Auto Level 1 warning issued.`, 'warning', 'urgent');
                issueWarning(b.agentEmail, 1, 'Daily WC allowance exceeded (20 min limit)', 'Automatic violation threshold reached.');
                current.hasReceivedLimitWarning = true;
              }

              nextWc[b.agentEmail] = {
                ...current,
                totalWCTime: newTotal,
                lastWCBreakAt: now,
              };
            });
            return nextWc;
          });
        }
        return currentBreaks;
      });

    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Automated Idle Shift-End Engine & Client Heartbeat (Runs every 30 seconds)
  useEffect(() => {
    const idleCheckInterval = setInterval(() => {
      const now = Date.now();
      const idleTimeoutMs = (shiftConfig.idleTimeoutMinutes || 30) * 60 * 1000;

      // 1. Client activity pulse / heartbeat for currentUser
      if (currentUser?.email) {
        const timeSinceUserInteraction = now - lastLocalInteractionRef.current;
        if (timeSinceUserInteraction < 120000) { // Active in last 2 mins
          firestoreHeartbeat(currentUser.email);
          setUsers(prev => prev.map(u => u.email === currentUser.email ? { ...u, lastActiveTimestamp: now, lastSeen: 'Now', isOnline: true } : u));
        }
      }

      // 2. Scan all floor agents for idle timeout
      users.forEach(agent => {
        // Only evaluate active shift floor agents
        if (agent.role !== 'agent' || agent.status === 'SHIFT_ENDED' || agent.status === 'OFFLINE') {
          return;
        }

        const isCurrentActiveUser = currentUser?.email === agent.email;
        const lastActivity = isCurrentActiveUser ? lastLocalInteractionRef.current : (agent.lastActiveTimestamp || (agent.actualLoginTime || now));
        const idleDuration = now - lastActivity;

        if (idleDuration >= idleTimeoutMs) {
          console.warn(`[Auto-Logout Engine] Agent ${agent.name} (${agent.email}) exceeded ${shiftConfig.idleTimeoutMinutes || 30}m idle threshold.`);
          
          // Force-end any active breaks
          setBreaks(prev => prev.map(b => {
            if (b.agentEmail === agent.email && b.isActive) {
              const duration = Math.floor((now - b.startTime) / 1000);
              return { ...b, isActive: false, endTime: now, duration, isAutoEnded: true };
            }
            return b;
          }));

          // Calculate break totals for today
          const todayStr = new Date().toISOString().split('T')[0];
          const agentBreaks = breaks.filter(b => b.agentEmail === agent.email && b.date === todayStr);
          const totalBreakSec = agentBreaks.reduce((acc, b) => acc + (b.duration || 0), 0);
          const agentWcSec = wcTracking[agent.email]?.totalWCTime || 0;
          const agentWarns = warnings.filter(w => w.agentEmail === agent.email && w.status === 'active');
          const agentTeam = teams.find(t => t.teamId === agent.teamId);

          // Create Daily Activity Log Record
          const newDailyLog: ActivityLogExport = {
            logId: 'dlog_' + now + '_' + agent.id,
            agentId: agent.id,
            agentName: agent.name,
            email: agent.email,
            teamId: agent.teamId,
            teamName: agentTeam?.teamName || agent.teamId,
            scheduledStart: agent.scheduledShiftStart || '09:00',
            scheduledEnd: agent.scheduledShiftEnd || '17:00',
            actualLogin: agent.actualLoginTime ? new Date(agent.actualLoginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:02',
            actualLogout: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            loginTime: agent.actualLoginTime || (now - 28800000),
            logoutTime: now,
            logoutReason: 'AUTO_IDLE',
            status: 'SHIFT_ENDED',
            totalBreakSec,
            totalWcSec: agentWcSec,
            warningsCount: agentWarns.length,
            shiftExtensionMin: agent.shiftExtensionMin || 0,
            latenessFlag: 'NONE',
            dateString: todayStr,
          };

          // Save Daily Log
          setDailyLogs(prev => [newDailyLog, ...prev]);
          firestoreSaveDailyLog(newDailyLog);

          // Update agent status in local state & Firestore
          const updatedAgent: User = {
            ...agent,
            status: 'SHIFT_ENDED',
            isOnline: false,
            lastSeen: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actualLogoutTime: now,
            logoutReason: 'AUTO_IDLE',
          };
          setUsers(prev => prev.map(u => u.email === agent.email ? updatedAgent : u));
          firestoreSaveUser(updatedAgent);

          // Log Audit & SNN Headline
          addHeadline(`🛑 AUTO-LOGOUT: ${agent.name} shift ended automatically due to ${shiftConfig.idleTimeoutMinutes || 30}m inactivity.`, 'warning', 'urgent');
          logAudit('auto_logout_idle', 'system', { agentEmail: agent.email, idleMinutes: Math.round(idleDuration / 60000) });
        }
      });
    }, 30000);

    return () => clearInterval(idleCheckInterval);
  }, [currentUser, users, breaks, wcTracking, warnings, teams, shiftConfig]);

  const openModal = (modalName: string, data?: any) => {
    setActiveModal(modalName);
    setModalData(data || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const addHeadline = useCallback((text: string, category: SNNHeadline['category'] = 'break', priority: SNNHeadline['priority'] = 'normal') => {
    const newHeadline: SNNHeadline = {
      headlineId: 'hl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      headlineText: text,
      category,
      priority,
      timestamp: Date.now(),
      visibility: 'all',
    };
    setHeadlines(prev => [newHeadline, ...prev.slice(0, 30)]);
    firestoreSaveHeadline(newHeadline);
  }, []);

  const impersonateUser = useCallback((userOrEmail: User | string) => {
    let targetUser: User | undefined;
    if (typeof userOrEmail === 'string') {
      const email = userOrEmail.trim().toLowerCase();
      targetUser = users.find(u => u.email.toLowerCase() === email) ||
                   INITIAL_USERS.find(u => u.email.toLowerCase() === email);
    } else if (userOrEmail && typeof userOrEmail === 'object') {
      targetUser = userOrEmail;
    }

    if (!targetUser) {
      console.warn('Target user for impersonation not found:', userOrEmail);
      return;
    }

    if (!isEmailAllowedToLogin(targetUser.email)) {
      addHeadline(`🚫 Access restricted: ${targetUser.email} is not authorized`, 'warning', 'urgent');
      return;
    }

    const supTeam = getSupervisorTeam(targetUser.email);
    const resolvedUser: User = supTeam
      ? { ...targetUser, role: 'supervisor' as UserRole, teamId: supTeam.teamId }
      : targetUser;

    const originalSuperuser = realUser || (currentUser && currentUser.role === 'developer' ? currentUser : null) || users.find(u => u.role === 'developer') || INITIAL_USERS[0];

    setRealUser(originalSuperuser);
    setCurrentUser(resolvedUser);

    // Synchronously write to storage to ensure instant persistence
    setStoredData(STORAGE_KEYS.REAL_USER, originalSuperuser);
    setStoredData(STORAGE_KEYS.CURRENT_USER, resolvedUser);

    if (resolvedUser.role === 'supervisor' || resolvedUser.role === 'agent' || resolvedUser.role === 'independent') {
      setActiveTeamId(resolvedUser.teamId);
      setSessionData(STORAGE_KEYS.ACTIVE_TEAM_FILTER, resolvedUser.teamId);
    }

    playSound('bonus');
    addHeadline(`🎭 Simulating ${resolvedUser.name} (${resolvedUser.role.toUpperCase()}) — Session Active`, 'info', 'normal');
  }, [users, realUser, currentUser, addHeadline]);

  const loginAs = useCallback((email: string) => {
    impersonateUser(email);
  }, [impersonateUser]);

  const startSimulation = useCallback((userOrEmail: User | string) => {
    impersonateUser(userOrEmail);
  }, [impersonateUser]);

  const switchSimulatedUser = (email: string) => {
    loginAs(email);
  };

  const exitSimulation = useCallback(() => {
    // Find original developer Adham Badraan
    const devUser =
      (realUser && isEmailAllowedToLogin(realUser.email) ? realUser : null) ||
      users.find((u) => u.email.toLowerCase() === 'adhambadraan@gmail.com') ||
      users.find((u) => u.role === 'developer') ||
      INITIAL_USERS.find((u) => u.email.toLowerCase() === 'adhambadraan@gmail.com') ||
      INITIAL_USERS[0];

    setCurrentUser(devUser);
    setRealUser(devUser);
    setStoredData(STORAGE_KEYS.REAL_USER, devUser);
    setStoredData(STORAGE_KEYS.CURRENT_USER, devUser);
    setActiveTeamId(devUser.teamId || 'cai-1');
    playSound('bonus');
    addHeadline(`👑 Returned to Developer Context: ${devUser.name} (${devUser.email})`, 'info', 'normal');
  }, [realUser, users, addHeadline]);

  const setUserDirectly = useCallback((user: User) => {
    if (!isEmailAllowedToLogin(user.email)) {
      addHeadline(`🚫 Access denied: ${user.email} does not belong to @bcflights.com domain`, 'warning', 'urgent');
      return;
    }
    const supTeam = getSupervisorTeam(user.email);
    const normalizedUser: User = supTeam
      ? { ...user, role: 'supervisor', teamId: supTeam.teamId }
      : user;

    setUsers(prev => {
      const idx = prev.findIndex(u => u.email.toLowerCase() === normalizedUser.email.toLowerCase() || u.id === normalizedUser.id);
      let next: User[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...next[idx], ...normalizedUser };
      } else {
        next = [normalizedUser, ...prev];
      }
      setStoredData(STORAGE_KEYS.USERS, next);
      return next;
    });
    setCurrentUser(normalizedUser);
    setRealUser(normalizedUser);
    setStoredData(STORAGE_KEYS.CURRENT_USER, normalizedUser);
    setStoredData(STORAGE_KEYS.REAL_USER, normalizedUser);

    if (normalizedUser.role === 'supervisor' || normalizedUser.role === 'agent') {
      setActiveTeamId(normalizedUser.teamId);
    }
    playSound('click');
    addHeadline(`👋 ${normalizedUser.name} authenticated via ${normalizedUser.email}`, 'info', 'normal');
  }, [addHeadline]);

  const loginWithAuth0 = async () => {
    try {
      const user = await loginWithAuth0Popup();
      if (!isEmailAllowedToLogin(user.email)) {
        throw new Error(`Access restricted: ${user.email} is not authorized. Only @bcflights.com emails can access the floor.`);
      }
      setUserDirectly(user);
    } catch (err: any) {
      console.error('Auth0 Sign-in Error:', err);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    const auth0Conf = getAuth0Config();
    // When Auth0 is configured, use Auth0 as the floor authentication service
    if (auth0Conf.domain && auth0Conf.clientId) {
      await loginWithAuth0();
      return;
    }

    try {
      const user = await loginWithGooglePopup();
      if (!isEmailAllowedToLogin(user.email)) {
        throw new Error(`Access restricted: ${user.email} is not authorized. Only @bcflights.com emails can log in.`);
      }
      setUserDirectly(user);
    } catch (err: any) {
      console.error('Sign-in Error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutAuth0();
    } catch (e) {
      // Ignore
    }
    try {
      await logoutFirebaseAuth();
    } catch (e) {
      // Ignore logout errors
    }
    setCurrentUser(null);
    setRealUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.REAL_USER);
        localStorage.removeItem('bcf_auth_current_user_v3');
        localStorage.removeItem('bcf_real_user_v3');
        localStorage.removeItem('bcf_auth_current_user_v4');
        localStorage.removeItem('bcf_real_user_v4');
      } catch {
        // Ignore
      }
    }
    closeModal();
    setIsGodModeOpen(false);
    setIsSettingsOpen(false);
  };

  const logAudit = (action: string, category: AuditLogEntry['actionCategory'], details: Record<string, any>, targetUser?: string) => {
    if (!currentUser) return;
    const entry: AuditLogEntry = {
      logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: Date.now(),
      action,
      actionCategory: category,
      performedBy: currentUser.email,
      performedByName: currentUser.name,
      performedByRole: currentUser.role,
      targetUser,
      details,
    };
    setAuditLogs(prev => [entry, ...prev.slice(0, 150)]);
  };

  const startBreak = (agentEmail: string, breakType: BreakType) => {
    const agent = users.find(u => u.email === agentEmail);
    if (!agent) return { success: false, message: 'Agent not found' };

    // Check if Rally Mode or Master block is active
    if (shiftConfig.rallyModeActive) {
      playSound('warning');
      return { success: false, message: 'Rally Mode is ACTIVE! All breaks currently suspended.' };
    }
    if (shiftConfig.masterBreakBlock || agent.isBlocked) {
      playSound('warning');
      return { success: false, message: agent.blockReason || 'Breaks are currently blocked.' };
    }

    // Check capacity for team
    const activeTeamBreaks = breaks.filter(b => b.teamId === agent.teamId && b.isActive);
    if (activeTeamBreaks.length >= shiftConfig.breakCapacity && breakType !== 'bonus') {
      playSound('warning');
      return { success: false, message: `Team capacity reached (${shiftConfig.breakCapacity}/${shiftConfig.breakCapacity}). Please wait.` };
    }

    // Check WC daily limit
    if (breakType === 'wc') {
      const todayWc = wcTracking[agentEmail]?.totalWCTime || 0;
      if (todayWc >= 1200) { // 20m
        playSound('warning');
        return { success: false, message: 'Daily 20m WC limit reached.' };
      }
    }

    // Check slot limit
    const agentBreaksToday = breaks.filter(b => b.agentEmail === agentEmail && b.date === new Date().toISOString().split('T')[0]);
    if (breakType !== 'bonus' && breakType !== 'wc') {
      if (agentBreaksToday.length >= shiftConfig.maxSlots) {
        playSound('warning');
        return { success: false, message: `Max ${shiftConfig.maxSlots} slots used for this shift.` };
      }
    }

    const slotNum = agentBreaksToday.length + 1;
    const now = Date.now();
    const durationLimitSec = breakType === 'bonus' ? 600 : 900; // 10m or 15m

    const newBreak: BreakRecord = {
      breakId: 'brk_' + Date.now(),
      agentEmail: agent.email,
      agentName: agent.name,
      teamId: agent.teamId,
      breakType,
      slotNumber: slotNum,
      startTime: now,
      endTime: null,
      duration: 0,
      scheduledEndTime: now + durationLimitSec * 1000,
      isActive: true,
      isBonus: breakType === 'bonus',
      date: new Date().toISOString().split('T')[0],
    };

    setBreaks(prev => [newBreak, ...prev]);
    firestoreSaveBreak(newBreak);

    // Update WC visit count if WC
    if (breakType === 'wc') {
      setWcTracking(prev => {
        const cur = prev[agentEmail] || {
          agentEmail: agent.email,
          agentName: agent.name,
          teamId: agent.teamId,
          date: new Date().toISOString().split('T')[0],
          totalWCTime: 0,
          wcBreakCount: 0,
          lastWCBreakAt: now,
          hasReceivedLimitWarning: false,
        };
        return {
          ...prev,
          [agentEmail]: {
            ...cur,
            wcBreakCount: cur.wcBreakCount + 1,
            lastWCBreakAt: now,
          },
        };
      });
    }

    playSound(breakType === 'bonus' ? 'bonus' : 'break_start');
    addHeadline(`${agent.name.toUpperCase()} started a ${breakType} break — Slot ${slotNum}/5`, breakType === 'bonus' ? 'bonus' : 'break', 'normal');
    logAudit('break_start', 'break', { breakType, slotNumber: slotNum }, agentEmail);

    return { success: true, message: 'Break started!' };
  };

  const endBreak = (breakId: string, forcedBy?: string) => {
    const brk = breaks.find(b => b.breakId === breakId);
    if (!brk || !brk.isActive) return;

    const now = Date.now();
    const finalDuration = Math.floor((now - brk.startTime) / 1000);

    const updatedRecord = {
      ...brk,
      isActive: false,
      endTime: now,
      duration: finalDuration,
      isForcedEnded: !!forcedBy,
      forcedEndBy: forcedBy,
    };
    firestoreSaveBreak(updatedRecord);

    setBreaks(prev => prev.map(b => {
      if (b.breakId === breakId) {
        return updatedRecord;
      }
      return b;
    }));

    // Update user stats
    setUsers(prev => prev.map(u => {
      if (u.email === brk.agentEmail) {
        return {
          ...u,
          totalBreaksTaken: u.totalBreaksTaken + 1,
          totalBreakTime: u.totalBreakTime + Math.round(finalDuration / 60),
        };
      }
      return u;
    }));

    playSound('break_end');

    if (forcedBy) {
      addHeadline(`🛑 ${brk.agentName}'s break was FORCE-ENDED by supervisor.`, 'alert', 'urgent');
      logAudit('break_force_end', 'break', { duration: finalDuration, forcedBy }, brk.agentEmail);
    } else {
      addHeadline(`✅ ${brk.agentName} returned from break (${Math.round(finalDuration / 60)}m). Welcome back!`, 'break', 'normal');
      logAudit('break_end', 'break', { duration: finalDuration }, brk.agentEmail);
    }
  };

  const grantBonusBreak = (agentEmail: string, reason: string) => {
    const agent = users.find(u => u.email === agentEmail);
    if (!agent) return;

    setUsers(prev => prev.map(u => u.email === agentEmail ? { ...u, totalBonusReceived: u.totalBonusReceived + 1 } : u));
    playSound('bonus');
    confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 } });
    addHeadline(`🎁 BONUS BREAK granted to ${agent.name.toUpperCase()} (+10m): "${reason}"`, 'bonus', 'urgent');
    logAudit('bonus_grant', 'admin', { reason }, agentEmail);
  };

  const issueWarning = (agentEmail: string, level: 1 | 2 | 3, reason: string, customNote: string) => {
    const agent = users.find(u => u.email === agentEmail);
    if (!agent) return;

    const newWarning: Warning = {
      warningId: 'warn_' + Date.now(),
      agentEmail: agent.email,
      agentName: agent.name,
      teamId: agent.teamId,
      level,
      reason,
      customNote,
      issuedBy: currentUser?.email || 'system',
      issuedByName: currentUser?.name || 'System Auto-Guardian',
      issuedAt: Date.now(),
      expiresAt: Date.now() + (level === 1 ? 3 : level === 2 ? 5 : 7) * 86400000,
      cleanShiftsCount: 0,
      requiredCleanShifts: level === 1 ? 3 : level === 2 ? 5 : 7,
      status: 'active',
      penalties: {
        maxBreakTime: level === 1 ? 60 : level === 2 ? 50 : 40,
        maxSlots: level === 1 ? 5 : 4,
      },
    };

    setWarnings(prev => [newWarning, ...prev]);
    firestoreSaveWarning(newWarning);
    setUsers(prev => prev.map(u => u.email === agentEmail ? { ...u, totalWarnings: u.totalWarnings + 1 } : u));
    playSound('warning');
    addHeadline(`⚠️ Level ${level} Warning issued to ${agent.name}: ${reason}`, 'warning', level === 3 ? 'critical' : 'urgent');
    logAudit('warning_issued', 'warning', { level, reason, customNote }, agentEmail);
  };

  const appealWarning = (warningId: string, appealText: string) => {
    setWarnings(prev => prev.map(w => {
      if (w.warningId === warningId) {
        return {
          ...w,
          status: 'appealed',
          appealText,
          appealSubmittedAt: Date.now(),
        };
      }
      return w;
    }));
    playSound('notification');
    addHeadline(`📜 Warning appeal submitted by ${currentUser?.name}. Pending supervisor review.`, 'alert', 'normal');
    logAudit('warning_appeal_submitted', 'warning', { warningId, appealText });
  };

  const decideAppeal = (warningId: string, decision: 'approved' | 'denied', reason: string) => {
    setWarnings(prev => prev.map(w => {
      if (w.warningId === warningId) {
        return {
          ...w,
          status: decision === 'approved' ? 'dismissed' : 'active',
          appealDecision: decision,
          appealDecisionBy: currentUser?.email,
          appealDecisionAt: Date.now(),
          appealDecisionReason: reason,
        };
      }
      return w;
    }));
    playSound('click');
    addHeadline(`⚖️ Appeal ${decision.toUpperCase()} by ${currentUser?.name}: ${reason}`, 'alert', 'urgent');
    logAudit('warning_appeal_decided', 'admin', { warningId, decision, reason });
  };

  const dismissWarning = (warningId: string) => {
    setWarnings(prev => prev.map(w => w.warningId === warningId ? { ...w, status: 'dismissed' } : w));
    playSound('click');
    logAudit('warning_dismissed', 'admin', { warningId });
  };

  const toggleBlockAgent = (agentEmail: string, reason?: string) => {
    const targetUser = users.find(u => u.email === agentEmail);
    const nextState = !targetUser?.isBlocked;
    
    setUsers(prev => prev.map(u => {
      if (u.email === agentEmail) {
        return {
          ...u,
          isBlocked: nextState,
          blockReason: nextState ? (reason || 'Administrative hold') : undefined,
        };
      }
      return u;
    }));

    if (nextState) {
      playSound('warning');
      addHeadline(`🚫 BREAKS BLOCKED for ${targetUser?.name || agentEmail}: ${reason || 'Administrative hold'}`, 'warning', 'urgent');
    } else {
      playSound('notification');
      addHeadline(`✅ Break access RESTORED for ${targetUser?.name || agentEmail}`, 'info', 'normal');
    }
    logAudit('agent_block_toggled', 'admin', { agentEmail, isBlocked: nextState, reason });
  };

  const updateUserAvatar = (agentEmail: string, newUrl: string) => {
    setUsers(prev => {
      const next = prev.map(u => u.email === agentEmail ? { ...u, avatarUrl: newUrl } : u);
      const target = next.find(u => u.email === agentEmail);
      if (target) firestoreSaveUser(target);
      return next;
    });
    if (currentUser?.email === agentEmail) {
      setCurrentUser(prev => prev ? { ...prev, avatarUrl: newUrl } : null);
    }
    playSound('click');
    logAudit('avatar_updated', 'auth', { agentEmail, newUrl });
  };

  const updateUserProfile = (agentEmail: string, updates: Partial<User>) => {
    setUsers(prev => {
      const next = prev.map(u => u.email === agentEmail ? { ...u, ...updates } : u);
      const target = next.find(u => u.email === agentEmail);
      if (target) firestoreSaveUser(target);
      return next;
    });
    if (currentUser?.email === agentEmail) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    playSound('click');
    logAudit('profile_updated', 'auth', { agentEmail, updates });
  };

  const updateShiftConfig = (updates: Partial<ShiftConfig>) => {
    setShiftConfig(prev => {
      const next = { ...prev, ...updates };
      firestoreSaveConfig(next);
      return next;
    });
    playSound('click');
    logAudit('shift_config_updated', 'system', { updates });
  };

  const triggerRallyMode = (durationMinutes: number, message: string) => {
    const endsAt = Date.now() + durationMinutes * 60000;
    setShiftConfig(prev => {
      const next = {
        ...prev,
        rallyModeActive: true,
        rallyModeStartedBy: currentUser?.email,
        rallyModeEndsAt: endsAt,
        rallyModeMessage: message,
      };
      firestoreSaveConfig(next);
      return next;
    });
    playSound('rally');
    addHeadline(`🚨 RALLY MODE ACTIVATED: ${message} (Breaks paused for ${durationMinutes}m)`, 'alert', 'critical');
    logAudit('rally_mode_triggered', 'system', { durationMinutes, message });
  };

  const endRallyMode = () => {
    setShiftConfig(prev => {
      const next = {
        ...prev,
        rallyModeActive: false,
        rallyModeEndsAt: 0,
        rallyModeMessage: '',
        rallyModeStartedBy: '',
      };
      firestoreSaveConfig(next);
      return next;
    });
    playSound('click');
    addHeadline('🟢 Rally Mode ended. Floor break punches resumed.', 'break', 'urgent');
    logAudit('rally_mode_ended', 'system', {});
  };

  const sendBroadcast = (data: Omit<Broadcast, 'broadcastId' | 'sentAt' | 'acknowledgments'>) => {
    const newBroadcast: Broadcast = {
      ...data,
      broadcastId: 'bc_' + Date.now(),
      sentAt: Date.now(),
      acknowledgments: {},
    };
    setBroadcasts(prev => [newBroadcast, ...prev]);
    firestoreSaveBroadcast(newBroadcast);
    playSound(data.priority === 'critical' ? 'rally' : 'notification');
    addHeadline(`📢 BROADCAST: ${data.message}`, 'alert', data.priority);
    logAudit('broadcast_sent', 'admin', { data });
  };

  const acknowledgeBroadcast = (broadcastId: string) => {
    if (!currentUser) return;
    setBroadcasts(prev => prev.map(bc => {
      if (bc.broadcastId === broadcastId) {
        return {
          ...bc,
          acknowledgments: {
            ...bc.acknowledgments,
            [currentUser.email]: Date.now(),
          },
        };
      }
      return bc;
    }));
    playSound('click');
  };

  const sendMessage = (recipientEmail: string, text: string) => {
    if (!currentUser) return;
    const convId = [currentUser.email, recipientEmail].sort().join('_');
    const msg: ChatMessage = {
      messageId: 'msg_' + Date.now(),
      conversationId: convId,
      senderEmail: currentUser.email,
      senderName: currentUser.name,
      recipientEmail,
      messageText: text,
      timestamp: Date.now(),
      read: false,
    };
    setMessages(prev => [...prev, msg]);
    playSound('message');
  };

  const handleSetActiveTeamId = (teamId: string) => {
    if (currentUser?.role === 'agent') {
      // Agents strictly cannot switch or see other teams
      setActiveTeamId(currentUser.teamId);
      return;
    }
    setActiveTeamId(teamId);
  };

  const updateTeam = (teamId: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(t => {
      if (t.teamId === teamId) {
        const updated = { ...t, ...updates };
        firestoreSaveTeam(updated);
        return updated;
      }
      return t;
    }));
    playSound('click');
    logAudit('team_updated', 'admin', { teamId, updates });
    addHeadline(`🛠️ Team ${updates.teamName || teamId} settings updated`, 'info', 'normal');
  };

  const createTeam = (teamData: Partial<Team> & { teamName: string }): Team => {
    const newTeamId = teamData.teamId || `team_${teamData.teamName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newTeam: Team = {
      teamId: newTeamId,
      teamName: teamData.teamName.toUpperCase(),
      teamLogo: teamData.teamLogo || '/logo.png',
      teamColorAccent: teamData.teamColorAccent || '#00E5FF',
      supervisorEmail: teamData.supervisorEmail || (currentUser?.email || 'admin@bcflights.com'),
      defaultLanguage: teamData.defaultLanguage || 'en',
      agentCount: 0,
      competitionScore: 1000,
      isActive: true,
      ...teamData,
    };
    setTeams(prev => [...prev, newTeam]);
    firestoreSaveTeam(newTeam);
    playSound('notification');
    logAudit('team_created', 'admin', { newTeam });
    addHeadline(`🚀 NEW TEAM CREATED: ${newTeam.teamName}`, 'alert', 'urgent');
    return newTeam;
  };

  const deleteTeam = (teamId: string) => {
    const fallbackTeam = teams.find(t => t.teamId !== teamId);
    if (!fallbackTeam) return;

    // Reassign users in the deleted team to fallback
    setUsers(prev => prev.map(u => {
      if (u.teamId === teamId) {
        const updated = { ...u, teamId: fallbackTeam.teamId };
        firestoreSaveUser(updated);
        return updated;
      }
      return u;
    }));

    setTeams(prev => prev.filter(t => t.teamId !== teamId));
    firestoreDeleteTeam(teamId);
    if (activeTeamId === teamId) {
      setActiveTeamId(fallbackTeam.teamId);
    }
    playSound('warning');
    logAudit('team_deleted', 'admin', { teamId, fallbackTeamId: fallbackTeam.teamId });
    addHeadline(`🗑️ Team ${teamId} dissolved. Agents reassigned to ${fallbackTeam.teamName}`, 'warning', 'normal');
  };

  const addAgentPod = (agentData: {
    name: string;
    email: string;
    teamId: string;
    role?: UserRole;
    avatarUrl?: string;
    personalMotto?: string;
    powerEmoji?: string;
  }): User => {
    const targetTeam = teams.find(t => t.teamId === agentData.teamId) || teams[0];
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: agentData.name,
      email: agentData.email.toLowerCase(),
      role: agentData.role || 'agent',
      teamId: targetTeam.teamId,
      avatarUrl: agentData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      personalMotto: agentData.personalMotto || 'Ready to close deals and hit targets! 🚀',
      powerEmoji: agentData.powerEmoji || '⚡',
      podColorTheme: targetTeam.teamColorAccent,
      preferredLanguage: targetTeam.defaultLanguage || 'en',
      themeMode: 'dark',
      notificationsEnabled: true,
      soundEnabled: true,
      reducedMotion: false,
      reducedTransparency: false,
      fontSize: 'md',
      birthday: '01-01',
      hireDate: new Date().toISOString().split('T')[0],
      yearsOfService: 1,
      isOnline: true,
      lastSeen: 'Now',
      totalBreaksTaken: 0,
      totalBreakTime: 0,
      totalWarnings: 0,
      totalBonusReceived: 0,
      currentStreak: 1,
      longestStreak: 1,
      dailyGoal: {
        text: 'Floor Attendance & Break Compliance',
        target: 5,
        progress: 0,
        completed: false,
      },
    };

    setUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase());
      return [...filtered, newUser];
    });

    // Increment team agentCount
    setTeams(prev => prev.map(t => {
      if (t.teamId === targetTeam.teamId) {
        const updated = { ...t, agentCount: (t.agentCount || 0) + 1 };
        firestoreSaveTeam(updated);
        return updated;
      }
      return t;
    }));

    firestoreSaveUser(newUser);
    playSound('notification');
    addHeadline(`👤 NEW AGENT POD CREATED: ${newUser.name} added to ${targetTeam.teamName}`, 'info', 'normal');
    logAudit('agent_pod_created', 'admin', { newUser });
    return newUser;
  };

  const reassignAgentTeam = (agentEmail: string, newTeamId: string) => {
    const targetUser = users.find(u => u.email.toLowerCase() === agentEmail.toLowerCase());
    const newTeam = teams.find(t => t.teamId === newTeamId);
    if (!targetUser || !newTeam) return;

    const oldTeamId = targetUser.teamId;
    if (oldTeamId === newTeamId) return;

    const updatedUser = { ...targetUser, teamId: newTeamId, podColorTheme: newTeam.teamColorAccent };
    setUsers(prev => prev.map(u => u.email.toLowerCase() === agentEmail.toLowerCase() ? updatedUser : u));
    if (currentUser?.email.toLowerCase() === agentEmail.toLowerCase()) {
      setCurrentUser(updatedUser);
    }

    // Update counts on teams
    setTeams(prev => prev.map(t => {
      if (t.teamId === oldTeamId) {
        const updated = { ...t, agentCount: Math.max(0, (t.agentCount || 1) - 1) };
        firestoreSaveTeam(updated);
        return updated;
      }
      if (t.teamId === newTeamId) {
        const updated = { ...t, agentCount: (t.agentCount || 0) + 1 };
        firestoreSaveTeam(updated);
        return updated;
      }
      return t;
    }));

    firestoreSaveUser(updatedUser);
    playSound('click');
    addHeadline(`🔄 AGENT TRANSFERRED: ${targetUser.name} moved to ${newTeam.teamName}`, 'info', 'normal');
    logAudit('agent_team_reassigned', 'admin', { agentEmail, oldTeamId, newTeamId });
  };

  const removeAgentPod = (agentEmail: string) => {
    const targetUser = users.find(u => u.email.toLowerCase() === agentEmail.toLowerCase());
    if (!targetUser) return;

    setUsers(prev => prev.filter(u => u.email.toLowerCase() !== agentEmail.toLowerCase()));

    // Decrement team count
    setTeams(prev => prev.map(t => {
      if (t.teamId === targetUser.teamId) {
        const updated = { ...t, agentCount: Math.max(0, (t.agentCount || 1) - 1) };
        firestoreSaveTeam(updated);
        return updated;
      }
      return t;
    }));

    playSound('warning');
    addHeadline(`🗑️ AGENT POD REMOVED: ${targetUser.name} removed from floor`, 'warning', 'normal');
    logAudit('agent_pod_removed', 'admin', { agentEmail, teamId: targetUser.teamId });
  };

  const addShiftNote = (note: Omit<ShiftNote, 'noteId' | 'timestamp'>) => {
    const newNote: ShiftNote = {
      ...note,
      noteId: 'note_' + Date.now(),
      timestamp: Date.now(),
    };
    setShiftNotes(prev => [newNote, ...prev]);
    playSound('click');
    logAudit('shift_note_added', 'admin', { note });
  };

  const resetAllBreaks = () => {
    setBreaks([]);
    setWcTracking({});
    playSound('click');
    addHeadline('🔄 ALL ACTIVE AND LOGGED BREAKS RESET BY DEVELOPER GOD MODE', 'alert', 'critical');
    logAudit('reset_all_breaks', 'system', {});
  };

  const executeBatchAction = async (
    action: BatchActionType,
    selectedAgentEmails: string[],
    options?: { forcedBy?: string; warningReason?: string; warningNote?: string }
  ): Promise<{ success: boolean }> => {
    if (selectedAgentEmails.length === 0) return { success: false };
    const now = Date.now();
    const forcedBy = options?.forcedBy || currentUser?.name || 'Supervisor';

    // 1. Update local users state
    setUsers(prev => prev.map(u => {
      if (!selectedAgentEmails.includes(u.email)) return u;

      if (action === 'RESET_FLOOR') {
        return { ...u, status: 'FLOOR', isBreakAllowed: true, isBlocked: false, blockReason: undefined };
      } else if (action === 'END_BREAK') {
        return { ...u, status: 'FLOOR', isBreakAllowed: true, isBlocked: false };
      } else if (action === 'HOLD') {
        return { ...u, status: 'HOLD', isBreakAllowed: false };
      } else if (action === 'BLOCK') {
        return { ...u, status: 'BLOCKED', isBreakAllowed: false, isBlocked: true, blockReason: options?.warningReason || 'Supervisor Batch Break Block' };
      }
      return u;
    }));

    // 2. If RESET_FLOOR, END_BREAK or BLOCK, force-end active breaks
    if (action === 'RESET_FLOOR' || action === 'END_BREAK' || action === 'BLOCK') {
      setBreaks(prev => prev.map(b => {
        if (selectedAgentEmails.includes(b.agentEmail) && b.isActive) {
          const duration = Math.floor((now - b.startTime) / 1000);
          return {
            ...b,
            isActive: false,
            endTime: now,
            duration,
            isForcedEnded: true,
            forcedEndBy: forcedBy,
          };
        }
        return b;
      }));
    }

    // 3. If WARN, issue level 1 warning to all selected agents
    if (action === 'WARN') {
      const newWarnings: Warning[] = selectedAgentEmails.map((email, i) => {
        const agent = users.find(u => u.email === email);
        return {
          warningId: 'warn_batch_' + now + '_' + i,
          agentEmail: email,
          agentName: agent?.name || email,
          teamId: agent?.teamId || activeTeamId,
          level: 1,
          reason: options?.warningReason || 'Supervisor Batch Warning Issued',
          customNote: options?.warningNote || 'Batch action applied from Supervisor Deck',
          issuedBy: currentUser?.email || 'supervisor@bcflights.com',
          issuedByName: forcedBy,
          issuedAt: now,
          expiresAt: now + (3 * 24 * 60 * 60 * 1000),
          cleanShiftsCount: 0,
          requiredCleanShifts: 3,
          status: 'active',
          penalties: { maxBreakTime: 50, maxSlots: 4 },
        };
      });

      setWarnings(prev => [...newWarnings, ...prev]);
    }

    // 4. Trigger audio and visual feedback
    if (action === 'RESET_FLOOR') {
      playSound('break_end');
      addHeadline(`🧹 END-OF-SHIFT CLEANUP: ${selectedAgentEmails.length} agents reset to FLOOR status by ${forcedBy}`, 'alert', 'urgent');
    } else if (action === 'END_BREAK') {
      playSound('break_end');
      addHeadline(`☕ BATCH ACTION: Breaks ended for ${selectedAgentEmails.length} agents by ${forcedBy}`, 'break', 'urgent');
    } else if (action === 'HOLD') {
      playSound('warning');
      addHeadline(`⏸ BATCH ACTION: ${selectedAgentEmails.length} agents placed on HOLD status`, 'warning', 'normal');
    } else if (action === 'BLOCK') {
      playSound('limit_exceeded');
      addHeadline(`🚫 BATCH ACTION: ${selectedAgentEmails.length} agents BLOCKED from breaks by ${forcedBy}`, 'warning', 'urgent');
    } else if (action === 'WARN') {
      playSound('warning');
      addHeadline(`⚠️ BATCH ACTION: Level 1 Warning issued to ${selectedAgentEmails.length} agents`, 'warning', 'urgent');
    }

    // 5. Audit log
    logAudit('supervisor_batch_action', 'admin', {
      action,
      agentCount: selectedAgentEmails.length,
      agentEmails: selectedAgentEmails,
      options,
    });

    // 6. Firestore synchronization
    executeFirestoreBatchAction(action, selectedAgentEmails, breaks, users, {
      forcedBy,
      warningReason: options?.warningReason,
      warningNote: options?.warningNote,
    });

    return { success: true };
  };

  const resetAllFloor = async (targetTeamId?: string): Promise<{ success: boolean }> => {
    const isAll = !targetTeamId || targetTeamId.toUpperCase() === 'ALL';
    const targetAgents = isAll
      ? users.filter(u => u.role === 'agent')
      : users.filter(u => u.teamId === targetTeamId && u.role === 'agent');

    if (targetAgents.length === 0) return { success: false };

    const targetEmails = targetAgents.map(a => a.email);
    const forcedBy = currentUser?.name || 'Supervisor';
    const now = Date.now();

    // 1. Revert local users state
    setUsers(prev => prev.map(u => {
      if (targetEmails.includes(u.email)) {
        return {
          ...u,
          status: 'FLOOR',
          isBreakAllowed: true,
          isBlocked: false,
          blockReason: undefined,
        };
      }
      return u;
    }));

    // 2. Force end active breaks
    setBreaks(prev => prev.map(b => {
      if (targetEmails.includes(b.agentEmail) && b.isActive) {
        const duration = Math.floor((now - b.startTime) / 1000);
        return {
          ...b,
          isActive: false,
          endTime: now,
          duration,
          isForcedEnded: true,
          forcedEndBy: forcedBy,
        };
      }
      return b;
    }));

    playSound('break_end');
    const teamName = isAll ? 'Entire Sales Floor' : (teams.find(t => t.teamId === targetTeamId)?.teamName || targetTeamId);
    addHeadline(`🧹 END-OF-SHIFT RESET: All agents on ${teamName} reverted to FLOOR status by ${forcedBy}`, 'alert', 'urgent');
    logAudit('end_of_shift_reset_floor', 'admin', { teamId: targetTeamId, forcedBy, count: targetAgents.length });

    // 3. Firestore Batch Action Sync
    await executeFirestoreBatchAction('RESET_FLOOR', targetEmails, breaks, users, { forcedBy });
    return { success: true };
  };

  const blockTeamBreaks = async (teamId: string): Promise<{ success: boolean }> => {
    const targetTeam = teams.find(t => t.teamId === teamId);
    const teamName = targetTeam?.teamName || teamId.toUpperCase();
    const teamAgentList = users.filter(u => u.teamId === teamId && u.role === 'agent');
    if (teamAgentList.length === 0) return { success: false };

    const now = Date.now();
    const forcedBy = currentUser?.name || 'Supervisor';

    // 1. Update local users
    setUsers(prev => prev.map(u => {
      if (u.teamId === teamId && u.role === 'agent') {
        return {
          ...u,
          status: 'BLOCKED',
          isBreakAllowed: false,
          isBlocked: true,
          blockReason: 'Team-Wide Break Lockdown',
        };
      }
      return u;
    }));

    // 2. Update team state
    setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, isBreakBlocked: true } : t));

    // 3. Force-end any active breaks in this team
    setBreaks(prev => prev.map(b => {
      if (b.teamId === teamId && b.isActive) {
        const duration = Math.floor((now - b.startTime) / 1000);
        return {
          ...b,
          isActive: false,
          endTime: now,
          duration,
          isForcedEnded: true,
          forcedEndBy: forcedBy,
        };
      }
      return b;
    }));

    playSound('limit_exceeded');
    addHeadline(`🚫 TEAM BREAK LOCKDOWN: Breaks blocked for all members of ${teamName} by ${forcedBy}`, 'warning', 'critical');
    logAudit('team_breaks_blocked', 'admin', { teamId, teamName, forcedBy, agentCount: teamAgentList.length });

    // 4. Firestore Batch Update
    await executeFirestoreTeamBreakLock(teamId, true, teamAgentList, breaks, { forcedBy });
    return { success: true };
  };

  const unblockTeamBreaks = async (teamId: string): Promise<{ success: boolean }> => {
    const targetTeam = teams.find(t => t.teamId === teamId);
    const teamName = targetTeam?.teamName || teamId.toUpperCase();
    const teamAgentList = users.filter(u => u.teamId === teamId && u.role === 'agent');
    if (teamAgentList.length === 0) return { success: false };

    const forcedBy = currentUser?.name || 'Supervisor';

    // 1. Update local users
    setUsers(prev => prev.map(u => {
      if (u.teamId === teamId && u.role === 'agent') {
        return {
          ...u,
          status: 'FLOOR',
          isBreakAllowed: true,
          isBlocked: false,
          blockReason: undefined,
        };
      }
      return u;
    }));

    // 2. Update team state
    setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, isBreakBlocked: false } : t));

    playSound('break_end');
    addHeadline(`🟢 TEAM BREAKS RESTORED: Break privileges unblocked for all members of ${teamName}`, 'break', 'urgent');
    logAudit('team_breaks_unblocked', 'admin', { teamId, teamName, forcedBy, agentCount: teamAgentList.length });

    // 3. Firestore Batch Update
    await executeFirestoreTeamBreakLock(teamId, false, teamAgentList, breaks, { forcedBy });
    return { success: true };
  };

  const exportActivityLogsCSV = (timeframe: 'today' | 'yesterday' | '7days'): string => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const filteredLogs = dailyLogs.filter(log => {
      if (timeframe === 'today') {
        return log.dateString === todayStr;
      } else if (timeframe === 'yesterday') {
        return log.dateString === yesterdayStr;
      } else if (timeframe === '7days') {
        return new Date(log.dateString) >= sevenDaysAgo;
      }
      return true;
    });

    const headers = [
      'Agent Name',
      'Email',
      'Team',
      'Scheduled Start',
      'Actual Login',
      'Actual Logout',
      'Status',
      'Total Break Used (Min)',
      'Total WC Used (Min)',
      'Warnings',
      'Shift Extension (Min)',
      'Lateness Flag',
    ];

    const rows = filteredLogs.map(log => {
      const teamObj = teams.find(t => t.teamId === log.teamId);
      const teamName = log.teamName || teamObj?.teamName || log.teamId;
      const breakMin = Math.round((log.totalBreakSec || 0) / 60);
      const wcMin = Math.round((log.totalWcSec || 0) / 60);

      return [
        `"${(log.agentName || '').replace(/"/g, '""')}"`,
        `"${(log.email || '').replace(/"/g, '""')}"`,
        `"${(teamName || '').replace(/"/g, '""')}"`,
        `"${log.scheduledStart || '09:00'}"`,
        `"${log.actualLogin || '09:00'}"`,
        `"${log.actualLogout || '17:00'}"`,
        `"${log.status || 'SHIFT_ENDED'}"`,
        breakMin,
        wcMin,
        log.warningsCount || 0,
        log.shiftExtensionMin || 0,
        `"${log.latenessFlag || 'NONE'}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const downloadActivityLogsCSV = (timeframe: 'today' | 'yesterday' | '7days') => {
    const csvData = exportActivityLogsCSV(timeframe);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `BCFBreaks_Activity_Logs_${timeframe}_${dateStr}.csv`;

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    playSound('click');
    addHeadline(`📊 CSV EXPORT: Downloaded activity logs (${timeframe.toUpperCase()})`, 'info', 'normal');
    logAudit('csv_logs_exported', 'admin', { timeframe, fileName });
  };

  const downloadTeamBreakLogsCSV = (targetTeamId?: string, days = 7) => {
    const selectedId = targetTeamId || activeTeamId;
    const isAll = !selectedId || selectedId.toUpperCase() === 'ALL';
    const teamObj = teams.find(t => t.teamId === selectedId);
    const targetTeamName = isAll ? 'All_Teams' : (teamObj?.teamName || selectedId).replace(/\s+/g, '_');

    const cutoffTimestamp = Date.now() - (days * 24 * 60 * 60 * 1000);

    // Filter breaks from the last 7 days for the selected team
    const filteredBreaks = breaks.filter(b => {
      if (b.startTime < cutoffTimestamp) return false;
      if (isAll) return true;
      const agent = users.find(u => u.email === b.agentEmail);
      return b.teamId === selectedId || agent?.teamId === selectedId;
    });

    const headers = [
      'Break ID',
      'Agent Name',
      'Agent Email',
      'Team',
      'Date',
      'Break Type',
      'Slot Number',
      'Start Time',
      'End Time',
      'Duration (Seconds)',
      'Duration (Formatted)',
      'Status',
      'Is Bonus',
      'Forced Ended',
      'Forced By / Granted By',
    ];

    const rows = filteredBreaks.map(b => {
      const bTeam = teams.find(t => t.teamId === b.teamId)?.teamName || b.teamId;
      const startDate = new Date(b.startTime).toLocaleString();
      const endDate = b.endTime ? new Date(b.endTime).toLocaleString() : 'Active';
      const durationMins = Math.floor(b.duration / 60);
      const durationSecs = b.duration % 60;
      const formattedDuration = `${durationMins}m ${durationSecs}s`;
      const status = b.isActive ? 'Active' : b.isForcedEnded ? 'Forced Ended' : 'Completed';

      return [
        `"${b.breakId}"`,
        `"${(b.agentName || '').replace(/"/g, '""')}"`,
        `"${(b.agentEmail || '').replace(/"/g, '""')}"`,
        `"${(bTeam || '').replace(/"/g, '""')}"`,
        `"${b.date}"`,
        `"${b.breakType.toUpperCase()}"`,
        b.slotNumber || 1,
        `"${startDate}"`,
        `"${endDate}"`,
        b.duration,
        `"${formattedDuration}"`,
        `"${status}"`,
        b.isBonus ? 'YES' : 'NO',
        b.isForcedEnded ? 'YES' : 'NO',
        `"${(b.forcedEndBy || b.grantedBy || 'N/A').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `BCFBreaks_7Day_BreakLogs_${targetTeamName}_${dateStr}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    playSound('click');
    addHeadline(`📊 CSV EXPORT: Downloaded 7-day break logs for ${isAll ? 'All Teams' : teamObj?.teamName || selectedId}`, 'info', 'normal');
    logAudit('csv_break_logs_exported', 'admin', { teamId: selectedId, days, recordCount: filteredBreaks.length });
  };

  const exportDataJSON = () => {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      teams,
      users,
      breaks,
      wcTracking,
      warnings,
      headlines,
      shiftConfig,
      auditLogs,
      dailyLogs,
    };
    return JSON.stringify(payload, null, 2);
  };

  // Derived shift state: Shift runs 10 PM (22:00) to 6 AM (06:00) Egypt Time (UTC+2 / UTC+3)
  const isShiftActive = true; // Night shift simulated as active
  const timeRemainingInShift = "03h 48m";
  const activeTeamBreaks = breaks.filter(b => b.teamId === activeTeamId && b.isActive);
  const activeBreaksCount = activeTeamBreaks.length;
  const totalTeamBreakMinutes = breaks
    .filter(b => b.teamId === activeTeamId)
    .reduce((acc, b) => acc + Math.round(b.duration / 60), 0);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        realUser,
        isSimulating,
        exitSimulation,
        switchSimulatedUser,
        users,
        teams,
        activeTeamId,
        breaks,
        wcTracking,
        warnings,
        headlines,
        shiftConfig,
        messages,
        broadcasts,
        auditLogs,
        shiftNotes,
        dailyLogs,
        isShiftActive,
        timeRemainingInShift,
        activeBreaksCount,
        totalTeamBreakMinutes,
        activeModal,
        modalData,
        openModal,
        closeModal,
        isMessagesOpen,
        setIsMessagesOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isGodModeOpen,
        setIsGodModeOpen,
        isNewsPanelOpen,
        setIsNewsPanelOpen,
        isVoiceAssistantOpen,
        setIsVoiceAssistantOpen,
        isSearchGroundingOpen,
        setIsSearchGroundingOpen,
        loginAs,
        impersonateUser,
        startSimulation,
        loginWithAuth0,
        loginWithGoogle,
        setUserDirectly,
        logout,
        setActiveTeamId: handleSetActiveTeamId,
        updateTeam,
        createTeam,
        deleteTeam,
        addAgentPod,
        reassignAgentTeam,
        removeAgentPod,
        startBreak,
        endBreak,
        grantBonusBreak,
        issueWarning,
        appealWarning,
        decideAppeal,
        dismissWarning,
        toggleBlockAgent,
        updateUserAvatar,
        updateUserProfile,
        updateShiftConfig,
        triggerRallyMode,
        endRallyMode,
        sendBroadcast,
        acknowledgeBroadcast,
        sendMessage,
        addShiftNote,
        addHeadline,
        resetAllBreaks,
        exportDataJSON,
        executeBatchAction,
        resetAllFloor,
        blockTeamBreaks,
        unblockTeamBreaks,
        exportActivityLogsCSV,
        downloadActivityLogsCSV,
        downloadTeamBreakLogsCSV,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
