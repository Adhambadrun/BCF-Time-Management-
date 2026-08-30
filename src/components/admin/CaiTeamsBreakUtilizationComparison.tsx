import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { GlassPanel } from '../shared/GlassPanel';
import { BreakRecord, Team, User, ShiftConfig } from '../../types';
import { BCF_TEAMS } from '../../constants/bcfRoster';
import {
  TrendingUp,
  BarChart3,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  Layers,
  AlertTriangle,
  Users,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { playSound } from '../../lib/sound';

interface CaiTeamsBreakUtilizationComparisonProps {
  breaks: BreakRecord[];
  teams: Team[];
  users: User[];
  shiftConfig: ShiftConfig;
  activeTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
}

interface TeamUtilizationMetric {
  teamId: string;
  teamName: string;
  supervisorName: string;
  supervisorEmail: string;
  color: string;
  agentCount: number;
  totalBreakMinutes: number;
  allocatedAllowanceMinutes: number;
  utilizationRate: number; // percentage (0 - 100+)
  overtimeDriftMinutes: number;
  complianceRate: number; // percentage (0 - 100)
  avgBreakDurationMin: number;
  totalBreakCount: number;
  // Category breakdown in minutes
  regularMinutes: number;
  wcMinutes: number;
  mealMinutes: number;
  personalMinutes: number;
  bonusMinutes: number;
}

const CAI_TEAM_COLORS: Record<string, string> = {
  'cai-1': '#00E5FF', // Cyan
  'cai-2': '#FFCC00', // Gold / Yellow
  'cai-3': '#10B981', // Emerald
  'cai-4': '#A855F7', // Purple
  'cai-5': '#FF3366', // Crimson / Coral
};

const SHIFT_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export const CaiTeamsBreakUtilizationComparison: React.FC<CaiTeamsBreakUtilizationComparisonProps> = ({
  breaks,
  teams,
  users,
  shiftConfig,
  activeTeamId,
  onSelectTeam,
}) => {
  const [timeframe, setTimeframe] = useState<'today' | '7days'>('today');
  const [metricView, setMetricView] = useState<'utilization' | 'minutes' | 'categories' | 'concurrency'>('utilization');
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);

  // Standard break parameters
  const standardSlotDuration = shiftConfig?.maxSlotDuration || 15;
  const standardDailyAllowancePerAgent = shiftConfig?.maxTotalDailyBreakTime || 60;

  // Filter breaks by timeframe
  const filteredBreaks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (timeframe === 'today') {
      return breaks.filter((b) => b.date === todayStr || !b.date);
    }
    // 7-day rolling window
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return breaks.filter((b) => (b.startTime ? b.startTime >= sevenDaysAgo : true));
  }, [breaks, timeframe]);

  // Compute metrics for all 5 CAI teams
  const caiMetrics = useMemo<TeamUtilizationMetric[]>(() => {
    // Ensure all 5 CAI teams from BCF_TEAMS are accounted for
    const targetCaiTeamIds = ['cai-1', 'cai-2', 'cai-3', 'cai-4', 'cai-5'];

    return targetCaiTeamIds.map((tid) => {
      const rosterTeam = BCF_TEAMS.find((t) => t.teamId.toLowerCase() === tid);
      const teamObj = teams.find((t) => t.teamId.toLowerCase() === tid);
      const teamColor = teamObj?.teamColorAccent || CAI_TEAM_COLORS[tid] || '#FFCC00';
      const teamName = teamObj?.teamName || rosterTeam?.teamName || tid.toUpperCase();
      const supUser = users.find((u) => u.email.toLowerCase() === (teamObj?.supervisorEmail || rosterTeam?.supervisor.email)?.toLowerCase());
      const supervisorName = supUser?.name || rosterTeam?.supervisor.name || 'Supervisor';
      const supervisorEmail = supUser?.email || rosterTeam?.supervisor.email || '';

      // Count agents in team (include Dominick in CAI-1 as dual agent/sup)
      const teamAgents = users.filter(
        (u) =>
          u.teamId === tid &&
          (u.role === 'agent' ||
            u.role === 'independent' ||
            (tid === 'cai-1' && u.email.toLowerCase() === 'dominick@bcflights.com'))
      );
      const agentCount = Math.max(teamAgents.length, rosterTeam?.agents.length || 5);

      // Breaks belonging to this team
      const teamBreaks = filteredBreaks.filter((b) => b.teamId.toLowerCase() === tid);
      const totalSecs = teamBreaks.reduce((acc, b) => acc + (b.duration || 0), 0);
      const totalBreakMinutes = Math.round(totalSecs / 60);

      // Break categories in minutes
      const regularMinutes = Math.round(
        teamBreaks.filter((b) => b.breakType === 'regular' || !b.breakType).reduce((a, b) => a + (b.duration || 0), 0) / 60
      );
      const wcMinutes = Math.round(
        teamBreaks.filter((b) => b.breakType === 'wc').reduce((a, b) => a + (b.duration || 0), 0) / 60
      );
      const mealMinutes = Math.round(
        teamBreaks.filter((b) => b.breakType === 'meal').reduce((a, b) => a + (b.duration || 0), 0) / 60
      );
      const personalMinutes = Math.round(
        teamBreaks.filter((b) => b.breakType === 'personal').reduce((a, b) => a + (b.duration || 0), 0) / 60
      );
      const bonusMinutes = Math.round(
        teamBreaks.filter((b) => b.isBonus || b.breakType === 'bonus').reduce((a, b) => a + (b.duration || 0), 0) / 60
      );

      // Multiplied daily allowance (days multiplier for 7-day view)
      const dayFactor = timeframe === '7days' ? 5 : 1; // 5 working shift days
      const allocatedAllowanceMinutes = agentCount * standardDailyAllowancePerAgent * dayFactor;

      const utilizationRate = allocatedAllowanceMinutes > 0
        ? Number(((totalBreakMinutes / allocatedAllowanceMinutes) * 100).toFixed(1))
        : 0;

      // Overtime drift calculation
      const overtimeBreakSecs = teamBreaks
        .filter((b) => (b.duration || 0) > standardSlotDuration * 60)
        .reduce((acc, b) => acc + Math.max(0, (b.duration || 0) - standardSlotDuration * 60), 0);
      const overtimeDriftMinutes = Math.round(overtimeBreakSecs / 60);

      const onTimeBreaksCount = teamBreaks.filter((b) => (b.duration || 0) <= standardSlotDuration * 60).length;
      const complianceRate = teamBreaks.length > 0
        ? Number(((onTimeBreaksCount / teamBreaks.length) * 100).toFixed(1))
        : 100;

      const avgBreakDurationMin = teamBreaks.length > 0
        ? Number((totalSecs / (teamBreaks.length * 60)).toFixed(1))
        : 14.2;

      return {
        teamId: tid,
        teamName,
        supervisorName,
        supervisorEmail,
        color: teamColor,
        agentCount,
        totalBreakMinutes,
        allocatedAllowanceMinutes,
        utilizationRate,
        overtimeDriftMinutes,
        complianceRate,
        avgBreakDurationMin,
        totalBreakCount: teamBreaks.length,
        regularMinutes,
        wcMinutes,
        mealMinutes,
        personalMinutes,
        bonusMinutes,
      };
    });
  }, [filteredBreaks, teams, users, timeframe, standardDailyAllowancePerAgent, standardSlotDuration]);

  // Hourly concurrency data across all 5 teams (08:00 - 20:00)
  const hourlyConcurrencyData = useMemo(() => {
    return SHIFT_HOURS.map((hourStr) => {
      const hourNum = parseInt(hourStr.split(':')[0], 10);
      const row: any = { hour: hourStr };

      caiMetrics.forEach((t) => {
        const teamHourBreaks = filteredBreaks.filter((b) => {
          if (b.teamId.toLowerCase() !== t.teamId) return false;
          if (!b.startTime) return false;
          const bHour = new Date(b.startTime).getHours();
          return bHour === hourNum;
        });
        // Concurrency / agent count in break at this hour
        row[t.teamId] = teamHourBreaks.length;
      });

      return row;
    });
  }, [SHIFT_HOURS, caiMetrics, filteredBreaks]);

  // Aggregate executive metrics
  const totalFloorBreakMinutes = useMemo(() => {
    return caiMetrics.reduce((acc, t) => acc + t.totalBreakMinutes, 0);
  }, [caiMetrics]);

  const avgFloorCompliance = useMemo(() => {
    if (caiMetrics.length === 0) return 100;
    const sum = caiMetrics.reduce((acc, t) => acc + t.complianceRate, 0);
    return Number((sum / caiMetrics.length).toFixed(1));
  }, [caiMetrics]);

  const highestUtilizationTeam = useMemo(() => {
    return [...caiMetrics].sort((a, b) => b.utilizationRate - a.utilizationRate)[0];
  }, [caiMetrics]);

  const highestComplianceTeam = useMemo(() => {
    return [...caiMetrics].sort((a, b) => b.complianceRate - a.complianceRate)[0];
  }, [caiMetrics]);

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataItem = payload[0]?.payload as TeamUtilizationMetric;

    return (
      <div className="p-3 rounded-xl bg-zinc-950/95 border border-white/20 shadow-2xl backdrop-blur-md text-xs font-inter space-y-2 min-w-[210px] z-50">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: dataItem?.color || payload[0]?.color || '#FFCC00' }}
            />
            <span className="font-orbitron font-bold text-white text-sm">
              {dataItem?.teamName || label}
            </span>
          </div>
          {dataItem?.supervisorName && (
            <span className="text-[10px] text-zinc-400 font-mono">
              Sup: {dataItem.supervisorName.split(' ')[0]}
            </span>
          )}
        </div>

        <div className="space-y-1 text-zinc-300 text-[11px]">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-orbitron font-bold text-white">
                {entry.value}
                {entry.name.includes('%') || entry.name.includes('Rate') ? '%' : entry.name.includes('Minute') || entry.name.includes('Duration') || entry.name.includes('Allowance') ? 'm' : ''}
              </span>
            </div>
          ))}
        </div>

        {dataItem && (
          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Agents: {dataItem.agentCount}</span>
            <span className="text-emerald-400 font-mono">
              Compliance: {dataItem.complianceRate}%
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <GlassPanel
      material="thick"
      className="p-5 sm:p-6 border border-yellow-400/30 shadow-[0_0_40px_rgba(255,204,0,0.12)] space-y-6"
    >
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-400/20 border border-yellow-400/40 text-yellow-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-orbitron font-black text-lg sm:text-xl text-white">
                  CAI TEAMS BREAK TIME UTILIZATION
                </h2>
                <span className="text-[9px] font-orbitron font-extrabold px-2 py-0.5 rounded-md bg-yellow-400 text-black uppercase tracking-wider">
                  DEV / ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-inter mt-0.5">
                Comparative floor utilization, capacity headroom & compliance matrix across CAI 1 through CAI 5
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS: TIMEFRAME & METRIC VIEW TOGGLES */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Toggle */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/15">
            <button
              onClick={() => {
                setTimeframe('today');
                playSound('click');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                timeframe === 'today'
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Today (Live)
            </button>
            <button
              onClick={() => {
                setTimeframe('7days');
                playSound('click');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                timeframe === '7days'
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7-Day Rolling
            </button>
          </div>

          {/* Metric View Modes */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/15">
            <button
              onClick={() => {
                setMetricView('utilization');
                playSound('click');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                metricView === 'utilization'
                  ? 'bg-cyan text-black font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Utilization %
            </button>
            <button
              onClick={() => {
                setMetricView('minutes');
                playSound('click');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                metricView === 'minutes'
                  ? 'bg-cyan text-black font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Minutes vs Allowance
            </button>
            <button
              onClick={() => {
                setMetricView('categories');
                playSound('click');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                metricView === 'categories'
                  ? 'bg-cyan text-black font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Break Categories
            </button>
            <button
              onClick={() => {
                setMetricView('concurrency');
                playSound('click');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                metricView === 'concurrency'
                  ? 'bg-cyan text-black font-extrabold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hourly Concurrency
            </button>
          </div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY METRIC PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-orbitron">
            <span>TOTAL FLOOR BREAK TIME</span>
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="font-teko text-2xl sm:text-3xl text-yellow-400 font-bold mt-1">
            {totalFloorBreakMinutes}m
          </div>
          <div className="text-[10px] text-zinc-400 font-inter">Across all 5 CAI teams</div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-orbitron">
            <span>FLOOR COMPLIANCE AVG</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-teko text-2xl sm:text-3xl text-emerald-400 font-bold mt-1">
            {avgFloorCompliance}%
          </div>
          <div className="text-[10px] text-emerald-400 font-inter">▲ High shift adherence</div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-orbitron">
            <span>HIGHEST UTILIZATION</span>
            <Activity className="w-3.5 h-3.5 text-cyan" />
          </div>
          <div className="font-teko text-2xl sm:text-3xl text-cyan font-bold mt-1">
            {highestUtilizationTeam?.teamName || 'CAI-1'} ({highestUtilizationTeam?.utilizationRate}%)
          </div>
          <div className="text-[10px] text-zinc-400 font-inter truncate">
            Sup: {highestUtilizationTeam?.supervisorName}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-orbitron">
            <span>BEST ON-TIME DISCIPLINE</span>
            <Award className="w-3.5 h-3.5 text-gold" />
          </div>
          <div className="font-teko text-2xl sm:text-3xl text-gold font-bold mt-1">
            {highestComplianceTeam?.teamName || 'CAI-2'} ({highestComplianceTeam?.complianceRate}%)
          </div>
          <div className="text-[10px] text-zinc-400 font-inter truncate">
            Lowest overtime drift
          </div>
        </div>
      </div>

      {/* PRIMARY RECHARTS VISUALIZATION CONTAINER */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'utilization' ? (
            <ComposedChart data={caiMetrics} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="teamName"
                stroke="#a1a1aa"
                tick={{ fill: '#e4e4e7', fontSize: 12, fontFamily: 'Orbitron' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#a1a1aa"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                domain={[0, 120]}
                unit="%"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                tick={{ fill: '#10b981', fontSize: 11 }}
                domain={[80, 100]}
                unit="%"
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 12, fontFamily: 'Orbitron', fontSize: '11px' }}
              />
              <ReferenceLine yAxisId="left" y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '100% Allowance Limit', fill: '#ef4444', fontSize: 10 }} />
              
              <Bar
                yAxisId="left"
                dataKey="utilizationRate"
                name="Break Utilization Rate (%)"
                radius={[8, 8, 0, 0]}
              >
                {caiMetrics.map((entry) => (
                  <Cell
                    key={`cell-${entry.teamId}`}
                    fill={entry.color}
                    opacity={hoveredTeamId && hoveredTeamId !== entry.teamId ? 0.4 : 0.85}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="complianceRate"
                name="On-Time Compliance (%)"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10B981', stroke: '#000', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          ) : metricView === 'minutes' ? (
            <BarChart data={caiMetrics} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="teamName"
                stroke="#a1a1aa"
                tick={{ fill: '#e4e4e7', fontSize: 12, fontFamily: 'Orbitron' }}
              />
              <YAxis
                stroke="#a1a1aa"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                unit="m"
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 12, fontFamily: 'Orbitron', fontSize: '11px' }}
              />
              <Bar
                dataKey="totalBreakMinutes"
                name="Minutes Utilized (m)"
                radius={[6, 6, 0, 0]}
              >
                {caiMetrics.map((entry) => (
                  <Cell key={`cell-min-${entry.teamId}`} fill={entry.color} opacity={0.9} />
                ))}
              </Bar>
              <Bar
                dataKey="allocatedAllowanceMinutes"
                name="Allocated Allowance (m)"
                fill="#3f3f46"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="overtimeDriftMinutes"
                name="Overtime Drift (m)"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          ) : metricView === 'categories' ? (
            <BarChart data={caiMetrics} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="teamName"
                stroke="#a1a1aa"
                tick={{ fill: '#e4e4e7', fontSize: 12, fontFamily: 'Orbitron' }}
              />
              <YAxis
                stroke="#a1a1aa"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                unit="m"
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 12, fontFamily: 'Orbitron', fontSize: '11px' }}
              />
              <Bar dataKey="regularMinutes" name="Regular Break" stackId="a" fill="#00E5FF" radius={[0, 0, 0, 0]} />
              <Bar dataKey="wcMinutes" name="WC (Restroom)" stackId="a" fill="#3B82F6" />
              <Bar dataKey="mealMinutes" name="Meal Break" stackId="a" fill="#EAB308" />
              <Bar dataKey="personalMinutes" name="Personal / Prayer" stackId="a" fill="#A855F7" />
              <Bar dataKey="bonusMinutes" name="Earned Bonus" stackId="a" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={hourlyConcurrencyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="#a1a1aa"
                tick={{ fill: '#e4e4e7', fontSize: 11, fontFamily: 'Orbitron' }}
              />
              <YAxis
                stroke="#a1a1aa"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                allowDecimals={false}
                unit=" agt"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#3f3f46', borderRadius: '12px', fontSize: '12px', fontFamily: 'Orbitron' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 12, fontFamily: 'Orbitron', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="cai-1" name="CAI 1 (Dominick)" stroke="#00E5FF" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cai-2" name="CAI 2 (Jay)" stroke="#FFCC00" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cai-3" name="CAI 3 (Albert)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cai-4" name="CAI 4 (Watkins)" stroke="#A855F7" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cai-5" name="CAI 5 (Amir)" stroke="#FF3366" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ALL 5 CAI TEAMS COMPARATIVE SCORECARDS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
        {caiMetrics.map((item) => {
          const isSelected = activeTeamId === item.teamId;

          return (
            <div
              key={item.teamId}
              onMouseEnter={() => setHoveredTeamId(item.teamId)}
              onMouseLeave={() => setHoveredTeamId(null)}
              onClick={() => {
                if (onSelectTeam) {
                  onSelectTeam(item.teamId);
                  playSound('click');
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-yellow-400/10 border-yellow-400/80 shadow-[0_0_20px_rgba(255,204,0,0.2)]'
                  : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-orbitron font-bold text-sm text-white">
                    {item.teamName}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                  {item.agentCount} Agents
                </span>
              </div>

              <div className="text-[11px] text-zinc-400 font-inter mb-2">
                Supervisor: <strong className="text-zinc-200">{item.supervisorName}</strong>
              </div>

              {/* Progress bar for Utilization */}
              <div className="space-y-1 my-2">
                <div className="flex items-center justify-between text-[10px] font-orbitron">
                  <span className="text-zinc-400">UTILIZATION:</span>
                  <span
                    className={`font-bold ${
                      item.utilizationRate > 100
                        ? 'text-red-400'
                        : item.utilizationRate > 85
                        ? 'text-yellow-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {item.utilizationRate}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(item.utilizationRate, 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/5 text-[10px]">
                <div>
                  <span className="text-zinc-500 font-orbitron">USED:</span>
                  <div className="font-teko text-base text-yellow-400 font-semibold leading-tight">
                    {item.totalBreakMinutes}m / {item.allocatedAllowanceMinutes}m
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 font-orbitron">COMPLIANCE:</span>
                  <div className="font-teko text-base text-emerald-400 font-semibold leading-tight">
                    {item.complianceRate}%
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[9px] text-zinc-400 font-mono">
                  Drift: <span className="text-red-400 font-semibold">+{item.overtimeDriftMinutes}m</span>
                </span>
                <span className="text-[9px] font-orbitron text-cyan flex items-center gap-0.5 hover:underline">
                  Filter Team <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
};
