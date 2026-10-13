import React from 'react';
import {
  X,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Users,
} from 'lucide-react';
import { SiriMonitoredJourneyTraceResponse } from '../../types/transit';
import { parseVehicleOccupancy } from '../../services/siriPayloadParser';
import { CameraPresetMode } from '../map/NYC3DCityscapeCanvas';

interface BusJourneyInspectorProps {
  trace: SiriMonitoredJourneyTraceResponse | null;
  isLoading: boolean;
  cameraPreset: CameraPresetMode;
  onSetCameraPreset: (preset: CameraPresetMode) => void;
  onClose: () => void;
}

export const BusJourneyInspector: React.FC<BusJourneyInspectorProps> = ({
  trace,
  isLoading,
  cameraPreset,
  onSetCameraPreset,
  onClose,
}) => {
  if (!trace && !isLoading) return null;

  return (
    <aside className="w-full lg:w-[390px] shrink-0 h-full bg-[#0D131F]/95 border-l border-slate-800/90 flex flex-col z-30 overflow-hidden">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-400">
            SIRI MonitoredVehicleJourney · Unit Inspection
          </div>
          {trace ? (
            <h2 className="text-base font-bold text-slate-100 truncate mt-0.5">
              {trace.PublishedLineName} · Coach #{trace.VehicleRef.replace('MTA NYCT_', '')}
            </h2>
          ) : (
            <div className="h-5 w-44 bg-slate-800 rounded mt-1" />
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Close Vehicle Isolation"
          className="p-2 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading && !trace ? (
        <div className="p-5 space-y-4">
          <div className="h-20 bg-slate-900/70 rounded-lg border border-slate-800" />
          <div className="h-28 bg-slate-900/70 rounded-lg border border-slate-800" />
          <div className="h-48 bg-slate-900/70 rounded-lg border border-slate-800" />
        </div>
      ) : trace ? (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
          {/* Coordinates & Follow Camera */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-slate-400">
                <span>{trace.DepotName}</span>
                <span aria-hidden="true" className="mx-1.5 text-slate-600">
                  ·
                </span>
                <span>{trace.Borough}</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onSetCameraPreset(cameraPreset === 'FOLLOW_BUS' ? 'STREET_3D' : 'FOLLOW_BUS')
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                  cameraPreset === 'FOLLOW_BUS'
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                    : 'bg-slate-900 text-sky-400 border-slate-800 hover:border-sky-500/60'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{cameraPreset === 'FOLLOW_BUS' ? 'Tracking 3D Cam' : 'Follow Bus 3D'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-800 border border-slate-800 rounded-lg bg-slate-950/60">
              <div className="p-2.5">
                <div className="text-[11px] text-slate-400">Latitude</div>
                <div className="mt-0.5 text-xs font-mono font-semibold text-slate-100 tabular-nums">
                  {trace.MonitoredVehicleJourney.VehicleLocation.Latitude.toFixed(5)}°N
                </div>
              </div>
              <div className="p-2.5">
                <div className="text-[11px] text-slate-400">Longitude</div>
                <div className="mt-0.5 text-xs font-mono font-semibold text-slate-100 tabular-nums">
                  {trace.MonitoredVehicleJourney.VehicleLocation.Longitude.toFixed(5)}°W
                </div>
              </div>
              <div className="p-2.5">
                <div className="text-[11px] text-slate-400">Speed / Hdg</div>
                <div className="mt-0.5 text-xs font-mono font-semibold text-sky-400 tabular-nums">
                  {(
                    trace.MonitoredVehicleJourney.Extensions?.OperationalMeta?.SpeedMph ?? 14.0
                  ).toFixed(1)}{' '}
                  mph · {Math.round(trace.MonitoredVehicleJourney.Bearing)}°
                </div>
              </div>
            </div>
          </div>

          {/* Origin -> Destination */}
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200">
              Origin & Destination Trajectory
            </h3>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Origin Terminal ({trace.MonitoredVehicleJourney.OriginRef})</span>
                  <span className="font-mono tabular-nums">
                    Dep{' '}
                    {new Date(
                      trace.MonitoredVehicleJourney.OriginAimedDepartureTime
                    ).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5">
                  {trace.MonitoredVehicleJourney.OriginName}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                <span>Block: {trace.MonitoredVehicleJourney.BlockRef}</span>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Destination Terminal ({trace.MonitoredVehicleJourney.DestinationRef})</span>
                  <span className="font-mono tabular-nums">
                    ETA{' '}
                    {new Date(
                      trace.MonitoredVehicleJourney.DestinationAimedArrivalTime
                    ).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>
                <div className="text-xs font-semibold text-sky-300 mt-0.5">
                  {trace.MonitoredVehicleJourney.DestinationName}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="text-emerald-400 font-medium">
                Historical Path ({trace.HistoricalPath.length} pts)
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-medium">
                Projected Path ({trace.ProjectedPath.length} pts)
              </span>
            </div>
          </div>

          {/* Schedule Adherence */}
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200">
              Schedule Adherence & Headway
            </h3>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Adherence Status</span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-mono font-semibold tabular-nums ${
                    trace.ScheduleAdherence.status === 'DELAYED'
                      ? 'text-amber-400'
                      : trace.ScheduleAdherence.status === 'EARLY'
                      ? 'text-sky-300'
                      : 'text-emerald-400'
                  }`}
                >
                  {trace.ScheduleAdherence.status === 'DELAYED' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{trace.ScheduleAdherence.formattedDeviation}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/70">
                <span className="text-slate-400">Headway Interval</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  Actual {trace.ScheduleAdherence.actualHeadwayMinutes}m / Target{' '}
                  {trace.ScheduleAdherence.headwayTargetMinutes}m
                </span>
              </div>

              {(() => {
                const occ = parseVehicleOccupancy(trace.MonitoredVehicleJourney);
                return (
                  <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Passenger Load</span>
                      </span>
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: occ.colorHex }}
                      >
                        {occ.occupancyPercent !== undefined
                          ? `${occ.occupancyPercent}% · ${occ.shortCode}`
                          : occ.shortCode}
                      </span>
                    </div>

                    {/* Visual Occupancy Load Progress Meter */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${occ.occupancyPercent ?? 50}%`,
                          backgroundColor: occ.colorHex,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate pr-1">{occ.label}</span>
                      {occ.passengerCount !== undefined && occ.passengerCapacity !== undefined && (
                        <span className="font-mono text-slate-300 shrink-0">
                          {occ.passengerCount} / {occ.passengerCapacity} pax
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Stop Progression */}
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Stop-by-Stop Journey Progression</span>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                SIRI Calls
              </span>
            </h3>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-500/80">
                <div className="flex items-center justify-between text-[11px] font-mono text-sky-400">
                  <span>NEXT MONITORED CALL</span>
                  <span className="tabular-nums">
                    {trace.MonitoredVehicleJourney.MonitoredCall?.Extensions?.Distances
                      ?.PresentableDistance || 'Approaching'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white mt-1">
                  {trace.MonitoredVehicleJourney.MonitoredCall?.StopPointName || 'Next Scheduled Stop'}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300 font-mono tabular-nums">
                  <span>
                    Dist:{' '}
                    {trace.MonitoredVehicleJourney.MonitoredCall?.Extensions?.Distances
                      ?.DistanceFromCall ?? 0}
                    m
                  </span>
                  <span>
                    ETA{' '}
                    {trace.MonitoredVehicleJourney.MonitoredCall?.ExpectedArrivalTime
                      ? new Date(
                          trace.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime
                        ).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })
                      : 'en route'}
                  </span>
                </div>
              </div>

              {trace.MonitoredVehicleJourney.OnwardCalls?.OnwardCall?.slice(1).map((oc) => (
                <div
                  key={oc.StopPointRef}
                  className="px-3 py-2 rounded-md bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="text-slate-200 font-medium truncate">{oc.StopPointName}</div>
                    <div className="text-[11px] text-amber-400/90 font-mono tabular-nums">
                      {oc.Extensions?.Distances?.PresentableDistance || 'upcoming'}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] tabular-nums shrink-0">
                    <div className="text-slate-200">
                      {new Date(oc.ExpectedArrivalTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
};
