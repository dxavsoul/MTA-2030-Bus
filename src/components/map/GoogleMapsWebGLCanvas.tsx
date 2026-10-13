import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  Layers,
  MapPin,
  Navigation,
  Eye,
  Bus,
  CheckCircle2,
  Maximize2,
  RotateCcw,
  Users,
} from 'lucide-react';
import {
  MtaDepot,
  ObaStop,
  SiriMonitoredJourneyTraceResponse,
  SiriVehicleActivity,
} from '../../types/transit';
import { AdWordsCampaign } from '../../types/admin';
import { parseVehicleOccupancy } from '../../services/siriPayloadParser';
import { NYC_3D_BUILDINGS, NYC_CENTER, ROUTE_CATALOG, MTA_DEPOTS } from '../../data/nycMtaCache';
import { createGoogleMapsTransparentBuildingOverlay } from '../../lib/webglBuildingOverlay';

interface GoogleMapsWebGLCanvasProps {
  apiKey: string;
  mapId: string;
  activities: SiriVehicleActivity[];
  selectedDepot: MtaDepot | null;
  selectedRouteId: string;
  selectedVehicleRef: string | null;
  journeyTrace: SiriMonitoredJourneyTraceResponse | null;
  routeStops?: ObaStop[];
  buildingOpacity: number;
  showBuildings: boolean;
  showRouteShapes: boolean;
  showStops?: boolean;
  hoveredRouteId?: string | null;
  sponsoredCampaigns?: AdWordsCampaign[];
  onSelectVehicle: (vehicleRef: string | null) => void;
  onSelectDepot?: (depotId: string) => void;
  onSelectRoute?: (routeId: string) => void;
  onHoverRoute?: (routeId: string | null) => void;
}

/**
 * Controller component that manages polyline drawing, route highlighting,
 * bounds auto-framing, and the optional 3D glass building overlay.
 */
