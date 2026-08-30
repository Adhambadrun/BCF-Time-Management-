import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import {
  X,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  Save,
  Users,
  Search,
  Sparkles,
  ChevronDown,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { playSound } from '../../lib/sound';
import { UserRole, Team, User } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { SNAP } from '../../styles/motion-presets';

interface SystemAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'DEV', value: 'developer' },
  { label: 'ADMIN', value: 'admin' },
  { label: 'SUPERVISOR', value: 'supervisor' },
  { label: 'INDEPENDENT', value: 'independent' },
  { label: 'AGENT', value: 'agent' },
  { label: 'PREVIEWER', value: 'previewer' },
];

const COLOR_PRESETS = [
  '#FFD700', // Gold
  '#00E5FF', // Cyan
  '#FF003C', // Crimson
  '#8338EC', // Purple
  '#00FF88', // Emerald
  '#FF8800', // Orange
];

export const SystemAdminModal: React.FC<SystemAdminModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    users,
    teams,
    updateUserProfile,
    updateTeam,
    createTeam,
    deleteTeam,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSupervisor, setNewTeamSupervisor] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#FFD700');
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Track pending edits per user before saving: { [email]: { role, teamId, dirty, saved } }
  const [userEdits, setUserEdits] = useState<Record<string, { role: UserRole; teamId: string; dirty?: boolean; saved?: boolean }>>({});

  if (!isOpen) return null;

  // Filtered users for table
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const roleMatch = u.role.toLowerCase().includes(q);
    const team = teams.find((t) => t.teamId === u.teamId);
    const teamMatch = team?.teamName.toLowerCase().includes(q);
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      roleMatch ||
      teamMatch
    );
  });

  // Check supervisor assignments & teams
  const supervisors = users.filter((u) => u.role === 'supervisor');
  const supervisorsWithoutTeams = supervisors.filter((s) => !s.teamId || s.teamId === 'none' || s.teamId === '');
  const teamsWithoutSupervisor = teams.filter((t) => {
    if (!t.supervisorEmail) return true;
    const sup = users.find((u) => u.email.toLowerCase() === t.supervisorEmail.toLowerCase());
    return !sup || sup.role !== 'supervisor';
  });

  const allSupervisorsHaveTeams = supervisorsWithoutTeams.length === 0 && teamsWithoutSupervisor.length === 0;

  const handleRoleChange = (email: string, currentRole: UserRole, currentTeamId: string, newRole: UserRole) => {
    const existing = userEdits[email] || { role: currentRole, teamId: currentTeamId };
    setUserEdits((prev) => ({
      ...prev,
      [email]: {
        ...existing,
        role: newRole,
        dirty: true,
        saved: false,
      },
    }));
  };

  const handleTeamChange = (email: string, currentRole: UserRole, currentTeamId: string, newTeamId: string) => {
    const existing = userEdits[email] || { role: currentRole, teamId: currentTeamId };
    setUserEdits((prev) => ({
      ...prev,
      [email]: {
        ...existing,
        teamId: newTeamId,
        dirty: true,
        saved: false,
      },
    }));
  };

  const handleSaveUser = (user: User) => {
    const edit = userEdits[user.email];
    if (!edit) return;

    const newRole = edit.role;
    const newTeamId = edit.teamId;

    // Update user profile in context and Firestore
    updateUserProfile(user.email, {
      role: newRole,
      teamId: newTeamId,
    });

    // If assigned as supervisor to a team, update that team's supervisorEmail as well
    if (newRole === 'supervisor' && newTeamId && newTeamId !== 'none') {
      updateTeam(newTeamId, { supervisorEmail: user.email });
    }

    setUserEdits((prev) => ({
      ...prev,
      [user.email]: {
        role: newRole,
        teamId: newTeamId,
        dirty: false,
        saved: true,
      },
    }));

    playSound('bonus');

    setTimeout(() => {
      setUserEdits((prev) => {
        if (!prev[user.email]) return prev;
        return {
          ...prev,
          [user.email]: {
            ...prev[user.email],
            saved: false,
          },
        };
      });
    }, 2500);
  };

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const created = createTeam({
      teamName: newTeamName.trim(),
      teamColorAccent: newTeamColor,
      supervisorEmail: newTeamSupervisor || currentUser?.email || 'admin@bcflights.com',
      agentCount: 0,
      competitionScore: 1000,
    });

    if (newTeamSupervisor) {
      updateUserProfile(newTeamSupervisor, {
        teamId: created.teamId,
      });
    }

    setNewTeamName('');
    setNewTeamSupervisor('');
    playSound('bonus');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={SNAP}
        className="w-full max-w-5xl my-auto"
      >
        <GlassPanel
          material="ultrathick"
          className="p-6 md:p-8 border border-yellow-500/40 shadow-[0_0_80px_rgba(255,215,0,0.15)] relative overflow-hidden text-zinc-100 rounded-3xl"
        >
          {/* Subtle Ambient Background Mesh */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-5 mb-6 relative z-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-yellow-400/20 border border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-orbitron font-extrabold text-2xl md:text-3xl text-yellow-400 tracking-wide">
                    System Administration
                  </h2>
                  <p className="text-xs md:text-sm text-zinc-400 font-inter mt-0.5">
                    Manage roles, teams and supervisor assignments for the whole organization.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            {/* PENDING TEAM ASSIGNMENTS BANNER */}
            <div className="p-4 rounded-2xl bg-black/40 border border-yellow-500/30 backdrop-blur-md">
              <div className="text-[10px] font-orbitron uppercase text-yellow-400 font-bold tracking-widest mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-yellow-400" />
                <span>PENDING TEAM ASSIGNMENTS</span>
              </div>
              {allSupervisorsHaveTeams ? (
                <div className="text-sm font-inter text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>All supervisors have teams. ✓</span>
                </div>
              ) : (
                <div className="space-y-2 text-xs font-inter text-zinc-300">
                  {supervisorsWithoutTeams.map((sup) => (
                    <div key={sup.id} className="flex items-center justify-between bg-yellow-400/10 p-2 rounded-xl border border-yellow-400/20">
                      <span className="flex items-center gap-2 text-yellow-300">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        Supervisor <strong>{sup.name}</strong> ({sup.email}) has no assigned team.
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">Select team below</span>
                    </div>
                  ))}
                  {teamsWithoutSupervisor.map((tm) => (
                    <div key={tm.teamId} className="flex items-center justify-between bg-crimson/10 p-2 rounded-xl border border-crimson/30">
                      <span className="flex items-center gap-2 text-crimson">
                        <AlertCircle className="w-4 h-4 text-crimson" />
                        Team <strong>{tm.teamName}</strong> has no active supervisor.
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">Pending Assignment</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* USERS & ROLES CARD */}
            <div className="p-5 rounded-2xl bg-black/50 border border-white/15 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <h3 className="font-orbitron font-bold text-lg text-white flex items-center gap-2">
                  <span>USERS & ROLES</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/15 font-normal">
                    {users.length} Total Members
                  </span>
                </h3>

                {/* Quick Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or role..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Table Column Headers */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-3 py-1.5 text-[10px] font-orbitron uppercase tracking-wider text-zinc-400 border-b border-white/5">
                <div className="col-span-5">MEMBER</div>
                <div className="col-span-3">ROLE</div>
                <div className="col-span-3">TEAM</div>
                <div className="col-span-1 text-right">ACTION</div>
              </div>

              {/* Members List Scrollable */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    No members found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const edit = userEdits[user.email];
                    const activeRole = edit?.role || user.role;
                    const activeTeam = edit?.teamId !== undefined ? edit.teamId : user.teamId;
                    const isDirty = edit?.dirty;
                    const isSaved = edit?.saved;
                    const isSelf = currentUser?.email === user.email;

                    return (
                      <div
                        key={user.id || user.email}
                        className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center p-3 rounded-xl border transition-all ${
                          isDirty
                            ? 'bg-yellow-400/10 border-yellow-400/50 shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {/* Member Info */}
                        <div className="col-span-12 sm:col-span-5 flex items-center gap-3 truncate">
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="truncate">
                            <div className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                              <span className="truncate">{user.name}</span>
                              {isSelf && (
                                <span className="text-[10px] text-zinc-400 font-normal font-mono">(you)</span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
                          </div>
                        </div>

                        {/* Role Selector */}
                        <div className="col-span-6 sm:col-span-3">
                          <div className="relative">
                            <select
                              value={activeRole}
                              onChange={(e) =>
                                handleRoleChange(user.email, user.role, user.teamId, e.target.value as UserRole)
                              }
                              className="w-full appearance-none px-3 py-2 rounded-xl bg-zinc-900 border border-white/20 text-xs font-orbitron font-bold text-white focus:outline-none focus:border-yellow-400 cursor-pointer pr-8"
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white font-inter">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Team Selector */}
                        <div className="col-span-6 sm:col-span-3">
                          <div className="relative">
                            <select
                              value={activeTeam || 'none'}
                              onChange={(e) =>
                                handleTeamChange(user.email, user.role, user.teamId, e.target.value)
                              }
                              className="w-full appearance-none px-3 py-2 rounded-xl bg-zinc-900 border border-white/20 text-xs font-inter text-zinc-200 focus:outline-none focus:border-yellow-400 cursor-pointer pr-8"
                            >
                              <option value="none" className="bg-zinc-900 text-zinc-400 font-inter">
                                — No team —
                              </option>
                              {teams.map((t) => (
                                <option key={t.teamId} value={t.teamId} className="bg-zinc-900 text-white font-inter">
                                  {t.teamName}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="col-span-12 sm:col-span-1 flex justify-end">
                          {isSaved ? (
                            <span className="flex items-center gap-1 text-[10px] font-orbitron text-emerald-400 font-bold px-2 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/40">
                              <Check className="w-3 h-3" />
                              SAVED
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSaveUser(user)}
                              disabled={!isDirty}
                              className={`px-3 py-1.5 rounded-lg text-xs font-orbitron font-bold transition-all cursor-pointer ${
                                isDirty
                                  ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_15px_rgba(255,215,0,0.5)] transform hover:scale-105 active:scale-95'
                                  : 'bg-white/5 border border-white/10 text-zinc-500 cursor-not-allowed'
                              }`}
                            >
                              SAVE
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Explanatory Note */}
              <div className="text-[11px] text-zinc-400 font-inter pt-2 border-t border-white/5">
                Assigning a <strong className="text-zinc-200 font-semibold">SUPERVISOR</strong> to a team makes them that team's official supervisor — this resolves "N/A — pending assignment" states.
              </div>
            </div>

            {/* LOWER TWO-COLUMN GRID: CREATE A TEAM & TEAMS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: CREATE A TEAM */}
              <div className="p-5 rounded-2xl bg-black/50 border border-white/15 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-orbitron font-bold text-lg text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-yellow-400" />
                    <span>CREATE A TEAM</span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-inter mt-1">
                    New teams persist in the database and appear instantly for supervisors and agents.
                  </p>
                </div>

                <form onSubmit={handleCreateTeamSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-orbitron uppercase text-zinc-400 tracking-wider mb-1">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Team name (e.g. Titans)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/20 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-orbitron uppercase text-zinc-400 tracking-wider mb-1">
                      Assign Supervisor
                    </label>
                    <div className="relative">
                      <select
                        value={newTeamSupervisor}
                        onChange={(e) => setNewTeamSupervisor(e.target.value)}
                        className="w-full appearance-none px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-white/20 text-xs text-zinc-200 focus:outline-none focus:border-yellow-400 cursor-pointer pr-8"
                      >
                        <option value="" className="bg-zinc-900 text-zinc-400">
                          — No supervisor yet —
                        </option>
                        {users
                          .filter((u) => u.role === 'supervisor' || u.role === 'admin' || u.role === 'developer')
                          .map((u) => (
                            <option key={u.email} value={u.email} className="bg-zinc-900 text-white">
                              {u.name} ({u.role.toUpperCase()})
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-orbitron uppercase text-zinc-400 tracking-wider mb-1">
                      Team Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      {COLOR_PRESETS.map((col) => (
                        <button
                          type="button"
                          key={col}
                          onClick={() => setNewTeamColor(col)}
                          className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                            newTeamColor === col ? 'ring-2 ring-white scale-110 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!newTeamName.trim()}
                    className={`w-full py-3 rounded-xl font-orbitron font-bold text-xs tracking-wider transition-all cursor-pointer ${
                      newTeamName.trim()
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_0_20px_rgba(255,215,0,0.4)] transform hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-white/5 border border-white/10 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    CREATE TEAM
                  </button>
                </form>
              </div>

              {/* Right Column: TEAMS OVERVIEW */}
              <div className="p-5 rounded-2xl bg-black/50 border border-white/15 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-orbitron font-bold text-lg text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan" />
                      <span>TEAMS OVERVIEW</span>
                    </span>
                    <span className="text-xs font-mono text-zinc-400 font-normal">
                      {teams.length} Active Teams
                    </span>
                  </h3>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {teams.map((tm) => {
                    const memberCount = users.filter((u) => u.teamId === tm.teamId).length;
                    const sup = users.find((u) => u.email.toLowerCase() === tm.supervisorEmail?.toLowerCase());

                    return (
                      <div
                        key={tm.teamId}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: tm.teamColorAccent || '#00E5FF' }}
                          />
                          <div className="font-orbitron font-bold text-sm text-white truncate">
                            {tm.teamName}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <span className="text-xs text-zinc-400 font-inter">
                            {sup ? sup.name : 'No supervisor'} · {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </span>
                          {teams.length > 1 && (currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                            <button
                              type="button"
                              onClick={() => {
                                setTeamToDelete(tm);
                                setDeleteConfirmationText('');
                                playSound('warning');
                              }}
                              className="p-1.5 rounded-lg bg-crimson/20 hover:bg-crimson/30 text-crimson transition-colors"
                              title={`Dissolve ${tm.teamName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-zinc-400 font-inter pt-2 border-t border-white/5">
                  Upload team logos from the <code className="text-cyan font-mono">/team</code> page — logos are stored in the database, permanently.
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* TEXT CONFIRMATION MODAL FOR DESTRUCTIVE TEAM DELETION */}
      <AnimatePresence>
        {teamToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md p-6 rounded-3xl bg-zinc-950 border border-crimson/50 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-crimson/20 border border-crimson/40 text-crimson flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-orbitron font-extrabold text-base text-zinc-100 uppercase">
                    Dissolve Team {teamToDelete.teamName}?
                  </h3>
                  <p className="text-xs text-zinc-400 font-inter mt-0.5">
                    This will reassign all active members to the fallback team and remove this team.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-inter text-zinc-300">
                  Type <span className="font-mono font-bold text-crimson">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/20 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-crimson"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setTeamToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-orbitron font-semibold text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE'}
                  onClick={() => {
                    deleteTeam(teamToDelete.teamId);
                    setTeamToDelete(null);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-orbitron font-bold bg-crimson hover:bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,0,60,0.4)] transition-all cursor-pointer"
                >
                  Confirm Dissolution
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
