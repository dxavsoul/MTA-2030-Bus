import { SiriVehicleActivity } from '../types/transit';
import { ROUTE_CATALOG } from '../data/nycMtaCache';

export interface RouteSpeedBusItem {
  vehicleRef: string;
  vehicleNumber: string;
  speedMph: number;
  direction: '0' | '1';
  headsign: string;
  adherenceStatus: 'ON_TIME' | 'EARLY' | 'DELAYED';
}

export interface RouteSpeedHourlyPoint {
  hour: number;
  hourLabel: string;
  historicalMph: number;
}

export interface RouteSpeedStats {
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor: string;
  realtimeAvgMph: number;
  historicalDailyAvgMph: number;
  deltaMph: number;
  variancePct: number;
  activeBusCount: number;
  buses: RouteSpeedBusItem[];
  hourlyProfile: RouteSpeedHourlyPoint[];
  status: 'FASTER' | 'ON_PACING' | 'CONGESTED';
  depotId?: string;
  borough?: string;
}

/**
 * Historical daily speed baselines by route category and borough
 */
export function getRouteHistoricalSpeedBaseline(routeId: string): {
  dailyAvgMph: number;
  hourlyProfile: RouteSpeedHourlyPoint[];
  corridorType: string;
} {
  const routeDef = ROUTE_CATALOG.find(
    (r) => r.route.id === routeId || r.route.shortName === routeId
  );

  let baseDailyMph = 11.6;
  let corridorType = 'Local City Corridor';

  if (routeDef) {
    if (routeDef.route.serviceTier === 'SBS') {
      baseDailyMph = 14.4;
      corridorType = 'Select Bus Service (SBS) Transit Priority';
    } else if (routeDef.route.borough === 'Manhattan') {
      baseDailyMph = 8.5;
      corridorType = 'Dense Urban Grid (Slow Velocity)';
    } else if (routeDef.route.id === 'MTA NYCT_B39') {
      baseDailyMph = 15.8;
      corridorType = 'Williamsburg Bridge Express Arterial';
    } else if (routeDef.route.depotId === 'GA') {
      baseDailyMph = 12.2;
      corridorType = 'Grand Ave Depot North Brooklyn Arterial';
    } else if (routeDef.route.borough === 'Queens') {
      baseDailyMph = 13.1;
      corridorType = 'Queens Boulevard & Flushing Corridors';
    } else {
      baseDailyMph = 11.2;
      corridorType = 'Brooklyn Mixed Commercial Corridor';
    }
  }

  // Realistic NYC 24-hour speed profile shape
  // Morning Rush (7-9am) and Evening Rush (4-7pm) dip, Night/Early Morning faster
  const hourlyFactors = [
    { hour: 0, label: '12 AM', factor: 1.42 },
    { hour: 3, label: '3 AM', factor: 1.55 },
    { hour: 6, label: '6 AM', factor: 1.25 },
    { hour: 8, label: '8 AM', factor: 0.72 }, // AM peak congestion
    { hour: 10, label: '10 AM', factor: 0.95 },
    { hour: 12, label: '12 PM', factor: 0.98 },
    { hour: 14, label: '2 PM', factor: 0.92 },
    { hour: 17, label: '5 PM', factor: 0.68 }, // PM peak congestion
    { hour: 19, label: '7 PM', factor: 0.96 },
    { hour: 21, label: '9 PM', factor: 1.18 },
    { hour: 23, label: '11 PM', factor: 1.35 },
  ];

  const hourlyProfile: RouteSpeedHourlyPoint[] = hourlyFactors.map((h) => ({
    hour: h.hour,
    hourLabel: h.label,
    historicalMph: Number((baseDailyMph * h.factor).toFixed(1)),
  }));

  return {
    dailyAvgMph: Number(baseDailyMph.toFixed(1)),
    hourlyProfile,
    corridorType,
  };
}

/**
 * Calculates real-time average speed of buses on the selected route
 * and compares it to the route's historical daily average.
 */
