import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import {
  X,
  AlertTriangle,
  Gift,
  ShieldAlert,
  Camera,
  Send,
  Award,
  Clock,
  Sun,
  Cloud,
  User,
  CheckCircle,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Sparkles,
  ChevronDown,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Users,
  FolderPlus,
  ArrowRightLeft,
  Check,
  FileText,
  Download,
  UserX,
  Activity,
  TrendingUp,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { playSound } from '../../lib/sound';
import { BreakType, UserRole } from '../../types';
import { SystemAdminModal } from './SystemAdminModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { DevImpersonationPanel } from '../developer/DevImpersonationPanel';
import { motion, AnimatePresence } from 'motion/react';
import { GLIDE } from '../../styles/motion-presets';

const EMBLEM_PRESETS = [
  { label: 'BCF Official Crest', url: '/logo.png' },
  { label: 'Eagle Strike', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
  { label: 'Cyber Lion', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&auto=format&fit=crop&q=80' },
  { label: 'Dragon Crest', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=150&auto=format&fit=crop&q=80' },
  { label: 'Wolf Pack', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80' },
  { label: 'Cyber Falcon', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80' },
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
];

export const ModalManager: React.FC = () => {
  const {
    activeModal,
    modalData,
    closeModal,
    openModal,
    startBreak,
    issueWarning,
    grantBonusBreak,
    toggleBlockAgent,
    updateUserAvatar,
    updateUserProfile,
    appealWarning,
    sendBroadcast,
    addShiftNote,
    currentUser,
    users,
    teams,
    activeTeamId,
    setActiveTeamId,
    updateTeam,
    createTeam,
    deleteTeam,
    addAgentPod,
    reassignAgentTeam,
    removeAgentPod,
    breaks,
    warnings,
    endBreak,
    shiftConfig,
  } = useApp();

  // Local states for modal forms
  const [warnLevel, setWarnLevel] = useState<1 | 2 | 3>(1);
  const [warnReason, setWarnReason] = useState('Slot overrun by 2 minutes');
  const [warnNote, setWarnNote] = useState('');
  const [bonusReason, setBonusReason] = useState('Qualified 10+ BQ leads with live bookings! 🍕');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [blockReason, setBlockReason] = useState('Floor attendance audit');
  const [reassignTeamChoice, setReassignTeamChoice] = useState('');
  const [removeActionChoice, setRemoveActionChoice] = useState<'hold' | 'reassign' | 'delete'>('hold');
  const [appealText, setAppealText] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'urgent' | 'critical'>('normal');
  const [handoverText, setHandoverText] = useState('');
  const [handoverCategory, setHandoverCategory] = useState<'general' | 'warning' | 'praise' | 'alert'>('general');
  const [goalText, setGoalText] = useState('');
  const [goalTarget, setGoalTarget] = useState(10);
  const [adminStartBreakType, setAdminStartBreakType] = useState<BreakType>('regular');
  const [adminBreakFeedback, setAdminBreakFeedback] = useState<string | null>(null);

  // Replay time machine state
  const [replaySpeed, setReplaySpeed] = useState(1);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(45);

  // Edit Team state
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamLogo, setEditTeamLogo] = useState('');
  const [editTeamColor, setEditTeamColor] = useState('#FF003C');
  const [editSupervisorEmail, setEditSupervisorEmail] = useState('');

  // Add Agent Pod state
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentTeamId, setNewAgentTeamId] = useState(activeTeamId);
  const [newAgentRole, setNewAgentRole] = useState<UserRole>('agent');
  const [newAgentAvatar, setNewAgentAvatar] = useState(AVATAR_PRESETS[0]);
  const [newAgentMotto, setNewAgentMotto] = useState('');
  const [newAgentEmoji, setNewAgentEmoji] = useState('⚡');

  // Create Team state
  const [createTeamName, setCreateTeamName] = useState('');
  const [createTeamLogo, setCreateTeamLogo] = useState(EMBLEM_PRESETS[0].url);
  const [createTeamColor, setCreateTeamColor] = useState('#00E5FF');
  const [isCreatingNewTeamView, setIsCreatingNewTeamView] = useState(false);
  const [agentShiftNoteText, setAgentShiftNoteText] = useState('');

  // Populate edit fields when modal opens
  useEffect(() => {
    if (activeModal === 'editTeam' && modalData) {
      setEditTeamName(modalData.teamName || '');
      setEditTeamLogo(modalData.teamLogo || '');
      setEditTeamColor(modalData.teamColorAccent || '#FF003C');
      setEditSupervisorEmail(modalData.supervisorEmail || '');
    } else if (activeModal === 'addAgent') {
      setNewAgentName('');
      setNewAgentEmail('');
      setNewAgentTeamId(modalData?.teamId || activeTeamId);
      setNewAgentRole('agent');
      setNewAgentAvatar(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]);
      setNewAgentMotto('Target locked, ready to close');
      setNewAgentEmoji('⚡');
    } else if ((activeModal === 'agentDetail' || activeModal === 'shiftNote') && modalData?.agent) {
      setAgentShiftNoteText(modalData.agent.shiftNote || '');
    }
  }, [activeModal, modalData, activeTeamId]);

  // Handle local file upload converting to Base64 data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const KNOWN_MODAL_NAMES = [
    'warning',
    'bonus',
    'agentDetail',
    'agentReport',
    'removeAgent',
    'weather',
    'replay',
    'leaderboard',
    'broadcast',
    'profile',
    'handover',
    'changePicture',
    'blockAgent',
    'editTeam',
    'addAgent',
    'manageTeams',
    'systemAdmin',
    'systemManagement',
    'shortcuts',
    'shiftNote',
    'devImpersonation',
    'impersonate',
    'simulateAccess',
  ];

  const isModalOpen = Boolean(activeModal && KNOWN_MODAL_NAMES.includes(activeModal));

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          key="modal-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl overflow-y-auto"
        >
          <motion.div
            key={activeModal}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={GLIDE}
            className="w-full max-w-4xl flex justify-center items-center"
          >
      {/* 1. WARNING ISSUANCE MODAL (PART 12) */}
      {activeModal === 'warning' && (
        <GlassPanel material="thick" className="w-full max-w-lg p-6 border-2 border-yellow-400/50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-400 font-orbitron font-bold text-lg">
              <AlertTriangle className="w-5 h-5" />
              Issue Warning to {modalData?.agent?.name}
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            {/* Level selection buttons with penalty previews */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setWarnLevel(lvl as 1 | 2 | 3)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    warnLevel === lvl
                      ? lvl === 1
                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-300 font-bold'
                        : lvl === 2
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold'
                        : 'bg-crimson/20 border-crimson text-red-300 font-bold'
                      : 'bg-black/40 border-white/10 text-zinc-400'
                  }`}
                >
                  <div className="font-orbitron text-xs">Level {lvl}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    {lvl === 1 ? 'Badge Only (3 Shifts)' : lvl === 2 ? '50m Budget · 4 Slots' : '40m Budget · 4 Slots (7 Shifts)'}
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Preset Reason</label>
              <select
                value={warnReason}
                onChange={e => setWarnReason(e.target.value)}
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Slot overrun by 2 minutes">Slot overrun by 2 minutes</option>
                <option value="Exceeded daily 60m budget">Exceeded daily 60m budget</option>
                <option value="Exceeded 20m WC allowance">Exceeded 20m WC allowance</option>
                <option value="Restricted hour break attempt">Restricted hour break attempt</option>
                <option value="Floor discipline reminder">Floor discipline reminder</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Custom Note (Firm but humorous)</label>
              <textarea
                value={warnNote}
                onChange={e => setWarnNote(e.target.value)}
                placeholder="e.g. Nice try Solomon, but math is hard. 17m is not 15m! Keep it clean 😊"
                className="w-full h-20 bg-black/80 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none placeholder-zinc-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron">
                Cancel
              </button>
              <button
                onClick={() => {
                  issueWarning(modalData.agent.email, warnLevel, warnReason, warnNote || warnReason);
                  closeModal();
                }}
                className="px-6 py-2 rounded-xl bg-crimson hover:bg-red-600 text-white font-orbitron font-bold text-xs shadow-lg"
              >
                Issue Warning
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 2. BONUS BREAK MODAL ("10 BQ LEADS RULE") */}
      {activeModal === 'bonus' && (
        <GlassPanel material="thick" className="w-full max-w-md p-6 border-2 border-yellow-400/60 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-gold font-orbitron font-bold text-lg">
              <Gift className="w-5 h-5" />
              Grant +10m Bonus Break
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-xs font-inter text-yellow-200">
              💡 <span className="font-bold">Qualification Rule:</span> Agent must have actively worked at least 10 BQ leads during this shift. Free 10 minutes that does not deduct from the 60m budget or regular slots!
            </div>

            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Grant Reason / Note</label>
              <input
                type="text"
                value={bonusReason}
                onChange={e => setBonusReason(e.target.value)}
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron">
                Cancel
              </button>
              <button
                onClick={() => {
                  grantBonusBreak(modalData.agent.email, bonusReason);
                  closeModal();
                }}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-orbitron font-black text-xs shadow-lg"
              >
                Grant +10m Bonus 🍕
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 3. AGENT DETAIL SIDE PANEL (PART 16) */}
      {activeModal === 'agentDetail' && modalData?.agent && (
        <GlassPanel material="thick" className="w-full max-w-lg p-6 border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={modalData.agent.avatarUrl}
                alt={modalData.agent.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="font-orbitron font-bold text-lg text-white">{modalData.agent.name}</div>
                <div className="text-xs text-zinc-400">{modalData.agent.email}</div>
                <div className="text-[10px] text-yellow-400 font-teko text-base mt-0.5">
                  Streak: {modalData.agent.currentStreak} Days · Streak Best: {modalData.agent.longestStreak} Days
                </div>
              </div>
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          {/* 6 STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10">
              <div className="text-[10px] text-zinc-400 font-orbitron">TOTAL BREAK</div>
              <div className="text-xl font-teko text-yellow-400 font-bold">{modalData.agent.totalBreakTime}m / 60m</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10">
              <div className="text-[10px] text-zinc-400 font-orbitron">SLOTS USED</div>
              <div className="text-xl font-teko text-cyan font-bold">{breaks.filter(b => b.agentEmail === modalData.agent.email).length} / 5</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10">
              <div className="text-[10px] text-zinc-400 font-orbitron">WC TODAY</div>
              <div className="text-xl font-teko text-blue-400 font-bold">7m / 20m</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10">
              <div className="text-[10px] text-zinc-400 font-orbitron">WARNINGS</div>
              <div className="text-xl font-teko text-orange-400 font-bold">{modalData.agent.totalWarnings}</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10">
              <div className="text-[10px] text-zinc-400 font-orbitron">BONUS EARNED</div>
              <div className="text-xl font-teko text-gold font-bold">+{modalData.agent.totalBonusReceived * 10}m</div>
            </div>
            <div className="p-3 rounded-2xl bg-black/60 border border-white/10">
              <div className="text-[10px] text-zinc-400 font-orbitron">DISCIPLINE</div>
              <div className="text-xl font-teko text-emerald-400 font-bold">98.4% (A+)</div>
            </div>
          </div>

          {/* SHIFT NOTES CONTEXT UPDATES */}
          <div className="p-3.5 rounded-2xl bg-black/60 border border-yellow-400/30 mb-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-orbitron font-semibold text-yellow-400">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-yellow-400" />
                Shift Note / Context Update
              </span>
              {modalData.agent.shiftNoteUpdatedAt && (
                <span className="text-[10px] text-zinc-400 font-mono font-normal">
                  Updated {new Date(modalData.agent.shiftNoteUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <textarea
              value={agentShiftNoteText}
              onChange={(e) => setAgentShiftNoteText(e.target.value)}
              placeholder="E.g. On client escalations till 2am, taking late meal with lead approval..."
              rows={2}
              maxLength={200}
              className="w-full bg-black/80 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/50 resize-none font-inter"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-zinc-500">
                {agentShiftNoteText.length}/200 chars · Visible on supervisor deck
              </span>
              <button
                type="button"
                onClick={() => {
                  updateUserProfile(modalData.agent.email, {
                    shiftNote: agentShiftNoteText.trim(),
                    shiftNoteUpdatedAt: Date.now(),
                    shiftNoteAuthor: currentUser?.name || 'Agent',
                  });
                  playSound('bonus');
                }}
                className="px-3 py-1 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/50 text-yellow-300 text-[11px] font-orbitron font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Check className="w-3 h-3" />
                Save Note
              </button>
            </div>
          </div>

          {/* LAST 3 BREAK EVENTS (Timestamped Pattern Tracker for Admins & Management) */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-orbitron font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                Recent Break History (Last 3 Events)
              </span>
              <span className="text-[10px] text-zinc-400 font-orbitron">
                {breaks.filter(b => b.agentEmail === modalData.agent.email).length} Total Recorded
              </span>
            </div>

            <div className="space-y-1.5">
              {breaks
                .filter(b => b.agentEmail === modalData.agent.email)
                .sort((a, b) => b.startTime - a.startTime)
                .slice(0, 3)
                .map((b, idx) => {
                  const startStr = new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  const endStr = b.endTime ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'ACTIVE NOW';
                  const durationMin = Math.round((b.duration || (Date.now() - b.startTime) / 1000) / 60);
                  const isOvertime = !b.isActive && b.breakType === 'regular' && durationMin > 15;

                  return (
                    <div
                      key={b.breakId || idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        b.isActive
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : b.isForcedEnded
                          ? 'bg-red-500/10 border-red-500/20 text-zinc-300'
                          : 'bg-black/50 border-white/10 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-orbitron font-bold uppercase ${
                          b.breakType === 'regular'
                            ? 'bg-cyan/20 text-cyan border border-cyan/30'
                            : b.breakType === 'wc'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : b.breakType === 'meal'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {b.breakType}
                        </span>
                        <span className="font-orbitron text-[11px] text-white">
                          {startStr} → {endStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-teko text-sm text-yellow-400">
                          {durationMin} min
                        </span>
                        {b.isActive ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-orbitron bg-amber-400/20 text-amber-400 animate-pulse">
                            IN PROGRESS
                          </span>
                        ) : b.isForcedEnded ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-orbitron bg-crimson/20 text-crimson">
                            FORCE ENDED
                          </span>
                        ) : isOvertime ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-orbitron bg-orange-500/20 text-orange-400">
                            OVERTIME
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-orbitron bg-emerald-500/20 text-emerald-400">
                            COMPLETED
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {breaks.filter(b => b.agentEmail === modalData.agent.email).length === 0 && (
                <div className="p-3 text-center rounded-xl bg-black/30 border border-white/5 text-zinc-500 text-xs font-orbitron">
                  No break events recorded yet today.
                </div>
              )}
            </div>
          </div>

          {/* BREAK MANAGEMENT ACTIONS (START / FORCE END BREAK) */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-orbitron font-semibold text-zinc-300 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-cyan" />
                Floor Break Control
              </span>
              {breaks.some(b => b.agentEmail === modalData.agent.email && b.isActive) ? (
                <span className="text-[10px] font-orbitron font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  ON BREAK NOW
                </span>
              ) : (
                <span className="text-[10px] font-orbitron font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30">
                  AVAILABLE ON FLOOR
                </span>
              )}
            </div>

            {/* If Agent is actively on break: show large Force End Break action */}
            {breaks.some(b => b.agentEmail === modalData.agent.email && b.isActive) ? (
              <div className="p-3 rounded-2xl bg-crimson/10 border border-crimson/30 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-xs font-inter text-zinc-300">
                  Active break:{' '}
                  <span className="font-orbitron font-bold text-white uppercase">
                    {breaks.find(b => b.agentEmail === modalData.agent.email && b.isActive)?.breakType}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const brk = breaks.find(b => b.agentEmail === modalData.agent.email && b.isActive);
                    if (brk) {
                      endBreak(brk.breakId, currentUser?.email);
                      playSound('click');
                    }
                    closeModal();
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-crimson hover:bg-red-600 text-white font-orbitron font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  🛑 Force End Break
                </button>
              </div>
            ) : (
              /* If Agent is idle on floor: Allow Admin/Supervisor/Dev to start any break for them */
              <div className="p-3.5 rounded-2xl bg-black/60 border border-cyan/30 space-y-2.5">
                <div className="text-[11px] font-orbitron text-zinc-400 flex items-center justify-between">
                  <span>Start Break for {modalData.agent.name}:</span>
                  <span className="text-cyan font-bold capitalize">{adminStartBreakType} Break</span>
                </div>

                {adminBreakFeedback && (
                  <div className="p-2 rounded-xl bg-crimson/20 border border-crimson text-[11px] text-red-300 font-inter">
                    {adminBreakFeedback}
                  </div>
                )}

                {/* Break type pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { type: 'regular', label: 'Regular (15m)', icon: Coffee, color: 'text-cyan border-cyan/40 hover:border-cyan' },
                      { type: 'wc', label: 'WC / Rest (5m)', icon: Sparkles, color: 'text-blue-400 border-blue-400/40 hover:border-blue-400' },
                      { type: 'meal', label: 'Meal (30m)', icon: Clock, color: 'text-emerald-400 border-emerald-400/40 hover:border-emerald-400' },
                      { type: 'bonus', label: 'Bonus (+10m)', icon: Gift, color: 'text-yellow-400 border-yellow-400/40 hover:border-yellow-400' },
                    ] as const
                  ).map((b) => (
                    <button
                      key={b.type}
                      type="button"
                      onClick={() => {
                        setAdminStartBreakType(b.type);
                        setAdminBreakFeedback(null);
                        playSound('hover_tick');
                      }}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        adminStartBreakType === b.type
                          ? 'bg-cyan/20 border-cyan text-white shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                          : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <b.icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-orbitron font-semibold whitespace-nowrap">{b.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const res = startBreak(modalData.agent.email, adminStartBreakType);
                    if (res.success) {
                      playSound('break_start');
                      closeModal();
                    } else {
                      setAdminBreakFeedback(res.message);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-black" />
                  START BREAK FOR {modalData.agent.name.toUpperCase()}
                </button>
              </div>
            )}
          </div>

          {/* ACTIONS GRID */}
          <div className="space-y-3">
            {/* Dev / Admin Team Reassignment and Pod Controls */}
            {(currentUser?.role === 'developer' || currentUser?.role === 'admin') && (
              <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-orbitron text-zinc-300 flex items-center gap-1.5 font-bold">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-yellow-400" />
                    Team & Floor Assignment
                  </span>
                  <span className="text-[10px] text-zinc-400 font-teko text-sm">
                    Current: {teams.find(t => t.teamId === modalData.agent.teamId)?.teamName || modalData.agent.teamId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    defaultValue={modalData.agent.teamId}
                    onChange={(e) => {
                      reassignAgentTeam(modalData.agent.email, e.target.value);
                      playSound('click');
                    }}
                    className="flex-1 bg-black/80 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-orbitron"
                  >
                    {teams.map(t => (
                      <option key={t.teamId} value={t.teamId}>
                        Assign to {t.teamName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove agent pod "${modalData.agent.name}" from the floor?`)) {
                        removeAgentPod(modalData.agent.email);
                        closeModal();
                        playSound('click');
                      }
                    }}
                    className="p-2 rounded-xl bg-crimson/20 hover:bg-crimson/30 border border-crimson/40 text-red-300 text-xs font-orbitron flex items-center gap-1 transition-colors"
                    title="Remove Agent Pod from Floor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="text-xs font-orbitron text-zinc-400 mb-1">Administrative Controls</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  toggleBlockAgent(modalData.agent.email);
                  closeModal();
                }}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-orbitron text-xs font-semibold text-center cursor-pointer transition-colors"
              >
                {modalData.agent.isBlocked ? '🟢 Unblock Agent' : '🚫 Block Punching'}
              </button>
              <button
                onClick={() => {
                  grantBonusBreak(modalData.agent.email, 'Qualified floor performance');
                  closeModal();
                }}
                className="p-2.5 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 font-orbitron text-xs font-semibold text-center cursor-pointer transition-colors"
              >
                🎁 Grant +10m Bonus
              </button>
              <button
                onClick={() => {
                  issueWarning(modalData.agent.email, 1, 'Administrative hold', 'Discipline check');
                  closeModal();
                }}
                className="p-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-orbitron text-xs font-semibold text-center cursor-pointer transition-colors"
              >
                ⚠️ Issue Warning
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 3.B. AGENT AUDIT REPORT & BREAK LOG MODAL */}
      {activeModal === 'agentReport' && modalData?.agent && (
        <GlassPanel material="thick" className="w-full max-w-2xl p-6 border-2 border-cyan/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={modalData.agent.avatarUrl}
                alt={modalData.agent.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-cyan shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-orbitron font-bold text-lg">{modalData.agent.name}</h3>
                  <span className="text-[10px] font-orbitron font-bold uppercase px-2 py-0.5 rounded bg-cyan/20 text-cyan border border-cyan/40">
                    {modalData.agent.role}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                  <span>{modalData.agent.email}</span>
                  <span>·</span>
                  <span className="text-yellow-400 font-orbitron">
                    Team: {teams.find(t => t.teamId === modalData.agent.teamId)?.teamName || modalData.agent.teamId}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5 font-inter text-xs">
            {/* KPI Performance Metric Cards */}
            {(() => {
              const agentBreaks = breaks.filter(b => b.agentEmail.toLowerCase() === modalData.agent.email.toLowerCase());
              const todayStr = new Date().toISOString().split('T')[0];
              const todayBreaks = agentBreaks.filter(b => b.date === todayStr);
              const totalMinutesToday = todayBreaks.reduce((acc, b) => acc + Math.round((b.duration || 0) / 60), 0);
              const wcMinutesToday = todayBreaks
                .filter(b => b.breakType === 'wc')
                .reduce((acc, b) => acc + Math.round((b.duration || 0) / 60), 0);
              const overtimeIncidents = todayBreaks.filter(b => (b.duration || 0) > (shiftConfig?.maxSlotDuration || 15) * 60).length;
              const agentWarnings = warnings.filter(w => w.agentEmail.toLowerCase() === modalData.agent.email.toLowerCase());

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Total Break Time */}
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                      <div className="text-[10px] font-orbitron text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan" /> Total Break Time
                      </div>
                      <div className="text-2xl font-teko text-cyan font-bold leading-none">
                        {totalMinutesToday} <span className="text-zinc-500 text-base font-normal">/ 60m</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {Math.max(0, 60 - totalMinutesToday)}m daily allowance remaining
                      </div>
                    </div>

                    {/* Breaks Taken Today */}
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                      <div className="text-[10px] font-orbitron text-zinc-400 flex items-center gap-1">
                        <Coffee className="w-3 h-3 text-yellow-400" /> Breaks Count
                      </div>
                      <div className="text-2xl font-teko text-yellow-400 font-bold leading-none">
                        {todayBreaks.length} <span className="text-zinc-500 text-base font-normal">slots</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {todayBreaks.filter(b => b.isActive).length > 0 ? '🟢 1 active break right now' : 'Floor Active'}
                      </div>
                    </div>

                    {/* WC Usage */}
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                      <div className="text-[10px] font-orbitron text-zinc-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-blue-400" /> WC Time
                      </div>
                      <div className="text-2xl font-teko text-blue-400 font-bold leading-none">
                        {wcMinutesToday} <span className="text-zinc-500 text-base font-normal">/ 20m</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {todayBreaks.filter(b => b.breakType === 'wc').length} restroom trip(s)
                      </div>
                    </div>

                    {/* Warnings & Penalty */}
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                      <div className="text-[10px] font-orbitron text-zinc-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-crimson" /> Active Warnings
                      </div>
                      <div className="text-2xl font-teko text-crimson font-bold leading-none">
                        {agentWarnings.filter(w => !w.isAppealed).length} <span className="text-zinc-500 text-base font-normal">active</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {overtimeIncidents > 0 ? `⚠️ ${overtimeIncidents} overrun(s) logged` : 'No violations today'}
                      </div>
                    </div>

                    {/* Bonus Breaks Earned */}
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                      <div className="text-[10px] font-orbitron text-zinc-400 flex items-center gap-1">
                        <Gift className="w-3 h-3 text-emerald-400" /> Bonus Rewards
                      </div>
                      <div className="text-2xl font-teko text-emerald-400 font-bold leading-none">
                        {modalData.agent.totalBonusReceived || 0} <span className="text-zinc-500 text-base font-normal">granted</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        +10m bonus break allowance
                      </div>
                    </div>

                    {/* Streak & Punctuality */}
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                      <div className="text-[10px] font-orbitron text-zinc-400 flex items-center gap-1">
                        <Award className="w-3 h-3 text-purple-400" /> Punctuality Streak
                      </div>
                      <div className="text-2xl font-teko text-purple-400 font-bold leading-none">
                        {modalData.agent.currentStreak || 0} <span className="text-zinc-500 text-base font-normal">days</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Best: {modalData.agent.longestStreak || modalData.agent.currentStreak || 0} days clean
                      </div>
                    </div>
                  </div>

                  {/* Break History Log Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-orbitron font-bold text-sm text-zinc-200 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-cyan" />
                        Shift Break Activity History ({agentBreaks.length})
                      </div>

                      {/* Export Single Agent CSV */}
                      <button
                        onClick={() => {
                          const headers = 'BreakID,Date,AgentName,Email,Team,Type,StartTime,EndTime,DurationSec,DurationMin,Status,EndedBy\n';
                          const rows = agentBreaks.map(b => {
                            const startTimeStr = b.startTime ? new Date(b.startTime).toLocaleTimeString() : 'N/A';
                            const endTimeStr = b.endTime ? new Date(b.endTime).toLocaleTimeString() : (b.isActive ? 'IN_PROGRESS' : 'N/A');
                            const durMin = Math.round((b.duration || 0) / 60);
                            const status = b.isActive ? 'ACTIVE' : ((b.duration || 0) > 15 * 60 ? 'OVERTIME' : 'COMPLETED');
                            return `"${b.breakId}","${b.date}","${modalData.agent.name}","${b.agentEmail}","${b.teamId}","${b.breakType}","${startTimeStr}","${endTimeStr}","${b.duration}","${durMin}","${status}","${b.endedBy || 'self'}"`;
                          }).join('\n');

                          const csvBlob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(csvBlob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `Agent_Report_${modalData.agent.name.replace(/\s+/g, '_')}_${todayStr}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          playSound('click');
                        }}
                        className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 font-orbitron text-[11px] flex items-center gap-1 transition-colors"
                        title="Download CSV report of this agent's break logs"
                      >
                        <Download className="w-3 h-3 text-cyan" />
                        Export Agent CSV
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-2xl bg-black/60 border border-white/10 divide-y divide-white/5">
                      {agentBreaks.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 font-orbitron text-xs">
                          No break events logged for this agent pod yet.
                        </div>
                      ) : (
                        agentBreaks.map((b, idx) => {
                          const durMin = Math.floor((b.duration || 0) / 60);
                          const durSec = (b.duration || 0) % 60;
                          const isOvertime = (b.duration || 0) > (shiftConfig?.maxSlotDuration || 15) * 60;

                          return (
                            <div key={b.breakId || idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${b.isActive ? 'bg-cyan animate-pulse' : (isOvertime ? 'bg-crimson' : 'bg-emerald-400')}`} />
                                <span className="font-orbitron font-semibold text-white uppercase text-[11px]">
                                  {b.breakType}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  {b.startTime ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : b.date}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <span className={`font-mono font-bold ${isOvertime ? 'text-crimson' : 'text-zinc-200'}`}>
                                  {durMin}m {durSec.toString().padStart(2, '0')}s
                                </span>
                                <span className={`text-[10px] font-orbitron px-1.5 py-0.5 rounded ${
                                  b.isActive ? 'bg-cyan/20 text-cyan' : isOvertime ? 'bg-crimson/20 text-crimson' : 'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {b.isActive ? 'LIVE' : isOvertime ? 'OVERTIME' : 'DONE'}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Disciplinary Warnings List if any */}
                  {agentWarnings.length > 0 && (
                    <div className="p-3 rounded-2xl bg-crimson/10 border border-crimson/30 space-y-2">
                      <div className="font-orbitron font-bold text-xs text-crimson flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Disciplinary Record ({agentWarnings.length} Warnings)
                      </div>
                      <div className="space-y-1.5">
                        {agentWarnings.map((w, i) => (
                          <div key={w.warningId || i} className="p-2 rounded-xl bg-black/50 text-[11px] flex items-center justify-between gap-2">
                            <div>
                              <span className="font-orbitron font-bold text-yellow-400 mr-2">Level {w.level}</span>
                              <span className="text-zinc-300">{w.reason}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">{w.timestamp ? new Date(w.timestamp).toLocaleDateString() : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openModal('bonus', { agent: modalData.agent });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 font-orbitron font-semibold text-xs flex items-center gap-1"
                >
                  <Gift className="w-3.5 h-3.5" /> Grant Bonus
                </button>
                <button
                  onClick={() => {
                    openModal('warning', { agent: modalData.agent });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-crimson/20 hover:bg-crimson/30 border border-crimson/40 text-red-400 font-orbitron font-semibold text-xs flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Issue Warning
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={closeModal}
                  className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-orbitron font-bold text-xs"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 3.C. REMOVE / HOLD / REASSIGN AGENT MODAL */}
      {activeModal === 'removeAgent' && modalData?.agent && (
        <GlassPanel material="thick" className="w-full max-w-md p-6 border-2 border-crimson/50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-crimson font-orbitron font-bold text-lg">
              <UserX className="w-5 h-5" />
              Manage Agent Floor Status
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 font-inter text-xs">
            {/* Agent Preview */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/60 border border-white/10">
              <img
                src={modalData.agent.avatarUrl}
                alt={modalData.agent.name}
                className="w-11 h-11 rounded-full object-cover border border-white/20"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="font-orbitron font-bold text-white text-sm truncate">{modalData.agent.name}</div>
                <div className="text-[11px] text-zinc-400 truncate">{modalData.agent.email}</div>
                <div className="text-[10px] text-yellow-400 font-orbitron">
                  Current Team: {teams.find(t => t.teamId === modalData.agent.teamId)?.teamName || modalData.agent.teamId}
                </div>
              </div>
            </div>

            {/* Action Selection Radio */}
            <div className="space-y-2">
              <label className="block text-xs font-orbitron text-zinc-300">Select Management Action:</label>

              {/* Option 1: Hold / Coaching */}
              <label
                onClick={() => setRemoveActionChoice('hold')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  removeActionChoice === 'hold' ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-black/40 border-white/10 text-zinc-400'
                }`}
              >
                <div>
                  <div className="font-orbitron font-bold text-xs text-white">Place Pod on Floor Hold</div>
                  <div className="text-[11px] text-zinc-400">Temporarily freeze break access for 1-on-1 meeting or audit.</div>
                </div>
                <input type="radio" name="removeChoice" checked={removeActionChoice === 'hold'} onChange={() => {}} className="accent-amber-400" />
              </label>

              {/* Option 2: Reassign Team */}
              <label
                onClick={() => setRemoveActionChoice('reassign')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  removeActionChoice === 'reassign' ? 'bg-cyan/20 border-cyan text-cyan' : 'bg-black/40 border-white/10 text-zinc-400'
                }`}
              >
                <div>
                  <div className="font-orbitron font-bold text-xs text-white">Reassign to Another Team</div>
                  <div className="text-[11px] text-zinc-400">Transfer agent pod seamlessly to a different floor pod group.</div>
                </div>
                <input type="radio" name="removeChoice" checked={removeActionChoice === 'reassign'} onChange={() => {}} className="accent-cyan" />
              </label>

              {/* Option 3: Permanently Remove */}
              <label
                onClick={() => setRemoveActionChoice('delete')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  removeActionChoice === 'delete' ? 'bg-crimson/20 border-crimson text-red-300' : 'bg-black/40 border-white/10 text-zinc-400'
                }`}
              >
                <div>
                  <div className="font-orbitron font-bold text-xs text-red-400">Delete Pod from Active Floor</div>
                  <div className="text-[11px] text-zinc-400">Remove agent pod from active floor display.</div>
                </div>
                <input type="radio" name="removeChoice" checked={removeActionChoice === 'delete'} onChange={() => {}} className="accent-crimson" />
              </label>
            </div>

            {/* Secondary Option: Reassign Destination */}
            {removeActionChoice === 'reassign' && (
              <div>
                <label className="block text-xs font-orbitron text-zinc-300 mb-1">Select Destination Team *</label>
                <select
                  value={reassignTeamChoice || modalData.agent.teamId}
                  onChange={e => setReassignTeamChoice(e.target.value)}
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-orbitron"
                >
                  {teams.map(t => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamName} ({t.agentCount || 0} agents)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (removeActionChoice === 'hold') {
                    toggleBlockAgent(modalData.agent.email, modalData.agent.isBlocked ? undefined : 'Floor Supervisor Hold');
                    closeModal();
                  } else if (removeActionChoice === 'reassign') {
                    const targetTeam = reassignTeamChoice || teams.find(t => t.teamId !== modalData.agent.teamId)?.teamId;
                    if (targetTeam) {
                      reassignAgentTeam(modalData.agent.email, targetTeam);
                    }
                    closeModal();
                  } else if (removeActionChoice === 'delete') {
                    removeAgentPod(modalData.agent.email);
                    closeModal();
                  }
                }}
                className="px-6 py-2 rounded-xl bg-crimson hover:bg-red-600 text-white font-orbitron font-bold text-xs shadow-lg"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 4. CAIRO WEATHER WIDGET MODAL (PART 19.O) */}
      {activeModal === 'weather' && (
        <GlassPanel material="thick" className="w-full max-w-md p-6 border border-cyan/40 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-cyan font-orbitron font-bold text-lg">
              <Sun className="w-5 h-5 text-yellow-400" />
              Cairo Night-Shift Weather Intel
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 font-inter text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/60 border border-white/10">
              <div>
                <div className="text-[10px] font-orbitron text-zinc-400">CAIRO, EGYPT (CURRENT)</div>
                <div className="text-4xl font-teko text-yellow-400 font-bold">22°C / 72°F</div>
                <div className="text-zinc-300">Clear Night Sky · Wind 8 km/h NW</div>
              </div>
              <Cloud className="w-12 h-12 text-cyan" />
            </div>

            <div className="p-3.5 rounded-2xl bg-cyan/10 border border-cyan/30 text-cyan">
              🧥 <span className="font-bold">Shift Outfit Recommendation:</span> Air conditioning is running high on floor 3. A light hoodie or pullover is ideal between 2 AM and 5 AM. Sunrise in Cairo at 5:28 AM.
            </div>

            <button onClick={closeModal} className="w-full py-2 rounded-xl bg-zinc-800 text-zinc-300 font-orbitron text-xs">
              Dismiss
            </button>
          </div>
        </GlassPanel>
      )}

      {/* 5. SHIFT REPLAY TIME MACHINE (PART 19.H) */}
      {activeModal === 'replay' && (
        <GlassPanel material="thick" className="w-full max-w-2xl p-6 border border-yellow-400/40 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-400 font-orbitron font-bold text-lg">
              <Clock className="w-5 h-5" />
              Shift Replay (Time Machine)
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-5 font-inter text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Simulating Shift Timeline: <span className="text-yellow-400 font-bold">02:45 AM Cairo Time</span></span>
              <div className="flex items-center gap-2">
                {[1, 2, 4].map(s => (
                  <button
                    key={s}
                    onClick={() => setReplaySpeed(s)}
                    className={`px-2 py-1 rounded text-[10px] font-orbitron font-bold ${replaySpeed === s ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Timeline Bar */}
            <div className="relative w-full h-8 bg-zinc-900 rounded-xl overflow-hidden border border-white/10 flex items-center px-2">
              <div
                className="h-full bg-gradient-to-r from-crimson via-yellow-400 to-cyan opacity-40 rounded-lg transition-all duration-300"
                style={{ width: `${replayProgress}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white]"
                style={{ left: `${replayProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setReplayPlaying(!replayPlaying)}
                className="px-6 py-2 rounded-xl bg-yellow-400 text-black font-orbitron font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                {replayPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {replayPlaying ? 'Pause Replay' : 'Play Timeline'}
              </button>
              <button
                onClick={() => setReplayProgress(10)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-orbitron text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Rewind
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 6. WEEKLY FLOOR LEADERBOARDS (PART 19.G) */}
      {activeModal === 'leaderboard' && (
        <GlassPanel material="thick" className="w-full max-w-lg p-6 border border-gold/40 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-gold font-orbitron font-bold text-lg">
              <Award className="w-5 h-5" />
              Floor Competition Leaderboards
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            {/* Podium */}
            <div className="flex items-end justify-center gap-3 py-4">
              <div className="flex flex-col items-center">
                <div className="text-xs font-orbitron text-zinc-300">Zayn</div>
                <div className="w-20 h-20 bg-zinc-700/60 rounded-t-xl flex items-center justify-center font-orbitron font-bold text-silver border border-white/10">
                  #2 (1,380)
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xs font-orbitron text-yellow-400 font-bold">Fabiola 👑</div>
                <div className="w-24 h-28 bg-yellow-400/20 rounded-t-xl flex items-center justify-center font-orbitron font-black text-yellow-400 border border-yellow-400 text-lg shadow-[0_0_20px_rgba(255,204,0,0.3)]">
                  #1 (1,420)
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xs font-orbitron text-zinc-400">Solomon</div>
                <div className="w-20 h-16 bg-zinc-800/60 rounded-t-xl flex items-center justify-center font-orbitron font-bold text-amber-600 border border-white/10">
                  #3 (1,290)
                </div>
              </div>
            </div>

            <button onClick={closeModal} className="w-full py-2 rounded-xl bg-zinc-800 text-zinc-300 font-orbitron text-xs">
              Close
            </button>
          </div>
        </GlassPanel>
      )}

      {/* 7. BROADCAST MODAL (PART 19.K) */}
      {activeModal === 'broadcast' && (
        <GlassPanel material="thick" className="w-full max-w-md p-6 border-2 border-crimson/50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-crimson font-orbitron font-bold text-lg">
              <Radio className="w-5 h-5" />
              Floor Shift Broadcast
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Broadcast Message</label>
              <textarea
                value={broadcastText}
                onChange={e => setBroadcastText(e.target.value)}
                placeholder="Type urgent announcement to all floor agents..."
                className="w-full h-24 bg-black/80 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Priority</label>
              <select
                value={broadcastPriority}
                onChange={e => setBroadcastPriority(e.target.value as any)}
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="normal">Normal Announcement</option>
                <option value="urgent">Urgent Floor Alert</option>
                <option value="critical">Critical Full-Screen Emergency</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (broadcastText.trim()) {
                    sendBroadcast({
                      messageType: broadcastPriority === 'critical' ? 'emergency' : 'announcement',
                      message: broadcastText,
                      target: 'all',
                      sentBy: currentUser?.email || 'admin',
                      sentByName: currentUser?.name || 'Supervisor',
                      requireAcknowledgment: broadcastPriority === 'critical',
                      priority: broadcastPriority,
                    });
                    closeModal();
                  }
                }}
                className="px-6 py-2 rounded-xl bg-crimson hover:bg-red-600 text-white font-orbitron font-bold text-xs shadow-lg"
              >
                Transmit Blast 📢
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 8. PROFILE & GOAL SETTING MODAL */}
      {activeModal === 'profile' && currentUser && (
        <GlassPanel material="thick" className="w-full max-w-md p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-zinc-100 font-orbitron font-bold text-lg">
              <User className="w-5 h-5 text-cyan" />
              My Profile & Daily Goal
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 text-xs font-inter">
            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Personal Motto</label>
              <input
                type="text"
                defaultValue={currentUser.personalMotto || ''}
                onChange={e => updateUserProfile(currentUser.email, { personalMotto: e.target.value })}
                placeholder="e.g. Close deals, take 10-min tea breaks ☕"
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Daily Shift Goal</label>
              <input
                type="text"
                defaultValue={currentUser.dailyGoal?.text || '12 Qualified BQ Calls'}
                onChange={e => setGoalText(e.target.value)}
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                if (goalText) {
                  updateUserProfile(currentUser.email, {
                    dailyGoal: {
                      text: goalText,
                      target: goalTarget,
                      progress: 4,
                      completed: false,
                    },
                  });
                }
                closeModal();
              }}
              className="w-full py-2.5 rounded-xl bg-yellow-400 text-black font-orbitron font-bold text-xs"
            >
              Save Profile Preferences
            </button>
          </div>
        </GlassPanel>
      )}

      {/* 9. SHIFT HANDOVER MODAL */}
      {activeModal === 'handover' && (
        <GlassPanel material="thick" className="w-full max-w-md p-6 border border-yellow-400/40 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-400 font-orbitron font-bold text-lg">
              <Award className="w-5 h-5" />
              Supervisor Shift Handover
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 text-xs font-inter">
            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Category</label>
              <select
                value={handoverCategory}
                onChange={e => setHandoverCategory(e.target.value as any)}
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="general">General Floor Notes</option>
                <option value="warning">Warning / Discipline Summary</option>
                <option value="praise">Praise & Top Closers</option>
                <option value="alert">System or Lead Inventory Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Handover Notes for Next Shift</label>
              <textarea
                value={handoverText}
                onChange={e => setHandoverText(e.target.value)}
                placeholder="Summary of floor capacity, active pipeline, and pending agent appeals..."
                className="w-full h-24 bg-black/80 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (handoverText.trim()) {
                    addShiftNote({
                      supervisorEmail: currentUser?.email || 'supervisor',
                      supervisorName: currentUser?.name || 'Supervisor',
                      teamId: currentUser?.teamId || 'team_strikers',
                      noteText: handoverText,
                      category: handoverCategory,
                      forShiftDate: new Date().toISOString().split('T')[0],
                      isPinned: true,
                      mentionedAgents: [],
                    });
                    closeModal();
                  }
                }}
                className="px-6 py-2 rounded-xl bg-yellow-400 text-black font-orbitron font-bold text-xs"
              >
                Submit Handover Note
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 10. CHANGE PICTURE MODAL */}
      {activeModal === 'changePicture' && modalData?.agent && (
        <GlassPanel material="thick" className="w-full max-w-md p-6 border border-purple-400/40 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-purple-400 font-orbitron font-bold text-lg">
              <Camera className="w-5 h-5" />
              Update Profile Picture
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={newAvatarUrl}
                onChange={e => setNewAvatarUrl(e.target.value)}
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newAvatarUrl.trim()) {
                    updateUserAvatar(modalData.agent.email, newAvatarUrl.trim());
                    closeModal();
                  }
                }}
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs"
              >
                Update Photo
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 11. BLOCK / UNBLOCK BREAKS MODAL */}
      {activeModal === 'blockAgent' && modalData?.agent && (
        <GlassPanel material="thick" className="w-full max-w-md p-6 border-2 border-crimson/50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-crimson font-orbitron font-bold text-lg">
              <ShieldAlert className="w-5 h-5" />
              {modalData.agent.isBlocked ? 'Unblock Break Access' : 'Block Break Access'}
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 font-inter text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-white/10">
              <img
                src={modalData.agent.avatarUrl}
                alt={modalData.agent.name}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="font-orbitron font-bold text-white text-sm">{modalData.agent.name}</div>
                <div className="text-[11px] text-zinc-400">{modalData.agent.email}</div>
              </div>
            </div>

            {!modalData.agent.isBlocked ? (
              <>
                <p className="text-zinc-300">
                  Blocking this agent will prevent them from punching in or taking any breaks until unblocked by a supervisor or admin.
                </p>
                <div>
                  <label className="block text-xs font-orbitron text-zinc-300 mb-1">Reason for Block</label>
                  <select
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Floor attendance audit">Floor attendance audit</option>
                    <option value="Performance check / Meeting required">Performance check / Meeting required</option>
                    <option value="Repeated break overtime penalty">Repeated break overtime penalty</option>
                    <option value="Unauthorized break attempt">Unauthorized break attempt</option>
                    <option value="Shift management hold">Shift management hold</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                This agent is currently blocked ({modalData.agent.blockReason || 'Administrative hold'}). Unblocking will restore normal break punch capabilities immediately.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron">
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleBlockAgent(modalData.agent.email, modalData.agent.isBlocked ? undefined : blockReason);
                  closeModal();
                }}
                className={`px-6 py-2 rounded-xl font-orbitron font-bold text-xs shadow-lg ${
                  modalData.agent.isBlocked
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-crimson hover:bg-red-600 text-white shadow-[0_0_15px_rgba(255,0,60,0.4)]'
                }`}
              >
                {modalData.agent.isBlocked ? 'Confirm Unblock' : 'Block Break Access'}
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 12. EDIT TEAM MODAL (TEAM NAME, LOGO PICTURE, ACCENT COLOR) */}
      {activeModal === 'editTeam' && (
        <GlassPanel material="thick" className="w-full max-w-lg p-6 border-2 border-yellow-400/50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-400 font-orbitron font-bold text-lg">
              <Edit3 className="w-5 h-5" />
              Edit Team Profile
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 font-inter text-xs">
            {/* Live Team Card Preview */}
            <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/15 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full overflow-hidden border-2 shadow-lg shrink-0"
                style={{ borderColor: editTeamColor }}
              >
                <img
                  src={editTeamLogo || EMBLEM_PRESETS[0].url}
                  alt={editTeamName || 'Team Logo'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-orbitron text-zinc-400 uppercase">Live Preview</div>
                <div
                  className="font-orbitron font-black text-xl truncate"
                  style={{ color: editTeamColor }}
                >
                  {editTeamName || 'Team Name'}
                </div>
                <div className="text-[11px] text-zinc-400 font-teko text-base">
                  Supervisor: {editSupervisorEmail || 'Unassigned'}
                </div>
              </div>
            </div>

            {/* Team Name Input */}
            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1">Team Name</label>
              <input
                type="text"
                value={editTeamName}
                onChange={e => setEditTeamName(e.target.value)}
                placeholder="e.g. STRIKERS, TITANS, APEX"
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-orbitron uppercase"
              />
            </div>

            {/* Team Picture / Logo URL and Upload */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-orbitron text-zinc-300">Team Logo / Picture</label>
                <label className="cursor-pointer text-[10px] font-orbitron text-yellow-400 hover:underline flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Upload from Device
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileUpload(e, setEditTeamLogo)}
                  />
                </label>
              </div>
              <input
                type="text"
                value={editTeamLogo}
                onChange={e => setEditTeamLogo(e.target.value)}
                placeholder="Paste Image URL or select preset below..."
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />

              {/* Preset Emblem selector */}
              <div className="mt-2">
                <div className="text-[10px] font-orbitron text-zinc-400 mb-1">Preset Emblems</div>
                <div className="grid grid-cols-6 gap-2">
                  {EMBLEM_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditTeamLogo(p.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border transition-all ${
                        editTeamLogo === p.url ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-white/20 hover:border-white/60'
                      }`}
                      title={p.label}
                    >
                      <img src={p.url} alt={p.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      {editTeamLogo === p.url && (
                        <div className="absolute inset-0 bg-yellow-400/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-black font-bold" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Accent Color Picker */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-orbitron text-zinc-300 mb-1">Accent Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editTeamColor}
                    onChange={e => setEditTeamColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-black border border-white/20 p-0.5"
                  />
                  <input
                    type="text"
                    value={editTeamColor}
                    onChange={e => setEditTeamColor(e.target.value)}
                    className="flex-1 bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-orbitron text-zinc-300 mb-1">Supervisor Email</label>
                <input
                  type="email"
                  value={editSupervisorEmail}
                  onChange={e => setEditSupervisorEmail(e.target.value)}
                  placeholder="supervisor@bcflights.com"
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modalData?.teamId && editTeamName.trim()) {
                    updateTeam(modalData.teamId, {
                      teamName: editTeamName.trim(),
                      teamLogo: editTeamLogo || EMBLEM_PRESETS[0].url,
                      teamColorAccent: editTeamColor,
                      supervisorEmail: editSupervisorEmail.trim(),
                    });
                    playSound('click');
                    closeModal();
                  }
                }}
                className="px-6 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-orbitron font-bold text-xs shadow-lg"
              >
                Save Team Changes
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 13. ADD AGENT POD MODAL (ADD AGENTS TO ANY TEAM) */}
      {activeModal === 'addAgent' && (
        <GlassPanel material="thick" className="w-full max-w-lg p-6 border-2 border-cyan/50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-cyan font-orbitron font-bold text-lg">
              <Sparkles className="w-5 h-5" />
              Add Agent Pod to Floor
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 font-inter text-xs">
            {/* Live Pod Preview */}
            <div className="p-3.5 rounded-2xl bg-black/70 border border-cyan/30 flex items-center gap-3">
              <img
                src={newAgentAvatar || AVATAR_PRESETS[0]}
                alt={newAgentName || 'Agent Avatar'}
                className="w-12 h-12 rounded-full object-cover border-2 border-cyan shadow-md shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-orbitron font-bold text-sm text-white truncate">
                    {newAgentName || 'New Agent'}
                  </span>
                  <span>{newAgentEmoji}</span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">{newAgentEmail || 'agent@domain.com'}</div>
                <div className="text-[10px] font-orbitron text-yellow-400">
                  Target Team: {teams.find(t => t.teamId === newAgentTeamId)?.teamName || newAgentTeamId}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-orbitron text-zinc-300 mb-1">Agent Full Name *</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  placeholder="e.g. Maya Tarek"
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-orbitron"
                />
              </div>

              <div>
                <label className="block text-xs font-orbitron text-zinc-300 mb-1">Floor Email Address (@bcflights.com) *</label>
                <input
                  type="email"
                  value={newAgentEmail}
                  onChange={e => setNewAgentEmail(e.target.value)}
                  placeholder="e.g. maya@bcflights.com"
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-orbitron text-zinc-300 mb-1">Assign to Team *</label>
                <select
                  value={newAgentTeamId}
                  onChange={e => setNewAgentTeamId(e.target.value)}
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-orbitron"
                >
                  {teams.map(t => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamName} ({t.agentCount} pods)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-orbitron text-zinc-300 mb-1">Role</label>
                <select
                  value={newAgentRole}
                  onChange={e => setNewAgentRole(e.target.value as UserRole)}
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-orbitron"
                >
                  <option value="agent">Floor Agent</option>
                  <option value="supervisor">Floor Supervisor</option>
                  <option value="admin">System Admin</option>
                  <option value="developer">Developer / God Mode</option>
                </select>
              </div>
            </div>

            {/* Avatar URL / Presets / Upload */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-orbitron text-zinc-300">Agent Picture / Avatar</label>
                <label className="cursor-pointer text-[10px] font-orbitron text-cyan hover:underline flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileUpload(e, setNewAgentAvatar)}
                  />
                </label>
              </div>
              <input
                type="text"
                value={newAgentAvatar}
                onChange={e => setNewAgentAvatar(e.target.value)}
                placeholder="Paste avatar URL..."
                className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none mb-2"
              />

              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNewAgentAvatar(url)}
                    className={`rounded-xl overflow-hidden aspect-square border transition-all ${
                      newAgentAvatar === url ? 'border-cyan ring-2 ring-cyan' : 'border-white/20 hover:border-white/60'
                    }`}
                  >
                    <img src={url} alt="preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Motto & Emoji */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-orbitron text-zinc-300 mb-1">Personal Motto</label>
                <input
                  type="text"
                  value={newAgentMotto}
                  onChange={e => setNewAgentMotto(e.target.value)}
                  placeholder="e.g. Always qualify first"
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-orbitron text-zinc-300 mb-1">Power Emoji</label>
                <select
                  value={newAgentEmoji}
                  onChange={e => setNewAgentEmoji(e.target.value)}
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-base text-white focus:outline-none"
                >
                  {['⚡', '🚀', '🎯', '🔥', '👑', '💎', '🏆', '🦁', '🌟', '🛡️'].map(emoji => (
                    <option key={emoji} value={emoji}>{emoji}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron">
                Cancel
              </button>
              <button
                onClick={() => {
                  let formattedEmail = newAgentEmail.trim().toLowerCase();
                  if (formattedEmail && !formattedEmail.includes('@')) {
                    formattedEmail = `${formattedEmail}@bcflights.com`;
                  }
                  if (!formattedEmail.endsWith('@bcflights.com')) {
                    alert('Only @bcflights.com emails (e.g. name@bcflights.com) are permitted.');
                    return;
                  }
                  if (newAgentName.trim() && formattedEmail && newAgentTeamId) {
                    addAgentPod({
                      name: newAgentName.trim(),
                      email: formattedEmail,
                      teamId: newAgentTeamId,
                      role: newAgentRole,
                      avatarUrl: newAgentAvatar || AVATAR_PRESETS[0],
                      personalMotto: newAgentMotto.trim() || 'Floor ready',
                      avatarStyle: {
                        shape: 'circle',
                        border: 'cyber',
                        glow: 'cyan',
                        badgeIcon: newAgentEmoji,
                      },
                    });
                    playSound('break_start');
                    closeModal();
                  } else {
                    alert('Please provide agent name and email address.');
                  }
                }}
                className="px-6 py-2 rounded-xl bg-cyan hover:bg-cyan-400 text-black font-orbitron font-black text-xs shadow-lg"
              >
                Deploy Agent Pod 🚀
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* 14. MANAGE TEAMS & PODS HUB (FULL CROSS-TEAM ADMIN) */}
      {activeModal === 'manageTeams' && (
        <GlassPanel material="thick" className="w-full max-w-3xl p-6 border-2 border-yellow-400/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2 text-yellow-400 font-orbitron font-bold text-lg">
              <Users className="w-5 h-5" />
              Teams & Agent Pods Command Hub
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-6 font-inter text-xs">
            {/* Top Stats and New Team Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/60 border border-white/10">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[10px] font-orbitron text-zinc-400 uppercase">Total Teams</div>
                  <div className="text-2xl font-teko text-yellow-400 font-bold">{teams.length} Teams</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="text-[10px] font-orbitron text-zinc-400 uppercase">Total Floor Agents</div>
                  <div className="text-2xl font-teko text-cyan font-bold">{users.filter(u => u.role === 'agent').length} Pods</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreatingNewTeamView(!isCreatingNewTeamView)}
                  className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-orbitron font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <FolderPlus className="w-4 h-4" />
                  {isCreatingNewTeamView ? 'Cancel New Team' : '+ Create New Team'}
                </button>
                <button
                  onClick={() => openModal('addAgent', { teamId: activeTeamId })}
                  className="px-4 py-2 rounded-xl bg-cyan/20 hover:bg-cyan/30 border border-cyan/40 text-cyan font-orbitron font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  + Add Agent Pod
                </button>
              </div>
            </div>

            {/* Create New Team Subform */}
            {isCreatingNewTeamView && (
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-yellow-400/40 space-y-3">
                <div className="font-orbitron font-bold text-sm text-yellow-300">Create New Floor Team</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-orbitron text-zinc-300 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={createTeamName}
                      onChange={e => setCreateTeamName(e.target.value)}
                      placeholder="e.g. VANGUARDS"
                      className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-orbitron uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-orbitron text-zinc-300 mb-1">Accent Color</label>
                    <input
                      type="color"
                      value={createTeamColor}
                      onChange={e => setCreateTeamColor(e.target.value)}
                      className="w-full h-9 rounded-xl bg-black border border-white/20 cursor-pointer p-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-orbitron text-zinc-300 mb-1">Logo URL</label>
                    <input
                      type="text"
                      value={createTeamLogo}
                      onChange={e => setCreateTeamLogo(e.target.value)}
                      className="w-full bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (createTeamName.trim()) {
                        const newId = `team_${createTeamName.trim().toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
                        createTeam({
                          teamId: newId,
                          teamName: createTeamName.trim().toUpperCase(),
                          teamLogo: createTeamLogo || EMBLEM_PRESETS[0].url,
                          teamColorAccent: createTeamColor,
                          supervisorEmail: currentUser?.email || 'admin@bcflights.com',
                          agentCount: 0,
                          competitionScore: 1000,
                          defaultLanguage: 'en',
                        });
                        setIsCreatingNewTeamView(false);
                        setCreateTeamName('');
                        playSound('break_start');
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-yellow-400 text-black font-orbitron font-bold text-xs"
                  >
                    Confirm & Provision Team
                  </button>
                </div>
              </div>
            )}

            {/* Teams Accordion List */}
            <div className="space-y-4">
              {teams.map(team => {
                const teamAgentsList = users.filter(u => u.teamId === team.teamId && u.role === 'agent');

                return (
                  <div
                    key={team.teamId}
                    className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3 transition-colors hover:border-white/20"
                  >
                    {/* Team Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={team.teamLogo}
                          alt={team.teamName}
                          className="w-12 h-12 rounded-full object-cover border-2"
                          style={{ borderColor: team.teamColorAccent }}
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-orbitron font-bold text-base text-white">
                              {team.teamName}
                            </span>
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: team.teamColorAccent }}
                            />
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            Supervisor: <span className="text-zinc-200">{team.supervisorEmail || 'None'}</span> · {teamAgentsList.length} Active Pods
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveTeamId(team.teamId);
                            closeModal();
                            playSound('click');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 font-orbitron text-xs"
                        >
                          View on Floor
                        </button>
                        <button
                          onClick={() => openModal('editTeam', team)}
                          className="p-1.5 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 text-xs font-orbitron flex items-center gap-1"
                          title="Edit team name, logo picture, and accent color"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => openModal('addAgent', { teamId: team.teamId })}
                          className="px-3 py-1.5 rounded-xl bg-cyan/20 hover:bg-cyan/30 border border-cyan/40 text-cyan font-orbitron text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Pod
                        </button>
                        {teams.length > 1 && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete team "${team.teamName}"? Agents will need reassignment.`)) {
                                deleteTeam(team.teamId);
                                playSound('click');
                              }
                            }}
                            className="p-1.5 rounded-xl bg-crimson/20 hover:bg-crimson/30 text-red-400 text-xs"
                            title="Delete team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Team Members List */}
                    <div className="pt-2 border-t border-white/5">
                      <div className="text-[10px] font-orbitron text-zinc-400 mb-2 uppercase tracking-wider">
                        Assigned Floor Pods ({teamAgentsList.length})
                      </div>
                      {teamAgentsList.length === 0 ? (
                        <div className="text-zinc-500 text-xs italic py-1">No agents assigned to this team yet.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {teamAgentsList.map(agent => (
                            <div
                              key={agent.id}
                              className="p-2 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={agent.avatarUrl}
                                  alt={agent.name}
                                  className="w-7 h-7 rounded-full object-cover border border-white/20"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="truncate">
                                  <div className="font-orbitron font-semibold text-xs text-white truncate">{agent.name}</div>
                                  <div className="text-[10px] text-zinc-400 truncate">{agent.email}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => openModal('agentDetail', { agent })}
                                  className="p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-300 text-[10px] font-orbitron"
                                  title="View and Manage Pod"
                                >
                                  Detail
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Remove ${agent.name} from floor?`)) {
                                      removeAgentPod(agent.email);
                                      playSound('click');
                                    }
                                  }}
                                  className="p-1 rounded bg-crimson/20 hover:bg-crimson/30 text-red-400"
                                  title="Remove agent pod"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      )}

      {/* System Administration / Management Modal */}
      <SystemAdminModal
        isOpen={activeModal === 'systemAdmin' || activeModal === 'systemManagement'}
        onClose={closeModal}
      />

      {/* Keyboard Shortcuts Overlay Modal */}
      <KeyboardShortcutsModal
        isOpen={activeModal === 'shortcuts'}
        onClose={closeModal}
      />

      {/* Dedicated Agent Shift Note Modal */}
      {activeModal === 'shiftNote' && modalData?.agent && (
        <GlassPanel material="thick" className="w-full max-w-md p-6 border-2 border-yellow-400/40 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-400 font-orbitron font-bold text-base">
              <FileText className="w-5 h-5 text-yellow-400" />
              <span>Shift Note: {modalData.agent.name}</span>
            </div>
            <button onClick={closeModal} className="text-zinc-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-zinc-400 font-inter">
              Log a short, context-relevant update for this shift. Appears in the Supervisor Dashboard and team floor pod.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {[
                'Taking late meal break',
                'On VIP client escalation',
                'Assisting team lead',
                'Technical issue / IT ticket',
                'Backlog processing queue',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAgentShiftNoteText(preset)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[11px] text-zinc-300 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-orbitron text-zinc-300 mb-1.5">Context Update</label>
              <textarea
                value={agentShiftNoteText}
                onChange={(e) => setAgentShiftNoteText(e.target.value)}
                placeholder="Type update here..."
                rows={3}
                maxLength={200}
                className="w-full bg-black/80 border border-white/20 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 resize-none font-inter"
              />
              <div className="text-[10px] text-zinc-500 text-right mt-1">
                {agentShiftNoteText.length}/200 characters
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-orbitron hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateUserProfile(modalData.agent.email, {
                    shiftNote: agentShiftNoteText.trim(),
                    shiftNoteUpdatedAt: Date.now(),
                    shiftNoteAuthor: currentUser?.name || 'Agent',
                  });
                  playSound('bonus');
                  closeModal();
                }}
                className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-orbitron font-bold shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                Save Shift Note
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Dev / Admin Simulation & Team Matrix Panel */}
      {(activeModal === 'devImpersonation' || activeModal === 'impersonate' || activeModal === 'simulateAccess') && (
        <div className="w-full max-w-5xl">
          <DevImpersonationPanel isOpen={true} onClose={closeModal} />
        </div>
      )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
