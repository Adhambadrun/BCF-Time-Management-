import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import {
  UserCheck,
  ArrowRightLeft,
  Shield,
  Zap,
  Search,
  Check,
  Users,
  Eye,
  Sliders,
  RotateCcw,
  X,
  Plus,
  Edit3,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { playSound } from '../../lib/sound';
import { User, UserRole, Team } from '../../types';
import { BCF_TEAMS } from '../../constants/bcfRoster';
import { motion, AnimatePresence } from 'motion/react';
import { SNAP } from '../../styles/motion-presets';

interface DevImpersonationPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const DevImpersonationPanel: React.FC<DevImpersonationPanelProps> = ({
  isOpen = true,
  onClose,
}) => {
  const {
    currentUser,
    realUser,
    isSimulating,
    exitSimulation,
    loginAs,
    startSimulation,
    users,
    teams,
    activeTeamId,
    setActiveTeamId,
    updateTeam,
    updateUserProfile,
    openModal,
    addHeadline,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DEV_ADMIN' | 'SUPERVISOR' | 'AGENT'>('ALL');
  const [selectedTeamTab, setSelectedTeamTab] = useState<string>('all');
  const [editingSupervisorTeamId, setEditingSupervisorTeamId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtered users for simulation grid
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.teamId && u.teamId.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (roleFilter === 'DEV_ADMIN') {
      return u.role === 'developer' || u.role === 'admin';
    }
    if (roleFilter === 'SUPERVISOR') {
      return u.role === 'supervisor';
    }
    if (roleFilter === 'AGENT') {
      return u.role === 'agent' || u.role === 'independent';
    }

    return true;
  });

  const supervisors = users.filter((u) => u.role === 'supervisor');

  const handleSimulate = (user: User) => {
    startSimulation(user);
    playSound('bonus');
  };

  const handleReassignSupervisor = (teamId: string, supervisorEmail: string) => {
    const supUser = users.find((u) => u.email.toLowerCase() === supervisorEmail.toLowerCase());
    if (!supUser) return;

    // Update team's supervisorEmail
    updateTeam(teamId, { supervisorEmail: supUser.email });

    // Update supervisor user's teamId and ensure role is supervisor
    updateUserProfile(supUser.email, {
      teamId: teamId,
      role: 'supervisor',
    });

    setEditingSupervisorTeamId(null);
    playSound('click');
    addHeadline(`👑 Reassigned ${supUser.name} as Supervisor for ${teamId.toUpperCase()}`, 'info', 'normal');
  };

  const handleResetToDefaultRoster = () => {
    // Reset teams to BCF_TEAMS configuration
    BCF_TEAMS.forEach((bcfTeam) => {
      updateTeam(bcfTeam.teamId, {
        supervisorEmail: bcfTeam.supervisor.email,
        teamName: bcfTeam.teamName,
      });

      // Update supervisor profile
      updateUserProfile(bcfTeam.supervisor.email, {
        role: 'supervisor',
        teamId: bcfTeam.teamId,
      });

      // Update agent profiles
      bcfTeam.agents.forEach((agent) => {
        const isDominick = agent.email.toLowerCase() === 'dominick@bcflights.com';
        updateUserProfile(agent.email, {
          role: isDominick ? 'supervisor' : 'agent',
          teamId: bcfTeam.teamId,
        });
      });
    });

    playSound('bonus');
    addHeadline('🔄 Reset team roster and supervisor hierarchy to default BCF_TEAMS matrix', 'info', 'normal');
  };

  return (
    <GlassPanel
      material="thick"
      className="w-full border-2 border-yellow-400/50 shadow-[0_0_50px_rgba(255,204,0,0.2)] p-4 sm:p-6 space-y-6"
    >
      {/* Top Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-yellow-400/20 border border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(255,204,0,0.4)]">
            <Zap className="w-6 h-6 fill-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-orbitron font-black text-xl sm:text-2xl text-white">
                DEVELOPER / ADMIN SIMULATION & TEAM MATRIX
              </h2>
              <span className="text-[10px] font-orbitron font-extrabold px-2 py-0.5 rounded-full bg-yellow-400 text-black">
                DEV ACCESS
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-inter">
              Impersonate any agent or supervisor role · Manage live team bindings · Inspect cross-team floor views
            </p>
          </div>
        </div>

        {/* Status Pill & Exit Simulation */}
        <div className="flex items-center gap-2">
          {isSimulating ? (
            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-orbitron text-amber-300 font-bold">
                SIMULATING: {currentUser?.name} ({currentUser?.role.toUpperCase()})
              </span>
              <button
                onClick={exitSimulation}
                className="ml-2 px-2.5 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-orbitron font-extrabold transition-all cursor-pointer"
              >
                Exit Simulation
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-orbitron text-emerald-300">
                ACTIVE USER: {currentUser?.name} ({currentUser?.role.toUpperCase()})
              </span>
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: HARDCODED BCF_TEAMS & SUPERVISOR ASSIGNMENTS MATRIX */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan" />
            <h3 className="font-orbitron font-bold text-sm text-cyan uppercase tracking-wider">
              Pod Teams & Supervisor Bindings Matrix
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">
              {teams.length} Teams
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefaultRoster}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-orbitron text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Reset all teams and supervisors to original BCF_TEAMS default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to BCF_TEAMS Default
            </button>

            <button
              onClick={() => openModal('manageTeams')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-[11px] font-orbitron text-yellow-300 font-bold transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              Manage Teams
            </button>
          </div>
        </div>

        {/* Teams Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {teams.map((team) => {
            const supervisorUser = users.find(
              (u) => u.email.toLowerCase() === team.supervisorEmail?.toLowerCase()
            );
            const teamAgents = users.filter(
              (u) =>
                u.teamId === team.teamId &&
                (u.role === 'agent' ||
                  u.role === 'independent' ||
                  (team.teamId === 'cai-1' && u.email.toLowerCase() === 'dominick@bcflights.com'))
            );
            const isEditing = editingSupervisorTeamId === team.teamId;

            return (
              <div
                key={team.teamId}
                className={`p-3.5 rounded-2xl border transition-all ${
                  activeTeamId === team.teamId
                    ? 'bg-yellow-400/10 border-yellow-400/70 shadow-[0_0_20px_rgba(255,204,0,0.15)]'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: team.teamColorAccent }}
                    />
                    <span className="font-orbitron font-bold text-sm text-white">{team.teamName}</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTeamId(team.teamId);
                      playSound('click');
                    }}
                    className={`text-[10px] font-orbitron px-2 py-0.5 rounded-full font-semibold transition-colors ${
                      activeTeamId === team.teamId
                        ? 'bg-yellow-400 text-black font-extrabold'
                        : 'bg-white/5 hover:bg-white/15 text-zinc-300'
                    }`}
                  >
                    {activeTeamId === team.teamId ? 'INSPECTING' : 'INSPECT'}
                  </button>
                </div>

                {/* Supervisor Field */}
                <div className="my-2 p-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between text-[10px] font-orbitron text-zinc-400 mb-1">
                    <span>SUPERVISOR:</span>
                    <button
                      onClick={() => setEditingSupervisorTeamId(isEditing ? null : team.teamId)}
                      className="text-yellow-400 hover:underline text-[9px] flex items-center gap-0.5"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      {isEditing ? 'Cancel' : 'Change'}
                    </button>
                  </div>

                  {isEditing ? (
                    <select
                      value={team.supervisorEmail || ''}
                      onChange={(e) => handleReassignSupervisor(team.teamId, e.target.value)}
                      className="w-full text-xs p-1 rounded-lg bg-zinc-900 border border-yellow-400/50 text-white font-inter"
                    >
                      <option value="">-- Select Supervisor --</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.email}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-yellow-300 truncate">
                        {supervisorUser?.name || team.supervisorEmail || 'None'}
                      </span>
                      {supervisorUser && (
                        <button
                          onClick={() => handleSimulate(supervisorUser)}
                          title={`Simulate supervisor ${supervisorUser.name}`}
                          className="px-1.5 py-0.5 rounded bg-yellow-400/20 hover:bg-yellow-400/40 text-yellow-300 text-[9px] font-orbitron font-bold shrink-0 ml-1"
                        >
                          ⚡ SIM
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Agents List Preview */}
                <div className="text-[10px] text-zinc-400 font-orbitron mb-1 flex items-center justify-between">
                  <span>AGENT PODS:</span>
                  <span className="font-mono text-zinc-300">{teamAgents.length}</span>
                </div>

                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {teamAgents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => handleSimulate(agent)}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 border border-white/5 hover:border-yellow-400/40 hover:bg-white/10 text-[11px] cursor-pointer transition-all group"
                      title={`Click to simulate ${agent.name}`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <img
                          src={agent.avatarUrl}
                          alt={agent.name}
                          className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/20"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-zinc-200 group-hover:text-yellow-300 truncate max-w-[90px] font-medium">{agent.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulate(agent);
                        }}
                        title={`Simulate agent ${agent.name}`}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 group-hover:bg-yellow-400/20 text-zinc-400 group-hover:text-yellow-300 font-mono font-bold"
                      >
                        ⚡ Sim
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: LIVE USER IMPERSONATION / SIMULATE ACCESS COMMAND CENTER */}
      <div className="space-y-4 pt-2 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-yellow-400" />
            <h3 className="font-orbitron font-bold text-sm text-yellow-400 uppercase tracking-wider">
              Simulate User Access & Identity Impersonation
            </h3>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron transition-all ${
                roleFilter === 'ALL'
                  ? 'bg-yellow-400 text-black font-extrabold'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('DEV_ADMIN')}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron transition-all ${
                roleFilter === 'DEV_ADMIN'
                  ? 'bg-amber-400 text-black font-extrabold'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300'
              }`}
            >
              Dev / Admins ({users.filter((u) => u.role === 'developer' || u.role === 'admin').length})
            </button>
            <button
              onClick={() => setRoleFilter('SUPERVISOR')}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron transition-all ${
                roleFilter === 'SUPERVISOR'
                  ? 'bg-cyan text-black font-extrabold'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300'
              }`}
            >
              Supervisors ({users.filter((u) => u.role === 'supervisor').length})
            </button>
            <button
              onClick={() => setRoleFilter('AGENT')}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron transition-all ${
                roleFilter === 'AGENT'
                  ? 'bg-emerald-400 text-black font-extrabold'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300'
              }`}
            >
              Floor Agents ({users.filter((u) => u.role === 'agent' || u.role === 'independent').length})
            </button>
          </div>
        </div>

        {/* Quick Dropdown & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Direct Dropdown Selector */}
          <div className="relative md:col-span-1">
            <select
              value={currentUser?.email || ''}
              onChange={(e) => {
                if (e.target.value) {
                  const target = users.find((u) => u.email.toLowerCase() === e.target.value.toLowerCase());
                  if (target) handleSimulate(target);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-yellow-400/50 text-xs text-yellow-300 font-orbitron font-semibold focus:outline-none focus:border-yellow-400 transition-all cursor-pointer"
            >
              <option value="" disabled>
                -- Select User to Impersonate --
              </option>
              <optgroup label="👑 Developers & Executive Admins">
                {users
                  .filter((u) => u.role === 'developer' || u.role === 'admin')
                  .map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.name} ({u.role.toUpperCase()}) - {u.email}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="⚡ CAI Supervisors">
                {users
                  .filter((u) => u.role === 'supervisor')
                  .map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.name} (Lead {u.teamId.toUpperCase()}) - {u.email}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="💼 CAI Agents">
                {users
                  .filter((u) => u.role === 'agent' || u.role === 'independent')
                  .map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.name} ({u.teamId.toUpperCase()}) - {u.email}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search identity by name, email (e.g. jay@bcflights.com, dominick@bcflights.com), role, or team..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-all font-inter"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-orbitron"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Identities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredUsers.map((user) => {
            const isCurrentUser = currentUser?.email.toLowerCase() === user.email.toLowerCase();
            const userTeam = teams.find((t) => t.teamId === user.teamId);

            return (
              <button
                key={user.id}
                onClick={() => handleSimulate(user)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isCurrentUser
                    ? 'bg-yellow-400/20 border-yellow-400 text-white font-bold ring-1 ring-yellow-400 shadow-[0_0_15px_rgba(255,204,0,0.3)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-400/50 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{user.email}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-0.5 shrink-0 ml-1">
                  <span
                    className={`text-[8px] font-orbitron font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      user.role === 'developer'
                        ? 'bg-crimson text-white'
                        : user.role === 'admin'
                        ? 'bg-amber-400 text-black'
                        : user.role === 'supervisor'
                        ? 'bg-cyan text-black'
                        : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {user.role}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {userTeam?.teamName || user.teamId}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
};
