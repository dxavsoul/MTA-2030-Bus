import {
  MtaDepot,
  ObaRoute,
  SiriMonitoredJourneyTraceResponse,
  SiriVehicleMonitoringResponse,
} from '../types/transit';

export {
  parseVehicleOccupancy,
  calculateFleetOccupancySummary,
  parseSiriVehicleMonitoringResponse,
  OCCUPANCY_COLOR_MAP,
} from './siriPayloadParser';
export type { OccupancyFleetSummary } from './siriPayloadParser';

export interface SiriVehicleMonitoringParams {
  depotId?: string;
  borough?: string;
  lineRef?: string;
  vehicleRef?: string;
  operatorRef?: string;
  detailLevel?: 'calls' | 'normal';
}

export async function fetchSiriVehicleMonitoring(
  params: SiriVehicleMonitoringParams = {}
): Promise<SiriVehicleMonitoringResponse> {
  const query = new URLSearchParams();
  if (params.depotId && params.depotId !== 'ALL') {
    query.set('depotId', params.depotId);
  }
  if (params.borough && params.borough !== 'ALL') {
    query.set('borough', params.borough);
  }
  if (params.lineRef && params.lineRef !== 'ALL') {
    query.set('LineRef', params.lineRef);
  }
  if (params.vehicleRef) {
    query.set('VehicleRef', params.vehicleRef);
  }
  if (params.operatorRef) {
    query.set('OperatorRef', params.operatorRef);
  }
  query.set('VehicleMonitoringDetailLevel', params.detailLevel ?? 'calls');

  const response = await fetch(`/api/siri/vehicle-monitoring?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`SIRI VehicleMonitoring request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchSiriMonitoredVehicleJourney(
  vehicleRef: string
): Promise<SiriMonitoredJourneyTraceResponse> {
  const query = new URLSearchParams({
    VehicleRef: vehicleRef,
  });

  const response = await fetch(`/api/siri/monitored-vehicle-journey?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`SIRI MonitoredVehicleJourney request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchMtaDepotsAndRoutes(): Promise<{
  depots: MtaDepot[];
  routes: ObaRoute[];
  timestamp: string;
}> {
  const response = await fetch('/api/depots', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load MTA Depots: ${response.status}`);
  }

  return response.json();
}

export async function fetchEnvConfigStatus(): Promise<{
  mtaApiKeyConfigured: boolean;
  googleMapsKeyConfigured: boolean;
  googleMapsApiKey: string;
  mapId: string;
  siriVersion: string;
  obaVersion: number;
  serverTimestamp: string;
}> {
  const response = await fetch('/api/config/status');
  if (!response.ok) {
    throw new Error('Failed to check environment configuration');
  }
  return response.json();
}
