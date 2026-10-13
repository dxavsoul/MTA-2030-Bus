import type { Plugin } from 'vite';
import {
  generateMonitoredVehicleJourneyTrace,
  generateObaScheduleForRoute,
  generateSiriVehicleMonitoringPayload,
  MTA_AGENCIES,
  MTA_DEPOTS,
  ROUTE_CATALOG,
} from '../data/nycMtaCache.ts';

const MTA_SIRI_VEHICLE_MONITORING_URL =
  'https://bustime.mta.info/api/siri/vehicle-monitoring.json';
const MTA_OBA_BASE_URL = 'https://bustime.mta.info/api/where';

function getMtaApiKey(): string {
  const raw = process.env.MTA_API_KEY || process.env.NEXT_PUBLIC_MTA_API_KEY || '';
  if (!raw || raw === 'MY_MTA_API_KEY' || raw.trim() === '') {
    return '';
  }
  return raw.trim();
}

function getGoogleMapsApiKey(): string {
  const raw =
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    '';
  if (!raw || raw === 'MY_GOOGLE_MAPS_KEY' || raw.trim() === '') {
    return '';
  }
  return raw.trim();
}

function encodePolyline(points: Array<{ lat: number; lng: number }>): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = '';

  const encodeSignedNumber = (num: number): string => {
    let sgnNum = num << 1;
    if (num < 0) sgnNum = ~sgnNum;
    let encoded = '';
    while (sgnNum >= 0x20) {
      encoded += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63);
      sgnNum >>= 5;
    }
    encoded += String.fromCharCode(sgnNum + 63);
    return encoded;
  };

  for (const pt of points) {
    const lat = Math.round(pt.lat * 1e5);
    const lng = Math.round(pt.lng * 1e5);
    const dLat = lat - lastLat;
    const dLng = lng - lastLng;
    result += encodeSignedNumber(dLat);
    result += encodeSignedNumber(dLng);
    lastLat = lat;
    lastLng = lng;
  }

  return result;
}

