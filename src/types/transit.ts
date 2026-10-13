export interface LatLngPoint {
  lat: number;
  lng: number;
}

export type ScheduleAdherenceStatus = 'ON_TIME' | 'EARLY' | 'DELAYED';

export type BoroughName = 'Queens' | 'Brooklyn' | 'Manhattan' | 'Bronx' | 'Staten Island';

export interface SiriDistancesExtension {
  PresentableDistance: string;
  DistanceFromCall: number;
  StopsFromCall: number;
  CallDistanceAlongRoute: number;
}

export type VehicleOccupancyLevel = 'UNKNOWN' | 'LOW' | 'MODERATE' | 'HIGH' | 'FULL';

export interface VehicleOccupancyInfo {
  level: VehicleOccupancyLevel;
  passengerCount?: number;
  passengerCapacity?: number;
  occupancyPercent?: number; // 0 - 100
  label: string;
  shortCode: string;
  colorHex: string;
  tailwindBg: string;
  tailwindText: string;
  tailwindBorder: string;
  hasData: boolean;
}

export interface SiriCapacityExtension {
  EstimatedPassengerCount?: number;
  EstimatedPassengerCapacity?: number;
  EstimatedPassengerLoadFactor?: 'LOW' | 'MODERATE' | 'HIGH' | 'FULL' | string;
  EstimatedPassengerLoad?: string;
  OccupancyPercent?: number;
}

export interface SiriMonitoredCall {
  StopPointRef: string;
  VisitNumber: number;
  StopPointName: string;
  AimedArrivalTime: string;
  ExpectedArrivalTime: string;
  AimedDepartureTime?: string;
  ExpectedDepartureTime?: string;
  Extensions: {
    Distances: SiriDistancesExtension;
    Capacities?: SiriCapacityExtension;
  };
}

export interface SiriOnwardCall {
  StopPointRef: string;
  VisitNumber: number;
  StopPointName: string;
  AimedArrivalTime: string;
  ExpectedArrivalTime: string;
  Extensions: {
    Distances: SiriDistancesExtension;
  };
}

export interface SiriHistoricalStopEvent {
  StopPointRef: string;
  StopPointName: string;
  AimedDepartureTime: string;
  ActualDepartureTime: string;
  AdherenceSeconds: number;
  Location: LatLngPoint;
}

export interface SiriMonitoredVehicleJourney {
  LineRef: string;
  DirectionRef: '0' | '1';
  FramedVehicleJourneyRef: {
    DataFrameRef: string;
    DatedVehicleJourneyRef: string;
  };
  JourneyPatternRef: string;
  PublishedLineName: string;
  OperatorRef: string;
  OriginRef: string;
  OriginName: string;
  DestinationRef: string;
  DestinationName: string;
  OriginAimedDepartureTime: string;
  DestinationAimedArrivalTime: string;
  Monitored: boolean;
  VehicleLocation: {
    Longitude: number;
    Latitude: number;
  };
  Bearing: number;
  ProgressRate: 'normalProgress' | 'slowProgress' | 'noProgress' | 'layover';
  ProgressStatus?: string;
  BlockRef: string;
  VehicleRef: string;
  Occupancy?: string;
  MonitoredCall: SiriMonitoredCall;
  OnwardCalls: {
    OnwardCall: SiriOnwardCall[];
  };
  Extensions?: {
    Capacities?: SiriCapacityExtension;
    OperationalMeta?: {
      DepotId: string;
      DepotName: string;
      Borough: BoroughName;
      CoachType: 'Articulated 60ft' | 'Standard 40ft Hybrid' | 'Battery-Electric 40ft';
      SpeedMph: number;
      ScheduleAdherenceSeconds: number;
      ScheduleAdherenceStatus: ScheduleAdherenceStatus;
      RouteColorHex: string;
      ProgressRatio: number;
    };
  };
}

export interface SiriVehicleActivity {
  RecordedAtTime: string;
  MonitoredVehicleJourney: SiriMonitoredVehicleJourney;
}

export interface SiriVehicleMonitoringDelivery {
  ResponseTimestamp: string;
  ValidUntil: string;
  VehicleActivity: SiriVehicleActivity[];
}

export interface SiriServiceDelivery {
  ResponseTimestamp: string;
  VehicleMonitoringDelivery: SiriVehicleMonitoringDelivery[];
}

