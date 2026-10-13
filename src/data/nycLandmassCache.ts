import { LatLngPoint } from '../types/transit';

export interface BoroughLandmass {
  id: string;
  name: string;
  borough: 'Queens' | 'Brooklyn' | 'Manhattan' | 'Staten Island' | 'Bronx';
  colorHex: string;
  edgeColorHex: string;
  surfaceElevation: number; // scene meters
  polygon: LatLngPoint[];
  innerWaterHoles?: LatLngPoint[][];
}

export interface NycBridge3D {
  id: string;
  name: string;
  connects: string;
  type: 'suspension' | 'cable-stayed' | 'truss' | 'cantilever' | 'bascule';
  colorHex: string;
  deckElevation: number; // scene meters
  towerHeight: number; // scene meters
  path: LatLngPoint[];
}

export interface NycArterial3D {
  id: string;
  name: string;
  badge: string;
  borough: 'Queens' | 'Brooklyn' | 'Manhattan' | 'Multi-Borough';
  colorHex: string;
  path: LatLngPoint[];
}

export interface NycNeighborhoodMarker {
  id: string;
  name: string;
  borough: 'Queens' | 'Brooklyn' | 'Manhattan';
  subtitle: string;
  location: LatLngPoint;
  priority: 1 | 2; // 1 = major, 2 = secondary
}

export interface BoroughCameraPreset {
  id: string;
  label: string;
  borough: string;
  targetLat: number;
  targetLng: number;
  distance: number;
  pitch: number;
  yaw: number;
  description: string;
}

/**
 * High-fidelity geographical polygon footprints for Queens, Brooklyn,
 * and surrounding NYC landmasses, enabling a complete 3D cache terrain map.
 */
