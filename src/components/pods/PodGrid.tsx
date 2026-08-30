import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AgentPod } from './AgentPod';
import { TeamOverviewWidget } from './TeamOverviewWidget';
import { motion, AnimatePresence } from 'motion/react';
import { GLIDE, SNAP } from '../../styles/motion-presets';
import { Clock, Sparkles, CheckSquare, Square, Search, Filter, Layers, Eye, Users, ChevronRight, ArrowUpDown } from 'lucide-react';
import { playSound } from '../../lib/sound';
import { useBatchActions, BatchActionType } from '../../hooks/useBatchActions';
import { useSupervisorShortcuts } from '../../hooks/useSupervisorShortcuts';
import { BatchActionToolbar } from '../supervisor/BatchActionToolbar';
import { TeamControlBar } from '../supervisor/TeamControlBar';
import { Team, User } from '../../types';

export interface PodGridProps {
  selectedTeamId?: string;
}

export const PodGrid: React.FC<PodGridProps> = ({ selectedTeamId: propSelectedTeamId }) => {
  const {
    users,
    teams,
    activeTeamId,
    setActiveTeamId,
    currentUser,
    breaks,
    shiftConfig,
    endBreak,
    openModal,
    executeBatchAction: executeContextBatchAction,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BREAK' | 'FLOOR' | 'BLOCKED'>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'status'>('default');

  // Can this user switch teams? (Admin, Developer, or Supervisor)
  const canSwitchTeams =
    currentUser?.role === 'developer' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'supervisor';

  // Strict role isolation: Agents ONLY see their assigned team
  const rawTeamId = propSelectedTeamId ?? activeTeamId;
  const effectiveTeamId =
    currentUser?.role === 'agent'
      ? currentUser.teamId
      : rawTeamId;

  const isAllTeamsView =
    effectiveTeamId?.toUpperCase() === 'ALL' || effectiveTeamId === 'all';

  const currentTeam = teams.find(t => t.teamId === effectiveTeamId) || teams[0];

  // All agent pods across the company
  const allFloorAgents = useMemo(
    () => users.filter(u => u.role === 'agent'),
    [users]
  );

  // Active breaks in the entire floor or current team
  const activeFloorBreaks = useMemo(
    () => breaks.filter(b => b.isActive),
    [breaks]
  );

  // Filter agents based on view mode (All vs Single Team)
  const baseAgents = useMemo(() => {
    if (isAllTeamsView) {
      return allFloorAgents;
    }
    return users.filter(u => u.teamId === effectiveTeamId && u.role === 'agent');
  }, [isAllTeamsView, allFloorAgents, users, effectiveTeamId]);

  // Helper to sort agents by status (On Break -> On Hold -> Blocked -> On Floor -> Offline)
  const sortAgents = (agentList: User[]) => {
    if (sortBy !== 'status') return agentList;

    return [...agentList].sort((a, b) => {
      const aOnBreak = breaks.some(brk => brk.agentEmail === a.email && brk.isActive);
      const bOnBreak = breaks.some(brk => brk.agentEmail === b.email && brk.isActive);

      const getStatusPriority = (agent: User, onBreak: boolean) => {
        if (onBreak) return 1; // Actively on break - top priority
        if (agent.status === 'HOLD') return 2; // On Hold
        if (agent.isBlocked || agent.status === 'BLOCKED') return 3; // Blocked
        if (agent.status === 'FLOOR' || !agent.status) return 4; // On Floor
        return 5; // Offline / Shift Ended
      };

      const prioA = getStatusPriority(a, aOnBreak);
      const prioB = getStatusPriority(b, bOnBreak);

      if (prioA !== prioB) {
        return prioA - prioB;
      }

      // If both on break, longest duration first
      if (aOnBreak && bOnBreak) {
        const aBrk = breaks.find(brk => brk.agentEmail === a.email && brk.isActive);
        const bBrk = breaks.find(brk => brk.agentEmail === b.email && brk.isActive);
        return (bBrk?.duration || 0) - (aBrk?.duration || 0);
      }

      return a.name.localeCompare(b.name);
    });
  };

  // Apply search, status filtering, and sorting
  const filteredAgents = useMemo(() => {
    const list = baseAgents.filter(agent => {
      // Search text match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        agent.name.toLowerCase().includes(query) ||
        agent.email.toLowerCase().includes(query) ||
        (agent.personalMotto && agent.personalMotto.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Status filter match
      if (statusFilter === 'ALL') return true;
      const isAgentOnBreak = breaks.some(b => b.agentEmail === agent.email && b.isActive);
      if (statusFilter === 'BREAK') return isAgentOnBreak;
      if (statusFilter === 'BLOCKED') return agent.isBlocked || agent.status === 'BLOCKED';
      if (statusFilter === 'FLOOR') return !isAgentOnBreak && !agent.isBlocked && agent.status !== 'OFF_SHIFT';
      return true;
    });

    return sortAgents(list);
  }, [baseAgents, searchQuery, statusFilter, breaks, sortBy]);

  // Can current user manage the currently displayed pods?
  const canManage =
    currentUser?.role === 'developer' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'supervisor';

  // Active breaks relevant to the current view
  const visibleActiveBreaks = useMemo(() => {
    if (isAllTeamsView) {
      return activeFloorBreaks;
    }
    return breaks.filter(
      b => b.isActive && (b.teamId === effectiveTeamId || baseAgents.some(a => a.email === b.agentEmail))
    );
  }, [isAllTeamsView, activeFloorBreaks, breaks, effectiveTeamId, baseAgents]);

  // Custom Batch Actions Hook across visible agents
  const {
    selectedAgentIds,
    toggleSelectAgent,
    toggleSelectAll,
    clearSelection,
    executeBatchAction,
    isAllSelected,
    hasSelection,
  } = useBatchActions(
    filteredAgents.map(a => a.email),
    (action: BatchActionType, ids: string[]) => {
      const mappedAction = action === 'WARNING' ? 'WARN' : action;
      executeContextBatchAction(mappedAction, ids, {
        forcedBy: currentUser?.name || 'Supervisor',
        warningReason: action === 'WARNING' ? 'Supervisor Batch Warning' : undefined,
        warningNote: action === 'WARNING' ? 'Issued via Supervisor Command Bar' : undefined,
      });
    }
  );

  // Register Global Supervisor Shortcuts (Ctrl+A, Ctrl+B, Ctrl+W, Ctrl+E, Ctrl+H, Esc)
  useSupervisorShortcuts({
    hasSelection,
    selectedAgentIds,
    executeBatchAction,
    toggleSelectAll,
    clearSelection,
    enabled: canManage,
  });

  // Helper format MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to render a specific team's grid of pods
  const renderTeamSection = (team: Team, agentsForTeam: User[], showControls = true) => {
    const teamBreakers = breaks.filter(
      b => b.isActive && (b.teamId === team.teamId || agentsForTeam.some(a => a.email === b.agentEmail))
    );
    const supervisor = users.find(u => u.teamId === team.teamId && u.role === 'supervisor');

    return (
      <div key={team.teamId} className="w-full mb-10 last:mb-2 space-y-4">
        {/* Team Section Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950/70 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full shadow-[0_0_10px_currentColor]"
              style={{ backgroundColor: team.teamColorAccent, color: team.teamColorAccent }}
            />
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <h3 className="font-orbitron font-extrabold text-base md:text-lg text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <span>{team.teamName} Floor</span>
                {teamBreakers.length > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan/20 border border-cyan/40 text-cyan animate-pulse">
                    {teamBreakers.length} ON BREAK
                  </span>
                )}
              </h3>
              <span className="text-xs text-zinc-400 font-inter">
                {supervisor ? `Supervisor: ${supervisor.name}` : 'Supervisor: Unassigned'} · {agentsForTeam.length} Agents
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAllTeamsView && (
              <button
                type="button"
                onClick={() => {
                  setActiveTeamId(team.teamId);
                  playSound('click');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 text-xs font-orbitron font-semibold transition-all hover:scale-105 cursor-pointer"
                title={`Focus exclusively on ${team.teamName}`}
              >
                <span>Focus Team</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}
            {canManage && (
              <button
                type="button"
                onClick={() => openModal('addAgent', { teamId: team.teamId })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/50 text-yellow-300 text-xs font-orbitron font-bold shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden sm:inline">+ Add Agent</span>
              </button>
            )}
          </div>
        </div>

        {/* Team-Wide Break Blocking & Unblocking Control Bar */}
        {showControls && canManage && (
          <TeamControlBar
            teamId={team.teamId}
            teamName={team.teamName}
            teamColor={team.teamColorAccent}
            agentCount={agentsForTeam.length}
          />
        )}

        {/* Pods Grid for this Team */}
        {agentsForTeam.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-black/30 border border-dashed border-white/15 my-3">
            <p className="text-xs text-zinc-400 font-inter">
              No matching agent pods in {team.teamName}.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={GLIDE}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-3 place-items-center items-start w-full"
          >
            {sortAgents(agentsForTeam).map((agent) => {
              const activeBreak = breaks.find(
                b => b.agentEmail === agent.email && b.isActive
              );
              const todayBreaks = breaks.filter(
                b => b.agentEmail === agent.email && b.date === new Date().toISOString().split('T')[0]
              );
              const totalBreakMinutes = todayBreaks.reduce(
                (acc, b) => acc + Math.round(b.duration / 60),
                0
              );
              const isOwnPod = currentUser?.email === agent.email;
              const isSelected = selectedAgentIds.includes(agent.email);

              return (
                <AgentPod
                  key={agent.id || agent.email}
                  agent={agent}
                  activeBreak={activeBreak}
                  usedSlotsCount={todayBreaks.length}
                  totalBreakMinutes={totalBreakMinutes}
                  isOwnPod={isOwnPod}
                  canManage={canManage}
                  isSelected={isSelected}
                  onToggleSelect={toggleSelectAgent}
                  selectionMode={hasSelection}
                />
              );
            })}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-6">
      {/* ========================================================================= */}
      {/* 1. ADMIN / DEV / SUPERVISOR TEAM SWITCHER NAVIGATION BAR & FILTER CONTROLS */}
      {/* ========================================================================= */}
      {canSwitchTeams && (
        <div className="p-3 sm:p-4 rounded-3xl bg-zinc-950/80 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Team Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {/* Option to preview ALL teams together */}
              <button
                type="button"
                onClick={() => {
                  setActiveTeamId('ALL');
                  playSound('click');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-orbitron font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                  isAllTeamsView
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-[0_0_18px_rgba(255,215,0,0.4)] scale-105 border border-yellow-300'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-sm">🌐</span>
                <span>All Teams</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isAllTeamsView
                      ? 'bg-black/30 text-black font-extrabold'
                      : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {allFloorAgents.length}
                </span>
                {activeFloorBreaks.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-cyan animate-pulse shadow-[0_0_6px_#00E5FF]" />
                )}
              </button>

              {/* Individual Team Pills */}
              {teams.map((team) => {
                const teamAgentsCount = users.filter(u => u.teamId === team.teamId && u.role === 'agent').length;
                const teamBreakersCount = breaks.filter(
                  b => b.isActive && (b.teamId === team.teamId || users.some(u => u.teamId === team.teamId && u.email === b.agentEmail))
                ).length;
                const isSelected = effectiveTeamId === team.teamId;

                return (
                  <button
                    key={team.teamId}
                    type="button"
                    onClick={() => {
                      setActiveTeamId(team.teamId);
                      playSound('click');
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-orbitron font-semibold tracking-wide transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 text-white shadow-lg border-2'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/10'
                    }`}
                    style={{
                      borderColor: isSelected ? team.teamColorAccent : undefined,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]"
                      style={{ backgroundColor: team.teamColorAccent, color: team.teamColorAccent }}
                    />
                    <span>{team.teamName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/5 text-zinc-400">
                      {teamAgentsCount}
                    </span>
                    {teamBreakersCount > 0 && (
                      <span className="text-[9px] font-mono px-1 rounded bg-cyan/20 text-cyan border border-cyan/40 font-bold">
                        {teamBreakersCount} brk
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions (Manage / Add) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openModal('manageTeams')}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-orbitron font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Manage Floor Teams & Shift Config"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Manage Teams</span>
              </button>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-white/10">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents by name, email, or motto..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs font-inter text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-400/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Buttons & Sort By Status */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5">
              {(
                [
                  { id: 'ALL', label: 'All Pods' },
                  { id: 'FLOOR', label: 'Floor' },
                  { id: 'BREAK', label: 'On Break' },
                  { id: 'BLOCKED', label: 'Blocked' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    playSound('hover_tick');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-orbitron font-semibold transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/50'
                      : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {/* Sort By Status Feature */}
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2 sm:border-l sm:border-white/10 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy(prev => (prev === 'status' ? 'default' : 'status'));
                    playSound('click');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-orbitron font-semibold transition-all cursor-pointer ${
                    sortBy === 'status'
                      ? 'bg-cyan/20 text-cyan border border-cyan/50 shadow-[0_0_12px_rgba(0,229,255,0.3)] scale-105'
                      : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/10 hover:border-white/20'
                  }`}
                  title="Group & Sort agents by current status: On Break → On Hold → Blocked → On Floor"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-cyan" />
                  <span>Sort: {sortBy === 'status' ? 'Status (On Break ➔ Floor)' : 'Default'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TEAM OVERVIEW DASHBOARD WIDGET (REAL-TIME METRICS & RATIOS)            */}
      {/* ========================================================================= */}
      <TeamOverviewWidget
        team={currentTeam}
        isAllTeams={isAllTeamsView}
        agents={isAllTeamsView ? allFloorAgents : baseAgents}
        breaks={breaks}
        shiftConfig={shiftConfig}
      />

      {/* ========================================================================= */}
      {/* 3. ACTIVE BREAKS LIVE QUICK-MONITOR SHELF (CIRCULAR PROGRESS TIMERS)      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {visibleActiveBreaks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={SNAP}
            className="p-3.5 rounded-2xl bg-zinc-950/80 border border-cyan/30 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,229,255,0.1)] flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan animate-ping" />
              <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-cyan flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Active Live Breaks ({visibleActiveBreaks.length})
                {isAllTeamsView && <span className="text-[10px] text-zinc-400 font-mono">(All Teams)</span>}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {visibleActiveBreaks.map(brk => {
                const agent = users.find(u => u.email === brk.agentEmail);
                const totalSlotSeconds = brk.breakType === 'bonus'
                  ? 600
                  : brk.breakType === 'wc'
                  ? 1200
                  : (shiftConfig.maxSlotDuration || 15) * 60;
                
                const remainingSecs = Math.max(0, totalSlotSeconds - brk.duration);
                const remainingRatio = Math.max(0, Math.min(1, remainingSecs / totalSlotSeconds));
                const remainingPercent = Math.round(remainingRatio * 100);
                const isOvertime = brk.duration > totalSlotSeconds;

                const miniCirc = 87.96;
                const miniOffset = miniCirc * (1 - remainingRatio);

                const ringColor = isOvertime
                  ? '#FF003C'
                  : remainingRatio > 0.6
                  ? '#00FF88'
                  : remainingRatio > 0.3
                  ? '#FFD700'
                  : remainingRatio > 0.15
                  ? '#FF8800'
                  : '#FF003C';

                const isSelf = currentUser?.email === brk.agentEmail;
                const canEnd = isSelf || canManage;
                const isNearLimit = isOvertime || remainingSecs <= 120;

                return (
                  <div
                    key={brk.breakId}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all ${
                      isOvertime
                        ? 'bg-crimson/20 border-crimson/60 shadow-[0_0_12px_rgba(255,0,60,0.3)] animate-pulse'
                        : isNearLimit
                        ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_12px_rgba(255,136,0,0.35)] animate-pulse'
                        : 'bg-zinc-900/90 border-white/10 hover:border-cyan/40'
                    }`}
                  >
                    {/* Mini Circular Progress Ring Visual */}
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                        <defs>
                          <linearGradient id={`miniGrad-${brk.breakId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00FF88" />
                            <stop offset="35%" stopColor="#84CC16" />
                            <stop offset="65%" stopColor="#EAB308" />
                            <stop offset="85%" stopColor="#F97316" />
                            <stop offset="100%" stopColor="#FF003C" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="3"
                          fill="transparent"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          stroke={`url(#miniGrad-${brk.breakId})`}
                          strokeWidth="3"
                          strokeDasharray={miniCirc}
                          strokeDashoffset={miniOffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      <span className="absolute text-[9px] font-orbitron font-bold text-zinc-200">
                        {isOvertime ? '!' : `${remainingPercent}%`}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="font-orbitron font-bold text-xs text-zinc-100">
                          {agent?.name.split(' ')[0] || brk.agentName}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {brk.breakType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px]" style={{ color: ringColor }}>
                        <span>
                          {isOvertime ? `+${formatTimer(brk.duration - totalSlotSeconds)} OVERTIME` : `${formatTimer(remainingSecs)} remaining`}
                        </span>
                      </div>
                    </div>

                    {canEnd && (
                      <button
                        onClick={() => endBreak(brk.breakId, isSelf ? undefined : currentUser?.email)}
                        className="ml-1 px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-crimson/80 text-zinc-200 hover:text-white text-[10px] font-orbitron transition-colors border border-white/10 cursor-pointer"
                        title={isSelf ? 'Return from Break' : 'Force End Break'}
                      >
                        {isSelf ? 'Return' : 'End'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. MULTI-SELECT BATCH ACTIONS COMMAND BAR (LIQUID GLASS POPUP)           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {canManage && hasSelection && (
          <BatchActionToolbar
            selectedCount={selectedAgentIds.length}
            totalCount={filteredAgents.length}
            isAllSelected={isAllSelected}
            onToggleSelectAll={toggleSelectAll}
            onExecuteAction={executeBatchAction}
            onClearSelection={clearSelection}
          />
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. FLOOR PODS DISPLAY (ALL TEAMS TOGETHER VS. SINGLE TEAM FOCUS)          */}
      {/* ========================================================================= */}
      {isAllTeamsView ? (
        // RENDER ALL TEAMS IN GROUPED SECTIONS
        <div className="space-y-10">
          {/* Header for All Teams View */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              {canManage && filteredAgents.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-orbitron font-semibold transition-all border cursor-pointer ${
                    isAllSelected
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_10px_#FFD700]'
                      : hasSelection
                      ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50'
                      : 'bg-black/40 text-zinc-400 border-white/10 hover:border-white/30'
                  }`}
                  title={isAllSelected ? 'Deselect All Agents Across All Teams' : 'Select All Agents Across All Teams'}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-black" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
                </button>
              )}

              <h2 className="font-orbitron font-extrabold text-base md:text-lg text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                <span>🌐 All Floor Pods</span>
              </h2>
              <span className="text-xs font-teko px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400 text-base">
                {filteredAgents.length} Agents Across {teams.length} Teams
              </span>
            </div>
          </div>

          {/* Map through each team */}
          {teams.map((team) => {
            const agentsInThisTeam = filteredAgents.filter(a => a.teamId === team.teamId);
            return renderTeamSection(team, agentsInThisTeam, true);
          })}
        </div>
      ) : (
        // RENDER SINGLE TEAM VIEW
        <div className="space-y-4">
          {/* Team Control Bar for Single Team */}
          {canManage && (
            <TeamControlBar
              teamId={effectiveTeamId}
              teamName={currentTeam.teamName}
              teamColor={currentTeam.teamColorAccent}
              agentCount={filteredAgents.length}
            />
          )}

          {/* Single Team Pods Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              {canManage && filteredAgents.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-orbitron font-semibold transition-all border cursor-pointer ${
                    isAllSelected
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_10px_#FFD700]'
                      : hasSelection
                      ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50'
                      : 'bg-black/40 text-zinc-400 border-white/10 hover:border-white/30'
                  }`}
                  title={isAllSelected ? 'Deselect All Agents' : 'Select All Agents in Floor'}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-black" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-zinc-400" />
                  )}
                  <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
                </button>
              )}

              <div
                className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: currentTeam.teamColorAccent, color: currentTeam.teamColorAccent }}
              />
              <h2 className="font-orbitron font-extrabold text-base md:text-lg text-zinc-100 uppercase tracking-wide">
                {currentTeam.teamName} Floor Pods
              </h2>
              <span className="text-xs font-teko px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400 text-base">
                {filteredAgents.length} Active Pods
              </span>
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openModal('addAgent', { teamId: effectiveTeamId })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/50 text-yellow-300 text-xs font-orbitron font-bold shadow-md transition-all hover:scale-105 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  + Add Agent Pod
                </button>
                {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                  <button
                    type="button"
                    onClick={() => openModal('editTeam', currentTeam)}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 text-xs font-orbitron transition-all cursor-pointer"
                  >
                    ✏️ Edit Team
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pod Grid */}
          {filteredAgents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-black/40 border border-dashed border-white/20 my-8 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-orbitron font-bold text-lg text-zinc-200">
                No Agent Pods found in {currentTeam.teamName}
              </h3>
              <p className="text-xs text-zinc-400 font-inter max-w-md mx-auto">
                {searchQuery
                  ? 'No agent pods matched your search or status filters.'
                  : 'This team currently has zero assigned floor agent pods. As an Admin or Developer, you can add agents directly.'}
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => openModal('addAgent', { teamId: effectiveTeamId })}
                  className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-orbitron font-black text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  + Create First Agent Pod for {currentTeam.teamName}
                </button>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={GLIDE}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-3 place-items-center items-start w-full"
            >
              {filteredAgents.map((agent) => {
                const activeBreak = breaks.find(
                  b => b.agentEmail === agent.email && b.isActive
                );
                const todayBreaks = breaks.filter(
                  b => b.agentEmail === agent.email && b.date === new Date().toISOString().split('T')[0]
                );
                const totalBreakMinutes = todayBreaks.reduce(
                  (acc, b) => acc + Math.round(b.duration / 60),
                  0
                );
                const isOwnPod = currentUser?.email === agent.email;
                const isSelected = selectedAgentIds.includes(agent.email);

                return (
                  <AgentPod
                    key={agent.id || agent.email}
                    agent={agent}
                    activeBreak={activeBreak}
                    usedSlotsCount={todayBreaks.length}
                    totalBreakMinutes={totalBreakMinutes}
                    isOwnPod={isOwnPod}
                    canManage={canManage}
                    isSelected={isSelected}
                    onToggleSelect={toggleSelectAgent}
                    selectionMode={hasSelection}
                  />
                );
              })}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
