import React from 'react';
import { BreakRecord } from '../../types';
import { Clock, AlertTriangle, Flame } from 'lucide-react';
import { motion } from 'motion/react';

export interface BreakTimerProps {
  activeBreak?: BreakRecord;
  duration?: number;
  maxSlotMinutes?: number;
  breakType?: string;
  variant?: 'card' | 'bar' | 'compact' | 'badge';
  showProgressBar?: boolean;
  className?: string;
}

export const BreakTimer: React.FC<BreakTimerProps> = ({
  activeBreak,
  duration: propDuration,
  maxSlotMinutes,
  breakType: propBreakType,
  variant = 'card',
  showProgressBar = true,
  className = '',
}) => {
  const currentBreakType = propBreakType || activeBreak?.breakType || 'regular';
  const duration = propDuration !== undefined ? propDuration : (activeBreak?.duration || 0);

  // Compute total duration allocated for this break type in seconds
  const totalSlotSeconds = React.useMemo(() => {
    if (maxSlotMinutes) return maxSlotMinutes * 60;
    if (currentBreakType === 'bonus') return 600; // 10 minutes
    if (currentBreakType === 'wc') return 1200; // 20 minutes daily budget
    if (currentBreakType === 'meal') return 1800; // 30 minutes meal punch
    return 900; // 15 minutes regular floor slot
  }, [currentBreakType, maxSlotMinutes]);

  const remainingSeconds = Math.max(0, totalSlotSeconds - duration);
  const remainingRatio = Math.max(0, Math.min(1, remainingSeconds / totalSlotSeconds));
  const remainingPercent = Math.round(remainingRatio * 100);
  const isOvertime = duration > totalSlotSeconds;
  const overtimeSeconds = duration - totalSlotSeconds;

  // Graceful color progression from Green -> Yellow -> Orange -> Red
  const colorScheme = React.useMemo(() => {
    if (isOvertime) {
      return {
        hex: '#FF003C',
        text: 'text-red-500',
        bg: 'bg-red-500/20',
        border: 'border-red-500/50',
        barGradient: 'from-red-600 via-rose-600 to-crimson',
        shadow: 'shadow-[0_0_12px_rgba(255,0,60,0.5)]',
        statusLabel: 'OVERTIME',
      };
    }
    if (remainingRatio > 0.6) {
      return {
        hex: '#00FF88',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        barGradient: 'from-emerald-400 to-green-500',
        shadow: 'shadow-[0_0_10px_rgba(0,255,136,0.35)]',
        statusLabel: 'ON TRACK',
      };
    }
    if (remainingRatio > 0.3) {
      return {
        hex: '#FFD700',
        text: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        barGradient: 'from-yellow-400 to-amber-500',
        shadow: 'shadow-[0_0_10px_rgba(255,215,0,0.35)]',
        statusLabel: 'IN PROGRESS',
      };
    }
    if (remainingRatio > 0.15) {
      return {
        hex: '#FF8800',
        text: 'text-orange-400',
        bg: 'bg-orange-500/15',
        border: 'border-orange-500/40',
        barGradient: 'from-amber-500 to-orange-500',
        shadow: 'shadow-[0_0_12px_rgba(255,136,0,0.45)]',
        statusLabel: 'ENDING SOON',
      };
    }
    return {
      hex: '#FF003C',
      text: 'text-red-400',
      bg: 'bg-red-950/40',
      border: 'border-red-500/50',
      barGradient: 'from-orange-500 to-red-600',
      shadow: 'shadow-[0_0_14px_rgba(255,0,60,0.6)]',
      statusLabel: 'EXPIRING',
    };
  }, [remainingRatio, isOvertime]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border transition-colors ${colorScheme.bg} ${colorScheme.border} ${colorScheme.text} ${className}`}
      >
        <Clock className="w-3 h-3 shrink-0" />
        <span>{isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(remainingSeconds)}</span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className={`font-bold ${colorScheme.text} flex items-center gap-1`}>
            {isOvertime ? <Flame className="w-3 h-3 animate-pulse" /> : <Clock className="w-3 h-3" />}
            {isOvertime ? `+${formatTime(overtimeSeconds)} OT` : `${formatTime(remainingSeconds)} left`}
          </span>
          <span className="text-zinc-400 text-[9px] font-orbitron">{remainingPercent}%</span>
        </div>

        {showProgressBar && (
          <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden border border-white/5">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${colorScheme.barGradient} ${colorScheme.shadow}`}
              initial={{ width: '100%' }}
              animate={{ width: `${isOvertime ? 100 : remainingPercent}%` }}
              transition={{ ease: 'linear', duration: 0.5 }}
            />
          </div>
        )}
      </div>
    );
  }

  // Full Card Variant (default)
  return (
    <div
      className={`w-full rounded-xl p-2.5 bg-black/40 border transition-all ${colorScheme.border} ${className}`}
    >
      {/* Header Row: Break Type & Time Remaining */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-orbitron uppercase tracking-wider text-zinc-300 font-semibold px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
            {currentBreakType}
          </span>
          {isOvertime && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-orbitron font-bold text-red-400 uppercase bg-red-950/60 border border-red-800/60 px-1.5 py-0.5 rounded animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" />
              Overtime
            </span>
          )}
        </div>

        {/* Dynamic Countdown Display */}
        <div className="flex items-center gap-1 font-mono text-xs font-extrabold tracking-tight">
          <Clock className={`w-3.5 h-3.5 ${colorScheme.text} ${isOvertime ? 'animate-bounce' : ''}`} />
          <span className={`${colorScheme.text} ${isOvertime ? 'animate-pulse' : ''}`}>
            {isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(remainingSeconds)}
          </span>
        </div>
      </div>

      {/* Dynamic Color-Transitioning Progress Bar */}
      {showProgressBar && (
        <div className="space-y-1">
          <div className="relative w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-white/10 p-[1px]">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${colorScheme.barGradient} ${colorScheme.shadow}`}
              initial={{ width: `${remainingPercent}%` }}
              animate={{ width: `${isOvertime ? 100 : remainingPercent}%` }}
              transition={{ ease: 'linear', duration: 0.8 }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] font-orbitron text-zinc-400">
            <span className="uppercase text-[8px] font-semibold tracking-wider text-zinc-400">
              {colorScheme.statusLabel}
            </span>
            <span className="font-mono text-[9px] text-zinc-300">
              {isOvertime ? '100% EXCEEDED' : `${remainingPercent}% REMAINING`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