export const NYC_BOROUGH_LANDMASSES: BoroughLandmass[] = [
  // 1. QUEENS LANDMASS (Long Island City, Astoria, Flushing, Jamaica, Maspeth)
  {
    id: 'landmass-queens',
    name: 'Queens',
    borough: 'Queens',
    colorHex: '#0c1527',
    edgeColorHex: '#38bdf8',
    surfaceElevation: 0.15,
    polygon: [
      // Hunters Point / Long Island City
      { lat: 40.7420, lng: -73.9590 },
      { lat: 40.7510, lng: -73.9530 },
      // Queensbridge / Astoria waterfront
      { lat: 40.7620, lng: -73.9420 },
      { lat: 40.7740, lng: -73.9350 },
      { lat: 40.7810, lng: -73.9210 },
      // Bowery Bay & LGA waterfront
      { lat: 40.7790, lng: -73.8980 },
      { lat: 40.7750, lng: -73.8730 },
      // Flushing Bay
      { lat: 40.7650, lng: -73.8510 },
      { lat: 40.7750, lng: -73.8420 },
      // College Point & Whitestone
      { lat: 40.7930, lng: -73.8400 },
      { lat: 40.7970, lng: -73.8110 },
      { lat: 40.7900, lng: -73.7850 },
      // Bayside & Little Neck Bay
      { lat: 40.7720, lng: -73.7630 },
      { lat: 40.7550, lng: -73.7420 },
      // Queens East Border (Nassau boundary)
      { lat: 40.7350, lng: -73.7150 },
      { lat: 40.7100, lng: -73.7080 },
      { lat: 40.6750, lng: -73.7250 },
      // Jamaica Bay / JFK Airport Northern Shore
      { lat: 40.6550, lng: -73.7750 },
      { lat: 40.6500, lng: -73.8200 },
      { lat: 40.6650, lng: -73.8480 },
      // Howard Beach & Ozone Park boundary with Brooklyn
      { lat: 40.6800, lng: -73.8650 },
      { lat: 40.6930, lng: -73.8750 },
      // Cypress Hills & Highland Park (Queens/Brooklyn border)
      { lat: 40.7020, lng: -73.8920 },
      // Ridgewood & Fresh Pond
      { lat: 40.7080, lng: -73.9050 },
      // Maspeth (Grand Avenue Depot zone)
      { lat: 40.7180, lng: -73.9140 },
      // Newtown Creek waterfront (Queens side)
      { lat: 40.7250, lng: -73.9260 },
      { lat: 40.7330, lng: -73.9420 },
      { lat: 40.7380, lng: -73.9550 },
    ],
  },

  // 2. BROOKLYN LANDMASS (Downtown Brooklyn, Williamsburg, Greenpoint, Bushwick, Red Hook, Flatbush)
  {
    id: 'landmass-brooklyn',
    name: 'Brooklyn',
    borough: 'Brooklyn',
    colorHex: '#0b1322',
    edgeColorHex: '#0284c7',
    surfaceElevation: 0.15,
    polygon: [
      // Greenpoint (tip of Brooklyn on Newtown Creek)
      { lat: 40.7375, lng: -73.9555 },
      // Williamsburg waterfront on East River
      { lat: 40.7230, lng: -73.9660 },
      { lat: 40.7120, lng: -73.9710 },
      // Brooklyn Navy Yard
      { lat: 40.7030, lng: -73.9780 },
      // DUMBO & Brooklyn Heights
      { lat: 40.7050, lng: -73.9920 },
      { lat: 40.6980, lng: -74.0000 },
      // Red Hook & Buttermilk Channel
      { lat: 40.6840, lng: -74.0150 },
      { lat: 40.6720, lng: -74.0200 },
      // Gowanus Bay & Sunset Park
      { lat: 40.6580, lng: -74.0160 },
      { lat: 40.6400, lng: -74.0280 },
      // Bay Ridge & Verrazzano Narrows
      { lat: 40.6150, lng: -74.0410 },
      { lat: 40.5980, lng: -74.0350 },
      // Coney Island & Gravesend Bay
      { lat: 40.5750, lng: -74.0080 },
      { lat: 40.5720, lng: -73.9780 },
      // Brighton Beach & Manhattan Beach
      { lat: 40.5750, lng: -73.9450 },
      // Sheepshead Bay & Marine Park
      { lat: 40.5900, lng: -73.9200 },
      // Jamaica Bay (Brooklyn side) & Flatlands
      { lat: 40.6200, lng: -73.8950 },
      { lat: 40.6450, lng: -73.8650 },
      // East New York & Spring Creek (boundary with Queens)
      { lat: 40.6650, lng: -73.8500 },
      { lat: 40.6800, lng: -73.8640 },
      // Highland Park & Cypress Hills (border with Queens)
      { lat: 40.6930, lng: -73.8740 },
      { lat: 40.7020, lng: -73.8910 },
      // Bushwick & border with Ridgewood Queens
      { lat: 40.7075, lng: -73.9045 },
      // East Williamsburg & Newtown Creek (Brooklyn side)
      { lat: 40.7170, lng: -73.9240 },
      { lat: 40.7240, lng: -73.9360 },
      { lat: 40.7330, lng: -73.9490 },
    ],
  },

  // 3. MANHATTAN ISLAND (Battery Park, Lower East Side, Midtown, Central Park, Upper Manhattan)
  {
    id: 'landmass-manhattan',
    name: 'Manhattan',
    borough: 'Manhattan',
    colorHex: '#090e18',
    edgeColorHex: '#64748b',
    surfaceElevation: 0.18,
    polygon: [
      // Battery Park (South tip)
      { lat: 40.7015, lng: -74.0150 },
      // East River shore: Two Bridges & LES
      { lat: 40.7100, lng: -73.9870 },
      { lat: 40.7200, lng: -73.9740 },
      // East Village & Stuyvesant Town
      { lat: 40.7330, lng: -73.9720 },
      // Midtown East (UN & Queensboro bridge approach)
      { lat: 40.7510, lng: -73.9630 },
      { lat: 40.7630, lng: -73.9550 },
      // Upper East Side & Yorkville
      { lat: 40.7760, lng: -73.9430 },
      { lat: 40.7950, lng: -73.9310 },
      // East Harlem & Harlem River
      { lat: 40.8120, lng: -73.9310 },
      // Washington Heights & Hudson River
      { lat: 40.8400, lng: -73.9420 },
      { lat: 40.8350, lng: -73.9550 },
      // Morningside & Upper West Side
      { lat: 40.8050, lng: -73.9720 },
      { lat: 40.7850, lng: -73.9870 },
      // Midtown West (Hudson Yards / Hell's Kitchen)
      { lat: 40.7600, lng: -74.0040 },
      { lat: 40.7400, lng: -74.0120 },
      // Chelsea & Tribeca / Battery Park City
      { lat: 40.7220, lng: -74.0170 },
      { lat: 40.7070, lng: -74.0180 },
    ],
  },

  // 4. ROOSEVELT ISLAND (In East River between Manhattan and Queens)
  {
    id: 'landmass-roosevelt-island',
    name: 'Roosevelt Island',
    borough: 'Manhattan',
    colorHex: '#0c1628',
    edgeColorHex: '#38bdf8',
    surfaceElevation: 0.22,
    polygon: [
      { lat: 40.7500, lng: -73.9610 },
      { lat: 40.7570, lng: -73.9535 },
      { lat: 40.7690, lng: -73.9430 },
      { lat: 40.7710, lng: -73.9445 },
      { lat: 40.7610, lng: -73.9540 },
      { lat: 40.7510, lng: -73.9625 },
    ],
  },
];

