import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import {
  RefreshCw,
  Layers,
  Eye,
  Compass,
  RotateCcw,
  Shield,
  Bell,
  Sparkles,
  User,
  LogIn,
  LogOut,
} from 'lucide-react';
import {
  fetchEnvConfigStatus,
  fetchMtaDepotsAndRoutes,
  fetchSiriMonitoredVehicleJourney,
  fetchSiriVehicleMonitoring,
} from './services/siriApi';
import {
  fetchObaScheduleForRoute,
  fetchObaStopsForRoute,
} from './services/oneBusAwayApi';
import {
  MTA_DEPOTS,
  ROUTE_CATALOG,
  generateMonitoredVehicleJourneyTrace,
  generateObaScheduleForRoute,
  generateSiriVehicleMonitoringPayload,
} from './data/nycMtaCache';
import {
  CameraPresetMode,
  NYC3DCityscapeCanvas,
} from './components/map/NYC3DCityscapeCanvas';
import { GoogleMapsWebGLCanvas } from './components/map/GoogleMapsWebGLCanvas';
import {
  DepotCommandPanel,
  LeftSidebarTab,
} from './components/panels/DepotCommandPanel';
import { BusJourneyInspector } from './components/panels/BusJourneyInspector';
import { SiriBlueprintModal } from './components/panels/SiriBlueprintModal';
import { RouteColorLegendPanel } from './components/panels/RouteColorLegendPanel';
import { RouteSpeedAnalyticsPanel } from './components/panels/RouteSpeedAnalyticsPanel';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { CommuterAlertsModal } from './components/panels/CommuterAlertsModal';
import { TransitAlertBannerOverlay } from './components/panels/TransitAlertBannerOverlay';
import { useAuth } from './context/AuthContext';
import {
  subscribeDepotRouteOverrides,
  subscribeAdWordsCampaigns,
  subscribeTransitAlerts,
} from './services/firebaseClient';
import { AdWordsCampaign, TransitAlert } from './types/admin';

