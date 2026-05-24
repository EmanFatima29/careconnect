# CareConnect — Full System Context

> **Purpose**: Comprehensive system reference for AI context. Covers architecture, data models, APIs, components, state management, auth flows, and file structure.
>
> **Last updated**: March 27, 2026

---

## 1. Architecture Overview

**CareConnect** is a full-stack real-time medical chat application for medical communities. Users discover nearby patients on an interactive map, chat in real-time, manage prescriptions, and view analytics.

### Tech Stack

| Layer                | Technology                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Frontend**         | Next.js 15 (App Router, Turbopack), React 19, MUI v7, Tailwind CSS 3, Redux Toolkit |
| **Backend**          | Express.js (ES Modules), Mongoose/MongoDB 7, Socket.IO 4                            |
| **Auth**             | NextAuth v4 (JWT strategy) — Credentials + Google + Facebook, email verification, account lockout, token blacklist |
| **Real-time**        | Socket.IO (websocket + polling fallback)                                            |
| **Charts**           | Recharts 3                                                                          |
| **Maps**             | Leaflet + react-leaflet (OpenStreetMap tiles)                                       |
| **Forms**            | react-hook-form, Zod (server-side validation)                                       |
| **Containerization** | Docker Compose (mongo:7 + Express + Next.js standalone)                             |

