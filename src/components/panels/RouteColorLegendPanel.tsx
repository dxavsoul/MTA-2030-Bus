import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Palette,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  Navigation,
  Eye,
  Check,
  Layers,
  Bell,
  BellRing,
  Plus,
  Trash2,
  Volume2,
  AlertCircle,
  Clock,
  Bus,
  CheckCircle2,
  X,
  Play,
} from 'lucide-react';
import { BoroughName, MtaDepot, ObaRoute, SiriVehicleActivity, ObaStop } from '../../types/transit';
import { ROUTE_CATALOG } from '../../data/nycMtaCache';
import {
  BusArrivalAlert,
  calculateBusEtaToStop,
  loadStoredAlerts,
  playTransitAlertChime,
  requestNotificationPermission,
  saveStoredAlerts,
  sendBrowserNotification,
} from '../../services/busAlertService';

interface RouteColorLegendPanelProps {
  routes: ObaRoute[];
  activities: SiriVehicleActivity[];
  selectedDepot: MtaDepot | null;
  selectedRouteId: string;
  selectedVehicleRef?: string | null;
  hoveredRouteId?: string | null;
  onSelectRoute: (routeId: string) => void;
  onSelectVehicle?: (vehicleRef: string | null) => void;
  onHoverRoute?: (routeId: string | null) => void;
  className?: string;
}