const MapRouteAndOverlayController: React.FC<{
  buildingOpacity: number;
  showBuildings: boolean;
  selectedDepot: MtaDepot | null;
  selectedRouteId: string;
  selectedVehicleRef: string | null;
  activities: SiriVehicleActivity[];
  journeyTrace: SiriMonitoredJourneyTraceResponse | null;
  showRouteShapes: boolean;
  hoveredRouteId?: string | null;
  onSelectRoute?: (routeId: string) => void;
  onHoverRoute?: (routeId: string | null) => void;
}> = ({
  buildingOpacity,
  showBuildings,
  selectedDepot,
  selectedRouteId,
  selectedVehicleRef,
  activities,
  journeyTrace,
  showRouteShapes,
  hoveredRouteId,
  onSelectRoute,
  onHoverRoute,
}) => {
  const map = useMap();
  const overlayRef = useRef<ReturnType<typeof createGoogleMapsTransparentBuildingOverlay> | null>(
    null
  );
  const routePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const journeyPolylinesRef = useRef<google.maps.Polyline[]>([]);

  // 1. Optional 3D Building Overlay (isolated with pointer-events: none)
  useEffect(() => {
    if (!map) return;

    if (showBuildings && buildingOpacity > 0.05) {
      if (!overlayRef.current) {
        overlayRef.current = createGoogleMapsTransparentBuildingOverlay({
          map,
          anchor: NYC_CENTER,
          buildings: NYC_3D_BUILDINGS,
          initialOpacity: buildingOpacity,
        });
      } else {
        overlayRef.current.setBuildingOpacity(buildingOpacity);
      }
    } else if (overlayRef.current) {
      overlayRef.current.dispose();
      overlayRef.current = null;
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.dispose();
        overlayRef.current = null;
      }
    };
  }, [map, showBuildings, buildingOpacity]);

  // 2. High-contrast, multi-layer Bus Route Polylines
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    // Clean up previous polylines
    routePolylinesRef.current.forEach((p) => p.setMap(null));
    routePolylinesRef.current = [];

    if (!showRouteShapes) return;

    const selectedDef = ROUTE_CATALOG.find(
      (r) => r.route.id === selectedRouteId || r.route.shortName === selectedRouteId
    );

    // If a specific route is selected, fit camera to its path
    if (selectedDef && selectedDef.shapePoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      selectedDef.shapePoints.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }

    // Render all routes or filtered routes
    for (const def of ROUTE_CATALOG) {
      const isSelected =
        selectedRouteId === def.route.id || selectedRouteId === def.route.shortName;
      const isHovered =
        hoveredRouteId === def.route.id || hoveredRouteId === def.route.shortName;
      const isDepotRoute = !selectedDepot || def.route.depotId === selectedDepot.id;

      // When a specific route is hovered or selected, elevate its contrast over overlapping lines
      let strokeOpacity = 0.75;
      let strokeWeight = 4;
      let zIndex = 20;

      if (hoveredRouteId) {
        if (isHovered) {
          strokeOpacity = 1.0;
          strokeWeight = 7;
          zIndex = 80;
        } else {
          strokeOpacity = 0.2;
          strokeWeight = 2;
          zIndex = 5;
        }
      } else if (selectedRouteId !== 'ALL') {
        if (isSelected) {
          strokeOpacity = 1.0;
          strokeWeight = 6;
          zIndex = 50;
        } else {
          strokeOpacity = 0.25;
          strokeWeight = 2.5;
          zIndex = 10;
        }
      } else if (selectedDepot) {
        if (isDepotRoute) {
          strokeOpacity = 0.9;
          strokeWeight = 4.5;
          zIndex = 30;
        } else {
          strokeOpacity = 0.2;
          strokeWeight = 2;
          zIndex = 5;
        }
      }

      // Draw casing outline for high contrast against map tiles
      const casing = new google.maps.Polyline({
        path: def.shapePoints,
        geodesic: true,
        strokeColor: isHovered ? '#FFFFFF' : '#090D16',
        strokeOpacity: isHovered ? 0.9 : isSelected ? 0.95 : Math.max(0.2, strokeOpacity * 0.7),
        strokeWeight: strokeWeight + (isHovered ? 4 : isSelected ? 4 : 2),
        zIndex: zIndex - 1,
        map,
      });
      routePolylinesRef.current.push(casing);

      // Core colored route line
      const poly = new google.maps.Polyline({
        path: def.shapePoints,
        geodesic: true,
        strokeColor: `#${def.route.color}`,
        strokeOpacity,
        strokeWeight,
        zIndex,
        icons: isSelected
          ? [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 2.8,
                  fillColor: `#${def.route.color}`,
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 1,
                },
                offset: '30px',
                repeat: '100px',
              },
            ]
          : undefined,
        map,
      });

      // Hovering any polyline highlights that route
      poly.addListener('mouseover', () => {
        onHoverRoute?.(def.route.id);
      });
      poly.addListener('mouseout', () => {
        onHoverRoute?.(null);
      });

      // Clicking any polyline selects that route
      poly.addListener('click', () => {
        onSelectRoute?.(def.route.id);
      });

      routePolylinesRef.current.push(poly);
    }

    return () => {
      routePolylinesRef.current.forEach((p) => p.setMap(null));
      routePolylinesRef.current = [];
    };
  }, [map, selectedDepot, selectedRouteId, hoveredRouteId, showRouteShapes, onSelectRoute, onHoverRoute]);

  // 3. Historical & Projected Journey Polylines for selected vehicle
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    journeyPolylinesRef.current.forEach((p) => p.setMap(null));
    journeyPolylinesRef.current = [];

    if (journeyTrace) {
      if (journeyTrace.HistoricalPath && journeyTrace.HistoricalPath.length > 0) {
        const histPoly = new google.maps.Polyline({
          path: journeyTrace.HistoricalPath.map((p) => ({ lat: p.lat, lng: p.lng })),
          geodesic: true,
          strokeColor: '#10B981',
          strokeOpacity: 0.95,
          strokeWeight: 6,
          zIndex: 60,
          map,
        });
        journeyPolylinesRef.current.push(histPoly);
      }

      if (journeyTrace.ProjectedPath && journeyTrace.ProjectedPath.length > 0) {
        const projPoly = new google.maps.Polyline({
          path: journeyTrace.ProjectedPath.map((p) => ({ lat: p.lat, lng: p.lng })),
          geodesic: true,
          strokeColor: '#F59E0B',
          strokeOpacity: 0.9,
          strokeWeight: 5,
          zIndex: 59,
          map,
        });
        journeyPolylinesRef.current.push(projPoly);
      }
    }

    return () => {
      journeyPolylinesRef.current.forEach((p) => p.setMap(null));
      journeyPolylinesRef.current = [];
    };
  }, [map, journeyTrace]);

  // 4. Pan to selected vehicle if changed
  useEffect(() => {
    if (!map || !selectedVehicleRef) return;
    const bus = activities.find(
      (a) => a.MonitoredVehicleJourney.VehicleRef === selectedVehicleRef
    );
    if (bus) {
      map.panTo({
        lat: bus.MonitoredVehicleJourney.VehicleLocation.Latitude,
        lng: bus.MonitoredVehicleJourney.VehicleLocation.Longitude,
      });
      map.setZoom(16);
    }
  }, [map, selectedVehicleRef, activities]);

  return null;
};