### Deployment Topology

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│  Next.js     │────▶│  Express API │────▶│  MongoDB  │
│  Client:3000 │◀───▶│  Server:8080 │◀───▶│  :27017   │
│  (App Router)│     │  (Socket.IO) │     │           │
└─────────────┘     └──────────────┘     └───────────┘
```

- Client communicates with server via REST (axios) and Socket.IO
- NextAuth on the client calls server's `/api/users/email/:email` with `x-api-key` for credential verification
- All REST calls go through an axios instance with auto-attached NextAuth JWT

---

## 2. Project Structure

```
map_and_chat/
├── docker-compose.yml          # Mongo + Server + Client containers
├── client/                     # Next.js 15 frontend
│   ├── middleware.js            # Route protection (NextAuth withAuth)
│   ├── next.config.mjs          # Images, headers, redirects, standalone output
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   │   ├── layout.js        # Root layout (Server Component, Geist fonts, metadata)
│   │   │   ├── Providers.jsx    # Client providers: Session → Redux → Theme → MUI → Notistack → AppShell
│   │   │   ├── page.js          # Root "/" — redirected to /home via next.config
│   │   │   ├── home/page.js     # Chat + Map dual-panel
│   │   │   ├── login/page.js    # Credentials + OAuth login
│   │   │   ├── signup/page.js   # Registration
│   │   │   ├── dashboard/page.js # Role-based dashboard (patient/admin)
│   │   │   ├── analytics/page.js # Charts + admin analytics
│   │   │   ├── prescriptions/page.js    # Prescription CRUD
│   │   │   ├── groups/page.js   # Group management
│   │   │   ├── monitoring/page.js # Ward monitoring with image upload
│   │   │   ├── profile/page.js  # User profile view/edit
│   │   │   ├── settings/page.js # Preferences (notifications, theme, privacy)
│   │   │   ├── help/page.js     # FAQ + help categories
│   │   │   ├── calendar/page.js # Monthly calendar with events
│   │   │   ├── logout/page.js   # Logout confirmation
│   │   │   ├── admin/
│   │   │   │   ├── users/page.js # User management (admin only)
│   │   │   │   └── logs/page.js  # Activity logs (admin only)
│   │   │   └── api/auth/[...nextauth]/route.js  # NextAuth API route
│   │   ├── components/
│   │   │   ├── AppShell.jsx     # Layout shell: sidebar drawer + header + footer
│   │   │   ├── SidebarNav.jsx   # Role-based navigation links
│   │   │   ├── SearchBar.jsx    # Global user search
│   │   │   ├── Header.jsx       # Top bar with theme toggle
│   │   │   ├── Footer.jsx       # Social links footer
│   │   │   ├── LogOut.jsx       # Logout handler (redirect or inline dialog)
│   │   │   ├── RoleGuard.jsx    # Client-side admin route guard
│   │   │   ├── Spinner.jsx      # Loading spinner
│   │   │   ├── Chat/
│   │   │   │   ├── Chat.jsx     # Full chat interface (930 lines)
│   │   │   │   ├── ChatCard.jsx # Chat list item
│   │   │   │   └── ChatWindow.jsx # Active conversation (567 lines)
│   │   │   ├── Map/
│   │   │   │   ├── Map.jsx      # Full Leaflet map (1318 lines)
│   │   │   │   ├── MapWindow.jsx # Map wrapper with geolocation
│   │   │   │   └── nearByUsersComponent.jsx # Nearby users panel
│   │   │   ├── Groups/
│   │   │   │   ├── GroupCard.jsx
│   │   │   │   ├── GroupDetailModal.jsx
│   │   │   │   └── GroupModal.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── index.js       # Barrel export (11 widgets)
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   ├── ActivityFeed.jsx
│   │   │   │   ├── QuickActions.jsx
│   │   │   │   ├── WeatherCard.jsx
│   │   │   │   ├── CropHealthChart.jsx
│   │   │   │   ├── AlertsPanel.jsx
│   │   │   │   ├── UpcomingTasks.jsx
│   │   │   │   ├── ReminderCard.jsx
│   │   │   │   ├── ProgressRing.jsx
│   │   │   │   ├── ItemList.jsx
│   │   │   │   └── TimeTracker.jsx
│   │   │   ├── UI/
│   │   │   │   └── StyledComponents.jsx # Reusable styled MUI components (502 lines)
│   │   │   └── Weather/
│   │   │       └── WeatherWidget.jsx
│   │   ├── lib/
│   │   │   ├── api.js           # Axios instance with NextAuth interceptor
│   │   │   ├── adminApi.js      # Admin REST endpoints
│   │   │   ├── analyticsApi.js  # Analytics REST endpoints
│   │   │   ├── cropsApi.js      # Prescription REST endpoints
│   │   │   ├── socket.js        # Socket.IO client + error recovery
│   │   │   ├── socketAnalytics.js # Analytics socket listeners
│   │   │   └── functions.js     # Haversine distance, date formatting
│   │   ├── theme/
│   │   │   ├── muiTheme.js      # createMuiTheme(mode) — 705 lines, medicine palette
│   │   │   └── MuiThemeRegistry.jsx # MUI + Next.js 15 Emotion cache
│   │   └── utils/
│   │       ├── auth.js          # isTokenExpired (jose JWT decode)
│   │       ├── errorHandler.js  # Error categorization, retry, timeout
│   │       ├── notificationHandler.js # Toast + pub/sub notification system
│   │       ├── socketNotificationHandler.js # Socket event → notification mapping
│   │       ├── roleUtils.js     # inferRole, isAdmin, isFarmer, coerceRoles
│   │       ├── ThemeContext.js   # Dark/light mode context + localStorage + cross-tab sync
│   │       ├── themeUtils.js    # Design tokens, animation helpers (486 lines)
│   │       ├── hooks/
│   │       │   ├── useSocket.js  # Central socket management hook (282 lines)
│   │       │   └── hooks.js      # useTruncateMessage
│   │       └── redux/
│   │           ├── store.js      # 10 slices
│   │           ├── layoutSlice.js
│   │           ├── userSlice.js
│   │           ├── chatSlice.js
│   │           ├── messageSlice.js
│   │           ├── groupSlice.js
│   │           ├── receiverSlice.js
│   │           ├── usersSlice.js
│   │           ├── analyticsSlice.js
│   │           ├── cropSlice.js
│   │           ├── adminSlice.js
│   │           └── thunks/
│   │               ├── userThunks.js
│   │               ├── chatThunks.js
│   │               ├── messageThunks.js
│   │               ├── locationGroupThunks.js
│   │               ├── cropThunks.js
│   │               └── adminThunks.js
│
├── server/                      # Express.js backend
│   ├── index.js                 # Entry point: middleware chain, routes, Socket.IO, graceful shutdown
│   ├── lib/
│   │   ├── db.js                # Mongoose connection helper
│   │   ├── socketHandler.js     # Main socket events (chat, typing, location, groups)
│   │   └── socketAnalyticsHandler.js # Analytics socket events
│   ├── src/
│   │   ├── models/
│   │   │   ├── userModel.js
│   │   │   ├── chatModel.js
│   │   │   ├── messageModel.js
│   │   │   ├── groupModel.js
│   │   │   ├── cropModel.js
│   │   │   └── activityLogModel.js
│   │   ├── controllers/
│   │   │   ├── userController.js
│   │   │   ├── chatController.js
│   │   │   ├── messageController.js
│   │   │   ├── groupController.js
│   │   │   ├── locationController.js
│   │   │   ├── cropController.js
│   │   │   ├── adminController.js
│   │   │   └── analyticsController.js
│   │   ├── routes/
│   │   │   ├── userRoutes.js     # /api/users
│   │   │   ├── chatRoutes.js     # /api/chats
│   │   │   ├── messageRoutes.js  # /api/messages
│   │   │   ├── groupRoutes.js    # /api/groups
│   │   │   ├── locationRoutes.js # /api/location
│   │   │   ├── cropRoutes.js     # /api/prescriptions
│   │   │   ├── adminRoutes.js    # /api/admin
│   │   │   └── analyticsRoutes.js # /api/analytics
│   │   ├── middleware/
│   │   │   ├── auth.js           # authenticate/requireAuth + requireAdmin
│   │   │   ├── errorHandler.js   # Global error handler + asyncHandler
│   │   │   ├── rateLimiter.js    # In-memory rate limiting
│   │   │   └── requestLogger.js  # JSONL request logger with redaction
│   │   └── services/
│   │       ├── activityLogService.js  # logActivity (best-effort)
│   │       └── locationService.js     # Location sharing, $nearSphere queries
│   ├── utility/
│   │   └── auth.js              # hashPassword (bcrypt)
│   ├── utils/
│   │   └── responseHandler.js   # sendSuccess, sendError, sendNotFound, etc.
│   └── sample-data/
│       ├── seed-db.js           # Full database seeder (8 users, 3 groups, 6 chats, 27 messages, 12 prescriptions, 18 logs)
│       └── SEED-GUIDE.md
│
└── v0_template/                 # Reference UI template (shadcn/ui + Tailwind v4)
    └── (design reference only, not deployed)
