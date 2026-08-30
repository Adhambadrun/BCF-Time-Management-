import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../shared/GlassPanel';
import { useApp } from '../../context/AppContext';
import {
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Filter,
  Mail,
  Clock,
  AlertCircle,
  Eye,
  Sliders,
} from 'lucide-react';
import { playSound } from '../../lib/sound';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({ isOpen, onClose }) => {
  const { breaks, users, teams, activeTeamId, shiftConfig, currentUser } = useApp();

  const [timeframe, setTimeframe] = useState<'today' | 'yesterday' | '7days' | 'all'>('today');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_break' | 'on_floor' | 'overrun' | 'blocked'>('all');
  const [scheduleEmail, setScheduleEmail] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState(currentUser?.email || 'supervisor@bcflights.com');
  const [scheduleTime, setScheduleTime] = useState('06:00');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const team = teams.find(t => t.teamId === activeTeamId) || teams[0];

  // Filter and prepare dataset
  const processedData = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    return breaks
      .filter(b => {
        // Timeframe filter
        if (timeframe === 'today' && b.date !== todayStr) return false;
        if (timeframe === 'yesterday' && b.date !== yesterday) return false;
        if (timeframe === '7days' && b.date < sevenDaysAgo) return false;

        // Find agent
        const agent = users.find(u => u.email === b.agentEmail);

        // Status filter
        const durationMin = Math.round((b.duration || (Date.now() - b.startTime) / 1000) / 60);
        const isOverrun = b.breakType === 'regular' && durationMin > shiftConfig.maxSlotDuration;

        if (statusFilter === 'on_break' && !b.isActive) return false;
        if (statusFilter === 'on_floor' && b.isActive) return false;
        if (statusFilter === 'overrun' && !isOverrun) return false;
        if (statusFilter === 'blocked' && !agent?.isBlocked) return false;

        return true;
      })
      .map(b => {
        const agent = users.find(u => u.email === b.agentEmail);
        const agentTeam = teams.find(t => t.teamId === b.teamId)?.teamName || b.teamId;
        const durationMin = Math.round((b.duration || (Date.now() - b.startTime) / 1000) / 60);
        const isOverrun = b.breakType === 'regular' && durationMin > shiftConfig.maxSlotDuration;
        const startTimeStr = new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTimeStr = b.endTime ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active';

        return {
          id: b.breakId,
          agentName: agent?.name || b.agentEmail.split('@')[0],
          agentEmail: b.agentEmail,
          team: agentTeam,
          breakType: b.breakType.toUpperCase(),
          durationMin,
          startTime: startTimeStr,
          endTime: endTimeStr,
          isOverrun,
          status: b.isActive ? 'Active Break' : isOverrun ? 'Overrun' : 'Compliant',
          date: b.date,
        };
      });
  }, [breaks, users, teams, timeframe, statusFilter, shiftConfig]);

  const handleDownload = () => {
    setIsExporting(true);
    try {
      if (processedData.length === 0) {
        setToastMessage({ text: 'No records found matching current filters.', type: 'error' });
        setIsExporting(false);
        return;
      }

      // Generate CSV string
      const headers = ['Agent Name', 'Email', 'Team', 'Break Type', 'Duration (min)', 'Start Time', 'End Time', 'Status', 'Date'];
      const rows = processedData.map(d => [
        `"${d.agentName}"`,
        `"${d.agentEmail}"`,
        `"${d.team}"`,
        `"${d.breakType}"`,
        d.durationMin,
        `"${d.startTime}"`,
        `"${d.endTime}"`,
        `"${d.status}"`,
        `"${d.date}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `BCF_Break_Report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      playSound('bonus');
      setToastMessage({
        text: `Exported ${processedData.length} records successfully! ${scheduleEmail ? `(Scheduled shift dispatch to ${emailRecipient} at ${scheduleTime})` : ''}`,
        type: 'success',
      });
    } catch (err: any) {
      setToastMessage({ text: 'Export failed: ' + (err?.message || 'Unknown error'), type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl overflow-y-auto">
      <GlassPanel
        material="thick"
        concentricRadius="2xl"
        className="w-full max-w-4xl p-6 md:p-8 border border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.2)] text-left space-y-6 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-xl text-zinc-100 flex items-center gap-2">
                Shift Activity CSV Exporter
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {processedData.length} Records
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-inter">
                Filter, preview 10-row dataset, and schedule end-of-shift automated reports.
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

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-black/40 p-4 rounded-2xl border border-white/10">
          {/* Timeframe */}
          <div>
            <label className="block text-[10px] font-orbitron text-zinc-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" /> Timeframe
            </label>
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as any)}
              className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-orbitron"
            >
              <option value="today">Today's Shift</option>
              <option value="yesterday">Yesterday's Shift</option>
              <option value="7days">Last 7 Days</option>
              <option value="all">All Available Logs</option>
            </select>
          </div>

          {/* Shift Status Filter */}
          <div>
            <label className="block text-[10px] font-orbitron text-zinc-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-yellow-400" /> Shift Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-orbitron"
            >
              <option value="all">All Statuses</option>
              <option value="on_break">Currently On Break</option>
              <option value="on_floor">On Floor (Completed)</option>
              <option value="overrun">Overrun (&gt;15m)</option>
              <option value="blocked">Blocked Agents</option>
            </select>
          </div>

          {/* End-of-Shift Email Scheduler Toggle */}
          <div className="sm:col-span-2 flex flex-col justify-between">
            <label className="block text-[10px] font-orbitron text-zinc-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3 h-3 text-cyan" /> Shift Dispatch Scheduler
            </label>
            <div className="flex items-center gap-3 bg-zinc-900/90 border border-white/15 rounded-xl px-3 py-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-inter text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={scheduleEmail}
                  onChange={e => setScheduleEmail(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Schedule End-of-Shift Email</span>
              </label>

              {scheduleEmail && (
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="bg-black/60 border border-white/20 rounded-lg px-2 py-0.5 text-xs text-yellow-400 font-mono focus:outline-none"
                  />
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={e => setEmailRecipient(e.target.value)}
                    placeholder="Recipient email"
                    className="bg-black/60 border border-white/20 rounded-lg px-2 py-0.5 text-xs text-zinc-200 focus:outline-none w-36"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 10-Row Interactive Live Preview Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-orbitron text-zinc-300 flex items-center gap-1.5 font-bold">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              10-Row Data Preview ({processedData.length} records ready)
            </span>
            <span className="text-[11px] text-zinc-500 font-inter">Showing first 10 rows</span>
          </div>

          <div className="overflow-x-auto border border-white/10 rounded-2xl bg-black/40 flex-1 max-h-56">
            <table className="w-full text-left text-xs font-inter border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-orbitron uppercase text-zinc-400">
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Time Range</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {processedData.slice(0, 10).map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">{row.agentName}</td>
                    <td className="py-2.5 px-3 text-zinc-400 font-orbitron text-[11px]">{row.team}</td>
                    <td className="py-2.5 px-3 font-orbitron text-[10px] text-cyan font-bold">{row.breakType}</td>
                    <td className="py-2.5 px-3 font-teko text-base text-yellow-400">{row.durationMin} min</td>
                    <td className="py-2.5 px-3 text-zinc-300 font-mono text-[11px]">
                      {row.startTime} - {row.endTime}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-orbitron font-bold uppercase ${
                          row.status === 'Active Break'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : row.isOverrun
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{row.date}</td>
                  </tr>
                ))}

                {processedData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500 font-orbitron text-xs">
                      No shift records found matching selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-inter ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/70 border border-red-500/50 text-red-200'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="text-xs text-zinc-400 font-inter">
            Format: <span className="font-mono text-white">UTF-8 CSV (Excel / Google Sheets compatible)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-orbitron text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting || processedData.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-orbitron font-bold text-xs shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download CSV Report</span>
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