export function mtaApiPlugin(): Plugin {
  return {
    name: 'mta-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:3000');
        const pathname = url.pathname;

        res.setHeader('Content-Type', 'application/json');

        if (pathname === '/api/config/status') {
          const mtaKey = getMtaApiKey();
          const mapsKey = getGoogleMapsApiKey();
          res.end(
            JSON.stringify({
              mtaApiKeyConfigured: Boolean(mtaKey),
              googleMapsKeyConfigured: Boolean(mapsKey),
              googleMapsApiKey: mapsKey,
              mapId: process.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
              siriVersion: '2.0',
              obaVersion: 2,
              serverTimestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (pathname === '/api/depots') {
          const borough = url.searchParams.get('borough');
          let filteredDepots = MTA_DEPOTS;
          let filteredRoutes = ROUTE_CATALOG.map((r) => r.route);

          if (borough && borough !== 'ALL') {
            filteredDepots = MTA_DEPOTS.filter((d) => d.borough === borough);
            filteredRoutes = filteredRoutes.filter((r) => r.borough === borough);
          }

          res.end(
            JSON.stringify({
              depots: filteredDepots,
              routes: filteredRoutes,
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (pathname === '/api/siri/vehicle-monitoring') {
          const lineRef = url.searchParams.get('LineRef') || url.searchParams.get('lineRef') || undefined;
          const vehicleRef = url.searchParams.get('VehicleRef') || url.searchParams.get('vehicleRef') || undefined;
          const depotId = url.searchParams.get('depotId') || undefined;
          const borough = url.searchParams.get('borough') || undefined;
          const forceCache = url.searchParams.get('mode') === 'cache';
          const mtaKey = getMtaApiKey();

          if (mtaKey && !forceCache && (lineRef || vehicleRef)) {
            try {
              const params = new URLSearchParams({
                key: mtaKey,
                version: '2',
                VehicleMonitoringDetailLevel: 'calls',
              });
              if (lineRef && lineRef !== 'ALL') params.set('LineRef', lineRef);
              if (vehicleRef) params.set('VehicleRef', vehicleRef);

              const upstreamRes = await fetch(`${MTA_SIRI_VEHICLE_MONITORING_URL}?${params.toString()}`, {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(4500),
              });

              if (upstreamRes.ok) {
                const liveData = (await upstreamRes.json()) as any;
                const activities =
                  liveData?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery?.[0]?.VehicleActivity;
                if (Array.isArray(activities) && activities.length > 0) {
                  res.end(
                    JSON.stringify({
                      ...liveData,
                      _meta: {
                        source: 'LIVE_MTA_SIRI_API',
                        apiKeyConfigured: true,
                        polledAt: new Date().toISOString(),
                        filterApplied: { depotId, borough, lineRef, vehicleRef },
                      },
                    })
                  );
                  return;
                }
              }
            } catch (_err) {
              // Fall back to cache
            }
          }

          const payload = generateSiriVehicleMonitoringPayload({
            depotId,
            borough,
            lineRef,
            vehicleRef,
          });
          if (payload._meta) {
            payload._meta.apiKeyConfigured = Boolean(mtaKey);
          }
          res.end(JSON.stringify(payload));
          return;
        }

        if (pathname === '/api/siri/monitored-vehicle-journey') {
          const vehicleRef = url.searchParams.get('VehicleRef') || url.searchParams.get('vehicleRef');
          if (!vehicleRef) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing required query parameter: VehicleRef' }));
            return;
          }

          const trace = generateMonitoredVehicleJourneyTrace(vehicleRef);
          if (!trace) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: `MonitoredVehicleJourney not found for VehicleRef: ${vehicleRef}` }));
            return;
          }

          res.end(JSON.stringify(trace));
          return;
        }

        if (pathname === '/api/oba/where/agencies-with-coverage.json') {
          res.end(
            JSON.stringify({
              code: 200,
              currentTime: Date.now(),
              text: 'OK',
              version: 2,
              data: {
                entry: MTA_AGENCIES.map((agency) => ({
                  agencyId: agency.id,
                  lat: 40.732,
                  lon: -73.935,
                  latSpan: 0.45,
                  lonSpan: 0.52,
                })),
                references: {
                  agencies: MTA_AGENCIES,
                  routes: ROUTE_CATALOG.map((r) => r.route),
                  stops: [],
                },
              },
            })
          );
          return;
        }

        const routesAgencyMatch = pathname.match(/^\/api\/oba\/where\/routes-for-agency\/([^/]+)\.json$/);
        if (routesAgencyMatch) {
          const depotId = url.searchParams.get('depotId') || undefined;
          const borough = url.searchParams.get('borough') || undefined;

          const filteredRoutes = ROUTE_CATALOG.map((r) => r.route).filter((route) => {
            if (depotId && depotId !== 'ALL' && route.depotId !== depotId) return false;
            if (borough && borough !== 'ALL' && route.borough !== borough) return false;
            return true;
          });

          res.end(
            JSON.stringify({
              code: 200,
              currentTime: Date.now(),
              text: 'OK',
              version: 2,
              data: {
                entry: {
                  list: filteredRoutes,
                  limitExceeded: false,
                },
                references: {
                  agencies: MTA_AGENCIES,
                  routes: filteredRoutes,
                  stops: [],
                },
              },
            })
          );
          return;
        }

        const stopsRouteMatch = pathname.match(/^\/api\/oba\/where\/stops-for-route\/([^/]+)\.json$/);
        if (stopsRouteMatch) {
          const rawRouteId = decodeURIComponent(stopsRouteMatch[1]);
          const mtaKey = getMtaApiKey();

          if (mtaKey && url.searchParams.get('mode') !== 'cache') {
            try {
              const upstreamUrl = `${MTA_OBA_BASE_URL}/stops-for-route/${encodeURIComponent(
                rawRouteId
              )}.json?key=${encodeURIComponent(mtaKey)}&includePolylines=true&version=2`;
              const upstreamRes = await fetch(upstreamUrl, {
                signal: AbortSignal.timeout(4000),
              });
              if (upstreamRes.ok) {
                const liveOba = (await upstreamRes.json()) as any;
                if (liveOba?.code === 200) {
                  res.end(JSON.stringify(liveOba));
                  return;
                }
              }
            } catch (_e) {
              // Fallback to cache
            }
          }

          const def = ROUTE_CATALOG.find(
            (r) => r.route.id === rawRouteId || r.route.shortName === rawRouteId
          );
          if (!def) {
            res.statusCode = 404;
            res.end(
              JSON.stringify({
                code: 404,
                currentTime: Date.now(),
                text: `Route not found: ${rawRouteId}`,
                version: 2,
              })
            );
            return;
          }

          const encodedPoly = encodePolyline(def.shapePoints);
          const stopIds = def.stops.map((s) => s.id);

          res.end(
            JSON.stringify({
              code: 200,
              currentTime: Date.now(),
              text: 'OK',
              version: 2,
              data: {
                entry: {
                  routeId: def.route.id,
                  stopIds,
                  polylines: [{ points: encodedPoly, length: def.shapePoints.length }],
                  shapePoints: def.shapePoints,
                  stopGroupings: [
                    {
                      type: 'direction',
                      ordered: true,
                      stopGroups: [
                        {
                          id: '0',
                          name: { name: def.route.longName, names: [def.route.longName], type: 'destination' },
                          stopIds,
                          polylines: [{ points: encodedPoly, length: def.shapePoints.length }],
                        },
                      ],
                    },
                  ],
                },
                references: {
                  agencies: MTA_AGENCIES,
                  routes: [def.route],
                  stops: def.stops,
                },
              },
            })
          );
          return;
        }

        const schedRouteMatch = pathname.match(/^\/api\/oba\/where\/schedule-for-route\/([^/]+)\.json$/);
        if (schedRouteMatch) {
          const rawRouteId = decodeURIComponent(schedRouteMatch[1]);
          const schedule = generateObaScheduleForRoute(rawRouteId);
          const def = ROUTE_CATALOG.find(
            (r) => r.route.id === rawRouteId || r.route.shortName === rawRouteId
          );

          if (!schedule || !def) {
            res.statusCode = 404;
            res.end(
              JSON.stringify({
                code: 404,
                currentTime: Date.now(),
                text: `Schedule not found for route: ${rawRouteId}`,
                version: 2,
              })
            );
            return;
          }

          res.end(
            JSON.stringify({
              code: 200,
              currentTime: Date.now(),
              text: 'OK',
              version: 2,
              data: {
                entry: schedule,
                references: {
                  agencies: MTA_AGENCIES,
                  routes: [def.route],
                  stops: def.stops,
                },
              },
            })
          );
          return;
        }

        next();
      });
    },
  };
}
