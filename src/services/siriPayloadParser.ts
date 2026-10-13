import {
  SiriMonitoredVehicleJourney,
  SiriVehicleActivity,
  SiriVehicleMonitoringResponse,
  VehicleOccupancyInfo,
  VehicleOccupancyLevel,
} from '../types/transit';

/**
 * Standardized color specifications for vehicle occupancy levels.
 */
export const OCCUPANCY_COLOR_MAP: Record<
  VehicleOccupancyLevel,
  {
    colorHex: string;
    tailwindBg: string;
    tailwindText: string;
    tailwindBorder: string;
    badgeBg: string;
    label: string;
    shortCode: string;
  }
> = {
  LOW: {
    colorHex: '#10B981', // Emerald Green
    tailwindBg: 'bg-emerald-500/15',
    tailwindText: 'text-emerald-400',
    tailwindBorder: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500',
    label: 'Seats Available (Low Load)',
    shortCode: 'LOW',
  },
  MODERATE: {
    colorHex: '#F59E0B', // Amber Yellow
    tailwindBg: 'bg-amber-500/15',
    tailwindText: 'text-amber-400',
    tailwindBorder: 'border-amber-500/40',
    badgeBg: 'bg-amber-500',
    label: 'Few Seats Available (Moderate)',
    shortCode: 'MOD',
  },
  HIGH: {
    colorHex: '#F97316', // Orange
    tailwindBg: 'bg-orange-500/15',
    tailwindText: 'text-orange-400',
    tailwindBorder: 'border-orange-500/40',
    badgeBg: 'bg-orange-500',
    label: 'Standing Room Only (Heavy)',
    shortCode: 'HIGH',
  },
  FULL: {
    colorHex: '#EF4444', // Red
    tailwindBg: 'bg-rose-500/15',
    tailwindText: 'text-rose-400',
    tailwindBorder: 'border-rose-500/40',
    badgeBg: 'bg-rose-500',
    label: 'Bus at Full Capacity',
    shortCode: 'FULL',
  },
  UNKNOWN: {
    colorHex: '#64748B', // Slate
    tailwindBg: 'bg-slate-800/40',
    tailwindText: 'text-slate-400',
    tailwindBorder: 'border-slate-700/40',
    badgeBg: 'bg-slate-500',
    label: 'Occupancy Data Unavailable',
    shortCode: 'N/A',
  },
};

/**
 * Parses real-time passenger load or occupancy status from a SIRI
 * MonitoredVehicleJourney payload across all standard MTA and GTFS-RT schemas.
 */
