/**
 * BREAK — Master Web App
 * Neo-Apple Liquid Glass Material System
 * Author & Lead Developer: Adham Badran (adhambadraan@gmail.com)
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ShaderBackground } from './components/shared/ShaderBackground';
import { TopHeader } from './components/header/TopHeader';
import { SNNTicker } from './components/ticker/SNNTicker';
import { PodGrid } from './components/pods/PodGrid';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { GodModePanel } from './components/developer/GodModePanel';
import { SimulationToolbar } from './components/developer/SimulationToolbar';
import { MessagesPanel } from './components/messaging/MessagesPanel';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { NewsPanel } from './components/ticker/NewsPanel';
import { ModalManager } from './components/modals/ModalManager';
import { FloorAlertOverlays } from './components/shared/FloorAlertOverlays';
import { LoginCard } from './components/auth/LoginCard';
import { AuthGuard } from './components/auth/AuthGuard';
import { VoiceFloorAssistant } from './components/voice/VoiceFloorAssistant';
import { SearchGroundingWidget } from './components/intelligence/SearchGroundingWidget';
import { TeamViewToggle } from './components/shared/TeamViewToggle';
import { LayoutGrid, BarChart2, Shield } from 'lucide-react';
import { playSound } from './lib/sound';
import { useAgentShortcuts } from './hooks/useAgentShortcuts';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';

const AppContent: React.FC = () => {
  const { currentUser, activeTeamId, setActiveTeamId, openModal, closeModal, activeModal } = useApp();
  const [activeTab, setActiveTab] = useState<'pods' | 'supervisor' | 'admin'>('pods');

  // Register Agent Keyboard Shortcuts (Shift+I, Shift+O, Shift+B)
  useAgentShortcuts({ enabled: currentUser?.role === 'agent' });

  // Register Global Keyboard Shortcuts (? key)
  useGlobalKeyboardShortcuts({
    onToggleShortcuts: () => {
      if (activeModal === 'shortcuts') {
        closeModal();
      } else {
        playSound('click');
        openModal('shortcuts');
      }
    },
    enabled: !!currentUser,
  });

  if (!currentUser) {
    return (
      <div className="relative min-h-screen w-full bg-black text-white select-none">
        <ShaderBackground />
        <LoginCard />
      </div>
    );
  }

  const isSupervisorOrAbove = currentUser.role === 'supervisor' || currentUser.role === 'admin' || currentUser.role === 'developer';
  const isAdminOrAbove = currentUser.role === 'admin' || currentUser.role === 'developer';

  return (
    <div className="relative min-h-screen w-full bg-black text-white select-none flex flex-col font-sans">
      {/* WebGL Drifting Liquid Glass Background Shader */}
      <ShaderBackground />

      {/* 80px Sticky Top Header */}
      <TopHeader />

      {/* 44px Sticky SNN Live Ticker */}
      <SNNTicker />

      {/* Role Navigation Bar (For Supervisor / Admin / Developer) */}
      {isSupervisorOrAbove && (
        <div className="w-full max-w-7xl mx-auto px-4 pt-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-orbitron">
            <button
              onClick={() => {
                setActiveTab('pods');
                playSound('click');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'pods'
                  ? 'bg-yellow-400 text-black font-extrabold shadow-md'
                  : 'bg-black/40 border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Floor Pods
            </button>

            <button
              onClick={() => {
                setActiveTab('supervisor');
                playSound('click');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'supervisor'
                  ? 'bg-yellow-400 text-black font-extrabold shadow-md'
                  : 'bg-black/40 border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Supervisor Deck
            </button>

            {isAdminOrAbove && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  playSound('click');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-yellow-400 text-black font-extrabold shadow-md'
                    : 'bg-black/40 border border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Admin Analytics
              </button>
            )}

            {/* Glass-morphic Team View Switcher Dropdown */}
            <div className="pl-1 border-l border-white/10 ml-1">
              <TeamViewToggle
                selectedTeamId={activeTeamId}
                onSelectTeam={setActiveTeamId}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-orbitron text-zinc-400 hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Shift Active · 10 PM – 6 AM Cairo Time</span>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'pods' && <PodGrid selectedTeamId={activeTeamId} />}
        {activeTab === 'supervisor' && <SupervisorDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Slide-in Drawers & Full Screen Dialogs */}
      <SimulationToolbar />
      <MessagesPanel />
      <SettingsPanel />
      <GodModePanel />
      <NewsPanel />
      <ModalManager />
      <FloorAlertOverlays />
      <VoiceFloorAssistant />
      <SearchGroundingWidget />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AppProvider>
  );
}
