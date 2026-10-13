import React, { useState } from 'react';
import { X, Copy, Check, Code2, FileJson, FolderTree, ShieldCheck } from 'lucide-react';
import {
  BLUEPRINT_PROJECT_STRUCTURE,
  BLUEPRINT_SIRI_API_CODE,
  BLUEPRINT_WEBGL_OVERLAY_CODE,
} from '../../lib/webglBuildingOverlay';
import {
  SiriMonitoredJourneyTraceResponse,
  SiriVehicleMonitoringResponse,
} from '../../types/transit';

interface SiriBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  siriPayload: SiriVehicleMonitoringResponse | null;
  journeyTrace: SiriMonitoredJourneyTraceResponse | null;
  envConfig: {
    mtaApiKeyConfigured: boolean;
    googleMapsKeyConfigured: boolean;
    siriVersion: string;
    obaVersion: number;
  } | null;
}

type BlueprintTab = 'WEBGL_SHADER' | 'SIRI_UTILITIES' | 'LIVE_JSON' | 'ARCHITECTURE';

export const SiriBlueprintModal: React.FC<SiriBlueprintModalProps> = ({
  isOpen,
  onClose,
  siriPayload,
  journeyTrace,
  envConfig,
}) => {
  const [activeTab, setActiveTab] = useState<BlueprintTab>('WEBGL_SHADER');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const liveJsonString = JSON.stringify(
    journeyTrace
      ? {
          endpoint: '/api/siri/monitored-vehicle-journey',
          data: journeyTrace,
        }
      : {
          endpoint: '/api/siri/vehicle-monitoring',
          vehicleCount:
            siriPayload?.Siri.ServiceDelivery.VehicleMonitoringDelivery[0]?.VehicleActivity
              .length ?? 0,
          sampleDelivery: {
            ResponseTimestamp: siriPayload?.Siri.ServiceDelivery.ResponseTimestamp,
            VehicleActivitySample:
              siriPayload?.Siri.ServiceDelivery.VehicleMonitoringDelivery[0]?.VehicleActivity.slice(
                0,
                3
              ) ?? [],
          },
        },
    null,
    2
  );

  const getCurrentCodeContent = () => {
    switch (activeTab) {
      case 'WEBGL_SHADER':
        return BLUEPRINT_WEBGL_OVERLAY_CODE;
      case 'SIRI_UTILITIES':
        return BLUEPRINT_SIRI_API_CODE;
      case 'ARCHITECTURE':
        return BLUEPRINT_PROJECT_STRUCTURE;
      case 'LIVE_JSON':
        return liveJsonString;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[86vh] bg-[#0D131F] border border-slate-700/90 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-display">
              MetroGlass NYC · WebGL 3D Shader & MTA SIRI Blueprint
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production architecture for Queens & Brooklyn depot fleet monitoring, 45% transparent
              glass buildings, and MTA SIRI telemetry.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Environment Security (<code className="font-mono text-sky-300">.env</code>):</span>
            <span className="font-mono">
              process.env.MTA_API_KEY:{' '}
              <strong
                className={
                  envConfig?.mtaApiKeyConfigured ? 'text-emerald-400' : 'text-amber-400'
                }
              >
                {envConfig?.mtaApiKeyConfigured
                  ? 'Configured (Live Upstream)'
                  : '3D NYC SIRI Cache Active'}
              </strong>
            </span>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('WEBGL_SHADER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'WEBGL_SHADER'
                  ? 'bg-sky-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>WebGL 45% Glass Shader</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SIRI_UTILITIES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'SIRI_UTILITIES'
                  ? 'bg-sky-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>SIRI API Utilities</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LIVE_JSON')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'LIVE_JSON'
                  ? 'bg-sky-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Live SIRI v2.0 JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ARCHITECTURE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'ARCHITECTURE'
                  ? 'bg-sky-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Directory Layout</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#070B12]">
          <pre className="text-xs font-mono text-slate-200 leading-relaxed overflow-x-auto">
            <code>{getCurrentCodeContent()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
