# Transit Administration & User Engagement Console (MetroGlass NYC)

A comprehensive administrative and user notification subsystem for MetroGlass NYC that empowers operations managers to reassign transit routes to depots, moderate user accounts, manage sponsored AdWords campaigns, and broadcast real-time transit alerts, while allowing everyday commuters to register, subscribe to route notifications, and experience sponsored depot pins and live alert banners across the interactive 3D/WebGL map.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience decisions were confirmed through Phase 1 planning consultation:

- **Confirmed: Administration View Mode**: Full-screen administration dashboard accessible via a primary view toggle switch (`Live Map Ops` ↔ `Admin Console`) in the header navigation, preserving full map state in the background.
- **Confirmed: Backend & Persistence Model**: Firebase Authentication (Google Auth + Role-Based Access Control) paired with a Firestore real-time database to persist custom depot route assignments, user records, notification subscriptions, and sponsored ad campaigns.
- **Confirmed: Map Reflection Model**: Administrator-managed AdWords campaigns reflect on the map as prominent glowing **Sponsored Depot Pins** with sponsor details, accompanied by floating **Transit Alert Popup Banners** for high-priority administrative service updates.
- **Bootstrapped Administrator**: Initial administrative privileges will be assigned to `mxsarmiento@gmail.com` with secure Firestore rules preventing unauthorized privilege escalation.

---

### 1. Overview & Core Concept

- **What It Does**: Enhances the existing high-performance NYC transit visualization platform with a dual-mode workflow:
  1. **Transit Map Operations**: Real-time 3D Cityscape and Google Maps WebGL monitoring with dynamic depot assignments, sponsored depot pins, live bus occupancy, speed comparisons, and transit alert banners.
  2. **Full-Screen Administration Dashboard**: An operations hub offering four specialized management panels: Depot Route Assignment, User Moderation & Status Control, AdWords & Campaign Manager, and Alert Broadcaster.
  3. **User Engagement & Notification Subscriptions**: Commuter accounts with personalized route subscriptions (e.g. alerts when buses on selected routes are approaching or delayed) and browser/in-app notification delivery.
- **Target Audience & Personas**:
  - *Transit Operations Admin*: MTA dispatchers and managers who adjust depot fleets, update route allocations, moderate platform access, and post system-wide service bulletins.
  - *Sponsor / Advertising Manager*: Campaign coordinators who target depots and transit corridors with promotional banners and sponsor badges.
  - *Everyday Commuters*: Riders who sign in, save favorite routes (like B38, Q58, M15-SBS), configure arrival notifications, and view real-time transit alerts.
- **Key Value**: Bridges real-time telemetry with administrative control and user engagement, transforming the viewer into an interactive transit management and rider communications portal.

---

### 2. User Experience & Visual Design

#### A. Key User Flows

1. **View Toggle & Navigation**:
   - The top navigation bar features a prominent segmented switch: `[ 🗺️ Live Map ]` and `[ ⚙️ Administration ]`.
   - Clicking `Administration` smoothly transitions the viewport to the full-screen admin console without unmounting or resetting the 3D map engine and SIRI stream.
   - For unauthenticated users, the Admin view displays a secure authentication card with role verification. Non-admin users are guided to their commuter profile and notification settings.

2. **Depot Route Management**:
   - **Current Assignments Matrix**: View all NYC MTA Depots (Grand Avenue, Casey Stengel, Flatbush, Michael J. Quill, East New York, etc.) and their assigned routes.
   - **Reassign Route**: Dropdown to select a route (e.g., `B38`, `Q58`, `Q54`) and change its home depot from one facility to another, or add new route IDs.
   - **Instant Map Reflection**: When saved, Firestore broadcasts the updated depot mapping. The map's depot filter immediately reflects the new roster, updates bus markers, and refreshes the corridor shapes.

