import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../../types';
import {
  Undo2,
  Users,
  Search,
  Zap,
  ChevronDown,
  Shield,
  UserCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { playSound } from '../../lib/sound';
import { SNAP } from '../../styles/motion-presets';

export const SimulationToolbar: React.FC = () => {
  const {
    currentUser,
    realUser,
    isSimulating,
    exitSimulation,
    switchSimulatedUser,
    users,
    setIsGodModeOpen,
  } = useApp();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isSimulating || !currentUser) {
    return null;
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.teamId && u.teamId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'developer':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'admin':
        return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40';
      case 'supervisor':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'agent':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <AnimatePresence>
      <motion.aside
        id="simulation-toolbar"
        aria-label="Simulation Mode Toolbar"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={SNAP}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-4xl"
      >
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-500 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(255,215,0,0.3)]">
          <div className="bg-zinc-950/92 backdrop-blur-2xl rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white">
            {/* Left: Active Simulation Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400/70 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-orbitron uppercase tracking-wider font-extrabold text-yellow-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" />
                    SIMULATION MODE
                  </span>
                  <span
                    className={`text-[9px] font-orbitron uppercase px-1.5 py-0.2 rounded border font-semibold ${getRoleBadgeStyle(
                      currentUser.role
                    )}`}
                  >
                    {currentUser.role}
                  </span>
                  {currentUser.teamId && (
                    <span className="text-[9px] font-orbitron px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {currentUser.teamId.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-zinc-100 truncate flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <span className="text-[10px] text-zinc-400 font-normal hidden sm:inline truncate">
                    ({currentUser.email})
                  </span>
                </div>
                <div className="text-[9px] text-zinc-400 font-inter truncate">
                  Original Superuser:{' '}
                  <span className="text-zinc-200 font-semibold">
                    {realUser?.name || 'Adham Badran'}
                  </span>{' '}
                  ({realUser?.role || 'Developer'})
                </div>
              </div>
            </div>

            {/* Right: Actions & User Switcher */}
            <div className="flex items-center gap-2 flex-wrap" ref={dropdownRef}>
              {/* Quick Switch Simulated User Dropdown */}
              <div className="relative">
                <button
                  id="switch-simulated-user-btn"
                  onClick={() => {
                    setIsSwitcherOpen(!isSwitcherOpen);
                    playSound('click');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 text-xs font-inter text-zinc-200 hover:text-white transition-all cursor-pointer hover:border-yellow-400/40"
                  title="Switch or change active simulated user"
                >
                  <Users className="w-3.5 h-3.5 text-cyan" />
                  <span className="font-semibold text-xs">Switch User / Change Simulation</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                      isSwitcherOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Popover User Matrix */}
                <AnimatePresence>
                  {isSwitcherOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={SNAP}
                      className="absolute bottom-12 right-0 w-80 sm:w-96 max-h-[460px] z-50 flex flex-col"
                    >
                      <GlassPanel
                        material="thick"
                        className="p-3 border border-yellow-400/40 shadow-2xl space-y-3 bg-zinc-950/95 flex flex-col max-h-[460px]"
                      >
                        {/* Popover Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-1.5 text-xs font-orbitron font-bold text-yellow-400">
                            <UserCheck className="w-4 h-4 text-yellow-400" />
                            <span>Change Simulation Identity</span>
                          </div>
                          <button
                            onClick={() => setIsSwitcherOpen(false)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Search name, email, or team..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
                          />
                        </div>

                        {/* Role Filter Chips */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-orbitron">
                          {(['all', 'agent', 'supervisor', 'admin', 'developer'] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => setRoleFilter(r)}
                              className={`px-2 py-0.5 rounded-lg uppercase whitespace-nowrap transition-colors ${
                                roleFilter === r
                                  ? 'bg-yellow-400 text-black font-bold'
                                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>

                        {/* Users List */}
                        <div className="flex-1 overflow-y-auto space-y-1 max-h-56 pr-1 custom-scrollbar">
                          {filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-zinc-500 font-inter">
                              No matching users found.
                            </div>
                          ) : (
                            filteredUsers.map((u) => {
                              const isCurrent = currentUser.email === u.email;
                              return (
                                <button
                                  key={u.id}
                                  onClick={() => {
                                    switchSimulatedUser(u.email);
                                    setIsSwitcherOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                                    isCurrent
                                      ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-300 font-bold'
                                      : 'hover:bg-zinc-800/70 border border-transparent text-zinc-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img
                                      src={u.avatarUrl}
                                      alt={u.name}
                                      className="w-7 h-7 rounded-full object-cover border border-white/20"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="truncate">
                                      <div className="truncate font-semibold">{u.name}</div>
                                      <div className="text-[10px] text-zinc-400 truncate">
                                        {u.email}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-0.5 ml-2">
                                    <span
                                      className={`text-[8px] font-orbitron uppercase px-1.5 py-0.2 rounded border font-semibold ${getRoleBadgeStyle(
                                        u.role
                                      )}`}
                                    >
                                      {u.role}
                                    </span>
                                    {u.teamId && (
                                      <span className="text-[8px] text-zinc-400 font-orbitron">
                                        {u.teamId.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </GlassPanel>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick God Mode Trigger */}
              <button
                id="toolbar-godmode-btn"
                onClick={() => {
                  setIsGodModeOpen(true);
                  playSound('bonus');
                }}
                className="p-1.5 rounded-xl bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 transition-all hover:scale-105 cursor-pointer"
                title="Open God Mode Command Center"
              >
                <Zap className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </button>

              {/* Direct Return to Developer Button */}
              <button
                id="exit-simulation-btn"
                onClick={() => {
                  exitSimulation();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-orbitron font-black text-xs shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Return to Original Developer (Adham Badraan)"
              >
                <Undo2 className="w-4 h-4 stroke-[2.5]" />
                <span>Return to Original Developer</span>
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
