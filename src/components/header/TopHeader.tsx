import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { RoleGuard } from '../shared/RoleGuard';
import { Clock, Users, Zap, ChevronDown, MessageSquare, CloudSun, Settings, Award, User, LogOut, Radio, Bell, ArrowRightLeft, ShieldAlert, Search, X, Check, Flame, ShieldOff, Sliders } from 'lucide-react';
import { SNAP, GLIDE } from '../../styles/motion-presets';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../../lib/sound';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

export const TopHeader: React.FC = () => {
  const {
    currentUser,
    realUser,
    isSimulating,
    exitSimulation,
    users,
    loginAs,
    teams,
    activeTeamId,
    setActiveTeamId,
    activeBreaksCount,
    shiftConfig,
    totalTeamBreakMinutes,
    setIsGodModeOpen,
    setIsSettingsOpen,
    setIsMessagesOpen,
    openModal,
    logout,
    endRallyMode,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdham =
    currentUser?.email?.toLowerCase() === 'adhambadraan@gmail.com' ||
    currentUser?.email?.toLowerCase() === 'adhambadran@bcflights.com' ||
    realUser?.email?.toLowerCase() === 'adhambadraan@gmail.com' ||
    realUser?.role === 'developer' ||
    currentUser?.role === 'developer';

  const isAllTeams = activeTeamId === 'ALL';
  const totalFloorAgents = users.filter(u => u.role === 'agent').length;
  const activeTeam = isAllTeams
    ? {
        teamId: 'ALL',
        teamName: 'ALL TEAMS',
        teamColorAccent: '#FFD700',
        teamLogo: '/logo.png',
        agentCount: totalFloorAgents,
        competitionScore: 100,
        isActive: true,
      }
    : teams.find(t => t.teamId === activeTeamId) || teams[0];
  const capacityPercent = Math.min(100, Math.round((activeBreaksCount / shiftConfig.breakCapacity) * 100));

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsTeamSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-[76px] lg:h-[80px]">
        <GlassPanel
          material="thin"
          concentricRadius="none"
          className="w-full h-full border-x-0 border-t-0 flex items-center justify-between px-3 md:px-6 shadow-2xl"
        >
          {/* LEFT: Shift Time Component Block with Official Logo Asset Binding (Borderless, Same Size as Team Logo) */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="BCF Logo"
              className="w-11 h-11 md:w-13 md:h-13 object-contain filter drop-shadow-[0_0_10px_rgba(255,215,0,0.45)] transition-transform hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider font-inter">
                Shift Time
              </span>
              <span className="text-xs md:text-sm font-bold text-amber-400 font-mono tracking-tight">
                10:00 PM – 6:00 AM
              </span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-inter hidden sm:inline">
                Cairo / Egypt Time (UTC+2)
              </span>
            </div>
          </div>

          {/* CENTER-LEFT: Team Logo & Brand (with Admin Team Switcher) */}
          <div className="flex items-center gap-3 relative">
            <div
              className={`relative group ${
                currentUser?.role === 'admin' || currentUser?.role === 'developer'
                  ? 'cursor-pointer'
                  : 'cursor-default'
              }`}
              onClick={() => {
                if (currentUser?.role === 'admin' || currentUser?.role === 'developer') {
                  setIsTeamSelectorOpen(!isTeamSelectorOpen);
                }
              }}
            >
              <div className="w-11 h-11 md:w-13 md:h-13 rounded-full overflow-hidden border-2 border-yellow-400/60 shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-transform group-hover:scale-105 bg-black/40">
                <img
                  src={activeTeam?.teamLogo || '/logo.png'}
                  alt={activeTeam?.teamName || 'BCF Team'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to /logo.png
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
              {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded-full border border-black" title="Switch or manage teams">
                  ▼
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-black text-xl md:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500">
                  {activeTeam?.teamName || 'CAI Floor'}
                </span>
                <span className="text-[10px] font-orbitron px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300">
                  {activeTeam?.agentCount || 10} AGENTS
                </span>
                {(currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                  <button
                    onClick={() => openModal('editTeam', activeTeam)}
                    className="p-1 rounded-md bg-white/5 hover:bg-yellow-400/20 text-zinc-400 hover:text-yellow-300 transition-colors"
                    title="Edit team name or logo"
                  >
                    <span className="text-xs">✏️</span>
                  </button>
                )}
              </div>
              <div className="text-[10px] text-zinc-400 font-inter tracking-wide hidden sm:block">
                BCF Time Management · Floor OS
              </div>
            </div>

            {/* Team Selector Dropdown for Admin & Developer */}
            <AnimatePresence>
              {isTeamSelectorOpen && (currentUser?.role === 'admin' || currentUser?.role === 'developer') && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={SNAP}
                  className="absolute top-16 left-0 w-72 z-50"
                >
                  <GlassPanel material="thick" className="p-3 shadow-2xl space-y-2 border border-white/20">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-xs font-orbitron text-zinc-400 uppercase tracking-wider">
                        Select Active Team
                      </span>
                      <button
                        onClick={() => {
                          setIsTeamSelectorOpen(false);
                          openModal('manageTeams');
                        }}
                        className="text-[10px] font-orbitron text-yellow-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        ⚙️ Manage All
                      </button>
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {/* Global All Teams Option */}
                      <button
                        onClick={() => {
                          setActiveTeamId('ALL');
                          setIsTeamSelectorOpen(false);
                          playSound('click');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                          activeTeamId === 'ALL'
                            ? 'bg-yellow-400/20 border border-yellow-400/50 text-white font-semibold'
                            : 'hover:bg-zinc-800/60 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-[10px] text-black font-bold">
                            🌐
                          </div>
                          <span className="font-orbitron text-sm">All Teams (Global)</span>
                        </div>
                        <span className="text-xs text-zinc-400 font-teko text-base">
                          {totalFloorAgents} pods
                        </span>
                      </button>

                      {teams.map(team => (
                        <button
                          key={team.teamId}
                          onClick={() => {
                            setActiveTeamId(team.teamId);
                            setIsTeamSelectorOpen(false);
                            playSound('click');
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                            activeTeamId === team.teamId
                              ? 'bg-yellow-400/20 border border-yellow-400/50 text-white font-semibold'
                              : 'hover:bg-zinc-800/60 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={team.teamLogo || '/logo.png'}
                              alt={team.teamName}
                              className="w-5 h-5 rounded-full object-cover border border-white/20"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo.png';
                              }}
                            />
                            <span className="font-orbitron text-sm">{team.teamName}</span>
                          </div>
                          <span className="text-xs text-zinc-400 font-teko text-base">
                            {team.agentCount} pods
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsTeamSelectorOpen(false);
                          openModal('addAgent', { teamId: activeTeamId });
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 text-[11px] font-orbitron font-bold text-center transition-colors"
                      >
                        + Add Agent Pod
                      </button>
                      <button
                        onClick={() => {
                          setIsTeamSelectorOpen(false);
                          openModal('editTeam', activeTeam);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 text-[11px] font-orbitron font-medium text-center transition-colors"
                      >
                        Edit Team
                      </button>
                    </div>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CENTER: Capacity Indicator (Liquid Bar) */}
          <div className="hidden lg:flex flex-col items-center justify-center min-w-[170px]">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Users className="w-4 h-4 text-cyan" />
              <span className="text-[10px] font-orbitron tracking-wider text-zinc-300">CAPACITY</span>
            </div>
            <div className="flex items-baseline gap-1 font-teko">
              <span className="text-3xl font-bold text-yellow-400 leading-none">
                {activeBreaksCount}
              </span>
              <span className="text-xl text-zinc-400">/{shiftConfig.breakCapacity}</span>
              <span className="text-xs font-orbitron text-zinc-400 ml-1">ON BREAK</span>
            </div>
            <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden border border-white/5 mt-0.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${capacityPercent}%`,
                  background:
                    capacityPercent < 60
                      ? 'linear-gradient(90deg, #00FF88, #00E5FF)'
                      : capacityPercent < 90
                      ? 'linear-gradient(90deg, #00E5FF, #FFD700)'
                      : 'linear-gradient(90deg, #FF8800, #FF003C)',
                }}
              />
            </div>
          </div>

          {/* CENTER-RIGHT: Total Team Break Time */}
          <div className="hidden xl:flex flex-col items-center justify-center min-w-[170px]">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] font-orbitron tracking-wider text-zinc-300">TEAM BREAK TIME</span>
            </div>
            <div className="font-teko text-3xl font-semibold text-zinc-100 leading-none">
              {formatTime(totalTeamBreakMinutes)}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-inter">
              SHIFT AGGREGATE
            </div>
          </div>

          {/* RIGHT: Quick Utility Controls & User Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
            {/* Notification Bell with Pulsing Crimson Indicator */}
            <button
              onClick={() => {
                setIsNotificationOpen(true);
                playSound('click');
              }}
              title="Notification Center"
              className="relative p-2.5 rounded-full hover:bg-zinc-800/70 border border-white/10 text-zinc-200 transition-all hover:scale-105 cursor-pointer bg-white/[0.03]"
            >
              <Bell className="w-5 h-5 text-yellow-400" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#FF3B30] shadow-[0_0_10px_#FF3B30] animate-pulse" />
            </button>

            {/* Cairo Weather Shortcut */}
            <button
              onClick={() => openModal('weather')}
              title="Cairo Weather & Shift Intel"
              className="p-2.5 rounded-full hover:bg-zinc-800/70 border border-white/10 text-yellow-400 transition-all hover:scale-105 cursor-pointer"
            >
              <CloudSun className="w-5 h-5" />
            </button>

            {/* Messages shortcut */}
            <button
              onClick={() => setIsMessagesOpen(true)}
              title="Private Shift Messaging"
              className="relative p-2.5 rounded-full hover:bg-zinc-800/70 border border-white/10 text-zinc-300 transition-all hover:scale-105 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-crimson shadow-[0_0_8px_#FF003C]" />
            </button>

            {/* Supervisor Handover Notes Shortcut */}
            <RoleGuard allowedRoles={['supervisor', 'admin', 'developer']}>
              <button
                onClick={() => openModal('handover')}
                title="Supervisor Shift Handover Notes"
                className="p-2.5 rounded-full hover:bg-zinc-800/70 border border-white/10 text-yellow-400 transition-all hover:scale-105 hidden sm:block cursor-pointer"
              >
                <Award className="w-5 h-5" />
              </button>
            </RoleGuard>

            {/* Active Rally Mode Emergency Disable Button in Header (Admin / Developer / Supervisor) */}
            {shiftConfig.rallyModeActive && (currentUser?.role === 'admin' || currentUser?.role === 'developer' || currentUser?.role === 'supervisor') && (
              <button
                onClick={() => {
                  endRallyMode();
                  playSound('break_end');
                }}
                title="Rally Mode is Active! Click to End Rally Mode and Resume Breaks"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-crimson hover:bg-emerald-500 text-white hover:text-black border border-white/30 shadow-[0_0_15px_#FF003C] hover:shadow-[0_0_20px_#00FF88] text-xs font-orbitron font-black transition-all animate-pulse hover:animate-none cursor-pointer"
              >
                <Flame className="w-4 h-4 animate-bounce" />
                <span className="hidden sm:inline">END RALLY</span>
              </button>
            )}

            {/* Developer God Mode ⚡ Icon (Exclusive to Developer / Active Simulation) */}
            {(currentUser?.role === 'developer' || realUser?.role === 'developer' || isSimulating) && (
              <button
                onClick={() => {
                  setIsGodModeOpen(true);
                  playSound('bonus');
                }}
                title="Developer God Mode Command Center ⚡"
                className="relative p-2.5 rounded-full bg-yellow-400/10 border-2 border-yellow-400/70 text-yellow-400 hover:scale-110 shadow-[0_0_20px_rgba(255,204,0,0.5)] transition-all animate-bounce duration-1000 cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </button>
            )}

            {/* User Profile Capsule Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-zinc-800/60 border border-white/15 transition-all bg-zinc-900/40 cursor-pointer"
              >
                <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-yellow-400/50">
                  <img
                    src={currentUser?.avatarUrl}
                    alt={currentUser?.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-[10px] text-zinc-400 leading-none">Welcome back,</div>
                  <div className="font-orbitron text-xs font-semibold text-zinc-100 truncate max-w-[100px]">
                    {currentUser?.name}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={GLIDE}
                    className="absolute right-0 top-14 w-72 z-50"
                  >
                    <GlassPanel material="thick" className="p-3 shadow-2xl space-y-1">
                      {/* User header info */}
                      <div className="p-2 border-b border-white/10 mb-2">
                        <div className="font-orbitron font-bold text-sm text-zinc-100">
                          {currentUser?.name}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">{currentUser?.email}</div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-orbitron uppercase px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 font-bold">
                            {currentUser?.role.toUpperCase()}
                          </span>
                          <span className="text-xs font-teko text-yellow-400">
                            {currentUser?.currentStreak} Day Streak 🔥
                          </span>
                        </div>
                      </div>

                      {/* Active Simulation Mode Banner in Dropdown */}
                      {isSimulating && (
                        <div className="p-2.5 mb-2 rounded-xl bg-amber-400/10 border border-amber-400/30">
                          <div className="text-[10px] font-orbitron uppercase text-amber-400 font-bold flex items-center justify-between">
                            <span>Simulating User</span>
                            <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-extrabold">ACTIVE</span>
                          </div>
                          <div className="text-[11px] text-zinc-300 mt-1">
                            Superuser: <span className="text-white font-semibold">{realUser?.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              exitSimulation();
                              setIsDropdownOpen(false);
                            }}
                            className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-orbitron font-black text-[11px] flex items-center justify-center gap-1 transition-transform hover:scale-[1.02] cursor-pointer"
                          >
                            Exit Simulation (Return to Dev)
                          </button>
                        </div>
                      )}

                      {/* Nav Actions */}
                      <button
                        onClick={() => {
                          openModal('profile');
                          setIsDropdownOpen(false);
                          playSound('click');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800/70 text-xs font-inter text-zinc-200 transition-all cursor-pointer"
                      >
                        <User className="w-4 h-4 text-cyan" />
                        My Profile & Goals
                      </button>

                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setIsDropdownOpen(false);
                          playSound('click');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800/70 text-xs font-inter text-zinc-200 transition-all cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-yellow-400" />
                        Preferences & Settings
                      </button>

                      <button
                        onClick={() => {
                          openModal('leaderboard');
                          setIsDropdownOpen(false);
                          playSound('click');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800/70 text-xs font-inter text-zinc-200 transition-all cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-yellow-400" />
                        Weekly Floor Leaderboards
                      </button>

                      <button
                        onClick={() => {
                          openModal('replay');
                          setIsDropdownOpen(false);
                          playSound('click');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800/70 text-xs font-inter text-zinc-200 transition-all cursor-pointer"
                      >
                        <Clock className="w-4 h-4 text-orange-400" />
                        Shift Replay (Time Machine)
                      </button>

                      <RoleGuard allowedRoles={['admin', 'developer']}>
                        <button
                          onClick={() => {
                            openModal('systemAdmin');
                            setIsDropdownOpen(false);
                            playSound('click');
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-yellow-400/20 text-xs font-inter text-yellow-400 font-semibold transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Sliders className="w-4 h-4 text-yellow-400" />
                            <span>System Management</span>
                          </div>
                          <span className="text-[9px] font-orbitron px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                            ADMIN/DEV
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            openModal('broadcast');
                            setIsDropdownOpen(false);
                            playSound('click');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800/70 text-xs font-inter text-crimson transition-all cursor-pointer"
                        >
                          <Radio className="w-4 h-4 text-crimson" />
                          Send Shift Broadcast
                        </button>
                        {shiftConfig.rallyModeActive && (
                          <button
                            onClick={() => {
                              endRallyMode();
                              setIsDropdownOpen(false);
                              playSound('break_end');
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-crimson/20 hover:bg-emerald-500/20 text-xs font-inter text-crimson hover:text-emerald-300 border border-crimson/40 hover:border-emerald-500/40 transition-all cursor-pointer mt-1"
                          >
                            <div className="flex items-center gap-2.5">
                              <ShieldOff className="w-4 h-4 text-crimson" />
                              <span className="font-semibold">Disable Rally Mode</span>
                            </div>
                            <span className="text-[9px] font-orbitron px-1.5 py-0.5 rounded bg-crimson/30 text-white font-bold">
                              ACTIVE
                            </span>
                          </button>
                        )}
                      </RoleGuard>

                      {/* Adham Developer Exclusive Controls */}
                      {isAdham && (
                        <div className="pt-1 pb-1 border-t border-yellow-400/30 my-1 bg-yellow-400/5 rounded-xl px-1 border-b">
                          <div className="px-2 py-1 text-[9px] font-orbitron uppercase text-yellow-400 font-bold tracking-wider flex items-center justify-between">
                            <span>Adham Master Access</span>
                            <span className="text-[8px] px-1.5 py-0.2 rounded bg-yellow-400 text-black font-extrabold">DEV</span>
                          </div>

                          <button
                            onClick={() => {
                              setIsGodModeOpen(true);
                              setIsDropdownOpen(false);
                              playSound('bonus');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-yellow-400/20 text-xs font-inter text-yellow-300 font-semibold transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span>Simulate Access</span>
                            </div>
                            <span className="text-[10px] font-mono text-yellow-400/70">GOD MODE</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsUserSwitcherOpen(true);
                              setIsDropdownOpen(false);
                              playSound('click');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-cyan/20 text-xs font-inter text-cyan font-semibold transition-all cursor-pointer mt-0.5"
                          >
                            <div className="flex items-center gap-2">
                              <ArrowRightLeft className="w-4 h-4 text-cyan" />
                              <span>Switch Between User</span>
                            </div>
                            <span className="text-[10px] font-mono text-cyan/70">{users.length} Users</span>
                          </button>
                        </div>
                      )}

                      <div className="border-t border-white/10 my-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-crimson/20 text-xs font-inter text-red-400 transition-all cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          Sign Out
                        </button>
                      </div>
                    </GlassPanel>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GlassPanel>
      </header>

      {/* Notification Slide-Over Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Adham Exclusive: Switch Between User Modal */}
      <AnimatePresence>
        {isUserSwitcherOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={SNAP}
              className="w-full max-w-2xl"
            >
              <GlassPanel material="thick" className="p-6 border border-cyan/40 shadow-[0_0_50px_rgba(0,229,255,0.25)] flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-cyan/20 border border-cyan text-cyan">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-orbitron font-bold text-lg text-white flex items-center gap-2">
                        <span>Switch User Identity</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/40">
                          EXCLUSIVE TO ADHAM
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400 font-inter">
                        Instant live identity impersonation for floor testing and verification.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUserSwitcherOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search by agent name, email, role, or team..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan transition-all"
                  />
                  {userSearchTerm && (
                    <button
                      onClick={() => setUserSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Users List Grid */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* Developers & Admins */}
                  <div>
                    <div className="text-[10px] font-orbitron uppercase text-amber-400 font-bold tracking-wider mb-2">
                      Management & Developer Identities
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {users
                        .filter(u => u.role === 'developer' || u.role === 'admin')
                        .filter(u =>
                          !userSearchTerm ||
                          u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          u.role.toLowerCase().includes(userSearchTerm.toLowerCase())
                        )
                        .map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              loginAs(u.email);
                              setIsUserSwitcherOpen(false);
                              playSound('bonus');
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              currentUser?.email === u.email
                                ? 'bg-amber-400/20 border-amber-400 text-white font-bold ring-1 ring-amber-400'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-400/50 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-amber-400/60"
                                referrerPolicy="no-referrer"
                              />
                              <div className="truncate">
                                <div className="text-xs font-semibold text-white truncate">{u.name}</div>
                                <div className="text-[10px] text-zinc-400 truncate">{u.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-orbitron font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                {u.role}
                              </span>
                              {currentUser?.email === u.email && (
                                <Check className="w-4 h-4 text-amber-400 ml-1 shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Supervisors & Floor Agents */}
                  {teams.map(team => {
                    const teamMembers = users.filter(
                      u =>
                        u.teamId === team.teamId &&
                        u.role !== 'developer' &&
                        (!userSearchTerm ||
                          u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          team.teamName.toLowerCase().includes(userSearchTerm.toLowerCase()))
                    );

                    if (teamMembers.length === 0) return null;

                    return (
                      <div key={team.teamId} className="space-y-2">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1">
                          <span className="text-[10px] font-orbitron uppercase font-bold tracking-wider flex items-center gap-1.5" style={{ color: team.teamColorAccent }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.teamColorAccent }} />
                            {team.teamName} Floor Agents
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {teamMembers.length} Pods
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {teamMembers.map(u => (
                            <button
                              key={u.id}
                              onClick={() => {
                                loginAs(u.email);
                                setIsUserSwitcherOpen(false);
                                playSound('click');
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                currentUser?.email === u.email
                                  ? 'bg-cyan/20 border-cyan text-white font-bold ring-1 ring-cyan'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan/40 text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-7 h-7 rounded-full object-cover border"
                                  style={{ borderColor: team.teamColorAccent }}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="truncate">
                                  <div className="text-xs font-medium text-white truncate">{u.name}</div>
                                  <div className="text-[10px] text-zinc-400 truncate">{u.email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                                  {u.role}
                                </span>
                                {currentUser?.email === u.email && (
                                  <Check className="w-4 h-4 text-cyan ml-1 shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

