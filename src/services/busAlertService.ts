import { SiriVehicleActivity } from '../types/transit';
import { ROUTE_CATALOG } from '../data/nycMtaCache';

export interface BusArrivalAlert {
  id: string;
  routeId: string;
  routeShortName: string;
  routeColor: string;
  vehicleRef: string;
  vehicleNumber: string;
  destinationName?: string;
  stopId: string;
  stopName: string;
  thresholdMinutes: number; // fixed at 5 minutes
  createdAt: string;
  isActive: boolean;
  hasTriggered: boolean;
  triggeredAt?: string;
  lastEtaMinutes?: number | null;
  lastCheckedAt?: string;
}

export interface EtaCalculationResult {
  etaMinutes: number | null;
  source: 'MONITORED_CALL' | 'ONWARD_CALL' | 'PROGRESS_ESTIMATE' | 'PASSED' | 'UNKNOWN';
  stopName?: string;
}

const STORAGE_KEY = 'metroglass_bus_alerts_v1';

/**
 * Loads stored alerts from localStorage
 */
export function loadStoredAlerts(): BusArrivalAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load bus alerts from localStorage', e);
    return [];
  }
}

/**
 * Saves alerts to localStorage
 */
export function saveStoredAlerts(alerts: BusArrivalAlert[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.warn('Failed to save bus alerts to localStorage', e);
  }
}

/**
 * Calculates current ETA in minutes for a specific bus activity to a target stop
 */
