import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  AdWordsCampaign,
  DepotRouteOverride,
  RouteSubscription,
  TransitAlert,
  UserProfile,
} from '../types/admin';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline. Check connectivity/config.');
    }
  }
}
testConnection();

export const BOOTSTRAP_ADMIN_EMAIL = 'mxsarmiento@gmail.com';

export function isUserAdmin(user: FirebaseUser | null, profile?: UserProfile | null): boolean {
  if (!user) return false;
  if (user.email === BOOTSTRAP_ADMIN_EMAIL) return true;
  return profile?.role === 'admin';
}

// ==================== AUTH HELPERS ====================

export async function loginWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Sync profile to firestore
    await syncUserProfile(user);
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const isAdmin = user.email === BOOTSTRAP_ADMIN_EMAIL;
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const updated: Partial<UserProfile> = {
        displayName: user.displayName || data.displayName || 'Commuter',
        photoURL: user.photoURL || data.photoURL || '',
        email: user.email || data.email,
        updatedAt: new Date().toISOString(),
      };
      if (isAdmin && data.role !== 'admin') {
        updated.role = 'admin';
      }
      await setDoc(userRef, { ...data, ...updated }, { merge: true });
      return { ...data, ...updated } as UserProfile;
    } else {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Transit Rider',
        photoURL: user.photoURL || '',
        role: isAdmin ? 'admin' : 'user',
        isBlocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

// ==================== DEPOT ROUTE OVERRIDES ====================

export function subscribeDepotRouteOverrides(
  callback: (overrides: Record<string, string>) => void
): () => void {
  const colRef = collection(db, 'depot_routes');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DepotRouteOverride;
        if (data.routeId && data.depotId) {
          map[data.routeId] = data.depotId;
        }
      });
      callback(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'depot_routes');
    }
  );
}

export async function setDepotRouteOverride(
  routeId: string,
  depotId: string,
  assignedByEmail: string
): Promise<void> {
  const ref = doc(db, 'depot_routes', routeId);
  try {
    await setDoc(ref, {
      routeId,
      depotId,
      assignedBy: assignedByEmail,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `depot_routes/${routeId}`);
  }
}

// ==================== USER MODERATION ====================

export function subscribeUsersList(callback: (users: UserProfile[]) => void): () => void {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UserProfile);
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    }
  );
}

export async function toggleUserBlockStatus(uid: string, isBlocked: boolean): Promise<void> {
  const ref = doc(db, 'users', uid);
  try {
    await setDoc(
      ref,
      {
        isBlocked,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function createManualCommuterUser(params: {
  email: string;
  displayName: string;
  role: 'admin' | 'user';
}): Promise<void> {
  const mockUid = 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const ref = doc(db, 'users', mockUid);
  try {
    await setDoc(ref, {
      uid: mockUid,
      email: params.email,
      displayName: params.displayName,
      role: params.role,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${mockUid}`);
  }
}

// ==================== ADWORDS CAMPAIGNS ====================

export function subscribeAdWordsCampaigns(
  callback: (campaigns: AdWordsCampaign[]) => void
): () => void {
  const colRef = collection(db, 'adwords_campaigns');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AdWordsCampaign[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AdWordsCampaign);
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'adwords_campaigns');
    }
  );
}

export async function saveAdWordsCampaign(campaign: AdWordsCampaign): Promise<void> {
  const ref = doc(db, 'adwords_campaigns', campaign.id);
  try {
    await setDoc(ref, campaign);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `adwords_campaigns/${campaign.id}`);
  }
}

export async function deleteAdWordsCampaign(campaignId: string): Promise<void> {
  const ref = doc(db, 'adwords_campaigns', campaignId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `adwords_campaigns/${campaignId}`);
  }
}

export async function recordCampaignClick(campaignId: string, currentClicks: number): Promise<void> {
  const ref = doc(db, 'adwords_campaigns', campaignId);
  try {
    await setDoc(ref, { clicks: currentClicks + 1 }, { merge: true });
  } catch {
    // Non-critical telemetry
  }
}

// ==================== TRANSIT ALERTS ====================

export function subscribeTransitAlerts(callback: (alerts: TransitAlert[]) => void): () => void {
  const colRef = collection(db, 'transit_alerts');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: TransitAlert[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as TransitAlert;
        if (item.isActive) {
          list.push(item);
        }
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'transit_alerts');
    }
  );
}

export async function saveTransitAlert(alert: TransitAlert): Promise<void> {
  const ref = doc(db, 'transit_alerts', alert.id);
  try {
    await setDoc(ref, alert);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transit_alerts/${alert.id}`);
  }
}

export async function deleteTransitAlert(alertId: string): Promise<void> {
  const ref = doc(db, 'transit_alerts', alertId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `transit_alerts/${alertId}`);
  }
}

// ==================== COMMUTER ROUTE SUBSCRIPTIONS ====================

export function subscribeUserSubscriptions(
  userId: string,
  callback: (subs: RouteSubscription[]) => void
): () => void {
  const colRef = collection(db, 'subscriptions');
  const q = query(colRef, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: RouteSubscription[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as RouteSubscription);
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'subscriptions');
    }
  );
}

export async function saveRouteSubscription(sub: RouteSubscription): Promise<void> {
  const ref = doc(db, 'subscriptions', sub.id);
  try {
    await setDoc(ref, sub);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `subscriptions/${sub.id}`);
  }
}

export async function deleteRouteSubscription(subId: string): Promise<void> {
  const ref = doc(db, 'subscriptions', subId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `subscriptions/${subId}`);
  }
}

// Seed initial default AdWords campaigns and sample Alert if empty
export async function seedInitialAdminDataIfNeeded() {
  try {
    const adwordsSnap = await getDocs(collection(db, 'adwords_campaigns'));
    if (adwordsSnap.empty) {
      const initialCampaign: AdWordsCampaign = {
        id: 'ad-grand-ave-transitpass',
        sponsorName: 'TransitPass Pro NYC',
        headline: 'Unlimited Express & Local Bus Swipes with 15% Commuter Cash Back',
        targetDepotId: 'depot-grand-ave',
        targetRouteId: 'ALL',
        clickUrl: 'https://mta.info',
        status: 'active',
        impressions: 1420,
        clicks: 86,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'adwords_campaigns', initialCampaign.id), initialCampaign);

      const secondaryCampaign: AdWordsCampaign = {
        id: 'ad-flushing-roasters',
        sponsorName: 'Queens Artisan Roasters',
        headline: 'Grab artisanal espresso at Main St & Roosevelt before boarding Q44-SBS',
        targetDepotId: 'depot-casey-stengel',
        targetRouteId: 'MTA NYCT_Q44+',
        clickUrl: 'https://mta.info',
        status: 'active',
        impressions: 980,
        clicks: 52,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'adwords_campaigns', secondaryCampaign.id), secondaryCampaign);
    }

    const alertsSnap = await getDocs(collection(db, 'transit_alerts'));
    if (alertsSnap.empty) {
      const initialAlert: TransitAlert = {
        id: 'alert-grand-ave-dispatch',
        title: 'Grand Avenue Depot Fleet Advisory',
        message: 'B38 and Q58 Select Bus service operating on regular headway. Bus tracking active with real-time occupancy monitoring.',
        severity: 'info',
        targetRouteId: 'ALL',
        targetDepotId: 'depot-grand-ave',
        isActive: true,
        publishedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'transit_alerts', initialAlert.id), initialAlert);
    }
  } catch (err) {
    console.warn('Initial admin data seeding notice (expected if restricted):', err);
  }
}