3. **User Moderation & Account Control**:
   - High-density user table displaying: User Avatar, Name, Email, Role (`admin` / `user`), Joined Date, Subscribed Routes count, and Account Status (`Active` / `Blocked`).
   - **Block / Unblock Action**: Instant toggle to suspend offending users. Blocked users lose access to interactive features and receive a clear notice.
   - **Create / Invite Commuter**: Admin modal to register or create normal commuter profiles with specific notification preferences.

4. **AdWords & Sponsored Campaign Manager**:
   - **Campaign Builder**: Title, Sponsor Brand Name, Target Depot (e.g., Grand Avenue Depot), Target Route (or "All Corridors"), Headline Copy, Call-to-Action Link, and Campaign Status (`Active` / `Paused`).
   - **Performance Telemetry**: Track impressions and click-through counts stored in Firestore.
   - **Map Pin Activation**: Active campaigns automatically attach a glowing sponsored aura and badge to the target depot on the live map.

5. **Commuter Route Notifications & Alert Center**:
   - Commuters can click `🔔 Alerts` or visit their user drawer to subscribe to real-time alerts on selected routes.
   - Configurable parameters: Trigger threshold (e.g., `< 5 minutes away`), stop preference, and notification channels (in-app toast + browser Web Notifications).
   - Real-time client-side evaluator triggers alerts when SIRI vehicle monitoring data detects an approaching bus on a subscribed route.

6. **Map Reflection: Sponsored Depot Pins & Transit Alert Banners**:
   - **Sponsored Depot Pins**: On the map, depots with active campaigns render a distinctive amber/gold halo and sponsor crest. Clicking reveals the sponsor card with custom perks and promotional links.
   - **Transit Alert Popup Banners**: Active administrative alerts float as sleek, dismissible banners at the top of the map viewport, categorized by severity (`Urgent`, `Advisory`, `Maintenance`).

#### B. Visual Identity & Theme

- **Aesthetic Direction**: High-density command-center aesthetic matching MetroGlass NYC's dark slate palette (`#0B0F17`), with crisp 1px borders, subtle surface elevations, and zero-pill discipline.
- **Color Tokens**:
  - Background Canvas: `#0B0F17` (Deep Slate / Pitch)
  - Surface Panels: `#111827` (Dark Charcoal / Slate 900)
  - Accent / Primary: `#38BDF8` (Sky Blue)
  - Success / Active: `#10B981` (Emerald Green)
  - Caution / Sponsored: `#F59E0B` (Amber Gold)
  - Danger / Blocked: `#EF4444` (Crimson)
  - Border Lines: `#1E293B` (Slate 800)
- **Typography & Formatting**:
  - Headings & Navigation: `Plus Jakarta Sans` / `Outfit`
  - Route Codes & Numeric Telemetry: Monospace tabular numerals (`JetBrains Mono`, `font-mono tabular-nums`)
  - Metadata: Clean unboxed text separated by subtle typographic dots (`·`)—strictly avoiding generic pill tags.
- **Component Styling & Layout**:
  - Two-pane admin layout: Sticky sidebar navigation for Admin sub-sections (`Depot Fleet`, `User Management`, `AdWords Campaigns`, `Transit Alerts`) + High-density main viewport.
  - Compact data rows ($36\text{px}$–$42\text{px}$), clean hover highlights, and explicit confirmation modals for destructive operations (e.g., blocking a user).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Screen View Toggle vs. Overlay Modal**:
  - *Chosen*: Full-screen dashboard with seamless tab switching in the header navigation.
  - *Rationale*: Managing tabular user lists, complex depot-route mappings, and AdWords campaigns requires horizontal screen real estate. Keeping the map mounted in the background preserves WebGL contexts, 3D camera orientation, and live data cache without reinitialization lag.
- **Decision 2: Firestore Real-Time Synchronization vs. Polling**:
  - *Chosen*: Firestore `onSnapshot` real-time listeners for depot assignments, user status, ad campaigns, and alerts.
  - *Rationale*: Updates made by an administrator immediately propagate to all connected clients and the map view in sub-second time without client refreshes or expensive server polling loops.
