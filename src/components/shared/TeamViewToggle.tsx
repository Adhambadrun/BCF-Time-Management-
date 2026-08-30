import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, Check, Users, Layers, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../../lib/sound';

interface TeamViewToggleProps {
  selectedTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
  className?: string;
}

export const TeamViewToggle: React.FC<TeamViewToggleProps> = ({
  selectedTeamId: propSelectedTeamId,
  onSelectTeam,
  className = '',
}) => {
  const {
    teams,
    users,
    breaks,
    activeTeamId: contextActiveTeamId,
    setActiveTeamId: contextSetActiveTeamId,
    currentUser,
    openModal,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use prop if passed, otherwise global context
  const activeTeam = propSelectedTeamId ?? contextActiveTeamId;
  const isAll = activeTeam === 'ALL' || activeTeam === 'all';

  const handleSelect = (teamId: string) => {
    playSound('click');
    if (onSelectTeam) {
      onSelectTeam(teamId);
    } else {
      contextSetActiveTeamId(teamId);
    }
    setIsOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Current active team object (or custom 'All' meta)
  const currentTeamObj = teams.find(t => t.teamId === activeTeam) || teams[0];
  const totalFloorAgents = users.filter(
    u =>
      u.role === 'agent' ||
      u.role === 'independent' ||
      (u.teamId === 'cai-1' && u.email.toLowerCase() === 'dominick@bcflights.com')
  ).length;
  const totalActiveBreaks = breaks.filter(b => b.isActive).length;

  const currentTeamAgentsCount = isAll
    ? totalFloorAgents
    : users.filter(
        u =>
          u.teamId === activeTeam &&
          (u.role === 'agent' ||
            u.role === 'independent' ||
            (activeTeam === 'cai-1' && u.email.toLowerCase() === 'dominick@bcflights.com'))
      ).length;

  const currentTeamBreakersCount = isAll
    ? totalActiveBreaks
    : breaks.filter(
        b => b.isActive && (b.teamId === activeTeam || users.some(u => u.teamId === activeTeam && u.email === b.agentEmail))
      ).length;

  const canManage =
    currentUser?.role === 'developer' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'supervisor';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          playSound('hover_tick');
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/15 hover:border-yellow-400/50 backdrop-blur-xl shadow-lg transition-all duration-200 text-xs font-orbitron group cursor-pointer"
        title="Switch Team View or Preview Entire Floor"
      >
        {/* Team Color / All Indicator */}
        {isAll ? (
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 shadow-[0_0_8px_#FFD700] animate-pulse" />
        ) : (
          <div
            className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
            style={{
              backgroundColor: currentTeamObj?.teamColorAccent || '#FFD700',
              color: currentTeamObj?.teamColorAccent || '#FFD700',
            }}
          />
        )}

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-100 group-hover:text-yellow-300 transition-colors">
            {isAll ? 'All Teams' : currentTeamObj?.teamName || 'Select Team'}
          </span>
          <span className="text-[10px] font-mono font-normal text-zinc-400">
            ({currentTeamAgentsCount})
          </span>
          {currentTeamBreakersCount > 0 && (
            <span className="text-[9px] font-mono px-1 rounded bg-cyan/20 text-cyan border border-cyan/40 font-bold">
              {currentTeamBreakersCount} on break
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-yellow-400' : ''
          }`}
        />
      </button>

      {/* Glassmorphic Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 mt-2 w-64 rounded-2xl bg-zinc-950/95 border border-white/20 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-2 z-50 focus:outline-none"
            role="listbox"
          >
            {/* Header / Info bar */}
            <div className="flex items-center justify-between px-2.5 py-1.5 mb-1.5 border-b border-white/10 text-[10px] font-orbitron text-zinc-400 uppercase tracking-wider">
              <span>Floor Team Filter</span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openModal('manageTeams');
                  }}
                  className="text-yellow-400 hover:underline flex items-center gap-1 font-bold text-[10px] cursor-pointer"
                >
                  ⚙️ Manage
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-1 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
              {/* Option: All Teams */}
              <button
                type="button"
                role="option"
                aria-selected={isAll}
                onClick={() => handleSelect('ALL')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  isAll
                    ? 'bg-yellow-400/20 border border-yellow-400/50 text-white font-bold shadow-md'
                    : 'hover:bg-zinc-800/70 text-zinc-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-xs text-black font-extrabold shadow-sm">
                    🌐
                  </div>
                  <div>
                    <div className="font-orbitron text-xs flex items-center gap-1.5">
                      <span>All Teams</span>
                      <span className="text-[10px] font-normal text-zinc-400 font-sans">(Floor Overview)</span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      {totalFloorAgents} pods · {teams.length} teams
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {totalActiveBreaks > 0 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan/20 border border-cyan/40 text-cyan font-bold">
                      {totalActiveBreaks}
                    </span>
                  )}
                  {isAll && <Check className="w-4 h-4 text-yellow-400 shrink-0" />}
                </div>
              </button>

              <div className="my-1 border-t border-white/10" />

              {/* Individual CAI Teams */}
              {teams.map((team) => {
                const teamAgents = users.filter(u => u.teamId === team.teamId && u.role === 'agent');
                const teamBreakers = breaks.filter(
                  b => b.isActive && (b.teamId === team.teamId || users.some(u => u.teamId === team.teamId && u.email === b.agentEmail))
                );
                const isSelected = !isAll && activeTeam === team.teamId;

                return (
                  <button
                    key={team.teamId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(team.teamId)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 text-white font-bold border'
                        : 'hover:bg-zinc-800/60 text-zinc-300 border border-transparent'
                    }`}
                    style={{
                      borderColor: isSelected ? team.teamColorAccent : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-lg flex items-center justify-center font-orbitron font-black text-[10px] text-black shadow-sm"
                        style={{ backgroundColor: team.teamColorAccent }}
                      >
                        {team.teamName.replace(/[^0-9]/g, '') || team.teamName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-orbitron text-xs">{team.teamName}</div>
                        <div className="text-[10px] font-inter text-zinc-400">
                          {teamAgents.length} {teamAgents.length === 1 ? 'pod' : 'pods'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {teamBreakers.length > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan/20 border border-cyan/40 text-cyan font-bold">
                          {teamBreakers.length} brk
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-yellow-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
