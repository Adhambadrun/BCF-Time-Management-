import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GlassPanel } from '../shared/GlassPanel';
import { Users, Clock, AlertTriangle, Award, HeartHandshake, FileText, CheckCircle2, Shield, Download } from 'lucide-react';
import { playSound } from '../../lib/sound';
import { useBatchActions, BatchActionType } from '../../hooks/useBatchActions';
import { BatchActionToolbar } from './BatchActionToolbar';
import { BreakOverlapAlert } from './BreakOverlapAlert';
import { AgentPod } from '../pods/AgentPod';
import { AnimatePresence, motion } from 'motion/react';
import { GLIDE } from '../../styles/motion-presets';

export const SupervisorDashboard: React.FC = () => {
  const {
    currentUser,
    teams,
    activeTeamId,
    users,
    breaks,
    warnings,
    shiftNotes,
    openModal,
    endBreak,
    downloadActivityLogsCSV,
    executeBatchAction: executeContextBatchAction,
  } = useApp();

  const [isExporting, setIsExporting] = useState(false);

  const team = teams.find(t => t.teamId === activeTeamId) || teams[0];
  const teamAgents = users.filter(
    u =>
      u.teamId === activeTeamId &&
      (u.role === 'agent' ||
        u.role === 'independent' ||
        (activeTeamId === 'cai-1' && u.email.toLowerCase() === 'dominick@bcflights.com'))
  );
  const teamBreaks = breaks.filter(b => b.teamId === activeTeamId);
  const teamWarnings = warnings.filter(w => w.teamId === activeTeamId);
  const teamNotes = shiftNotes.filter(n => n.teamId === activeTeamId);

  // Batch action hook integration
  const {
    selectedAgentIds,
    toggleSelectAgent,
    toggleSelectAll,
    clearSelection,
    executeBatchAction,
    isAllSelected,
    hasSelection,
  } = useBatchActions(
    teamAgents.map(a => a.email),
    (action: BatchActionType, ids: string[]) => {
      const mappedAction = action === 'WARNING' ? 'WARN' : action;
      executeContextBatchAction(mappedAction, ids, {
        forcedBy: currentUser?.name || 'Supervisor',
        warningReason: action === 'WARNING' ? 'Supervisor Batch Warning' : undefined,
        warningNote: action === 'WARNING' ? 'Issued via Supervisor Command Bar' : undefined,
      });
    }
  );

  const handleExport = () => {
    setIsExporting(true);
    playSound('bonus');
    try {
      downloadActivityLogsCSV('today');
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-cyan/20 text-cyan font-orbitron text-xs font-bold border border-cyan/40 uppercase">
              Supervisor Deck
            </span>
            <h1 className="font-orbitron font-extrabold text-2xl md:text-3xl text-zinc-100">
              {team.teamName} Floor Command
            </h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1 font-inter">
            Supervisor: <span className="text-yellow-400 font-semibold">{currentUser?.name}</span> · Complete Team Isolation Enforced
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-orbitron font-bold shadow-lg transition-all cursor-pointer"
            title="Export Today's Activity Logs as CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export Shift CSV
          </button>
          <button
            onClick={() => openModal('handover')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/50 text-yellow-300 text-xs font-orbitron font-bold shadow-lg transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-yellow-400" />
            Shift Handover Notes
          </button>
        </div>
      </div>

      {/* Break Overlaps > 15 Mins Notification & Action Alert */}
      <BreakOverlapAlert
        breaks={teamBreaks}
        users={users}
        teamId={activeTeamId}
        onForceEndBreak={endBreak}
      />

      {/* Wellness & Attendance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassPanel material="regular" className="p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3 text-zinc-400 font-orbitron text-xs">
            <span>TEAM WELLNESS SCORE</span>
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-teko text-4xl text-emerald-400 font-bold">96.8% (OPTIMAL)</div>
          <div className="text-xs text-zinc-400 font-inter mt-1">Zero burnout flags in last 4 hours</div>
        </GlassPanel>

        <GlassPanel material="regular" className="p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3 text-zinc-400 font-orbitron text-xs">
            <span>ATTENDANCE DISCIPLINE</span>
            <CheckCircle2 className="w-4 h-4 text-cyan" />
          </div>
          <div className="font-teko text-4xl text-cyan font-bold">100% ON-TIME</div>
          <div className="text-xs text-zinc-400 font-inter mt-1">All {teamAgents.length} agents logged by 10:15 PM</div>
        </GlassPanel>

        <GlassPanel material="regular" className="p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3 text-zinc-400 font-orbitron text-xs">
            <span>ACTIVE SHIFT WARNINGS</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="font-teko text-4xl text-orange-400 font-bold">
            {teamWarnings.filter(w => w.status === 'active').length}
          </div>
          <div className="text-xs text-zinc-400 font-inter mt-1">Under strict 3-shift clean expiration</div>
        </GlassPanel>
      </div>

      {/* Batch Action Toolbar Mounting */}
      <AnimatePresence>
        {hasSelection && (
          <BatchActionToolbar
            selectedCount={selectedAgentIds.length}
            totalCount={teamAgents.length}
            isAllSelected={isAllSelected}
            onToggleSelectAll={toggleSelectAll}
            onExecuteAction={executeBatchAction}
            onClearSelection={clearSelection}
          />
        )}
      </AnimatePresence>

      {/* Team Floor Agents Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron font-bold text-base text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan" />
            <span>{team.teamName} Live Floor Grid</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
              {teamAgents.length} Agents
            </span>
          </h3>

          <button
            onClick={toggleSelectAll}
            className="text-xs font-orbitron text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
          >
            {isAllSelected ? 'Deselect All' : 'Select All Team'}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={GLIDE}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6 gap-x-3 place-items-center items-start w-full"
        >
          {teamAgents.map((agent) => {
            const activeBreak = breaks.find(
              b => b.agentEmail === agent.email && b.isActive
            );
            const todayBreaks = breaks.filter(
              b => b.agentEmail === agent.email && b.date === new Date().toISOString().split('T')[0]
            );
            const totalBreakMinutes = todayBreaks.reduce(
              (acc, b) => acc + Math.round(b.duration / 60),
              0
            );
            const isSelected = selectedAgentIds.includes(agent.email);

            return (
              <AgentPod
                key={agent.id}
                agent={agent}
                activeBreak={activeBreak}
                usedSlotsCount={todayBreaks.length}
                totalBreakMinutes={totalBreakMinutes}
                isOwnPod={currentUser?.email === agent.email}
                canManage={true}
                isSelected={isSelected}
                onToggleSelect={toggleSelectAgent}
                selectionMode={hasSelection}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Shift Handover Notes Stream */}
      <GlassPanel material="thick" className="p-6">
        <h3 className="font-orbitron font-bold text-base text-yellow-400 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Shift Handover & Operations Log
        </h3>

        {teamNotes.length === 0 ? (
          <div className="text-xs text-zinc-500 italic py-4">No handover notes added for this shift yet. Click "Shift Handover Notes" above to compose.</div>
        ) : (
          <div className="space-y-3">
            {teamNotes.map(n => (
              <div key={n.noteId} className="p-4 rounded-2xl bg-black/50 border border-white/10 text-xs font-inter space-y-1">
                <div className="flex items-center justify-between font-orbitron text-[10px] text-zinc-400">
                  <span className="text-yellow-400 uppercase font-bold">{n.category}</span>
                  <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-zinc-200">{n.noteText}</div>
                <div className="text-[10px] text-zinc-500 font-orbitron pt-1">By {n.supervisorName}</div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

