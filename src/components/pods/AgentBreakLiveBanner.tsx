import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Clock, AlertTriangle, CheckCircle2, Coffee, ShieldAlert, Sparkles } from 'lucide-react';
import { playSound } from '../../lib/sound';
import { SNAP } from '../../styles/motion-presets';

export const AgentBreakLiveBanner: React.FC = () => {
  const { currentUser, breaks, shiftConfig, endBreak } = useApp();

  // Find active break for current user (or simulated user)
  const activeBreak = breaks.find(
    (b) => b.agentEmail === currentUser?.email && b.isActive
  );

  if (!activeBreak || !currentUser) {
    return null;
  }

  const totalSlotSeconds =
    activeBreak.breakType === 'bonus'
      ? 600
      : activeBreak.breakType === 'wc'
      ? 1200
      : activeBreak.breakType === 'meal'
      ? (shiftConfig.mealBreakDuration || 30) * 60
      : (shiftConfig.maxSlotDuration || 15) * 60;

  const duration = activeBreak.duration || 0;
  const remainingSeconds = Math.max(0, totalSlotSeconds - duration);
  const remainingRatio = Math.max(0, Math.min(1, remainingSeconds / totalSlotSeconds));
  const remainingPercent = Math.round(remainingRatio * 100);
  const isOvertime = duration > totalSlotSeconds;
  const overtimeSeconds = isOvertime ? duration - totalSlotSeconds : 0;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Color state transitions: Green (>50%) -> Yellow (20%-50%) -> Red (<20% or Overtime)
  const getProgressColor = () => {
    if (isOvertime) return 'from-rose-600 to-red-600';
    if (remainingPercent > 50) return 'from-emerald-400 to-teal-400';
    if (remainingPercent > 20) return 'from-amber-400 to-yellow-500';
    return 'from-orange-500 to-rose-600';
  };

  const getBorderColor = () => {
    if (isOvertime) return 'border-crimson shadow-[0_0_35px_rgba(255,0,60,0.5)]';
    if (remainingPercent > 50) return 'border-emerald-500/50 shadow-[0_0_25px_rgba(0,255,136,0.25)]';
    if (remainingPercent > 20) return 'border-amber-400/50 shadow-[0_0_25px_rgba(255,215,0,0.25)]';
    return 'border-rose-500/60 shadow-[0_0_30px_rgba(255,0,60,0.35)] animate-pulse';
  };

  const getTimerTextColor = () => {
    if (isOvertime) return 'text-rose-400';
    if (remainingPercent > 50) return 'text-emerald-400';
    if (remainingPercent > 20) return 'text-yellow-400';
    return 'text-rose-400';
  };

  return (
    <AnimatePresence>
      <motion.section
        id="active-break-countdown-banner"
        aria-label="Active Break Countdown"
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={SNAP}
        className={`w-full rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-2xl transition-all duration-500 border ${getBorderColor()} ${
          isOvertime
            ? 'bg-gradient-to-r from-red-950/90 via-zinc-950/95 to-red-950/90'
            : 'bg-gradient-to-r from-zinc-950/95 via-zinc-900/90 to-zinc-950/95'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Left: Agent Info & Break Status */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-13 h-13 rounded-full object-cover border-2 border-yellow-400 shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-zinc-900 border border-white/20">
                <Coffee className="w-3.5 h-3.5 text-yellow-400" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-orbitron font-bold uppercase tracking-wider text-yellow-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE BREAK ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-orbitron font-extrabold uppercase bg-yellow-400/20 border border-yellow-400/40 text-yellow-300">
                  {activeBreak.breakType.toUpperCase()} BREAK
                </span>
                {isOvertime && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-orbitron font-extrabold uppercase bg-rose-500/20 border border-rose-500/50 text-rose-400 animate-pulse flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    OVERTIME LIMIT EXCEEDED
                  </span>
                )}
              </div>

              <h2 className="font-orbitron font-extrabold text-base sm:text-lg text-white mt-0.5">
                {currentUser.name}
              </h2>
              <div className="text-xs text-zinc-400 font-inter">
                Shift Slot Allotment: <strong className="text-zinc-200">{Math.round(totalSlotSeconds / 60)} minutes</strong> · Started at{' '}
                {new Date(activeBreak.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Center: Prominent Live Countdown Timer */}
          <div className="flex flex-col items-center lg:items-center justify-center bg-black/60 px-6 py-2.5 rounded-2xl border border-white/10 shadow-inner">
            <div className="text-[10px] font-orbitron uppercase text-zinc-400 tracking-wider font-semibold">
              {isOvertime ? 'TIME OVER LIMIT' : 'PRECISE TIME REMAINING'}
            </div>
            <div className={`font-orbitron font-black text-3xl sm:text-4xl tracking-tight leading-none my-0.5 ${getTimerTextColor()}`}>
              {isOvertime ? `+${formatTimer(overtimeSeconds)}` : formatTimer(remainingSeconds)}
            </div>
            <div className="text-[10px] font-orbitron text-zinc-400 font-medium">
              {isOvertime
                ? `Total Elapsed: ${formatTimer(duration)}`
                : `${remainingPercent}% Remaining (${formatTimer(duration)} elapsed)`}
            </div>
          </div>

          {/* Right: End Break Action Button */}
          <div className="flex items-center justify-end">
            <button
              id="end-break-banner-btn"
              onClick={() => {
                endBreak(activeBreak.breakId);
                playSound('break_end');
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-black font-orbitron font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,255,136,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Punch Back In · Return to Floor</span>
            </button>
          </div>
        </div>

        {/* Full-Width Visual Progress Bar with Dynamic Color Transitions */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] font-orbitron mb-1.5 text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span>Break Time Depletion Meter</span>
            </span>
            <span className="font-bold font-mono">
              {isOvertime ? (
                <span className="text-rose-400 animate-pulse font-bold">100% Depleted (+{formatTimer(overtimeSeconds)})</span>
              ) : (
                <span>
                  {remainingPercent}% Remaining ({formatTimer(remainingSeconds)})
                </span>
              )}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-zinc-900 border border-white/10 overflow-hidden relative shadow-inner">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-1000 ease-linear shadow-lg`}
              style={{
                width: isOvertime ? '100%' : `${remainingPercent}%`,
              }}
            />
            {/* Pulsing glow highlight */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
          </div>

          {/* Color Milestone Legend */}
          <div className="flex items-center justify-between text-[9px] font-orbitron text-zinc-500 mt-1.5">
            <span className="text-emerald-400/80">● &gt;50% Safe (Green)</span>
            <span className="text-amber-400/80">● 20%-50% Caution (Yellow)</span>
            <span className="text-rose-400/80">● &lt;20% Critical (Red)</span>
            <span className="text-crimson font-bold">● Overtime (Flashing Red)</span>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
};
