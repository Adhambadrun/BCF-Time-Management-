import React, { useMemo } from 'react';
import { BreakRecord, User } from '../../types';
import { AlertTriangle, Clock, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { playSound } from '../../lib/sound';

export interface BreakOverlapAlertProps {
  breaks: BreakRecord[];
  users: User[];
  teamId?: string;
  onForceEndBreak?: (breakId: string) => void;
}

export interface OverlapPair {
  breakA: BreakRecord;
  breakB: BreakRecord;
  agentA?: User;
  agentB?: User;
  overlapDurationSeconds: number;
  startTime: number;
}

export const BreakOverlapAlert: React.FC<BreakOverlapAlertProps> = ({
  breaks,
  users,
  teamId,
  onForceEndBreak,
}) => {
  // Find active breaks for this team or all floor
  const activeBreaks = useMemo(() => {
    return breaks.filter((b) => {
      if (!b.isActive) return false;
      if (teamId && b.teamId && b.teamId !== teamId) return false;
      return true;
    });
  }, [breaks, teamId]);

  // Detect pairs of active breaks overlapping > 15 minutes (900s)
  const overlappingPairs = useMemo(() => {
    const pairs: OverlapPair[] = [];
    const now = Date.now();

    for (let i = 0; i < activeBreaks.length; i++) {
      for (let j = i + 1; j < activeBreaks.length; j++) {
        const bA = activeBreaks[i];
        const bB = activeBreaks[j];

        // The overlap starts when the later break began
        const overlapStart = Math.max(bA.startTime, bB.startTime);
        const overlapSeconds = Math.max(0, Math.floor((now - overlapStart) / 1000));

        // Threshold: > 15 minutes (900 seconds)
        // For testing/preview responsiveness we also highlight pairs reaching threshold
        if (overlapSeconds >= 15 * 60) {
          pairs.push({
            breakA: bA,
            breakB: bB,
            agentA: users.find((u) => u.email === bA.agentEmail),
            agentB: users.find((u) => u.email === bB.agentEmail),
            overlapDurationSeconds: overlapSeconds,
            startTime: overlapStart,
          });
        }
      }
    }
    return pairs;
  }, [activeBreaks, users]);

  if (overlappingPairs.length === 0) {
    return null;
  }

  const formatMinutes = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div
      id="break-overlap-supervisor-alert"
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/80 to-zinc-950/90 border-2 border-rose-500 shadow-[0_0_35px_rgba(255,0,60,0.4)] backdrop-blur-xl animate-pulse space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/30 border border-rose-400 text-rose-400">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-orbitron font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500 text-black">
                CRITICAL SUPERVISOR NOTICE
              </span>
              <span className="text-xs font-orbitron text-rose-300 font-bold">
                BREAK OVERLAP &gt; 15 MINS DETECTED
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-inter mt-1">
              Simultaneous break overlap exceeds the 15-minute floor service threshold. Sales desk coverage is compromised.
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-rose-300">
          <span className="font-orbitron font-bold text-rose-400">{overlappingPairs.length}</span> Active Violation{overlappingPairs.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* List of overlapping pairs */}
      <div className="space-y-2 pt-2 border-t border-rose-500/30">
        {overlappingPairs.map((pair, idx) => (
          <div
            key={`${pair.breakA.breakId}-${pair.breakB.breakId}-${idx}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-black/60 border border-rose-500/30 text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                <img
                  src={pair.agentA?.avatarUrl}
                  alt={pair.agentA?.name}
                  className="w-8 h-8 rounded-full border-2 border-rose-500 object-cover"
                  referrerPolicy="no-referrer"
                />
                <img
                  src={pair.agentB?.avatarUrl}
                  alt={pair.agentB?.name}
                  className="w-8 h-8 rounded-full border-2 border-rose-500 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <div className="font-orbitron font-bold text-white flex items-center gap-2">
                  <span>{pair.agentA?.name || pair.breakA.agentEmail}</span>
                  <span className="text-zinc-400 font-normal">&amp;</span>
                  <span>{pair.agentB?.name || pair.breakB.agentEmail}</span>
                </div>
                <div className="text-[11px] text-rose-400 flex items-center gap-2 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Concurrent Overlap: <strong className="font-mono">{formatMinutes(pair.overlapDurationSeconds)}</strong> (exceeds 15m cap)
                  </span>
                </div>
              </div>
            </div>

            {onForceEndBreak && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onForceEndBreak(pair.breakA.breakId);
                    playSound('click');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 text-[11px] font-orbitron font-semibold transition-colors cursor-pointer"
                >
                  Recall {pair.agentA?.name?.split(' ')[0] || 'Agent A'}
                </button>
                <button
                  onClick={() => {
                    onForceEndBreak(pair.breakB.breakId);
                    playSound('click');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 text-[11px] font-orbitron font-semibold transition-colors cursor-pointer"
                >
                  Recall {pair.agentB?.name?.split(' ')[0] || 'Agent B'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
