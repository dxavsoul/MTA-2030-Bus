import {
  Building3DFootprint,
  LatLngPoint,
  MtaDepot,
  ObaAgency,
  ObaRoute,
  ObaScheduleForRouteEntry,
  ObaStop,
  SiriHistoricalStopEvent,
  SiriMonitoredJourneyTraceResponse,
  SiriMonitoredVehicleJourney,
  SiriOnwardCall,
  SiriVehicleActivity,
  SiriVehicleMonitoringResponse,
} from '../types/transit.ts';

export const NYC_CENTER: LatLngPoint = {
  lat: 40.7320,
  lng: -73.9350,
};

export const MTA_AGENCIES: ObaAgency[] = [
  {
    id: 'MTA NYCT',
    name: 'MTA New York City Transit',
    url: 'https://new.mta.info',
    timezone: 'America/New_York',
    lang: 'en',
    phone: '511',
    privateService: false,
  },
  {
    id: 'MTABC',
    name: 'MTA Bus Company',
    url: 'https://new.mta.info',
    timezone: 'America/New_York',
    lang: 'en',
    phone: '511',
    privateService: false,
  },
];

/**
 * All Depots in Queens, Brooklyn, plus Manhattan command hubs
 */
export const MTA_DEPOTS: MtaDepot[] = [
  // --- ALL QUEENS DEPOTS ---
  {
    id: 'CS',
    code: 'CS',
    name: 'Casey Stengel Depot',
    division: 'Queens North Division',
    borough: 'Queens',
    address: '126-53 Willets Point Blvd, Corona, NY 11368',
    location: { lat: 40.7565, lng: -73.8432 },
    cameraZoom: 13.5,
    fleetCapacity: 245,
    activeVehiclesCount: 14,
    scheduledVehiclesCount: 14,
    onTimePerformancePct: 86.2,
    assignedRouteIds: ['MTA NYCT_Q44+', 'MTA NYCT_Q32', 'MTA NYCT_Q48'],
    electricChargingBays: 32,
  },
  {
    id: 'CP',
    code: 'CP',
    name: 'College Point Depot',
    division: 'Queens North Division',
    borough: 'Queens',
    address: '28-11 120th St, College Point, NY 11354',
    location: { lat: 40.7725, lng: -73.8492 },
    cameraZoom: 13.4,
    fleetCapacity: 220,
    activeVehiclesCount: 9,
    scheduledVehiclesCount: 10,
    onTimePerformancePct: 84.7,
    assignedRouteIds: ['MTA NYCT_Q25', 'MTA NYCT_Q65'],
    electricChargingBays: 24,
  },
  {
    id: 'JA',
    code: 'JA',
    name: 'Jamaica Depot',
    division: 'Queens South Division',
    borough: 'Queens',
    address: '165-18 South Rd, Jamaica, NY 11433',
    location: { lat: 40.6975, lng: -73.7912 },
    cameraZoom: 13.5,
    fleetCapacity: 260,
    activeVehiclesCount: 12,
    scheduledVehiclesCount: 12,
    onTimePerformancePct: 85.5,
    assignedRouteIds: ['MTA NYCT_Q4', 'MTA NYCT_Q5'],
    electricChargingBays: 28,
  },
  {
    id: 'JFK',
    code: 'JFK',
    name: 'JFK Depot',
    division: 'Queens South Division',
    borough: 'Queens',
    address: '165-25 147th Ave, Jamaica, NY 11434',
    location: { lat: 40.6625, lng: -73.7785 },
    cameraZoom: 13.2,
    fleetCapacity: 215,
    activeVehiclesCount: 8,
    scheduledVehiclesCount: 8,
    onTimePerformancePct: 87.8,
    assignedRouteIds: ['MTA NYCT_Q3', 'MTA NYCT_Q10'],
    electricChargingBays: 22,
  },
  {
    id: 'LGA',
    code: 'LGA',
    name: 'LaGuardia Depot',
    division: 'Queens North Division',
    borough: 'Queens',
    address: '85-01 24th Ave, East Elmhurst, NY 11369',
    location: { lat: 40.7682, lng: -73.8825 },
    cameraZoom: 13.6,
    fleetCapacity: 195,
    activeVehiclesCount: 8,
    scheduledVehiclesCount: 8,
    onTimePerformancePct: 88.0,
    assignedRouteIds: ['MTA NYCT_Q33', 'MTA NYCT_Q72'],
    electricChargingBays: 20,
  },
  {
    id: 'BP',
    code: 'BP',
    name: 'Baisley Park Depot',
    division: 'Queens South Division',
    borough: 'Queens',
    address: '114-14 Guy R Brewer Blvd, Jamaica, NY 11434',
    location: { lat: 40.6845, lng: -73.7842 },
    cameraZoom: 13.3,
    fleetCapacity: 205,
    activeVehiclesCount: 7,
    scheduledVehiclesCount: 7,
    onTimePerformancePct: 83.4,
    assignedRouteIds: ['MTA NYCT_Q6', 'MTA NYCT_Q112'],
    electricChargingBays: 18,
  },
  {
    id: 'FR',
    code: 'FR',
    name: 'Far Rockaway Depot',
    division: 'Queens South Division',
    borough: 'Queens',
    address: '47-01 Rockaway Beach Blvd, Far Rockaway, NY 11691',
    location: { lat: 40.5942, lng: -73.7788 },
    cameraZoom: 13.1,
    fleetCapacity: 160,
    activeVehiclesCount: 6,
    scheduledVehiclesCount: 6,
    onTimePerformancePct: 91.2,
    assignedRouteIds: ['MTA NYCT_Q22', 'MTA NYCT_Q35'],
    electricChargingBays: 16,
  },
  {
    id: 'QV',
    code: 'QV',
    name: 'Queens Village Depot',
    division: 'Queens East Division',
    borough: 'Queens',
    address: '97-11 218th St, Queens Village, NY 11429',
    location: { lat: 40.7185, lng: -73.7372 },
    cameraZoom: 13.4,
    fleetCapacity: 230,
    activeVehiclesCount: 8,
    scheduledVehiclesCount: 8,
    onTimePerformancePct: 88.2,
    assignedRouteIds: ['MTA NYCT_Q43', 'MTA NYCT_Q88'],
    electricChargingBays: 24,
  },

  // --- ALL BROOKLYN DEPOTS ---
  {
    id: 'FB',
    code: 'FB',
    name: 'Flatbush Depot',
    division: 'Brooklyn South Division',
    borough: 'Brooklyn',
    address: '4901 Fillmore Ave, Brooklyn, NY 11234',
    location: { lat: 40.6152, lng: -73.9278 },
    cameraZoom: 13.5,
    fleetCapacity: 280,
    activeVehiclesCount: 12,
    scheduledVehiclesCount: 12,
    onTimePerformancePct: 82.6,
    assignedRouteIds: ['MTA NYCT_B44+', 'MTA NYCT_B41'],
    electricChargingBays: 34,
  },
  {
    id: 'ENY',
    code: 'ENY',
    name: 'East New York Depot',
    division: 'Brooklyn East Division',
    borough: 'Brooklyn',
    address: '1 Jamaica Ave, Brooklyn, NY 11207',
    location: { lat: 40.6785, lng: -73.8992 },
    cameraZoom: 13.6,
    fleetCapacity: 290,
    activeVehiclesCount: 11,
    scheduledVehiclesCount: 12,
    onTimePerformancePct: 84.1,
    assignedRouteIds: ['MTA NYCT_B12', 'MTA NYCT_B82+'],
    electricChargingBays: 36,
  },
  {
    id: 'GA',
    code: 'GA',
    name: 'Grand Avenue Depot',
    division: 'Brooklyn North Division',
    borough: 'Brooklyn',
    address: '48-05 Grand Ave, Maspeth / Williamsburg, NY 11378',
    location: { lat: 40.7185, lng: -73.9212 },
    cameraZoom: 13.6,
    fleetCapacity: 275,
    activeVehiclesCount: 26,
    scheduledVehiclesCount: 26,
    onTimePerformancePct: 85.8,
    assignedRouteIds: [
      'MTA NYCT_B38',
      'MTA NYCT_B62',
      'MTA NYCT_B57',
      'MTA NYCT_B60',
      'MTA NYCT_B24',
      'MTA NYCT_B39',
      'MTA NYCT_B43',
      'MTA NYCT_B47',
      'MTA NYCT_Q54',
      'MTA NYCT_Q59',
    ],
    electricChargingBays: 30,
  },
  {
    id: 'FP',
    code: 'FP',
    name: 'Fresh Pond Depot',
    division: 'Brooklyn / Queens Border Division',
    borough: 'Brooklyn',
    address: '66-99 Fresh Pond Rd, Ridgewood, NY 11385',
    location: { lat: 40.7072, lng: -73.8965 },
    cameraZoom: 13.5,
    fleetCapacity: 240,
    activeVehiclesCount: 9,
    scheduledVehiclesCount: 9,
    onTimePerformancePct: 86.4,
    assignedRouteIds: ['MTA NYCT_B26', 'MTA NYCT_B54'],
    electricChargingBays: 26,
  },
  {
    id: 'JG',
    code: 'JG',
    name: 'Jackie Gleason Depot',
    division: 'Brooklyn West Division',
    borough: 'Brooklyn',
    address: '845 5th Ave, Sunset Park, Brooklyn, NY 11232',
    location: { lat: 40.6558, lng: -74.0042 },
    cameraZoom: 13.5,
    fleetCapacity: 250,
    activeVehiclesCount: 9,
    scheduledVehiclesCount: 9,
    onTimePerformancePct: 88.5,
    assignedRouteIds: ['MTA NYCT_B37', 'MTA NYCT_B63'],
    electricChargingBays: 28,
  },
  {
    id: 'UP',
    code: 'UP',
    name: 'Ulmer Park Depot',
    division: 'Brooklyn South Division',
    borough: 'Brooklyn',
    address: '2449 Harway Ave, Bath Beach, Brooklyn, NY 11214',
    location: { lat: 40.5925, lng: -73.9928 },
    cameraZoom: 13.3,
    fleetCapacity: 235,
    activeVehiclesCount: 8,
    scheduledVehiclesCount: 8,
    onTimePerformancePct: 89.3,
    assignedRouteIds: ['MTA NYCT_B1', 'MTA NYCT_B4'],
    electricChargingBays: 22,
  },
  {
    id: 'SC',
    code: 'SC',
    name: 'Spring Creek Depot',
    division: 'Brooklyn East Division',
    borough: 'Brooklyn',
    address: '12755 Flatlands Ave, Brooklyn, NY 11208',
    location: { lat: 40.6525, lng: -73.8742 },
    cameraZoom: 13.3,
    fleetCapacity: 210,
    activeVehiclesCount: 7,
    scheduledVehiclesCount: 7,
    onTimePerformancePct: 87.1,
    assignedRouteIds: ['MTA NYCT_B83'],
    electricChargingBays: 20,
  },

  // --- MANHATTAN COMMAND HUBS (for cross-borough connectivity) ---
  {
    id: 'QUILL',
    code: 'MJQ',
    name: 'Michael J. Quill Depot',
    division: 'Manhattan Division',
    borough: 'Manhattan',
    address: '525 11th Ave, New York, NY 10018',
    location: { lat: 40.7602, lng: -73.9988 },
    cameraZoom: 13.8,
    fleetCapacity: 285,
    activeVehiclesCount: 14,
    scheduledVehiclesCount: 14,
    onTimePerformancePct: 86.4,
    assignedRouteIds: ['MTA NYCT_M15+', 'MTA NYCT_M34+'],
    electricChargingBays: 34,
  },
];

export interface RouteCatalogDefinition {
  route: ObaRoute;
  shapePoints: LatLngPoint[];
  stops: ObaStop[];
  headwayMinutes: number;
  runTimeMinutes: number;
  fleetSeeds: Array<{
    vehicleNumber: string;
    direction: '0' | '1';
    initialOffset: number;
    coachType: 'Articulated 60ft' | 'Standard 40ft Hybrid' | 'Battery-Electric 40ft';
    baseSpeedMph: number;
    adherenceSeconds: number;
    passengerLoad: number;
    capacity: number;
    blockSuffix: string;
  }>;
}

