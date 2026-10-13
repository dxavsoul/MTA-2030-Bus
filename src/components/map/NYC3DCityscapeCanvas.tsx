import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Layers,
  MapPin,
  Navigation,
  Eye,
  Check,
  Building2,
  Sparkles,
  RotateCcw,
  Maximize2,
  ChevronRight,
  Shield,
  Users,
} from 'lucide-react';
import {
  LatLngPoint,
  MtaDepot,
  ObaStop,
  SiriMonitoredJourneyTraceResponse,
  SiriVehicleActivity,
  VehicleOccupancyInfo,
  VehicleOccupancyLevel,
} from '../../types/transit';
import { AdWordsCampaign } from '../../types/admin';
import {
  parseVehicleOccupancy,
  calculateFleetOccupancySummary,
  OCCUPANCY_COLOR_MAP,
  OccupancyFleetSummary,
} from '../../services/siriPayloadParser';
import {
  createGlassBuildingShaderMaterial,
  latLngToSceneMeters,
} from '../../lib/webglBuildingOverlay';
import {
  NYC_3D_BUILDINGS,
  NYC_CENTER,
  ROUTE_CATALOG,
  MTA_DEPOTS,
} from '../../data/nycMtaCache';
import {
  NYC_BOROUGH_LANDMASSES,
  NYC_BRIDGES_3D,
  NYC_MAJOR_ARTERIALS,
  NYC_NEIGHBORHOOD_MARKERS,
  BOROUGH_CAMERA_PRESETS,
  BoroughCameraPreset,
  NycNeighborhoodMarker,
} from '../../data/nycLandmassCache';

export type CameraPresetMode = 'STREET_3D' | 'ISOMETRIC_3D' | 'TACTICAL_TOP' | 'FOLLOW_BUS';

interface NYC3DCityscapeCanvasProps {
  activities: SiriVehicleActivity[];
  selectedDepot: MtaDepot | null;
  selectedRouteId: string;
  selectedVehicleRef: string | null;
  journeyTrace: SiriMonitoredJourneyTraceResponse | null;
  routeStops: ObaStop[];
  buildingOpacity: number;
  showBuildings: boolean;
  showRouteShapes: boolean;
  showStops: boolean;
  cameraPreset: CameraPresetMode;
  hoveredRouteId?: string | null;
  sponsoredCampaigns?: AdWordsCampaign[];
  onSelectVehicle: (vehicleRef: string | null) => void;
  onSelectRoute: (routeId: string) => void;
  onSelectDepot?: (depotId: string) => void;
  onHoverRoute?: (routeId: string | null) => void;
  cameraResetTrigger: number;
}

interface ProjectedBusOverlay {
  vehicleRef: string;
  shortNumber: string;
  lineName: string;
  screenX: number;
  screenY: number;
  colorHex: string;
  bearing: number;
  adherenceStatus: string;
  speedMph: number;
  nextStopName: string;
  presentableDistance: string;
  isSelected: boolean;
  visible: boolean;
  occupancy: VehicleOccupancyInfo;
}

interface ProjectedLandmarkOverlay {
  id: string;
  name: string;
  screenX: number;
  screenY: number;
  heightMeters: number;
  visible: boolean;
  depotId?: string;
  borough?: string;
  assignedRouteIds?: string[];
  electricBays?: number;
}

interface ProjectedNeighborhoodOverlay {
  id: string;
  name: string;
  borough: string;
  subtitle: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  priority: 1 | 2;
  location: LatLngPoint;
}

const SCENE_SCALE = 0.1;