/**
 * 3D NYC Iconic Bridges connecting Queens, Brooklyn, and Manhattan.
 * Modeled with elevated deck curves, towers, and luminous stay cables.
 */
export const NYC_BRIDGES_3D: NycBridge3D[] = [
  // Pulaski Bridge (Greenpoint Brooklyn <-> Long Island City Queens across Newtown Creek) - Critical for B62!
  {
    id: 'bridge-pulaski',
    name: 'Pulaski Bridge',
    connects: 'Greenpoint (BK) ↔ Long Island City (QNS)',
    type: 'bascule',
    colorHex: '#38BDF8',
    deckElevation: 3.8,
    towerHeight: 9.0,
    path: [
      { lat: 40.7335, lng: -73.9535 },
      { lat: 40.7385, lng: -73.9515 },
      { lat: 40.7425, lng: -73.9500 },
    ],
  },

  // Kosciuszko Bridge (Greenpoint Brooklyn <-> Maspeth Queens across Newtown Creek right next to Grand Ave Depot!)
  {
    id: 'bridge-kosciuszko',
    name: 'Kosciuszko Bridge (BQE / I-278)',
    connects: 'Greenpoint (BK) ↔ Maspeth (QNS) [Grand Ave]',
    type: 'cable-stayed',
    colorHex: '#F59E0B',
    deckElevation: 5.5,
    towerHeight: 18.0,
    path: [
      { lat: 40.7240, lng: -73.9350 },
      { lat: 40.7275, lng: -73.9310 },
      { lat: 40.7310, lng: -73.9270 },
    ],
  },

  // Williamsburg Bridge (Williamsburg Brooklyn <-> Lower Manhattan) - B39, B60, Q54, Q59 terminus!
  {
    id: 'bridge-williamsburg',
    name: 'Williamsburg Bridge',
    connects: 'Williamsburg (BK) ↔ Lower East Side (MN)',
    type: 'suspension',
    colorHex: '#EC4899',
    deckElevation: 5.8,
    towerHeight: 22.0,
    path: [
      { lat: 40.7095, lng: -73.9650 },
      { lat: 40.7135, lng: -73.9725 },
      { lat: 40.7175, lng: -73.9825 },
    ],
  },

  // Queensboro Bridge (Long Island City Queens <-> Midtown Manhattan)
  {
    id: 'bridge-queensboro',
    name: 'Queensboro (59th St) Bridge',
    connects: 'Long Island City (QNS) ↔ Midtown East (MN)',
    type: 'cantilever',
    colorHex: '#38BDF8',
    deckElevation: 6.2,
    towerHeight: 24.0,
    path: [
      { lat: 40.7510, lng: -73.9430 },
      { lat: 40.7570, lng: -73.9540 },
      { lat: 40.7610, lng: -73.9635 },
    ],
  },

  // Brooklyn Bridge (Downtown Brooklyn <-> Lower Manhattan)
  {
    id: 'bridge-brooklyn',
    name: 'Brooklyn Bridge',
    connects: 'Downtown Brooklyn (BK) ↔ City Hall (MN)',
    type: 'suspension',
    colorHex: '#10B981',
    deckElevation: 5.2,
    towerHeight: 20.0,
    path: [
      { lat: 40.6990, lng: -73.9910 },
      { lat: 40.7060, lng: -73.9970 },
      { lat: 40.7115, lng: -74.0040 },
    ],
  },

  // Manhattan Bridge (Downtown Brooklyn <-> Chinatown Manhattan)
  {
    id: 'bridge-manhattan',
    name: 'Manhattan Bridge',
    connects: 'DUMBO (BK) ↔ Chinatown (MN)',
    type: 'suspension',
    colorHex: '#6366F1',
    deckElevation: 5.4,
    towerHeight: 21.0,
    path: [
      { lat: 40.7020, lng: -73.9870 },
      { lat: 40.7075, lng: -73.9910 },
      { lat: 40.7145, lng: -73.9960 },
    ],
  },

  // RFK / Triborough Bridge (Astoria Queens <-> Randall's Island / Manhattan / Bronx)
  {
    id: 'bridge-rfk',
    name: 'RFK Triborough Bridge',
    connects: 'Astoria (QNS) ↔ Randall’s Island (MN)',
    type: 'suspension',
    colorHex: '#0EA5E9',
    deckElevation: 6.5,
    towerHeight: 23.0,
    path: [
      { lat: 40.7760, lng: -73.9230 },
      { lat: 40.7850, lng: -73.9260 },
      { lat: 40.7930, lng: -73.9280 },
    ],
  },
];

