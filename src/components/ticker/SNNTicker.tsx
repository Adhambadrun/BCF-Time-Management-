import React from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { Zap, AlertTriangle, Gift, Crown, AlertOctagon, Smile, Sun, Cake, ChevronRight } from 'lucide-react';
import { playSound } from '../../lib/sound';
import { motion } from 'motion/react';

export const SNNTicker: React.FC = () => {
  const { headlines, setIsNewsPanelOpen, currentUser } = useApp();

  // Role-Based Privacy Engine
  // AGENT: strictly filter events originating ONLY from their assigned teamId (cross-team events redacted)
  // SUPERVISOR: floor-wide updates across all teams
  // ADMIN: floor-wide + administrative logs
  // DEVELOPER / GOD MODE: unfiltered GOD access to all streams & alerts
  const filteredHeadlines = headlines.filter(hl => {
    if (!currentUser) return true;
    if (currentUser.role === 'developer' || currentUser.role === 'admin') {
      return true;
    }
    if (currentUser.role === 'supervisor') {
      return !hl.isGodMessage;
    }
    if (currentUser.role === 'agent') {
      // General floor announcements or matching user team only
      if (hl.visibility === 'admin_only' || hl.visibility === 'supervisor_only') {
        return false;
      }
      if (hl.teamId && hl.teamId !== currentUser.teamId) {
        return false;
      }
      return true;
    }
    return true;
  });

  const displayHeadlines = filteredHeadlines.length > 0 ? filteredHeadlines : headlines;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'break':
        return <Zap className="w-3.5 h-3.5 text-cyan inline mr-1" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 inline mr-1" />;
      case 'bonus':
        return <Gift className="w-3.5 h-3.5 text-gold inline mr-1" />;
      case 'achievement':
        return <Crown className="w-3.5 h-3.5 text-gold inline mr-1" />;
      case 'alert':
        return <AlertOctagon className="w-3.5 h-3.5 text-crimson inline mr-1" />;
      case 'weather':
        return <Sun className="w-3.5 h-3.5 text-cyan inline mr-1" />;
      case 'birthday':
        return <Cake className="w-3.5 h-3.5 text-pink-400 inline mr-1" />;
      default:
        return <Smile className="w-3.5 h-3.5 text-zinc-300 inline mr-1" />;
    }
  };

  return (
    <div className="sticky top-[76px] lg:top-[80px] z-30 w-full h-[44px] border-b border-white/5">
      <GlassPanel
        material="thin"
        concentricRadius="none"
        className="w-full h-full flex items-center justify-between overflow-hidden px-2 md:px-4"
      >
        {/* LEFT BADGE: SNN Live Ticker */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-crimson to-red-600 px-3 py-1 rounded-lg text-white font-orbitron font-bold text-xs tracking-wider shadow-[0_0_12px_rgba(255,0,60,0.5)] shrink-0 z-10">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>SNN LIVE</span>
        </div>

        {/* CENTER: Infinite Marquee Stream with 45s pace and instant hover pause */}
        <div className="flex-1 overflow-hidden relative mx-4 cursor-pointer">
          <div className="animate-marquee-slow flex items-center gap-8 text-xs font-inter text-zinc-200">
            {displayHeadlines.map((hl, i) => (
              <span key={hl.headlineId + '_' + i} className="inline-flex items-center gap-1.5 shrink-0">
                {getCategoryIcon(hl.category)}
                <span
                  className={
                    hl.priority === 'critical'
                      ? 'text-red-400 font-bold underline'
                      : hl.priority === 'urgent'
                      ? 'text-yellow-300 font-semibold'
                      : 'text-zinc-200'
                  }
                >
                  {hl.headlineText}
                </span>
                <span className="text-yellow-400 font-bold mx-2">|||</span>
              </span>
            ))}
            {/* Duplicate set for continuous seamless loop */}
            {displayHeadlines.map((hl, i) => (
              <span key={'dup_' + hl.headlineId + '_' + i} className="inline-flex items-center gap-1.5 shrink-0">
                {getCategoryIcon(hl.category)}
                <span
                  className={
                    hl.priority === 'critical'
                      ? 'text-red-400 font-bold underline'
                      : hl.priority === 'urgent'
                      ? 'text-yellow-300 font-semibold'
                      : 'text-zinc-200'
                  }
                >
                  {hl.headlineText}
                </span>
                <span className="text-yellow-400 font-bold mx-2">|||</span>
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT: Expand News Panel Button */}
        <button
          onClick={() => {
            setIsNewsPanelOpen(true);
            playSound('click');
          }}
          className="shrink-0 flex items-center gap-1 text-[11px] font-orbitron font-semibold text-yellow-400 hover:text-yellow-300 px-2.5 py-1 rounded-lg hover:bg-yellow-400/10 border border-yellow-400/30 transition-all z-10 cursor-pointer"
        >
          <span>FEED</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </GlassPanel>
    </div>
  );
};
