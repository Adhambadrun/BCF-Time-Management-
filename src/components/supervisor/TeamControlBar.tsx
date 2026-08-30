import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ShieldCheck, Lock, Unlock, AlertTriangle, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playSound } from '../../lib/sound';

interface TeamControlBarProps {
  teamId: string;
  teamName: string;
  teamColor?: string;
  agentCount: number;
}

export const TeamControlBar: React.FC<TeamControlBarProps> = ({
  teamId,
  teamName,
  teamColor = '#FFD700',
  agentCount,
}) => {
  const {
    teams,
    users,
    breaks,
    currentUser,
    blockTeamBreaks,
    unblockTeamBreaks,
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<'block' | 'unblock' | null>(null);

  const currentTeam = teams.find(t => t.teamId === teamId);
  const teamAgents = users.filter(u => u.teamId === teamId && u.role === 'agent');
  const activeBreakers = breaks.filter(
    b => b.isActive && (b.teamId === teamId || teamAgents.some(a => a.email === b.agentEmail))
  );

  // Check if team is currently blocked (either via team.isBreakBlocked or majority/all agents blocked)
  const isTeamBlocked =
    currentTeam?.isBreakBlocked ||
    (teamAgents.length > 0 && teamAgents.every(a => a.isBreakAllowed === false || a.isBlocked));

  const canManage =
    currentUser?.role === 'developer' ||
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'supervisor' && (currentUser?.teamId === teamId || !currentUser?.teamId));

  if (!canManage) return null;

  const handleBlockTeam = async () => {
    setIsProcessing(true);
    setShowConfirmModal(null);
    try {
      await blockTeamBreaks(teamId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnblockTeam = async () => {
    setIsProcessing(true);
    setShowConfirmModal(null);
    try {
      await unblockTeamBreaks(teamId);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-zinc-950/70 border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Team State Overview */}
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse"
            style={{ backgroundColor: isTeamBlocked ? '#FF003C' : teamColor, color: isTeamBlocked ? '#FF003C' : teamColor }}
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-xs font-orbitron font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              {teamName} Floor Status:
            </span>
            <span
              className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 w-fit ${
                isTeamBlocked
                  ? 'bg-crimson/20 border-crimson/40 text-crimson shadow-[0_0_10px_rgba(255,0,60,0.2)]'
                  : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
              }`}
            >
              {isTeamBlocked ? (
                <>
                  <Lock className="w-3 h-3 text-crimson" />
                  <span>BREAKS LOCKED ({teamAgents.length} Agents)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>BREAKS OPEN ({activeBreakers.length} on Break)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Team-Wide Action Buttons */}
        <div className="flex items-center gap-2">
          {isTeamBlocked ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('click');
                setShowConfirmModal('unblock');
              }}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-orbitron font-bold tracking-wide transition-all shadow-[0_0_12px_rgba(0,255,136,0.15)] hover:shadow-[0_0_16px_rgba(0,255,136,0.3)] disabled:opacity-50 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unblock All Members</span>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playSound('warning');
                setShowConfirmModal('block');
              }}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-crimson/20 hover:bg-crimson/30 border border-crimson/40 text-red-300 text-xs font-orbitron font-bold tracking-wide transition-all shadow-[0_0_12px_rgba(255,0,60,0.15)] hover:shadow-[0_0_16px_rgba(255,0,60,0.3)] disabled:opacity-50 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-crimson" />
              <span>Block Team Breaks</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Destructive / Safety Handling */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md p-6 rounded-3xl bg-zinc-950 border border-white/20 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    showConfirmModal === 'block'
                      ? 'bg-crimson/20 border border-crimson/40 text-crimson'
                      : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-400'
                  }`}
                >
                  {showConfirmModal === 'block' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-orbitron font-extrabold text-base text-zinc-100 uppercase tracking-wide">
                    {showConfirmModal === 'block'
                      ? `Block Breaks for ${teamName}?`
                      : `Restore Breaks for ${teamName}?`}
                  </h3>
                  <p className="text-xs text-zinc-400 font-inter">
                    {showConfirmModal === 'block'
                      ? `This will lock breaks for all ${teamAgents.length} agents in ${teamName} and instantly force any active breakers back to the floor.`
                      : `This will restore full break privileges across all ${teamAgents.length} agents in ${teamName}.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-orbitron font-semibold text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={showConfirmModal === 'block' ? handleBlockTeam : handleUnblockTeam}
                  disabled={isProcessing}
                  className={`px-5 py-2 rounded-xl text-xs font-orbitron font-bold shadow-lg transition-all ${
                    showConfirmModal === 'block'
                      ? 'bg-crimson hover:bg-red-600 text-white shadow-[0_0_15px_rgba(255,0,60,0.4)]'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(0,255,136,0.4)]'
                  }`}
                >
                  {isProcessing
                    ? 'Processing Batch...'
                    : showConfirmModal === 'block'
                    ? 'Confirm Block Team'
                    : 'Confirm Unblock All'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
