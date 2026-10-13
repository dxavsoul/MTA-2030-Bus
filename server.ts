import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateMonitoredVehicleJourneyTrace,
  generateObaScheduleForRoute,
  generateSiriVehicleMonitoringPayload,
  MTA_AGENCIES,
  MTA_DEPOTS,
  ROUTE_CATALOG,
} from './src/data/nycMtaCache.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    result += encodeSignedNumber(lat - lastLat);
    result += encodeSignedNumber(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }

  return result;
}

async function startServer() {
  const app = express();

  const args = process.argv.slice(2);
  let port = 3000;
  let host = '0.0.0.0';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      const parsed = parseInt(args[i + 1], 10);
      if (!isNaN(parsed)) port = parsed;
    }
    if (args[i] === '--host' && args[i + 1]) {
      host = args[i + 1];
    }
  }
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed)) port = parsed;
  }

  app.use(express.json());

  app.get('/api/config/status', (_req, res) => {
    const mtaKey = getMtaApiKey();
    const mapsKey = getGoogleMapsApiKey();
    res.json({
      mtaApiKeyConfigured: Boolean(mtaKey),
      googleMapsKeyConfigured: Boolean(mapsKey),
      googleMapsApiKey: mapsKey,
      mapId: process.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
      siriVersion: '2.0',
      obaVersion: 2,
      serverTimestamp: new Date().toISOString(),
    });
  });

  app.get('/api/depots', (req, res) => {
    const borough = req.query.borough as string | undefined;
    let filteredDepots = MTA_DEPOTS;
    let filteredRoutes = ROUTE_CATALOG.map((r) => r.route);

    if (borough && borough !== 'ALL') {
      filteredDepots = MTA_DEPOTS.filter((d) => d.borough === borough);
      filteredRoutes = filteredRoutes.filter((r) => r.borough === borough);
    }

    res.json({
      depots: filteredDepots,
      routes: filteredRoutes,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/siri/vehicle-monitoring', async (req, res) => {
    const lineRef = (req.query.LineRef as string) || (req.query.lineRef as string) || undefined;
    const vehicleRef = (req.query.VehicleRef as string) || (req.query.vehicleRef as string) || undefined;
    const depotId = (req.query.depotId as string) || undefined;
    const borough = (req.query.borough as string) || undefined;
    const forceCache = req.query.mode === 'cache';
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
          const liveData = await upstreamRes.json();
          const activities =
            liveData?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery?.[0]?.VehicleActivity;
          if (Array.isArray(activities) && activities.length > 0) {
            return res.json({
              ...liveData,
              _meta: {
                source: 'LIVE_MTA_SIRI_API',
                apiKeyConfigured: true,
                polledAt: new Date().toISOString(),
                filterApplied: { depotId, borough, lineRef, vehicleRef },
              },
            });
          }
        }
      } catch (_err) {
        // Fall back gracefully to cache
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
    return res.json(payload);
  });

  app.get('/api/siri/monitored-vehicle-journey', async (req, res) => {
    const vehicleRef = (req.query.VehicleRef as string) || (req.query.vehicleRef as string);
    if (!vehicleRef) {
      return res.status(400).json({
        error: 'Missing required query parameter: VehicleRef',
      });
    }

    const trace = generateMonitoredVehicleJourneyTrace(vehicleRef);
    if (!trace) {
      return res.status(404).json({
        error: `MonitoredVehicleJourney not found for VehicleRef: ${vehicleRef}`,
      });
    }

    return res.json(trace);
  });

  app.get('/api/oba/where/agencies-with-coverage.json', (_req, res) => {
    res.json({
      code: 200,
      currentTime: Date.now(),
      text: 'OK',
      version: 2,
      data: {
        entry: MTA_AGENCIES.map((agency) => ({
          agencyId: agency.id,
          lat: 40.7320,
          lon: -73.9350,
          latSpan: 0.45,
          lonSpan: 0.52,
        })),
        references: {
          agencies: MTA_AGENCIES,
          routes: ROUTE_CATALOG.map((r) => r.route),
          stops: [],
        },
      },
    });
  });

  app.get('/api/oba/where/routes-for-agency/:agencyId.json', (req, res) => {
    const depotId = req.query.depotId as string | undefined;
    const borough = req.query.borough as string | undefined;

    const filteredRoutes = ROUTE_CATALOG.map((r) => r.route).filter((route) => {
      if (depotId && depotId !== 'ALL' && route.depotId !== depotId) return false;
      if (borough && borough !== 'ALL' && route.borough !== borough) return false;
      return true;
    });

    res.json({
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
    });
  });

  app.get('/api/oba/where/stops-for-route/:routeId.json', async (req, res) => {
    const rawRouteId = decodeURIComponent(req.params.routeId);
    const mtaKey = getMtaApiKey();

    if (mtaKey && req.query.mode !== 'cache') {
      try {
        const upstreamUrl = `${MTA_OBA_BASE_URL}/stops-for-route/${encodeURIComponent(
          rawRouteId
        )}.json?key=${encodeURIComponent(mtaKey)}&includePolylines=true&version=2`;
        const upstreamRes = await fetch(upstreamUrl, {
          signal: AbortSignal.timeout(4000),
        });
        if (upstreamRes.ok) {
          const liveOba = await upstreamRes.json();
          if (liveOba?.code === 200) {
            return res.json(liveOba);
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
      return res.status(404).json({
        code: 404,
        currentTime: Date.now(),
        text: `Route not found: ${rawRouteId}`,
        version: 2,
      });
    }

    const encodedPoly = encodePolyline(def.shapePoints);
    const stopIds = def.stops.map((s) => s.id);

    return res.json({
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
    });
  });

  app.get('/api/oba/where/schedule-for-route/:routeId.json', (req, res) => {
    const rawRouteId = decodeURIComponent(req.params.routeId);
    const schedule = generateObaScheduleForRoute(rawRouteId);
    const def = ROUTE_CATALOG.find(
      (r) => r.route.id === rawRouteId || r.route.shortName === rawRouteId
    );

    if (!schedule || !def) {
      return res.status(404).json({
        code: 404,
        currentTime: Date.now(),
        text: `Schedule not found for route: ${rawRouteId}`,
        version: 2,
      });
    }

    return res.json({
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
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      root: __dirname,
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicit fallback for SPA routes in dev
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const fs = await import('fs/promises');
        let template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(port, host, () => {
    console.log(`  ➜  Local:   http://localhost:${port}/`);
    console.log(`  ➜  Network: http://${host}:${port}/`);
    console.log(`MetroGlass NYC server ready on http://${host}:${port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, retrying in 500ms...`);
      setTimeout(() => {
        server.close();
        server.listen(port, host);
      }, 500);
    } else {
      console.error('Server listen error:', err);
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
