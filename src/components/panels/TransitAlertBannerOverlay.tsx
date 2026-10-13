import React, { useState } from 'react';
import { AlertTriangle, Info, Bell, X, ExternalLink, Megaphone } from 'lucide-react';
import { TransitAlert } from '../../types/admin';

interface TransitAlertBannerOverlayProps {
  alerts: TransitAlert[];
  selectedDepotId?: string;
  selectedRouteId?: string;
  onDismissAlert?: (id: string) => void;
}

export const TransitAlertBannerOverlay: React.FC<TransitAlertBannerOverlayProps> = ({
  alerts,
  selectedDepotId,
  selectedRouteId,
  onDismissAlert,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Filter alerts relevant to current route/depot or system-wide (ALL)
  const relevantAlerts = alerts.filter((alert) => {
    if (dismissedIds.has(alert.id)) return false;
    if (!alert.isActive) return false;
    if (!alert.targetRouteId || alert.targetRouteId === 'ALL') return true;
    if (selectedRouteId && alert.targetRouteId === selectedRouteId) return true;
    if (selectedDepotId && alert.targetDepotId === selectedDepotId) return true;
    return false;
  });

  if (relevantAlerts.length === 0) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-2xl flex flex-col gap-2 pointer-events-auto">
      {relevantAlerts.slice(0, 2).map((alert) => {
        const isUrgent = alert.severity === 'urgent';
        const isWarning = alert.severity === 'warning';

        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border shadow-lg backdrop-blur-md transition-all ${
              isUrgent
                ? 'bg-rose-950/90 border-rose-600/70 text-rose-100'
                : isWarning
                ? 'bg-amber-950/90 border-amber-600/70 text-amber-100'
                : 'bg-slate-900/90 border-sky-500/50 text-slate-100'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 p-1.5 rounded-md bg-black/20">
                {isUrgent ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : isWarning ? (
                  <Megaphone className="w-4 h-4 text-amber-400" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
                  <span className="uppercase tracking-wider font-mono text-[10px] opacity-80">
                    {alert.severity}
                  </span>
                  <span>·</span>
                  <span className="truncate">{alert.title}</span>
                </div>
                <p className="text-xs text-slate-300 truncate max-w-lg mt-0.5">{alert.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDismissedIds((prev) => new Set([...prev, alert.id]));
                  onDismissAlert?.(alert.id);
                }}
                className="p-1 text-slate-400 hover:text-slate-100 transition-colors rounded hover:bg-white/10"
                title="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