export interface SiriVehicleMonitoringResponse {
  Siri: {
    ServiceDelivery: SiriServiceDelivery;
  };
  _meta?: {
    source: 'LIVE_MTA_SIRI_API' | 'MTA_SIRI_3D_CACHE_ENGINE';
    apiKeyConfigured: boolean;
    polledAt: string;
    filterApplied: {
      depotId?: string;
      borough?: string;
      lineRef?: string;
      vehicleRef?: string;
    };
  };
}

export interface SiriMonitoredJourneyTraceResponse {
  VehicleRef: string;
  LineRef: string;
  PublishedLineName: string;
  DepotId: string;
  DepotName: string;
  Borough: BoroughName;
  RecordedAtTime: string;
  MonitoredVehicleJourney: SiriMonitoredVehicleJourney;
  HistoricalPath: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    speedMph: number;
  }>;
  ProjectedPath: Array<{
    lat: number;
    lng: number;
    estimatedTimestamp: string;
  }>;
  HistoricalCalls: SiriHistoricalStopEvent[];
  ScheduleAdherence: {
    deviationSeconds: number;
    formattedDeviation: string;
    status: ScheduleAdherenceStatus;
    headwayTargetMinutes: number;
    actualHeadwayMinutes: number;
  };
}

export interface ObaAgency {
  id: string;
  name: string;
  url: string;
  timezone: string;
  lang: string;
  phone: string;
  privateService: boolean;
}

export interface ObaRoute {
  id: string;
  shortName: string;
  longName: string;
  description: string;
  type: number;
  url: string;
  color: string;
  textColor: string;
  agencyId: string;
  depotId: string;
  borough: BoroughName;
  serviceTier: 'SBS' | 'LIMITED' | 'LOCAL' | 'EXPRESS';
}

export interface ObaStop {
  id: string;
  lat: number;
  lon: number;
  direction: string;
  name: string;
  code: string;
  locationType: number;
  wheelchairBoarding: 'ACCESSIBLE' | 'UNKNOWN';
  routeIds: string[];
}

export interface ObaEncodedPolyline {
  points: string;
  length: number;
  levels?: string;
}

export interface ObaStopsForRouteEntry {
  routeId: string;
  stopIds: string[];
  polylines: ObaEncodedPolyline[];
  shapePoints: LatLngPoint[];
  stopGroupings: Array<{
    type: string;
    ordered: boolean;
    stopGroups: Array<{
      id: string;
      name: {
        name: string;
        names: string[];
        type: string;
      };
      stopIds: string[];
      polylines: ObaEncodedPolyline[];
    }>;
  }>;
}

export interface ObaScheduleStopTime {
  stopId: string;
  stopName: string;
  arrivalTime: string;
  departureTime: string;
  tripId: string;
  blockId: string;
  headsign: string;
}

export interface ObaScheduleFrequencyWindow {
  periodName: string;
  timeRange: string;
  headwayMinutes: number;
  scheduledBuses: number;
  activeBuses: number;
  runTimeMinutes: number;
}

export interface ObaScheduleForRouteEntry {
  routeId: string;
  scheduleDate: string;
  serviceIds: string[];
  frequencyWindows: ObaScheduleFrequencyWindow[];
  upcomingDepartures: ObaScheduleStopTime[];
}

export interface MtaDepot {
  id: string;
  code: string;
  name: string;
  division: string;
  borough: BoroughName;
  address: string;
  location: LatLngPoint;
  cameraZoom: number;
  fleetCapacity: number;
  activeVehiclesCount: number;
  scheduledVehiclesCount: number;
  onTimePerformancePct: number;
  assignedRouteIds: string[];
  electricChargingBays: number;
}

export interface Building3DFootprint {
  id: string;
  name?: string;
  borough: string;
  lat: number;
  lng: number;
  widthMeters: number;
  depthMeters: number;
  heightMeters: number;
  rotationDeg: number;
  isLandmark?: boolean;
  steppedTiers?: Array<{
    scaleX: number;
    scaleZ: number;
    heightRatio: number;
  }>;
}

export interface ObaResponse<T> {
  code: number;
  currentTime: number;
  text: string;
  version: number;
  data: {
    entry: T;
    references: {
      agencies: ObaAgency[];
      routes: ObaRoute[];
      stops: ObaStop[];
    };
  };
}
