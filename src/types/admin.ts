export interface DepotRouteOverride {
  routeId: string;
  depotId: string;
  assignedBy?: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  isBlocked: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdWordsCampaign {
  id: string;
  sponsorName: string;
  headline: string;
  targetDepotId: string; // e.g. 'depot-grand-ave' or 'ALL'
  targetRouteId?: string; // e.g. 'MTA NYCT_B38' or 'ALL'
  clickUrl?: string;
  status: 'active' | 'paused';
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface TransitAlert {
  id: string;
  title: string;
  message: string;
  severity: 'urgent' | 'warning' | 'info';
  targetRouteId?: string;
  targetDepotId?: string;
  isActive: boolean;
  publishedAt: string;
}

export interface RouteSubscription {
  id: string;
  userId: string;
  routeId: string;
  stopId?: string;
  alertMinutesThreshold: number; // e.g. 5 minutes
  channels?: string[]; // ['in_app', 'browser']
  createdAt: string;
}
