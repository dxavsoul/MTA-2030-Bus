import React, { useState, useMemo } from 'react';
import {
  Search,
  Navigation,
  Clock,
  SlidersHorizontal,
  RotateCcw,
  MapPin,
  Zap,
} from 'lucide-react';
import {
  BoroughName,
  MtaDepot,
  ObaRoute,
  ObaScheduleForRouteEntry,
  ObaStop,
  SiriVehicleActivity,
} from '../../types/transit';

export type LeftSidebarTab = 'DEPOT_COMMAND' | 'ROUTE_MONITOR' | 'SCHEDULE_MATRIX';

interface DepotCommandPanelProps {
  depots: MtaDepot[];
  routes: ObaRoute[];
  activities: SiriVehicleActivity[];
  selectedDepotId: string;
  selectedRouteId: string;
  selectedVehicleRef: string | null;
  activeTab: LeftSidebarTab;
  routeStops: ObaStop[];
  routeSchedule: ObaScheduleForRouteEntry | null;
  onSelectDepot: (depotId: string) => void;
  onSelectRoute: (routeId: string) => void;
  onSelectVehicle: (vehicleRef: string | null) => void;
  onChangeTab: (tab: LeftSidebarTab) => void;
}

export const DepotCommandPanel: React.FC<DepotCommandPanelProps> = ({
  depots,
  routes,
  activities,
  selectedDepotId,
  selectedRouteId,
  selectedVehicleRef,
  activeTab,
  routeStops,
  routeSchedule,
  onSelectDepot,
  onSelectRoute,
  onSelectVehicle,
  onChangeTab,
}) => {
  const [boroughFilter, setBoroughFilter] = useState<'ALL' | BoroughName>('ALL');
  const [depotSearchQuery, setDepotSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [adherenceFilter, setAdherenceFilter] = useState<'ALL' | 'ON_TIME' | 'DELAYED'>('ALL');

  const selectedDepot = useMemo(
    () => depots.find((d) => d.id === selectedDepotId) || null,
    [depots, selectedDepotId]
  );

  const filteredDepotsByBorough = useMemo(() => {
    let list = depots;
    if (boroughFilter !== 'ALL') {
      list = list.filter((d) => d.borough === boroughFilter);
    }
    if (depotSearchQuery.trim()) {
      const q = depotSearchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          d.division.toLowerCase().includes(q) ||
          d.address.toLowerCase().includes(q) ||
          d.assignedRouteIds.some((r) => r.toLowerCase().includes(q))
      );
    }
    return list;
  }, [depots, boroughFilter, depotSearchQuery]);

  const queensDepotsCount = useMemo(
    () => depots.filter((d) => d.borough === 'Queens').length,
    [depots]
  );
  const brooklynDepotsCount = useMemo(
    () => depots.filter((d) => d.borough === 'Brooklyn').length,
    [depots]
  );

  const filteredRoutes = useMemo(() => {
    let rList = routes;
    if (selectedDepotId !== 'ALL') {
      rList = rList.filter((r) => r.depotId === selectedDepotId);
    } else if (boroughFilter !== 'ALL') {
      rList = rList.filter((r) => r.borough === boroughFilter);
    }
    return rList;
  }, [routes, selectedDepotId, boroughFilter]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const mvj = act.MonitoredVehicleJourney;
      const status = mvj.Extensions?.OperationalMeta?.ScheduleAdherenceStatus || 'ON_TIME';
      if (adherenceFilter !== 'ALL' && status !== adherenceFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        mvj.VehicleRef.toLowerCase().includes(q) ||
        mvj.PublishedLineName.toLowerCase().includes(q) ||
        mvj.DestinationName.toLowerCase().includes(q) ||
        mvj.MonitoredCall.StopPointName.toLowerCase().includes(q)
      );
    });
  }, [activities, adherenceFilter, searchQuery]);

  const onTimeCount = useMemo(() => {
    return activities.filter(
      (a) =>
        (a.MonitoredVehicleJourney.Extensions?.OperationalMeta?.ScheduleAdherenceStatus ||
          'ON_TIME') !== 'DELAYED'
    ).length;
  }, [activities]);

  const otpPercent =
    activities.length > 0 ? ((onTimeCount / activities.length) * 100).toFixed(1) : '86.4';

  return (
    <aside className="w-full lg:w-[380px] shrink-0 h-full bg-[#0D131F]/95 border-r border-slate-800/90 flex flex-col z-30 overflow-hidden">
      {/* Sub-navigation Mode Switcher */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => onChangeTab('DEPOT_COMMAND')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'DEPOT_COMMAND'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Depots ({depots.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeTab('ROUTE_MONITOR')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'ROUTE_MONITOR'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Fleet ({activities.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeTab('SCHEDULE_MATRIX')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'SCHEDULE_MATRIX'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Schedules
          </button>
        </div>

        {/* Active Scope Summary Strip */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="truncate">
            <span className="text-slate-200 font-medium">
              {selectedDepot ? selectedDepot.name : `${boroughFilter === 'ALL' ? 'All NYC' : boroughFilter} Depots`}
            </span>
            <span aria-hidden="true" className="mx-1.5 text-slate-600">
              ·
            </span>
            <span className="font-mono text-sky-400 tabular-nums">
              {selectedRouteId === 'ALL'
                ? `${filteredRoutes.length} corridors`
                : selectedRouteId.replace('MTA NYCT_', '')}
            </span>
          </div>
          {(selectedDepotId !== 'ALL' || selectedRouteId !== 'ALL' || boroughFilter !== 'ALL' || selectedVehicleRef) && (
            <button
              type="button"
              onClick={() => {
                setBoroughFilter('ALL');
                onSelectDepot('ALL');
                onSelectRoute('ALL');
                onSelectVehicle(null);
              }}
              className="flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-3 divide-x divide-slate-800/80 border-b border-slate-800/80 bg-slate-950/40">
        <div className="px-3.5 py-2.5">
          <div className="text-[11px] text-slate-400">Active Fleet</div>
          <div className="mt-0.5 text-base font-semibold font-mono text-slate-100 tabular-nums">
            {activities.length}
          </div>
        </div>
        <div className="px-3.5 py-2.5">
          <div className="text-[11px] text-slate-400">Schedule OTP</div>
          <div className="mt-0.5 text-base font-semibold font-mono text-emerald-400 tabular-nums">
            {otpPercent}%
          </div>
        </div>
        <div className="px-3.5 py-2.5">
          <div className="text-[11px] text-slate-400">Depots / Routes</div>
          <div className="mt-0.5 text-base font-semibold font-mono text-sky-400 tabular-nums">
            {filteredDepotsByBorough.length}/{filteredRoutes.length}
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70">
        {/* TAB 1: DEPOT COMMAND CENTER */}
        {activeTab === 'DEPOT_COMMAND' && (
          <div className="p-4 space-y-4">
            {/* Dedicated Borough Jurisdiction Filter (Queens & Brooklyn Quick Switch) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Borough Division</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {filteredDepotsByBorough.length} depots
                </span>
              </div>

              <div className="flex flex-wrap gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBoroughFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    boroughFilter === 'ALL'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All NYC
                </button>
                <button
                  type="button"
                  onClick={() => setBoroughFilter('Queens')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    boroughFilter === 'Queens'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Queens ({queensDepotsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBoroughFilter('Brooklyn')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    boroughFilter === 'Brooklyn'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Brooklyn ({brooklynDepotsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBoroughFilter('Manhattan')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    boroughFilter === 'Manhattan'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Manhattan
                </button>
              </div>

              <div className="relative mt-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Queens & Brooklyn depots, routes..."
                  value={depotSearchQuery}
                  onChange={(e) => setDepotSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-sky-500"
                />
                {depotSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDepotSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* List of Depots */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Select Facility ({filteredDepotsByBorough.length} Available)</span>
                {(selectedDepotId !== 'ALL' || depotSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDepot('ALL');
                      setDepotSearchQuery('');
                    }}
                    className="text-sky-400 hover:text-sky-300 text-xs font-medium"
                  >
                    View All
                  </button>
                )}
              </div>

              {filteredDepotsByBorough.length === 0 && (
                <div className="p-4 text-center rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                  No MTA bus depots found matching "{depotSearchQuery}".
                </div>
              )}

              {filteredDepotsByBorough.map((depot) => {
                const isSelected = selectedDepotId === depot.id;
                return (
                  <div
                    key={depot.id}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-sky-950/45 border-sky-400 shadow-md shadow-sky-950/50 ring-1 ring-sky-400/30'
                        : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div
                      onClick={() => onSelectDepot(isSelected ? 'ALL' : depot.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                          {depot.name}
                        </span>
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 tabular-nums shrink-0 font-semibold border border-slate-700/60">
                          {depot.code} · {depot.borough}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-slate-400 truncate">{depot.address}</div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-300 font-mono tabular-nums">
                        <span>
                          Active: {depot.activeVehiclesCount}/{depot.scheduledVehiclesCount}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="text-emerald-400">OTP {depot.onTimePerformancePct}%</span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="flex items-center gap-1 text-amber-300">
                          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                          {depot.electricChargingBays} Bays
                        </span>
                      </div>
                    </div>

                    {/* Assigned Route Quick-Launch Chips */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        Routes:
                      </span>
                      {depot.assignedRouteIds.map((rId) => {
                        const cleanName = rId.replace('MTA NYCT_', '');
                        const isRouteSelected = selectedRouteId === rId;
                        return (
                          <button
                            key={rId}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDepot(depot.id);
                              onSelectRoute(isRouteSelected ? 'ALL' : rId);
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors border ${
                              isRouteSelected
                                ? 'bg-sky-400 text-slate-950 border-white shadow-xs'
                                : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-sky-400 hover:text-sky-300'
                            }`}
                          >
                            {cleanName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Routes Assigned to Current Selection */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-slate-200">
                    {selectedDepot ? `${selectedDepot.name} Routes` : 'All Active Corridors'} ({filteredRoutes.length})
                  </span>
                  {selectedDepot && (
                    <div className="text-[11px] text-sky-400 font-mono">
                      Filtered by {selectedDepot.code} · {selectedDepot.borough}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedDepotId !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDepot('ALL');
                        onSelectRoute('ALL');
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                      title="Clear depot filter to show all corridors"
                    >
                      Show All Depots
                    </button>
                  )}
                  {selectedRouteId !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => onSelectRoute('ALL')}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                    >
                      All Depot Routes
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                {filteredRoutes.map((route) => {
                  const isRouteSelected = selectedRouteId === route.id;
                  const routeBusesCount = activities.filter(
                    (a) => a.MonitoredVehicleJourney.LineRef === route.id
                  ).length;

                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => onSelectRoute(isRouteSelected ? 'ALL' : route.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        isRouteSelected
                          ? 'bg-sky-950/45 border-sky-400'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            style={{ color: `#${route.color}` }}
                            className="font-mono text-xs font-bold whitespace-nowrap shrink-0"
                          >
                            {route.shortName}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">
                            ·
                          </span>
                          <span className="text-xs font-medium text-slate-200 truncate">
                            {route.longName}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                          {routeBusesCount} buses
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROUTE & FLEET MONITOR */}
        {activeTab === 'ROUTE_MONITOR' && (
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Depot Filter:
                </label>
                {selectedDepotId !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDepot('ALL');
                      onSelectRoute('ALL');
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Clear Depot (Show All)
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <select
                  value={selectedDepotId}
                  onChange={(e) => {
                    onSelectDepot(e.target.value);
                    onSelectRoute('ALL');
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
                >
                  <option value="ALL">All MTA Depots ({depots.length} facilities)</option>
                  <optgroup label="Queens Depots (8)">
                    {depots.filter((d) => d.borough === 'Queens').map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code}) - {d.assignedRouteIds.length} routes
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Brooklyn Depots (7)">
                    {depots.filter((d) => d.borough === 'Brooklyn').map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code}) - {d.assignedRouteIds.length} routes
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Manhattan Division">
                    {depots.filter((d) => d.borough === 'Manhattan').map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code}) - {d.assignedRouteIds.length} routes
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Filter Corridors ({filteredRoutes.length})
                </label>
                {selectedDepot && (
                  <span className="text-[11px] font-mono text-sky-400 font-semibold">
                    {selectedDepot.code} Division
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectRoute('ALL')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    selectedRouteId === 'ALL'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  All Routes
                </button>
                {filteredRoutes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectRoute(selectedRouteId === r.id ? 'ALL' : r.id)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      selectedRouteId === r.id
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {r.shortName}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search coach #, destination, stop..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-md text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Adherence:</span>
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
                  {(['ALL', 'ON_TIME', 'DELAYED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAdherenceFilter(st)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                        adherenceFilter === st
                          ? 'bg-slate-800 text-sky-400'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st === 'ON_TIME' ? 'On Time' : 'Delayed'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {filteredActivities.length === 0 ? (
                <div className="p-6 text-center border border-slate-800/80 rounded-lg bg-slate-900/30">
                  <p className="text-xs text-slate-400">
                    No active vehicles match current filter criteria.
                  </p>
                </div>
              ) : (
                filteredActivities.map((act) => {
                  const mvj = act.MonitoredVehicleJourney;
                  const vRef = mvj.VehicleRef;
                  const shortNum = vRef.replace('MTA NYCT_', '');
                  const isSelected = selectedVehicleRef === vRef;
                  const meta = mvj.Extensions?.OperationalMeta;
                  const adherenceStatus = meta?.ScheduleAdherenceStatus || 'ON_TIME';

                  return (
                    <button
                      key={vRef}
                      type="button"
                      onClick={() => onSelectVehicle(isSelected ? null : vRef)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-sky-950/45 border-sky-400'
                          : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs font-bold text-sky-400 whitespace-nowrap shrink-0">
                            {mvj.PublishedLineName}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">
                            ·
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-100 tabular-nums whitespace-nowrap shrink-0">
                            Coach #{shortNum}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-mono tabular-nums whitespace-nowrap shrink-0 ${
                            adherenceStatus === 'DELAYED'
                              ? 'text-amber-400'
                              : adherenceStatus === 'EARLY'
                              ? 'text-sky-300'
                              : 'text-emerald-400'
                          }`}
                        >
                          {adherenceStatus === 'DELAYED'
                            ? 'Delayed'
                            : adherenceStatus === 'EARLY'
                            ? 'Early'
                            : 'On Time'}{' '}
                          · {(meta?.SpeedMph ?? 14.0).toFixed(1)} mph
                        </span>
                      </div>

                      <div className="mt-1.5 text-xs text-slate-300 truncate">
                        To: <span className="font-medium text-slate-100">{mvj.DestinationName}</span>
                      </div>

                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate pr-2">
                          Next: {mvj.MonitoredCall?.StopPointName || 'Approaching'}
                        </span>
                        <span className="font-mono text-sky-300 tabular-nums whitespace-nowrap shrink-0">
                          {mvj.MonitoredCall?.Extensions?.Distances?.PresentableDistance || 'en route'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ONEBUSAWAY SCHEDULE MATRIX */}
        {activeTab === 'SCHEDULE_MATRIX' && (
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Depot Filter:
                </label>
                {selectedDepotId !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDepot('ALL');
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Clear Depot (Show All)
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <select
                  value={selectedDepotId}
                  onChange={(e) => {
                    const newDepotId = e.target.value;
                    onSelectDepot(newDepotId);
                    if (newDepotId !== 'ALL') {
                      const dObj = depots.find((d) => d.id === newDepotId);
                      if (dObj && dObj.assignedRouteIds.length > 0) {
                        onSelectRoute(dObj.assignedRouteIds[0]);
                      }
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-sky-500 font-medium"
                >
                  <option value="ALL">All MTA Depots ({depots.length} facilities)</option>
                  <optgroup label="Queens Depots (8)">
                    {depots.filter((d) => d.borough === 'Queens').map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code}) - {d.assignedRouteIds.length} routes
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Brooklyn Depots (7)">
                    {depots.filter((d) => d.borough === 'Brooklyn').map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code}) - {d.assignedRouteIds.length} routes
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Manhattan Division">
                    {depots.filter((d) => d.borough === 'Manhattan').map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code}) - {d.assignedRouteIds.length} routes
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Inspect Route Schedule & Timetables ({filteredRoutes.length})
                </label>
                {selectedDepot && (
                  <span className="text-[11px] font-mono text-sky-400 font-semibold">
                    {selectedDepot.code} Division
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filteredRoutes.map((r) => {
                  const activeR = selectedRouteId === 'ALL' ? filteredRoutes[0]?.id : selectedRouteId;
                  const isCurrent = activeR === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelectRoute(r.id)}
                      className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                        isCurrent
                          ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {r.shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            {routeSchedule && (
              <>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Headway Windows & Allocation</span>
                  </h3>
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400">
                          <th className="py-2 px-2.5 font-medium">Period</th>
                          <th className="py-2 px-2 font-medium text-right">Headway</th>
                          <th className="py-2 px-2.5 font-medium text-right">Buses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {routeSchedule.frequencyWindows.map((win) => (
                          <tr key={win.periodName} className="hover:bg-slate-900/40">
                            <td className="py-2 px-2.5 text-slate-200">{win.periodName}</td>
                            <td className="py-2 px-2 text-right font-mono text-sky-400 tabular-nums">
                              Every {win.headwayMinutes}m
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono text-slate-300 tabular-nums">
                              {win.activeBuses}/{win.scheduledBuses}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Corridor Stops ({routeStops.length})</span>
                  </h3>
                  <div className="space-y-1.5">
                    {routeStops.map((st, idx) => (
                      <div
                        key={st.id}
                        className="px-3 py-2 rounded-md bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-200 truncate">
                            <span className="font-mono text-slate-500 mr-1.5 tabular-nums">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            {st.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                            Stop #{st.code} · {st.lat.toFixed(4)}, {st.lon.toFixed(4)}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 whitespace-nowrap shrink-0">
                          ADA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