export const RouteColorLegendPanel: React.FC<RouteColorLegendPanelProps> = ({
  routes,
  activities,
  selectedDepot,
  selectedRouteId,
  selectedVehicleRef,
  hoveredRouteId,
  onSelectRoute,
  onSelectVehicle,
  onHoverRoute,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [panelTab, setPanelTab] = useState<'COLORS' | 'ALERTS'>('COLORS');
  const [searchQuery, setSearchQuery] = useState('');
  const [boroughFilter, setBoroughFilter] = useState<'ALL' | BoroughName>('ALL');

  // Bus Arrival Alerts state
  const [alerts, setAlerts] = useState<BusArrivalAlert[]>(() => loadStoredAlerts());
  const [isSetAlertModalOpen, setIsSetAlertModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<{
    alert: BusArrivalAlert;
    etaMinutes: number | null;
  } | null>(null);

  // Set Alert form fields
  const [alertRouteId, setAlertRouteId] = useState<string>('MTA NYCT_Q44+');
  const [alertVehicleRef, setAlertVehicleRef] = useState<string>('');
  const [alertStopId, setAlertStopId] = useState<string>('');
  const [notificationPermissionState, setNotificationPermissionState] = useState<
    NotificationPermission | 'unsupported'
  >(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  // Sync alerts to localStorage whenever changed
  useEffect(() => {
    saveStoredAlerts(alerts);
  }, [alerts]);

  // Compute live bus count per line from real-time SIRI activities
  const activeBusesByRoute = useMemo(() => {
    const map = new Map<string, number>();
    for (const act of activities) {
      const lineRef = act.MonitoredVehicleJourney.LineRef;
      const pubLine = act.MonitoredVehicleJourney.PublishedLineName;
      map.set(lineRef, (map.get(lineRef) || 0) + 1);
      if (pubLine) {
        map.set(pubLine, (map.get(pubLine) || 0) + 1);
      }
    }
    return map;
  }, [activities]);

  // Combine route metadata from ROUTE_CATALOG with ObaRoute
  const catalogRoutes = useMemo(() => {
    return ROUTE_CATALOG.map((def) => def.route);
  }, []);

  // Filter routes according to selected depot, borough, and search query
  const displayedRoutes = useMemo(() => {
    let list = catalogRoutes;

    if (selectedDepot && selectedDepot.id !== 'ALL') {
      const depotRouteList = list.filter((r) => r.depotId === selectedDepot.id);
      if (depotRouteList.length > 0) {
        list = depotRouteList;
      }
    }

    if (boroughFilter !== 'ALL') {
      list = list.filter((r) => r.borough === boroughFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.shortName.toLowerCase().includes(q) ||
          r.longName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.borough.toLowerCase().includes(q) ||
          (r.serviceTier && r.serviceTier.toLowerCase().includes(q))
      );
    }

    return list;
  }, [catalogRoutes, selectedDepot, boroughFilter, searchQuery]);

  // Helper to get stops for a route
  const getStopsForRoute = (routeId: string): ObaStop[] => {
    const routeDef = ROUTE_CATALOG.find(
      (r) => r.route.id === routeId || r.route.shortName === routeId
    );
    return routeDef?.stops || [];
  };

  // Helper to get active & scheduled buses for a route
  const getBusesForRoute = (routeId: string) => {
    const activeForRoute = activities.filter(
      (a) =>
        a.MonitoredVehicleJourney.LineRef === routeId ||
        a.MonitoredVehicleJourney.PublishedLineName === routeId
    );

    if (activeForRoute.length > 0) {
      return activeForRoute.map((act) => {
        const mvj = act.MonitoredVehicleJourney;
        const vehicleNum = mvj.VehicleRef.replace(/^MTA\s+(?:NYCT|BC)_/i, '');
        return {
          vehicleRef: mvj.VehicleRef,
          vehicleNumber: vehicleNum,
          destinationName: mvj.DestinationName || 'In Service',
          nextStop: mvj.MonitoredCall?.StopPointName || 'Next Stop',
          direction: mvj.DirectionRef,
          coachType: mvj.Extensions?.OperationalMeta?.CoachType || 'Standard Bus',
          speedMph: mvj.Extensions?.OperationalMeta?.SpeedMph || 14,
          isLive: true,
          activity: act,
        };
      });
    }

    // Fallback: fleet seeds from catalog so user can always configure an alert
    const routeDef = ROUTE_CATALOG.find(
      (r) => r.route.id === routeId || r.route.shortName === routeId
    );
    if (routeDef && routeDef.fleetSeeds.length > 0) {
      return routeDef.fleetSeeds.map((seed) => {
        const destination =
          seed.direction === '0'
            ? routeDef.stops[0]?.name || 'Northbound'
            : routeDef.stops[routeDef.stops.length - 1]?.name || 'Southbound';
        return {
          vehicleRef: `MTA NYCT_${seed.vehicleNumber}`,
          vehicleNumber: seed.vehicleNumber,
          destinationName: destination,
          nextStop: routeDef.stops[0]?.name || 'Depot',
          direction: seed.direction,
          coachType: seed.coachType,
          speedMph: seed.baseSpeedMph,
          isLive: false,
          activity: undefined,
        };
      });
    }

    return [];
  };

  // When opening Set Alert modal, prefill route and options
  const handleOpenSetAlertModal = (presetRouteId?: string) => {
    const targetRouteId =
      presetRouteId ||
      (selectedRouteId !== 'ALL'
        ? selectedRouteId
        : displayedRoutes[0]?.id || 'MTA NYCT_Q44+');

    setAlertRouteId(targetRouteId);

    const buses = getBusesForRoute(targetRouteId);
    const chosenBus =
      (selectedVehicleRef && buses.find((b) => b.vehicleRef === selectedVehicleRef)) ||
      buses[0];
    setAlertVehicleRef(chosenBus ? chosenBus.vehicleRef : '');

    const stops = getStopsForRoute(targetRouteId);
    setAlertStopId(stops[0]?.id || '');

    setTestNotificationFeedback(null);
    setIsSetAlertModalOpen(true);
  };

  // Update bus and stop when route changes in modal
  const handleModalRouteChange = (newRouteId: string) => {
    setAlertRouteId(newRouteId);
    const buses = getBusesForRoute(newRouteId);
    setAlertVehicleRef(buses[0]?.vehicleRef || '');
    const stops = getStopsForRoute(newRouteId);
    setAlertStopId(stops[0]?.id || '');
  };

  // Request browser notification permission
  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermissionState(perm);
    if (perm === 'granted') {
      sendBrowserNotification('MetroGlass NYC Bus Alerts Enabled', {
        body: 'You will receive notifications when buses are within 5 minutes of your stop.',
      });
      playTransitAlertChime();
    }
  };

  // Immediate notification test
  const handleTestBrowserNotification = async () => {
    let perm = notificationPermissionState;
    if (perm !== 'granted') {
      perm = await requestNotificationPermission();
      setNotificationPermissionState(perm);
    }

    const testRoute = catalogRoutes.find((r) => r.id === alertRouteId) || catalogRoutes[0];
    const busList = getBusesForRoute(alertRouteId);
    const selectedBus = busList.find((b) => b.vehicleRef === alertVehicleRef) || busList[0];
    const stops = getStopsForRoute(alertRouteId);
    const targetStop = stops.find((s) => s.id === alertStopId) || stops[0];

    const busNumber = selectedBus?.vehicleNumber || '6104';
    const stopName = targetStop?.name || 'Selected Stop';

    playTransitAlertChime();

    const fired = sendBrowserNotification(
      `MetroGlass Alert: Bus #${busNumber} Approaching!`,
      {
        body: `${testRoute.shortName} Bus #${busNumber} is within 5 minutes of ${stopName} (ETA: ~3 min).`,
        tag: `test-bus-alert-${Date.now()}`,
      }
    );

    setActiveToast({
      alert: {
        id: 'test-preview',
        routeId: testRoute.id,
        routeShortName: testRoute.shortName,
        routeColor: testRoute.color,
        vehicleRef: selectedBus?.vehicleRef || `MTA NYCT_${busNumber}`,
        vehicleNumber: busNumber,
        stopId: targetStop?.id || 'TEST_STOP',
        stopName,
        thresholdMinutes: 5,
        createdAt: new Date().toISOString(),
        isActive: true,
        hasTriggered: true,
        lastEtaMinutes: 3.2,
      },
      etaMinutes: 3.2,
    });

    if (fired) {
      setTestNotificationFeedback('Browser notification dispatched successfully!');
    } else {
      setTestNotificationFeedback(
        'Note: Browser notification blocked or sandboxed. In-app banner & transit chime triggered.'
      );
    }
    setTimeout(() => setTestNotificationFeedback(null), 4500);
  };

  // Save new alert
  const handleSaveAlert = async () => {
    if (!alertRouteId || !alertVehicleRef || !alertStopId) return;

    if (notificationPermissionState === 'default') {
      const perm = await requestNotificationPermission();
      setNotificationPermissionState(perm);
    }

    const routeObj = catalogRoutes.find((r) => r.id === alertRouteId);
    const busList = getBusesForRoute(alertRouteId);
    const busObj = busList.find((b) => b.vehicleRef === alertVehicleRef);
    const stopsList = getStopsForRoute(alertRouteId);
    const stopObj = stopsList.find((s) => s.id === alertStopId);

    const newAlert: BusArrivalAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      routeId: alertRouteId,
      routeShortName: routeObj?.shortName || alertRouteId,
      routeColor: routeObj?.color || '06B6D4',
      vehicleRef: alertVehicleRef,
      vehicleNumber:
        busObj?.vehicleNumber || alertVehicleRef.replace(/^MTA\s+(?:NYCT|BC)_/i, ''),
      destinationName: busObj?.destinationName,
      stopId: alertStopId,
      stopName: stopObj?.name || 'Chosen Stop',
      thresholdMinutes: 5,
      createdAt: new Date().toISOString(),
      isActive: true,
      hasTriggered: false,
      lastEtaMinutes: null,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setIsSetAlertModalOpen(false);
    setPanelTab('ALERTS'); // Switch to alerts tab so user sees their new alert immediately
  };

  // Delete alert
  const handleDeleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Toggle active alert
  const handleToggleAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isActive: !a.isActive } : a))
    );
  };

  // Simulate / Test trigger for an existing alert
  const handleSimulateAlertTrigger = (alert: BusArrivalAlert) => {
    playTransitAlertChime();
    sendBrowserNotification(
      `MetroGlass Alert: Bus #${alert.vehicleNumber} is within 5 minutes!`,
      {
        body: `${alert.routeShortName} Bus #${alert.vehicleNumber} is now within 5 minutes of ${alert.stopName} (ETA: ~3.5 min).`,
        tag: `alert-${alert.id}`,
      }
    );
    setActiveToast({
      alert,
      etaMinutes: 3.5,
    });
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id
          ? {
              ...a,
              hasTriggered: true,
              triggeredAt: new Date().toISOString(),
              lastEtaMinutes: 3.5,
            }
          : a
      )
    );
  };

  // LIVE MONITORING LOOP: Checks alerts against real-time bus activities every 4 seconds
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;
  const activitiesRef = useRef(activities);
  activitiesRef.current = activities;

  useEffect(() => {
    const checkAlerts = () => {
      const currentAlerts = alertsRef.current;
      const currentActs = activitiesRef.current;
      if (!currentAlerts.length || !currentActs.length) return;

      let changed = false;
      const updatedAlerts = currentAlerts.map((alert) => {
        if (!alert.isActive) return alert;

        // Find bus activity for this alert's vehicleRef or line
        const busActivity = currentActs.find(
          (a) => a.MonitoredVehicleJourney.VehicleRef === alert.vehicleRef
        );

        if (!busActivity) {
          return alert;
        }

        const etaRes = calculateBusEtaToStop(busActivity, alert.stopId, alert.stopName);
        const etaMinutes = etaRes.etaMinutes;

        // Check if ETA has changed
        const hasEtaChanged = alert.lastEtaMinutes !== etaMinutes;
        let newAlert = {
          ...alert,
          lastEtaMinutes: etaMinutes,
          lastCheckedAt: new Date().toISOString(),
        };

        if (hasEtaChanged) {
          changed = true;
        }

        // Trigger condition: within 5 minutes and hasn't triggered yet
        if (
          !alert.hasTriggered &&
          etaMinutes !== null &&
          etaMinutes <= alert.thresholdMinutes &&
          etaMinutes >= -1
        ) {
          changed = true;
          newAlert = {
            ...newAlert,
            hasTriggered: true,
            triggeredAt: new Date().toISOString(),
          };

          // 1. Play transit chime
          playTransitAlertChime();

          // 2. Dispatch native browser notification
          const etaText =
            etaMinutes <= 0.5
              ? 'Arriving right now'
              : `ETA: ~${Math.max(1, Math.round(etaMinutes))} min`;
          sendBrowserNotification(
            `MetroGlass Alert: Bus #${alert.vehicleNumber} Approaching!`,
            {
              body: `${alert.routeShortName} Bus #${alert.vehicleNumber} is within 5 minutes of ${alert.stopName}! (${etaText})`,
              tag: `bus-alert-${alert.id}`,
            }
          );

          // 3. Show in-app banner toast
          setActiveToast({
            alert: newAlert,
            etaMinutes,
          });
        }

        return newAlert;
      });

      if (changed) {
        setAlerts(updatedAlerts);
      }
    };

    // Run check immediately and on timer
    checkAlerts();
    const timer = setInterval(checkAlerts, 4000);
    return () => clearInterval(timer);
  }, [activities]);

  // Unique colors preview for collapsed state
  const previewColors = useMemo(() => {
    const seen = new Set<string>();
    const colors: string[] = [];
    for (const r of displayedRoutes) {
      if (!seen.has(r.color)) {
        seen.add(r.color);
        colors.push(r.color);
      }
      if (colors.length >= 8) break;
    }
    return colors;
  }, [displayedRoutes]);

  const isAllRoutesMode = selectedRouteId === 'ALL';
  const activeAlertsCount = alerts.filter((a) => a.isActive).length;

  // Selected route object for prefill or info
  const currentSelectedRouteObj = useMemo(() => {
    return catalogRoutes.find((r) => r.id === selectedRouteId || r.shortName === selectedRouteId);
  }, [catalogRoutes, selectedRouteId]);

  if (!isExpanded) {
    return (
      <div
        className={`pointer-events-auto transition-all duration-200 ${className}`}
        role="region"
        aria-label="Collapsed route color legend"
      >
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 backdrop-blur-md border border-slate-800 hover:border-slate-700 shadow-xl text-xs text-slate-200 hover:text-white transition-all group"
          title="Expand Route Color Legend & Alerts"
        >
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold tracking-tight">Routes</span>
          </div>

          <div className="flex items-center -space-x-1">
            {previewColors.map((color, i) => (
              <span
                key={`${color}-${i}`}
                className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-950"
                style={{ backgroundColor: `#${color}` }}
              />
            ))}
          </div>

          {activeAlertsCount > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
              <Bell className="w-2.5 h-2.5" />
              <span>{activeAlertsCount}</span>
            </div>
          )}

          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* IN-APP ARRIVAL ALERT NOTIFICATION TOAST */}
      {activeToast && (
        <div
          className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-950/95 backdrop-blur-md border border-amber-500/60 shadow-2xl rounded-xl p-4 text-slate-100 flex flex-col gap-2.5 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-300">Bus Arrival Alert</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono font-semibold">
                    ≤ 5 MIN
                  </span>
                </div>
                <div className="text-xs text-slate-200 truncate">
                  <span className="font-bold text-white">
                    Bus #{activeToast.alert.vehicleNumber}
                  </span>{' '}
                  ({activeToast.alert.routeShortName})
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-1 text-xs">
            <div className="text-[11px] text-slate-400">Chosen Stop:</div>
            <div className="font-semibold text-slate-100 leading-snug">
              {activeToast.alert.stopName}
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Estimated Arrival:</span>
              <span className="font-mono font-bold text-amber-400">
                {activeToast.etaMinutes !== null && activeToast.etaMinutes <= 0.5
                  ? 'Arriving Now'
                  : activeToast.etaMinutes !== null
                  ? `~${activeToast.etaMinutes} mins away`
                  : 'Within 5 mins'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                onSelectRoute(activeToast.alert.routeId);
                if (onSelectVehicle && activeToast.alert.vehicleRef) {
                  onSelectVehicle(activeToast.alert.vehicleRef);
                }
                setActiveToast(null);
              }}
              className="flex-1 py-1.5 px-3 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Track Bus on 3D Map</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="py-1.5 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* MAIN ROUTE COLOR LEGEND & ALERTS PANEL */}
      <div
        className={`pointer-events-auto w-84 sm:w-88 max-w-[calc(100vw-2rem)] rounded-xl bg-slate-950/92 backdrop-blur-md border border-slate-800/90 shadow-2xl flex flex-col text-slate-200 transition-all duration-200 ${className}`}
        role="region"
        aria-label="Route color legend and alerts"
      >
        {/* Panel Header */}
        <div className="px-3.5 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Palette className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-100 tracking-tight whitespace-nowrap">
                  Route Colors & Alerts
                </h3>
                <span className="text-[10px] font-mono font-medium text-slate-400 tabular-nums">
                  ({displayedRoutes.length})
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {selectedDepot && selectedDepot.id !== 'ALL'
                  ? `${selectedDepot.name}`
                  : 'All NYC Corridors & Overlaps'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Set Alert Action Button */}
            <button
              type="button"
              onClick={() => handleOpenSetAlertModal()}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-300 hover:text-amber-100 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 rounded-md transition-all shadow-sm group"
              title="Set a 5-minute arrival alert for a bus and stop"
            >
              <Bell className="w-2.5 h-2.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Set Alert</span>
            </button>

            {!isAllRoutesMode && (
              <button
                type="button"
                onClick={() => onSelectRoute('ALL')}
                className="flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors"
                title="Show all overlapping routes"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Show All</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 rounded transition-colors"
              title="Minimize Legend"
              aria-label="Minimize Route Legend"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Panel View Tabs: Route Colors vs Arrival Alerts */}
        <div className="flex items-center border-b border-slate-800/70 px-2 pt-1 bg-slate-900/40 text-[11px]">
          <button
            type="button"
            onClick={() => setPanelTab('COLORS')}
            className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-colors ${
              panelTab === 'COLORS'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3 h-3" />
            <span>Route Lines</span>
          </button>

          <button
            type="button"
            onClick={() => setPanelTab('ALERTS')}
            className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-colors relative ${
              panelTab === 'ALERTS'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3 h-3" />
            <span>Bus Alerts</span>
            {activeAlertsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500 text-slate-950">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: ROUTE COLORS LIST */}
        {panelTab === 'COLORS' && (
          <>
            {/* Overlapping Corridor Informational Banner */}
            <div className="px-3 py-1.5 bg-slate-900/70 border-b border-slate-800/60 text-[10px] text-slate-300 flex items-start gap-1.5">
              <Layers className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
              <span className="leading-tight">
                {isAllRoutesMode ? (
                  <>
                    Multiple routes overlap. Hover to highlight or click to isolate. Click{' '}
                    <span className="text-amber-300 font-semibold">Set Alert</span> on any bus.
                  </>
                ) : (
                  <>
                    Focusing on isolated corridor.{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenSetAlertModal(selectedRouteId)}
                      className="text-amber-300 underline font-semibold hover:text-amber-200"
                    >
                      Set 5-min alert for this route
                    </button>
                  </>
                )}
              </span>
            </div>

            {/* Search & Borough Quick Filters */}
            <div className="p-2 border-b border-slate-800/60 space-y-1.5">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search line name (e.g. Q44, SBS, B41)..."
                  className="w-full pl-7 pr-2.5 py-1 text-[11px] bg-slate-900 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/70"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Borough Filter Tabs */}
              <div className="flex items-center gap-1 text-[10px]">
                {(['ALL', 'Queens', 'Brooklyn', 'Manhattan'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBoroughFilter(b)}
                    className={`flex-1 py-0.5 rounded font-medium transition-colors text-center ${
                      boroughFilter === b
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    {b === 'ALL' ? 'All' : b}
                  </button>
                ))}
              </div>
            </div>

            {/* Routes Scrollable List */}
            <div className="max-h-56 sm:max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-800/40">
              {displayedRoutes.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No matching routes found
                </div>
              ) : (
                displayedRoutes.map((route) => {
                  const isSelected =
                    selectedRouteId === route.id || selectedRouteId === route.shortName;
                  const isHovered =
                    hoveredRouteId === route.id || hoveredRouteId === route.shortName;
                  const liveBuses =
                    activeBusesByRoute.get(route.id) ||
                    activeBusesByRoute.get(route.shortName) ||
                    0;

                  return (
                    <div
                      key={route.id}
                      onMouseEnter={() => onHoverRoute?.(route.id)}
                      onMouseLeave={() => onHoverRoute?.(null)}
                      onClick={() => {
                        if (isSelected) {
                          onSelectRoute('ALL');
                        } else {
                          onSelectRoute(route.id);
                        }
                      }}
                      className={`pt-1 group cursor-pointer rounded-lg p-2 transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-sky-500/15 border border-sky-500/60 shadow-sm'
                          : isHovered
                          ? 'bg-slate-900 border border-slate-700/80'
                          : 'hover:bg-slate-900/70 border border-transparent'
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectRoute(isSelected ? 'ALL' : route.id);
                        }
                      }}
                      aria-pressed={isSelected}
                    >
                      {/* Left: Color Bar + Route Code + Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* High-visibility Color Line Indicator */}
                        <div className="relative flex items-center justify-center shrink-0">
                          <span
                            className="w-5 h-2 rounded-full shadow-sm ring-1 ring-black/40"
                            style={{ backgroundColor: `#${route.color}` }}
                            title={`#${route.color}`}
                          />
                          {isHovered && (
                            <span
                              className="absolute -inset-1 rounded-full opacity-60 animate-ping pointer-events-none"
                              style={{ backgroundColor: `#${route.color}` }}
                            />
                          )}
                        </div>

                        {/* Route Badge */}
                        <div
                          className="px-1.5 py-0.5 rounded text-[11px] font-bold font-mono tracking-tight shrink-0 shadow-sm border"
                          style={{
                            backgroundColor: `#${route.color}22`,
                            color: `#${route.color}`,
                            borderColor: `#${route.color}66`,
                          }}
                        >
                          {route.shortName}
                        </div>

                        {/* Route Destination / Corridor */}
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                            {route.longName}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span>{route.borough}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">
                              {route.serviceTier.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions & Live Bus Count */}
                      <div className="flex items-center gap-1.5 shrink-0 text-right">
                        {/* Set Alert Button on Each Route Row */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSetAlertModal(route.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-amber-500/20 border border-transparent hover:border-amber-500/40 transition-colors"
                          title={`Set 5-minute arrival alert for ${route.shortName}`}
                          aria-label={`Set alert for ${route.shortName}`}
                        >
                          <Bell className="w-3 h-3" />
                        </button>

                        {liveBuses > 0 ? (
                          <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{liveBuses}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">
                            idle
                          </span>
                        )}

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 2: ARRIVAL ALERTS LIST */}
        {panelTab === 'ALERTS' && (
          <div className="p-2 space-y-2 max-h-72 overflow-y-auto">
            {/* Header info bar */}
            <div className="flex items-center justify-between text-[11px] px-1 py-1 text-slate-300 bg-slate-900/60 rounded-md border border-slate-800">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>5-Minute Proximity Alerts</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenSetAlertModal()}
                className="flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-amber-200 underline"
              >
                <Plus className="w-3 h-3" />
                <span>Add Alert</span>
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="py-8 text-center space-y-2 px-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  No Active Bus Alerts
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Set an alert to receive a browser notification when a specific bus on your
                  chosen route is within 5 minutes of your stop.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenSetAlertModal()}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all"
                >
                  Set Your First Alert
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => {
                  const isTriggered = alert.hasTriggered;
                  const eta = alert.lastEtaMinutes;
                  const isWithin5Min = typeof eta === 'number' && eta <= 5 && eta >= -1;

                  return (
                    <div
                      key={alert.id}
                      className={`p-2.5 rounded-lg border transition-all text-xs flex flex-col gap-1.5 ${
                        isWithin5Min || isTriggered
                          ? 'bg-amber-950/20 border-amber-500/50 shadow-sm'
                          : alert.isActive
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-slate-950/60 border-slate-800/40 opacity-60'
                      }`}
                    >
                      {/* Top: Route badge, bus ID, status pill */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-tight shrink-0 border"
                            style={{
                              backgroundColor: `#${alert.routeColor}22`,
                              color: `#${alert.routeColor}`,
                              borderColor: `#${alert.routeColor}66`,
                            }}
                          >
                            {alert.routeShortName}
                          </span>
                          <span className="font-bold text-slate-100 truncate">
                            Bus #{alert.vehicleNumber}
                          </span>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0">
                          {isWithin5Min ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300 border border-amber-500/60 animate-pulse">
                              <BellRing className="w-2.5 h-2.5" />
                              ≤ 5 MIN (
                              {typeof eta === 'number' && eta <= 0.5 ? 'Now' : `~${eta}m`})
                            </span>
                          ) : isTriggered ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Triggered
                            </span>
                          ) : typeof eta === 'number' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono text-slate-300 bg-slate-800 border border-slate-700">
                              <Clock className="w-2.5 h-2.5 text-sky-400" />~{eta}m away
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Watching feed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Chosen stop */}
                      <div className="text-[11px] text-slate-300 flex items-start gap-1">
                        <span className="text-slate-400 shrink-0">Stop:</span>
                        <span className="font-medium text-slate-100 truncate">
                          {alert.stopName}
                        </span>
                      </div>

                      {/* Bottom actions: Test, Track, Toggle, Delete */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSimulateAlertTrigger(alert)}
                            className="flex items-center gap-1 text-amber-300 hover:text-amber-200 hover:underline font-medium"
                            title="Test alert notification right now"
                          >
                            <Play className="w-2.5 h-2.5" />
                            <span>Test Alert</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectRoute(alert.routeId);
                              if (onSelectVehicle && alert.vehicleRef) {
                                onSelectVehicle(alert.vehicleRef);
                              }
                            }}
                            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline font-medium"
                            title="Focus bus on 3D map"
                          >
                            <Navigation className="w-2.5 h-2.5" />
                            <span>Map</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAlert(alert.id)}
                            className={`text-[10px] font-medium ${
                              alert.isActive
                                ? 'text-slate-400 hover:text-slate-200'
                                : 'text-amber-400 hover:text-amber-300'
                            }`}
                          >
                            {alert.isActive ? 'Pause' : 'Resume'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            title="Remove alert"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer Status */}
        <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-800/80 rounded-b-xl flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-sky-400" />
            <span>
              {selectedRouteId === 'ALL'
                ? 'Showing all line paths'
                : `Focusing on ${selectedRouteId.replace('MTA NYCT_', '')}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenSetAlertModal(selectedRouteId)}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              + Set Alert
            </button>
            {selectedRouteId !== 'ALL' && (
              <button
                type="button"
                onClick={() => onSelectRoute('ALL')}
                className="text-sky-400 hover:text-sky-300 underline font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SET BUS ARRIVAL ALERT MODAL */}
      {isSetAlertModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="set-alert-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2
                    id="set-alert-modal-title"
                    className="text-sm font-bold text-white tracking-tight"
                  >
                    Set Bus Arrival Alert
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Receive a browser notification within 5 minutes of your stop
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSetAlertModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Step 1: Route Selection */}
              <div className="space-y-1.5">
                <label
                  htmlFor="alert-route-select"
                  className="font-semibold text-slate-200 flex items-center justify-between"
                >
                  <span>1. Select Transit Route:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {catalogRoutes.length} available lines
                  </span>
                </label>
                <select
                  id="alert-route-select"
                  value={alertRouteId}
                  onChange={(e) => handleModalRouteChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 text-xs font-medium focus:outline-none focus:border-amber-500"
                >
                  {catalogRoutes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.shortName} — {r.longName} ({r.borough})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Specific Bus Selection */}
              <div className="space-y-1.5">
                <label
                  htmlFor="alert-bus-select"
                  className="font-semibold text-slate-200 flex items-center justify-between"
                >
                  <span>2. Choose Specific Bus:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Live SIRI tracking
                  </span>
                </label>

                {getBusesForRoute(alertRouteId).length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-center">
                    No active buses found for this line.
                  </div>
                ) : (
                  <select
                    id="alert-bus-select"
                    value={alertVehicleRef}
                    onChange={(e) => setAlertVehicleRef(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 text-xs font-medium focus:outline-none focus:border-amber-500"
                  >
                    {getBusesForRoute(alertRouteId).map((bus) => (
                      <option key={bus.vehicleRef} value={bus.vehicleRef}>
                        Bus #{bus.vehicleNumber} • {bus.coachType} • Bound for{' '}
                        {bus.destinationName}
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected bus snapshot info */}
                {(() => {
                  const busList = getBusesForRoute(alertRouteId);
                  const selectedBus = busList.find((b) => b.vehicleRef === alertVehicleRef);
                  if (!selectedBus) return null;
                  return (
                    <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-sky-400" />
                        <span>Next Stop: {selectedBus.nextStop}</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-medium">
                        {selectedBus.speedMph} mph
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Step 3: Chosen Stop Selection */}
              <div className="space-y-1.5">
                <label
                  htmlFor="alert-stop-select"
                  className="font-semibold text-slate-200 flex items-center justify-between"
                >
                  <span>3. Choose Your Stop:</span>
                  <span className="text-[10px] text-slate-400">
                    {getStopsForRoute(alertRouteId).length} stops on line
                  </span>
                </label>
                <select
                  id="alert-stop-select"
                  value={alertStopId}
                  onChange={(e) => setAlertStopId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-slate-100 text-xs font-medium focus:outline-none focus:border-amber-500"
                >
                  {getStopsForRoute(alertRouteId).map((stop, idx) => (
                    <option key={stop.id} value={stop.id}>
                      {idx + 1}. {stop.name} (Stop #{stop.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: 5-Minute Trigger Threshold Callout */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <BellRing className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>5-Minute Proximity Trigger</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  As soon as your selected bus is estimated to be{' '}
                  <span className="text-amber-300 font-semibold">5 minutes or less</span> from
                  your chosen stop, MetroGlass will dispatch a native browser notification and
                  play an authentic transit chime.
                </p>
              </div>

              {/* Browser Notification Permissions & Test */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">
                    Browser Notification Permission:
                  </span>
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      notificationPermissionState === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : notificationPermissionState === 'denied'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {notificationPermissionState === 'granted'
                      ? '✓ Granted'
                      : notificationPermissionState === 'denied'
                      ? '✕ Denied'
                      : 'Not Requested'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {notificationPermissionState !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Allow Notifications
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleTestBrowserNotification}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                    title="Send a test notification to your browser right now"
                  >
                    <Volume2 className="w-3 h-3 text-amber-400" />
                    <span>Test Notification</span>
                  </button>
                </div>

                {testNotificationFeedback && (
                  <p className="text-[10px] text-emerald-400 font-medium animate-in fade-in">
                    {testNotificationFeedback}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-end gap-2.5 bg-slate-900/30">
              <button
                type="button"
                onClick={() => setIsSetAlertModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAlert}
                disabled={!alertRouteId || !alertVehicleRef || !alertStopId}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50 disabled:pointer-events-none"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Activate 5-Min Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
