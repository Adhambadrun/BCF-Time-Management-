import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../shared/GlassPanel';
import { useApp } from '../../context/AppContext';
import { Bell, X, AlertTriangle, Coffee, Radio, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { playSound } from '../../lib/sound';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { broadcasts, headlines, warnings, currentUser, acknowledgeBroadcast } = useApp();

  const userWarnings = warnings.filter(w => w.agentEmail === currentUser?.email);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-md z-50 p-4 md:p-6"
          >
            <GlassPanel
              material="thick"
              concentricRadius="2xl"
              className="h-full w-full flex flex-col border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-crimson/20 border border-crimson/40 flex items-center justify-center text-crimson shadow-[0_0_15px_rgba(255,0,60,0.4)]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-orbitron font-bold text-lg text-zinc-100 flex items-center gap-2">
                      Notification Center
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] animate-pulse" />
                    </h2>
                    <p className="text-xs text-zinc-400 font-inter">
                      Shift updates, floor broadcasts & alerts
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    playSound('click');
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {/* Active Broadcasts */}
                {broadcasts.map(broadcast => (
                  <div
                    key={broadcast.broadcastId}
                    className={`p-4 rounded-2xl border transition-all ${
                      broadcast.priority === 'urgent'
                        ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        : 'bg-yellow-950/30 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-orbitron font-bold text-yellow-300">
                        <Radio className="w-3.5 h-3.5 animate-pulse text-crimson" />
                        {broadcast.priority.toUpperCase()} BROADCAST
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(broadcast.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1 font-inter">{broadcast.title}</h4>
                    <p className="text-xs text-zinc-300 font-inter leading-relaxed">{broadcast.message}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">From: {broadcast.sentBy}</span>
                      {currentUser && !broadcast.acknowledgments?.includes(currentUser.email) && (
                        <button
                          onClick={() => {
                            acknowledgeBroadcast(broadcast.broadcastId);
                            playSound('click');
                          }}
                          className="px-3 py-1 rounded-lg bg-yellow-400 text-black font-bold font-orbitron hover:bg-yellow-300 transition-all text-xs"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Personal Warnings */}
                {userWarnings.map(warning => (
                  <div
                    key={warning.id}
                    className="p-4 rounded-2xl bg-orange-950/30 border border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-orbitron font-bold text-orange-400">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                        WARNING LEVEL {warning.level}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(warning.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 font-inter">{warning.customNote || warning.reason}</p>
                  </div>
                ))}

                {/* Live Shift Headlines */}
                {headlines.slice(0, 5).map(headline => (
                  <div
                    key={headline.id}
                    className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-orbitron uppercase text-cyan font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan" />
                        {headline.category}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(headline.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 font-inter">{headline.text}</p>
                  </div>
                ))}

                {broadcasts.length === 0 && userWarnings.length === 0 && headlines.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                    <p className="text-sm font-orbitron">All caught up</p>
                    <p className="text-xs font-inter mt-1">No new alerts or broadcast dispatches.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-orbitron">
                  <Clock className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Cairo Shift 10 PM - 6 AM</span>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-orbitron text-zinc-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
