import React from 'react';
import { motion } from 'motion/react';
import { Team, User, BreakRecord, ShiftConfig } from '../../types';
import { Users, Clock, Coffee, ShieldCheck, Activity, TrendingUp, AlertOctagon } from 'lucide-react';
import { GLIDE } from '../../styles/motion-presets';

interface TeamOverviewWidgetProps {
  team: Team;
  isAllTeams?: boolean;
  agents: User[];
  breaks: BreakRecord[];
  shiftConfig: ShiftConfig;
  className?: string;
}

export const TeamOverviewWidget: React.FC<TeamOverviewWidgetProps> = ({
  team,
  isAllTeams = false,
  agents,
  breaks,
  shiftConfig,
  className = '',
}) => {
  const totalAgents = agents.length;

  // Active breaks in this team/view
  const activeBreaks = breaks.filter(b => {
    if (!b.isActive) return false;
    if (isAllTeams) return true;
    return b.teamId === team.teamId || agents.some(a => a.email === b.agentEmail);
  });

  const onBreakCount = activeBreaks.length;

  // Agents on hold or blocked
  const blockedAgentsCount = agents.filter(
    a => a.isBlocked || a.status === 'BLOCKED' || a.status === 'HOLD'
  ).length;

  // Agents actively on floor (not on break, not blocked/hold)
  const onFloorCount = Math.max(0, totalAgents - onBreakCount - blockedAgentsCount);

  // Percentages
  const breakPercentage = totalAgents > 0 ? Math.round((onBreakCount / totalAgents) * 100) : 0;
  const floorPercentage = totalAgents > 0 ? Math.round((onFloorCount / totalAgents) * 100) : 100;
  const blockedPercentage = totalAgents > 0 ? Math.round((blockedAgentsCount / totalAgents) * 100) : 0;

  // Average Break Duration calculation
  // 1. Current Active Breaks average
  const activeBreakAverageSeconds =
    activeBreaks.length > 0
      ? Math.round(activeBreaks.reduce((sum, b) => sum + b.duration, 0) / activeBreaks.length)
      : 0;

  // 2. All today completed breaks average
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCompletedBreaks = breaks.filter(b => {
    if (b.isActive || b.date !== todayStr) return false;
    if (isAllTeams) return true;
    return b.teamId === team.teamId || agents.some(a => a.email === b.agentEmail);
  });

  const todayAverageSeconds =
    todayCompletedBreaks.length > 0
      ? Math.round(
          todayCompletedBreaks.reduce((sum, b) => sum + b.duration, 0) / todayCompletedBreaks.length
        )
      : 0;

  // Display duration
  const displayAvgSeconds = activeBreaks.length > 0 ? activeBreakAverageSeconds : todayAverageSeconds;
  const avgMins = Math.floor(displayAvgSeconds / 60);
  const avgSecs = displayAvgSeconds % 60;
  const avgDurationFormatted = `${avgMins}m ${avgSecs.toString().padStart(2, '0')}s`;

  // Capacity calculation
  const maxCapacity = shiftConfig.breakCapacity || 3;
  const capacityUsagePercent = Math.min(100, Math.round((onBreakCount / maxCapacity) * 100));

  // Total break time logged today across team
  const totalBreakMinutesToday = breaks
    .filter(b => {
      if (b.date !== todayStr) return false;
      if (isAllTeams) return true;
      return b.teamId === team.teamId || agents.some(a => a.email === b.agentEmail);
    })
    .reduce((acc, b) => acc + Math.round(b.duration / 60), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={GLIDE}
      className={`w-full rounded-3xl bg-zinc-950/85 border border-white/15 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl space-y-4 ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-3.5 h-3.5 rounded-full shadow-[0_0_12px_currentColor]"
            style={{
              backgroundColor: isAllTeams ? '#FFD700' : team.teamColorAccent,
              color: isAllTeams ? '#FFD700' : team.teamColorAccent,
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-orbitron font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-yellow-400 border border-yellow-400/30">
                Team Overview
              </span>
              <h2 className="font-orbitron font-extrabold text-base sm:text-lg text-zinc-100 uppercase tracking-wide">
                {isAllTeams ? 'All Teams Live Pulse' : `${team.teamName} Real-Time Metrics`}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-inter mt-0.5">
              Live ratio of active floor agents, active breaks, and telemetry duration.
            </p>
          </div>
        </div>

        {/* Right Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-orbitron font-semibold">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Shift Active</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: On Break vs On Floor Percentage Ratio */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-orbitron">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan" />
              Floor vs Break Ratio
            </span>
            <span className="font-mono text-[11px] text-zinc-300">{totalAgents} Total</span>
          </div>

          <div>
            {/* Visual Ratio Bar */}
            <div className="w-full h-3 rounded-full bg-zinc-900 border border-white/10 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${floorPercentage}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 relative"
                title={`On Floor: ${onFloorCount} (${floorPercentage}%)`}
              />
              <div
                style={{ width: `${breakPercentage}%` }}
                className="h-full bg-gradient-to-r from-cyan to-blue-400 transition-all duration-700"
                title={`On Break: ${onBreakCount} (${breakPercentage}%)`}
              />
              {blockedPercentage > 0 && (
                <div
                  style={{ width: `${blockedPercentage}%` }}
                  className="h-full bg-crimson transition-all duration-700"
                  title={`Hold/Blocked: ${blockedAgentsCount} (${blockedPercentage}%)`}
                />
              )}
            </div>

            {/* Split Legend */}
            <div className="flex items-center justify-between text-xs mt-2 font-orbitron">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Floor: {floorPercentage}% ({onFloorCount})
              </span>
              <span className="text-cyan font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan" />
                Break: {breakPercentage}% ({onBreakCount})
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Current Average Break Duration */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-orbitron">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              Avg Break Duration
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-300">
              {activeBreaks.length > 0 ? 'Live Active' : 'Today Avg'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <div className="font-teko text-3xl sm:text-4xl text-yellow-400 font-bold leading-none">
              {avgDurationFormatted}
            </div>
            <span className="text-xs text-zinc-400 font-inter">
              / {shiftConfig.maxSlotDuration || 15}m target
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 font-inter">
            {activeBreaks.length > 0
              ? `${activeBreaks.length} active agent(s) currently timed`
              : `Based on ${todayCompletedBreaks.length} completed breaks today`}
          </div>
        </div>

        {/* Metric 3: Live Capacity Utilization */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-orbitron">
            <span className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-purple-400" />
              Capacity In Use
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                capacityUsagePercent >= 100
                  ? 'bg-crimson/20 text-crimson'
                  : capacityUsagePercent >= 70
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-emerald-400/20 text-emerald-300'
              }`}
            >
              {capacityUsagePercent}%
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1">
            <div className="font-teko text-3xl sm:text-4xl text-purple-400 font-bold leading-none">
              {onBreakCount} <span className="text-zinc-500 text-2xl font-normal">/ {maxCapacity}</span>
            </div>
            <span className="text-xs text-zinc-400 font-inter">slots</span>
          </div>

          <div className="text-[11px] text-zinc-400 font-inter">
            {maxCapacity - onBreakCount > 0
              ? `${maxCapacity - onBreakCount} break slot(s) currently open`
              : 'Full capacity reached'}
          </div>
        </div>

        {/* Metric 4: Shift Total Break Volume */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-orbitron">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Total Logged Break
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="flex items-baseline gap-1.5 mt-1">
            <div className="font-teko text-3xl sm:text-4xl text-amber-400 font-bold leading-none">
              {totalBreakMinutesToday}
            </div>
            <span className="text-xs text-zinc-400 font-inter">minutes today</span>
          </div>

          <div className="text-[11px] text-zinc-400 font-inter">
            Across {totalAgents} assigned team agents
          </div>
        </div>
      </div>
    </motion.div>
  );
};