export const NYC3DCityscapeCanvas: React.FC<NYC3DCityscapeCanvasProps> = ({
  activities,
  selectedDepot,
  selectedRouteId,
  selectedVehicleRef,
  journeyTrace,
  buildingOpacity,
  showBuildings,
  showRouteShapes,
  showStops,
  cameraPreset,
  hoveredRouteId,
  sponsoredCampaigns = [],
  onSelectVehicle,
  onSelectRoute,
  onSelectDepot,
  onHoverRoute,
  cameraResetTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const fallback2DCanvasRef = useRef<HTMLCanvasElement>(null);

  const [useSoftware3DEngine, setUseSoftware3DEngine] = useState(false);
  const [hoveredVehicleRef, setHoveredVehicleRef] = useState<string | null>(null);
  const [projectedBuses, setProjectedBuses] = useState<ProjectedBusOverlay[]>([]);
  const [projectedLandmarks, setProjectedLandmarks] = useState<ProjectedLandmarkOverlay[]>([]);
  const [projectedNeighborhoods, setProjectedNeighborhoods] = useState<ProjectedNeighborhoodOverlay[]>([]);

  // Toggles for 3D map features
  const [showLandmasses, setShowLandmasses] = useState(true);
  const [showBridgesAndHighways, setShowBridgesAndHighways] = useState(true);
  const [showNeighborhoodBadges, setShowNeighborhoodBadges] = useState(true);
  const [activeBoroughPreset, setActiveBoroughPreset] = useState<string | null>(null);

  // Real-time Vehicle Load / Occupancy filter and summary
  const [occupancyFilter, setOccupancyFilter] = useState<VehicleOccupancyLevel | 'ALL'>('ALL');
  const fleetOccupancySummary = useMemo(
    () => calculateFleetOccupancySummary(activities),
    [activities]
  );

  const cameraStateRef = useRef({
    targetX: 0,
    targetZ: 0,
    desiredTargetX: 0,
    desiredTargetZ: 0,
    yaw: -0.42,
    desiredYaw: -0.42,
    pitch: 0.68,
    desiredPitch: 0.68,
    distance: 520,
    desiredDistance: 520,
    isDragging: false,
    dragButton: 0,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  const propsRef = useRef({
    activities,
    selectedDepot,
    selectedRouteId,
    selectedVehicleRef,
    journeyTrace,
    buildingOpacity,
    showBuildings,
    showRouteShapes,
    showStops,
    cameraPreset,
    hoveredRouteId,
    showLandmasses,
    showBridgesAndHighways,
    occupancyFilter,
  });

  useEffect(() => {
    propsRef.current = {
      activities,
      selectedDepot,
      selectedRouteId,
      selectedVehicleRef,
      journeyTrace,
      buildingOpacity,
      showBuildings,
      showRouteShapes,
      showStops,
      cameraPreset,
      hoveredRouteId,
      showLandmasses,
      showBridgesAndHighways,
      occupancyFilter,
    };
  }, [
    activities,
    selectedDepot,
    selectedRouteId,
    selectedVehicleRef,
    journeyTrace,
    buildingOpacity,
    showBuildings,
    showRouteShapes,
    showStops,
    cameraPreset,
    hoveredRouteId,
    showLandmasses,
    showBridgesAndHighways,
    occupancyFilter,
  ]);

  // Handle preset switching and props changes
  useEffect(() => {
    const cam = cameraStateRef.current;

    if (cameraPreset === 'STREET_3D') {
      cam.desiredPitch = 0.54;
      cam.desiredDistance = Math.min(cam.desiredDistance, 390);
    } else if (cameraPreset === 'ISOMETRIC_3D') {
      cam.desiredPitch = 0.76;
    } else if (cameraPreset === 'TACTICAL_TOP') {
      cam.desiredPitch = 1.48;
    } else if (cameraPreset === 'FOLLOW_BUS') {
      cam.desiredPitch = 0.50;
      cam.desiredDistance = 210;
    }

    if (selectedVehicleRef) {
      const bus = activities.find(
        (a) => a.MonitoredVehicleJourney.VehicleRef === selectedVehicleRef
      );
      if (bus) {
        const loc = bus.MonitoredVehicleJourney.VehicleLocation;
        const pos = latLngToSceneMeters(
          { lat: loc.Latitude, lng: loc.Longitude },
          NYC_CENTER,
          SCENE_SCALE
        );
        cam.desiredTargetX = pos.x;
        cam.desiredTargetZ = pos.z;
        if (cameraPreset !== 'TACTICAL_TOP') {
          cam.desiredDistance = 230;
        }
        return;
      }
    }

    if (selectedRouteId && selectedRouteId !== 'ALL') {
      const rDef = ROUTE_CATALOG.find((r) => r.route.id === selectedRouteId);
      if (rDef && rDef.shapePoints.length > 0) {
        const mid = rDef.shapePoints[Math.floor(rDef.shapePoints.length / 2)];
        const pos = latLngToSceneMeters(mid, NYC_CENTER, SCENE_SCALE);
        cam.desiredTargetX = pos.x;
        cam.desiredTargetZ = pos.z;
        cam.desiredDistance = 380;
        return;
      }
    }

    if (selectedDepot) {
      const pos = latLngToSceneMeters(selectedDepot.location, NYC_CENTER, SCENE_SCALE);
      cam.desiredTargetX = pos.x;
      cam.desiredTargetZ = pos.z;
      cam.desiredDistance = 340;
      if (cameraPreset === 'STREET_3D') {
        cam.desiredPitch = 0.52;
      }
      return;
    }

    // Default overview centering if no preset button was clicked
    if (!activeBoroughPreset) {
      cam.desiredTargetX = 0;
      cam.desiredTargetZ = 0;
      cam.desiredDistance = 540;
    }
  }, [selectedDepot, selectedRouteId, selectedVehicleRef, cameraPreset, cameraResetTrigger]);

  const flyToBoroughPreset = (preset: BoroughCameraPreset) => {
    setActiveBoroughPreset(preset.id);
    const cam = cameraStateRef.current;
    const pos = latLngToSceneMeters(
      { lat: preset.targetLat, lng: preset.targetLng },
      NYC_CENTER,
      SCENE_SCALE
    );
    cam.desiredTargetX = pos.x;
    cam.desiredTargetZ = pos.z;
    cam.desiredDistance = preset.distance;
    cam.desiredPitch = preset.pitch;
    cam.desiredYaw = preset.yaw;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cameraStateRef.current.isDragging = true;
    cameraStateRef.current.dragButton = e.button;
    cameraStateRef.current.lastMouseX = e.clientX;
    cameraStateRef.current.lastMouseY = e.clientY;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const cam = cameraStateRef.current;
    if (!cam.isDragging) return;

    const dx = e.clientX - cam.lastMouseX;
    const dy = e.clientY - cam.lastMouseY;
    cam.lastMouseX = e.clientX;
    cam.lastMouseY = e.clientY;

    if (cam.dragButton === 2 || e.shiftKey) {
      cam.yaw -= dx * 0.0065;
      cam.desiredYaw = cam.yaw;
      cam.desiredPitch = Math.max(0.28, Math.min(1.52, cam.desiredPitch + dy * 0.0055));
      cam.pitch = cam.desiredPitch;
    } else {
      const panFactor = cam.distance * 0.0018;
      const cosY = Math.cos(cam.yaw);
      const sinY = Math.sin(cam.yaw);
      cam.desiredTargetX -= (dx * cosY + dy * sinY) * panFactor;
      cam.desiredTargetZ -= (-dx * sinY + dy * cosY) * panFactor;
      cam.targetX = cam.desiredTargetX;
      cam.targetZ = cam.desiredTargetZ;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    cameraStateRef.current.isDragging = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const cam = cameraStateRef.current;
    const zoomDelta = e.deltaY * 0.45;
    cam.desiredDistance = Math.max(90, Math.min(1900, cam.desiredDistance + zoomDelta));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = webglCanvasRef.current;
    if (!container || !canvas) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x070b12, 1);
    } catch (_err) {
      setUseSoftware3DEngine(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b12, 0.00042);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(1, container.clientHeight),
      2,
      5000
    );

    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.25);
    keyLight.position.set(400, 950, 350);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-500, 500, -400);
    scene.add(rimLight);

    // Deep water plane for East River, Hudson River, Long Island Sound & Atlantic Ocean
    const waterGeom = new THREE.PlaneGeometry(8000, 8000);
    waterGeom.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x050811 });
    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.position.y = -0.7;
    scene.add(waterMesh);

    // Secondary subtle water current grid
    const waterGrid = new THREE.GridHelper(5000, 100, 0x0f1d36, 0x070d1a);
    waterGrid.position.y = -0.65;
    scene.add(waterGrid);

    // 1. 3D LANDMASS PLATES: Queens, Brooklyn, Manhattan & Roosevelt Island
    const landmassGroup = new THREE.Group();
    scene.add(landmassGroup);

    for (const lm of NYC_BOROUGH_LANDMASSES) {
      const shape = new THREE.Shape();
      const pts = lm.polygon.map((pt) => latLngToSceneMeters(pt, NYC_CENTER, SCENE_SCALE));
      pts.forEach((p, idx) => {
        if (idx === 0) shape.moveTo(p.x, -p.z);
        else shape.lineTo(p.x, -p.z);
      });
      shape.closePath();

      // Extrude terrain plate
      const extrudeGeom = new THREE.ExtrudeGeometry(shape, {
        depth: 1.2,
        bevelEnabled: true,
        bevelThickness: 0.35,
        bevelSize: 0.35,
        bevelSegments: 1,
      });
      extrudeGeom.rotateX(-Math.PI / 2);
      extrudeGeom.translate(0, -0.6, 0);

      const landMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(lm.colorHex),
        roughness: 0.85,
        metalness: 0.15,
      });
      const landMesh = new THREE.Mesh(extrudeGeom, landMat);
      landmassGroup.add(landMesh);

      // Glowing Shoreline Edge Loop
      const edgePts = pts.map((p) => new THREE.Vector3(p.x, 0.65, p.z));
      edgePts.push(edgePts[0].clone());
      const edgeGeom = new THREE.BufferGeometry().setFromPoints(edgePts);
      const edgeMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(lm.edgeColorHex),
        transparent: true,
        opacity: 0.85,
      });
      landmassGroup.add(new THREE.Line(edgeGeom, edgeMat));
    }

    // 2. 3D BRIDGES CONNECTING QUEENS, BROOKLYN, & MANHATTAN
    const bridgesGroup = new THREE.Group();
    scene.add(bridgesGroup);

    for (const br of NYC_BRIDGES_3D) {
      const pts3D = br.path.map((pt) => {
        const p = latLngToSceneMeters(pt, NYC_CENTER, SCENE_SCALE);
        return new THREE.Vector3(p.x, br.deckElevation, p.z);
      });

      if (pts3D.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(pts3D);
        const deckGeom = new THREE.TubeGeometry(curve, pts3D.length * 6, 0.9, 8, false);
        const deckMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(br.colorHex),
          roughness: 0.3,
          metalness: 0.6,
          emissive: new THREE.Color(br.colorHex),
          emissiveIntensity: 0.45,
        });
        bridgesGroup.add(new THREE.Mesh(deckGeom, deckMat));

        // Central pylon/towers
        const midIdx = Math.floor(pts3D.length / 2);
        const towerPos = pts3D[midIdx];
        const towerGeom = new THREE.CylinderGeometry(0.6, 0.9, br.towerHeight, 8);
        towerGeom.translate(0, br.towerHeight / 2, 0);
        const towerMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.35,
          metalness: 0.5,
        });
        const towerMesh = new THREE.Mesh(towerGeom, towerMat);
        towerMesh.position.set(towerPos.x, 0, towerPos.z);
        bridgesGroup.add(towerMesh);

        // Stay cables from pylon to ends
        const cablePts = [
          pts3D[0],
          new THREE.Vector3(towerPos.x, br.towerHeight * 0.95, towerPos.z),
          pts3D[pts3D.length - 1],
        ];
        const cableGeom = new THREE.BufferGeometry().setFromPoints(cablePts);
        const cableMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(br.colorHex),
          transparent: true,
          opacity: 0.8,
        });
        bridgesGroup.add(new THREE.Line(cableGeom, cableMat));
      }
    }

    // 3. 3D GLOWING MAJOR ARTERIAL HIGHWAYS (BQE, LIE, Grand Ave, Queens Blvd, Atlantic Ave)
    const arterialsGroup = new THREE.Group();
    scene.add(arterialsGroup);

    for (const art of NYC_MAJOR_ARTERIALS) {
      const pts3D = art.path.map((pt) => {
        const p = latLngToSceneMeters(pt, NYC_CENTER, SCENE_SCALE);
        return new THREE.Vector3(p.x, 0.45, p.z);
      });

      if (pts3D.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(pts3D, false, 'catmullrom', 0.2);
        const tubeGeom = new THREE.TubeGeometry(curve, pts3D.length * 6, 0.6, 6, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(art.colorHex),
          transparent: true,
          opacity: 0.65,
        });
        arterialsGroup.add(new THREE.Mesh(tubeGeom, tubeMat));
      }
    }

    // 4. 3D URBAN BUILDINGS & LANDMARKS (Queens, Brooklyn, Manhattan & Depots)
    const buildingsGroup = new THREE.Group();
    const buildingMaterials: THREE.ShaderMaterial[] = [];
    const buildingEdgeMaterials: THREE.LineBasicMaterial[] = [];

    for (const b of NYC_3D_BUILDINGS) {
      const pos = latLngToSceneMeters({ lat: b.lat, lng: b.lng }, NYC_CENTER, SCENE_SCALE);
      const w = b.widthMeters * SCENE_SCALE;
      const d = b.depthMeters * SCENE_SCALE;
      const h = b.heightMeters * SCENE_SCALE;

      const isDepot = b.id.startsWith('bldg-depot-');
      const bldgMat = createGlassBuildingShaderMaterial(
        propsRef.current.buildingOpacity,
        Boolean(b.isLandmark),
        b.heightMeters
      );
      buildingMaterials.push(bldgMat);

      const edgeColor = isDepot ? 0xf59e0b : b.isLandmark ? 0x38bdf8 : 0x475569;
      const edgeMat = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: Math.min(0.85, propsRef.current.buildingOpacity + 0.15),
      });
      buildingEdgeMaterials.push(edgeMat);

      if (b.steppedTiers && b.steppedTiers.length > 0) {
        const towerGroup = new THREE.Group();
        let currentY = 0;
        for (const tier of b.steppedTiers) {
          const tierH = h * tier.heightRatio;
          const tierGeom = new THREE.BoxGeometry(w * tier.scaleX, tierH, d * tier.scaleZ);
          tierGeom.translate(0, currentY + tierH / 2, 0);
          const tierMesh = new THREE.Mesh(tierGeom, bldgMat);
          towerGroup.add(tierMesh);

          const edges = new THREE.EdgesGeometry(tierGeom);
          towerGroup.add(new THREE.LineSegments(edges, edgeMat));
          currentY += tierH;
        }
        towerGroup.position.set(pos.x, 0, pos.z);
        towerGroup.rotation.y = (b.rotationDeg * Math.PI) / 180;
        buildingsGroup.add(towerGroup);
      } else {
        const boxGeom = new THREE.BoxGeometry(w, h, d);
        boxGeom.translate(0, h / 2, 0);
        const mesh = new THREE.Mesh(boxGeom, bldgMat);
        mesh.position.set(pos.x, 0, pos.z);
        mesh.rotation.y = (b.rotationDeg * Math.PI) / 180;
        buildingsGroup.add(mesh);

        const edges = new THREE.EdgesGeometry(boxGeom);
        const wire = new THREE.LineSegments(edges, edgeMat);
        wire.position.copy(mesh.position);
        wire.rotation.copy(mesh.rotation);
        buildingsGroup.add(wire);
      }
    }
    scene.add(buildingsGroup);

    // 5. Transit Groups (Routes, Stops, Traces, Buses)
    const routesGroup = new THREE.Group();
    const stopsGroup = new THREE.Group();
    const traceGroup = new THREE.Group();
    const busesGroup = new THREE.Group();
    scene.add(routesGroup);
    scene.add(stopsGroup);
    scene.add(traceGroup);
    scene.add(busesGroup);

    const busMeshesMap = new Map<
      string,
      {
        group: THREE.Group;
        bodyMat: THREE.MeshStandardMaterial;
        ringMat: THREE.MeshBasicMaterial;
        occBeaconMat: THREE.MeshStandardMaterial;
        currentX: number;
        currentZ: number;
        targetX: number;
        targetZ: number;
        bearingRad: number;
      }
    >();

    let lastRenderedRouteKey = '';
    const updateRoutesAndStopsGeometry = () => {
      const {
        selectedDepot: dep,
        selectedRouteId: rId,
        showRouteShapes: showShapes,
        showStops: showSt,
        journeyTrace: trace,
      } = propsRef.current;

      const routeKey = `${dep?.id || 'ALL'}|${rId}|${propsRef.current.hoveredRouteId || ''}|${showShapes}|${showSt}|${trace?.VehicleRef || ''}|${trace?.RecordedAtTime || ''}`;
      if (routeKey === lastRenderedRouteKey) return;
      lastRenderedRouteKey = routeKey;

      routesGroup.clear();
      stopsGroup.clear();
      traceGroup.clear();

      if (showShapes) {
        for (const def of ROUTE_CATALOG) {
          if (dep && def.route.depotId !== dep.id && rId === 'ALL') continue;
          const isSelectedRoute = rId === def.route.id || rId === def.route.shortName;
          const isHoveredRoute =
            propsRef.current.hoveredRouteId === def.route.id ||
            propsRef.current.hoveredRouteId === def.route.shortName;
          const isDepotRoute = dep && def.route.depotId === dep.id;
          if (rId !== 'ALL' && !isSelectedRoute) continue;

          let tubeRadius = isSelectedRoute ? 1.25 : isDepotRoute ? 0.95 : 0.58;
          let tubeOpacity = isSelectedRoute ? 0.95 : isDepotRoute ? 0.88 : 0.58;

          if (propsRef.current.hoveredRouteId) {
            if (isHoveredRoute) {
              tubeRadius = 1.6;
              tubeOpacity = 1.0;
            } else {
              tubeRadius = 0.45;
              tubeOpacity = 0.22;
            }
          }

          const pts3D = def.shapePoints.map((pt) => {
            const p = latLngToSceneMeters(pt, NYC_CENTER, SCENE_SCALE);
            return new THREE.Vector3(
              p.x,
              isHoveredRoute ? 1.35 : isSelectedRoute ? 1.15 : isDepotRoute ? 0.88 : 0.48,
              p.z
            );
          });

          if (pts3D.length >= 2) {
            const curve = new THREE.CatmullRomCurve3(pts3D, false, 'catmullrom', 0.15);
            const tubeGeom = new THREE.TubeGeometry(
              curve,
              pts3D.length * 8,
              tubeRadius,
              8,
              false
            );
            const tubeMat = new THREE.MeshBasicMaterial({
              color: new THREE.Color(`#${def.route.color}`),
              transparent: true,
              opacity: tubeOpacity,
            });
            routesGroup.add(new THREE.Mesh(tubeGeom, tubeMat));
          }
        }
      }

      if (showSt) {
        const stopsToDraw =
          rId !== 'ALL'
            ? ROUTE_CATALOG.find((r) => r.route.id === rId || r.route.shortName === rId)?.stops || []
            : ROUTE_CATALOG.filter((r) => !dep || r.route.depotId === dep.id).flatMap((r) => r.stops);

        const stopGeom = new THREE.CylinderGeometry(0.85, 0.85, 1.3, 10);
        const stopMat = new THREE.MeshBasicMaterial({
          color: 0xe2e8f0,
          transparent: true,
          opacity: 0.85,
        });

        for (const st of stopsToDraw) {
          const p = latLngToSceneMeters({ lat: st.lat, lng: st.lon }, NYC_CENTER, SCENE_SCALE);
          const m = new THREE.Mesh(stopGeom, stopMat);
          m.position.set(p.x, 0.65, p.z);
          stopsGroup.add(m);
        }
      }

      if (trace) {
        if (trace.HistoricalPath.length >= 2) {
          const histPts = trace.HistoricalPath.map((pt) => {
            const p = latLngToSceneMeters({ lat: pt.lat, lng: pt.lng }, NYC_CENTER, SCENE_SCALE);
            return new THREE.Vector3(p.x, 1.45, p.z);
          });
          const histCurve = new THREE.CatmullRomCurve3(histPts, false, 'catmullrom', 0.1);
          const histTube = new THREE.TubeGeometry(histCurve, histPts.length * 6, 1.25, 8, false);
          const histMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
          traceGroup.add(new THREE.Mesh(histTube, histMat));
        }

        if (trace.ProjectedPath.length >= 2) {
          const projPts = trace.ProjectedPath.map((pt) => {
            const p = latLngToSceneMeters({ lat: pt.lat, lng: pt.lng }, NYC_CENTER, SCENE_SCALE);
            return new THREE.Vector3(p.x, 1.45, p.z);
          });
          const projCurve = new THREE.CatmullRomCurve3(projPts, false, 'catmullrom', 0.1);
          const projTube = new THREE.TubeGeometry(projCurve, projPts.length * 6, 1.05, 8, false);
          const projMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.88,
          });
          traceGroup.add(new THREE.Mesh(projTube, projMat));
        }
      }
    };

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let animFrameId = 0;
    let frameCounter = 0;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      frameCounter++;

      const currentProps = propsRef.current;
      const cam = cameraStateRef.current;

      cam.targetX += (cam.desiredTargetX - cam.targetX) * 0.09;
      cam.targetZ += (cam.desiredTargetZ - cam.targetZ) * 0.09;
      cam.pitch += (cam.desiredPitch - cam.pitch) * 0.09;
      cam.distance += (cam.desiredDistance - cam.distance) * 0.09;

      // Smooth yaw interpolation
      let yawDiff = cam.desiredYaw - cam.yaw;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      cam.yaw += yawDiff * 0.09;

      const camX = cam.targetX + cam.distance * Math.cos(cam.pitch) * Math.sin(cam.yaw);
      const camY = Math.max(12, cam.distance * Math.sin(cam.pitch));
      const camZ = cam.targetZ + cam.distance * Math.cos(cam.pitch) * Math.cos(cam.yaw);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(cam.targetX, 0, cam.targetZ);
      camera.updateMatrixWorld();

      // Visibility toggles
      landmassGroup.visible = currentProps.showLandmasses;
      bridgesGroup.visible = currentProps.showBridgesAndHighways;
      arterialsGroup.visible = currentProps.showBridgesAndHighways;

      buildingsGroup.visible = currentProps.showBuildings;
      if (currentProps.showBuildings) {
        for (const mat of buildingMaterials) {
          mat.uniforms.uOpacity.value = currentProps.buildingOpacity;
        }
        for (const lMat of buildingEdgeMaterials) {
          lMat.opacity = Math.min(0.75, currentProps.buildingOpacity * 0.9);
        }
      }

      updateRoutesAndStopsGeometry();

      const activeRefs = new Set<string>();
      for (const act of currentProps.activities) {
        const mvj = act.MonitoredVehicleJourney;
        const vRef = mvj.VehicleRef;
        activeRefs.add(vRef);

        const pos = latLngToSceneMeters(
          { lat: mvj.VehicleLocation.Latitude, lng: mvj.VehicleLocation.Longitude },
          NYC_CENTER,
          SCENE_SCALE
        );
        const isSelected = currentProps.selectedVehicleRef === vRef;
        const routeHex = mvj.Extensions?.OperationalMeta?.RouteColorHex || '#0EA5E9';
        const bearingRad = ((90 - mvj.Bearing) * Math.PI) / 180;

        const occ = parseVehicleOccupancy(mvj);

        let entry = busMeshesMap.get(vRef);
        if (!entry) {
          const group = new THREE.Group();

          const bodyGeom = new THREE.BoxGeometry(5.6, 2.5, 2.4);
          bodyGeom.translate(0, 1.4, 0);
          const bodyMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(routeHex),
            roughness: 0.25,
            metalness: 0.3,
            emissive: new THREE.Color(routeHex),
            emissiveIntensity: 0.35,
          });
          const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
          group.add(bodyMesh);

          const roofGeom = new THREE.BoxGeometry(3.8, 0.4, 1.8);
          roofGeom.translate(0, 2.8, 0);
          const roofMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          group.add(new THREE.Mesh(roofGeom, roofMat));

          // 3D Color-Coded Real-time Occupancy / Passenger Load Roof Beacon
          const occBeaconGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 12);
          occBeaconGeom.translate(0, 3.25, 0);
          const occBeaconMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(occ.colorHex),
            emissive: new THREE.Color(occ.colorHex),
            emissiveIntensity: 0.95,
            roughness: 0.2,
            metalness: 0.1,
          });
          const occBeaconMesh = new THREE.Mesh(occBeaconGeom, occBeaconMat);
          group.add(occBeaconMesh);

          const ringGeom = new THREE.RingGeometry(3.5, 4.8, 24);
          ringGeom.rotateX(-Math.PI / 2);
          const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(routeHex),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75,
          });
          const ringMesh = new THREE.Mesh(ringGeom, ringMat);
          ringMesh.position.y = 0.25;
          group.add(ringMesh);

          group.position.set(pos.x, 0, pos.z);
          busesGroup.add(group);

          entry = {
            group,
            bodyMat,
            ringMat,
            occBeaconMat,
            currentX: pos.x,
            currentZ: pos.z,
            targetX: pos.x,
            targetZ: pos.z,
            bearingRad,
          };
          busMeshesMap.set(vRef, entry);
        }

        entry.targetX = pos.x;
        entry.targetZ = pos.z;
        entry.currentX += (entry.targetX - entry.currentX) * 0.08;
        entry.currentZ += (entry.targetZ - entry.currentZ) * 0.08;
        entry.group.position.set(entry.currentX, 0, entry.currentZ);
        entry.group.rotation.y = bearingRad;

        // Dynamic 3D Occupancy color & filter handling
        entry.occBeaconMat.color.set(occ.colorHex);
        entry.occBeaconMat.emissive.set(occ.colorHex);

        const matchesFilter =
          currentProps.occupancyFilter === 'ALL' || occ.level === currentProps.occupancyFilter;

        const scale = isSelected ? 1.45 : matchesFilter ? 1.0 : 0.4;
        entry.group.scale.set(scale, scale, scale);
        entry.bodyMat.emissiveIntensity = isSelected ? 0.75 : matchesFilter ? 0.35 : 0.1;
        entry.bodyMat.transparent = !matchesFilter;
        entry.bodyMat.opacity = matchesFilter ? 1.0 : 0.25;
        entry.ringMat.color.set(isSelected ? 0x38bdf8 : matchesFilter ? routeHex : 0x475569);
      }

      for (const [vRef, entry] of busMeshesMap.entries()) {
        if (!activeRefs.has(vRef)) {
          busesGroup.remove(entry.group);
          busMeshesMap.delete(vRef);
        }
      }

      renderer?.render(scene, camera);

      // 2D HUD projection (every 3 frames)
      if (frameCounter % 3 === 0 && container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Project buses
        const nextProjectedBuses: ProjectedBusOverlay[] = [];
        for (const act of currentProps.activities) {
          const mvj = act.MonitoredVehicleJourney;
          const vRef = mvj.VehicleRef;
          const entry = busMeshesMap.get(vRef);
          const worldX = entry ? entry.currentX : 0;
          const worldZ = entry ? entry.currentZ : 0;

          const vec = new THREE.Vector3(worldX, 3.8, worldZ);
          vec.project(camera);

          const isBehind = vec.z > 1.0;
          const sx = (vec.x * 0.5 + 0.5) * width;
          const sy = (-(vec.y * 0.5) + 0.5) * height;
          const inBounds = !isBehind && sx >= -40 && sx <= width + 40 && sy >= -40 && sy <= height + 40;

          const occ = parseVehicleOccupancy(mvj);
          const matchesFilter =
            currentProps.occupancyFilter === 'ALL' || occ.level === currentProps.occupancyFilter;

          nextProjectedBuses.push({
            vehicleRef: vRef,
            shortNumber: vRef.replace('MTA NYCT_', ''),
            lineName: mvj.PublishedLineName,
            screenX: sx,
            screenY: sy,
            colorHex: mvj.Extensions?.OperationalMeta?.RouteColorHex || '#0EA5E9',
            bearing: mvj.Bearing,
            adherenceStatus: mvj.Extensions?.OperationalMeta?.ScheduleAdherenceStatus || 'ON_TIME',
            speedMph: mvj.Extensions?.OperationalMeta?.SpeedMph || 12.5,
            nextStopName: mvj.MonitoredCall?.StopPointName || 'Approaching Stop',
            presentableDistance:
              mvj.MonitoredCall?.Extensions?.Distances?.PresentableDistance || 'en route',
            isSelected: currentProps.selectedVehicleRef === vRef,
            visible: inBounds && matchesFilter,
            occupancy: occ,
          });
        }
        setProjectedBuses(nextProjectedBuses);

        // Project landmarks & Depots
        const landmarks = NYC_3D_BUILDINGS.filter((b) => b.isLandmark);
        const nextLandmarks: ProjectedLandmarkOverlay[] = [];
        for (const lm of landmarks) {
          const pos = latLngToSceneMeters({ lat: lm.lat, lng: lm.lng }, NYC_CENTER, SCENE_SCALE);
          const vec = new THREE.Vector3(pos.x, lm.heightMeters * SCENE_SCALE + 2.5, pos.z);
          vec.project(camera);
          const sx = (vec.x * 0.5 + 0.5) * width;
          const sy = (-(vec.y * 0.5) + 0.5) * height;
          const inBounds = vec.z <= 1.0 && sx >= 20 && sx <= width - 20 && sy >= 20 && sy <= height - 20;
          const isDepot = lm.id.startsWith('bldg-depot-');
          const depotId = isDepot ? lm.id.replace('bldg-depot-', '').toUpperCase() : undefined;
          const depotObj = depotId ? MTA_DEPOTS.find((d) => d.id === depotId) : undefined;

          nextLandmarks.push({
            id: lm.id,
            name: lm.name || lm.id,
            screenX: sx,
            screenY: sy,
            heightMeters: lm.heightMeters,
            visible: inBounds,
            depotId,
            borough: depotObj?.borough,
            assignedRouteIds: depotObj?.assignedRouteIds,
            electricBays: depotObj?.electricChargingBays,
          });
        }
        setProjectedLandmarks(nextLandmarks);

        // Project Neighborhoods & Borough Centers
        const nextHoods: ProjectedNeighborhoodOverlay[] = [];
        for (const hood of NYC_NEIGHBORHOOD_MARKERS) {
          const pos = latLngToSceneMeters(hood.location, NYC_CENTER, SCENE_SCALE);
          const vec = new THREE.Vector3(pos.x, 2.5, pos.z);
          vec.project(camera);
          const sx = (vec.x * 0.5 + 0.5) * width;
          const sy = (-(vec.y * 0.5) + 0.5) * height;
          const inBounds = vec.z <= 1.0 && sx >= 30 && sx <= width - 30 && sy >= 30 && sy <= height - 30;

          nextHoods.push({
            id: hood.id,
            name: hood.name,
            borough: hood.borough,
            subtitle: hood.subtitle,
            screenX: sx,
            screenY: sy,
            visible: inBounds,
            priority: hood.priority,
            location: hood.location,
          });
        }
        setProjectedNeighborhoods(nextHoods);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      renderer?.dispose();
    };
  }, []);

  // 2D Software Fallback Engine (with Queens & Brooklyn landmass contours)
  useEffect(() => {
    if (!useSoftware3DEngine) return;
    const container = containerRef.current;
    const canvas = fallback2DCanvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const projectPoint3D = (
      wx: number,
      wy: number,
      wz: number,
      width: number,
      height: number
    ): { sx: number; sy: number; depth: number; visible: boolean } => {
      const cam = cameraStateRef.current;
      const camX = cam.targetX + cam.distance * Math.cos(cam.pitch) * Math.sin(cam.yaw);
      const camY = Math.max(15, cam.distance * Math.sin(cam.pitch));
      const camZ = cam.targetZ + cam.distance * Math.cos(cam.pitch) * Math.cos(cam.yaw);

      const fx = cam.targetX - camX;
      const fy = -camY;
      const fz = cam.targetZ - camZ;
      const flen = Math.hypot(fx, fy, fz) || 1;
      const fwdX = fx / flen;
      const fwdY = fy / flen;
      const fwdZ = fz / flen;

      let rx = -fwdZ;
      let ry = 0;
      let rz = fwdX;
      const rlen = Math.hypot(rx, rz) || 1;
      rx /= rlen;
      rz /= rlen;

      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;

      const px = wx - camX;
      const py = wy - camY;
      const pz = wz - camZ;

      const depth = px * fwdX + py * fwdY + pz * fwdZ;
      if (depth <= 5) return { sx: 0, sy: 0, depth, visible: false };

      const xCam = px * rx + py * ry + pz * rz;
      const yCam = px * ux + py * uy + pz * uz;

      const fovRad = (45 * Math.PI) / 180;
      const halfH = Math.tan(fovRad / 2);
      const aspect = width / Math.max(1, height);
      const halfW = halfH * aspect;

      const ndcX = xCam / (depth * halfW);
      const ndcY = yCam / (depth * halfH);

      const sx = (ndcX * 0.5 + 0.5) * width;
      const sy = (-ndcY * 0.5 + 0.5) * height;

      return {
        sx,
        sy,
        depth,
        visible: sx >= -50 && sx <= width + 50 && sy >= -50 && sy <= height + 50,
      };
    };

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const currentProps = propsRef.current;
      const width = (canvas.width = container.clientWidth);
      const height = (canvas.height = container.clientHeight);

      ctx.fillStyle = '#070B12';
      ctx.fillRect(0, 0, width, height);

      // Draw Landmasses (Queens, Brooklyn, Manhattan) in 2D
      for (const lm of NYC_BOROUGH_LANDMASSES) {
        ctx.strokeStyle = lm.edgeColorHex;
        ctx.fillStyle = lm.colorHex;
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        for (const pt of lm.polygon) {
          const m = latLngToSceneMeters(pt, NYC_CENTER, SCENE_SCALE);
          const proj = projectPoint3D(m.x, 0, m.z, width, height);
          if (proj.visible) {
            if (!started) {
              ctx.moveTo(proj.sx, proj.sy);
              started = true;
            } else {
              ctx.lineTo(proj.sx, proj.sy);
            }
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Draw Bridges in 2D
      for (const br of NYC_BRIDGES_3D) {
        ctx.strokeStyle = br.colorHex;
        ctx.lineWidth = 3;
        ctx.beginPath();
        let started = false;
        for (const pt of br.path) {
          const m = latLngToSceneMeters(pt, NYC_CENTER, SCENE_SCALE);
          const proj = projectPoint3D(m.x, br.deckElevation, m.z, width, height);
          if (proj.visible) {
            if (!started) {
              ctx.moveTo(proj.sx, proj.sy);
              started = true;
            } else {
              ctx.lineTo(proj.sx, proj.sy);
            }
          }
        }
        ctx.stroke();
      }

      // Draw routes
      if (currentProps.showRouteShapes) {
        for (const def of ROUTE_CATALOG) {
          if (
            currentProps.selectedDepot &&
            def.route.depotId !== currentProps.selectedDepot.id &&
            currentProps.selectedRouteId === 'ALL'
          ) {
            continue;
          }
          const isSelected =
            currentProps.selectedRouteId === def.route.id ||
            currentProps.selectedRouteId === def.route.shortName;
          const isHovered =
            currentProps.hoveredRouteId === def.route.id ||
            currentProps.hoveredRouteId === def.route.shortName;
          if (currentProps.selectedRouteId !== 'ALL' && !isSelected) continue;

          ctx.strokeStyle = `#${def.route.color}`;
          ctx.lineWidth = isHovered ? 6 : isSelected ? 4 : 2;
          ctx.beginPath();
          let started = false;
          for (const pt of def.shapePoints) {
            const m = latLngToSceneMeters(pt, NYC_CENTER, SCENE_SCALE);
            const proj = projectPoint3D(m.x, 0.5, m.z, width, height);
            if (proj.visible) {
              if (!started) {
                ctx.moveTo(proj.sx, proj.sy);
                started = true;
              } else {
                ctx.lineTo(proj.sx, proj.sy);
              }
            }
          }
          ctx.stroke();
        }
      }
    };

    renderLoop();
    return () => cancelAnimationFrame(animId);
  }, [useSoftware3DEngine]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full overflow-hidden bg-[#070B12] select-none cursor-grab active:cursor-grabbing"
    >
      <canvas
        ref={webglCanvasRef}
        className={`w-full h-full block ${useSoftware3DEngine ? 'hidden' : 'block'}`}
      />

      {useSoftware3DEngine && (
        <canvas ref={fallback2DCanvasRef} className="w-full h-full block" />
      )}

      {/* TOP HUD: Borough Focus Navigation Bar & 3D Layer Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-25 flex flex-wrap items-center justify-center gap-1.5 p-1 bg-slate-950/85 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-sky-400 border-r border-slate-800">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Borough Focus</span>
        </div>

        {/* Borough Quick-Jump Presets */}
        {BOROUGH_CAMERA_PRESETS.map((preset) => {
          const isActive = activeBoroughPreset === preset.id;
          const isGrandAve = preset.id === 'preset-grand-ave';
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => flyToBoroughPreset(preset)}
              title={preset.description}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                isActive
                  ? isGrandAve
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/25 ring-1 ring-white'
                    : 'bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-400/25 ring-1 ring-white'
                  : isGrandAve
                  ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/40'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              {isGrandAve && <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />}
              <span>{preset.label}</span>
            </button>
          );
        })}

        {/* Layer Toggles Divider */}
        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <button
          type="button"
          onClick={() => setShowLandmasses(!showLandmasses)}
          title="Toggle Brooklyn & Queens Landmass Terrains"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            showLandmasses
              ? 'bg-sky-950 text-sky-300 border border-sky-600/60'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Borough Plates</span>
        </button>

        <button
          type="button"
          onClick={() => setShowBridgesAndHighways(!showBridgesAndHighways)}
          title="Toggle 3D Bridges & Arterials (Pulaski, Kosciuszko, Williamsburg, BQE, LIE)"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            showBridgesAndHighways
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3 h-3" />
          <span>3D Bridges</span>
        </button>

        <button
          type="button"
          onClick={() => setShowNeighborhoodBadges(!showNeighborhoodBadges)}
          title="Toggle Queens & Brooklyn Neighborhood Markers"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            showNeighborhoodBadges
              ? 'bg-purple-950 text-purple-300 border border-purple-600/60'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3 h-3" />
          <span>Districts</span>
        </button>

        {/* Real-Time Vehicle Load / Occupancy Status Indicator Filters */}
        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-semibold px-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-sky-400" />
            <span>Load:</span>
          </span>

          <button
            type="button"
            onClick={() => setOccupancyFilter('ALL')}
            title="Display all buses regardless of vehicle load"
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
              occupancyFilter === 'ALL'
                ? 'bg-sky-400 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            ALL ({fleetOccupancySummary.totalBuses})
          </button>

          <button
            type="button"
            onClick={() => setOccupancyFilter(occupancyFilter === 'LOW' ? 'ALL' : 'LOW')}
            title="Seats Available (< 35% load) - Click to isolate"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
              occupancyFilter === 'LOW'
                ? 'bg-emerald-400 text-slate-950 ring-1 ring-white'
                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/30 hover:border-emerald-500'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>LOW ({fleetOccupancySummary.lowCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setOccupancyFilter(occupancyFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
            title="Few Seats Available (35 - 70% load) - Click to isolate"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
              occupancyFilter === 'MODERATE'
                ? 'bg-amber-400 text-slate-950 ring-1 ring-white'
                : 'bg-amber-950/60 text-amber-400 border border-amber-600/30 hover:border-amber-500'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>MOD ({fleetOccupancySummary.moderateCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setOccupancyFilter(occupancyFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            title="Standing Room Only (70 - 90% load) - Click to isolate"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
              occupancyFilter === 'HIGH'
                ? 'bg-orange-400 text-slate-950 ring-1 ring-white'
                : 'bg-orange-950/60 text-orange-400 border border-orange-600/30 hover:border-orange-500'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>HIGH ({fleetOccupancySummary.highCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setOccupancyFilter(occupancyFilter === 'FULL' ? 'ALL' : 'FULL')}
            title="Bus Full / At Capacity (> 90% load) - Click to isolate"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
              occupancyFilter === 'FULL'
                ? 'bg-rose-400 text-slate-950 ring-1 ring-white'
                : 'bg-rose-950/60 text-rose-400 border border-rose-600/30 hover:border-rose-500'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>FULL ({fleetOccupancySummary.fullCount})</span>
          </button>
        </div>
      </div>

      {/* 3D Neighborhood & District Floating Badges (Queens & Brooklyn) */}
      {showNeighborhoodBadges && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-12">
          {projectedNeighborhoods.map((hood) => {
            if (!hood.visible) return null;
            const isQueens = hood.borough === 'Queens';
            const isBrooklyn = hood.borough === 'Brooklyn';
            const isMaspeth = hood.id === 'hood-maspeth';

            return (
              <div
                key={hood.id}
                style={{
                  transform: `translate3d(${Math.round(hood.screenX)}px, ${Math.round(hood.screenY)}px, 0)`,
                  zIndex: isMaspeth ? 24 : hood.priority === 1 ? 18 : 12,
                }}
                className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
              >
                <div
                  className={`flex flex-col items-center group pointer-events-auto cursor-pointer transition-transform hover:scale-110 ${
                    isMaspeth
                      ? 'scale-105'
                      : hood.priority === 1
                      ? 'scale-100'
                      : 'scale-90 opacity-80 hover:opacity-100'
                  }`}
                  onClick={() => {
                    const cam = cameraStateRef.current;
                    const pos = latLngToSceneMeters(hood.location, NYC_CENTER, SCENE_SCALE);
                    cam.desiredTargetX = pos.x;
                    cam.desiredTargetZ = pos.z;
                    cam.desiredDistance = isMaspeth ? 280 : 360;
                  }}
                  title={`Focus on ${hood.name} (${hood.borough})`}
                >
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-lg backdrop-blur-xs ${
                      isMaspeth
                        ? 'bg-amber-500/90 text-slate-950 border-amber-300 ring-2 ring-amber-400/50'
                        : isQueens
                        ? 'bg-sky-950/80 text-sky-300 border-sky-500/60 hover:border-sky-300'
                        : isBrooklyn
                        ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/60 hover:border-indigo-300'
                        : 'bg-slate-950/80 text-slate-300 border-slate-600'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{hood.name}</span>
                    <span className="text-[8px] font-mono opacity-70">({hood.borough.slice(0, 2)})</span>
                  </div>

                  <span className="text-[9px] text-slate-400/90 font-mono mt-0.5 px-1 rounded bg-black/40 backdrop-blur-xs">
                    {hood.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3D Landmarks and Depot Facilities */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
        {showBuildings &&
          projectedLandmarks.map((lm) => {
            if (!lm.visible) return null;
            const isDepot = lm.id.startsWith('bldg-depot-');
            const depotId = isDepot ? lm.id.replace('bldg-depot-', '').toUpperCase() : null;
            const fullDepotId = isDepot ? lm.id.replace('bldg-', '') : null;
            const isSelectedDepot =
              selectedDepot && depotId && selectedDepot.id.toUpperCase() === depotId;
            const isGrandAve = depotId === 'GA';
            const activeAd = sponsoredCampaigns.find(
              (c) =>
                c.status === 'active' &&
                (c.targetDepotId === fullDepotId || (depotId && c.targetDepotId.toUpperCase().includes(depotId)))
            );

            return (
              <div
                key={lm.id}
                style={{
                  transform: `translate3d(${Math.round(lm.screenX)}px, ${Math.round(lm.screenY)}px, 0)`,
                  zIndex: isSelectedDepot ? 35 : isGrandAve ? 30 : activeAd ? 28 : isDepot ? 25 : 10,
                }}
                className={`absolute top-0 left-0 -translate-x-1/2 -translate-y-full pb-1 ${
                  isDepot ? 'pointer-events-auto' : ''
                }`}
              >
                {isDepot ? (
                  <div className="flex flex-col items-center">
                    {/* Sponsored Halo Tag if Campaign is Active */}
                    {activeAd && (
                      <div className="mb-1 px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[9px] shadow-lg flex items-center gap-1 border border-amber-200 animate-pulse">
                        <span>★</span>
                        <span className="truncate max-w-[110px]">{activeAd.sponsorName}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => depotId && onSelectDepot?.(isSelectedDepot ? 'ALL' : depotId)}
                      title={`Focus on ${lm.name}${activeAd ? ` · Sponsored by ${activeAd.sponsorName}` : ''}`}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all border shadow-lg cursor-pointer ${
                        isSelectedDepot || isGrandAve
                          ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-400/60 scale-105 font-bold'
                          : activeAd
                          ? 'bg-slate-950/95 text-amber-300 border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/20 scale-105 backdrop-blur-xs'
                          : 'bg-slate-950/95 text-amber-300 border-amber-500/60 hover:border-amber-400 hover:scale-105 backdrop-blur-xs'
                      }`}
                    >
                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-200">
                        {depotId || 'DEPOT'}
                      </span>
                      <span>{lm.name}</span>
                      {lm.electricBays ? (
                        <span className="font-mono text-[9px] text-amber-400">⚡{lm.electricBays}</span>
                      ) : null}
                    </button>

                    {/* Direct clickable route chips on the 3D Map Pin */}
                    {lm.assignedRouteIds && lm.assignedRouteIds.length > 0 && (
                      <div className="flex flex-wrap max-w-56 items-center justify-center gap-1 mt-1 bg-slate-950/95 p-1 rounded-md border border-slate-700/80 shadow-md">
                        {lm.assignedRouteIds.map((rId) => {
                          const cleanName = rId.replace('MTA NYCT_', '');
                          const isRouteSelected = selectedRouteId === rId;
                          return (
                            <button
                              key={rId}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (depotId) onSelectDepot?.(depotId);
                                onSelectRoute?.(isRouteSelected ? 'ALL' : rId);
                              }}
                              title={`View Route ${cleanName} from ${lm.name}`}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-transform cursor-pointer ${
                                isRouteSelected
                                  ? 'bg-sky-400 text-slate-950 scale-105 shadow-xs'
                                  : 'bg-slate-850 text-slate-200 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              {cleanName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-2 py-0.5 bg-slate-950/85 border border-slate-700/70 rounded-md text-[10px] font-medium text-slate-200 whitespace-nowrap backdrop-blur-xs shadow-md">
                    <span>{lm.name}</span>
                    <span className="text-slate-500 mx-1">·</span>
                    <span className="font-mono text-sky-400 tabular-nums">{lm.heightMeters}m</span>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Interactive 3D Bus Markers with Real-time Occupancy Indicators */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {projectedBuses.map((bus) => {
          if (!bus.visible) return null;
          const isHovered = hoveredVehicleRef === bus.vehicleRef;
          const isHighlighted = bus.isSelected || isHovered;

          return (
            <div
              key={bus.vehicleRef}
              style={{
                transform: `translate3d(${Math.round(bus.screenX)}px, ${Math.round(bus.screenY)}px, 0)`,
                zIndex: bus.isSelected ? 40 : isHovered ? 30 : 20,
              }}
              className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVehicle(bus.isSelected ? null : bus.vehicleRef);
                }}
                onMouseEnter={() => setHoveredVehicleRef(bus.vehicleRef)}
                onMouseLeave={() => setHoveredVehicleRef(null)}
                title={`Inspect Bus #${bus.shortNumber} (${bus.lineName}) · Load: ${bus.occupancy.label}`}
                className={`group flex items-center gap-1.5 px-2 py-1 rounded-md border transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  bus.isSelected
                    ? 'bg-sky-500 text-slate-950 border-white shadow-lg shadow-sky-500/30 scale-110 font-semibold'
                    : 'bg-slate-950/90 text-slate-100 border-slate-700/90 hover:border-sky-400 hover:scale-105 shadow-md'
                }`}
              >
                <span
                  className={`font-mono text-[11px] font-semibold tracking-tight whitespace-nowrap ${
                    bus.isSelected ? 'text-slate-950' : 'text-sky-400'
                  }`}
                >
                  {bus.lineName}
                </span>
                <span
                  aria-hidden="true"
                  className={bus.isSelected ? 'text-slate-800' : 'text-slate-600'}
                >
                  ·
                </span>
                <span
                  className={`font-mono text-[11px] tabular-nums whitespace-nowrap ${
                    bus.isSelected ? 'text-slate-900' : 'text-slate-300'
                  }`}
                >
                  #{bus.shortNumber}
                </span>

                {/* Color-Coded Real-time Occupancy Indicator Badge */}
                <div
                  className={`flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border transition-colors ${
                    bus.isSelected
                      ? 'bg-slate-950 text-white border-white/40'
                      : `${bus.occupancy.tailwindBg} ${bus.occupancy.tailwindText} ${bus.occupancy.tailwindBorder}`
                  }`}
                  title={`Occupancy: ${bus.occupancy.label}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: bus.occupancy.colorHex }}
                  />
                  <span>
                    {bus.occupancy.occupancyPercent !== undefined
                      ? `${bus.occupancy.occupancyPercent}%`
                      : bus.occupancy.shortCode}
                  </span>
                </div>
              </button>

              {isHighlighted && (
                <div className="mt-1.5 w-64 p-2.5 rounded-md bg-slate-950/95 border border-slate-700 text-left shadow-xl backdrop-blur-md pointer-events-none">
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>
                      {bus.lineName} · Coach #{bus.shortNumber}
                    </span>
                    <span className="font-mono text-[11px] text-sky-400 tabular-nums">
                      {bus.speedMph.toFixed(1)} mph
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-300 truncate">
                    Next: <span className="text-slate-100 font-medium">{bus.nextStopName}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                    <span>{bus.presentableDistance}</span>
                    <span>HDG {Math.round(bus.bearing)}°</span>
                  </div>

                  {/* Real-Time Vehicle Load / Occupancy Status Meter */}
                  <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: bus.occupancy.colorHex }}
                        />
                        <span className="text-slate-200 font-semibold">Real-Time Load</span>
                      </div>
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{ color: bus.occupancy.colorHex }}
                      >
                        {bus.occupancy.occupancyPercent !== undefined
                          ? `${bus.occupancy.occupancyPercent}% · ${bus.occupancy.shortCode}`
                          : bus.occupancy.shortCode}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${bus.occupancy.occupancyPercent ?? 50}%`,
                          backgroundColor: bus.occupancy.colorHex,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate pr-1">{bus.occupancy.label}</span>
                      {bus.occupancy.passengerCount !== undefined && bus.occupancy.passengerCapacity !== undefined && (
                        <span className="font-mono text-slate-300 shrink-0">
                          {bus.occupancy.passengerCount}/{bus.occupancy.passengerCapacity} pax
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