```

---

## 3. Data Models

### 3.1 User

| Ward                        | Type                                                          | Constraints                                              |
| ---------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `name`                       | String                                                        | **required**, **unique**                                 |
| `email`                      | String                                                        | **required**, **unique**, lowercase                      |
| `password`                   | String                                                        | required if no socialAccounts                            |
| `phone`                      | String                                                        | default: null                                            |
| `status`                     | String                                                        | enum: `online`, `offline` — default: `offline`           |
| `roles`                      | String                                                        | enum: `user`, `admin`, `superadmin` — default: `user`    |
| `account`                    | String                                                        | enum: `active`, `locked`, `blocked` — default: `active`  |
| `profilePic`                 | String                                                        | default: null                                            |
| `bio`                        | String                                                        | —                                                        |
| `gender`                     | String                                                        | enum: `male`, `female`, `other`                          |
| `age`                        | Number                                                        | —                                                        |
| `dob`                        | Date                                                          | —                                                        |
| `interests`                  | String                                                        | —                                                        |
| `education`                  | String                                                        | —                                                        |
| `address`                    | Object                                                        | `{ street, city, state, country, zipCode }`              |
| `location.type`              | String                                                        | `"Point"` (GeoJSON)                                      |
| `location.coordinates`       | [Number]                                                      | `[longitude, latitude]` — default: `[0, 0]`              |
| `location.lastSeen`          | Date                                                          | —                                                        |
| `userType`                   | String                                                        | enum: `friend`, `admin`, `groupMember`, `unknown`        |
| `accountType`                | String                                                        | enum: `private`, `limited`, `public` — default: `public` |
| `socialAccounts`             | Array                                                         | OAuth provider data                                      |
| `friends`                    | [ObjectId → User]                                             | —                                                        |
| `friendRequests`             | [{sender: ObjectId, status: `pending`/`accepted`/`declined`}] | —                                                        |
| `chatHistory`                | [ObjectId → User]                                             | —                                                        |
| `chats`                      | [ObjectId → Chat]                                             | —                                                        |
| `groups`                     | [ObjectId → Group]                                            | —                                                        |
| `prescriptions`                      | [ObjectId → Prescription]                                             | —                                                        |
| `settings.chatNotifications` | Boolean                                                       | default: true                                            |
| `settings.showReadReceipts`  | Boolean                                                       | default: true                                            |
| `settings.allowMessagesFrom` | String                                                        | enum: `everyone`, `friends`, `selected`, `no one`        |
| `settings.locationSharing`   | Boolean                                                       | default: false                                           |
| `settings.visibleRange`      | Number                                                        | default: 1000 (meters)                                   |
| `settings.theme`             | String                                                        | `light` / `dark`                                         |
| `joined`                     | Date                                                          | —                                                        |
| `lastLogin`                  | Date                                                          | —                                                        |
| `lastSeen`                   | Date                                                          | —                                                        |

**Timestamps**: `createdAt`, `updatedAt` (auto)

**Indexes**: `2dsphere` on `location.coordinates`, `status`, `roles`, `settings.locationSharing`, plus implicit unique on `email` and `name`

### 3.2 Chat

| Ward            | Type                 | Constraints            |
| ---------------- | -------------------- | ---------------------- |
| `participants`   | [ObjectId → User]    | **required**           |
| `isGroup`        | Boolean              | default: false         |
| `lastMessage`    | ObjectId → Message   | —                      |
| `unreadMessages` | Map<String, Number>  | per-user unread counts |
| `messages`       | [ObjectId → Message] | —                      |

**Indexes**: `{ participants: 1, updatedAt: -1 }`, `{ participants: 1, isGroup: 1 }`

### 3.3 Message

| Ward         | Type               | Constraints                                                       |
| ------------- | ------------------ | ----------------------------------------------------------------- |
| `chatId`      | ObjectId → Chat    | **required**                                                      |
| `senderId`    | ObjectId → User    | **required**                                                      |
| `receiverIds` | [ObjectId → User]  | —                                                                 |
| `content`     | String             | trim                                                              |
| `messageType` | String             | enum: `text`, `voice`, `image`, `video`, `file` — default: `text` |
| `fileUrl`     | String             | —                                                                 |
| `status`      | String             | enum: `sent`, `delivered`, `seen`, `failed` — default: `sent`     |
| `readBy`      | [ObjectId → User]  | —                                                                 |
| `replyTo`     | ObjectId → Message | —                                                                 |
| `deletedFor`  | [ObjectId → User]  | soft-delete                                                       |
| `edited`      | Boolean            | default: false                                                    |
| `editedAt`    | Date               | —                                                                 |

**Indexes**: `{ chatId: 1, createdAt: 1 }`, `{ senderId: 1, createdAt: -1 }`, `{ chatId: 1, status: 1 }`

### 3.4 Group

| Ward       | Type              | Constraints  |
| ----------- | ----------------- | ------------ |
| `name`      | String            | **required** |
| `pic`       | String            | —            |
| `bio`       | String            | —            |
| `createdBy` | ObjectId → User   | —            |
| `admins`    | [ObjectId → User] | —            |
| `members`   | [ObjectId → User] | —            |

### 3.5 Prescription

| Ward         | Type            | Constraints                                                              |
| ------------- | --------------- | ------------------------------------------------------------------------ |
| `ownerId`     | ObjectId → User | **required**, indexed                                                    |
| `name`        | String          | **required**, maxlength: 120                                             |
| `dosage`     | String          | maxlength: 120                                                           |
| `area`        | Number          | min: 0                                                                   |
| `plantedDate` | Date            | —                                                                        |
| `status`      | String          | enum: `Prescribed`, `Active`, `Completed`, `Archived` — default: `Prescribed` |
| `notes`       | String          | maxlength: 2000                                                          |

**Index**: `{ ownerId: 1, createdAt: -1 }` (compound)

### 3.6 ActivityLog

| Ward        | Type            | Constraints                         |
| ------------ | --------------- | ----------------------------------- |
| `actorId`    | ObjectId → User | indexed                             |
| `actorEmail` | String          | —                                   |
| `action`     | String          | **required**, indexed               |
| `entityType` | String          | indexed                             |
| `entityId`   | ObjectId        | indexed                             |
| `status`     | String          | enum: `success`, `failed` — indexed |
| `ip`         | String          | —                                   |
| `userAgent`  | String          | —                                   |
| `metadata`   | Mixed           | —                                   |

**Only `createdAt`** timestamp (no updatedAt). Index: `{ createdAt: -1 }`

---

## 4. REST API Endpoints

### 4.1 Users — `/api/users`

| Method | Path              | Auth                    | Description                                           |
| ------ | ----------------- | ----------------------- | ----------------------------------------------------- |
| POST   | `/`               | Rate-limited            | Create user (signup)                                  |
| POST   | `/status-offline` | Rate-limited            | Set user offline (sendBeacon)                         |
| GET    | `/email/:email`   | Internal API key or JWT | Get user by email                                     |
| GET    | `/profile`        | JWT                     | Get current authenticated user                        |
| GET    | `/search`         | JWT                     | Search users by name/email/phone (regex, limit 10)    |
| GET    | `/name/:name`     | JWT                     | Get user by name                                      |
| GET    | `/phone/:phone`   | JWT                     | Get user by phone                                     |
| GET    | `/`               | JWT                     | Get all users                                         |
| GET    | `/id/:_id`        | JWT                     | Get user by ID                                        |
| PATCH  | `/me`             | JWT                     | Update current user                                   |
| PATCH  | `/:email`         | JWT                     | Update user by email (admin wards gated)             |
| DELETE | `/:_id`           | JWT + Admin             | Delete user (cascade: messages, chats, groups, prescriptions) |

### 4.2 Chats — `/api/chats`

All routes require JWT (`requireAuth`).

| Method | Path                  | Description                                 |
| ------ | --------------------- | ------------------------------------------- |
| POST   | `/`                   | Create chat (deduplicates 1:1)              |
| POST   | `/get-or-create-chat` | Find existing or create 1:1 chat            |
| POST   | `/:id/mark-read`      | Reset unread counter, mark messages as seen |
| GET    | `/`                   | Get authenticated user's chats (populated)  |
| GET    | `/:id`                | Get single chat by ID                       |
| DELETE | `/:id`                | Delete chat + cascade delete messages       |

### 4.3 Messages — `/api/messages`

All routes require JWT.

| Method | Path            | Description                                                             |
| ------ | --------------- | ----------------------------------------------------------------------- |
| POST   | `/`             | Create message (validates sender in chat, updates unread, emits socket) |
| GET    | `/chat/:chatId` | Get messages (cursor-based: `?limit=50&before=<messageId>`)             |
| PUT    | `/:id`          | Edit message (sender only, sets `edited: true`)                         |
| DELETE | `/:id`          | Soft-delete message (adds to `deletedFor`)                              |

### 4.4 Groups — `/api/groups`

All routes require JWT.

| Method | Path                 | Description                    |
| ------ | -------------------- | ------------------------------ |
| POST   | `/`                  | Create group (creator = admin) |
| POST   | `/exit`              | Leave group                    |
| POST   | `/addGroupToHistory` | Add group to user's groups     |
| GET    | `/`                  | Get all groups                 |
| GET    | `/name/:name`        | Get group by name              |
| GET    | `/:groupId`          | Get group by ID                |

### 4.5 Location — `/api/location`

All routes require JWT.

| Method | Path               | Description                                                           |
| ------ | ------------------ | --------------------------------------------------------------------- |
| POST   | `/start`           | Enable location sharing                                               |
| POST   | `/stop`            | Disable location sharing (resets coords to [0,0])                     |
| POST   | `/update`          | Update coordinates `{ userId, coordinates: [lng, lat] }`              |
| GET    | `/nearby`          | Get nearby users (`?radius=<meters>`, default 1000, uses $nearSphere) |
| GET    | `/history/:userId` | Get user's location data                                              |

### 4.6 Prescriptions — `/api/prescriptions`

All routes require JWT.

| Method | Path            | Description                                                       |
| ------ | --------------- | ----------------------------------------------------------------- |
| GET    | `/`             | List prescriptions (paginated, owner-scoped unless admin with `?userId=`) |
| GET    | `/user/:userId` | Get prescriptions by user (owner or admin)                                |
| GET    | `/:id`          | Get single prescription                                                   |
| POST   | `/`             | Create prescription (Zod validated)                                       |
| PATCH  | `/:id`          | Update prescription (Zod validated, owner or admin)                       |
| DELETE | `/:id`          | Delete prescription (owner or admin)                                      |

### 4.7 Admin — `/api/admin`

All routes require JWT + admin role.

| Method | Path             | Description                                                              |
| ------ | ---------------- | ------------------------------------------------------------------------ |
| GET    | `/stats/users`   | User statistics (total, by role/status, new in range, by day)            |
| GET    | `/stats/prescriptions`   | Prescription summaries (total, by status, area stats, top prescriptions)                 |
| GET    | `/stats/chats`   | Chat usage (totals, messages by day, top senders)                        |
| GET    | `/activity-logs` | Activity logs (paginated, filterable by action/entity/status/actor/date) |

### 4.8 Analytics — `/api/analytics`

Rate-limited (50 req/15min). Each endpoint requires JWT.

| Method | Path              | Description                                                             |
| ------ | ----------------- | ----------------------------------------------------------------------- | ------ |
| GET    | `/metrics`        | KPI: totalUsers, onlineUsers, messageCount, groupCount, sharingLocation |
| GET    | `/user-activity`  | Activity trend by day (`?days=7`)                                       |
| GET    | `/messages`       | Messages per day (`?days=7`)                                            |
| GET    | `/location-stats` | Users sharing location grouped by city (top 10)                         |
| GET    | `/groups`         | Groups ranked by member count                                           |
| GET    | `/export`         | Export as JSON or CSV (`?format=csv                                     | json`) |

### Health Endpoints (no auth)

| Method | Path      | Description                           |
| ------ | --------- | ------------------------------------- |
| GET    | `/health` | DB state, uptime, timestamp (200/503) |
| GET    | `/ready`  | `{ ready: true/false }`               |

---

## 5. Socket.IO Events

### 5.1 Main Events (`socketHandler.js`)

**Auth**: JWT verification from `handshake.auth.token` or `query.token`.

| Event (Client → Server)   | Server Behavior                                                            |
| ------------------------- | -------------------------------------------------------------------------- |
| `connection`              | Joins `user_<id>` room, sets online, broadcasts `user-online`              |
| `manual-disconnect`       | Sets offline, broadcasts `user-offline`                                    |
| `joinRoom`                | Joins room, emits `userJoined`                                             |
| `leaveRoom`               | Leaves room, emits `userLeft`                                              |
| `sendMessage`             | Validates wards, broadcasts `receiveMessage` to chat room                 |
| `Typing`                  | Forwards `typing` to chat room                                             |
| `Stop-typing`             | Forwards `stop-typing` to chat room                                        |
| `subscribe-to-nearby`     | Queries $near users, sends `nearby-users-update`, starts 30s poll interval |
| `unsubscribe-from-nearby` | Clears poll interval                                                       |
| `location-update`         | Updates DB coordinates, broadcasts `user-location-updated`                 |
| `group:create`            | Creates group in DB, notifies members with `group:created`                 |
| `group:update`            | Admin/creator check, updates group, emits `group:updated`                  |
| `disconnect`              | Clears intervals, sets offline, broadcasts `user-offline`                  |

### 5.2 Analytics Events (`socketAnalyticsHandler.js`)

| Client Event                       | Server Response Event       | Data                   |
| ---------------------------------- | --------------------------- | ---------------------- |
| `analytics:request-metrics`        | `analytics:metrics-updated` | KPI metrics            |
| `analytics:request-user-activity`  | `analytics:user-activity`   | Activity by day        |
| `analytics:request-message-stats`  | `analytics:message-stats`   | Messages by day        |
| `analytics:request-location-stats` | `analytics:location-stats`  | Location by city       |
| `analytics:request-group-stats`    | `analytics:group-stats`     | Groups by member count |

Errors emitted via `analytics:error`.

---

## 6. Redux State Shape

```javascript
{
  layout: {
    leftComponent: { name: "chat", props: {} },
    rightComponent: { name: "map", props: {} }
  },
  user: {
    currentUser: null | UserObject,
    allUsers: [],
    searchResults: [],
    loading: false,
    error: null,
    success: false
  },
  chat: {
    chats: [],
    currentChat: null | ChatObject,
    loading: false,
    error: null,
    success: false
  },
  message: {
    messages: [],
    hasMore: false,
    loading: false,
    error: null,
    success: false
  },
  group: {
    groups: [],
    selectedGroup: null,
    userLocation: { latitude, longitude, timestamp, accuracy },
    nearbyUsers: [],
    locationHistory: [],
    loading: false,
    error: null,
    success: false
  },
  receiver: {
    currentReceiver: ""
  },
  users: {
    usersData: []
  },
  analytics: {
    metrics: { totalUsers, onlineUsers, messageCount, groupCount, sharingLocation },
    userActivity: [],
    messageStats: [],
    locationStats: [],
    groupStats: [],
    loading: false,
    error: null,
    lastUpdated: null
  },
  prescription: {
    prescriptions: [],
    currentCrop: null,
    loading: false,
    error: null,
    success: false
  },
  admin: {
    userStats: null,
    cropStats: null,
    chatStats: null,
    activityLogs: { items: [], page: 1, limit: 20, total: 0 },
    users: [],
    loading: false,
    error: null,
    lastUpdated: null
  }
}
```

### Key Thunks → API Mapping

| Thunk                  | API Call                                                |
| ---------------------- | ------------------------------------------------------- |
| `fetchCurrentUser`     | `GET /api/users/profile`                                |
| `fetchUserByEmail`     | `GET /api/users/email/:email`                           |
| `searchUsers`          | `GET /api/users/search?query=`                          |
| `updateUserProfile`    | `PATCH /api/users/:email`                               |
| `signupUser`           | `POST /api/users`                                       |
| `setUserOffline`       | `POST /api/users/status-offline`                        |
| `fetchAllUsers`        | `GET /api/users`                                        |
| `fetchChats`           | `GET /api/chats`                                        |
| `createChat`           | `POST /api/chats`                                       |
| `getOrCreateChat`      | `POST /api/chats/get-or-create-chat`                    |
| `markChatRead`         | `POST /api/chats/:id/mark-read`                         |
| `deleteChat`           | `DELETE /api/chats/:id`                                 |
| `fetchMessages`        | `GET /api/messages/chat/:chatId?limit=&before=`         |
| `createMessage`        | `POST /api/messages`                                    |
| `editMessage`          | `PUT /api/messages/:id`                                 |
| `deleteMessage`        | `DELETE /api/messages/:id`                              |
| `fetchGroups`          | `GET /api/groups`                                       |
| `createGroup`          | `POST /api/groups`                                      |
| `fetchNearbyUsers`     | `GET /api/location/nearby?latitude=&longitude=&radius=` |
| `updateUserLocation`   | `POST /api/location/update`                             |
| `startLocationSharing` | `POST /api/location/start`                              |
| `stopLocationSharing`  | `POST /api/location/stop`                               |
| `fetchCrops`           | `GET /api/prescriptions`                                        |
| `createCrop`           | `POST /api/prescriptions`                                       |
| `updateCrop`           | `PATCH /api/prescriptions/:id`                                  |
| `deleteCrop`           | `DELETE /api/prescriptions/:id`                                 |
| `fetchUserStats`       | `GET /api/admin/stats/users`                            |
| `fetchCropStats`       | `GET /api/admin/stats/prescriptions`                            |
| `fetchChatStats`       | `GET /api/admin/stats/chats`                            |
| `fetchActivityLogs`    | `GET /api/admin/activity-logs`                          |
| `fetchAllUsersAdmin`   | `GET /api/users`                                        |
| `deleteUserAdmin`      | `DELETE /api/users/:id`                                 |
| `updateUserAdmin`      | `PATCH /api/users/:email`                               |

---

## 7. Authentication Flow

### 7.1 NextAuth Configuration

- **Strategy**: JWT (maxAge=30 days, updateAge=24h)
- **Providers**: Credentials (email/password with bcrypt), Google OAuth, Facebook OAuth
- **Custom pages**: `/login` (signIn), `/login` (error)

### 7.2 Auth Flow

1. **Credentials login**: Client calls `signIn("credentials", { email, password })`. NextAuth fetches user from Express via `GET /api/users/email/:email` with `x-api-key` header (returns password hash). Compares hashes with bcrypt.
2. **OAuth login**: After OAuth callback, `ensureBackendUserAndFetch()` creates user in Express backend (`POST /api/users`, ignoring 409 conflicts) then fetches canonical user data.
3. **JWT creation**: On sign-in, NextAuth creates a custom JWT containing `{ userId, email, roles }` signed with `NEXTAUTH_SECRET` (1h expiry). Stored as `accessToken` on the NextAuth JWT token.
4. **Token refresh**: On each request, if `accessToken` is missing or expires within 5 minutes, a new one is signed.
5. **Session shape**: `session.user = { id, email, roles, accessToken }`

### 7.3 Client-Side Auth Guards

- **Middleware** (`middleware.js`): Uses `next-auth/middleware` `withAuth`. Protects: `/home`, `/dashboard`, `/profile`, `/groups`, `/prescriptions`, `/monitoring`, `/analytics`, `/admin`, `/settings`, `/help`. Admin routes (`/admin/*`) require admin/superadmin role.
- **RoleGuard component**: Client-side redundancy for admin pages, redirects non-admins.

### 7.4 Server-Side Auth

- **`authenticate`/`requireAuth`**: Extracts JWT from `Authorization: Bearer` header or NextAuth session cookie. Sets `req.user = { email, userId, roles }`.
- **`requireAdmin`**: Checks `req.user.roles` for `admin` or `superadmin`.
- **`allowInternalOrAuthenticated`**: For NextAuth ↔ Express communication, accepts `x-api-key` header.

---

## 8. Role System

| Internal Role | Display Role | Access                                                                                              |
| ------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `user`        | Patient       | Dashboard, home (chat+map), prescriptions, monitoring, groups, analytics, profile, settings, help, calendar |
| `admin`       | Admin        | All patient routes + admin dashboard, user management, activity logs, system-wide analytics          |
| `superadmin`  | Admin        | Same as admin (treated identically in client via `inferRole()`)                                     |

**Key utility** (`roleUtils.js`):

- `inferRole(roles)` → `"admin"` or `"patient"` (maps `admin`/`superadmin` → `"admin"`, everything else → `"patient"`)
- `isAdmin(roles)` → boolean
- `isFarmer(roles)` → boolean

### Role-Based UI Differences

- **Sidebar**: Patient menu vs Admin menu (different nav items)
- **Dashboard** (`/dashboard`): Patient sees weather/prescriptions/tasks widgets, admin sees user stats/system metrics/activity logs/management links
- **Analytics** (`/analytics`): Admin gets additional "System-Wide Analytics" section (user growth, role distribution, message volume, prescription distribution)
- **Login redirect**: Admin → `/dashboard`, Patient → `/home`

---

## 9. Server Middleware Chain

Applied in order:

1. `helmet()` — Security headers (CSP, HSTS, etc.)
2. `compression()` — gzip/brotli
3. `cors()` — Origin whitelist, credentials: true
4. `express.json({ limit: "2mb" })` — Body parser
5. `cookieParser()` — Cookie parsing
6. `requestLogger` — JSONL logging with sensitive ward redaction (5MB rotation)
7. Route handlers
8. `errorHandler` — Global error handler (Mongoose/Zod/JWT errors → proper status codes)

### Rate Limiters (in-memory Map)

- `authRateLimiter`: 10 requests / 15 minutes (user routes)
- `analyticsRateLimiter`: 50 requests / 15 minutes
- `exportRateLimiter`: 5 requests / hour

---

## 10. Theme System

### Dark/Light Mode

- **ThemeContext** (`ThemeContext.js`): React context with `darkMode` state, `toggleDarkMode()`, localStorage persistence, `prefers-color-scheme` detection, cross-tab sync via storage events, Chrome-specific workaround
- **MUI Theme** (`muiTheme.js`): `createMuiTheme(mode)` function (705 lines). Medicine-themed:
  - Primary: green (#2E7D32), Secondary: brown (#8B5A2B)
  - Accent colors: wheat, soil, leaf, sun, earth, sky
  - Chart palette: 5-shade green gradient
  - Status colors: completed, inProgress, pending, online, offline
  - Component overrides: Button (gradient), Card (rounded 16px), TextField, AppBar, Drawer, Alert, Skeleton, Table
- **Registry** (`MuiThemeRegistry.jsx`): Hooks into `AppRouterCacheProvider` for Next.js 15 Emotion SSR + MUI ThemeProvider + CssBaseline

### Design Tokens (`themeUtils.js`, 486 lines)

Key exports:

- `THEME_CONSTANTS` — Colors, accents, typography, shadows, radii, transitions
- `createDashboardCardSx(index)` — Stagger entrance animation + hover scale for dashboard cards
- `createDarkCardSx(theme)` — Inverted dark card with green gradient header
- `CHART_TOOLTIP_STYLE` — Recharts tooltip styling
- `CHART_GRADIENT_ID`, `CHART_GRADIENT_STOPS` — Recharts gradient definitions
- `getScrollbarSx(theme)` — Custom scrollbar styles
- `fadeIn`, `slideUp` CSS keyframes

---

## 11. Key Components Reference

### AppShell (490 lines)

- Responsive layout: sidebar drawer (264px, permanent on `lg+`, temporary on mobile)
- Header: hamburger menu, search bar (⌘K badge on desktop), notification bell, dark mode toggle, user avatar
- Route metadata dict: maps pathname → `{ title, description }` for page headers
- Mobile: responsive padding, font sizes, hidden elements on `xs`

### Chat.jsx (930 lines)

- Dual-panel: contact list (left) + active chat (right, via `ChatWindow`)
- Socket integration: `joinRoom`, `sendMessage`, `receiveMessage`, `typing`, `stop-typing`, `user-online`, `user-offline`, `unread-updated`
- Features: user search → `getOrCreateChat`, unread badges, online status dots, typing indicators

### ChatWindow.jsx (567 lines)

- Message rendering with date group headers
- Real-time: receiving messages, typing indicators, read receipts
- Actions: reply-to, edit, delete (stubbed), emoji button (stubbed)
- Cursor-based pagination (scroll-to-load-more)

### Map.jsx (1318 lines)

- Leaflet with OpenStreetMap tiles
- Browser geolocation (`watchPosition`)
- Nearby users: $nearSphere query, 500m–10km radius slider
- User markers: avatar popup with name, status, distance, "Chat" button
- Settings drawer: auto-refresh toggle, interval, filters
- Location sharing start/stop

### Dashboard (`/dashboard`, 1014 lines)

- Role-based: patient vs admin view
- Patient widgets: StatsCards (4), ActivityFeed, QuickActions, WeatherCard, CropHealthChart, AlertsPanel, UpcomingTasks
- Admin widgets: User/Prescription/Chat/Log StatsCards, system charts, management quick links
- All widgets use `createDashboardCardSx(index)` for stagger animation

---

## 12. Utility Modules

### Error Handling (`errorHandler.js`)

- `handleFetchError(error, context)` — Categorizes: server (4xx/5xx), network, timeout
- `fetchWithTimeout(promise, ms)` — Race with AbortController
- `retryFetch(fn, retries, delay, context)` — Linear backoff retry
- `safeGet(data, path, default)` — Deep property accessor

### Notifications (`notificationHandler.js` + `socketNotificationHandler.js`)

- `createNotificationHooks(enqueueSnackbar)` → `{ notify, notifySuccess, notifyError, notifyWarning, notifyLoading }`
- `NotificationCenter` class — Pub/sub with `subscribe`, `emit`, `clear`, `getAll`
- `SocketNotificationManager` — Maps socket events → notification toasts
- `setupSocketEventHandlers(socket, notify)` — Auto-registers all socket event → notification handlers

### Socket (`useSocket.js` hook, 282 lines)

- Returns `{ isConnected, initializeSocket, on, emit, joinRoom, leaveRoom, cleanup, disconnect, socket }`
- Auto-attaches JWT auth, sets up analytics listeners, handles reconnection

---

## 13. Environment Variables

### Server

| Variable           | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `MONGODB_URI`      | MongoDB connection string                |
| `PORT`             | Server port (default: 8080)              |
| `NEXTAUTH_SECRET`  | JWT signing secret (shared with client)  |
| `ORIGIN_URL`       | Allowed CORS origin                      |
| `INTERNAL_API_KEY` | NextAuth ↔ Express server-to-server auth |

### Client

| Variable                   | Purpose                                 |
| -------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Express server URL                      |
| `NEXT_PUBLIC_SOCKET_URL`   | Socket.IO server URL                    |
| `NEXTAUTH_URL`             | NextAuth base URL                       |
| `NEXTAUTH_SECRET`          | JWT signing secret (shared with server) |
| `GOOGLE_CLIENT_ID`         | Google OAuth client ID                  |
| `GOOGLE_CLIENT_SECRET`     | Google OAuth secret                     |
| `FACEBOOK_CLIENT_ID`       | Facebook OAuth client ID                |
| `FACEBOOK_CLIENT_SECRET`   | Facebook OAuth secret                   |
| `INTERNAL_API_KEY`         | For server-to-server user verification  |

---

## 14. Database Seeding

Run: `node sample-data/seed-db.js` (from server directory, requires `.env` with `MONGODB_URI`).

Seeds:

- **8 users**: 1 superadmin, 1 admin, 6 regular users (all with hashed passwords)
- **3 groups**: With proper creator/admin/member references
- **6 chats**: 5 direct + 1 group with unread counts
- **27 messages**: Across chats with correct sender/receiver/status
- **12 prescriptions**: 2 per regular user
- **18 activity logs**: Varied actions and entity types

Clears all collections before inserting.

---

## 15. Known Technical Debt & Open Items

### Security Gaps

- Socket.IO auth allows unauthenticated connections (falls back gracefully but doesn't block)
- `setUserOffline` endpoint is public (no auth)
- `searchUser` passes input to regex (ReDoS risk)
- `getUserByEmail` with internal API key returns password hash
- No CSRF protection on state-changing requests
- Auth rate limiter defined but not applied to login/signup routes

### Code Quality

- Multiple dead/legacy files: `User.jsx`, `ChatHeader.jsx`, `MessageInput.jsx`, `Chat-old.jsx`, `Map-old.jsx`, `MapEnhanced.jsx`, etc.
- Map.jsx is 1318 lines — needs splitting into sub-components
- `userSlice` and `usersSlice` have overlapping responsibilities
- `receiverSlice` store key misspelled as `reciever` in some references
- 50+ debug `console.log` statements in production code
- `asyncHandler` defined but no controllers use it

### Missing Features

- Message media (image/video/file upload) — schema supports it, no implementation
- Emoji picker — button exists, non-functional
- Message deletion in UI — shows "coming soon"
- Group chat in Chat UI — no integration
- Profile picture upload — no cloud storage
- Forgot password flow — link exists, page doesn't
- Push notifications — no service worker
- Friend request system — schema has wards, no API/UI
