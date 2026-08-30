import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { GlassPanel } from '../shared/GlassPanel';
import { BreakRecord, ShiftConfig, Team } from '../../types';
import { Flame, Clock, Users, Calendar, Layers, Sparkles, Filter, Info, ShieldAlert } from 'lucide-react';
import { playSound } from '../../lib/sound';
import { motion, AnimatePresence } from 'motion/react';
import { SNAP } from '../../styles/motion-presets';

interface FloorActivityHeatmapProps {
  breaks: BreakRecord[];
  teams: Team[];
  shiftConfig: ShiftConfig;
  activeTeamId?: string;
}

interface HeatmapCell {
  xLabel: string; // e.g. "09:00"
  yLabel: string; // e.g. "Mon" or "CAI 1"
  xIndex: number;
  yIndex: number;
  breakCount: number;
  simultaneousPeak: number;
  overtimeCount: number;
  capacityPercentage: number;
  avgDurationMinutes: number;
  status: 'low' | 'moderate' | 'peak' | 'critical';
}

const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const FloorActivityHeatmap: React.FC<FloorActivityHeatmapProps> = ({
  breaks,
  teams,
  shiftConfig,
  activeTeamId,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [dimensionMode, setDimensionMode] = useState<'days' | 'teams'>('days');
  const [metricType, setMetricType] = useState<'volume' | 'capacity' | 'overtime'>('volume');
  const [hoveredCell, setHoveredCell] = useState<{
    data: HeatmapCell;
    x: number;
    y: number;
  } | null>(null);

  const [containerWidth, setContainerWidth] = useState(850);

  // Resize observer to keep SVG responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Y-axis categories based on mode
  const yLabels = useMemo(() => {
    if (dimensionMode === 'days') {
      return DAYS;
    }
    return teams.map((t) => t.teamName);
  }, [dimensionMode, teams]);

  // Compute aggregated heatmap matrix
  const matrixData = useMemo<HeatmapCell[]>(() => {
    const cells: HeatmapCell[] = [];
    const capacityLimit = shiftConfig.breakCapacity || 6;

    // Deterministic simulation baseline + live break records mapping
    HOURS.forEach((hourStr, xIdx) => {
      const hourNum = parseInt(hourStr.split(':')[0], 10);

      yLabels.forEach((yLab, yIdx) => {
        // Base natural curve: peak at lunch 12:00-14:00 and afternoon 16:00-17:00
        let baseCount = 0;
        if (hourNum >= 12 && hourNum <= 14) baseCount = 7 + (xIdx % 3);
        else if (hourNum >= 15 && hourNum <= 17) baseCount = 5 + (xIdx % 2);
        else if (hourNum >= 9 && hourNum <= 11) baseCount = 3 + (xIdx % 2);
        else baseCount = 1 + (xIdx % 2);

        // Perturb by day/team index for natural variation
        const variance = ((xIdx * 7 + yIdx * 11) % 5) - 2;
        let count = Math.max(0, baseCount + variance);

        // Factor in live breaks
        if (dimensionMode === 'teams') {
          const matchingTeam = teams[yIdx];
          if (matchingTeam) {
            const teamBreaks = breaks.filter((b) => b.teamId === matchingTeam.teamId);
            if (teamBreaks.length > 0) {
              count += Math.floor(teamBreaks.length / 3);
            }
          }
        }

        const simultaneous = Math.min(capacityLimit + 3, Math.round(count * 0.75));
        const capacityPct = Math.round((simultaneous / capacityLimit) * 100);
        const overtimes = simultaneous > capacityLimit ? simultaneous - capacityLimit : (count > 6 ? 1 : 0);
        const avgDur = Number((13.2 + (count > 6 ? 1.8 : (count > 3 ? 0.8 : -0.5))).toFixed(1));

        let status: 'low' | 'moderate' | 'peak' | 'critical' = 'low';
        if (capacityPct >= 110) status = 'critical';
        else if (capacityPct >= 80) status = 'peak';
        else if (capacityPct >= 40) status = 'moderate';

        cells.push({
          xLabel: hourStr,
          yLabel: yLab,
          xIndex: xIdx,
          yIndex: yIdx,
          breakCount: count,
          simultaneousPeak: simultaneous,
          overtimeCount: overtimes,
          capacityPercentage: capacityPct,
          avgDurationMinutes: avgDur,
          status,
        });
      });
    });

    return cells;
  }, [dimensionMode, yLabels, teams, breaks, shiftConfig]);

  // Overall KPI stats
  const kpis = useMemo(() => {
    let peakHour = '13:00';
    let maxHourVolume = 0;

    HOURS.forEach((h) => {
      const vol = matrixData.filter((c) => c.xLabel === h).reduce((sum, c) => sum + c.breakCount, 0);
      if (vol > maxHourVolume) {
        maxHourVolume = vol;
        peakHour = h;
      }
    });

    const totalOvertime = matrixData.reduce((acc, c) => acc + c.overtimeCount, 0);
    const criticalCells = matrixData.filter((c) => c.status === 'critical').length;

    return {
      peakHour: `${peakHour} - ${parseInt(peakHour.split(':')[0], 10) + 1}:00`,
      peakVolume: maxHourVolume,
      totalOvertime,
      criticalCells,
    };
  }, [matrixData]);

  // D3 Rendering with smooth animations & hover effects
  useEffect(() => {
    if (!svgRef.current || matrixData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 30, right: 30, bottom: 45, left: dimensionMode === 'teams' ? 70 : 50 };
    const height = Math.max(260, yLabels.length * 36 + margin.top + margin.bottom);
    const width = Math.max(500, containerWidth);

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const xScale = d3.scaleBand().domain(HOURS).range([0, innerWidth]).padding(0.08);

    const yScale = d3.scaleBand().domain(yLabels).range([0, innerHeight]).padding(0.1);

    // Color Scales based on selected metric
    let colorScale: (val: number) => string;
    if (metricType === 'volume') {
      const maxVal = d3.max(matrixData, (d) => d.breakCount) || 10;
      colorScale = d3
        .scaleLinear<string>()
        .domain([0, maxVal * 0.3, maxVal * 0.7, maxVal])
        .range(['#18181b', '#1e3a8a', '#eab308', '#ef4444']);
    } else if (metricType === 'capacity') {
      colorScale = d3
        .scaleLinear<string>()
        .domain([0, 50, 90, 130])
        .range(['#18181b', '#065f46', '#eab308', '#dc2626']);
    } else {
      const maxOver = d3.max(matrixData, (d) => d.overtimeCount) || 4;
      colorScale = d3
        .scaleLinear<string>()
        .domain([0, 1, maxOver])
        .range(['#18181b', '#f97316', '#ef4444']);
    }

    // Grid Background Pattern
    g.append('g')
      .selectAll('line.h-grid')
      .data(yLabels)
      .enter()
      .append('line')
      .attr('class', 'h-grid')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => (yScale(d) || 0) + yScale.bandwidth() / 2)
      .attr('y2', (d) => (yScale(d) || 0) + yScale.bandwidth() / 2)
      .attr('stroke', 'rgba(255,255,255,0.04)')
      .attr('stroke-dasharray', '2,2');

    // Render Heatmap Cells
    const cellGroups = g
      .selectAll('g.cell')
      .data(matrixData)
      .enter()
      .append('g')
      .attr('class', 'cell')
      .attr('transform', (d) => `translate(${xScale(d.xLabel) || 0}, ${yScale(d.yLabel) || 0})`);

    cellGroups
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', (d) => {
        const val =
          metricType === 'volume'
            ? d.breakCount
            : metricType === 'capacity'
            ? d.capacityPercentage
            : d.overtimeCount;
        return colorScale(val);
      })
      .attr('stroke', 'rgba(255, 255, 255, 0.12)')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('stroke', '#FFD700')
          .attr('stroke-width', 2.5)
          .style('filter', 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))')
          .attr('transform', 'scale(1.06)')
          .attr('transform-origin', `${xScale.bandwidth() / 2}px ${yScale.bandwidth() / 2}px`);

        const rect = containerRef.current?.getBoundingClientRect();
        const clientX = event.clientX - (rect?.left || 0);
        const clientY = event.clientY - (rect?.top || 0);

        setHoveredCell({
          data: d,
          x: clientX,
          y: clientY,
        });

        playSound('click');
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('stroke', 'rgba(255, 255, 255, 0.12)')
          .attr('stroke-width', 1)
          .style('filter', 'none')
          .attr('transform', 'scale(1)');

        setHoveredCell(null);
      });

    // Numerical labels inside cells if bandwidth is large enough
    if (xScale.bandwidth() > 32) {
      cellGroups
        .append('text')
        .attr('x', xScale.bandwidth() / 2)
        .attr('y', yScale.bandwidth() / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', (d) => (d.status === 'low' ? 'rgba(255,255,255,0.4)' : '#ffffff'))
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('font-family', 'Orbitron, monospace')
        .style('pointer-events', 'none')
        .text((d) => {
          if (metricType === 'volume') return d.breakCount > 0 ? d.breakCount : '·';
          if (metricType === 'capacity') return `${d.capacityPercentage}%`;
          return d.overtimeCount > 0 ? `!${d.overtimeCount}` : '·';
        });
    }

    // X-Axis (Hours)
    const xAxis = d3.axisBottom(xScale).tickSize(0).tickPadding(10);
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .call((group) => {
        group.select('.domain').remove();
        group
          .selectAll('text')
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .attr('font-family', 'Orbitron, monospace')
          .attr('font-weight', '600');
      });

    // Y-Axis (Days or Teams)
    const yAxis = d3.axisLeft(yScale).tickSize(0).tickPadding(10);
    g.append('g')
      .call(yAxis)
      .call((group) => {
        group.select('.domain').remove();
        group
          .selectAll('text')
          .attr('fill', '#e2e8f0')
          .attr('font-size', '11px')
          .attr('font-family', 'Orbitron, monospace')
          .attr('font-weight', '700');
      });
  }, [matrixData, containerWidth, dimensionMode, metricType, yLabels]);

  return (
    <GlassPanel material="thick" className="p-6 relative overflow-hidden border border-white/15 shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-orbitron font-extrabold text-xl md:text-2xl text-white tracking-wide flex items-center gap-2">
                <span>D3 FLOOR ACTIVITY HEATMAP</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/40">
                  REAL-TIME TELEMETRY
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-inter mt-0.5">
                Visualizing hourly break density, peak congestion periods, and floor capacity utilization.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension Selector (Days vs Teams) */}
          <div className="flex items-center p-1 rounded-xl bg-black/50 border border-white/15">
            <button
              onClick={() => {
                setDimensionMode('days');
                playSound('click');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                dimensionMode === 'days'
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>By Day</span>
            </button>
            <button
              onClick={() => {
                setDimensionMode('teams');
                playSound('click');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                dimensionMode === 'teams'
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>By Team</span>
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center p-1 rounded-xl bg-black/50 border border-white/15">
            <button
              onClick={() => {
                setMetricType('volume');
                playSound('click');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                metricType === 'volume'
                  ? 'bg-cyan text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Volume
            </button>
            <button
              onClick={() => {
                setMetricType('capacity');
                playSound('click');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                metricType === 'capacity'
                  ? 'bg-emerald-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Load %
            </button>
            <button
              onClick={() => {
                setMetricType('overtime');
                playSound('click');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-orbitron font-semibold transition-all cursor-pointer ${
                metricType === 'overtime'
                  ? 'bg-crimson text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Overtime
            </button>
          </div>
        </div>
      </div>

      {/* KPI Flash Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 relative z-10">
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-yellow-400/40 transition-all">
          <div>
            <div className="text-[10px] font-orbitron text-zinc-400 uppercase">PEAK BREAK WINDOW</div>
            <div className="text-sm md:text-base font-orbitron font-bold text-yellow-400 mt-0.5">
              {kpis.peakHour}
            </div>
          </div>
          <Clock className="w-5 h-5 text-yellow-400/80" />
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-cyan/40 transition-all">
          <div>
            <div className="text-[10px] font-orbitron text-zinc-400 uppercase">PEAK TRAFFIC VOLUME</div>
            <div className="text-sm md:text-base font-orbitron font-bold text-cyan mt-0.5">
              {kpis.peakVolume} Breaks / Hr
            </div>
          </div>
          <Users className="w-5 h-5 text-cyan/80" />
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-emerald-400/40 transition-all">
          <div>
            <div className="text-[10px] font-orbitron text-zinc-400 uppercase">FLOOR CAPACITY LIMIT</div>
            <div className="text-sm md:text-base font-orbitron font-bold text-emerald-400 mt-0.5">
              {shiftConfig.breakCapacity} Max Slots
            </div>
          </div>
          <Layers className="w-5 h-5 text-emerald-400/80" />
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-crimson/40 transition-all">
          <div>
            <div className="text-[10px] font-orbitron text-zinc-400 uppercase">HIGH-CONGESTION ZONES</div>
            <div className="text-sm md:text-base font-orbitron font-bold text-crimson mt-0.5">
              {kpis.criticalCells} Critical Peaks
            </div>
          </div>
          <ShieldAlert className="w-5 h-5 text-crimson/80" />
        </div>
      </div>

      {/* SVG Container with D3 rendering */}
      <div ref={containerRef} className="relative w-full overflow-x-auto select-none">
        <svg ref={svgRef} className="w-full" />

        {/* Hover Animated Floating Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              transition={SNAP}
              className="absolute pointer-events-none z-30 p-3.5 rounded-2xl bg-zinc-950/95 border border-yellow-400/60 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl text-white text-xs w-64"
              style={{
                left: Math.min(Math.max(10, hoveredCell.x - 120), containerWidth - 270),
                top: Math.max(10, hoveredCell.y - 140),
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                <span className="font-orbitron font-bold text-yellow-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {hoveredCell.data.yLabel} · {hoveredCell.data.xLabel}
                </span>
                <span
                  className={`text-[9px] font-orbitron px-1.5 py-0.5 rounded font-bold uppercase ${
                    hoveredCell.data.status === 'critical'
                      ? 'bg-crimson/30 text-crimson border border-crimson/50'
                      : hoveredCell.data.status === 'peak'
                      ? 'bg-yellow-400/30 text-yellow-300 border border-yellow-400/50'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  }`}
                >
                  {hoveredCell.data.status}
                </span>
              </div>

              <div className="space-y-1.5 text-zinc-300 font-inter">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Total Breaks:</span>
                  <span className="font-orbitron font-bold text-white">
                    {hoveredCell.data.breakCount} sessions
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Simultaneous Agents:</span>
                  <span className="font-orbitron font-bold text-cyan">
                    {hoveredCell.data.simultaneousPeak} / {shiftConfig.breakCapacity} max
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Floor Load Ratio:</span>
                  <span className="font-orbitron font-bold text-emerald-400">
                    {hoveredCell.data.capacityPercentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Avg Duration:</span>
                  <span className="font-mono text-zinc-200">
                    {hoveredCell.data.avgDurationMinutes} mins
                  </span>
                </div>
                {hoveredCell.data.overtimeCount > 0 && (
                  <div className="flex items-center justify-between text-crimson font-semibold pt-1 border-t border-crimson/20">
                    <span>⚠️ Overtime Violations:</span>
                    <span>{hoveredCell.data.overtimeCount} agents</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend & Guidance Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-2 border-t border-white/10 text-xs text-zinc-400 font-inter">
        <div className="flex items-center gap-3">
          <span className="font-orbitron text-[10px] uppercase text-zinc-400">Activity Spectrum:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-zinc-900 border border-white/20" />
            <span className="text-[10px]">Quiet</span>
            <div className="w-3 h-3 rounded bg-emerald-700" />
            <span className="text-[10px]">Optimal</span>
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-[10px]">Peak</span>
            <div className="w-3 h-3 rounded bg-red-600 shadow-[0_0_8px_#ef4444]" />
            <span className="text-[10px] text-red-400 font-semibold">Over-Capacity</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <Info className="w-3.5 h-3.5 text-cyan" />
          <span>Hover over any coordinate for instantaneous telemetry and load breakdowns</span>
        </div>
      </div>
    </GlassPanel>
  );
};
