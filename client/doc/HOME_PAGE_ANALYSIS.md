# Home Page (`/home`) & Landing Page (`/`) — Component Architecture & UI/UX Analysis

> **Last Updated**: 2026-03-27

## Table of Contents

1. [Landing Page Overview](#landing-page-overview)
2. [Home Page Overview](#home-page-overview)
3. [Full Layout Hierarchy](#full-layout-hierarchy)
4. [Component Breakdown](#component-breakdown)
5. [Current Layout Structure](#current-layout-structure)
6. [State Management (Redux)](#state-management-redux)
7. [Loading & Error States](#loading--error-states)
8. [Current UI/UX Issues](#current-uiux-issues)
9. [UI/UX Improvement Suggestions](#uiux-improvement-suggestions)

---

## Landing Page Overview

**Route:** `/` (root)
**File:** `src/app/page.js`
**Purpose:** Public landing page for unauthenticated users. Showcases the platform's features and provides Login/Signup CTAs. Authenticated users are auto-redirected to `/home` or `/dashboard` based on role.

**Key Sections:**
- Sticky glassmorphic navbar (logo, dark mode toggle, Login/Signup or "Go to App")
- Hero section with gradient headline "Connect, Chat & Grow Together"
- Stats strip (Real-Time Chat, Medical Maps, Secure Auth, Growth Track)
- 6-card features grid (Live Map, Real-Time Chat, Community Groups, Prescription Management, Analytics, Smart Alerts)
- Green gradient CTA banner with signup/login buttons
- Minimal footer

**Theme Integration:** Full MUI light/dark mode sync via `useTheme()` + `useAppTheme()`. Floating gradient orbs, wheat SVG pattern, existing animation keyframes.

**Auth Behavior:** Uses `useSession()` — redirects authenticated users via `useEffect` based on `inferRole(session.user.roles)`.

---

## Home Page Overview

**Route:** `/home`
**File:** `src/app/home/page.js`
**Purpose:** The primary real-time interaction page where users chat with others and explore the interactive map. It is the core feature page of the CareConnect application.

**Page Title in AppShell:** "Home" — "Chat with users and explore the map"

---

## Full Layout Hierarchy

```
RootLayout (src/app/layout.js)
├── Providers (Redux, NextAuth, MUI Theme)
│   └── AppShell (src/components/AppShell.jsx)
│       ├── Sidebar (permanent on desktop, drawer on mobile) — 264px wide
│       │   └── SidebarNav (brand logo, user info, navigation links)
│       ├── Top Header Bar (sticky AppBar)
│       │   ├── Mobile hamburger menu (lg:hidden)
│       │   ├── Search input (max 400px)
│       │   ├── Mail icon button
│       │   ├── Notifications icon button (with pulsing badge)
│       │   ├── Dark/Light mode toggle
│       │   └── User avatar + name/email
│       ├── Page Header ("Home" title + description)
│       └── Main Content Area (#main-content)
│           └── LandingPage (src/app/home/page.js)
│               ├── [Offline Overlay — conditional]
│               └── Flex container (50/50 split)
│                   ├── Left Panel (w-1/2)
│                   │   └── Dynamic component (default: ChatWindow)
│                   └── Right Panel (w-1/2)
│                       └── Dynamic component (default: MapWindow)
```

---

## Component Breakdown

### 1. LandingPage (`src/app/home/page.js`)

**Role:** Page-level orchestrator. Handles authentication, offline detection, and dynamic panel rendering.

**Key behaviors:**
- Checks session auth + JWT expiry on mount; redirects to `/login` if invalid
- Listens for browser `online`/`offline` events and shows a full-screen overlay when offline
- Reads `leftComponent` and `rightComponent` from Redux `layout` slice
- Uses `dynamic()` imports (no SSR) for all heavy components: `ChatWindow`, `MapWindow`, `Chat`, `FriendsPanel`
- Renders a loading skeleton (two 50% boxes) until authentication is confirmed

**Supported panel components:**
| `name` value | Component | Description |
|---|---|---|
| `"chat"` | `ChatWindow` | Chat list (conversations, groups, contacts) |
| `"map"` | `MapWindow` | Interactive Leaflet map |
| `"user-chat"` | `Chat` | Active 1:1 or group chat conversation |
| `"friends"` | `FriendsPanel` | Friends list and friend requests |

**Layout CSS:**
```css
.flex.min-h-[calc(100vh-64px)].gap-3
  ├── .w-1/2  → left panel
  └── .w-1/2  → right panel
```

---

### 2. ChatWindow (`src/components/Chat/ChatWindow.jsx`)

**Role:** WhatsApp-style chat list panel. Shows all conversations, groups, and contacts.

**Sub-sections (top to bottom):**
1. **Header** — "Chats" title + conversation count + create group button (disabled)
2. **Search bar** — TextField with search icon, filters chats/contacts by name
3. **Tabs** — "All (N)" | "Groups (N)" | "Contacts (N)" — full-width tabs
4. **Scrollable chat list** — `ListItemButton` rows with:
   - Avatar (with online badge for 1:1, group icon for groups)
   - Name + sentiment indicator (for 1:1 chats)
   - Last message preview (truncated at 45 chars) + relative timestamp
   - Unread count chip

**On chat click:** Sets `leftComponent` to `"user-chat"` (navigates to the active Chat conversation).

**Container:** `<Paper variant="outlined">` — full height, flex column, overflow hidden.

---

### 3. MapWindow → Map (`src/components/Map/MapWindow.jsx` → `src/components/Map/Map.jsx`)

**Role:** Interactive Leaflet map showing the current user's location, nearby users, and location-based features.

**Key features:**
- `react-leaflet` MapContainer with tile layers (multiple themes)
- User location marker with pulsing animation
- Nearby users displayed as markers with popups
- Radius circle around user's location
- Floating controls (my location, settings, tile layer switcher)
- Nearby users sidebar within the map panel
- Route display component
- Location sharing toggle

**Container:** Simple flex-col wrapper, full width/height.

---

### 4. Chat (`src/components/Chat/Chat.jsx`)

**Role:** Active conversation view (replaces ChatWindow in left panel when a chat is opened).

**Key features:**
- Chat header with back button, user/group info, online status
- Scrollable message list with:
  - Text messages, images, videos, file attachments
  - Emoji picker, voice recorder, file attachment button
  - Message edit/delete (context menu)
  - Read receipts (double checkmarks)
  - Sentiment indicators per message
  - Date separators
- Message input area with send button
- Real-time message delivery via Socket.IO

**Navigation:** Back button dispatches `setLeftComponent({ name: "chat" })` to return to ChatWindow.

---

### 5. FriendsPanel (`src/components/Friends/FriendsPanel.jsx`)

**Role:** Friends management panel (replaces ChatWindow in left panel).

**Sub-sections:**
1. **Header** — "Friends" title
2. **Tabs** — "Friends (N)" | "Requests" (with badge count)
3. **Friends list** — Each friend has avatar, name, online status, chat button, remove button
4. **Requests list** — Each request has avatar, name, accept/decline buttons

**Container:** `<Paper>` — full height, flex column, overflow hidden.

---

### 6. Redux Layout Slice (`src/utils/redux/layoutSlice.js`)

```javascript
initialState = {
  leftComponent:  { name: "chat", props: {} },   // ChatWindow by default
  rightComponent: { name: "map",  props: {} },    // MapWindow by default
}
```

**Actions:**
- `setLeftComponent({ name, props })` — swaps left panel
- `setRightComponent({ name, props })` — swaps right panel

**Transitions:**
- Default: `chat` (left) + `map` (right)
- Click a chat → `user-chat` (left) + `map` (right)
- Back from chat → `chat` (left) + `map` (right)
- Open friends → `friends` (left) + `map` (right)

---

## Loading & Error States

| State | What renders |
|---|---|
| Session loading / auth check | Two 50% skeleton boxes (ChatSkeleton + rounded Skeleton) |
| ChatWindow loading | `<ChatSkeleton />` (shimmer placeholder) |
| MapWindow loading | Spinner + "Loading map..." text |
| Chat loading | `<ChatSkeleton />` |
| FriendsPanel loading | `<CircularProgress />` centered |
| Offline | Full-screen overlay with blur backdrop, "No Internet Connection" message, pointer-events blocked on content |
| ChatWindow error | Red error text + "Retry" button (reloads page) |

---

## Current UI/UX Issues

### 1. Rigid 50/50 Split — Not Responsive
- The layout uses `w-1/2` (50%) for both panels on ALL screen sizes.
- On tablet/medium screens (768px–1024px), both panels are cramped.
- On mobile, this is unusable — two half-width panels side by side is far too narrow.
- No breakpoint handling; no stacking on mobile.

### 2. No Mobile-First Design
- The home page has zero mobile adaptations.
- There is no panel switcher/toggle for small screens.
- The map and chat are both squished into half the viewport width.
- AppShell sidebar is hidden on mobile, but the main content doesn't adapt.

### 3. No Resizable Panels
- Users cannot resize the chat vs. map split.
- Some users may want 70% map / 30% chat, or vice versa.
- No drag handle or resize affordance exists.

### 4. Missing Page-Level Header Context
- The AppShell page header ("Home — Chat with users and explore the map") takes up vertical space but adds no actionable value.
- On this page, users already know what they're doing — the header is wasted space.

### 5. Chat-to-Map Disconnection
- The chat panel and map panel don't interact.
- Clicking a nearby user on the map could open their chat, but this flow requires multiple clicks.
- There's no visual connection between a chat user and their map location.

### 6. No Quick-Switch Between Panels (Mobile)
- When a user opens a chat (`user-chat`), the map is still visible but the chat takes only half the screen.
- On mobile, the active chat should take full width, with a way to toggle back to the map.

### 7. Offline Overlay Uses Emoji
- The offline overlay uses a `📡` emoji which may render differently across devices.
- Should use an MUI icon for consistency.

### 8. No Empty State for Map
- If location permissions are denied, the map shows an error but the UX is not graceful.
- No fallback illustration or helpful guidance.

### 9. Gap Between Panels
- `gap-3` (12px) between panels is small but creates a visual "seam" with no purpose.
- Could be replaced with a draggable divider or removed entirely.

### 10. Loading Skeleton Mismatch
- The page-level loading skeleton shows two 50% boxes, but doesn't match the actual component shapes.
- ChatSkeleton is used for the left, but a plain rounded Skeleton for the right (doesn't resemble a map).

---

## UI/UX Improvement Suggestions

### Layout Suggestion 1: Responsive Split Panel with Resizable Divider

**Concept:** Keep the two-panel layout but make it adaptive and user-controllable.

```
┌─────────────────────────────────────────────────────┐
│ AppBar (search, notifications, user)                │
├──────────────────────┬──┬───────────────────────────┤
│                      │░░│                           │
│   Chat Panel         │░░│   Map Panel               │
│   (default 40%)      │░░│   (default 60%)           │
│                      │░░│                           │
│   - Chat list        │░░│   - Leaflet map           │
│   - or Active chat   │░░│   - Nearby users overlay  │
│   - or Friends       │░░│   - Controls              │
│                      │░░│                           │
└──────────────────────┴──┴───────────────────────────┘
         ░░ = draggable resize handle
```

**Key changes:**
- Default split: 40% chat / 60% map (map deserves more space)
- Draggable divider (use `react-resizable-panels` or `allotment` library)
- Min/max constraints: chat min 300px, map min 400px
- On double-click divider: reset to default split
- Save user's preferred split ratio in localStorage

**Mobile (< 768px):**
```
┌─────────────────────────┐
│ AppBar                  │
├─────────────────────────┤
│                         │
│   Full-width panel      │
│   (Chat OR Map)         │
│                         │
├─────────────────────────┤
│  [💬 Chat] [🗺️ Map]    │  ← Bottom tab bar / toggle
└─────────────────────────┘
```
- Only one panel visible at a time
- Bottom floating toggle bar to switch between Chat and Map
- Smooth slide animation between panels

---

### Layout Suggestion 2: Map-Dominant with Floating Chat Overlay

**Concept:** The map takes the full content area, and the chat floats on top as a collapsible panel.

```
┌─────────────────────────────────────────────────────┐
│ AppBar                                              │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐                                   │
│  │ Chat Panel   │                                   │
│  │ (floating)   │         Full-Width Map             │
│  │              │                                   │
│  │ - Chat list  │         - Leaflet interactive map │
│  │ - 380px wide │         - User markers            │
│  │ - Rounded    │         - Radius circle           │
│  │ - Shadow     │                                   │
│  │              │                                   │
│  │ [collapse ▼] │                                   │
│  └──────────────┘                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key changes:**
- Map always visible as the full background — feels immersive and spatial
- Chat panel floats on the left with a subtle shadow and rounded corners
- Chat panel is collapsible (minimize to just a floating chat icon)
- When collapsed, show unread count badge on the floating icon
- Chat panel width: 360–400px fixed
- When a chat is opened (`user-chat`), the panel expands slightly or slides to show the conversation

**Pros:** Maximizes map visibility, feels modern (like Google Maps with side panel), the spatial context is always visible.
**Cons:** Chat can overlap important map areas; need careful z-index management.

**Mobile:** Chat becomes a bottom sheet (slide up from bottom), map takes full screen behind it.

---

### Layout Suggestion 3: Tabbed Full-Width Panels

**Concept:** Remove the split entirely. Show one panel at full width at a time.

```
┌─────────────────────────────────────────────────────┐
│ AppBar                                              │
├─────────────────────────────────────────────────────┤
│ [🗺️ Map]  [💬 Chats]  [👥 Friends]     ← Tab bar  │
├─────────────────────────────────────────────────────┤
│                                                     │
│         Full-width active panel                     │
│         (Map / ChatWindow / FriendsPanel)           │
│                                                     │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key changes:**
- Top tabs or segmented control to switch panels
- Each panel gets the full width — no cramping
- Map gets full width (much more usable)
- Chat list and chat conversation each get full width
- Smooth crossfade or slide transition between tabs

**Pros:** Simplest to implement, great on all screen sizes, each panel has maximum space.
**Cons:** Loses the "chat while viewing map" simultaneous experience.

**Hybrid approach:** On large screens (> 1440px), show the split; on smaller screens, use tabs.

---

### Layout Suggestion 4: Three-Column Layout (Desktop) with Smart Collapse

**Concept:** Add a third column for contextual information.

```
Desktop (≥1280px):
┌────────────┬─────────────────────────┬──────────────┐
│ Chat List  │                         │ Context      │
│ (280px)    │    Map (flex-grow)      │ Panel        │
│            │                         │ (280px)      │
│ - Search   │    - Full interactive   │              │
│ - Tabs     │      Leaflet map       │ - User info  │
│ - Chats    │    - Nearby markers    │ - Weather    │
│ - Groups   │    - Controls          │ - Quick      │
│ - Contacts │                         │   actions    │
│            │                         │ - Nearby     │
│            │                         │   users list │
└────────────┴─────────────────────────┴──────────────┘

Tablet (768–1279px):
┌────────────┬────────────────────────────────────────┐
│ Chat List  │                                        │
│ (280px)    │         Map (full remaining)            │
│            │                                        │
└────────────┴────────────────────────────────────────┘

Mobile (<768px):
┌────────────────────────────────────────┐
│  Full-width single panel               │
│  + bottom toggle bar                   │
└────────────────────────────────────────┘
```

**Key changes:**
- Three columns on large screens: chat list, map, context panel
- Context panel shows: selected user info, weather widget, nearby users list, quick actions
- When a chat is opened, the chat list column transitions to the active conversation
- Middle column (map) is always visible on desktop
- On tablet, the context panel collapses into the map (as floating controls)
- On mobile, single panel with toggle

**Pros:** Maximum information density on large screens, great for power users, keeps map always visible.
**Cons:** More complex to implement, may feel overwhelming for casual users.

---

### Layout Suggestion 5 (Recommended): Adaptive Split with Integrated Interactions

**Concept:** Enhanced version of the current layout with proper responsiveness, panel interactions, and polish.

```
Desktop (≥1024px):
┌──────────────────────────┬──────────────────────────────┐
│ Left Panel (40%)         │ Right Panel (60%)            │
│ ┌──────────────────────┐ │ ┌──────────────────────────┐ │
│ │ Panel Header         │ │ │ Map                      │ │
│ │ [Chats ▼] [Friends]  │ │ │                          │ │
│ │ ────────────────────  │ │ │  Interactive Leaflet     │ │
│ │ Search...             │ │ │                          │ │
│ │ ────────────────────  │ │ │  Click user marker →     │ │
│ │ Chat List / Active    │ │ │  highlights in chat list │ │
│ │ Chat / Friends        │ │ │                          │ │
│ │                       │ │ │  [Nearby Users Drawer →] │ │
│ │                       │ │ │                          │ │
│ └──────────────────────┘ │ └──────────────────────────┘ │
└──────────────────────────┴──────────────────────────────┘

Tablet (768–1023px):
┌─────────────────────┬────────────────────────────────┐
│ Left Panel (35%)    │ Right Panel (65%)              │
│ (compact mode)      │ (map)                          │
└─────────────────────┴────────────────────────────────┘

Mobile (<768px):
┌──────────────────────────────────────┐
│  Active panel (full width)           │
│                                      │
│  Swipe left/right to switch panels   │
│                                      │
├──────────────────────────────────────┤
│  [💬]  [🗺️]  [👥]  ← bottom bar    │
└──────────────────────────────────────┘
```

**Detailed changes:**

1. **Responsive breakpoints:**
   - `≥1024px` — Side-by-side 40/60 split
   - `768–1023px` — Side-by-side 35/65 split (compact left panel)
   - `<768px` — Single panel with bottom navigation bar

2. **Panel interaction:**
   - Clicking a user on the map highlights their chat in the list (and vice versa)
   - Clicking a nearby user on the map auto-opens their chat
   - Active chat user's location is highlighted on the map with a special marker

3. **Smooth transitions:**
   - Use `framer-motion` or CSS transitions for panel swaps
   - Chat list → Active chat: slide-left animation
   - Active chat → Chat list: slide-right animation (back)

4. **Bottom navigation (mobile):**
   - Three icons: Chat, Map, Friends
   - Badge on Chat icon for unread count
   - Badge on Friends icon for pending requests
   - Active icon highlighted with primary color

5. **Quick-access floating action button (FAB):**
   - On mobile map view: floating chat button in bottom-right
   - Shows unread count badge
   - On tap: switches to chat panel

6. **Improved offline UX:**
   - Replace emoji with `<WifiOffIcon />` from MUI
   - Add a "Retry" button that checks `navigator.onLine`
   - Show a subtle top banner instead of full-screen overlay (less disruptive)

7. **Loading improvements:**
   - Match skeleton shapes to actual components
   - Add subtle shimmer animation
   - Show progress indicator in AppBar during data loading

---

### Additional UI Polish Suggestions

| Area | Current | Suggested |
|---|---|---|
| Panel gap | `gap-3` (12px) hard gap | 1px divider line or no gap with subtle border |
| Chat panel border | `Paper variant="outlined"` | `Paper elevation={0}` with left border accent |
| Page header | Shows "Home" with description | Hide on `/home` (content is self-explanatory) or make it collapsible |
| Map controls | Floating inside map | Group into a clean toolbar at top of map panel |
| Empty states | Plain text | Add illustrations (undraw.co style SVGs) |
| Search in AppBar | Non-functional placeholder | Connect to global search (search users, messages, locations) |
| Keyboard shortcuts | ⌘K badge shown but no handler | Implement command palette (search chats, users, navigate) |
| Unread indicators | Small chip in chat list | Also show total unread count in sidebar "Home" nav item |
| Dark mode map | Same tile layer | Switch to dark tile layer (CartoDB Dark Matter) automatically |

---

### Recommended Libraries for Implementation

| Feature | Library | Purpose |
|---|---|---|
| Resizable panels | `react-resizable-panels` | Drag-to-resize split panels |
| Animations | `framer-motion` | Panel transitions, list animations |
| Bottom sheet (mobile) | `react-spring-bottom-sheet` | Mobile chat overlay on map |
| Swipe gestures | `react-swipeable` | Swipe between panels on mobile |
| Command palette | `cmdk` | ⌘K global search/command menu |
| Virtual list | `@tanstack/react-virtual` | Performance for large chat lists |

---

### Priority Implementation Order

1. **P0 — Mobile responsiveness:** Add breakpoint handling, single-panel mode with toggle for mobile
2. **P0 — Adjust default split:** Change from 50/50 to 40/60 (chat/map)
3. **P1 — Panel resize:** Add draggable divider between panels
4. **P1 — Panel transitions:** Animate chat list ↔ active chat transitions
5. **P2 — Map-chat interaction:** Click map user → open chat; active chat → highlight on map
6. **P2 — Offline UX:** Replace emoji overlay with MUI icon + top banner approach
7. **P3 — Command palette:** Implement ⌘K search
8. **P3 — Empty state illustrations:** Add SVG illustrations for empty states