export default function App() {
  const { currentUser, isAdmin, signIn, signOut } = useAuth();
  const [activeView, setActiveView] = useState<'LIVE_MAP' | 'ADMIN_DASHBOARD'>('LIVE_MAP');
  const [isCommuterAlertsOpen, setIsCommuterAlertsOpen] = useState<boolean>(false);

  // Firestore Live States
  const [depotOverrides, setDepotOverrides] = useState<Record<string, string>>({});
  const [adwordsCampaigns, setAdwordsCampaigns] = useState<AdWordsCampaign[]>([]);
  const [transitAlerts, setTransitAlerts] = useState<TransitAlert[]>([]);

  // Default to ALL NYC Depots so all routes across Queens, Brooklyn, and Manhattan appear immediately on the map
  const [selectedDepotId, setSelectedDepotId] = useState<string>('ALL');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL');
  const [selectedVehicleRef, setSelectedVehicleRef] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<LeftSidebarTab>('DEPOT_COMMAND');

  const [buildingOpacity, setBuildingOpacity] = useState<number>(0.25);
  const [showBuildings, setShowBuildings] = useState<boolean>(false);
  const [showRouteShapes, setShowRouteShapes] = useState<boolean>(true);
  const [showStops, setShowStops] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetMode>('STREET_3D');
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);
  const [renderEngine, setRenderEngine] = useState<'NYC_3D_CACHE' | 'GOOGLE_MAPS_WEBGL'>(
    'GOOGLE_MAPS_WEBGL'
  );

  const [isBlueprintOpen, setIsBlueprintOpen] = useState<boolean>(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);
  const [pollIntervalSec, setPollIntervalSec] = useState<10 | 15>(10);

  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Subscribe to live Firestore admin changes
  useEffect(() => {
    const unsubOverrides = subscribeDepotRouteOverrides(setDepotOverrides);
    const unsubAds = subscribeAdWordsCampaigns(setAdwordsCampaigns);
    const unsubAlerts = subscribeTransitAlerts(setTransitAlerts);

    return () => {
      unsubOverrides();
      unsubAds();
      unsubAlerts();
    };
  }, []);

  const { data: envConfig } = useSWR('env-config', fetchEnvConfigStatus, {
    revalidateOnFocus: false,
  });

  const { data: depotsData, mutate: mutateDepots } = useSWR('mta-depots', fetchMtaDepotsAndRoutes, {
    fallbackData: {
      depots: MTA_DEPOTS,
      routes: ROUTE_CATALOG.map((r) => r.route),
      timestamp: new Date().toISOString(),
    },
    revalidateOnFocus: false,
  });

  const rawDepots = depotsData?.depots ?? MTA_DEPOTS;
  const rawRoutes = depotsData?.routes ?? ROUTE_CATALOG.map((r) => r.route);

  // Dynamically overlay admin depot assignments from Firestore
  const routes = useMemo(() => {
    return rawRoutes.map((r) => {
      const overrideDepot = depotOverrides[r.id];
      if (overrideDepot && overrideDepot !== r.depotId) {
        return { ...r, depotId: overrideDepot };
      }
      return r;
    });
  }, [rawRoutes, depotOverrides]);

  const depots = useMemo(() => {
    return rawDepots.map((d) => {
      const assigned = routes.filter((r) => r.depotId === d.id).map((r) => r.id);
      return {
        ...d,
        assignedRouteIds: assigned.length > 0 ? assigned : d.assignedRouteIds,
      };
    });
  }, [rawDepots, routes]);

  const selectedDepot = useMemo(
    () => depots.find((d) => d.id === selectedDepotId) || null,
    [depots, selectedDepotId]
  );

  const fallbackSiriPayload = useMemo(
    () =>
      generateSiriVehicleMonitoringPayload({
        depotId: selectedDepotId,
        lineRef: selectedRouteId,
      }),
    [selectedDepotId, selectedRouteId]
  );

  const {
    data: siriPayload,
    isValidating: isPollingSiri,
    mutate: refreshSiriNow,
  } = useSWR(
    ['siri-vehicle-monitoring', selectedDepotId, selectedRouteId],
    () =>
      fetchSiriVehicleMonitoring({
        depotId: selectedDepotId,
        lineRef: selectedRouteId,
        detailLevel: 'calls',
      }),
    {
      fallbackData: fallbackSiriPayload,
      refreshInterval: pollIntervalSec * 1000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const activities =
    siriPayload?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery?.[0]?.VehicleActivity ??
    fallbackSiriPayload.Siri.ServiceDelivery.VehicleMonitoringDelivery[0].VehicleActivity;

  const fallbackJourneyTrace = useMemo(
    () => (selectedVehicleRef ? generateMonitoredVehicleJourneyTrace(selectedVehicleRef) : null),
    [selectedVehicleRef]
  );

  const { data: journeyTrace, isLoading: isLoadingTrace } = useSWR(
    selectedVehicleRef ? ['siri-monitored-journey', selectedVehicleRef] : null,
    () => fetchSiriMonitoredVehicleJourney(selectedVehicleRef!),
    {
      fallbackData: fallbackJourneyTrace ?? undefined,
      refreshInterval: pollIntervalSec * 1000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const effectiveScheduleRouteId = useMemo(() => {
    if (selectedRouteId !== 'ALL') return selectedRouteId;
    if (selectedDepot && selectedDepot.assignedRouteIds.length > 0) {
      return selectedDepot.assignedRouteIds[0];
    }
    return 'MTA NYCT_Q44+';
  }, [selectedRouteId, selectedDepot]);

  const { data: obaStopsRes } = useSWR(
    ['oba-stops-for-route', effectiveScheduleRouteId],
    () => fetchObaStopsForRoute(effectiveScheduleRouteId),
    { revalidateOnFocus: false }
  );

  const { data: obaScheduleRes } = useSWR(
    ['oba-schedule-for-route', effectiveScheduleRouteId],
    () => fetchObaScheduleForRoute(effectiveScheduleRouteId),
    { revalidateOnFocus: false }
  );

  const routeStops = useMemo(() => {
    if (obaStopsRes?.data?.references?.stops?.length) {
      return obaStopsRes.data.references.stops;
    }
    return (
      ROUTE_CATALOG.find((r) => r.route.id === effectiveScheduleRouteId)?.stops ??
      ROUTE_CATALOG[0].stops
    );
  }, [obaStopsRes, effectiveScheduleRouteId]);

  const routeSchedule = useMemo(() => {
    if (obaScheduleRes?.data?.entry) {
      return obaScheduleRes.data.entry;
    }
    return generateObaScheduleForRoute(effectiveScheduleRouteId);
  }, [obaScheduleRes, effectiveScheduleRouteId]);

  const handleSelectDepot = (depotId: string) => {
    setSelectedDepotId(depotId);
    setSelectedRouteId('ALL');
    setSelectedVehicleRef(null);
  };

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    if (routeId !== 'ALL') {
      const routeObj = routes.find((r) => r.id === routeId || r.shortName === routeId);
      if (routeObj && selectedDepotId !== 'ALL' && routeObj.depotId !== selectedDepotId) {
        setSelectedDepotId(routeObj.depotId);
      }
    }
  };

  const handleSelectVehicle = (vehicleRef: string | null) => {
    setSelectedVehicleRef(vehicleRef);
  };

  const clientGoogleMapsKey =
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
    envConfig?.googleMapsApiKey ||
    '';

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0B0F17] text-slate-100 overflow-hidden">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Bar Contract: 1 row, 3 zones separated by gap-8 */}
      {/* Top Bar Contract: 1 row, 3 zones separated by gap-8 */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 border-b border-slate-800/90 bg-[#0B0F17] z-40">
        <div className="flex items-center gap-4">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('LIVE_MAP');
              setCameraResetTrigger((c) => c + 1);
            }}
            className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 font-display flex items-center gap-2"
          >
            <span>MetroGlass NYC</span>
          </a>

          {/* Primary View Switcher: Live Map vs Admin Dashboard */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveView('LIVE_MAP')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeView === 'LIVE_MAP'
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Live Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('ADMIN_DASHBOARD')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeView === 'ADMIN_DASHBOARD'
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Administration</span>
            </button>
          </div>
        </div>

        {activeView === 'LIVE_MAP' ? (
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              type="button"
              onClick={() => setLeftTab('DEPOT_COMMAND')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline ${
                leftTab === 'DEPOT_COMMAND' ? 'text-sky-400 underline' : ''
              }`}
            >
              Depot Command
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('ROUTE_MONITOR')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline ${
                leftTab === 'ROUTE_MONITOR' ? 'text-sky-400 underline' : ''
              }`}
            >
              Fleet Monitor
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('SCHEDULE_MATRIX')}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline ${
                leftTab === 'SCHEDULE_MATRIX' ? 'text-sky-400 underline' : ''
              }`}
            >
              Schedules
            </button>
            <button
              type="button"
              onClick={() => setIsBlueprintOpen(true)}
              className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
            >
              SIRI Blueprint
            </button>
          </nav>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Operations Control Center</span>
            <span>·</span>
            <span>Depot Fleet Allocation &amp; Moderation</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCommuterAlertsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Route Alerts</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden xl:inline font-mono">
                {currentUser.email?.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={signOut}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={signIn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsBlueprintOpen(true)}
            className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            SDK
          </button>
        </div>
      </header>

      {/* Main Workspace: Admin Dashboard View vs Live Map Operations */}
      {activeView === 'ADMIN_DASHBOARD' ? (
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <AdminDashboardView
            depots={depots}
            routes={routes}
            onBackToMap={() => setActiveView('LIVE_MAP')}
            onRefreshData={() => mutateDepots()}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
          {/* Left Sidebar: Queens & Brooklyn Depots, Corridors, and Rosters */}
          <DepotCommandPanel
            depots={depots}
            routes={routes}
            activities={activities}
            selectedDepotId={selectedDepotId}
            selectedRouteId={selectedRouteId}
            selectedVehicleRef={selectedVehicleRef}
            activeTab={leftTab}
            routeStops={routeStops}
            routeSchedule={routeSchedule}
            onSelectDepot={handleSelectDepot}
            onSelectRoute={handleSelectRoute}
            onSelectVehicle={handleSelectVehicle}
            onChangeTab={setLeftTab}
          />

          {/* Center: 3D Cityscape Viewport */}
          <main className="flex-1 relative h-full min-w-0 overflow-hidden">
            {/* Top-Docked Transit Alert Bulletins */}
            <TransitAlertBannerOverlay
              alerts={transitAlerts}
              selectedDepotId={selectedDepotId}
              selectedRouteId={selectedRouteId}
            />

            {renderEngine === 'GOOGLE_MAPS_WEBGL' && clientGoogleMapsKey ? (
              <GoogleMapsWebGLCanvas
                apiKey={clientGoogleMapsKey}
                mapId="DEMO_MAP_ID"
                activities={activities}
                selectedDepot={selectedDepot}
                selectedRouteId={selectedRouteId}
                selectedVehicleRef={selectedVehicleRef}
                journeyTrace={journeyTrace || null}
                routeStops={routeStops}
                buildingOpacity={buildingOpacity}
                showBuildings={showBuildings}
                showRouteShapes={showRouteShapes}
                showStops={showStops}
                hoveredRouteId={hoveredRouteId}
                sponsoredCampaigns={adwordsCampaigns}
                onSelectVehicle={handleSelectVehicle}
                onSelectDepot={handleSelectDepot}
                onSelectRoute={handleSelectRoute}
                onHoverRoute={setHoveredRouteId}
              />
            ) : (
              <NYC3DCityscapeCanvas
                activities={activities}
                selectedDepot={selectedDepot}
                selectedRouteId={selectedRouteId}
                selectedVehicleRef={selectedVehicleRef}
                journeyTrace={journeyTrace || null}
                routeStops={routeStops}
                buildingOpacity={buildingOpacity}
                showBuildings={showBuildings}
                showRouteShapes={showRouteShapes}
                showStops={showStops}
                cameraPreset={cameraPreset}
                hoveredRouteId={hoveredRouteId}
                sponsoredCampaigns={adwordsCampaigns}
                onSelectVehicle={handleSelectVehicle}
                onSelectRoute={handleSelectRoute}
                onSelectDepot={handleSelectDepot}
                onHoverRoute={setHoveredRouteId}
                cameraResetTrigger={cameraResetTrigger}
              />
            )}

          {/* Top-Left Floating 3D Building Transparency & Layer Controls HUD */}
          <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 pointer-events-auto">
            <div className="px-3.5 py-2.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800/90 shadow-lg flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <label
                  htmlFor="building-opacity-slider"
                  className="text-xs font-medium text-slate-200 whitespace-nowrap"
                >
                  3D Glass Transparency:
                </label>
                <input
                  id="building-opacity-slider"
                  type="range"
                  min={15}
                  max={85}
                  step={5}
                  value={Math.round(buildingOpacity * 100)}
                  onChange={(e) => setBuildingOpacity(Number(e.target.value) / 100)}
                  className="w-24 accent-sky-400 cursor-pointer"
                />
                <span className="font-mono text-xs font-semibold text-sky-400 tabular-nums w-9">
                  {Math.round(buildingOpacity * 100)}%
                </span>
              </div>

              <span aria-hidden="true" className="text-slate-700 hidden sm:inline">
                |
              </span>

              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400 mr-0.5 shrink-0" />
                <button
                  type="button"
                  onClick={() => setShowBuildings((v) => !v)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    showBuildings
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/60'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  3D Buildings
                </button>
                <button
                  type="button"
                  onClick={() => setShowRouteShapes((v) => !v)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    showRouteShapes
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/60'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Route Shapes
                </button>
                <button
                  type="button"
                  onClick={() => setShowStops((v) => !v)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    showStops
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/60'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Stops
                </button>
              </div>

              {selectedDepot && (
                <>
                  <span aria-hidden="true" className="text-slate-700 hidden sm:inline">
                    |
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-mono text-amber-300 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded font-semibold">
                      Depot: {selectedDepot.name} ({selectedDepot.code})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectDepot('ALL');
                        handleSelectRoute('ALL');
                      }}
                      className="text-[11px] text-sky-400 hover:text-sky-300 underline font-medium"
                    >
                      Clear Filter
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top-Right Floating SIRI Polling Controls */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
            <div className="px-3 py-2 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800/90 shadow-lg flex items-center gap-3 text-xs">
              <div className="text-slate-300 font-mono tabular-nums">
                SIRI Poll:{' '}
                <button
                  type="button"
                  onClick={() => setPollIntervalSec((p) => (p === 10 ? 15 : 10))}
                  className="text-sky-400 hover:underline font-semibold"
                  title="Toggle SIRI Polling Interval"
                >
                  {pollIntervalSec}s
                </button>
              </div>

              <span aria-hidden="true" className="text-slate-700">
                ·
              </span>

              <button
                type="button"
                onClick={() => refreshSiriNow()}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:border-sky-500/60 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`w-3 h-3 text-sky-400 ${isPollingSiri ? 'animate-spin' : ''}`}
                />
                <span>Sync Feed</span>
              </button>

              {clientGoogleMapsKey && (
                <>
                  <span aria-hidden="true" className="text-slate-700">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setRenderEngine((e) =>
                        e === 'NYC_3D_CACHE' ? 'GOOGLE_MAPS_WEBGL' : 'NYC_3D_CACHE'
                      )
                    }
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-sky-300 hover:border-sky-400 whitespace-nowrap shrink-0"
                  >
                    {renderEngine === 'NYC_3D_CACHE'
                      ? 'Switch to Google Maps Tiles'
                      : 'Switch to 3D NYC Cache'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bottom-Center Floating Camera Presets */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <div className="px-3 py-2 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800/90 shadow-xl flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0 mr-1" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCameraPreset('STREET_3D')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    cameraPreset === 'STREET_3D'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Street 3D (54°)
                </button>
                <button
                  type="button"
                  onClick={() => setCameraPreset('ISOMETRIC_3D')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    cameraPreset === 'ISOMETRIC_3D'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Skyline 3D (38°)
                </button>
                <button
                  type="button"
                  onClick={() => setCameraPreset('TACTICAL_TOP')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    cameraPreset === 'TACTICAL_TOP'
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Top-Down Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCameraPreset('STREET_3D');
                    setCameraResetTrigger((c) => c + 1);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Re-center</span>
                </button>
              </div>
            </div>
          </div>

          {/* Floating Route Color Legend Panel (maps colors to lines & distinguishes overlapping routes) */}
          <RouteColorLegendPanel
            routes={routes}
            activities={activities}
            selectedDepot={selectedDepot}
            selectedRouteId={selectedRouteId}
            selectedVehicleRef={selectedVehicleRef}
            hoveredRouteId={hoveredRouteId}
            onSelectRoute={handleSelectRoute}
            onSelectVehicle={handleSelectVehicle}
            onHoverRoute={setHoveredRouteId}
            className="absolute bottom-4 left-4 z-30"
          />

          {/* D3 Real-Time Speed vs Historical Daily Average Analytics Panel in Bottom-Right Corner */}
          <RouteSpeedAnalyticsPanel
            routes={routes}
            activities={activities}
            selectedRouteId={selectedRouteId}
            onSelectRoute={handleSelectRoute}
            selectedDepotId={selectedDepotId}
            onSelectDepot={handleSelectDepot}
            className="absolute bottom-4 right-4 z-30"
          />
        </main>

        {/* Right Sidebar: Individual Bus Journey Tracking */}
        {(selectedVehicleRef || journeyTrace) && (
          <BusJourneyInspector
            trace={journeyTrace || null}
            isLoading={isLoadingTrace}
            cameraPreset={cameraPreset}
            onSetCameraPreset={setCameraPreset}
            onClose={() => {
              setSelectedVehicleRef(null);
              if (cameraPreset === 'FOLLOW_BUS') {
                setCameraPreset('STREET_3D');
              }
            }}
          />
        )}
      </div>
      )}

      <CommuterAlertsModal
        isOpen={isCommuterAlertsOpen}
        onClose={() => setIsCommuterAlertsOpen(false)}
        availableRoutes={routes}
      />

      <SiriBlueprintModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
        siriPayload={siriPayload || null}
        journeyTrace={journeyTrace || null}
        envConfig={envConfig || null}
      />
    </div>
  );
}