/**
 * Major 3D Arterial Highways & Expressways in Queens and Brooklyn.
 * Rendered as glowing neon ribbons over the landmass.
 */
export const NYC_MAJOR_ARTERIALS: NycArterial3D[] = [
  // Brooklyn-Queens Expressway (I-278 BQE) weaving through Brooklyn into Queens past Maspeth!
  {
    id: 'arterial-bqe',
    name: 'Brooklyn-Queens Expressway',
    badge: 'I-278 BQE',
    borough: 'Multi-Borough',
    colorHex: '#0284C7',
    path: [
      { lat: 40.6800, lng: -74.0020 },
      { lat: 40.6960, lng: -73.9920 },
      { lat: 40.7020, lng: -73.9780 },
      { lat: 40.7140, lng: -73.9520 },
      { lat: 40.7240, lng: -73.9350 }, // Kosciuszko Bridge approach
      { lat: 40.7300, lng: -73.9240 }, // Queens / Maspeth (Grand Ave Depot)
      { lat: 40.7420, lng: -73.9080 }, // Woodside
      { lat: 40.7600, lng: -73.8990 }, // Astoria
      { lat: 40.7750, lng: -73.9180 }, // RFK approach
    ],
  },

  // Long Island Expressway (I-495 LIE) traversing Queens right by Grand Avenue Depot!
  {
    id: 'arterial-lie',
    name: 'Long Island Expressway',
    badge: 'I-495 LIE',
    borough: 'Queens',
    colorHex: '#38BDF8',
    path: [
      { lat: 40.7420, lng: -73.9550 }, // Queens-Midtown Tunnel portal
      { lat: 40.7380, lng: -73.9380 }, // Sunnyside
      { lat: 40.7280, lng: -73.9200 }, // Maspeth (Grand Ave Depot access!)
      { lat: 40.7310, lng: -73.8900 }, // Elmhurst
      { lat: 40.7380, lng: -73.8600 }, // Corona / Flushing Meadows
      { lat: 40.7440, lng: -73.8200 }, // Flushing South
      { lat: 40.7500, lng: -73.7700 }, // Fresh Meadows / Bayside
    ],
  },

  // Grand Avenue Corridor (connecting Williamsburg Brooklyn through Maspeth Queens)
  {
    id: 'arterial-grand-ave',
    name: 'Grand Avenue Corridor',
    badge: 'GA TRANSIT',
    borough: 'Multi-Borough',
    colorHex: '#F59E0B',
    path: [
      { lat: 40.7110, lng: -73.9580 }, // Williamsburg
      { lat: 40.7140, lng: -73.9420 }, // East Williamsburg
      { lat: 40.7180, lng: -73.9260 }, // Newtown Creek
      { lat: 40.7210, lng: -73.9160 }, // Maspeth (Grand Avenue Depot at 48-05 Grand Ave!)
      { lat: 40.7260, lng: -73.9020 }, // Elmhurst Queens Blvd junction
    ],
  },

  // Queens Boulevard (The spine of central Queens)
  {
    id: 'arterial-queens-blvd',
    name: 'Queens Boulevard',
    badge: 'QNS BLVD',
    borough: 'Queens',
    colorHex: '#818CF8',
    path: [
      { lat: 40.7490, lng: -73.9410 }, // Queens Plaza / LIC
      { lat: 40.7430, lng: -73.9220 }, // Sunnyside
      { lat: 40.7410, lng: -73.9000 }, // Woodside
      { lat: 40.7320, lng: -73.8750 }, // Elmhurst / Queens Center
      { lat: 40.7210, lng: -73.8450 }, // Forest Hills
      { lat: 40.7100, lng: -73.8250 }, // Kew Gardens
      { lat: 40.7020, lng: -73.8050 }, // Jamaica Sutphin
    ],
  },

  // Atlantic Avenue & Flatbush Avenue (Brooklyn Core Transit Arterials)
  {
    id: 'arterial-atlantic-ave',
    name: 'Atlantic Avenue Trunk',
    badge: 'ATLANTIC',
    borough: 'Brooklyn',
    colorHex: '#10B981',
    path: [
      { lat: 40.6930, lng: -73.9990 }, // Brooklyn Waterfront
      { lat: 40.6860, lng: -73.9780 }, // Barclays Center / Atlantic Terminal
      { lat: 40.6780, lng: -73.9480 }, // Bedford-Stuyvesant
      { lat: 40.6760, lng: -73.9120 }, // Crown Heights East
      { lat: 40.6790, lng: -73.8820 }, // East New York
    ],
  },
];

