import * as THREE from 'three';
import { Building3DFootprint, LatLngPoint } from '../types/transit';

export const GLASS_BUILDING_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vNormalizedHeight;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormalizedHeight = clamp((position.y + 0.5), 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const GLASS_BUILDING_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uRimColor;
  uniform float uOpacity;
  uniform float uHeightMeters;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vNormalizedHeight;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.2);

    float floorCount = max(5.0, uHeightMeters / 4.5);
    float floorBand = smoothstep(0.82, 0.96, fract(vNormalizedHeight * floorCount));

    vec3 lightDir = normalize(vec3(0.45, 0.85, 0.35));
    float diff = max(dot(normal, lightDir), 0.0) * 0.35 + 0.65;

    float streetClearanceAlpha = mix(uOpacity * 0.76, uOpacity * 1.08, vNormalizedHeight);

    vec3 glassColor = mix(uBaseColor * diff, uRimColor, fresnel * 0.65 + floorBand * 0.14);
    float finalAlpha = clamp(streetClearanceAlpha + fresnel * 0.18, 0.12, 0.88);

    gl_FragColor = vec4(glassColor, finalAlpha);
  }
`;

export function createGlassBuildingShaderMaterial(
  opacity = 0.45,
  isLandmark = false,
  heightMeters = 120
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: {
        value: new THREE.Color(isLandmark ? '#38BDF8' : '#334155'),
      },
      uRimColor: {
        value: new THREE.Color(isLandmark ? '#BAE6FD' : '#7DD3FC'),
      },
      uOpacity: { value: opacity },
      uHeightMeters: { value: heightMeters },
    },
    vertexShader: GLASS_BUILDING_VERTEX_SHADER,
    fragmentShader: GLASS_BUILDING_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export function latLngToSceneMeters(
  point: LatLngPoint,
  anchor: LatLngPoint,
  scaleFactor = 1.0
): { x: number; z: number } {
  const metersPerDegLat = 111132.92;
  const metersPerDegLng = 111412.84 * Math.cos((anchor.lat * Math.PI) / 180);

  const eastMeters = (point.lng - anchor.lng) * metersPerDegLng * scaleFactor;
  const northMeters = (point.lat - anchor.lat) * metersPerDegLat * scaleFactor;

  return {
    x: eastMeters,
    z: -northMeters,
  };
}

export function createGoogleMapsTransparentBuildingOverlay(options: {
  map: google.maps.Map;
  anchor: LatLngPoint;
  buildings: Building3DFootprint[];
  initialOpacity: number;
}): {
  overlay: google.maps.WebGLOverlayView;
  setBuildingOpacity: (opacity: number) => void;
  dispose: () => void;
} {
  const overlay = new google.maps.WebGLOverlayView();
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  const shaderMaterials: THREE.ShaderMaterial[] = [];

  overlay.onAdd = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xbae6fd, 0.9);
    dirLight.position.set(300, 900, 400);
    scene.add(dirLight);

    const buildingsGroup = new THREE.Group();
    for (const b of options.buildings) {
      const pos = latLngToSceneMeters({ lat: b.lat, lng: b.lng }, options.anchor, 1.0);
      const geom = new THREE.BoxGeometry(b.widthMeters, b.heightMeters, b.depthMeters);
      geom.translate(0, b.heightMeters / 2, 0);

      const mat = createGlassBuildingShaderMaterial(
        options.initialOpacity,
        Boolean(b.isLandmark),
        b.heightMeters
      );
      shaderMaterials.push(mat);

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(pos.x, 0, pos.z);
      mesh.rotation.y = (b.rotationDeg * Math.PI) / 180;
      buildingsGroup.add(mesh);

      const edges = new THREE.EdgesGeometry(geom);
      const lineMat = new THREE.LineBasicMaterial({
        color: b.isLandmark ? 0x38bdf8 : 0x64748b,
        transparent: true,
        opacity: Math.min(0.65, options.initialOpacity + 0.12),
      });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.copy(mesh.position);
      wireframe.rotation.copy(mesh.rotation);
      buildingsGroup.add(wireframe);
    }

    buildingsGroup.rotation.x = Math.PI / 2;
    scene.add(buildingsGroup);
  };

  overlay.onContextRestored = ({ gl }: { gl: WebGLRenderingContext }) => {
    if (gl.canvas && 'style' in gl.canvas) {
      (gl.canvas as HTMLCanvasElement).style.pointerEvents = 'none';
    }
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    renderer.autoClear = false;
  };

  overlay.onDraw = ({
    transformer,
  }: {
    gl: WebGLRenderingContext;
    transformer: google.maps.CoordinateTransformer;
  }) => {
    if (!scene || !camera || !renderer) return;

    const matrix = transformer.fromLatLngAltitude({
      lat: options.anchor.lat,
      lng: options.anchor.lng,
      altitude: 0,
    });
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    overlay.requestRedraw();
    renderer.render(scene, camera);
    renderer.resetState();
  };

  overlay.onRemove = () => {
    shaderMaterials.forEach((m) => m.dispose());
    scene = null;
    camera = null;
    renderer = null;
  };

  overlay.setMap(options.map);

  return {
    overlay,
    setBuildingOpacity: (nextOpacity: number) => {
      for (const mat of shaderMaterials) {
        mat.uniforms.uOpacity.value = nextOpacity;
      }
      overlay.requestRedraw();
    },
    dispose: () => {
      overlay.setMap(null);
    },
  };
}

export const BLUEPRINT_PROJECT_STRUCTURE = `metroglass-nyc/
├── .env.example                       # Secure API key templates (MTA_API_KEY, NEXT_PUBLIC_GOOGLE_MAPS_KEY)
├── server.ts                          # Express server & proxy for SIRI v2.0 & OneBusAway REST APIs
├── src/
│   ├── types/
│   │   └── transit.ts                 # TypeScript contracts for SIRI VehicleMonitoring & OneBusAway
│   ├── services/
│   │   ├── siriApi.ts                 # SIRI VehicleMonitoring & MonitoredVehicleJourney fetch utilities
│   │   └── oneBusAwayApi.ts           # OneBusAway stops-for-route, schedule-for-route & polyline decoder
│   ├── lib/
│   │   └── webglBuildingOverlay.ts    # Google Maps WebGLOverlayView + GLSL 45% Glass Building Shader
│   ├── data/
│   │   └── nycMtaCache.ts             # All Queens & Brooklyn Depots + Corridor Geometry
│   └── components/
│       ├── map/
│       │   ├── NYC3DCityscapeCanvas.tsx      # 60fps Three.js WebGL 3D NYC Cache & Raycast Engine
│       │   └── GoogleMapsWebGLCanvas.tsx     # @vis.gl/react-google-maps + WebGLOverlayView Wrapper
│       ├── panels/
│       │   ├── DepotCommandPanel.tsx         # Queens & Brooklyn Depot Command Hub + Roster
│       │   ├── BusJourneyInspector.tsx       # Isolated bus MonitoredVehicleJourney & adherence timeline
│       │   └── SiriBlueprintModal.tsx        # Live SIRI JSON payload inspector & WebGL shader viewer
│       └── App.tsx                    # Real-time SWR 10s polling orchestrator & 3D HUD controls`;