- **Decision 3: Zero-Trust Security Rules & Role Verification**:
  - *Chosen*: Attribute-Based Access Control (ABAC) in `firestore.rules` verifying identity via trusted document lookups (`admins/{uid}` or `users/{uid}.role == 'admin'`), protecting all administrative write paths.
  - *Rationale*: Ensures user accounts, ad campaigns, and route reassignments cannot be spoofed from browser developer tools.
- **Decision 4: Sponsored Depot Pins & Alert Banners on Map**:
  - *Chosen*: Integrate sponsors into existing 3D Cityscape & Google Maps WebGL canvases via custom 3D depot beacons and 2D overlays, accompanied by top-docked alert banners.
  - *Rationale*: Provides genuine visual value without cluttering core bus navigation, fulfilling the user's specific request for sponsored pins and alert popups.

---

### 4. Technical Architecture & Data Strategy

#### System & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             MetroGlass NYC App                             │
├──────────────────────────────────────┬──────────────────────────────────────┤
│               Header Nav             │  View Toggle: [Map Ops] ↔ [Admin]    │
│  User Profile & Auth State (Google)  │  Active Alert Ticker / Sponsored Pill│
├──────────────────────────────────────┴──────────────────────────────────────┤
│                               VIEWPORT SWITCH                               │
├──────────────────────────────────────┬──────────────────────────────────────┤
│          LIVE MAP OPS VIEW           │       ADMINISTRATION DASHBOARD       │
│ ┌──────────────────────────────────┐ │ ┌───────────────┬──────────────────┐ │
│ │  DepotCommandPanel (Left Drawer) │ │ │ Admin Nav     │ Tab Content:     │ │
│ │  - Grand Ave, Casey Stengel, etc │ │ │ - Depots      │ • Depot Fleet    │ │
│ │  - Corridor Filters & Fleet      │ │ │ - Users       │   Reassignment   │ │
│ ├──────────────────────────────────┤ │ │ - AdWords     │ • User Accounts  │ │
│ │  Map Engine Viewport             │ │ │ - Alerts      │   & Block Status │ │
│ │  • GoogleMapsWebGLCanvas         │ │ │ - Commuter    │ • Ad Campaigns   │ │
│ │  • NYC3DCityscapeCanvas          │ │ │   Subscribers │ • Broadcast      │ │
│ │  • Sponsored Depot Pins (Amber)  │ │ │               │   Transit Alert  │ │
│ │  • Transit Alert Popup Banners   │ │ └───────────────┴──────────────────┘ │
│ └──────────────────────────────────┘ │                                      │
├──────────────────────────────────────┴──────────────────────────────────────┤
│                         FIREBASE INTEGRATION LAYER                          │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────────┐  │
│  │ Firebase Auth (Google)  │  │ Firestore Real-time Collections:         │  │
│  │ • Current User Session  │  │ • /depot_routes (Custom Route Overrides) │  │
│  │ • Admin Role Guard      │  │ • /users (Profiles, Roles, isBlocked)    │  │
│  │ • Token & Verification  │  │ • /adwords_campaigns (Sponsored Ads)     │  │
│  └─────────────────────────┘  │ • /transit_alerts (System Service Alerts)│  │
│                               │ • /subscriptions (Rider Route Alerts)    │  │
│                               └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Firestore Data Model

1. **`depot_routes` Collection** (`/depot_routes/{routeId}`):
   - `routeId`: String (e.g. `'MTA NYCT_B38'`, `'MTA NYCT_Q58'`)
   - `depotId`: String (e.g. `'depot-grand-ave'`, `'depot-casey-stengel'`)
   - `assignedBy`: String (Admin UID)
   - `updatedAt`: Timestamp

2. **`users` Collection** (`/users/{userId}`):
   - `uid`: String
   - `email`: String
   - `displayName`: String
   - `photoURL`: String
   - `role`: `'admin'` | `'user'`
   - `isBlocked`: Boolean (default `false`)
   - `createdAt`: Timestamp
   - `updatedAt`: Timestamp