/**
 * Prominent Queens and Brooklyn Neighborhood and Transit Hub Markers.
 */
export const NYC_NEIGHBORHOOD_MARKERS: NycNeighborhoodMarker[] = [
  // QUEENS NEIGHBORHOODS
  {
    id: 'hood-maspeth',
    name: 'MASPETH',
    borough: 'Queens',
    subtitle: 'Grand Avenue Depot Hub',
    location: { lat: 40.7218, lng: -73.9168 },
    priority: 1,
  },
  {
    id: 'hood-lic',
    name: 'LONG ISLAND CITY',
    borough: 'Queens',
    subtitle: 'Queens Plaza • Skyline Tower',
    location: { lat: 40.7485, lng: -73.9442 },
    priority: 1,
  },
  {
    id: 'hood-flushing',
    name: 'FLUSHING',
    borough: 'Queens',
    subtitle: 'Main St Hub • Citi Field',
    location: { lat: 40.7585, lng: -73.8300 },
    priority: 1,
  },
  {
    id: 'hood-jamaica',
    name: 'JAMAICA',
    borough: 'Queens',
    subtitle: 'LIRR • AirTrain Terminal',
    location: { lat: 40.7020, lng: -73.8010 },
    priority: 1,
  },
  {
    id: 'hood-astoria',
    name: 'ASTORIA',
    borough: 'Queens',
    subtitle: 'Ditmars • Kaufman Studios',
    location: { lat: 40.7680, lng: -73.9240 },
    priority: 2,
  },
  {
    id: 'hood-sunnyside',
    name: 'SUNNYSIDE',
    borough: 'Queens',
    subtitle: 'Sunnyside Yards • Q32 Corridor',
    location: { lat: 40.7420, lng: -73.9250 },
    priority: 2,
  },
  {
    id: 'hood-ridgewood',
    name: 'RIDGEWOOD',
    borough: 'Queens',
    subtitle: 'Fresh Pond • GA Depot Border',
    location: { lat: 40.7060, lng: -73.9020 },
    priority: 2,
  },

  // BROOKLYN NEIGHBORHOODS
  {
    id: 'hood-dt-bklyn',
    name: 'DOWNTOWN BROOKLYN',
    borough: 'Brooklyn',
    subtitle: 'The Brooklyn Tower • MetroTech',
    location: { lat: 40.6920, lng: -73.9840 },
    priority: 1,
  },
  {
    id: 'hood-williamsburg',
    name: 'WILLIAMSBURG',
    borough: 'Brooklyn',
    subtitle: 'Domino Sugar • B39 / B60 Plaza',
    location: { lat: 40.7130, lng: -73.9610 },
    priority: 1,
  },
  {
    id: 'hood-greenpoint',
    name: 'GREENPOINT',
    borough: 'Brooklyn',
    subtitle: 'Pulaski Bridge • B62 Corridor',
    location: { lat: 40.7300, lng: -73.9510 },
    priority: 1,
  },
  {
    id: 'hood-bushwick',
    name: 'BUSHWICK',
    borough: 'Brooklyn',
    subtitle: 'Jefferson St • B60 Corridor',
    location: { lat: 40.7000, lng: -73.9260 },
    priority: 1,
  },
  {
    id: 'hood-red-hook',
    name: 'RED HOOK',
    borough: 'Brooklyn',
    subtitle: 'Beard St Piers • B57 Terminus',
    location: { lat: 40.6760, lng: -74.0110 },
    priority: 2,
  },
  {
    id: 'hood-bed-stuy',
    name: 'BED-STUY',
    borough: 'Brooklyn',
    subtitle: 'Fulton St • B47 Corridor',
    location: { lat: 40.6860, lng: -73.9420 },
    priority: 2,
  },
  {
    id: 'hood-dumbo',
    name: 'DUMBO',
    borough: 'Brooklyn',
    subtitle: 'Manhattan & Brooklyn Bridges',
    location: { lat: 40.7030, lng: -73.9890 },
    priority: 2,
  },
  {
    id: 'hood-flatbush',
    name: 'FLATBUSH',
    borough: 'Brooklyn',
    subtitle: 'Flatbush Depot • Kings Theatre',
    location: { lat: 40.6450, lng: -73.9550 },
    priority: 2,
  },

  // MANHATTAN
  {
    id: 'hood-midtown-man',
    name: 'MIDTOWN MANHATTAN',
    borough: 'Manhattan',
    subtitle: 'Empire State • Grand Central',
    location: { lat: 40.7530, lng: -73.9800 },
    priority: 1,
  },
  {
    id: 'hood-lower-man',
    name: 'LOWER MANHATTAN',
    borough: 'Manhattan',
    subtitle: 'One WTC • Wall Street',
    location: { lat: 40.7110, lng: -74.0090 },
    priority: 1,
  },
];