export const BLUEPRINT_WEBGL_OVERLAY_CODE = `// Google Maps WebGLOverlayView + Three.js 45% Transparent 3D Building Shader
import * as THREE from 'three';

export function initTransparentNYCBuildingsOverlay(
  map: google.maps.Map,
  anchor = { lat: 40.7320, lng: -73.9350 },
  buildingOpacity = 0.45 // 40-50% glass-like transparency
) {
  const webglOverlay = new google.maps.WebGLOverlayView();
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;

  webglOverlay.onAdd = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();

    const glassShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBaseColor: { value: new THREE.Color('#334155') },
        uRimColor: { value: new THREE.Color('#7DD3FC') },
        uOpacity: { value: buildingOpacity },
      },
      vertexShader: \`
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      \`,
      fragmentShader: \`
        uniform vec3 uBaseColor;
        uniform vec3 uRimColor;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.2);
          vec3 color = mix(uBaseColor, uRimColor, fresnel * 0.65);
          gl_FragColor = vec4(color, clamp(uOpacity + fresnel * 0.15, 0.15, 0.85));
        }
      \`,
      transparent: true,
      depthWrite: false, // Street-level routes and buses behind buildings remain visible
      side: THREE.DoubleSide,
    });
  };

  webglOverlay.onContextRestored = ({ gl }: { gl: WebGLRenderingContext }) => {
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    renderer.autoClear = false;
  };

  webglOverlay.onDraw = ({ transformer }: { gl: WebGLRenderingContext; transformer: google.maps.CoordinateTransformer }) => {
    const matrix = transformer.fromLatLngAltitude({
      lat: anchor.lat,
      lng: anchor.lng,
      altitude: 0,
    });
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
    webglOverlay.requestRedraw();
    renderer.render(scene, camera);
    renderer.resetState();
  };

  webglOverlay.setMap(map);
  return webglOverlay;
}`;

export const BLUEPRINT_SIRI_API_CODE = `// Server-Side & Route Handler MTA SIRI v2.0 API Utilities
// Reads API key securely from process.env.MTA_API_KEY (never hardcoded)

const MTA_SIRI_VM_ENDPOINT = 'https://bustime.mta.info/api/siri/vehicle-monitoring.json';

export async function fetchMtaSiriVehicleMonitoringServer(params: {
  lineRef?: string;
  vehicleRef?: string;
}) {
  const apiKey = process.env.MTA_API_KEY || process.env.NEXT_PUBLIC_MTA_API_KEY;
  if (!apiKey) {
    throw new Error('Missing process.env.MTA_API_KEY in environment');
  }

  const searchParams = new URLSearchParams({
    key: apiKey,
    version: '2',
    VehicleMonitoringDetailLevel: 'calls',
  });
  if (params.lineRef) searchParams.set('LineRef', params.lineRef);
  if (params.vehicleRef) searchParams.set('VehicleRef', params.vehicleRef);

  const res = await fetch(\`\${MTA_SIRI_VM_ENDPOINT}?\${searchParams.toString()}\`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 10 },
  });

  if (!res.ok) {
    throw new Error(\`MTA SIRI error: \${res.status}\`);
  }
  return res.json();
}`;