export function getRealtimeRouteSpeedStats(
  selectedRouteId: string,
  activities: SiriVehicleActivity[]
): RouteSpeedStats {
  const isAll = selectedRouteId === 'ALL';
  const targetRouteDef = ROUTE_CATALOG.find(
    (r) => r.route.id === selectedRouteId || r.route.shortName === selectedRouteId
  ) || ROUTE_CATALOG[0];

  const routeId = isAll ? 'ALL' : targetRouteDef.route.id;
  const routeShortName = isAll ? 'ALL Routes' : targetRouteDef.route.shortName;
  const routeLongName = isAll
    ? 'NYC Fleet Network Composite'
    : targetRouteDef.route.longName;
  const routeColor = isAll ? '38BDF8' : targetRouteDef.route.color;

  const { dailyAvgMph, hourlyProfile } = getRouteHistoricalSpeedBaseline(
    isAll ? 'MTA NYCT_Q44+' : targetRouteDef.route.id
  );

  // Filter activities matching the route
  const matchingActivities = isAll
    ? activities
    : activities.filter(
        (a) =>
          a.MonitoredVehicleJourney.LineRef === targetRouteDef.route.id ||
          a.MonitoredVehicleJourney.PublishedLineName === targetRouteDef.route.shortName
      );

  const buses: RouteSpeedBusItem[] = [];
  let totalSpeed = 0;

  if (matchingActivities.length > 0) {
    for (const act of matchingActivities) {
      const mvj = act.MonitoredVehicleJourney;
      const speed = mvj.Extensions?.OperationalMeta?.SpeedMph ?? 13.5;
      totalSpeed += speed;
      buses.push({
        vehicleRef: mvj.VehicleRef,
        vehicleNumber: mvj.VehicleRef.replace(/^MTA\s+(?:NYCT|BC)_/i, ''),
        speedMph: Number(speed.toFixed(1)),
        direction: mvj.DirectionRef,
        headsign: mvj.DestinationName || 'In Service',
        adherenceStatus:
          mvj.Extensions?.OperationalMeta?.ScheduleAdherenceStatus || 'ON_TIME',
      });
    }
  } else if (!isAll && targetRouteDef.fleetSeeds.length > 0) {
    // If route has no current activities in filtered slice, fallback to catalog seeds
    for (const seed of targetRouteDef.fleetSeeds) {
      totalSpeed += seed.baseSpeedMph;
      buses.push({
        vehicleRef: `MTA NYCT_${seed.vehicleNumber}`,
        vehicleNumber: seed.vehicleNumber,
        speedMph: Number(seed.baseSpeedMph.toFixed(1)),
        direction: seed.direction,
        headsign: seed.direction === '0' ? 'Northbound' : 'Southbound',
        adherenceStatus: seed.adherenceSeconds < -120 ? 'DELAYED' : 'ON_TIME',
      });
    }
  }

  const busCount = buses.length;
  const realtimeAvgMph =
    busCount > 0 ? Number((totalSpeed / busCount).toFixed(1)) : dailyAvgMph;

  const deltaMph = Number((realtimeAvgMph - dailyAvgMph).toFixed(1));
  const variancePct = Number(((deltaMph / Math.max(1, dailyAvgMph)) * 100).toFixed(1));

  let status: 'FASTER' | 'ON_PACING' | 'CONGESTED' = 'ON_PACING';
  if (deltaMph >= 1.0) {
    status = 'FASTER';
  } else if (deltaMph <= -1.0) {
    status = 'CONGESTED';
  }

  return {
    routeId,
    routeShortName,
    routeLongName,
    routeColor,
    realtimeAvgMph,
    historicalDailyAvgMph: dailyAvgMph,
    deltaMph,
    variancePct,
    activeBusCount: busCount,
    buses,
    hourlyProfile,
    status,
    depotId: targetRouteDef.route.depotId,
    borough: targetRouteDef.route.borough,
  };
}