/**
 * Camera preset views tailored specifically for inspecting Queens, Brooklyn,
 * Grand Avenue Depot, and the entire NYC metropolitan transit network.
 */
export const BOROUGH_CAMERA_PRESETS: BoroughCameraPreset[] = [
  {
    id: 'preset-grand-ave',
    label: 'Grand Ave Depot',
    borough: 'Queens',
    targetLat: 40.7218,
    targetLng: -73.9168,
    distance: 280,
    pitch: 0.52,
    yaw: -0.28,
    description: 'Close-up orbital focus on Grand Avenue Depot in Maspeth & Newtown Creek',
  },
  {
    id: 'preset-queens',
    label: 'Queens Overview',
    borough: 'Queens',
    targetLat: 40.7420,
    targetLng: -73.8900,
    distance: 620,
    pitch: 0.62,
    yaw: -0.35,
    description: 'Elevated panorama across Long Island City, Maspeth, Flushing, and Jamaica',
  },
  {
    id: 'preset-brooklyn',
    label: 'Brooklyn Overview',
    borough: 'Brooklyn',
    targetLat: 40.6980,
    targetLng: -73.9650,
    distance: 590,
    pitch: 0.60,
    yaw: -0.42,
    description: 'Panoramic view over Downtown Brooklyn, Williamsburg, Greenpoint, and Bushwick',
  },
  {
    id: 'preset-nyc-metro',
    label: 'Full NYC 3D Map',
    borough: 'All',
    targetLat: 40.7260,
    targetLng: -73.9350,
    distance: 980,
    pitch: 0.76,
    yaw: -0.38,
    description: 'Complete wide-angle perspective encompassing Queens, Brooklyn, and Manhattan',
  },
  {
    id: 'preset-manhattan',
    label: 'Manhattan',
    borough: 'Manhattan',
    targetLat: 40.7450,
    targetLng: -73.9820,
    distance: 460,
    pitch: 0.54,
    yaw: -0.45,
    description: 'Midtown & Lower Manhattan skyline across the East River',
  },
];