export const GoogleMapsWebGLCanvas: React.FC<GoogleMapsWebGLCanvasProps> = ({
  apiKey,
  mapId,
  activities,
  selectedDepot,
  selectedRouteId,
  selectedVehicleRef,
  journeyTrace,
  routeStops = [],
  buildingOpacity,
  showBuildings,
  showRouteShapes,
  showStops = true,
  hoveredRouteId,
  sponsoredCampaigns = [],
  onSelectVehicle,
  onSelectDepot,
  onSelectRoute,
  onHoverRoute,
}) => {
  const [mapColorScheme, setMapColorScheme] = useState<'DARK' | 'LIGHT'>('DARK');
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [hoveredStop, setHoveredStop] = useState<ObaStop | null>(null);
  const [selectedStop, setSelectedStop] = useState<ObaStop | null>(null);

  // Active selected route object
  const activeRouteDef = useMemo(() => {
    return ROUTE_CATALOG.find(
      (r) => r.route.id === selectedRouteId || r.route.shortName === selectedRouteId
    );
  }, [selectedRouteId]);

  // Stops to display: if a route is selected, show its stops; else show stops if available
  const stopsToDisplay = useMemo(() => {
    if (activeRouteDef && activeRouteDef.stops?.length) {
      return activeRouteDef.stops;
    }
    if (routeStops && routeStops.length > 0) {
      return routeStops;
    }
    return [];
  }, [activeRouteDef, routeStops]);

  // Effective map ID: use DEMO_MAP_ID or provided mapId per CF9
  const effectiveMapId = mapId && mapId.startsWith('DEMO_') ? mapId : 'DEMO_MAP_ID';

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0B0F17]">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={NYC_CENTER}
          defaultZoom={12}
          defaultTilt={is3DView ? 45 : 0}
          defaultHeading={0}
          mapId={effectiveMapId}
          colorScheme={mapColorScheme}
          mapTypeId={mapTypeId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          <MapRouteAndOverlayController
            buildingOpacity={buildingOpacity}
            showBuildings={showBuildings}
            selectedDepot={selectedDepot}
            selectedRouteId={selectedRouteId}
            selectedVehicleRef={selectedVehicleRef}
            activities={activities}
            journeyTrace={journeyTrace}
            showRouteShapes={showRouteShapes}
            hoveredRouteId={hoveredRouteId}
            onSelectRoute={onSelectRoute}
            onHoverRoute={onHoverRoute}
          />

          {/* Interactive Stops along Selected Route */}
          {showStops &&
            stopsToDisplay.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === stopsToDisplay.length - 1;
              const isTerminal = isFirst || isLast;
              const isSelected = selectedStop?.id === stop.id;

              return (
                <AdvancedMarker
                  key={`stop-${stop.id}-${idx}`}
                  position={{ lat: stop.lat, lng: stop.lon }}
                  onClick={() => setSelectedStop(isSelected ? null : stop)}
                  zIndex={isTerminal ? 35 : 25}
                >
                  <div
                    className={`group relative flex items-center justify-center cursor-pointer transition-transform ${
                      isSelected ? 'scale-125' : 'hover:scale-110'
                    }`}
                    onMouseEnter={() => setHoveredStop(stop)}
                    onMouseLeave={() => setHoveredStop(null)}
                  >
                    {isTerminal ? (
                      <div className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono text-[9px] font-bold border-2 border-slate-900 shadow-md flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{isFirst ? 'START' : 'TERM'}</span>
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-500 shadow-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      </div>
                    )}
                  </div>
                </AdvancedMarker>
              );
            })}

          {/* Selected Stop InfoWindow */}
          {selectedStop && (
            <InfoWindow
              position={{ lat: selectedStop.lat, lng: selectedStop.lon }}
              onCloseClick={() => setSelectedStop(null)}
            >
              <div className="p-2 min-w-[200px] text-slate-900">
                <div className="flex items-center gap-1 text-[10px] font-bold text-sky-600 uppercase tracking-wide">
                  <MapPin className="w-3 h-3" />
                  <span>Bus Stop #{selectedStop.code || selectedStop.id}</span>
                </div>
                <div className="font-bold text-xs mt-0.5 text-slate-950">
                  {selectedStop.name}
                </div>
                <div className="mt-1 text-[11px] text-slate-600 flex items-center gap-2">
                  <span>Direction: <strong>{selectedStop.direction}</strong></span>
                  {selectedStop.wheelchairBoarding === 'ACCESSIBLE' && (
                    <span className="text-emerald-600 text-[10px] font-semibold">♿ Accessible</span>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Interactive MTA Depot Facility Pins */}
          {MTA_DEPOTS.map((depot) => {
            const isSelected = selectedDepot?.id === depot.id;
            const activeAd = sponsoredCampaigns.find(
              (c) => c.status === 'active' && c.targetDepotId === depot.id
            );
            return (
              <AdvancedMarker
                key={`depot-${depot.id}`}
                position={depot.location}
                onClick={() => onSelectDepot?.(isSelected ? 'ALL' : depot.id)}
                zIndex={isSelected ? 45 : activeAd ? 40 : 30}
              >
                <div
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    isSelected ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  {/* Glowing Sponsor Badge if Active Campaign */}
                  {activeAd && (
                    <div className="mb-1 px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[9px] shadow-lg flex items-center gap-1 border border-amber-200">
                      <span>★</span>
                      <span className="truncate max-w-[110px]">{activeAd.sponsorName}</span>
                    </div>
                  )}

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border shadow-lg ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-400/50'
                        : activeAd
                        ? 'bg-slate-950/95 text-amber-300 border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/20'
                        : 'bg-slate-950/95 text-amber-300 border-amber-500/70 hover:border-amber-300'
                    }`}
                  >
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-200">
                      {depot.code}
                    </span>
                    <span>{depot.name}</span>
                    <span className="font-mono text-[9px] text-amber-400">
                      ⚡{depot.electricChargingBays}
                    </span>
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Real-Time Active SIRI Bus Vehicles */}
          {activities.map((act) => {
            const mvj = act.MonitoredVehicleJourney;
            const vRef = mvj.VehicleRef;
            const shortNum = vRef.replace('MTA NYCT_', '');
            const isSelected = selectedVehicleRef === vRef;
            const bearing = mvj.Bearing ?? 0;

            // Route color matching
            const lineDef = ROUTE_CATALOG.find(
              (r) => r.route.id === mvj.LineRef || r.route.shortName === mvj.PublishedLineName
            );
            const routeColor = lineDef?.route.color ? `#${lineDef.route.color}` : '#06B6D4';

            const occupancy = parseVehicleOccupancy(mvj);

            return (
              <AdvancedMarker
                key={`bus-${vRef}`}
                position={{
                  lat: mvj.VehicleLocation.Latitude,
                  lng: mvj.VehicleLocation.Longitude,
                }}
                onClick={() => onSelectVehicle(isSelected ? null : vRef)}
                zIndex={isSelected ? 60 : 35}
              >
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-mono text-[11px] font-bold cursor-pointer transition-all shadow-md select-none ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 border-white ring-2 ring-sky-400/60 scale-110 shadow-sky-500/40'
                      : 'bg-slate-950/90 text-slate-100 border-slate-700/90 hover:border-sky-400 hover:scale-105'
                  }`}
                  style={{
                    borderLeftColor: routeColor,
                    borderLeftWidth: '4px',
                  }}
                  title={`Bus #${shortNum} (${mvj.PublishedLineName}) · Load: ${occupancy.label}`}
                >
                  {/* Bearing Heading Arrow */}
                  <div
                    className="w-3.5 h-3.5 flex items-center justify-center shrink-0"
                    style={{ transform: `rotate(${bearing}deg)` }}
                    title={`Bearing: ${Math.round(bearing)}°`}
                  >
                    <Navigation className="w-3 h-3 text-sky-400 fill-sky-400" />
                  </div>

                  <span>{mvj.PublishedLineName}</span>
                  <span className="text-slate-400 font-normal">#{shortNum}</span>

                  {/* Real-time Vehicle Load / Occupancy Color-Coded Indicator */}
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                      isSelected
                        ? 'bg-slate-950 text-white border-white/40'
                        : `${occupancy.tailwindBg} ${occupancy.tailwindText} ${occupancy.tailwindBorder}`
                    }`}
                    title={`Passenger Load: ${occupancy.label}`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: occupancy.colorHex }}
                    />
                    <span>
                      {occupancy.occupancyPercent !== undefined
                        ? `${occupancy.occupancyPercent}%`
                        : occupancy.shortCode}
                    </span>
                  </div>

                  {/* Pulsing telemetry beacon matching occupancy status */}
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: occupancy.colorHex }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: occupancy.colorHex }}
                    />
                  </span>
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>

      {/* Floating Top Route Explorer Quickbar */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 pointer-events-auto max-w-[calc(100vw-360px)]">
        <div className="px-3.5 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mr-1 shrink-0">
            <Bus className="w-4 h-4 text-sky-400" />
            <span>Select Route:</span>
          </div>

          <button
            type="button"
            onClick={() => onSelectRoute?.('ALL')}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold font-mono transition-colors shrink-0 cursor-pointer ${
              selectedRouteId === 'ALL'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            All NYC Routes
          </button>

          {/* Key showcase routes */}
          {['MTA NYCT_Q44+', 'MTA NYCT_Q32', 'MTA NYCT_M15+', 'MTA NYCT_B44+', 'MTA NYCT_B62', 'MTA NYCT_M34+'].map(
            (rId) => {
              const rDef = ROUTE_CATALOG.find((r) => r.route.id === rId);
              if (!rDef) return null;
              const isSelected = selectedRouteId === rId;
              return (
                <button
                  key={rId}
                  type="button"
                  onClick={() => onSelectRoute?.(isSelected ? 'ALL' : rId)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold font-mono transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-400 text-slate-950 shadow-md ring-2 ring-sky-300/50 scale-105'
                      : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: `#${rDef.route.color}` }}
                  />
                  <span>{rDef.route.shortName}</span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Floating Top-Right View Controls & Style Selector */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl flex items-center gap-2 text-xs">
          {/* Map Style Dropdown */}
          <select
            value={mapTypeId}
            onChange={(e) => setMapTypeId(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="roadmap">Roadmap View</option>
            <option value="satellite">Satellite View</option>
            <option value="hybrid">Hybrid Imagery</option>
          </select>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setMapColorScheme((t) => (t === 'DARK' ? 'LIGHT' : 'DARK'))}
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-sky-500 transition-colors"
            title="Toggle Map Color Scheme"
          >
            {mapColorScheme === 'DARK' ? '🌙 Dark' : '☀️ Light'}
          </button>

          {/* 2D / 3D Angle Toggle */}
          <button
            type="button"
            onClick={() => setIs3DView((v) => !v)}
            className={`px-2 py-1 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              is3DView
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/60'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{is3DView ? '3D View' : '2D Map'}</span>
          </button>
        </div>
      </div>

      {/* Floating Active Route Information Banner (Bottom Left) */}
      {activeRouteDef && (
        <div className="absolute bottom-4 left-4 z-30 pointer-events-auto max-w-sm">
          <div className="p-3.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="px-2 py-0.5 rounded text-xs font-mono font-bold text-white shadow-xs"
                  style={{ backgroundColor: `#${activeRouteDef.route.color}` }}
                >
                  {activeRouteDef.route.shortName}
                </div>
                <span className="text-xs font-semibold text-slate-200">
                  {activeRouteDef.route.serviceTier} Bus Service
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectRoute?.('ALL')}
                className="text-[11px] text-slate-400 hover:text-sky-400 font-medium cursor-pointer"
              >
                Reset Route
              </button>
            </div>

            <div className="text-xs text-slate-300 mt-1.5 leading-snug font-medium">
              {activeRouteDef.route.longName}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Depot: <strong className="text-amber-300">{activeRouteDef.route.depotId}</strong></span>
              <span>Headway: <strong className="text-sky-300">{activeRouteDef.headwayMinutes} min</strong></span>
              <span>Stops: <strong className="text-slate-200">{activeRouteDef.stops?.length ?? 0}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