export function calculateBusEtaToStop(
  activity: SiriVehicleActivity,
  targetStopId: string,
  targetStopName?: string
): EtaCalculationResult {
  const mvj = activity.MonitoredVehicleJourney;
  const now = Date.now();
  const cleanTargetName = targetStopName ? targetStopName.trim().toLowerCase() : '';

  // 1. Check MonitoredCall (immediately next stop the bus is arriving at)
  if (mvj.MonitoredCall) {
    const mc = mvj.MonitoredCall;
    const isIdMatch = mc.StopPointRef === targetStopId;
    const isNameMatch = cleanTargetName && mc.StopPointName.trim().toLowerCase() === cleanTargetName;

    if (isIdMatch || isNameMatch) {
      const timeStr = mc.ExpectedArrivalTime || mc.AimedArrivalTime;
      if (timeStr) {
        const timeMs = new Date(timeStr).getTime();
        if (!isNaN(timeMs)) {
          const diffMin = (timeMs - now) / 60000;
          return {
            etaMinutes: Number(diffMin.toFixed(1)),
            source: 'MONITORED_CALL',
            stopName: mc.StopPointName,
          };
        }
      }
      // If time string missing, compute from DistanceFromCall
      const dist = mc.Extensions?.Distances?.DistanceFromCall;
      if (typeof dist === 'number' && dist >= 0) {
        const speedMph = mvj.Extensions?.OperationalMeta?.SpeedMph || 15;
        const miles = dist / 1609.34;
        const minutes = (miles / Math.max(5, speedMph)) * 60;
        return {
          etaMinutes: Number(minutes.toFixed(1)),
          source: 'MONITORED_CALL',
          stopName: mc.StopPointName,
        };
      }
    }
  }

  // 2. Check OnwardCalls (subsequent stops along the bus's current run)
  const onwardCalls = mvj.OnwardCalls?.OnwardCall || [];
  for (const call of onwardCalls) {
    const isIdMatch = call.StopPointRef === targetStopId;
    const isNameMatch = cleanTargetName && call.StopPointName.trim().toLowerCase() === cleanTargetName;

    if (isIdMatch || isNameMatch) {
      const timeStr = call.ExpectedArrivalTime || call.AimedArrivalTime;
      if (timeStr) {
        const timeMs = new Date(timeStr).getTime();
        if (!isNaN(timeMs)) {
          const diffMin = (timeMs - now) / 60000;
          return {
            etaMinutes: Number(diffMin.toFixed(1)),
            source: 'ONWARD_CALL',
            stopName: call.StopPointName,
          };
        }
      }
      const dist = call.Extensions?.Distances?.DistanceFromCall;
      if (typeof dist === 'number' && dist >= 0) {
        const speedMph = mvj.Extensions?.OperationalMeta?.SpeedMph || 15;
        const miles = dist / 1609.34;
        const minutes = (miles / Math.max(5, speedMph)) * 60;
        return {
          etaMinutes: Number(minutes.toFixed(1)),
          source: 'ONWARD_CALL',
          stopName: call.StopPointName,
        };
      }
    }
  }

  // 3. Fallback: Lookup along route definition stops
  const routeDef = ROUTE_CATALOG.find(
    (r) => r.route.id === mvj.LineRef || r.route.shortName === mvj.PublishedLineName
  );

  if (routeDef && routeDef.stops.length > 0) {
    const isReverse = mvj.DirectionRef === '1';
    const stopsList = isReverse ? [...routeDef.stops].reverse() : routeDef.stops;

    const targetIdx = stopsList.findIndex(
      (s) => s.id === targetStopId || (cleanTargetName && s.name.trim().toLowerCase() === cleanTargetName)
    );

    if (targetIdx !== -1) {
      const currentNextStopId = mvj.MonitoredCall?.StopPointRef;
      const currentNextStopName = mvj.MonitoredCall?.StopPointName?.trim().toLowerCase();
      const currentIdx = stopsList.findIndex(
        (s) => s.id === currentNextStopId || (currentNextStopName && s.name.trim().toLowerCase() === currentNextStopName)
      );

      if (currentIdx !== -1) {
        if (targetIdx < currentIdx) {
          // Bus already passed target stop in this trip
          return { etaMinutes: null, source: 'PASSED' };
        }
        const stopsAway = targetIdx - currentIdx;
        const avgMinPerStop = routeDef.runTimeMinutes / Math.max(1, stopsList.length);
        const distToNext = mvj.MonitoredCall?.Extensions?.Distances?.DistanceFromCall ?? 350;
        const speedMph = mvj.Extensions?.OperationalMeta?.SpeedMph || 15;
        const minToNext = ((distToNext / 1609.34) / Math.max(5, speedMph)) * 60;
        const totalMin = minToNext + stopsAway * avgMinPerStop;
        return {
          etaMinutes: Number(totalMin.toFixed(1)),
          source: 'PROGRESS_ESTIMATE',
          stopName: stopsList[targetIdx].name,
        };
      } else {
        // Estimate from progress ratio
        const progress = mvj.Extensions?.OperationalMeta?.ProgressRatio ?? 0.3;
        const stopProgress = targetIdx / Math.max(1, stopsList.length - 1);
        if (stopProgress < progress) {
          return { etaMinutes: null, source: 'PASSED' };
        }
        const remainingProgress = stopProgress - progress;
        const etaMin = remainingProgress * routeDef.runTimeMinutes;
        return {
          etaMinutes: Number(etaMin.toFixed(1)),
          source: 'PROGRESS_ESTIMATE',
          stopName: stopsList[targetIdx].name,
        };
      }
    }
  }

  return { etaMinutes: null, source: 'UNKNOWN' };
}

/**
 * Requests browser notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Error requesting browser notification permission', err);
    return Notification.permission;
  }
}

/**
 * Dispatches a native browser notification if granted
 */
export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }
  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      ...options,
    });
    // Auto close after 10 seconds
    setTimeout(() => {
      try {
        notification.close();
      } catch {
        // ignore
      }
    }, 10000);
    return true;
  } catch (err) {
    console.warn('Failed to fire browser notification', err);
    return false;
  }
}

/**
 * Plays a pleasant two-tone transit chime with Web Audio API
 */
export function playTransitAlertChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // First tone (E5: 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second tone (A5: 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.16);
    gain2.gain.setValueAtTime(0.001, now + 0.16);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.7);
  } catch {
    // Audio Context might be restricted before interaction; fail gracefully
  }
}
