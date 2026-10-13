import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  Gauge,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Bus,
  Clock,
  Navigation,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ObaRoute, SiriVehicleActivity } from '../../types/transit';
import { ROUTE_CATALOG } from '../../data/nycMtaCache';
import {
  getRealtimeRouteSpeedStats,
  RouteSpeedStats,
} from '../../services/routeSpeedService';

interface RouteSpeedAnalyticsPanelProps {
  routes: ObaRoute[];
  activities: SiriVehicleActivity[];
  selectedRouteId: string;
  onSelectRoute: (routeId: string) => void;
  selectedDepotId?: string;
  onSelectDepot?: (depotId: string) => void;
  className?: string;
}

export const RouteSpeedAnalyticsPanel: React.FC<RouteSpeedAnalyticsPanelProps> = ({
  routes,
  activities,
  selectedRouteId,
  onSelectRoute,
  selectedDepotId,
  onSelectDepot,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSpeedTab, setActiveSpeedTab] = useState<'OVERVIEW' | 'TIMELINE' | 'BUSES'>('OVERVIEW');
  const [hoveredHourPoint, setHoveredHourPoint] = useState<{
    hourLabel: string;
    historicalMph: number;
  } | null>(null);

  // SVG Refs for D3 Renderings
  const gaugeSvgRef = useRef<SVGSVGElement | null>(null);
  const timelineSvgRef = useRef<SVGSVGElement | null>(null);
  const busesSvgRef = useRef<SVGSVGElement | null>(null);

  // Calculate speed statistics for the selected route
  const stats: RouteSpeedStats = useMemo(() => {
    return getRealtimeRouteSpeedStats(selectedRouteId, activities);
  }, [selectedRouteId, activities]);

  // Grand Avenue Depot routes list for quick selection
  const grandAveRoutes = useMemo(() => {
    return ROUTE_CATALOG.filter((r) => r.route.depotId === 'GA').map((r) => r.route);
  }, []);

  // 1. D3 RADIAL VELOCITY GAUGE (Real-Time vs Historical Daily Average)
  useEffect(() => {
    if (!gaugeSvgRef.current || !isExpanded || activeSpeedTab !== 'OVERVIEW') return;

    const svg = d3.select(gaugeSvgRef.current);
    svg.selectAll('*').remove();

    const width = 200;
    const height = 110;
    const radius = 90;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height - 10})`);

    // Speed Scale: 0 to 25 mph mapped from -Math.PI / 2 to Math.PI / 2
    const maxScaleMph = 25;
    const angleScale = d3
      .scaleLinear()
      .domain([0, maxScaleMph])
      .range([-Math.PI / 2, Math.PI / 2])
      .clamp(true);

    // Background track arc
    const backgroundArc = d3
      .arc()
      .innerRadius(radius - 16)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2)
      .cornerRadius(8);

    g.append('path')
      .attr('d', backgroundArc as any)
      .attr('fill', '#1E293B')
      .attr('opacity', 0.85);

    // Historical Daily Average Arc (benchmark band)
    const histAngle = angleScale(stats.historicalDailyAvgMph);
    const histArc = d3
      .arc()
      .innerRadius(radius - 16)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(histAngle)
      .cornerRadius(8);

    g.append('path')
      .attr('d', histArc as any)
      .attr('fill', '#38BDF8')
      .attr('opacity', 0.35);

    // Real-Time Speed Arc
    const rtAngle = angleScale(stats.realtimeAvgMph);
    const rtColor =
      stats.status === 'FASTER'
        ? '#10B981' // Emerald
        : stats.status === 'CONGESTED'
        ? '#F43F5E' // Rose
        : '#F59E0B'; // Amber

    const rtArc = d3
      .arc()
      .innerRadius(radius - 16)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(rtAngle)
      .cornerRadius(8);

    g.append('path')
      .attr('d', rtArc as any)
      .attr('fill', rtColor)
      .attr('opacity', 0.95);

    // Historical benchmark tick line
    const tickOuterX = Math.cos(histAngle - Math.PI / 2) * (radius + 4);
    const tickOuterY = Math.sin(histAngle - Math.PI / 2) * (radius + 4);
    const tickInnerX = Math.cos(histAngle - Math.PI / 2) * (radius - 20);
    const tickInnerY = Math.sin(histAngle - Math.PI / 2) * (radius - 20);

    g.append('line')
      .attr('x1', tickInnerX)
      .attr('y1', tickInnerY)
      .attr('x2', tickOuterX)
      .attr('y2', tickOuterY)
      .attr('stroke', '#38BDF8')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '2,2');

    // Central speed value text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -16)
      .attr('fill', '#F8FAFC')
      .attr('font-size', '24px')
      .attr('font-weight', '800')
      .attr('font-family', 'monospace')
      .text(`${stats.realtimeAvgMph.toFixed(1)}`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 0)
      .attr('fill', '#94A3B8')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text('REAL-TIME MPH');

    // Min & Max scale labels
    g.append('text')
      .attr('x', -radius + 4)
      .attr('y', -4)
      .attr('fill', '#64748B')
      .attr('font-size', '9px')
      .attr('font-mono', 'true')
      .text('0');

    g.append('text')
      .attr('x', radius - 16)
      .attr('y', -4)
      .attr('fill', '#64748B')
      .attr('font-size', '9px')
      .attr('font-mono', 'true')
      .text('25');
  }, [stats, isExpanded, activeSpeedTab]);

  // 2. D3 HISTORICAL PROFILE VS REAL-TIME TIMELINE CHART
  useEffect(() => {
    if (!timelineSvgRef.current || !isExpanded || activeSpeedTab !== 'TIMELINE') return;

    const svg = d3.select(timelineSvgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 14, right: 16, bottom: 24, left: 32 };
    const width = 290 - margin.left - margin.right;
    const height = 120 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = stats.hourlyProfile;

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 23])
      .range([0, width]);

    const maxSpeed = Math.max(22, d3.max(data, (d) => d.historicalMph) || 20);
    const yScale = d3
      .scaleLinear()
      .domain([0, maxSpeed])
      .range([height, 0]);

    // Background grid lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickSize(-width)
      .tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.15)
      .attr('stroke', '#475569')
      .call(yAxisGrid);

    // Gradient for historical curve area
    const defs = svg.append('defs');
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'historical-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#38BDF8')
      .attr('stop-opacity', 0.35);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#38BDF8')
      .attr('stop-opacity', 0.02);

    // Area Generator
    const area = d3
      .area<any>()
      .x((d) => xScale(d.hour))
      .y0(height)
      .y1((d) => yScale(d.historicalMph))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#historical-area-grad)')
      .attr('d', area);

    // Historical Curve Line Generator
    const line = d3
      .line<any>()
      .x((d) => xScale(d.hour))
      .y((d) => yScale(d.historicalMph))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#38BDF8')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Horizontal Daily Average Benchmark Line
    const avgY = yScale(stats.historicalDailyAvgMph);
    g.append('line')
      .attr('x1', 0)
      .attr('y1', avgY)
      .attr('x2', width)
      .attr('y2', avgY)
      .attr('stroke', '#94A3B8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');

    // Current hour marker
    const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
    const currentX = xScale(currentHour);
    const rtY = yScale(stats.realtimeAvgMph);

    // Vertical Current Time Line
    g.append('line')
      .attr('x1', currentX)
      .attr('y1', 0)
      .attr('x2', currentX)
      .attr('y2', height)
      .attr('stroke', '#F59E0B')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '2,2');

    // Real-Time Speed Marker Dot
    g.append('circle')
      .attr('cx', currentX)
      .attr('cy', rtY)
      .attr('r', 5)
      .attr('fill', stats.status === 'FASTER' ? '#10B981' : stats.status === 'CONGESTED' ? '#F43F5E' : '#F59E0B')
      .attr('stroke', '#0F172A')
      .attr('stroke-width', 2);

    // X-Axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([0, 6, 12, 18, 23])
      .tickFormat((d) => `${d}h`);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('color', '#64748B')
      .attr('font-size', '9px')
      .call(xAxis);

    // Y-Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(3)
      .tickFormat((d) => `${d}`);

    g.append('g')
      .attr('color', '#64748B')
      .attr('font-size', '9px')
      .call(yAxis);
  }, [stats, isExpanded, activeSpeedTab]);

  // 3. D3 INDIVIDUAL BUS SPEED DISTRIBUTION
  useEffect(() => {
    if (!busesSvgRef.current || !isExpanded || activeSpeedTab !== 'BUSES') return;

    const svg = d3.select(busesSvgRef.current);
    svg.selectAll('*').remove();

    const buses = stats.buses.slice(0, 6);
    if (!buses.length) return;

    const margin = { top: 12, right: 36, bottom: 20, left: 56 };
    const width = 290 - margin.left - margin.right;
    const height = Math.max(90, buses.length * 20) - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yScale = d3
      .scaleBand()
      .domain(buses.map((b) => b.vehicleNumber))
      .range([0, height])
      .padding(0.28);

    const maxSpeed = Math.max(22, d3.max(buses, (b) => b.speedMph) || 20);
    const xScale = d3
      .scaleLinear()
      .domain([0, maxSpeed])
      .range([0, width]);

    // Benchmark vertical line for Historical Daily Average
    const histX = xScale(stats.historicalDailyAvgMph);
    g.append('line')
      .attr('x1', histX)
      .attr('y1', 0)
      .attr('x2', histX)
      .attr('y2', height)
      .attr('stroke', '#38BDF8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '2,2');

    // Horizontal bars for each bus
    g.selectAll('.bus-bar')
      .data(buses)
      .enter()
      .append('rect')
      .attr('class', 'bus-bar')
      .attr('y', (d) => yScale(d.vehicleNumber) || 0)
      .attr('x', 0)
      .attr('height', yScale.bandwidth())
      .attr('width', (d) => Math.max(4, xScale(d.speedMph)))
      .attr('rx', 3)
      .attr('fill', (d) => (d.speedMph >= stats.historicalDailyAvgMph ? '#10B981' : '#F59E0B'))
      .attr('opacity', 0.9);

    // Speed value text at end of each bar
    g.selectAll('.bus-label')
      .data(buses)
      .enter()
      .append('text')
      .attr('class', 'bus-label')
      .attr('x', (d) => xScale(d.speedMph) + 4)
      .attr('y', (d) => (yScale(d.vehicleNumber) || 0) + yScale.bandwidth() / 2 + 3)
      .attr('fill', '#E2E8F0')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .text((d) => `${d.speedMph}`);

    // Y Axis (Bus numbers)
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => `#${d}`);

    g.append('g')
      .attr('color', '#94A3B8')
      .attr('font-size', '9px')
      .call(yAxis);
  }, [stats, isExpanded, activeSpeedTab]);

  // Collapsed Minimal State
  if (!isExpanded) {
    return (
      <div
        className={`pointer-events-auto transition-all duration-200 ${className}`}
        role="region"
        aria-label="Collapsed route speed monitor"
      >
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 backdrop-blur-md border border-slate-800 hover:border-slate-700 shadow-2xl text-xs text-slate-200 hover:text-white transition-all group"
          title="Expand Route Speed Velocity Analytics"
        >
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold tracking-tight">Speed Analytics:</span>
          </div>

          <div
            className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border"
            style={{
              backgroundColor: `#${stats.routeColor}22`,
              color: `#${stats.routeColor}`,
              borderColor: `#${stats.routeColor}66`,
            }}
          >
            {stats.routeShortName}
          </div>

          <span className="font-mono font-bold text-emerald-400 tabular-nums">
            {stats.realtimeAvgMph.toFixed(1)} mph
          </span>

          <span className="text-[10px] text-slate-400 font-mono">
            (hist: {stats.historicalDailyAvgMph} mph)
          </span>

          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-auto w-80 sm:w-84 max-w-[calc(100vw-2rem)] rounded-xl bg-slate-950/92 backdrop-blur-md border border-slate-800/90 shadow-2xl flex flex-col text-slate-200 transition-all duration-200 ${className}`}
      role="region"
      aria-label="Route speed velocity analytics panel"
    >
      {/* Header Bar */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-100 tracking-tight whitespace-nowrap">
                Route Speed Velocity
              </h3>
              <span
                className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border shrink-0"
                style={{
                  backgroundColor: `#${stats.routeColor}22`,
                  color: `#${stats.routeColor}`,
                  borderColor: `#${stats.routeColor}66`,
                }}
              >
                {stats.routeShortName}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {stats.routeLongName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 rounded transition-colors"
            title="Minimize Speed Analytics"
            aria-label="Minimize Speed Analytics Panel"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grand Avenue Depot Quick Presets Banner */}
      <div className="px-2.5 py-1.5 bg-slate-900/60 border-b border-slate-800/70 flex items-center gap-1.5 text-[10px] overflow-x-auto scrollbar-none">
        <span className="text-amber-400 font-semibold shrink-0 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          Grand Ave:
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {grandAveRoutes.map((r) => {
            const isSelected = selectedRouteId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onSelectRoute(r.id);
                  if (onSelectDepot) onSelectDepot('GA');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={`Grand Avenue Depot: ${r.shortName} (${r.longName})`}
              >
                {r.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Velocity Comparison Status Bar */}
      <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
        <div>
          <div className="text-[10px] text-slate-400">Real-Time Fleet Avg</div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-base font-extrabold text-white">
              {stats.realtimeAvgMph.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400">mph</span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] text-slate-400">Historical Daily Avg</div>
          <div className="flex items-baseline justify-center gap-1 font-mono">
            <span className="text-base font-bold text-sky-300">
              {stats.historicalDailyAvgMph.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400">mph</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400">Variance Delta</div>
          <div
            className={`flex items-center justify-end gap-0.5 font-mono text-xs font-bold ${
              stats.status === 'FASTER'
                ? 'text-emerald-400'
                : stats.status === 'CONGESTED'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          >
            {stats.status === 'FASTER' ? (
              <TrendingUp className="w-3 h-3" />
            ) : stats.status === 'CONGESTED' ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>
              {stats.deltaMph > 0 ? `+${stats.deltaMph}` : `${stats.deltaMph}`} mph
            </span>
          </div>
        </div>
      </div>

      {/* Analytical Tab Toggle: Overview Gauge / 24h Profile / Buses */}
      <div className="flex items-center border-b border-slate-800/70 px-2 pt-1 bg-slate-900/30 text-[10px]">
        <button
          type="button"
          onClick={() => setActiveSpeedTab('OVERVIEW')}
          className={`flex-1 py-1 px-1.5 flex items-center justify-center gap-1 font-semibold border-b-2 transition-colors ${
            activeSpeedTab === 'OVERVIEW'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3 h-3" />
          <span>D3 Gauge</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSpeedTab('TIMELINE')}
          className={`flex-1 py-1 px-1.5 flex items-center justify-center gap-1 font-semibold border-b-2 transition-colors ${
            activeSpeedTab === 'TIMELINE'
              ? 'border-sky-400 text-sky-300 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>24h Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSpeedTab('BUSES')}
          className={`flex-1 py-1 px-1.5 flex items-center justify-center gap-1 font-semibold border-b-2 transition-colors ${
            activeSpeedTab === 'BUSES'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bus className="w-3 h-3" />
          <span>Buses ({stats.activeBusCount})</span>
        </button>
      </div>

      {/* D3 VISUALIZATION DISPLAY AREA */}
      <div className="p-2.5 flex flex-col items-center justify-center min-h-[125px]">
        {/* Tab 1: D3 Radial Gauge */}
        {activeSpeedTab === 'OVERVIEW' && (
          <div className="flex flex-col items-center justify-center w-full">
            <svg
              ref={gaugeSvgRef}
              width={200}
              height={110}
              className="overflow-visible"
              aria-label="Real-time vs historical speed radial gauge"
            />
            <div className="w-full flex items-center justify-between text-[10px] text-slate-400 px-2 pt-1 border-t border-slate-800/60 mt-1">
              <span className="flex items-center gap-1 text-sky-300">
                <span className="w-2 h-0.5 bg-sky-400 border border-sky-400 inline-block" />
                <span>Hist Avg: {stats.historicalDailyAvgMph} mph</span>
              </span>
              <span
                className={`font-semibold ${
                  stats.status === 'FASTER'
                    ? 'text-emerald-400'
                    : stats.status === 'CONGESTED'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {stats.status === 'FASTER'
                  ? 'Pacing Optimal (+)'
                  : stats.status === 'CONGESTED'
                  ? 'Peak Delay (-)'
                  : 'Normal Flow'}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: D3 24h Historical Timeline Curve */}
        {activeSpeedTab === 'TIMELINE' && (
          <div className="flex flex-col items-center justify-center w-full">
            <svg
              ref={timelineSvgRef}
              width={290}
              height={120}
              className="overflow-visible"
              aria-label="24-hour historical speed curve versus real-time speed"
            />
            <div className="w-full flex items-center justify-between text-[10px] text-slate-400 px-2 pt-1 border-t border-slate-800/60 mt-1">
              <span className="flex items-center gap-1 text-sky-300">
                <span className="w-2 h-1 bg-sky-400/50 inline-block" />
                <span>Daily Speed Curve</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span>Now: {stats.realtimeAvgMph} mph</span>
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: D3 Bus-by-Bus Speed Distribution */}
        {activeSpeedTab === 'BUSES' && (
          <div className="flex flex-col items-center justify-center w-full">
            {stats.buses.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No active coaches currently in service on this line
              </div>
            ) : (
              <>
                <svg
                  ref={busesSvgRef}
                  width={290}
                  height={Math.max(90, Math.min(6, stats.buses.length) * 20)}
                  className="overflow-visible"
                  aria-label="Individual coach speed distribution"
                />
                <div className="w-full flex items-center justify-between text-[10px] text-slate-400 px-2 pt-1 border-t border-slate-800/60 mt-1">
                  <span className="text-sky-300 font-mono text-[9px]">
                    Dashed line = {stats.historicalDailyAvgMph} mph daily benchmark
                  </span>
                  <span className="text-emerald-400 font-mono text-[9px]">
                    {stats.buses.filter((b) => b.speedMph >= stats.historicalDailyAvgMph).length}/{stats.buses.length} fast
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer Corridor Benchmark Context */}
      <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 rounded-b-xl flex items-center justify-between text-[10px] text-slate-400">
        <span className="truncate">
          {stats.depotId === 'GA' ? 'Grand Avenue Depot Fleet' : `${stats.borough || 'NYC'} Transit Grid`}
        </span>
        <button
          type="button"
          onClick={() => {
            onSelectRoute('MTA NYCT_B38');
            if (onSelectDepot) onSelectDepot('GA');
          }}
          className="text-amber-400 hover:text-amber-300 underline font-semibold shrink-0"
          title="Switch to Grand Avenue Depot B38 Corridor"
        >
          Grand Ave Hub
        </button>
      </div>
    </div>
  );
};
