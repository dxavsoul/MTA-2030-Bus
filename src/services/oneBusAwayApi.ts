import {
  LatLngPoint,
  ObaResponse,
  ObaRoute,
  ObaScheduleForRouteEntry,
  ObaStopsForRouteEntry,
} from '../types/transit';

export function decodeObaPolyline(encoded: string): LatLngPoint[] {
  const points: LatLngPoint[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

export async function fetchObaRoutesForAgency(
  agencyId = 'MTA NYCT',
  depotId?: string
): Promise<ObaResponse<{ list: ObaRoute[]; limitExceeded: boolean }>> {
  const query = new URLSearchParams();
  if (depotId && depotId !== 'ALL') {
    query.set('depotId', depotId);
  }
  const encodedAgency = encodeURIComponent(agencyId);
  const res = await fetch(
    `/api/oba/where/routes-for-agency/${encodedAgency}.json?${query.toString()}`
  );
  if (!res.ok) {
    throw new Error(`OneBusAway routes-for-agency failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchObaStopsForRoute(
  routeId: string
): Promise<ObaResponse<ObaStopsForRouteEntry>> {
  const encodedRoute = encodeURIComponent(routeId);
  const res = await fetch(
    `/api/oba/where/stops-for-route/${encodedRoute}.json?includePolylines=true&version=2`
  );
  if (!res.ok) {
    throw new Error(`OneBusAway stops-for-route failed: ${res.status}`);
  }
  const json: ObaResponse<ObaStopsForRouteEntry> = await res.json();

  if (
    json?.data?.entry &&
    (!json.data.entry.shapePoints || json.data.entry.shapePoints.length === 0) &&
    json.data.entry.polylines?.[0]?.points
  ) {
    json.data.entry.shapePoints = decodeObaPolyline(json.data.entry.polylines[0].points);
  }

  return json;
}

export async function fetchObaScheduleForRoute(
  routeId: string
): Promise<ObaResponse<ObaScheduleForRouteEntry>> {
  const encodedRoute = encodeURIComponent(routeId);
  const res = await fetch(`/api/oba/where/schedule-for-route/${encodedRoute}.json?version=2`);
  if (!res.ok) {
    throw new Error(`OneBusAway schedule-for-route failed: ${res.status}`);
  }
  return res.json();
}
