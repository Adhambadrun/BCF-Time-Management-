import React from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { ShieldCheck, Flame, Clock, Award, CheckCircle } from 'lucide-react';

export const AgentPerformanceCard: React.FC = () => {
  const { currentUser, breaks, shiftConfig, wcTracking } = useApp();

  if (!currentUser || currentUser.role !== 'agent') {
    return null;
  }

  // Calculate agent's breaks for the current shift
  const agentBreaks = breaks.filter((b) => b.agentEmail === currentUser.email);
  const totalBreakSeconds = agentBreaks.reduce((acc, b) => acc + (b.duration || 0), 0);
  const totalBreakMinutes = Math.round(totalBreakSeconds / 60);
  const allowedMinutes = shiftConfig.totalDailyAllowance || 60;

  const usedRatio = Math.min(1, totalBreakMinutes / allowedMinutes);
  const usedPercent = Math.round(usedRatio * 100);
  const remainingMinutes = Math.max(0, allowedMinutes - totalBreakMinutes);

  const agentWc = wcTracking[currentUser.email];
  const wcMinutesUsed = Math.round((agentWc?.totalSeconds || 0) / 60);

  // Meter color
  const getMeterColor = () => {
    if (totalBreakMinutes > allowedMinutes) return 'bg-rose-500 shadow-[0_0_12px_#FF003C]';
    if (totalBreakMinutes > 48) return 'bg-amber-400 shadow-[0_0_12px_#FFD700]';
    return 'bg-emerald-400 shadow-[0_0_12px_#00FF88]';
  };

  const getStatusBadge = () => {
    if (totalBreakMinutes > allowedMinutes) {
      return {
        label: 'LIMIT EXCEEDED',
        className: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      };
    }
    if (totalBreakMinutes >= 50) {
      return {
        label: 'NEARING LIMIT',
        className: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      };
    }
    return {
      label: 'EXCELLENT PACING',
      className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    };
  };

  const status = getStatusBadge();

  return (
    <GlassPanel
      material="thin"
      id="agent-my-performance-card"
      className="p-4 sm:p-5 rounded-2xl border border-white/15 bg-zinc-950/75 shadow-xl mb-6 backdrop-blur-xl"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Identity & Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400/70 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-400" />
                My Performance Deck
              </h3>
              <span
                className={`text-[9px] font-orbitron font-extrabold uppercase px-2 py-0.5 rounded-full border ${status.className}`}
              >
                {status.label}
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-inter mt-0.5">
              Shift Compliance & Daily Break Utilization Dashboard
            </div>
          </div>
        </div>

        {/* Right Stats Quick Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-center">
          {/* Stat 1: Time Used */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-2 sm:p-2.5">
            <div className="text-[10px] font-orbitron text-zinc-400 uppercase tracking-wider">
              Break Time Used
            </div>
            <div className="font-orbitron font-extrabold text-base sm:text-lg text-yellow-400 leading-tight">
              {totalBreakMinutes} <span className="text-xs text-zinc-400 font-normal">/ {allowedMinutes}m</span>
            </div>
            <div className="text-[9px] text-zinc-500 font-inter">
              {remainingMinutes}m remaining
            </div>
          </div>

          {/* Stat 2: Slots Taken */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-2 sm:p-2.5">
            <div className="text-[10px] font-orbitron text-zinc-400 uppercase tracking-wider">
              Slots Used
            </div>
            <div className="font-orbitron font-extrabold text-base sm:text-lg text-cyan leading-tight">
              {agentBreaks.length} <span className="text-xs text-zinc-400 font-normal">/ 5 max</span>
            </div>
            <div className="text-[9px] text-zinc-500 font-inter">
              {5 - agentBreaks.length} slots left
            </div>
          </div>

          {/* Stat 3: WC Tracking */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-2 sm:p-2.5">
            <div className="text-[10px] font-orbitron text-zinc-400 uppercase tracking-wider">
              WC Allowance
            </div>
            <div className="font-orbitron font-extrabold text-base sm:text-lg text-indigo-400 leading-tight">
              {wcMinutesUsed} <span className="text-xs text-zinc-400 font-normal">/ 20m</span>
            </div>
            <div className="text-[9px] text-zinc-500 font-inter">
              {Math.max(0, 20 - wcMinutesUsed)}m remaining
            </div>
          </div>

          {/* Stat 4: Shift Streak */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-2 sm:p-2.5">
            <div className="text-[10px] font-orbitron text-zinc-400 uppercase tracking-wider">
              Streak & Score
            </div>
            <div className="font-orbitron font-extrabold text-base sm:text-lg text-emerald-400 leading-tight flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{currentUser.currentStreak || 1}d</span>
            </div>
            <div className="text-[9px] text-emerald-400/80 font-inter">
              100% Compliant
            </div>
          </div>
        </div>
      </div>

      {/* Break Budget Utilization Bar */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs font-orbitron mb-1.5">
          <span className="text-zinc-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <span>Daily 60-Minute Allowance Progress</span>
          </span>
          <span className="text-zinc-300 font-mono">
            {usedPercent}% used ({totalBreakMinutes} of {allowedMinutes} mins)
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-white/10 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${getMeterColor()}`}
            style={{ width: `${Math.min(100, usedPercent)}%` }}
          />
        </div>
      </div>
    </GlassPanel>
  );
};
