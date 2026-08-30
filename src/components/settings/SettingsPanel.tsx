import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { X, Settings, Volume2, Sliders, Shield, Palette, Download, Save, Radio, Bell, Play, Check } from 'lucide-react';
import { playSound, setAlertToneTheme, getAlertToneTheme } from '../../lib/sound';

export const SettingsPanel: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    shiftConfig,
    updateShiftConfig,
    currentUser,
    updateUserProfile,
    exportDataJSON,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rules' | 'sound' | 'ui' | 'data'>('rules');

  const [capacity, setCapacity] = useState(shiftConfig.breakCapacity);
  const [maxSlots, setMaxSlots] = useState(shiftConfig.maxSlots);
  const [maxSlotDuration, setMaxSlotDuration] = useState(shiftConfig.maxSlotDuration);
  const [maxTotal, setMaxTotal] = useState(shiftConfig.maxTotalBreakTime);
  const [maxWc, setMaxWc] = useState(shiftConfig.maxWCTime);
  const [restrictedFirst, setRestrictedFirst] = useState(shiftConfig.restrictedFirstHour);
  const [restrictedLast, setRestrictedLast] = useState(shiftConfig.restrictedLastHour);
  const [selectedAlertTone, setSelectedAlertTone] = useState<'cyber' | 'radar' | 'siren'>(
    shiftConfig.alertToneTheme || getAlertToneTheme() || 'cyber'
  );

  if (!isSettingsOpen) return null;

  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'developer';

  const handleSaveRules = () => {
    updateShiftConfig({
      breakCapacity: capacity,
      maxSlots,
      maxSlotDuration,
      maxTotalBreakTime: maxTotal,
      maxWCTime: maxWc,
      restrictedFirstHour: restrictedFirst,
      restrictedLastHour: restrictedLast,
    });
    setIsSettingsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl overflow-y-auto">
      <GlassPanel material="thick" className="w-full max-w-2xl p-6 border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-yellow-400" />
            <h2 className="font-orbitron font-bold text-xl text-zinc-100">System Preferences & Rules</h2>
          </div>
          <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4 text-xs font-orbitron">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'rules' ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Break Rules
          </button>
          <button
            onClick={() => setActiveTab('sound')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sound' ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sound & Audio
          </button>
          <button
            onClick={() => setActiveTab('ui')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'ui' ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            UI Customization
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'data' ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Data Export
          </button>
        </div>

        {/* TAB 1: RULES CONFIG */}
        {activeTab === 'rules' && (
          <div className="space-y-4 text-xs font-inter">
            {!isPrivileged && (
              <div className="p-3 rounded-xl bg-zinc-800/80 border border-white/10 text-zinc-400">
                🔒 Shift rules are managed by Floor Supervisors, Admins, and Developer. Read-only view for agents.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-orbitron text-zinc-300 mb-1">Max Agents on Break (Capacity)</label>
                <input
                  type="number"
                  disabled={!isPrivileged}
                  value={capacity}
                  onChange={e => setCapacity(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-orbitron text-zinc-300 mb-1">Max Slots per Shift</label>
                <input
                  type="number"
                  disabled={!isPrivileged}
                  value={maxSlots}
                  onChange={e => setMaxSlots(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-orbitron text-zinc-300 mb-1">Max Slot Duration (Minutes)</label>
                <input
                  type="number"
                  disabled={!isPrivileged}
                  value={maxSlotDuration}
                  onChange={e => setMaxSlotDuration(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-orbitron text-zinc-300 mb-1">Max Total Break Time (Minutes)</label>
                <input
                  type="number"
                  disabled={!isPrivileged}
                  value={maxTotal}
                  onChange={e => setMaxTotal(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-orbitron text-zinc-300 mb-1">Max Daily WC Time (Minutes)</label>
                <input
                  type="number"
                  disabled={!isPrivileged}
                  value={maxWc}
                  onChange={e => setMaxWc(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            {isPrivileged && (
              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSaveRules}
                  className="px-6 py-2.5 rounded-xl bg-yellow-400 text-black font-orbitron font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  Save Shift Rules
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SOUND & AUDIO */}
        {activeTab === 'sound' && (
          <div className="space-y-5 text-xs font-inter">
            {/* Tone Theme Selection for Supervisors / Floor Alerts */}
            <div className="p-4 rounded-2xl bg-black/60 border border-yellow-400/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-yellow-400" />
                  <span className="font-orbitron font-bold text-sm text-zinc-100">
                    Floor Alert Notification Audio Theme
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                  Supervisor Setting
                </span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Choose between three distinct acoustic profiles for floor alerts. Each theme calibrates distinct harmonic frequencies to help supervisors and agents instantly differentiate <strong className="text-red-400">Critical Alerts</strong> (overcapacity, hard limit breaches) from <strong className="text-cyan">Non-Critical Alerts</strong> (shift warnings, returning to floor, info updates).
              </p>

              {/* 3 Distinct Tone Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {/* 1. Cyber Theme */}
                <div
                  onClick={() => {
                    setSelectedAlertTone('cyber');
                    setAlertToneTheme('cyber');
                    updateShiftConfig({ alertToneTheme: 'cyber' });
                    playSound('floor_alert_non_critical', 'cyber');
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedAlertTone === 'cyber'
                      ? 'bg-cyan/15 border-cyan shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                      : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs text-cyan">1. Cyber Pulse</span>
                      {selectedAlertTone === 'cyber' && <Check className="w-4 h-4 text-cyan" />}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Futuristic synth arpeggio with high-tech frequency modulation.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 mt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('floor_alert_non_critical', 'cyber');
                      }}
                      className="flex-1 py-1 rounded bg-black/40 hover:bg-black/70 border border-cyan/30 text-cyan text-[10px] font-orbitron flex items-center justify-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5" /> Non-Crit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('floor_alert_critical', 'cyber');
                      }}
                      className="flex-1 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-[10px] font-orbitron flex items-center justify-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5" /> Critical
                    </button>
                  </div>
                </div>

                {/* 2. Radar Sonar Theme */}
                <div
                  onClick={() => {
                    setSelectedAlertTone('radar');
                    setAlertToneTheme('radar');
                    updateShiftConfig({ alertToneTheme: 'radar' });
                    playSound('floor_alert_non_critical', 'radar');
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedAlertTone === 'radar'
                      ? 'bg-blue-500/15 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.25)]'
                      : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs text-blue-400">2. Radar Sonar</span>
                      {selectedAlertTone === 'radar' && <Check className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Deep acoustic sonar sweeps and resonant nautical ping echoes.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 mt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('floor_alert_non_critical', 'radar');
                      }}
                      className="flex-1 py-1 rounded bg-black/40 hover:bg-black/70 border border-blue-400/30 text-blue-300 text-[10px] font-orbitron flex items-center justify-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5" /> Non-Crit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('floor_alert_critical', 'radar');
                      }}
                      className="flex-1 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-[10px] font-orbitron flex items-center justify-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5" /> Critical
                    </button>
                  </div>
                </div>

                {/* 3. Siren Theme */}
                <div
                  onClick={() => {
                    setSelectedAlertTone('siren');
                    setAlertToneTheme('siren');
                    updateShiftConfig({ alertToneTheme: 'siren' });
                    playSound('floor_alert_non_critical', 'siren');
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedAlertTone === 'siren'
                      ? 'bg-red-500/15 border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.25)]'
                      : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs text-red-400">3. Tactical Siren</span>
                      {selectedAlertTone === 'siren' && <Check className="w-4 h-4 text-red-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      High-urgency two-tone harmonic sirens with dual envelope oscillators.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 mt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('floor_alert_non_critical', 'siren');
                      }}
                      className="flex-1 py-1 rounded bg-black/40 hover:bg-black/70 border border-red-400/30 text-red-300 text-[10px] font-orbitron flex items-center justify-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5" /> Non-Crit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('floor_alert_critical', 'siren');
                      }}
                      className="flex-1 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-[10px] font-orbitron flex items-center justify-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5" /> Critical
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-zinc-400">Active Tone Theme: <strong className="text-yellow-400 font-orbitron capitalize">{selectedAlertTone}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setAlertToneTheme(selectedAlertTone);
                    updateShiftConfig({ alertToneTheme: selectedAlertTone });
                    playSound('bonus');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-orbitron font-bold text-xs shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Audio Preference
                </button>
              </div>
            </div>

            {/* Standard Synth Cue Tester */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <div className="font-orbitron font-bold text-sm text-yellow-400">Glass Audio Synthesizer Controls</div>
              <p className="text-zinc-400">Test calibrated Web Audio cues modeled after glass and metal resonances:</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => playSound('break_start')}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-orbitron text-[11px] text-cyan"
                >
                  Break Start Chime
                </button>
                <button
                  onClick={() => playSound('break_end')}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-orbitron text-[11px] text-yellow-400"
                >
                  Break Return Chime
                </button>
                <button
                  onClick={() => playSound('bonus')}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-orbitron text-[11px] text-gold"
                >
                  Bonus Sparkle 🍕
                </button>
                <button
                  onClick={() => playSound('warning')}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-orbitron text-[11px] text-orange-400"
                >
                  Warning Alert
                </button>
                <button
                  onClick={() => playSound('rally')}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-orbitron text-[11px] text-crimson"
                >
                  Rally Siren 🚨
                </button>
                <button
                  onClick={() => playSound('heartbeat')}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-orbitron text-[11px] text-zinc-300"
                >
                  13m Heartbeat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: UI CUSTOMIZATION */}
        {activeTab === 'ui' && currentUser && (
          <div className="space-y-4 text-xs font-inter">
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <div className="font-orbitron font-bold text-sm text-zinc-200">Accessibility & Visual Fluidity</div>
              
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span>Reduced Transparency (High Contrast Solid Glass)</span>
                <input
                  type="checkbox"
                  checked={currentUser.reducedTransparency}
                  onChange={e => updateUserProfile(currentUser.email, { reducedTransparency: e.target.checked })}
                  className="w-4 h-4 rounded accent-yellow-400"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span>Reduced Motion Animations</span>
                <input
                  type="checkbox"
                  checked={currentUser.reducedMotion}
                  onChange={e => updateUserProfile(currentUser.email, { reducedMotion: e.target.checked })}
                  className="w-4 h-4 rounded accent-yellow-400"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <span>Sound Alerts Enabled</span>
                <input
                  type="checkbox"
                  checked={currentUser.soundEnabled}
                  onChange={e => updateUserProfile(currentUser.email, { soundEnabled: e.target.checked })}
                  className="w-4 h-4 rounded accent-yellow-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATA EXPORT */}
        {activeTab === 'data' && (
          <div className="space-y-4 text-xs font-inter">
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <div className="font-orbitron font-bold text-sm text-cyan">Instant Data Export</div>
              <p className="text-zinc-400">Download complete structured shift logs, agent audit trails, and break records:</p>

              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportDataJSON());
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `break_export_${Date.now()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  playSound('click');
                }}
                className="px-6 py-2.5 rounded-xl bg-cyan hover:bg-cyan/90 text-black font-orbitron font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download JSON Shift Report
              </button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
