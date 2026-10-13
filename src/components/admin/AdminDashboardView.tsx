import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Megaphone,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Radio,
  Eye,
  ArrowLeft,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createManualCommuterUser,
  deleteAdWordsCampaign,
  deleteTransitAlert,
  saveAdWordsCampaign,
  saveTransitAlert,
  setDepotRouteOverride,
  subscribeAdWordsCampaigns,
  subscribeDepotRouteOverrides,
  subscribeTransitAlerts,
  subscribeUsersList,
  toggleUserBlockStatus,
} from '../../services/firebaseClient';
import { AdWordsCampaign, TransitAlert, UserProfile } from '../../types/admin';
import { MtaDepot, ObaRoute } from '../../types/transit';

type AdminTab = 'DEPOTS' | 'USERS' | 'ADWORDS' | 'ALERTS';

interface AdminDashboardViewProps {
  depots: MtaDepot[];
  routes: ObaRoute[];
  onBackToMap: () => void;
  onRefreshData?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  depots,
  routes,
  onBackToMap,
  onRefreshData,
}) => {
  const { currentUser, userProfile, isAdmin, isBlocked, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('DEPOTS');

  // Firestore Live State
  const [depotOverrides, setDepotOverrides] = useState<Record<string, string>>({});
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [campaigns, setCampaigns] = useState<AdWordsCampaign[]>([]);
  const [alerts, setAlerts] = useState<TransitAlert[]>([]);

  // Subscriptions
  useEffect(() => {
    const unsubOverrides = subscribeDepotRouteOverrides(setDepotOverrides);
    const unsubUsers = subscribeUsersList(setUsersList);
    const unsubCampaigns = subscribeAdWordsCampaigns(setCampaigns);
    const unsubAlerts = subscribeTransitAlerts(setAlerts);

    return () => {
      unsubOverrides();
      unsubUsers();
      unsubCampaigns();
      unsubAlerts();
    };
  }, []);

  // Form states for creating items
  // 1. Depot re-assignment
  const [reassignRouteId, setReassignRouteId] = useState<string>(routes[0]?.id || '');
  const [targetDepotId, setTargetDepotId] = useState<string>(depots[0]?.id || '');
  const [customRouteName, setCustomRouteName] = useState<string>('');
  const [depotAssignSuccess, setDepotAssignSuccess] = useState<string | null>(null);

  // 2. Add normal commuter user
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');

  // 3. Add AdWords Campaign
  const [showAddAdModal, setShowAddAdModal] = useState<boolean>(false);
  const [adSponsor, setAdSponsor] = useState<string>('');
  const [adHeadline, setAdHeadline] = useState<string>('');
  const [adTargetDepot, setAdTargetDepot] = useState<string>(depots[0]?.id || 'depot-grand-ave');
  const [adTargetRoute, setAdTargetRoute] = useState<string>('ALL');
  const [adClickUrl, setAdClickUrl] = useState<string>('https://mta.info');

  // 4. Add Transit Alert
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'urgent' | 'warning' | 'info'>('warning');
  const [alertTargetRoute, setAlertTargetRoute] = useState<string>('ALL');
  const [alertTargetDepot, setAlertTargetDepot] = useState<string>('ALL');

  // Handle Depot Reassignment
  const handleReassignRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const routeToAssign = customRouteName.trim() ? customRouteName.trim() : reassignRouteId;
    if (!routeToAssign || !targetDepotId) return;

    try {
      await setDepotRouteOverride(
        routeToAssign,
        targetDepotId,
        currentUser?.email || 'admin@metroglass.mta'
      );
      setDepotAssignSuccess(`Successfully assigned ${routeToAssign} to ${targetDepotId}`);
      setCustomRouteName('');
      setTimeout(() => setDepotAssignSuccess(null), 3500);
      onRefreshData?.();
    } catch (err) {
      console.error('Error reassigning depot route:', err);
    }
  };

  // Handle Add Commuter User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    try {
      await createManualCommuterUser({
        email: newUserEmail.trim(),
        displayName: newUserName.trim() || newUserEmail.split('@')[0],
        role: newUserRole,
      });
      setShowAddUserModal(false);
      setNewUserEmail('');
      setNewUserName('');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adSponsor.trim() || !adHeadline.trim()) return;
    try {
      const camp: AdWordsCampaign = {
        id: `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sponsorName: adSponsor.trim(),
        headline: adHeadline.trim(),
        targetDepotId: adTargetDepot,
        targetRouteId: adTargetRoute,
        clickUrl: adClickUrl.trim() || 'https://mta.info',
        status: 'active',
        impressions: 1,
        clicks: 0,
        createdAt: new Date().toISOString(),
      };
      await saveAdWordsCampaign(camp);
      setShowAddAdModal(false);
      setAdSponsor('');
      setAdHeadline('');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add Transit Alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;
    try {
      const alert: TransitAlert = {
        id: `alert_${Date.now()}`,
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        severity: alertSeverity,
        targetRouteId: alertTargetRoute,
        targetDepotId: alertTargetDepot,
        isActive: true,
        publishedAt: new Date().toISOString(),
      };
      await saveTransitAlert(alert);
      setShowAlertModal(false);
      setAlertTitle('');
      setAlertMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  // Effective route-to-depot mapping combining static config + Firestore overrides
  const effectiveDepotMap = React.useMemo(() => {
    const map = new Map<string, string>();
    depots.forEach((d) => {
      d.assignedRouteIds.forEach((rid) => map.set(rid, d.id));
    });
    Object.entries(depotOverrides).forEach(([rId, dId]) => {
      map.set(rId, dId);
    });
    return map;
  }, [depots, depotOverrides]);

  return (
    <div className="flex flex-col w-full h-full bg-[#0B0F17] text-slate-100 overflow-hidden font-sans">
      {/* Admin Subheader & Breadcrumb Navigation */}
      <div className="h-14 shrink-0 px-6 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToMap}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span>Return to Live Map</span>
          </button>
          <span className="text-slate-600 font-mono">/</span>
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h1 className="text-sm font-semibold tracking-tight text-slate-100">
              Transit Administration Console
            </h1>
            <span className="text-xs text-slate-400 hidden sm:inline">
              · Fleet Allocations, Moderation & AdWords
            </span>
          </div>
        </div>

        {/* Right Auth / Admin Status Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden md:inline">{currentUser.email}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                  isAdmin
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isAdmin ? 'ADMINISTRATOR' : 'COMMUTER'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={signIn}
              className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Admin Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-[#0B0F17] border-b md:border-b-0 md:border-r border-slate-800 p-4 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('DEPOTS')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'DEPOTS'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4" />
              <span>Depot Fleet Allocation</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{depots.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'USERS'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>User Accounts & Moderation</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{usersList.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ADWORDS')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'ADWORDS'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-4 h-4" />
              <span>AdWords & Sponsor Ads</span>
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-semibold">
              {campaigns.filter((c) => c.status === 'active').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALERTS')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'ALERTS'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Transit Alert Broadcast</span>
            </div>
            <span className="text-[11px] font-mono text-rose-400 font-semibold">{alerts.length}</span>
          </button>

          {/* Quick Stats Panel */}
          <div className="pt-6 mt-6 border-t border-slate-800/80 px-2 space-y-2 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span>Depot Overrides</span>
              <span className="font-mono text-slate-300">
                {Object.keys(depotOverrides).length} routes
              </span>
            </div>
            <div className="flex justify-between">
              <span>Blocked Users</span>
              <span className="font-mono text-rose-400">
                {usersList.filter((u) => u.isBlocked).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sponsor Impressions</span>
              <span className="font-mono text-amber-400">
                {campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 bg-[#0B0F17] overflow-y-auto p-6">
          {/* TAB 1: DEPOT FLEET ALLOCATION */}
          {activeTab === 'DEPOTS' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Depot Fleet & Route Allocation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reassign MTA bus routes to home depots (Grand Avenue, Casey Stengel, Flatbush,
                  Michael J. Quill). Changes update the live map and vehicle monitoring streams in
                  real time.
                </p>
              </div>

              {/* Reassignment Action Card */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                    <span>Reassign Route to Depot</span>
                  </h3>
                  {depotAssignSuccess && (
                    <span className="text-xs text-emerald-400 font-medium">
                      {depotAssignSuccess}
                    </span>
                  )}
                </div>

                <form
                  onSubmit={handleReassignRoute}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Select Existing Route
                    </label>
                    <select
                      value={reassignRouteId}
                      onChange={(e) => setReassignRouteId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    >
                      {routes.map((r) => {
                        const currentDepotId = effectiveDepotMap.get(r.id) || r.depotId;
                        const depotObj = depots.find((d) => d.id === currentDepotId);
                        return (
                          <option key={r.id} value={r.id}>
                            {r.shortName} · ({depotObj?.name || currentDepotId})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Or Add Custom Route ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MTA NYCT_B44+"
                      value={customRouteName}
                      onChange={(e) => setCustomRouteName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Target Home Depot
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={targetDepotId}
                        onChange={(e) => setTargetDepotId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        {depots.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.borough})
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Depots & Rosters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {depots.map((depot) => {
                  // Find all routes assigned to this depot (static + overrides)
                  const assignedRoutes = routes.filter((r) => {
                    const dId = effectiveDepotMap.get(r.id) || r.depotId;
                    return dId === depot.id;
                  });

                  // Check if depot has an active AdWords sponsor
                  const activeDepotAd = campaigns.find(
                    (c) => c.status === 'active' && c.targetDepotId === depot.id
                  );

                  return (
                    <div
                      key={depot.id}
                      className={`p-4 rounded-xl border bg-slate-900/40 space-y-3 ${
                        activeDepotAd
                          ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-100">{depot.name}</h4>
                            <span className="text-[11px] font-mono text-slate-400">
                              · {depot.borough}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {depot.address}
                          </p>
                        </div>

                        {activeDepotAd && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold">
                            <Sparkles className="w-3 h-3" />
                            <span>Sponsored</span>
                          </div>
                        )}
                      </div>

                      {activeDepotAd && (
                        <div className="p-2 rounded bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-200">
                          <span className="font-semibold">{activeDepotAd.sponsorName}:</span>{' '}
                          {activeDepotAd.headline}
                        </div>
                      )}

                      <div>
                        <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex justify-between">
                          <span>Assigned Fleet Lines</span>
                          <span className="font-mono text-slate-500">
                            {assignedRoutes.length} active
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {assignedRoutes.map((r) => {
                            const isOverridden = depotOverrides[r.id] === depot.id;
                            return (
                              <span
                                key={r.id}
                                className={`px-2 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                                  isOverridden
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                                    : 'bg-slate-800 text-slate-200 border-slate-700'
                                }`}
                                title={
                                  isOverridden
                                    ? `Reassigned to ${depot.name} via Admin`
                                    : r.description
                                }
                              >
                                {r.shortName}
                                {isOverridden && <span className="text-[10px] ml-1">★</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: USER ACCOUNTS & MODERATION */}
          {activeTab === 'USERS' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">
                    User Accounts & Moderation
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage commuter access, block malicious or spam accounts, and create verified
                    riders.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Commuter Profile</span>
                  </button>
                </div>
              </div>

              {/* User search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Users Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0F17] border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">User & Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Account Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usersList
                      .filter(
                        (u) =>
                          u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase())
                      )
                      .map((u) => {
                        return (
                          <tr key={u.uid} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-sky-400">
                                  {u.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-200">{u.displayName}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`font-mono text-[11px] font-semibold ${
                                  u.role === 'admin' ? 'text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {u.isBlocked ? (
                                <span className="inline-flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Blocked</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Active</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {u.role === 'admin' ? (
                                <span className="text-[11px] text-slate-600 italic">Protected</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleUserBlockStatus(u.uid, !u.isBlocked)}
                                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    u.isBlocked
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                                      : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                                  }`}
                                >
                                  {u.isBlocked ? 'Unblock User' : 'Block User'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                          No registered users found. Click &quot;Create Commuter Profile&quot; to add a user.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add User Modal */}
              {showAddUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Create / Register Commuter User
                    </h3>
                    <p className="text-xs text-slate-400">
                      Add a normal user profile so they can receive personalized notifications and
                      route alerts.
                    </p>

                    <form onSubmit={handleCreateUser} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="e.g. Maria Gonzalez"
                          className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="e.g. commuter@nyc.rr.com"
                          className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Role
                        </label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as 'user' | 'admin')}
                          className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                        >
                          <option value="user">Normal Commuter (Receives Alerts)</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddUserModal(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors"
                        >
                          Create Profile
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADWORDS & SPONSOR ADS */}
          {activeTab === 'ADWORDS' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">
                    AdWords & Sponsored Campaigns
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Create sponsored campaigns targeting specific depots or corridors. Active
                    sponsors appear as glowing pins and callout banners on the live 3D &amp; WebGL
                    maps.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAdModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Campaign</span>
                </button>
              </div>

              {/* Campaigns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((camp) => {
                  const targetDepotObj = depots.find((d) => d.id === camp.targetDepotId);
                  const isActive = camp.status === 'active';

                  return (
                    <div
                      key={camp.id}
                      className={`p-4 rounded-xl border bg-slate-900/50 space-y-3 ${
                        isActive ? 'border-amber-500/50' : 'border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-100">
                              {camp.sponsorName}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                                isActive
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {camp.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 font-medium">{camp.headline}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteAdWordsCampaign(camp.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/30 border border-slate-800 text-[11px] space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Target Depot:</span>
                          <span className="font-medium text-slate-200">
                            {targetDepotObj?.name || camp.targetDepotId}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Corridor Route:</span>
                          <span className="font-mono text-slate-200">
                            {camp.targetRouteId || 'ALL'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Target URL:</span>
                          <a
                            href={camp.clickUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:underline truncate max-w-[200px]"
                          >
                            {camp.clickUrl}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <div className="flex items-center gap-3 text-slate-400 font-mono">
                          <span>👁️ {camp.impressions || 0} imp</span>
                          <span>·</span>
                          <span>🖱️ {camp.clicks || 0} clicks</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await saveAdWordsCampaign({
                              ...camp,
                              status: isActive ? 'paused' : 'active',
                            });
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                            isActive
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900'
                          }`}
                        >
                          {isActive ? 'Pause Ads' : 'Activate Ads'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {campaigns.length === 0 && (
                  <div className="col-span-2 py-10 text-center text-xs text-slate-500 border border-slate-800/80 rounded-xl">
                    No active campaigns. Click &quot;Create Campaign&quot; to sponsor a depot pin or route banner.
                  </div>
                )}
              </div>

              {/* Add Campaign Modal */}
              {showAddAdModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Create Sponsored AdWords Campaign
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configures a sponsored beacon pin on the selected depot and displays promotional
                      copy on transit cards.
                    </p>

                    <form onSubmit={handleCreateCampaign} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Sponsor Brand Name
                        </label>
                        <input
                          type="text"
                          required
                          value={adSponsor}
                          onChange={(e) => setAdSponsor(e.target.value)}
                          placeholder="e.g. Brooklyn Craft Roastery or Citi Bike"
                          className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Promotional Headline / Offer
                        </label>
                        <input
                          type="text"
                          required
                          value={adHeadline}
                          onChange={(e) => setAdHeadline(e.target.value)}
                          placeholder="e.g. Free Cold Brew with transit tap before boarding B38"
                          className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Target Depot
                          </label>
                          <select
                            value={adTargetDepot}
                            onChange={(e) => setAdTargetDepot(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                          >
                            {depots.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Corridor Route
                          </label>
                          <select
                            value={adTargetRoute}
                            onChange={(e) => setAdTargetRoute(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                          >
                            <option value="ALL">All Depot Routes</option>
                            {routes.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.shortName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Destination Web Link
                        </label>
                        <input
                          type="url"
                          value={adClickUrl}
                          onChange={(e) => setAdClickUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddAdModal(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                        >
                          Launch Campaign
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRANSIT ALERT BROADCAST */}
          {activeTab === 'ALERTS' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">
                    Transit Alert Broadcast
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Broadcast immediate service bulletins, delays, and weather alerts. Active
                    bulletins float at the top of riders&apos; live maps.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlertModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Broadcast Alert</span>
                </button>
              </div>

              {/* Alerts List */}
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            alert.severity === 'urgent'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : alert.severity === 'warning'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-sky-950 text-sky-300 border border-sky-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-100">{alert.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300">{alert.message}</p>
                      <div className="text-[11px] text-slate-500 font-mono pt-1">
                        Target Route: {alert.targetRouteId || 'ALL'} · Target Depot:{' '}
                        {alert.targetDepotId || 'ALL'} · Published:{' '}
                        {new Date(alert.publishedAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteTransitAlert(alert.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Withdraw Alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="py-10 text-center text-xs text-slate-500 border border-slate-800/80 rounded-xl">
                    No active service alerts broadcast. All lines operating nominally.
                  </div>
                )}
              </div>

              {/* Broadcast Alert Modal */}
              {showAlertModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Broadcast Transit Service Bulletin
                    </h3>

                    <form onSubmit={handleCreateAlert} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Bulletin Title
                        </label>
                        <input
                          type="text"
                          required
                          value={alertTitle}
                          onChange={(e) => setAlertTitle(e.target.value)}
                          placeholder="e.g. Grand Ave Corridor Delays due to BQE Construction"
                          className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Advisory Details
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={alertMessage}
                          onChange={(e) => setAlertMessage(e.target.value)}
                          placeholder="Describe the affected lines, expected headway, or recommended transfer stops..."
                          className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Severity Level
                          </label>
                          <select
                            value={alertSeverity}
                            onChange={(e) =>
                              setAlertSeverity(e.target.value as 'urgent' | 'warning' | 'info')
                            }
                            className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                          >
                            <option value="info">Informational Advisory</option>
                            <option value="warning">Service Warning / Headway Change</option>
                            <option value="urgent">Urgent Interruption / Detour</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Target Depot
                          </label>
                          <select
                            value={alertTargetDepot}
                            onChange={(e) => setAlertTargetDepot(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-200"
                          >
                            <option value="ALL">All Depots</option>
                            {depots.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAlertModal(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded-lg transition-colors"
                        >
                          Broadcast to Map
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