export const ROUTE_CATALOG: RouteCatalogDefinition[] = [
  // --- QUEENS ROUTES ---
  {
    route: {
      id: 'MTA NYCT_Q44+',
      shortName: 'Q44-SBS',
      longName: 'Bronx Zoo - Flushing Main St - Jamaica Select Bus Service',
      description: 'Via Whitestone Bridge / Main St Transit Mall',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '06B6D4',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'CS',
      borough: 'Queens',
      serviceTier: 'SBS',
    },
    headwayMinutes: 5,
    runTimeMinutes: 62,
    shapePoints: [
      { lat: 40.8421, lng: -73.8768 },
      { lat: 40.8350, lng: -73.8820 },
      { lat: 40.8250, lng: -73.8750 },
      { lat: 40.8175, lng: -73.8560 },
      { lat: 40.8090, lng: -73.8375 },
      { lat: 40.7950, lng: -73.8340 },
      { lat: 40.7798, lng: -73.8312 },
      { lat: 40.7645, lng: -73.8318 },
      { lat: 40.7595, lng: -73.8301 },
      { lat: 40.7535, lng: -73.8285 },
      { lat: 40.7480, lng: -73.8270 },
      { lat: 40.7418, lng: -73.8256 },
      { lat: 40.7320, lng: -73.8235 },
      { lat: 40.7254, lng: -73.8211 },
      { lat: 40.7160, lng: -73.8180 },
      { lat: 40.7065, lng: -73.8090 },
      { lat: 40.7024, lng: -73.8012 },
    ],
    stops: [
      { id: 'MTA_504401', lat: 40.8421, lon: -73.8768, direction: 'S', name: 'E 180 ST / BOSTON RD (BRONX ZOO)', code: '504401', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q44+'] },
      { id: 'MTA_504405', lat: 40.7798, lon: -73.8312, direction: 'S', name: 'WHITESTONE EXPWY / 20 AV', code: '504405', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q44+'] },
      { id: 'MTA_504409', lat: 40.7595, lon: -73.8301, direction: 'S', name: 'MAIN ST / ROOSEVELT AV (FLUSHING)', code: '504409', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q44+'] },
      { id: 'MTA_504413', lat: 40.7254, lon: -73.8211, direction: 'S', name: 'MAIN ST / JEWEL AV', code: '504413', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q44+'] },
      { id: 'MTA_504417', lat: 40.7024, lon: -73.8012, direction: 'S', name: 'ARCHER AV / SUTPHIN BLVD (JAMAICA LIRR)', code: '504417', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q44+'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '6104', direction: '1', initialOffset: 0.18, coachType: 'Articulated 60ft', baseSpeedMph: 21.4, adherenceSeconds: -15, passengerLoad: 82, capacity: 110, blockSuffix: 'Q44-02' },
      { vehicleNumber: '6118', direction: '1', initialOffset: 0.52, coachType: 'Articulated 60ft', baseSpeedMph: 16.8, adherenceSeconds: -110, passengerLoad: 94, capacity: 110, blockSuffix: 'Q44-06' },
      { vehicleNumber: '6129', direction: '0', initialOffset: 0.35, coachType: 'Articulated 60ft', baseSpeedMph: 19.2, adherenceSeconds: 25, passengerLoad: 72, capacity: 110, blockSuffix: 'Q44-10' },
      { vehicleNumber: '6142', direction: '0', initialOffset: 0.76, coachType: 'Articulated 60ft', baseSpeedMph: 20.5, adherenceSeconds: 0, passengerLoad: 65, capacity: 110, blockSuffix: 'Q44-14' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q32',
      shortName: 'Q32',
      longName: 'Penn Station - Jackson Heights Northern Blvd',
      description: 'Via Queensboro Bridge / Roosevelt Ave / Northern Blvd',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '10B981',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'CS',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 52,
    shapePoints: [
      { lat: 40.7505, lng: -73.9912 },
      { lat: 40.7548, lng: -73.9781 },
      { lat: 40.7634, lng: -73.9718 },
      { lat: 40.7571, lng: -73.9548 },
      { lat: 40.7502, lng: -73.9388 },
      { lat: 40.7442, lng: -73.9186 },
      { lat: 40.7468, lng: -73.8912 },
      { lat: 40.7552, lng: -73.8842 },
    ],
    stops: [
      { id: 'MTA_501901', lat: 40.7505, lon: -73.9912, direction: 'E', name: 'W 32 ST / 7 AV (PENN STATION)', code: '501901', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q32'] },
      { id: 'MTA_501905', lat: 40.7548, lon: -73.9781, direction: 'E', name: 'MADISON AV / E 45 ST', code: '501905', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q32'] },
      { id: 'MTA_501913', lat: 40.7502, lon: -73.9388, direction: 'E', name: 'QUEENS PLAZA S / 28 ST (LIC)', code: '501913', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q32'] },
      { id: 'MTA_501921', lat: 40.7468, lon: -73.8912, direction: 'E', name: 'ROOSEVELT AV / 74 ST (JACKSON HTS)', code: '501921', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q32'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8412', direction: '0', initialOffset: 0.22, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.3, adherenceSeconds: -20, passengerLoad: 52, capacity: 75, blockSuffix: 'Q32-02' },
      { vehicleNumber: '8429', direction: '1', initialOffset: 0.65, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 16.7, adherenceSeconds: 15, passengerLoad: 58, capacity: 75, blockSuffix: 'Q32-07' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q25',
      shortName: 'Q25',
      longName: 'College Point Poppenhusen - Jamaica LIRR Station',
      description: 'Via 127th St / Kissena Blvd / Parsons Blvd',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '3B82F6',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'CP',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 7,
    runTimeMinutes: 44,
    shapePoints: [
      { lat: 40.7912, lng: -73.8485 },
      { lat: 40.7685, lng: -73.8385 },
      { lat: 40.7542, lng: -73.8285 },
      { lat: 40.7325, lng: -73.8165 },
      { lat: 40.7025, lng: -73.8012 },
    ],
    stops: [
      { id: 'MTA_502501', lat: 40.7912, lon: -73.8485, direction: 'S', name: 'POPPENHUSEN AV / 119 ST (COLLEGE PT)', code: '502501', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q25'] },
      { id: 'MTA_502505', lat: 40.7542, lon: -73.8285, direction: 'S', name: 'KISSENA BLVD / MAIN ST (FLUSHING)', code: '502505', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q25'] },
      { id: 'MTA_502509', lat: 40.7025, lon: -73.8012, direction: 'S', name: 'PARSONS BLVD / ARCHER AV (JAMAICA)', code: '502509', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q25'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7810', direction: '1', initialOffset: 0.28, coachType: 'Battery-Electric 40ft', baseSpeedMph: 14.5, adherenceSeconds: -10, passengerLoad: 45, capacity: 75, blockSuffix: 'Q25-01' },
      { vehicleNumber: '7822', direction: '0', initialOffset: 0.71, coachType: 'Battery-Electric 40ft', baseSpeedMph: 15.2, adherenceSeconds: 20, passengerLoad: 50, capacity: 75, blockSuffix: 'Q25-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q4',
      shortName: 'Q4',
      longName: 'Jamaica Center Parsons/Archer - Cambria Heights 235th St',
      description: 'Via Linden Blvd / Murdock Ave Southeast Queens Spine',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'F59E0B',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'JA',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 6,
    runTimeMinutes: 38,
    shapePoints: [
      { lat: 40.7025, lng: -73.8012 },
      { lat: 40.6945, lng: -73.7712 },
      { lat: 40.6955, lng: -73.7425 },
      { lat: 40.6982, lng: -73.7225 },
    ],
    stops: [
      { id: 'MTA_500401', lat: 40.7025, lon: -73.8012, direction: 'E', name: 'PARSONS BLVD / ARCHER AV (JAMAICA CTR)', code: '500401', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q4'] },
      { id: 'MTA_500405', lat: 40.6945, lon: -73.7712, direction: 'E', name: 'LINDEN BLVD / FARMERS BLVD', code: '500405', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q4'] },
      { id: 'MTA_500409', lat: 40.6982, lon: -73.7225, direction: 'E', name: '235 ST / 119 AV (CAMBRIA HEIGHTS)', code: '500409', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q4'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7902', direction: '0', initialOffset: 0.32, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 16.8, adherenceSeconds: 0, passengerLoad: 56, capacity: 75, blockSuffix: 'Q4-02' },
      { vehicleNumber: '7915', direction: '1', initialOffset: 0.74, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.9, adherenceSeconds: -30, passengerLoad: 61, capacity: 75, blockSuffix: 'Q4-06' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q10',
      shortName: 'Q10',
      longName: 'Kew Gardens Union Turnpike - JFK Airport Lefferts Blvd',
      description: 'Via Lefferts Blvd / JFK AirTrain Terminal Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'EC4899',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'JFK',
      borough: 'Queens',
      serviceTier: 'LIMITED',
    },
    headwayMinutes: 7,
    runTimeMinutes: 36,
    shapePoints: [
      { lat: 40.7135, lng: -73.8305 },
      { lat: 40.6942, lng: -73.8295 },
      { lat: 40.6712, lng: -73.8245 },
      { lat: 40.6485, lng: -73.7885 },
    ],
    stops: [
      { id: 'MTA_501001', lat: 40.7135, lon: -73.8305, direction: 'S', name: 'KEW GARDENS / UNION TPKE (E/F SUBWAY)', code: '501001', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q10'] },
      { id: 'MTA_501005', lat: 40.6942, lon: -73.8295, direction: 'S', name: 'LEFFERTS BLVD / JAMAICA AV', code: '501005', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q10'] },
      { id: 'MTA_501009', lat: 40.6485, lon: -73.7885, direction: 'S', name: 'JFK AIRPORT / AIRTRAIN TERMINAL 5', code: '501009', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q10'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8021', direction: '1', initialOffset: 0.25, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 17.5, adherenceSeconds: -15, passengerLoad: 49, capacity: 75, blockSuffix: 'Q10-01' },
      { vehicleNumber: '8034', direction: '0', initialOffset: 0.68, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 18.2, adherenceSeconds: 10, passengerLoad: 54, capacity: 75, blockSuffix: 'Q10-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q33',
      shortName: 'Q33',
      longName: 'Jackson Heights 74th St - East Elmhurst Ditmars Blvd',
      description: 'Via 82nd St / 23rd Ave Airport Perimeter',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '8B5CF6',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'LGA',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 28,
    shapePoints: [
      { lat: 40.7468, lng: -73.8912 },
      { lat: 40.7582, lng: -73.8825 },
      { lat: 40.7682, lng: -73.8825 },
      { lat: 40.7745, lng: -73.8652 },
    ],
    stops: [
      { id: 'MTA_503301', lat: 40.7468, lon: -73.8912, direction: 'N', name: 'ROOSEVELT AV / 74 ST (JACKSON HTS)', code: '503301', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q33'] },
      { id: 'MTA_503305', lat: 40.7745, lon: -73.8652, direction: 'N', name: 'DITMARS BLVD / 94 ST (E ELMHURST)', code: '503305', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q33'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8145', direction: '0', initialOffset: 0.35, coachType: 'Battery-Electric 40ft', baseSpeedMph: 13.9, adherenceSeconds: -5, passengerLoad: 38, capacity: 75, blockSuffix: 'Q33-02' },
      { vehicleNumber: '8158', direction: '1', initialOffset: 0.81, coachType: 'Battery-Electric 40ft', baseSpeedMph: 14.4, adherenceSeconds: 15, passengerLoad: 42, capacity: 75, blockSuffix: 'Q33-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q6',
      shortName: 'Q6',
      longName: 'Jamaica Center Parsons/Archer - JFK Airport North Boundary',
      description: 'Via Guy R Brewer Blvd / Baisley Blvd / Rockaway Blvd Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'F97316',
      textColor: 'FFFFFF',
      agencyId: 'MTABC',
      depotId: 'BP',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 7,
    runTimeMinutes: 34,
    shapePoints: [
      { lat: 40.7025, lng: -73.8012 },
      { lat: 40.6925, lng: -73.7915 },
      { lat: 40.6845, lng: -73.7842 },
      { lat: 40.6695, lng: -73.7785 },
      { lat: 40.6585, lng: -73.7712 },
    ],
    stops: [
      { id: 'MTA_500601', lat: 40.7025, lon: -73.8012, direction: 'S', name: 'PARSONS BLVD / ARCHER AV (JAMAICA CTR)', code: '500601', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q6'] },
      { id: 'MTA_500605', lat: 40.6845, lon: -73.7842, direction: 'S', name: 'GUY R BREWER BLVD / BAISLEY BLVD (BAISLEY PARK DEPOT)', code: '500605', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q6'] },
      { id: 'MTA_500609', lat: 40.6585, lon: -73.7712, direction: 'S', name: 'JFK AIRPORT / NORTH BOUNDARY RD', code: '500609', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q6'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8211', direction: '1', initialOffset: 0.24, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 16.2, adherenceSeconds: -10, passengerLoad: 48, capacity: 75, blockSuffix: 'Q6-01' },
      { vehicleNumber: '8225', direction: '0', initialOffset: 0.72, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 17.0, adherenceSeconds: 15, passengerLoad: 52, capacity: 75, blockSuffix: 'Q6-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q22',
      shortName: 'Q22',
      longName: 'Roxbury Beach 169th St - Far Rockaway Mott Ave Station',
      description: 'Via Rockaway Beach Blvd / Beach Channel Dr Peninsula Trunk',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '06B6D4',
      textColor: 'FFFFFF',
      agencyId: 'MTABC',
      depotId: 'FR',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 9,
    runTimeMinutes: 46,
    shapePoints: [
      { lat: 40.5695, lng: -73.9015 },
      { lat: 40.5802, lng: -73.8375 },
      { lat: 40.5875, lng: -73.8135 },
      { lat: 40.5942, lng: -73.7788 },
      { lat: 40.6035, lng: -73.7532 },
    ],
    stops: [
      { id: 'MTA_502201', lat: 40.5695, lon: -73.9015, direction: 'E', name: 'BEACH 169 ST / FORT TILDEN (ROXBURY)', code: '502201', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q22'] },
      { id: 'MTA_502205', lat: 40.5802, lon: -73.8375, direction: 'E', name: 'BEACH 116 ST / ROCKAWAY BEACH BLVD (A SUBWAY)', code: '502205', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q22'] },
      { id: 'MTA_502209', lat: 40.5942, lon: -73.7788, direction: 'E', name: 'ROCKAWAY BEACH BLVD / BEACH 49 ST (FAR ROCKAWAY DEPOT)', code: '502209', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q22'] },
      { id: 'MTA_502213', lat: 40.6035, lon: -73.7532, direction: 'E', name: 'MOTT AV / BEACH 21 ST (FAR ROCKAWAY LIRR/A)', code: '502213', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q22'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8304', direction: '1', initialOffset: 0.31, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 17.5, adherenceSeconds: -5, passengerLoad: 41, capacity: 75, blockSuffix: 'Q22-01' },
      { vehicleNumber: '8318', direction: '0', initialOffset: 0.79, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 18.2, adherenceSeconds: 25, passengerLoad: 46, capacity: 75, blockSuffix: 'Q22-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q43',
      shortName: 'Q43',
      longName: 'Floral Park 268th St - Jamaica Center Archer Ave Subway',
      description: 'Via Hillside Ave Eastern Queens Subway Express Spine',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '10B981',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'QV',
      borough: 'Queens',
      serviceTier: 'LIMITED',
    },
    headwayMinutes: 6,
    runTimeMinutes: 40,
    shapePoints: [
      { lat: 40.7385, lng: -73.7082 },
      { lat: 40.7245, lng: -73.7382 },
      { lat: 40.7185, lng: -73.7372 },
      { lat: 40.7125, lng: -73.7845 },
      { lat: 40.7025, lng: -73.8012 },
    ],
    stops: [
      { id: 'MTA_504301', lat: 40.7385, lon: -73.7082, direction: 'W', name: 'HILLSIDE AV / 268 ST (FLORAL PARK)', code: '504301', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q43'] },
      { id: 'MTA_504305', lat: 40.7185, lon: -73.7372, direction: 'W', name: 'HILLSIDE AV / 218 ST (QUEENS VILLAGE DEPOT)', code: '504305', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q43'] },
      { id: 'MTA_504309', lat: 40.7125, lon: -73.7845, direction: 'W', name: 'HILLSIDE AV / 179 ST (F SUBWAY TERMINAL)', code: '504309', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q43'] },
      { id: 'MTA_504313', lat: 40.7025, lon: -73.8012, direction: 'W', name: 'ARCHER AV / PARSONS BLVD (JAMAICA CTR)', code: '504313', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q43'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8502', direction: '1', initialOffset: 0.22, coachType: 'Battery-Electric 40ft', baseSpeedMph: 15.8, adherenceSeconds: 0, passengerLoad: 58, capacity: 75, blockSuffix: 'Q43-02' },
      { vehicleNumber: '8519', direction: '0', initialOffset: 0.67, coachType: 'Battery-Electric 40ft', baseSpeedMph: 16.4, adherenceSeconds: -15, passengerLoad: 64, capacity: 75, blockSuffix: 'Q43-07' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q48',
      shortName: 'Q48',
      longName: 'Flushing Main St - LaGuardia Airport Marine Air Terminal',
      description: 'Via Roosevelt Ave / Ditmars Blvd Flushing Airport Connection',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '2563EB',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'CS',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 9,
    runTimeMinutes: 32,
    shapePoints: [
      { lat: 40.7595, lng: -73.8302 },
      { lat: 40.7565, lng: -73.8432 },
      { lat: 40.7612, lng: -73.8582 },
      { lat: 40.7712, lng: -73.8732 },
      { lat: 40.7735, lng: -73.8852 },
    ],
    stops: [
      { id: 'MTA_504801', lat: 40.7595, lon: -73.8302, direction: 'W', name: 'MAIN ST / ROOSEVELT AV (FLUSHING)', code: '504801', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q48'] },
      { id: 'MTA_504805', lat: 40.7565, lon: -73.8432, direction: 'W', name: 'WILLETS POINT BLVD / ROOSEVELT AV (CASEY STENGEL DEPOT)', code: '504805', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q48'] },
      { id: 'MTA_504809', lat: 40.7735, lon: -73.8852, direction: 'W', name: 'LGA AIRPORT / MARINE AIR TERMINAL (TERMINAL A)', code: '504809', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q48'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8610', direction: '1', initialOffset: 0.18, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.8, adherenceSeconds: 10, passengerLoad: 45, capacity: 75, blockSuffix: 'Q48-01' },
      { vehicleNumber: '8624', direction: '0', initialOffset: 0.62, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.2, adherenceSeconds: -5, passengerLoad: 50, capacity: 75, blockSuffix: 'Q48-03' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q65',
      shortName: 'Q65',
      longName: 'College Point 110th St - Jamaica LIRR / Sutphin Blvd',
      description: 'Via 14th Ave / College Point Blvd / 164th St Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '0D9488',
      textColor: 'FFFFFF',
      agencyId: 'MTABC',
      depotId: 'CP',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 44,
    shapePoints: [
      { lat: 40.7845, lng: -73.8452 },
      { lat: 40.7725, lng: -73.8492 },
      { lat: 40.7582, lng: -73.8315 },
      { lat: 40.7325, lng: -73.8052 },
      { lat: 40.7005, lng: -73.8082 },
    ],
    stops: [
      { id: 'MTA_506501', lat: 40.7845, lon: -73.8452, direction: 'S', name: '110 ST / 14 AV (COLLEGE POINT NORTH)', code: '506501', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q65'] },
      { id: 'MTA_506505', lat: 40.7725, lon: -73.8492, direction: 'S', name: 'COLLEGE POINT BLVD / 28 AV (COLLEGE POINT DEPOT)', code: '506505', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q65'] },
      { id: 'MTA_506509', lat: 40.7005, lon: -73.8082, direction: 'S', name: 'SUTPHIN BLVD / 94 AV (JAMAICA STATION LIRR/E/J/Z)', code: '506509', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q65'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8632', direction: '1', initialOffset: 0.28, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.6, adherenceSeconds: -10, passengerLoad: 52, capacity: 75, blockSuffix: 'Q65-02' },
      { vehicleNumber: '8647', direction: '0', initialOffset: 0.74, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 16.0, adherenceSeconds: 20, passengerLoad: 48, capacity: 75, blockSuffix: 'Q65-06' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q5',
      shortName: 'Q5',
      longName: 'Jamaica Center Parsons/Archer - Rosedale Green Acres',
      description: 'Via Merrick Blvd / Hook Creek Blvd Southeast Queens Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'EA580C',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'JA',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 6,
    runTimeMinutes: 38,
    shapePoints: [
      { lat: 40.7025, lng: -73.8012 },
      { lat: 40.6975, lng: -73.7912 },
      { lat: 40.6812, lng: -73.7635 },
      { lat: 40.6655, lng: -73.7312 },
      { lat: 40.6582, lng: -73.7195 },
    ],
    stops: [
      { id: 'MTA_500501', lat: 40.7025, lon: -73.8012, direction: 'E', name: 'PARSONS BLVD / ARCHER AV (JAMAICA CTR E/J/Z)', code: '500501', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q5'] },
      { id: 'MTA_500505', lat: 40.6975, lon: -73.7912, direction: 'E', name: 'MERRICK BLVD / SOUTH RD (JAMAICA DEPOT)', code: '500505', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q5'] },
      { id: 'MTA_500509', lat: 40.6582, lon: -73.7195, direction: 'E', name: 'GREEN ACRES MALL / SUNRISE HWY (ROSEDALE)', code: '500509', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q5'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8655', direction: '1', initialOffset: 0.32, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 16.5, adherenceSeconds: 0, passengerLoad: 55, capacity: 75, blockSuffix: 'Q5-01' },
      { vehicleNumber: '8668', direction: '0', initialOffset: 0.81, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 17.1, adherenceSeconds: -15, passengerLoad: 61, capacity: 75, blockSuffix: 'Q5-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q3',
      shortName: 'Q3',
      longName: 'Jamaica 179th St Subway - JFK Airport Terminal 5',
      description: 'Via Hillside Ave / Farmers Blvd / JFK Expressway',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '0284C7',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'JFK',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 36,
    shapePoints: [
      { lat: 40.7125, lng: -73.7845 },
      { lat: 40.6912, lng: -73.7652 },
      { lat: 40.6685, lng: -73.7745 },
      { lat: 40.6625, lng: -73.7785 },
      { lat: 40.6485, lng: -73.7885 },
    ],
    stops: [
      { id: 'MTA_500301', lat: 40.7125, lon: -73.7845, direction: 'S', name: 'HILLSIDE AV / 179 ST (F SUBWAY STATION)', code: '500301', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q3'] },
      { id: 'MTA_500305', lat: 40.6625, lon: -73.7785, direction: 'S', name: '147 AV / 165 ST (JFK DEPOT)', code: '500305', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q3'] },
      { id: 'MTA_500309', lat: 40.6485, lon: -73.7885, direction: 'S', name: 'JFK AIRPORT / AIRTRAIN TERMINAL 5', code: '500309', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q3'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8671', direction: '1', initialOffset: 0.25, coachType: 'Battery-Electric 40ft', baseSpeedMph: 16.8, adherenceSeconds: -5, passengerLoad: 44, capacity: 75, blockSuffix: 'Q3-02' },
      { vehicleNumber: '8684', direction: '0', initialOffset: 0.69, coachType: 'Battery-Electric 40ft', baseSpeedMph: 17.4, adherenceSeconds: 10, passengerLoad: 49, capacity: 75, blockSuffix: 'Q3-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q72',
      shortName: 'Q72',
      longName: 'Rego Park 63rd Dr - LaGuardia Airport Terminals B/C',
      description: 'Via Junction Blvd / 94th St Airport Express Link',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '7C3AED',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'LGA',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 9,
    runTimeMinutes: 30,
    shapePoints: [
      { lat: 40.7295, lng: -73.8612 },
      { lat: 40.7485, lng: -73.8682 },
      { lat: 40.7682, lng: -73.8825 },
      { lat: 40.7735, lng: -73.8725 },
    ],
    stops: [
      { id: 'MTA_507201', lat: 40.7295, lon: -73.8612, direction: 'N', name: '63 DR / QUEENS BLVD (REGO PARK M/R SUBWAY)', code: '507201', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q72'] },
      { id: 'MTA_507205', lat: 40.7682, lon: -73.8825, direction: 'N', name: '24 AV / 85 ST (LAGUARDIA DEPOT)', code: '507205', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q72'] },
      { id: 'MTA_507209', lat: 40.7735, lon: -73.8725, direction: 'N', name: 'LGA AIRPORT / CENTRAL TERMINAL B', code: '507209', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q72'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8692', direction: '1', initialOffset: 0.36, coachType: 'Battery-Electric 40ft', baseSpeedMph: 15.0, adherenceSeconds: 15, passengerLoad: 39, capacity: 75, blockSuffix: 'Q72-01' },
      { vehicleNumber: '8705', direction: '0', initialOffset: 0.77, coachType: 'Battery-Electric 40ft', baseSpeedMph: 15.5, adherenceSeconds: -10, passengerLoad: 43, capacity: 75, blockSuffix: 'Q72-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q112',
      shortName: 'Q112',
      longName: 'Jamaica Parsons Blvd - Ozone Park Liberty Ave',
      description: 'Via Liberty Ave Queens-Brooklyn Border Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'D97706',
      textColor: 'FFFFFF',
      agencyId: 'MTABC',
      depotId: 'BP',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 32,
    shapePoints: [
      { lat: 40.7025, lng: -73.8012 },
      { lat: 40.6912, lng: -73.8132 },
      { lat: 40.6845, lng: -73.7842 },
      { lat: 40.6825, lng: -73.8425 },
      { lat: 40.6812, lng: -73.8612 },
    ],
    stops: [
      { id: 'MTA_511201', lat: 40.7025, lon: -73.8012, direction: 'W', name: 'PARSONS BLVD / ARCHER AV (JAMAICA CTR)', code: '511201', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q112'] },
      { id: 'MTA_511205', lat: 40.6845, lon: -73.7842, direction: 'W', name: 'LIBERTY AV / GUY R BREWER (BAISLEY PARK DEPOT)', code: '511205', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q112'] },
      { id: 'MTA_511209', lat: 40.6812, lon: -73.8612, direction: 'W', name: 'LIBERTY AV / 77 ST (OZONE PARK A SUBWAY)', code: '511209', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q112'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8712', direction: '1', initialOffset: 0.19, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.5, adherenceSeconds: -5, passengerLoad: 47, capacity: 75, blockSuffix: 'Q112-01' },
      { vehicleNumber: '8728', direction: '0', initialOffset: 0.65, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.0, adherenceSeconds: 15, passengerLoad: 51, capacity: 75, blockSuffix: 'Q112-03' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q35',
      shortName: 'Q35',
      longName: 'Rockaway Park Beach 116th St - Flatbush Ave Brooklyn College',
      description: 'Via Marine Parkway Gil Hodges Memorial Bridge Cross-Bay Spine',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '0891B2',
      textColor: 'FFFFFF',
      agencyId: 'MTABC',
      depotId: 'FR',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 10,
    runTimeMinutes: 45,
    shapePoints: [
      { lat: 40.5802, lng: -73.8375 },
      { lat: 40.5732, lng: -73.8812 },
      { lat: 40.5942, lng: -73.7788 },
      { lat: 40.5795, lng: -73.8952 },
      { lat: 40.6012, lng: -73.9182 },
      { lat: 40.6325, lng: -73.9472 },
    ],
    stops: [
      { id: 'MTA_503501', lat: 40.5802, lon: -73.8375, direction: 'N', name: 'BEACH 116 ST / ROCKAWAY BEACH BLVD (A SUBWAY)', code: '503501', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q35'] },
      { id: 'MTA_503505', lat: 40.5795, lon: -73.8952, direction: 'N', name: 'MARINE PARKWAY BRIDGE / RIIS PARK', code: '503505', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q35'] },
      { id: 'MTA_503509', lat: 40.6325, lon: -73.9472, direction: 'N', name: 'FLATBUSH AV / NOSTRAND AV (BROOKLYN COLLEGE 2/5)', code: '503509', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q35'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8734', direction: '1', initialOffset: 0.31, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 17.8, adherenceSeconds: 0, passengerLoad: 42, capacity: 75, blockSuffix: 'Q35-02' },
      { vehicleNumber: '8749', direction: '0', initialOffset: 0.78, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 18.4, adherenceSeconds: -15, passengerLoad: 46, capacity: 75, blockSuffix: 'Q35-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q88',
      shortName: 'Q88',
      longName: 'Elmhurst Queens Center Mall - Queens Village 230th St',
      description: 'Via Horace Harding Expressway / 188th St Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '059669',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'QV',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 42,
    shapePoints: [
      { lat: 40.7335, lng: -73.8712 },
      { lat: 40.7412, lng: -73.8325 },
      { lat: 40.7385, lng: -73.7845 },
      { lat: 40.7185, lng: -73.7372 },
    ],
    stops: [
      { id: 'MTA_508801', lat: 40.7335, lon: -73.8712, direction: 'E', name: 'QUEENS BLVD / WOODHAVEN BLVD (QUEENS CTR MALL)', code: '508801', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q88'] },
      { id: 'MTA_508805', lat: 40.7185, lon: -73.7372, direction: 'E', name: '218 ST / 97 AV (QUEENS VILLAGE DEPOT)', code: '508805', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q88'] },
      { id: 'MTA_508809', lat: 40.7145, lon: -73.7295, direction: 'E', name: '230 ST / HILLSIDE AV (QUEENS VILLAGE)', code: '508809', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q88'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '8755', direction: '1', initialOffset: 0.24, coachType: 'Battery-Electric 40ft', baseSpeedMph: 15.6, adherenceSeconds: 10, passengerLoad: 50, capacity: 75, blockSuffix: 'Q88-01' },
      { vehicleNumber: '8768', direction: '0', initialOffset: 0.72, coachType: 'Battery-Electric 40ft', baseSpeedMph: 16.2, adherenceSeconds: -10, passengerLoad: 56, capacity: 75, blockSuffix: 'Q88-04' },
    ],
  },

  // --- BROOKLYN ROUTES ---
  {
    route: {
      id: 'MTA NYCT_B44+',
      shortName: 'B44-SBS',
      longName: 'Williamsburg Bridge Plaza - Sheepshead Bay Nostrand SBS',
      description: 'Via Bedford Ave / Nostrand Ave Select Bus Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '06B6D4',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'FB',
      borough: 'Brooklyn',
      serviceTier: 'SBS',
    },
    headwayMinutes: 5,
    runTimeMinutes: 54,
    shapePoints: [
      { lat: 40.7098, lng: -73.9595 },
      { lat: 40.6895, lng: -73.9522 },
      { lat: 40.6698, lng: -73.9504 },
      { lat: 40.6508, lng: -73.9494 },
      { lat: 40.6328, lng: -73.9476 },
      { lat: 40.6085, lng: -73.9438 },
      { lat: 40.5835, lng: -73.9389 },
    ],
    stops: [
      { id: 'MTA_304401', lat: 40.7098, lon: -73.9595, direction: 'S', name: 'WILLIAMSBURG BRIDGE PLAZA / HAVEMEYER', code: '304401', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B44+'] },
      { id: 'MTA_304405', lat: 40.6895, lon: -73.9522, direction: 'S', name: 'NOSTRAND AV / FULTON ST (LIRR)', code: '304405', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B44+'] },
      { id: 'MTA_304409', lat: 40.6698, lon: -73.9504, direction: 'S', name: 'NOSTRAND AV / EASTERN PKWY', code: '304409', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B44+'] },
      { id: 'MTA_304413', lat: 40.6328, lon: -73.9476, direction: 'S', name: 'FLATBUSH AV / NOSTRAND AV (THE JUNCTION)', code: '304413', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B44+'] },
      { id: 'MTA_304417', lat: 40.5835, lon: -73.9389, direction: 'S', name: 'KNAPP ST / EMMONS AV (SHEEPSHEAD BAY)', code: '304417', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B44+'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '6301', direction: '1', initialOffset: 0.16, coachType: 'Articulated 60ft', baseSpeedMph: 14.5, adherenceSeconds: -25, passengerLoad: 78, capacity: 110, blockSuffix: 'B44-01' },
      { vehicleNumber: '6314', direction: '1', initialOffset: 0.54, coachType: 'Articulated 60ft', baseSpeedMph: 13.8, adherenceSeconds: -140, passengerLoad: 92, capacity: 110, blockSuffix: 'B44-06' },
      { vehicleNumber: '6328', direction: '0', initialOffset: 0.39, coachType: 'Articulated 60ft', baseSpeedMph: 15.2, adherenceSeconds: 15, passengerLoad: 68, capacity: 110, blockSuffix: 'B44-11' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B41',
      shortName: 'B41',
      longName: 'Downtown Brooklyn Cadman Plaza - Kings Plaza Flatbush Ave',
      description: 'Via Flatbush Avenue Brooklyn Trunk Spine',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '3B82F6',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'FB',
      borough: 'Brooklyn',
      serviceTier: 'LIMITED',
    },
    headwayMinutes: 6,
    runTimeMinutes: 46,
    shapePoints: [
      { lat: 40.6942, lng: -73.9896 },
      { lat: 40.6845, lng: -73.9776 },
      { lat: 40.6728, lng: -73.9698 },
      { lat: 40.6502, lng: -73.9585 },
      { lat: 40.6328, lng: -73.9476 },
      { lat: 40.6102, lng: -73.9225 },
    ],
    stops: [
      { id: 'MTA_304101', lat: 40.6942, lon: -73.9896, direction: 'S', name: 'CADMAN PLAZA W / TILLARY ST (DOWNTOWN)', code: '304101', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B41'] },
      { id: 'MTA_304105', lat: 40.6845, lon: -73.9776, direction: 'S', name: 'FLATBUSH AV / ATLANTIC AV (BARCLAYS CTR)', code: '304105', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B41'] },
      { id: 'MTA_304109', lat: 40.6728, lon: -73.9698, direction: 'S', name: 'GRAND ARMY PLAZA / PROSPECT PARK', code: '304109', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B41'] },
      { id: 'MTA_304113', lat: 40.6102, lon: -73.9225, direction: 'S', name: 'FLATBUSH AV / AV U (KINGS PLAZA MALL)', code: '304113', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B41'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7408', direction: '1', initialOffset: 0.22, coachType: 'Battery-Electric 40ft', baseSpeedMph: 13.9, adherenceSeconds: -10, passengerLoad: 56, capacity: 75, blockSuffix: 'B41-02' },
      { vehicleNumber: '7419', direction: '0', initialOffset: 0.69, coachType: 'Battery-Electric 40ft', baseSpeedMph: 14.7, adherenceSeconds: 20, passengerLoad: 62, capacity: 75, blockSuffix: 'B41-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B82+',
      shortName: 'B82-SBS',
      longName: 'Coney Island Stillwell Ave - Spring Creek Starrett City SBS',
      description: 'Via Kings Hwy / Flatlands Ave South Brooklyn Crosstown',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '0284C7',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'ENY',
      borough: 'Brooklyn',
      serviceTier: 'SBS',
    },
    headwayMinutes: 6,
    runTimeMinutes: 50,
    shapePoints: [
      { lat: 40.5772, lng: -73.9815 },
      { lat: 40.5985, lng: -73.9682 },
      { lat: 40.6125, lng: -73.9452 },
      { lat: 40.6312, lng: -73.9185 },
      { lat: 40.6525, lng: -73.8742 },
    ],
    stops: [
      { id: 'MTA_308201', lat: 40.5772, lon: -73.9815, direction: 'E', name: 'STILLWELL AV / MERMAID AV (CONEY ISLAND)', code: '308201', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B82+'] },
      { id: 'MTA_308205', lat: 40.6125, lon: -73.9452, direction: 'E', name: 'KINGS HWY / NOSTRAND AV', code: '308205', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B82+'] },
      { id: 'MTA_308209', lat: 40.6525, lon: -73.8742, direction: 'E', name: 'PENNSYLVANIA AV / FLATLANDS (SPRING CRK)', code: '308209', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B82+'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '6402', direction: '0', initialOffset: 0.28, coachType: 'Articulated 60ft', baseSpeedMph: 16.2, adherenceSeconds: 15, passengerLoad: 72, capacity: 110, blockSuffix: 'B82-01' },
      { vehicleNumber: '6419', direction: '1', initialOffset: 0.72, coachType: 'Articulated 60ft', baseSpeedMph: 15.5, adherenceSeconds: -30, passengerLoad: 80, capacity: 110, blockSuffix: 'B82-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B38',
      shortName: 'B38',
      longName: 'Downtown Brooklyn Cadman Plaza - Ridgewood Metropolitan Ave',
      description: 'Via Fulton St / DeKalb Ave / Lafayette Ave Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '10B981',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Brooklyn',
      serviceTier: 'LIMITED',
    },
    headwayMinutes: 7,
    runTimeMinutes: 42,
    shapePoints: [
      { lat: 40.6942, lng: -73.9896 },
      { lat: 40.6895, lng: -73.9685 },
      { lat: 40.6925, lng: -73.9385 },
      { lat: 40.7112, lng: -73.9042 },
    ],
    stops: [
      { id: 'MTA_303801', lat: 40.6942, lon: -73.9896, direction: 'E', name: 'CADMAN PLAZA W / TILLARY ST', code: '303801', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B38'] },
      { id: 'MTA_303805', lat: 40.6895, lon: -73.9685, direction: 'E', name: 'DEKALB AV / VANDERBILT AV (FORT GREENE)', code: '303805', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B38'] },
      { id: 'MTA_303809', lat: 40.7112, lon: -73.9042, direction: 'E', name: 'METROPOLITAN AV / 69 ST (RIDGEWOOD)', code: '303809', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B38'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7504', direction: '0', initialOffset: 0.31, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 13.8, adherenceSeconds: 10, passengerLoad: 48, capacity: 75, blockSuffix: 'B38-02' },
      { vehicleNumber: '7518', direction: '1', initialOffset: 0.77, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 12.9, adherenceSeconds: -45, passengerLoad: 53, capacity: 75, blockSuffix: 'B38-06' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B63',
      shortName: 'B63',
      longName: 'Pier 6 Brooklyn Bridge Park - Bay Ridge Shore Rd',
      description: 'Via 5th Avenue Brooklyn Spine',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'A855F7',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'JG',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 48,
    shapePoints: [
      { lat: 40.6912, lng: -73.9998 },
      { lat: 40.6782, lng: -73.9842 },
      { lat: 40.6558, lng: -74.0042 },
      { lat: 40.6212, lng: -74.0315 },
    ],
    stops: [
      { id: 'MTA_306301', lat: 40.6912, lon: -73.9998, direction: 'S', name: 'ATLANTIC AV / FURMAN ST (BK BRIDGE PARK)', code: '306301', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B63'] },
      { id: 'MTA_306305', lat: 40.6558, lon: -74.0042, direction: 'S', name: '5 AV / 36 ST (SUNSET PARK)', code: '306305', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B63'] },
      { id: 'MTA_306309', lat: 40.6212, lon: -74.0315, direction: 'S', name: '4 AV / 86 ST (BAY RIDGE SUBWAY)', code: '306309', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B63'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7603', direction: '1', initialOffset: 0.29, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.1, adherenceSeconds: -15, passengerLoad: 44, capacity: 75, blockSuffix: 'B63-01' },
      { vehicleNumber: '7619', direction: '0', initialOffset: 0.64, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.8, adherenceSeconds: 20, passengerLoad: 50, capacity: 75, blockSuffix: 'B63-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B1',
      shortName: 'B1',
      longName: 'Bay Ridge 4th Ave 87th St - Manhattan Beach Kingsborough CC',
      description: 'Via 86th St / Avenue X / Ocean Ave Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'F59E0B',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'UP',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 44,
    shapePoints: [
      { lat: 40.6212, lng: -74.0315 },
      { lat: 40.6025, lng: -73.9982 },
      { lat: 40.5925, lng: -73.9682 },
      { lat: 40.5785, lng: -73.9385 },
    ],
    stops: [
      { id: 'MTA_300101', lat: 40.6212, lon: -74.0315, direction: 'E', name: '4 AV / 87 ST (BAY RIDGE)', code: '300101', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B1'] },
      { id: 'MTA_300105', lat: 40.5785, lon: -73.9385, direction: 'E', name: 'ORIENTAL BLVD / MACKENZIE (KINGSBOROUGH)', code: '300105', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B1'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7708', direction: '0', initialOffset: 0.33, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.6, adherenceSeconds: 0, passengerLoad: 46, capacity: 75, blockSuffix: 'B1-02' },
      { vehicleNumber: '7721', direction: '1', initialOffset: 0.78, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 16.1, adherenceSeconds: -20, passengerLoad: 41, capacity: 75, blockSuffix: 'B1-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B26',
      shortName: 'B26',
      longName: 'Downtown Brooklyn Cadman Plaza - Ridgewood Terminal',
      description: 'Via Fulton St / Halsey St / Wyckoff Ave Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '3B82F6',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'FP',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 7,
    runTimeMinutes: 42,
    shapePoints: [
      { lat: 40.6942, lng: -73.9896 },
      { lat: 40.6865, lng: -73.9612 },
      { lat: 40.6835, lng: -73.9312 },
      { lat: 40.6925, lng: -73.9085 },
      { lat: 40.7072, lng: -73.8965 },
    ],
    stops: [
      { id: 'MTA_302601', lat: 40.6942, lon: -73.9896, direction: 'E', name: 'CADMAN PLAZA W / TILLARY ST (DOWNTOWN)', code: '302601', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B26'] },
      { id: 'MTA_302605', lat: 40.6835, lon: -73.9312, direction: 'E', name: 'HALSEY ST / THROOP AV (BED-STUY)', code: '302605', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B26'] },
      { id: 'MTA_302609', lat: 40.7072, lon: -73.8965, direction: 'E', name: 'FRESH POND RD / 67 AV (FRESH POND DEPOT)', code: '302609', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B26'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7104', direction: '1', initialOffset: 0.26, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 13.9, adherenceSeconds: 10, passengerLoad: 47, capacity: 75, blockSuffix: 'B26-01' },
      { vehicleNumber: '7118', direction: '0', initialOffset: 0.74, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.5, adherenceSeconds: -20, passengerLoad: 52, capacity: 75, blockSuffix: 'B26-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B83',
      shortName: 'B83',
      longName: 'Spring Creek Starrett City - Broadway Junction Transit Center',
      description: 'Via Pennsylvania Ave / Van Sinderen Ave South Brooklyn Connector',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'EC4899',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'SC',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 32,
    shapePoints: [
      { lat: 40.6442, lng: -73.8825 },
      { lat: 40.6525, lng: -73.8742 },
      { lat: 40.6655, lng: -73.8895 },
      { lat: 40.6785, lng: -73.9042 },
    ],
    stops: [
      { id: 'MTA_308301', lat: 40.6442, lon: -73.8825, direction: 'N', name: 'SEAVIEW AV / PENNSYLVANIA AV (STARRETT CITY)', code: '308301', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B83'] },
      { id: 'MTA_308305', lat: 40.6525, lon: -73.8742, direction: 'N', name: 'FLATLANDS AV / 105 ST (SPRING CREEK DEPOT)', code: '308305', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B83'] },
      { id: 'MTA_308309', lat: 40.6785, lon: -73.9042, direction: 'N', name: 'BROADWAY JUNCTION / VAN SINDEREN AV (A/C/J/L)', code: '308309', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B83'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7205', direction: '1', initialOffset: 0.35, coachType: 'Battery-Electric 40ft', baseSpeedMph: 15.2, adherenceSeconds: -10, passengerLoad: 39, capacity: 75, blockSuffix: 'B83-02' },
      { vehicleNumber: '7222', direction: '0', initialOffset: 0.82, coachType: 'Battery-Electric 40ft', baseSpeedMph: 16.0, adherenceSeconds: 15, passengerLoad: 43, capacity: 75, blockSuffix: 'B83-06' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B12',
      shortName: 'B12',
      longName: 'Lefferts Gardens Ocean Ave - East New York Alabama Ave',
      description: 'Via Clarkson Ave / Albany Ave / East New York Ave Cross-Borough',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '6366F1',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'ENY',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 38,
    shapePoints: [
      { lat: 40.6565, lng: -73.9595 },
      { lat: 40.6582, lng: -73.9382 },
      { lat: 40.6652, lng: -73.9182 },
      { lat: 40.6785, lng: -73.8992 },
    ],
    stops: [
      { id: 'MTA_301201', lat: 40.6565, lon: -73.9595, direction: 'E', name: 'OCEAN AV / PARKISDE AV (Q SUBWAY)', code: '301201', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B12'] },
      { id: 'MTA_301205', lat: 40.6652, lon: -73.9182, direction: 'E', name: 'EAST NEW YORK AV / UTICA AV (CROW HILL)', code: '301205', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B12'] },
      { id: 'MTA_301209', lat: 40.6785, lon: -73.8992, direction: 'E', name: 'ALABAMA AV / FULTON ST (EAST NEW YORK DEPOT J/Z)', code: '301209', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B12'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7302', direction: '1', initialOffset: 0.28, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.5, adherenceSeconds: -5, passengerLoad: 48, capacity: 75, blockSuffix: 'B12-01' },
      { vehicleNumber: '7319', direction: '0', initialOffset: 0.73, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.0, adherenceSeconds: 15, passengerLoad: 53, capacity: 75, blockSuffix: 'B12-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B62',
      shortName: 'B62',
      longName: 'Downtown Brooklyn Boerum Pl - Long Island City Queens Plaza',
      description: 'Via Manhattan Ave / Bedford Ave / Jackson Ave East River Line',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '065F46',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 9,
    runTimeMinutes: 44,
    shapePoints: [
      { lat: 40.6925, lng: -73.9892 },
      { lat: 40.7045, lng: -73.9625 },
      { lat: 40.7185, lng: -73.9212 },
      { lat: 40.7312, lng: -73.9532 },
      { lat: 40.7485, lng: -73.9385 },
    ],
    stops: [
      { id: 'MTA_306201', lat: 40.6925, lon: -73.9892, direction: 'N', name: 'BOERUM PL / LIVINGSTON ST (DOWNTOWN BROOKLYN)', code: '306201', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B62'] },
      { id: 'MTA_306205', lat: 40.7185, lon: -73.9212, direction: 'N', name: 'GRAND AV / FLUSHING AV (GRAND AVENUE DEPOT)', code: '306205', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B62'] },
      { id: 'MTA_306209', lat: 40.7485, lon: -73.9385, direction: 'N', name: 'QUEENS PLAZA SOUTH / 28 ST (LIC E/M/R/7)', code: '306209', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B62'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7331', direction: '1', initialOffset: 0.31, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.8, adherenceSeconds: 0, passengerLoad: 46, capacity: 75, blockSuffix: 'B62-02' },
      { vehicleNumber: '7348', direction: '0', initialOffset: 0.79, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.3, adherenceSeconds: -15, passengerLoad: 50, capacity: 75, blockSuffix: 'B62-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B57',
      shortName: 'B57',
      longName: 'Red Hook Beard St - Maspeth Fresh Pond Rd',
      description: 'Via Flushing Ave / Court St / Navy Yard Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'F59E0B',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 48,
    shapePoints: [
      { lat: 40.6725, lng: -74.0112 },
      { lat: 40.6865, lng: -73.9962 },
      { lat: 40.6975, lng: -73.9785 },
      { lat: 40.7005, lng: -73.9555 },
      { lat: 40.7075, lng: -73.9315 },
      { lat: 40.7185, lng: -73.9212 },
    ],
    stops: [
      { id: 'MTA_305701', lat: 40.6725, lon: -74.0112, direction: 'E', name: 'BEARD ST / VAN BRUNT ST (RED HOOK IKEA)', code: '305701', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B57'] },
      { id: 'MTA_305705', lat: 40.6975, lon: -73.9785, direction: 'E', name: 'FLUSHING AV / VANDERBILT AV (NAVY YARD)', code: '305705', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B57'] },
      { id: 'MTA_305709', lat: 40.7005, lon: -73.9555, direction: 'E', name: 'FLUSHING AV / BEDFORD AV (WILLIAMSBURG)', code: '305709', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B57'] },
      { id: 'MTA_305713', lat: 40.7185, lon: -73.9212, direction: 'E', name: 'GRAND AV / FLUSHING AV (GRAND AVENUE DEPOT)', code: '305713', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B57'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7410', direction: '0', initialOffset: 0.25, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 13.5, adherenceSeconds: 20, passengerLoad: 42, capacity: 75, blockSuffix: 'B57-01' },
      { vehicleNumber: '7422', direction: '1', initialOffset: 0.68, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.1, adherenceSeconds: -30, passengerLoad: 55, capacity: 75, blockSuffix: 'B57-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B60',
      shortName: 'B60',
      longName: 'Williamsburg Bridge Plaza - Canarsie Rockaway Pkwy',
      description: 'Via Wilson Ave / Rockaway Ave Spine',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'EC4899',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 7,
    runTimeMinutes: 46,
    shapePoints: [
      { lat: 40.7095, lng: -73.9592 },
      { lat: 40.7035, lng: -73.9362 },
      { lat: 40.6905, lng: -73.9142 },
      { lat: 40.6725, lng: -73.9082 },
      { lat: 40.6485, lng: -73.9022 },
    ],
    stops: [
      { id: 'MTA_306001', lat: 40.7095, lon: -73.9592, direction: 'S', name: 'WILLIAMSBURG BRIDGE PLAZA (LANE 4)', code: '306001', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B60'] },
      { id: 'MTA_306005', lat: 40.6905, lon: -73.9142, direction: 'S', name: 'WILSON AV / DEKALB AV (BUSHWICK)', code: '306005', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B60'] },
      { id: 'MTA_306009', lat: 40.6725, lon: -73.9082, direction: 'S', name: 'ROCKAWAY AV / FULTON ST (OCEAN HILL)', code: '306009', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B60'] },
      { id: 'MTA_306013', lat: 40.6485, lon: -73.9022, direction: 'S', name: 'ROCKAWAY PKWY / GLENWOOD RD (CANARSIE L)', code: '306013', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B60'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7602', direction: '1', initialOffset: 0.18, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 12.8, adherenceSeconds: -10, passengerLoad: 58, capacity: 75, blockSuffix: 'B60-01' },
      { vehicleNumber: '7615', direction: '0', initialOffset: 0.62, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 13.2, adherenceSeconds: 15, passengerLoad: 49, capacity: 75, blockSuffix: 'B60-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B24',
      shortName: 'B24',
      longName: 'Williamsburg Bridge Plaza - Sunnyside Queens Blvd',
      description: 'Via Greenpoint Ave Bridge / Kingsland Ave / Grand Ave',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '06B6D4',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 12,
    runTimeMinutes: 38,
    shapePoints: [
      { lat: 40.7095, lng: -73.9592 },
      { lat: 40.7225, lng: -73.9452 },
      { lat: 40.7305, lng: -73.9352 },
      { lat: 40.7425, lng: -73.9242 },
    ],
    stops: [
      { id: 'MTA_302401', lat: 40.7095, lon: -73.9592, direction: 'N', name: 'WILLIAMSBURG BRIDGE PLAZA (LANE 2)', code: '302401', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B24'] },
      { id: 'MTA_302405', lat: 40.7305, lon: -73.9352, direction: 'N', name: 'GREENPOINT AV / KINGSLAND AV (GREENPOINT)', code: '302405', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B24'] },
      { id: 'MTA_302409', lat: 40.7425, lon: -73.9242, direction: 'N', name: '48 AV / 43 ST (SUNNYSIDE 7 TRAIN)', code: '302409', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B24'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7208', direction: '1', initialOffset: 0.35, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.5, adherenceSeconds: 0, passengerLoad: 38, capacity: 75, blockSuffix: 'B24-02' },
      { vehicleNumber: '7219', direction: '0', initialOffset: 0.81, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.0, adherenceSeconds: -5, passengerLoad: 41, capacity: 75, blockSuffix: 'B24-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B39',
      shortName: 'B39',
      longName: 'Williamsburg Bridge Plaza - LES Manhattan Delancey St',
      description: 'Via Williamsburg Bridge Cross-River Link',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '8B5CF6',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 15,
    runTimeMinutes: 20,
    shapePoints: [
      { lat: 40.7095, lng: -73.9592 },
      { lat: 40.7135, lng: -73.9725 },
      { lat: 40.7185, lng: -73.9882 },
    ],
    stops: [
      { id: 'MTA_303901', lat: 40.7095, lon: -73.9592, direction: 'W', name: 'WILLIAMSBURG BRIDGE PLAZA (LANE 1)', code: '303901', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B39'] },
      { id: 'MTA_303905', lat: 40.7185, lon: -73.9882, direction: 'W', name: 'DELANCEY ST / ESSEX ST (LOWER EAST SIDE F/M/J/Z)', code: '303905', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B39'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7105', direction: '1', initialOffset: 0.22, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 16.2, adherenceSeconds: 10, passengerLoad: 35, capacity: 75, blockSuffix: 'B39-01' },
      { vehicleNumber: '7112', direction: '0', initialOffset: 0.74, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.8, adherenceSeconds: -15, passengerLoad: 44, capacity: 75, blockSuffix: 'B39-03' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B43',
      shortName: 'B43',
      longName: 'Greenpoint Box St - Prospect Lefferts Gardens Lincoln Rd',
      description: 'Via Graham Ave / Tompkins Ave / Empire Blvd',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '3B82F6',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 9,
    runTimeMinutes: 50,
    shapePoints: [
      { lat: 40.7355, lng: -73.9542 },
      { lat: 40.7185, lng: -73.9442 },
      { lat: 40.6975, lng: -73.9452 },
      { lat: 40.6805, lng: -73.9462 },
      { lat: 40.6615, lng: -73.9582 },
    ],
    stops: [
      { id: 'MTA_304301', lat: 40.7355, lon: -73.9542, direction: 'S', name: 'BOX ST / MANHATTAN AV (GREENPOINT)', code: '304301', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B43'] },
      { id: 'MTA_304305', lat: 40.7185, lon: -73.9442, direction: 'S', name: 'GRAHAM AV / METROPOLITAN AV (L TRAIN)', code: '304305', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B43'] },
      { id: 'MTA_304309', lat: 40.6805, lon: -73.9462, direction: 'S', name: 'TOMPKINS AV / FULTON ST (BED-STUY A/C)', code: '304309', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B43'] },
      { id: 'MTA_304313', lat: 40.6615, lon: -73.9582, direction: 'S', name: 'LINCOLN RD / OCEAN AV (PROSPECT PARK B/Q)', code: '304313', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B43'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7352', direction: '1', initialOffset: 0.29, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 12.5, adherenceSeconds: -25, passengerLoad: 52, capacity: 75, blockSuffix: 'B43-02' },
      { vehicleNumber: '7365', direction: '0', initialOffset: 0.72, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 13.0, adherenceSeconds: 5, passengerLoad: 47, capacity: 75, blockSuffix: 'B43-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B47',
      shortName: 'B47',
      longName: 'Kings Plaza Transit Ctr - Bedford-Stuyvesant Marcus Garvey',
      description: 'Via Ralph Ave / East New York Ave / Marcus Garvey Blvd',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '14B8A6',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 45,
    shapePoints: [
      { lat: 40.6125, lng: -73.9212 },
      { lat: 40.6455, lng: -73.9182 },
      { lat: 40.6705, lng: -73.9222 },
      { lat: 40.6955, lng: -73.9382 },
    ],
    stops: [
      { id: 'MTA_304701', lat: 40.6125, lon: -73.9212, direction: 'N', name: 'KINGS PLAZA TRANSIT CTR (FLATBUSH)', code: '304701', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B47'] },
      { id: 'MTA_304705', lat: 40.6705, lon: -73.9222, direction: 'N', name: 'RALPH AV / EASTERN PKWY (CROWN HTS 3/4)', code: '304705', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B47'] },
      { id: 'MTA_304709', lat: 40.6805, lon: -73.9382, direction: 'N', name: 'MARCUS GARVEY BLVD / FULTON ST (C TRAIN)', code: '304709', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B47'] },
      { id: 'MTA_304713', lat: 40.6955, lon: -73.9382, direction: 'N', name: 'BROADWAY / MARCUS GARVEY BLVD (FLUSHING AV J/M)', code: '304713', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B47'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7701', direction: '1', initialOffset: 0.24, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 13.9, adherenceSeconds: 10, passengerLoad: 50, capacity: 75, blockSuffix: 'B47-02' },
      { vehicleNumber: '7714', direction: '0', initialOffset: 0.65, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.4, adherenceSeconds: -15, passengerLoad: 56, capacity: 75, blockSuffix: 'B47-06' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q54',
      shortName: 'Q54',
      longName: 'Williamsburg Bridge Plaza - Jamaica LIRR Station',
      description: 'Via Metropolitan Ave Corridor / Jamaica Ave',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: 'EAB308',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 58,
    shapePoints: [
      { lat: 40.7095, lng: -73.9592 },
      { lat: 40.7145, lng: -73.9212 },
      { lat: 40.7135, lng: -73.8825 },
      { lat: 40.7065, lng: -73.8325 },
      { lat: 40.7024, lng: -73.8012 },
    ],
    stops: [
      { id: 'MTA_505401', lat: 40.7095, lon: -73.9592, direction: 'E', name: 'WILLIAMSBURG BRIDGE PLAZA (LANE 3)', code: '505401', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q54'] },
      { id: 'MTA_505405', lat: 40.7145, lon: -73.9212, direction: 'E', name: 'METROPOLITAN AV / GRAND AV (MASPETH)', code: '505405', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q54'] },
      { id: 'MTA_505409', lat: 40.7135, lon: -73.8825, direction: 'E', name: 'METROPOLITAN AV / 71 AV (MIDDLE VILLAGE M)', code: '505409', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q54'] },
      { id: 'MTA_505413', lat: 40.7024, lon: -73.8012, direction: 'E', name: 'ARCHER AV / SUTPHIN BLVD (JAMAICA LIRR)', code: '505413', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q54'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7802', direction: '1', initialOffset: 0.21, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 13.6, adherenceSeconds: 5, passengerLoad: 60, capacity: 75, blockSuffix: 'Q54-02' },
      { vehicleNumber: '7816', direction: '0', initialOffset: 0.69, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.2, adherenceSeconds: -35, passengerLoad: 52, capacity: 75, blockSuffix: 'Q54-06' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_Q59',
      shortName: 'Q59',
      longName: 'Williamsburg Bridge Plaza - Rego Park Queens Blvd',
      description: 'Via Grand Ave Direct Arterial past Grand Avenue Depot',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '6366F1',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'GA',
      borough: 'Queens',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 10,
    runTimeMinutes: 40,
    shapePoints: [
      { lat: 40.7095, lng: -73.9592 },
      { lat: 40.7185, lng: -73.9212 },
      { lat: 40.7245, lng: -73.8962 },
      { lat: 40.7355, lng: -73.8682 },
    ],
    stops: [
      { id: 'MTA_505901', lat: 40.7095, lon: -73.9592, direction: 'E', name: 'WILLIAMSBURG BRIDGE PLAZA (LANE 2)', code: '505901', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q59'] },
      { id: 'MTA_505905', lat: 40.7185, lon: -73.9212, direction: 'E', name: 'GRAND AV / 49 ST (GRAND AVENUE DEPOT)', code: '505905', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q59'] },
      { id: 'MTA_505909', lat: 40.7245, lon: -73.8962, direction: 'E', name: 'GRAND AV / 69 ST (MASPETH CLINTON DINER)', code: '505909', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q59'] },
      { id: 'MTA_505913', lat: 40.7355, lon: -73.8682, direction: 'E', name: 'QUEENS BLVD / 59 AV (REGO PARK QUEENS CTR M/R)', code: '505913', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_Q59'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7904', direction: '1', initialOffset: 0.27, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.8, adherenceSeconds: 0, passengerLoad: 45, capacity: 75, blockSuffix: 'Q59-01' },
      { vehicleNumber: '7918', direction: '0', initialOffset: 0.73, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.2, adherenceSeconds: -10, passengerLoad: 48, capacity: 75, blockSuffix: 'Q59-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B54',
      shortName: 'B54',
      longName: 'Downtown Brooklyn Jay St MetroTech - Ridgewood Terminal',
      description: 'Via Myrtle Ave Elevated Corridor Under BMT Myrtle El',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '4338CA',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'FP',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 7,
    runTimeMinutes: 38,
    shapePoints: [
      { lat: 40.6935, lng: -73.9875 },
      { lat: 40.6945, lng: -73.9625 },
      { lat: 40.6965, lng: -73.9312 },
      { lat: 40.7005, lng: -73.9085 },
      { lat: 40.7072, lng: -73.8965 },
    ],
    stops: [
      { id: 'MTA_305401', lat: 40.6935, lon: -73.9875, direction: 'E', name: 'JAY ST / MYRTLE AV (METROTECH A/C/F/R)', code: '305401', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B54'] },
      { id: 'MTA_305405', lat: 40.6965, lon: -73.9312, direction: 'E', name: 'MYRTLE AV / BROADWAY (MYRTLE-BROADWAY J/M/Z)', code: '305405', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B54'] },
      { id: 'MTA_305409', lat: 40.7072, lon: -73.8965, direction: 'E', name: 'PALMETTO ST / WYCKOFF AV (FRESH POND DEPOT / M/L)', code: '305409', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B54'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7360', direction: '1', initialOffset: 0.22, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 13.5, adherenceSeconds: 15, passengerLoad: 52, capacity: 75, blockSuffix: 'B54-01' },
      { vehicleNumber: '7375', direction: '0', initialOffset: 0.68, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 14.1, adherenceSeconds: -10, passengerLoad: 57, capacity: 75, blockSuffix: 'B54-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B37',
      shortName: 'B37',
      longName: 'Downtown Brooklyn Boerum Pl - Bay Ridge Shore Rd 4th Ave',
      description: 'Via 3rd Ave Sunset Park Industrial / Gowanus Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '9333EA',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'JG',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 9,
    runTimeMinutes: 40,
    shapePoints: [
      { lat: 40.6912, lng: -73.9885 },
      { lat: 40.6745, lng: -73.9962 },
      { lat: 40.6558, lng: -74.0042 },
      { lat: 40.6385, lng: -74.0182 },
      { lat: 40.6212, lng: -74.0325 },
    ],
    stops: [
      { id: 'MTA_303701', lat: 40.6912, lon: -73.9885, direction: 'S', name: 'ATLANTIC AV / 3 AV (BARCLAYS CTR 2/3/4/5/B/D/N/Q/R)', code: '303701', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B37'] },
      { id: 'MTA_303705', lat: 40.6558, lon: -74.0042, direction: 'S', name: '3 AV / 39 ST (JACKIE GLEASON DEPOT / INDUSTRY CITY)', code: '303705', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B37'] },
      { id: 'MTA_303709', lat: 40.6212, lon: -74.0325, direction: 'S', name: '4 AV / 86 ST (BAY RIDGE R SUBWAY)', code: '303709', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B37'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7388', direction: '1', initialOffset: 0.27, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.0, adherenceSeconds: -5, passengerLoad: 43, capacity: 75, blockSuffix: 'B37-02' },
      { vehicleNumber: '7396', direction: '0', initialOffset: 0.75, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.7, adherenceSeconds: 10, passengerLoad: 48, capacity: 75, blockSuffix: 'B37-05' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_B4',
      shortName: 'B4',
      longName: 'Bay Ridge Narrows Ave - Sheepshead Bay Knapp St',
      description: 'Via Bay Ridge Pkwy / 86th St / Neptune Ave South Brooklyn',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '0284C7',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'UP',
      borough: 'Brooklyn',
      serviceTier: 'LOCAL',
    },
    headwayMinutes: 8,
    runTimeMinutes: 44,
    shapePoints: [
      { lat: 40.6285, lng: -74.0385 },
      { lat: 40.6152, lng: -74.0082 },
      { lat: 40.5925, lng: -73.9928 },
      { lat: 40.5845, lng: -73.9612 },
      { lat: 40.5825, lng: -73.9312 },
    ],
    stops: [
      { id: 'MTA_300401', lat: 40.6285, lon: -74.0385, direction: 'E', name: 'NARROWS AV / 77 ST (BAY RIDGE)', code: '300401', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B4'] },
      { id: 'MTA_300405', lat: 40.5925, lon: -73.9928, direction: 'E', name: 'HARWAY AV / 25 AV (ULMER PARK DEPOT / D SUBWAY)', code: '300405', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B4'] },
      { id: 'MTA_300409', lat: 40.5825, lon: -73.9312, direction: 'E', name: 'KNAPP ST / VOORHIES AV (SHEEPSHEAD BAY)', code: '300409', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_B4'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '7412', direction: '1', initialOffset: 0.33, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 15.4, adherenceSeconds: 5, passengerLoad: 44, capacity: 75, blockSuffix: 'B4-01' },
      { vehicleNumber: '7429', direction: '0', initialOffset: 0.81, coachType: 'Standard 40ft Hybrid', baseSpeedMph: 16.0, adherenceSeconds: -15, passengerLoad: 49, capacity: 75, blockSuffix: 'B4-04' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_M15+',
      shortName: 'M15-SBS',
      longName: 'East Harlem - South Ferry Select Bus Service',
      description: 'Via 1st Ave / 2nd Ave Select Bus Corridor',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '00A8E8',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'QUILL',
      borough: 'Manhattan',
      serviceTier: 'SBS',
    },
    headwayMinutes: 4,
    runTimeMinutes: 58,
    shapePoints: [
      { lat: 40.8031, lng: -73.9335 },
      { lat: 40.7950, lng: -73.9395 },
      { lat: 40.7850, lng: -73.9470 },
      { lat: 40.7782, lng: -73.9516 },
      { lat: 40.7680, lng: -73.9590 },
      { lat: 40.7592, lng: -73.9655 },
      { lat: 40.7505, lng: -73.9718 },
      { lat: 40.7445, lng: -73.9762 },
      { lat: 40.7380, lng: -73.9810 },
      { lat: 40.7315, lng: -73.9856 },
      { lat: 40.7235, lng: -73.9912 },
      { lat: 40.7185, lng: -73.9930 },
      { lat: 40.7135, lng: -73.9975 },
      { lat: 40.7070, lng: -74.0040 },
      { lat: 40.7018, lng: -74.0132 },
    ],
    stops: [
      { id: 'MTA_401790', lat: 40.8031, lon: -73.9335, direction: 'S', name: '2 AV / E 125 ST', code: '401790', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_M15+'] },
      { id: 'MTA_401806', lat: 40.7592, lon: -73.9655, direction: 'S', name: '2 AV / E 57 ST', code: '401806', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_M15+'] },
      { id: 'MTA_401838', lat: 40.7018, lon: -74.0132, direction: 'S', name: 'SOUTH FERRY / WHITEHALL TERMINAL', code: '401838', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_M15+'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '5984', direction: '1', initialOffset: 0.14, coachType: 'Articulated 60ft', baseSpeedMph: 14.2, adherenceSeconds: -20, passengerLoad: 64, capacity: 110, blockSuffix: 'M15-101' },
      { vehicleNumber: '5991', direction: '1', initialOffset: 0.52, coachType: 'Articulated 60ft', baseSpeedMph: 12.8, adherenceSeconds: 35, passengerLoad: 78, capacity: 110, blockSuffix: 'M15-104' },
      { vehicleNumber: '6027', direction: '0', initialOffset: 0.35, coachType: 'Articulated 60ft', baseSpeedMph: 13.9, adherenceSeconds: 10, passengerLoad: 52, capacity: 110, blockSuffix: 'M15-202' },
    ],
  },
  {
    route: {
      id: 'MTA NYCT_M34+',
      shortName: 'M34-SBS',
      longName: '12th Ave Javits Center - FDR Drive East Midtown Ferry',
      description: 'Via 34th St Manhattan Crosstown Transitway Dedicated Bus Lanes',
      type: 3,
      url: 'https://new.mta.info/schedules/bus',
      color: '0284C7',
      textColor: 'FFFFFF',
      agencyId: 'MTA NYCT',
      depotId: 'QUILL',
      borough: 'Manhattan',
      serviceTier: 'SBS',
    },
    headwayMinutes: 5,
    runTimeMinutes: 30,
    shapePoints: [
      { lat: 40.7562, lng: -74.0032 },
      { lat: 40.7522, lng: -73.9928 },
      { lat: 40.7495, lng: -73.9862 },
      { lat: 40.7462, lng: -73.9782 },
      { lat: 40.7425, lng: -73.9712 },
    ],
    stops: [
      { id: 'MTA_403401', lat: 40.7562, lon: -74.0032, direction: 'E', name: '12 AV / W 34 ST (JAVITS CENTER / MICHAEL J QUILL DEPOT)', code: '403401', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_M34+'] },
      { id: 'MTA_403405', lat: 40.7495, lon: -73.9862, direction: 'E', name: 'W 34 ST / HERALD SQ (B/D/F/M/N/Q/R/W / PATH)', code: '403405', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_M34+'] },
      { id: 'MTA_403409', lat: 40.7425, lon: -73.9712, direction: 'E', name: 'FDR DR / E 34 ST (EAST RIVER FERRY TERMINAL)', code: '403409', locationType: 0, wheelchairBoarding: 'ACCESSIBLE', routeIds: ['MTA NYCT_M34+'] },
    ],
    fleetSeeds: [
      { vehicleNumber: '6102', direction: '1', initialOffset: 0.22, coachType: 'Articulated 60ft', baseSpeedMph: 12.5, adherenceSeconds: 0, passengerLoad: 72, capacity: 110, blockSuffix: 'M34-01' },
      { vehicleNumber: '6115', direction: '0', initialOffset: 0.74, coachType: 'Articulated 60ft', baseSpeedMph: 13.0, adherenceSeconds: -15, passengerLoad: 80, capacity: 110, blockSuffix: 'M34-04' },
    ],
  },
];

export function haversineMeters(a: LatLngPoint, b: LatLngPoint): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function computeBearing(a: LatLngPoint, b: LatLngPoint): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function samplePolylineAtProgress(
  points: LatLngPoint[],
  progress: number,
  reverseDirection = false
): { location: LatLngPoint; bearing: number; totalLengthMeters: number; distanceTraveledMeters: number } {
  const ordered = reverseDirection ? [...points].reverse() : points;
  if (ordered.length === 0) {
    return { location: NYC_CENTER, bearing: 0, totalLengthMeters: 0, distanceTraveledMeters: 0 };
  }
  if (ordered.length === 1) {
    return { location: ordered[0], bearing: 0, totalLengthMeters: 0, distanceTraveledMeters: 0 };
  }

  const segLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < ordered.length - 1; i++) {
    const len = haversineMeters(ordered[i], ordered[i + 1]);
    segLengths.push(len);
    totalLength += len;
  }

  const clamped = Math.max(0, Math.min(1, progress));
  const targetDist = clamped * totalLength;

  let accum = 0;
  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (accum + segLen >= targetDist || i === segLengths.length - 1) {
      const localT = segLen > 0 ? (targetDist - accum) / segLen : 0;
      const a = ordered[i];
      const b = ordered[i + 1];
      const lat = a.lat + (b.lat - a.lat) * localT;
      const lng = a.lng + (b.lng - a.lng) * localT;
      const bearing = computeBearing(a, b);
      return {
        location: { lat, lng },
        bearing: Math.round(bearing * 10) / 10,
        totalLengthMeters: Math.round(totalLength),
        distanceTraveledMeters: Math.round(targetDist),
      };
    }
    accum += segLen;
  }

  return {
    location: ordered[ordered.length - 1],
    bearing: 0,
    totalLengthMeters: Math.round(totalLength),
    distanceTraveledMeters: Math.round(targetDist),
  };
}

export function generateSiriVehicleMonitoringPayload(options?: {
  depotId?: string;
  borough?: string;
  lineRef?: string;
  vehicleRef?: string;
  timestampMs?: number;
}): SiriVehicleMonitoringResponse {
  const nowMs = options?.timestampMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const validUntilIso = new Date(nowMs + 15000).toISOString();
  const dateFrame = nowIso.slice(0, 10);

  const cycleDurationMs = 28 * 60 * 1000;
  const cycleDelta = (nowMs % cycleDurationMs) / cycleDurationMs;

  const activities: SiriVehicleActivity[] = [];

  for (const def of ROUTE_CATALOG) {
    if (options?.depotId && options.depotId !== 'ALL' && def.route.depotId !== options.depotId) {
      continue;
    }
    if (options?.borough && options.borough !== 'ALL' && def.route.borough !== options.borough) {
      continue;
    }
    if (options?.lineRef && options.lineRef !== 'ALL' && def.route.id !== options.lineRef && def.route.shortName !== options.lineRef) {
      continue;
    }

    const depotObj = MTA_DEPOTS.find((d) => d.id === def.route.depotId);
    const orderedStopsForward = def.stops;
    const orderedStopsReverse = [...def.stops].reverse();

    for (const seed of def.fleetSeeds) {
      const fullVehicleRef = `MTA NYCT_${seed.vehicleNumber}`;
      if (
        options?.vehicleRef &&
        options.vehicleRef !== fullVehicleRef &&
        options.vehicleRef !== seed.vehicleNumber
      ) {
        continue;
      }

      const reverse = seed.direction === '1';
      const rawProgress = (seed.initialOffset + cycleDelta * (seed.baseSpeedMph / 14)) % 1;
      const sample = samplePolylineAtProgress(def.shapePoints, rawProgress, reverse);

      const activeStops = reverse ? orderedStopsReverse : orderedStopsForward;
      const originStop = activeStops[0];
      const destStop = activeStops[activeStops.length - 1];

      const nextStopIdx = Math.min(
        activeStops.length - 1,
        Math.max(1, Math.ceil(rawProgress * (activeStops.length - 1)))
      );
      const nextStop = activeStops[nextStopIdx];
      const distToNextStop = Math.max(
        35,
        Math.round(haversineMeters(sample.location, { lat: nextStop.lat, lng: nextStop.lon }))
      );
      const stopsAway = Math.max(0, Math.round(distToNextStop / 400));

      const presentableDistance =
        distToNextStop < 120
          ? 'approaching'
          : distToNextStop < 260
          ? 'at stop'
          : stopsAway <= 1
          ? `${(distToNextStop / 1609.34).toFixed(1)} mi away`
          : `${stopsAway} stops away`;

      const etaNextStopMs = nowMs + Math.round((distToNextStop / (seed.baseSpeedMph * 0.44704)) * 1000);
      const aimedNextStopMs = etaNextStopMs + seed.adherenceSeconds * 1000;

      const onwardCalls: SiriOnwardCall[] = [];
      let cumulativeDist = distToNextStop;
      for (let sIdx = nextStopIdx; sIdx < activeStops.length; sIdx++) {
        const st = activeStops[sIdx];
        if (sIdx > nextStopIdx) {
          const prev = activeStops[sIdx - 1];
          cumulativeDist += Math.round(haversineMeters({ lat: prev.lat, lng: prev.lon }, { lat: st.lat, lng: st.lon }));
        }
        const stopsCount = sIdx - nextStopIdx;
        const expectedMs = nowMs + Math.round((cumulativeDist / (seed.baseSpeedMph * 0.44704)) * 1000);
        const aimedMs = expectedMs + seed.adherenceSeconds * 1000;

        onwardCalls.push({
          StopPointRef: st.id,
          VisitNumber: 1,
          StopPointName: st.name,
          AimedArrivalTime: new Date(aimedMs).toISOString(),
          ExpectedArrivalTime: new Date(expectedMs).toISOString(),
          Extensions: {
            Distances: {
              PresentableDistance:
                stopsCount === 0
                  ? presentableDistance
                  : `${stopsCount} stop${stopsCount > 1 ? 's' : ''} away`,
              DistanceFromCall: cumulativeDist,
              StopsFromCall: stopsCount,
              CallDistanceAlongRoute: Math.min(sample.totalLengthMeters, sample.distanceTraveledMeters + cumulativeDist),
            },
          },
        });
      }

      const adherenceStatus =
        seed.adherenceSeconds < -120
          ? 'DELAYED'
          : seed.adherenceSeconds > 60
          ? 'EARLY'
          : 'ON_TIME';

      // Realistic dynamic passenger load variation based on route cycle & time
      const loadProgressWave = Math.sin((rawProgress * 2.2 + (seed.initialOffset || 0)) * Math.PI);
      const dynamicPassengerLoad = Math.max(
        5,
        Math.min(
          seed.capacity,
          Math.round(seed.passengerLoad + loadProgressWave * 16 + ((seed.vehicleNumber.charCodeAt(seed.vehicleNumber.length - 1) % 7) - 3))
        )
      );
      const loadRatio = dynamicPassengerLoad / seed.capacity;
      const loadFactor =
        loadRatio > 0.88 ? 'FULL' : loadRatio > 0.68 ? 'HIGH' : loadRatio > 0.35 ? 'MODERATE' : 'LOW';
      const occupancyStatus =
        loadFactor === 'FULL'
          ? 'full'
          : loadFactor === 'HIGH'
          ? 'standingRoomOnly'
          : loadFactor === 'MODERATE'
          ? 'fewSeatsAvailable'
          : 'manySeatsAvailable';

      const journey: SiriMonitoredVehicleJourney = {
        LineRef: def.route.id,
        DirectionRef: seed.direction,
        FramedVehicleJourneyRef: {
          DataFrameRef: dateFrame,
          DatedVehicleJourneyRef: `${def.route.id}_${seed.blockSuffix}_${seed.direction === '0' ? 'NB' : 'SB'}`,
        },
        JourneyPatternRef: `JP_${def.route.shortName.replace('-', '_')}_${seed.direction}`,
        PublishedLineName: def.route.shortName,
        OperatorRef: def.route.agencyId,
        OriginRef: originStop.id,
        OriginName: originStop.name,
        DestinationRef: destStop.id,
        DestinationName: destStop.name,
        OriginAimedDepartureTime: new Date(nowMs - Math.round(rawProgress * def.runTimeMinutes * 60000)).toISOString(),
        DestinationAimedArrivalTime: new Date(nowMs + Math.round((1 - rawProgress) * def.runTimeMinutes * 60000)).toISOString(),
        Monitored: true,
        VehicleLocation: {
          Longitude: Number(sample.location.lng.toFixed(6)),
          Latitude: Number(sample.location.lat.toFixed(6)),
        },
        Bearing: sample.bearing,
        ProgressRate: seed.adherenceSeconds < -150 ? 'slowProgress' : 'normalProgress',
        BlockRef: `MTA_${def.route.depotId}_${seed.blockSuffix}`,
        VehicleRef: fullVehicleRef,
        Occupancy: occupancyStatus,
        MonitoredCall: {
          StopPointRef: nextStop.id,
          VisitNumber: 1,
          StopPointName: nextStop.name,
          AimedArrivalTime: new Date(aimedNextStopMs).toISOString(),
          ExpectedArrivalTime: new Date(etaNextStopMs).toISOString(),
          Extensions: {
            Distances: {
              PresentableDistance: presentableDistance,
              DistanceFromCall: distToNextStop,
              StopsFromCall: stopsAway,
              CallDistanceAlongRoute: sample.distanceTraveledMeters + distToNextStop,
            },
            Capacities: {
              EstimatedPassengerCount: dynamicPassengerLoad,
              EstimatedPassengerCapacity: seed.capacity,
              EstimatedPassengerLoadFactor: loadFactor,
              OccupancyPercent: Math.round(loadRatio * 100),
            },
          },
        },
        OnwardCalls: {
          OnwardCall: onwardCalls,
        },
        Extensions: {
          Capacities: {
            EstimatedPassengerCount: dynamicPassengerLoad,
            EstimatedPassengerCapacity: seed.capacity,
            EstimatedPassengerLoadFactor: loadFactor,
            OccupancyPercent: Math.round(loadRatio * 100),
          },
          OperationalMeta: {
            DepotId: def.route.depotId,
            DepotName: depotObj?.name ?? def.route.depotId,
            Borough: def.route.borough,
            CoachType: seed.coachType,
            SpeedMph: seed.baseSpeedMph,
            ScheduleAdherenceSeconds: seed.adherenceSeconds,
            ScheduleAdherenceStatus: adherenceStatus,
            RouteColorHex: `#${def.route.color}`,
            ProgressRatio: Number(rawProgress.toFixed(4)),
          },
        },
      };

      activities.push({
        RecordedAtTime: nowIso,
        MonitoredVehicleJourney: journey,
      });
    }
  }

  return {
    Siri: {
      ServiceDelivery: {
        ResponseTimestamp: nowIso,
        VehicleMonitoringDelivery: [
          {
            ResponseTimestamp: nowIso,
            ValidUntil: validUntilIso,
            VehicleActivity: activities,
          },
        ],
      },
    },
    _meta: {
      source: 'MTA_SIRI_3D_CACHE_ENGINE',
      apiKeyConfigured: false,
      polledAt: nowIso,
      filterApplied: {
        depotId: options?.depotId,
        borough: options?.borough,
        lineRef: options?.lineRef,
        vehicleRef: options?.vehicleRef,
      },
    },
  };
}

export function generateMonitoredVehicleJourneyTrace(
  vehicleRef: string,
  timestampMs?: number
): SiriMonitoredJourneyTraceResponse | null {
  const nowMs = timestampMs ?? Date.now();
  const vm = generateSiriVehicleMonitoringPayload({ vehicleRef, timestampMs: nowMs });
  const activity = vm.Siri.ServiceDelivery.VehicleMonitoringDelivery[0]?.VehicleActivity[0];
  if (!activity) return null;

  const mvj = activity.MonitoredVehicleJourney;
  const routeDef = ROUTE_CATALOG.find((r) => r.route.id === mvj.LineRef);
  if (!routeDef) return null;

  const reverse = mvj.DirectionRef === '1';
  const currentProgress = mvj.Extensions?.OperationalMeta?.ProgressRatio ?? 0.5;
  const speedMph = mvj.Extensions?.OperationalMeta?.SpeedMph ?? 14.0;
  const adherenceSec = mvj.Extensions?.OperationalMeta?.ScheduleAdherenceSeconds ?? 0;
  const adherenceStatus = mvj.Extensions?.OperationalMeta?.ScheduleAdherenceStatus ?? 'ON_TIME';

  const historicalPath: SiriMonitoredJourneyTraceResponse['HistoricalPath'] = [];
  const histSteps = 20;
  for (let i = 0; i <= histSteps; i++) {
    const p = (currentProgress * i) / histSteps;
    const pt = samplePolylineAtProgress(routeDef.shapePoints, p, reverse);
    const timeAgoMs = Math.round((currentProgress - p) * routeDef.runTimeMinutes * 60000);
    historicalPath.push({
      lat: Number(pt.location.lat.toFixed(6)),
      lng: Number(pt.location.lng.toFixed(6)),
      timestamp: new Date(nowMs - timeAgoMs).toISOString(),
      speedMph: Number((speedMph * (0.92 + 0.16 * Math.sin(i * 1.3))).toFixed(1)),
    });
  }

  const projectedPath: SiriMonitoredJourneyTraceResponse['ProjectedPath'] = [];
  const projSteps = 20;
  for (let i = 0; i <= projSteps; i++) {
    const p = currentProgress + ((1 - currentProgress) * i) / projSteps;
    const pt = samplePolylineAtProgress(routeDef.shapePoints, p, reverse);
    const timeAheadMs = Math.round((p - currentProgress) * routeDef.runTimeMinutes * 60000);
    projectedPath.push({
      lat: Number(pt.location.lat.toFixed(6)),
      lng: Number(pt.location.lng.toFixed(6)),
      estimatedTimestamp: new Date(nowMs + timeAheadMs).toISOString(),
    });
  }

  const activeStops = reverse ? [...routeDef.stops].reverse() : routeDef.stops;
  const nextStopIdx = Math.min(
    activeStops.length - 1,
    Math.max(1, Math.ceil(currentProgress * (activeStops.length - 1)))
  );
  const historicalCalls: SiriHistoricalStopEvent[] = [];
  for (let i = 0; i < nextStopIdx; i++) {
    const st = activeStops[i];
    const stopProgress = i / Math.max(1, activeStops.length - 1);
    const actualDepMs = nowMs - Math.round((currentProgress - stopProgress) * routeDef.runTimeMinutes * 60000);
    const aimedDepMs = actualDepMs + adherenceSec * 1000;
    historicalCalls.push({
      StopPointRef: st.id,
      StopPointName: st.name,
      AimedDepartureTime: new Date(aimedDepMs).toISOString(),
      ActualDepartureTime: new Date(actualDepMs).toISOString(),
      AdherenceSeconds: adherenceSec,
      Location: { lat: st.lat, lng: st.lon },
    });
  }

  const absSec = Math.abs(adherenceSec);
  const mins = Math.floor(absSec / 60);
  const secs = absSec % 60;
  const sign = adherenceSec < 0 ? '-' : '+';
  const formattedDeviation = `${sign}${mins}:${secs.toString().padStart(2, '0')} (${
    adherenceStatus === 'ON_TIME' ? 'On Schedule' : adherenceStatus === 'DELAYED' ? 'Behind Schedule' : 'Ahead of Schedule'
  })`;

  return {
    VehicleRef: mvj.VehicleRef,
    LineRef: mvj.LineRef,
    PublishedLineName: mvj.PublishedLineName,
    DepotId: mvj.Extensions?.OperationalMeta?.DepotId ?? routeDef.route.depotId,
    DepotName: mvj.Extensions?.OperationalMeta?.DepotName ?? routeDef.route.depotId,
    Borough: routeDef.route.borough,
    RecordedAtTime: activity.RecordedAtTime,
    MonitoredVehicleJourney: mvj,
    HistoricalPath: historicalPath,
    ProjectedPath: projectedPath,
    HistoricalCalls: historicalCalls,
    ScheduleAdherence: {
      deviationSeconds: adherenceSec,
      formattedDeviation,
      status: adherenceStatus,
      headwayTargetMinutes: routeDef.headwayMinutes,
      actualHeadwayMinutes: Number(
        Math.max(2, routeDef.headwayMinutes - adherenceSec / 90).toFixed(1)
      ),
    },
  };
}

export function generateObaScheduleForRoute(routeId: string): ObaScheduleForRouteEntry | null {
  const def = ROUTE_CATALOG.find((r) => r.route.id === routeId || r.route.shortName === routeId);
  if (!def) return null;

  const now = new Date();
  const upcomingDepartures = def.stops.slice(0, 6).map((st, idx) => {
    const depTime = new Date(now.getTime() + (idx * 6 + 3) * 60000);
    const arrTime = new Date(depTime.getTime() - 45000);
    return {
      stopId: st.id,
      stopName: st.name,
      arrivalTime: arrTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      departureTime: depTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      tripId: `${def.route.id}_WK_${1040 + idx * 12}`,
      blockId: `MTA_${def.route.depotId}_${def.route.shortName}-${10 + idx}`,
      headsign: def.route.longName,
    };
  });

  return {
    routeId: def.route.id,
    scheduleDate: now.toISOString().slice(0, 10),
    serviceIds: ['MTA NYCT_WEEKDAY_SDON', 'MTA NYCT_PRIORITY'],
    frequencyWindows: [
      {
        periodName: 'AM Peak (06:30 – 09:30)',
        timeRange: '06:30 - 09:30',
        headwayMinutes: def.headwayMinutes,
        scheduledBuses: def.fleetSeeds.length + 2,
        activeBuses: def.fleetSeeds.length + 2,
        runTimeMinutes: def.runTimeMinutes,
      },
      {
        periodName: 'Midday Base (09:30 – 15:30)',
        timeRange: '09:30 - 15:30',
        headwayMinutes: def.headwayMinutes + 2,
        scheduledBuses: def.fleetSeeds.length,
        activeBuses: def.fleetSeeds.length,
        runTimeMinutes: def.runTimeMinutes - 4,
      },
      {
        periodName: 'PM Peak (15:30 – 19:30)',
        timeRange: '15:30 - 19:30',
        headwayMinutes: def.headwayMinutes,
        scheduledBuses: def.fleetSeeds.length + 2,
        activeBuses: def.fleetSeeds.length + 2,
        runTimeMinutes: def.runTimeMinutes + 3,
      },
    ],
    upcomingDepartures,
  };
}

function buildNYC3DBuildingsCache(): Building3DFootprint[] {
  const buildings: Building3DFootprint[] = [
    // Manhattan iconic skyline
    {
      id: 'bldg-esb',
      name: 'Empire State Building',
      borough: 'Manhattan',
      lat: 40.7484,
      lng: -73.9857,
      widthMeters: 125,
      depthMeters: 62,
      heightMeters: 381,
      rotationDeg: 29,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.22 },
        { scaleX: 0.72, scaleZ: 0.75, heightRatio: 0.62 },
        { scaleX: 0.45, scaleZ: 0.45, heightRatio: 0.16 },
      ],
    },
    {
      id: 'bldg-chrysler',
      name: 'Chrysler Building',
      borough: 'Manhattan',
      lat: 40.7516,
      lng: -73.9755,
      widthMeters: 78,
      depthMeters: 78,
      heightMeters: 319,
      rotationDeg: 29,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.35 },
        { scaleX: 0.65, scaleZ: 0.65, heightRatio: 0.48 },
        { scaleX: 0.35, scaleZ: 0.35, heightRatio: 0.17 },
      ],
    },
    {
      id: 'bldg-1wtc',
      name: 'One World Trade Center',
      borough: 'Manhattan',
      lat: 40.7127,
      lng: -74.0134,
      widthMeters: 82,
      depthMeters: 82,
      heightMeters: 417,
      rotationDeg: 18,
      isLandmark: true,
    },
    // Queens landmarks (Long Island City, Maspeth, Flushing, Jamaica & Astoria)
    {
      id: 'bldg-skyline-lic',
      name: 'Skyline Tower LIC (Tallest in Queens)',
      borough: 'Queens',
      lat: 40.7471,
      lng: -73.9422,
      widthMeters: 68,
      depthMeters: 68,
      heightMeters: 237,
      rotationDeg: 15,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.35 },
        { scaleX: 0.85, scaleZ: 0.85, heightRatio: 0.45 },
        { scaleX: 0.65, scaleZ: 0.65, heightRatio: 0.20 },
      ],
    },
    {
      id: 'bldg-court-square',
      name: 'One Court Square (Citigroup LIC)',
      borough: 'Queens',
      lat: 40.7485,
      lng: -73.9442,
      widthMeters: 75,
      depthMeters: 65,
      heightMeters: 201,
      rotationDeg: 15,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.40 },
        { scaleX: 0.75, scaleZ: 0.75, heightRatio: 0.42 },
        { scaleX: 0.45, scaleZ: 0.45, heightRatio: 0.18 },
      ],
    },
    {
      id: 'bldg-sven-lic',
      name: 'Sven LIC Curved Tower',
      borough: 'Queens',
      lat: 40.7505,
      lng: -73.9410,
      widthMeters: 62,
      depthMeters: 55,
      heightMeters: 188,
      rotationDeg: 22,
      isLandmark: true,
    },
    {
      id: 'bldg-queens-plaza-north',
      name: 'Queens Plaza North Tower',
      borough: 'Queens',
      lat: 40.7522,
      lng: -73.9385,
      widthMeters: 58,
      depthMeters: 52,
      heightMeters: 165,
      rotationDeg: 18,
      isLandmark: true,
    },
    {
      id: 'bldg-silvercup-studios',
      name: 'Silvercup Studios LIC',
      borough: 'Queens',
      lat: 40.7515,
      lng: -73.9475,
      widthMeters: 95,
      depthMeters: 65,
      heightMeters: 75,
      rotationDeg: 12,
      isLandmark: true,
    },
    {
      id: 'bldg-maspeth-logistics',
      name: 'Maspeth Industrial Freight Terminal',
      borough: 'Queens',
      lat: 40.7180,
      lng: -73.9120,
      widthMeters: 135,
      depthMeters: 85,
      heightMeters: 36,
      rotationDeg: 8,
      isLandmark: true,
    },
    {
      id: 'bldg-flushing-commons',
      name: 'Flushing Commons Tower',
      borough: 'Queens',
      lat: 40.7602,
      lng: -73.8315,
      widthMeters: 72,
      depthMeters: 60,
      heightMeters: 145,
      rotationDeg: 5,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.50 },
        { scaleX: 0.75, scaleZ: 0.75, heightRatio: 0.50 },
      ],
    },
    {
      id: 'bldg-queens-crossing',
      name: 'Queens Crossing Commercial Center',
      borough: 'Queens',
      lat: 40.7588,
      lng: -73.8335,
      widthMeters: 80,
      depthMeters: 65,
      heightMeters: 98,
      rotationDeg: 5,
      isLandmark: true,
    },
    {
      id: 'bldg-citi-field',
      name: 'Citi Field Ballpark',
      borough: 'Queens',
      lat: 40.7571,
      lng: -73.8458,
      widthMeters: 175,
      depthMeters: 165,
      heightMeters: 48,
      rotationDeg: 10,
      isLandmark: true,
    },
    {
      id: 'bldg-arthur-ashe',
      name: 'Arthur Ashe Stadium (USTA)',
      borough: 'Queens',
      lat: 40.7499,
      lng: -73.8471,
      widthMeters: 155,
      depthMeters: 155,
      heightMeters: 52,
      rotationDeg: 10,
      isLandmark: true,
    },
    {
      id: 'bldg-unisphere',
      name: 'Flushing Meadows Unisphere & Pavilion',
      borough: 'Queens',
      lat: 40.7464,
      lng: -73.8452,
      widthMeters: 65,
      depthMeters: 65,
      heightMeters: 50,
      rotationDeg: 0,
      isLandmark: true,
    },
    {
      id: 'bldg-jamaica-terminal',
      name: 'Jamaica Central LIRR / AirTrain Transit Hub',
      borough: 'Queens',
      lat: 40.7001,
      lng: -73.8078,
      widthMeters: 160,
      depthMeters: 95,
      heightMeters: 72,
      rotationDeg: 5,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.45 },
        { scaleX: 0.65, scaleZ: 0.65, heightRatio: 0.55 },
      ],
    },
    {
      id: 'bldg-york-college',
      name: 'York College CUNY Campus',
      borough: 'Queens',
      lat: 40.7025,
      lng: -73.7950,
      widthMeters: 130,
      depthMeters: 85,
      heightMeters: 42,
      rotationDeg: 5,
      isLandmark: true,
    },
    {
      id: 'bldg-kaufman-astoria',
      name: 'Kaufman Astoria Studios',
      borough: 'Queens',
      lat: 40.7575,
      lng: -73.9245,
      widthMeters: 120,
      depthMeters: 85,
      heightMeters: 38,
      rotationDeg: 12,
      isLandmark: true,
    },

    // Brooklyn landmarks (Downtown Brooklyn, DUMBO, Williamsburg, Greenpoint, Navy Yard, Red Hook)
    {
      id: 'bldg-brooklyn-tower',
      name: 'The Brooklyn Tower (9 DeKalb - 325m)',
      borough: 'Brooklyn',
      lat: 40.6902,
      lng: -73.9822,
      widthMeters: 66,
      depthMeters: 66,
      heightMeters: 325,
      rotationDeg: 12,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.35 },
        { scaleX: 0.78, scaleZ: 0.78, heightRatio: 0.42 },
        { scaleX: 0.52, scaleZ: 0.52, heightRatio: 0.23 },
      ],
    },
    {
      id: 'bldg-williamsburgh-bank',
      name: 'Williamsburgh Savings Bank Tower (Clocktower)',
      borough: 'Brooklyn',
      lat: 40.6865,
      lng: -73.9782,
      widthMeters: 62,
      depthMeters: 55,
      heightMeters: 156,
      rotationDeg: 10,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.55 },
        { scaleX: 0.65, scaleZ: 0.65, heightRatio: 0.30 },
        { scaleX: 0.35, scaleZ: 0.35, heightRatio: 0.15 },
      ],
    },
    {
      id: 'bldg-barclays-center',
      name: 'Barclays Center Arena',
      borough: 'Brooklyn',
      lat: 40.6828,
      lng: -73.9755,
      widthMeters: 155,
      depthMeters: 120,
      heightMeters: 45,
      rotationDeg: 15,
      isLandmark: true,
    },
    {
      id: 'bldg-brooklyn-borough-hall',
      name: 'Brooklyn Borough Hall & Municipal Center',
      borough: 'Brooklyn',
      lat: 40.6925,
      lng: -73.9902,
      widthMeters: 95,
      depthMeters: 80,
      heightMeters: 110,
      rotationDeg: 12,
      isLandmark: true,
    },
    {
      id: 'bldg-metrotech-center',
      name: 'MetroTech Center (NYU Tandon)',
      borough: 'Brooklyn',
      lat: 40.6938,
      lng: -73.9855,
      widthMeters: 110,
      depthMeters: 90,
      heightMeters: 135,
      rotationDeg: 12,
      isLandmark: true,
    },
    {
      id: 'bldg-domino-sugar',
      name: 'Domino Sugar Refinery & Waterfront',
      borough: 'Brooklyn',
      lat: 40.7145,
      lng: -73.9675,
      widthMeters: 125,
      depthMeters: 75,
      heightMeters: 85,
      rotationDeg: 15,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.60 },
        { scaleX: 0.70, scaleZ: 0.70, heightRatio: 0.40 },
      ],
    },
    {
      id: 'bldg-one-south-first',
      name: 'One South First Williamsburg Tower',
      borough: 'Brooklyn',
      lat: 40.7160,
      lng: -73.9670,
      widthMeters: 75,
      depthMeters: 70,
      heightMeters: 140,
      rotationDeg: 15,
      isLandmark: true,
    },
    {
      id: 'bldg-greenpoint-landing',
      name: 'Greenpoint Landing Waterfront Towers',
      borough: 'Brooklyn',
      lat: 40.7355,
      lng: -73.9575,
      widthMeters: 70,
      depthMeters: 65,
      heightMeters: 130,
      rotationDeg: 12,
      isLandmark: true,
    },
    {
      id: 'bldg-navy-yard-77',
      name: 'Brooklyn Navy Yard Building 77 Tech Hub',
      borough: 'Brooklyn',
      lat: 40.7015,
      lng: -73.9730,
      widthMeters: 165,
      depthMeters: 85,
      heightMeters: 58,
      rotationDeg: 14,
      isLandmark: true,
    },
    {
      id: 'bldg-dock-72',
      name: 'Dock 72 Brooklyn Navy Yard',
      borough: 'Brooklyn',
      lat: 40.7035,
      lng: -73.9705,
      widthMeters: 120,
      depthMeters: 60,
      heightMeters: 75,
      rotationDeg: 14,
      isLandmark: true,
    },
    {
      id: 'bldg-red-hook-terminal',
      name: 'Red Hook Cruise Terminal & Waterfront Piers',
      borough: 'Brooklyn',
      lat: 40.6780,
      lng: -74.0150,
      widthMeters: 150,
      depthMeters: 70,
      heightMeters: 28,
      rotationDeg: 20,
      isLandmark: true,
    },
    {
      id: 'bldg-brooklyn-museum',
      name: 'Brooklyn Museum & Grand Army Plaza',
      borough: 'Brooklyn',
      lat: 40.6715,
      lng: -73.9635,
      widthMeters: 130,
      depthMeters: 95,
      heightMeters: 45,
      rotationDeg: 8,
      isLandmark: true,
    },
  ];

  // 3D Transit Maintenance & Charging Facilities for all MTA Depots across Queens, Brooklyn, & Manhattan
  for (const depot of MTA_DEPOTS) {
    const isGrandAve = depot.id === 'GA';
    buildings.push({
      id: `bldg-depot-${depot.id.toLowerCase()}`,
      name: `${depot.name} (${depot.borough})`,
      borough: depot.borough,
      lat: depot.location.lat,
      lng: depot.location.lng,
      widthMeters: isGrandAve ? 180 : 140,
      depthMeters: isGrandAve ? 110 : 90,
      heightMeters: isGrandAve ? 32 : 24,
      rotationDeg: 12,
      isLandmark: true,
      steppedTiers: [
        { scaleX: 1.0, scaleZ: 1.0, heightRatio: 0.65 },
        { scaleX: 0.75, scaleZ: 0.75, heightRatio: 0.35 },
      ],
    });
  }

  // Procedural Urban Street Blocks for Queens, Brooklyn, and Manhattan
  const zones: Array<{
    prefix: string;
    borough: string;
    startLat: number;
    endLat: number;
    startLng: number;
    endLng: number;
    rows: number;
    cols: number;
    minH: number;
    maxH: number;
    rot: number;
  }> = [
    // Queens: Maspeth (Grand Avenue Depot Corridor)
    { prefix: 'qns-mas', borough: 'Queens', startLat: 40.7140, endLat: 40.7280, startLng: -73.9260, endLng: -73.9040, rows: 6, cols: 6, minH: 22, maxH: 65, rot: 10 },
    // Queens: Long Island City & Sunnyside
    { prefix: 'qns-lic', borough: 'Queens', startLat: 40.7380, endLat: 40.7620, startLng: -73.9550, endLng: -73.9220, rows: 7, cols: 7, minH: 35, maxH: 195, rot: 15 },
    // Queens: Astoria & Woodside
    { prefix: 'qns-ast', borough: 'Queens', startLat: 40.7550, endLat: 40.7780, startLng: -73.9350, endLng: -73.9000, rows: 6, cols: 6, minH: 26, maxH: 95, rot: 12 },
    // Queens: Flushing & Corona
    { prefix: 'qns-fls', borough: 'Queens', startLat: 40.7420, endLat: 40.7720, startLng: -73.8550, endLng: -73.8180, rows: 7, cols: 6, minH: 28, maxH: 135, rot: 8 },
    // Queens: Jamaica & Forest Hills
    { prefix: 'qns-jam', borough: 'Queens', startLat: 40.6880, endLat: 40.7220, startLng: -73.8250, endLng: -73.7780, rows: 7, cols: 6, minH: 26, maxH: 105, rot: 6 },
    // Brooklyn: Downtown Brooklyn, DUMBO & Brooklyn Navy Yard
    { prefix: 'bkl-dt', borough: 'Brooklyn', startLat: 40.6840, endLat: 40.7060, startLng: -73.9980, endLng: -73.9620, rows: 8, cols: 7, minH: 36, maxH: 225, rot: 12 },
    // Brooklyn: Williamsburg & Greenpoint
    { prefix: 'bkl-wbg', borough: 'Brooklyn', startLat: 40.7050, endLat: 40.7380, startLng: -73.9680, endLng: -73.9350, rows: 7, cols: 7, minH: 28, maxH: 125, rot: 15 },
    // Brooklyn: Bushwick & Bedford-Stuyvesant
    { prefix: 'bkl-bsh', borough: 'Brooklyn', startLat: 40.6820, endLat: 40.7080, startLng: -73.9450, endLng: -73.9120, rows: 7, cols: 6, minH: 24, maxH: 75, rot: 10 },
    // Brooklyn: Red Hook & Gowanus
    { prefix: 'bkl-red', borough: 'Brooklyn', startLat: 40.6680, endLat: 40.6880, startLng: -74.0180, endLng: -73.9820, rows: 5, cols: 5, minH: 22, maxH: 70, rot: 18 },
    // Brooklyn: Flatbush, Crown Heights & Prospect Lefferts
    { prefix: 'bkl-flt', borough: 'Brooklyn', startLat: 40.6180, endLat: 40.6750, startLng: -73.9650, endLng: -73.9220, rows: 8, cols: 6, minH: 24, maxH: 85, rot: 6 },
    // Manhattan: Midtown Canyon
    { prefix: 'man-mid', borough: 'Manhattan', startLat: 40.7380, endLat: 40.7680, startLng: -73.9980, endLng: -73.9620, rows: 8, cols: 7, minH: 55, maxH: 245, rot: 29 },
    // Manhattan: Lower Manhattan Financial District
    { prefix: 'man-low', borough: 'Manhattan', startLat: 40.7030, endLat: 40.7220, startLng: -74.0180, endLng: -73.9850, rows: 6, cols: 6, minH: 48, maxH: 220, rot: 18 },
  ];

  let idx = 0;
  for (const z of zones) {
    for (let r = 0; r < z.rows; r++) {
      for (let c = 0; c < z.cols; c++) {
        idx++;
        const hash = Math.abs(Math.sin(idx * 17.1898 + r * 63.233 + c * 41.719));
        if (hash < 0.15) continue;

        const latFrac = z.rows > 1 ? r / (z.rows - 1) : 0.5;
        const lngFrac = z.cols > 1 ? c / (z.cols - 1) : 0.5;
        const lat = z.startLat + (z.endLat - z.startLat) * latFrac + (hash - 0.5) * 0.0014;
        const lng = z.startLng + (z.endLng - z.startLng) * lngFrac + (((idx * 5) % 9) / 9 - 0.5) * 0.0016;

        const heightBias = Math.pow(hash, 1.25);
        const heightMeters = Math.round(z.minH + (z.maxH - z.minH) * heightBias);
        const widthMeters = Math.round(46 + ((idx * 13) % 48));
        const depthMeters = Math.round(40 + ((idx * 19) % 42));

        buildings.push({
          id: `bldg-${z.prefix}-${idx}`,
          borough: z.borough,
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5)),
          widthMeters,
          depthMeters,
          heightMeters,
          rotationDeg: z.rot,
        });
      }
    }
  }

  return buildings;
}

export const NYC_3D_BUILDINGS: Building3DFootprint[] = buildNYC3DBuildingsCache();