3. **`adwords_campaigns` Collection** (`/adwords_campaigns/{campaignId}`):
   - `id`: String
   - `sponsorName`: String (e.g. `'TransitPass Pro'`, `'Brooklyn Coffee Roasters'`)
   - `headline`: String
   - `targetDepotId`: String (e.g. `'depot-grand-ave'`)
   - `targetRouteId`: String (optional, e.g. `'ALL'` or `'MTA NYCT_B38'`)
   - `clickUrl`: String
   - `status`: `'active'` | `'paused'`
   - `impressions`: Number
   - `clicks`: Number
   - `createdAt`: Timestamp

4. **`transit_alerts` Collection** (`/transit_alerts/{alertId}`):
   - `id`: String
   - `title`: String
   - `message`: String
   - `severity`: `'urgent'` | `'warning'` | `'info'`
   - `targetRouteId`: String (e.g. `'ALL'` or route identifier)
   - `targetDepotId`: String (optional)
   - `isActive`: Boolean
   - `publishedAt`: Timestamp
   - `expiresAt`: Timestamp

5. **`route_subscriptions` Collection** (`/subscriptions/{subId}`):
   - `id`: String
   - `userId`: String
   - `routeId`: String
   - `stopId`: String (optional)
   - `alertMinutesThreshold`: Number (e.g. `5`)
   - `channels`: Array of strings (`['in_app', 'browser']`)
   - `createdAt`: Timestamp

#### Interactive Component & State Mapping

- **`AdminDashboardView`**:
  - `DepotRouteTab`: Interactive table of all depot routes with menus to reassign any route (such as Grand Avenue Depot routes `B38`, `B54`, `Q54`, `Q58`, etc.) and add custom routes.
  - `UserManagementTab`: Live list of registered commuters with search filter, badge-free metadata, one-click block/unblock buttons, and an "Add / Invite User" dialog.
  - `AdWordsTab`: Form to create new sponsored ads, set sponsor name, choose target depot, input headline, and toggle campaign active state. Displays live impression counters.
  - `TransitAlertsTab`: Broadcast tool allowing admins to post immediate bulletins that pop up on riders' map screens.
- **`TransitAlertBannerOverlay`**:
  - Docks smoothly at the top of the map when active alerts exist for the currently viewed route or depot. Includes dismissal and details expansion.
- **`SponsoredDepotPinMarker`**:
  - Highlighting layer on both Google Maps WebGL and 3D Canvas. When a depot has an active AdWords campaign, its pin glows in amber-gold and displays a sponsor callout.
- **`CommuterAlertsDrawer / Modal`**:
  - Allows normal authenticated riders to toggle subscriptions for their favorite routes and test browser notifications.

---

### Execution Phases (Upon Approval)

1. **Phase 1: Firebase Provisioning & Security Hardening**:
   - Provision Firebase Firestore & Authentication using standard tools.
   - Define `firebase-blueprint.json` and strict `firestore.rules` implementing RBAC, immutable fields, and PII isolation.
2. **Phase 2: Authentication & Real-Time Data Services**:
   - Implement `firebaseClient.ts` and React Firebase Context.
   - Set up real-time Firestore synchronization for depot routes, users, campaigns, alerts, and subscriptions.
3. **Phase 3: Administration Dashboard UI**:
   - Build `AdminDashboardView.tsx` with high-density SaaS tables for Depot Fleets, User Moderation, AdWords Campaigns, and Transit Alert broadcasting.
4. **Phase 4: Commuter Notification Subscription UI**:
   - Build Commuter Profile & Route Alerts subscription panel with browser notification support.
5. **Phase 5: Map Reflection (Sponsored Depot Pins & Alert Banners)**:
   - Enhance both Google Maps WebGL and NYC 3D Cityscape canvases with glowing sponsored depot beacons and top-docked alert banners.
   - Connect live depot route overrides so changing a route's depot in the Admin dashboard updates the map in real time.
6. **Phase 6: Verification & Compilation**:
   - Run typechecking and linting to ensure zero errors and seamless runtime performance.