export function parseVehicleOccupancy(
  mvj: SiriMonitoredVehicleJourney | any
): VehicleOccupancyInfo {
  if (!mvj) {
    const config = OCCUPANCY_COLOR_MAP.UNKNOWN;
    return {
      level: 'UNKNOWN',
      label: config.label,
      shortCode: config.shortCode,
      colorHex: config.colorHex,
      tailwindBg: config.tailwindBg,
      tailwindText: config.tailwindText,
      tailwindBorder: config.tailwindBorder,
      hasData: false,
    };
  }

  // Check all possible locations where SIRI & MTA Bus Time embed capacities
  const cap =
    mvj.Extensions?.Capacities ??
    mvj.MonitoredCall?.Extensions?.Capacities ??
    mvj.Capacities;

  const rawOccupancy =
    mvj.Occupancy ??
    mvj.OccupancyStatus ??
    cap?.EstimatedPassengerLoadFactor ??
    cap?.EstimatedPassengerLoad ??
    null;

  const passengerCount =
    typeof cap?.EstimatedPassengerCount === 'number'
      ? cap.EstimatedPassengerCount
      : typeof cap?.PassengerCount === 'number'
      ? cap.PassengerCount
      : undefined;

  const passengerCapacity =
    typeof cap?.EstimatedPassengerCapacity === 'number'
      ? cap.EstimatedPassengerCapacity
      : typeof cap?.PassengerCapacity === 'number'
      ? cap.PassengerCapacity
      : typeof cap?.Capacity === 'number'
      ? cap.Capacity
      : undefined;

  let occupancyPercent: number | undefined = undefined;
  if (
    typeof passengerCount === 'number' &&
    typeof passengerCapacity === 'number' &&
    passengerCapacity > 0
  ) {
    occupancyPercent = Math.min(
      100,
      Math.max(0, Math.round((passengerCount / passengerCapacity) * 100))
    );
  } else if (typeof cap?.OccupancyPercent === 'number') {
    occupancyPercent = Math.min(100, Math.max(0, cap.OccupancyPercent));
  }

  let level: VehicleOccupancyLevel = 'UNKNOWN';

  // 1. Determine level by calculated occupancy percentage if available
  if (typeof occupancyPercent === 'number') {
    if (occupancyPercent >= 90) {
      level = 'FULL';
    } else if (occupancyPercent >= 68) {
      level = 'HIGH';
    } else if (occupancyPercent >= 35) {
      level = 'MODERATE';
    } else {
      level = 'LOW';
    }
  }

  // 2. Fall back to raw string indicator if occupancyPercent was missing
  if (level === 'UNKNOWN' && typeof rawOccupancy === 'string') {
    const norm = rawOccupancy.toUpperCase().trim().replace(/[\s_-]+/g, '');
    if (norm.includes('FULL') || norm.includes('CRUSHED') || norm.includes('NOTACCEPTING')) {
      level = 'FULL';
      occupancyPercent = occupancyPercent ?? 96;
    } else if (
      norm.includes('STANDING') ||
      norm.includes('HIGH') ||
      norm.includes('HEAVY') ||
      norm.includes('CROWDED')
    ) {
      level = 'HIGH';
      occupancyPercent = occupancyPercent ?? 78;
    } else if (
      norm.includes('MODERATE') ||
      norm.includes('FEWSEATS') ||
      norm.includes('MEDIUM')
    ) {
      level = 'MODERATE';
      occupancyPercent = occupancyPercent ?? 52;
    } else if (
      norm.includes('LOW') ||
      norm.includes('EMPTY') ||
      norm.includes('MANYSEATS') ||
      norm.includes('SEATSAVAILABLE')
    ) {
      level = 'LOW';
      occupancyPercent = occupancyPercent ?? 22;
    }
  }

  const config = OCCUPANCY_COLOR_MAP[level];
  const hasData = level !== 'UNKNOWN' || typeof passengerCount === 'number';

  // Format descriptive label
  let descriptiveLabel = config.label;
  if (typeof passengerCount === 'number' && typeof passengerCapacity === 'number') {
    descriptiveLabel = `${passengerCount}/${passengerCapacity} pax (${occupancyPercent}% · ${config.shortCode})`;
  } else if (typeof occupancyPercent === 'number') {
    descriptiveLabel = `${occupancyPercent}% load (${config.label})`;
  }

  return {
    level,
    passengerCount,
    passengerCapacity,
    occupancyPercent,
    label: descriptiveLabel,
    shortCode: config.shortCode,
    colorHex: config.colorHex,
    tailwindBg: config.tailwindBg,
    tailwindText: config.tailwindText,
    tailwindBorder: config.tailwindBorder,
    hasData,
  };
}

/**
 * Aggregated summary statistics for all monitored buses on a route or depot.
 */
export interface OccupancyFleetSummary {
  lowCount: number;
  moderateCount: number;
  highCount: number;
  fullCount: number;
  unknownCount: number;
  totalWithData: number;
  totalBuses: number;
  averageLoadPercent: number;
}

export function calculateFleetOccupancySummary(
  activities: SiriVehicleActivity[]
): OccupancyFleetSummary {
  let lowCount = 0;
  let moderateCount = 0;
  let highCount = 0;
  let fullCount = 0;
  let unknownCount = 0;
  let sumPercent = 0;
  let percentCount = 0;

  for (const act of activities) {
    const occ = parseVehicleOccupancy(act.MonitoredVehicleJourney);
    if (occ.level === 'LOW') lowCount++;
    else if (occ.level === 'MODERATE') moderateCount++;
    else if (occ.level === 'HIGH') highCount++;
    else if (occ.level === 'FULL') fullCount++;
    else unknownCount++;

    if (typeof occ.occupancyPercent === 'number') {
      sumPercent += occ.occupancyPercent;
      percentCount++;
    }
  }

  const totalBuses = activities.length;
  const totalWithData = lowCount + moderateCount + highCount + fullCount;
  const averageLoadPercent = percentCount > 0 ? Math.round(sumPercent / percentCount) : 0;

  return {
    lowCount,
    moderateCount,
    highCount,
    fullCount,
    unknownCount,
    totalWithData,
    totalBuses,
    averageLoadPercent,
  };
}

/**
 * Parses and extracts normalized vehicle activities from a full SIRI response.
 */
export function parseSiriVehicleMonitoringResponse(
  payload: SiriVehicleMonitoringResponse | null | undefined
): {
  activities: SiriVehicleActivity[];
  fleetSummary: OccupancyFleetSummary;
  timestamp: string;
  source: string;
} {
  const delivery = payload?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery?.[0];
  const activities = Array.isArray(delivery?.VehicleActivity) ? delivery.VehicleActivity : [];
  const fleetSummary = calculateFleetOccupancySummary(activities);
  const timestamp = delivery?.ResponseTimestamp ?? new Date().toISOString();
  const source = payload?._meta?.source ?? 'SIRI_CACHE';

  return {
    activities,
    fleetSummary,
    timestamp,
    source,
  };
}
