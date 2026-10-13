import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Compass,
  Bus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  deleteRouteSubscription,
  saveRouteSubscription,
  subscribeUserSubscriptions,
} from '../../services/firebaseClient';
import { RouteSubscription } from '../../types/admin';
import { ObaRoute } from '../../types/transit';

interface CommuterAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableRoutes: ObaRoute[];
}

export const CommuterAlertsModal: React.FC<CommuterAlertsModalProps> = ({
  isOpen,
  onClose,
  availableRoutes,
}) => {
  const { currentUser, userProfile, signIn } = useAuth();
  const [subscriptions, setSubscriptions] = useState<RouteSubscription[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    availableRoutes[0]?.id || 'MTA NYCT_B38'
  );
  const [thresholdMinutes, setThresholdMinutes] = useState<number>(5);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setSubscriptions([]);
      return;
    }
    const unsub = subscribeUserSubscriptions(currentUser.uid, (subs) => {
      setSubscriptions(subs);
    });
    return () => unsub();
  }, [currentUser]);

  if (!isOpen) return null;

  const requestNotificationAccess = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        new Notification('MetroGlass NYC Transit Alerts', {
          body: 'Browser alerts enabled! You will be notified when your bus is approaching.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const sub: RouteSubscription = {
        id: `sub_${currentUser.uid}_${selectedRouteId.replace(/\s+/g, '_')}_${Date.now()}`,
        userId: currentUser.uid,
        routeId: selectedRouteId,
        alertMinutesThreshold: Number(thresholdMinutes),
        channels: ['in_app', 'browser'],
        createdAt: new Date().toISOString(),
      };
      await saveRouteSubscription(sub);
      setStatusMessage(`Alert active for ${selectedRouteId}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to save subscription.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubscription = async (subId: string) => {
    try {
      await deleteRouteSubscription(subId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F17]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Commuter Route Alerts</h2>
              <p className="text-xs text-slate-400">
                Receive live notifications when your bus is approaching your stop
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Notification permission prompt */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  browserPermission === 'granted' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <div className="text-xs">
                <p className="font-medium text-slate-200">
                  Browser Push Notifications:{' '}
                  <span className="capitalize text-slate-400 font-mono">{browserPermission}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Allows alerts when app is in background or minimized
                </p>
              </div>
            </div>
            {browserPermission !== 'granted' && (
              <button
                type="button"
                onClick={requestNotificationAccess}
                className="px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-950/60 hover:bg-sky-900 border border-sky-800 rounded-md transition-colors whitespace-nowrap"
              >
                Enable Alerts
              </button>
            )}
          </div>

          {!currentUser ? (
            <div className="p-6 rounded-lg border border-dashed border-slate-800 text-center space-y-3 bg-slate-900/30">
              <Bus className="w-8 h-8 text-sky-400 mx-auto opacity-70" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Sign in to save your alerts</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect with your Google account to sync your monitored routes and notifications
                  across all your devices.
                </p>
              </div>
              <button
                type="button"
                onClick={signIn}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors shadow-sm"
              >
                Sign in with Google
              </button>
            </div>
          ) : (
            <>
              {/* Add New Subscription Form */}
              <form onSubmit={handleAddSubscription} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Target Transit Route
                    </label>
                    <select
                      value={selectedRouteId}
                      onChange={(e) => setSelectedRouteId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      {availableRoutes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.shortName} · {r.longName || r.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Notify When Bus Is Within
                    </label>
                    <select
                      value={thresholdMinutes}
                      onChange={(e) => setThresholdMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                    >
                      <option value={3}>3 Minutes of Stop</option>
                      <option value={5}>5 Minutes of Stop</option>
                      <option value={8}>8 Minutes of Stop</option>
                      <option value={10}>10 Minutes of Stop</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  {statusMessage && (
                    <span className="text-xs text-emerald-400 font-medium">{statusMessage}</span>
                  )}
                  <div className="ml-auto">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Add Route Alert'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Existing Subscriptions List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>Your Monitored Corridors ({subscriptions.length})</span>
                  <span>Arrival Window</span>
                </div>

                {subscriptions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 border border-slate-800/80 rounded-lg">
                    No active route alerts yet. Select a route above to stay notified.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subscriptions.map((sub) => {
                      const route = availableRoutes.find((r) => r.id === sub.routeId);
                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-950 text-sky-400 border border-sky-800/60">
                              {route?.shortName || sub.routeId.replace('MTA NYCT_', '')}
                            </span>
                            <div className="text-xs">
                              <p className="font-medium text-slate-200">
                                {route?.longName || 'City Transit Corridor'}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                In-app notification & browser badge active
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-slate-300 font-mono">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>&lt; {sub.alertMinutesThreshold}m</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubscription(sub.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                              title="Delete alert"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0B0F17] border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Signed in as: {currentUser?.email || 'Guest Commuter'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
