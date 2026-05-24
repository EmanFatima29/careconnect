# CareConnect — System Documentation

> **Project**: CareConnect — Location-Based Medical Communication Platform
> **Author**: Muhammad Usama Ijaz (2022-ag-7996)
> **Supervisor**: Dr. Syed Mushhad Mustuzhar Gilani
> **Version**: 3.0 | **Last Updated**: 2026-03-27

---

login:
1>super admin:
superadmin@careconnect.io
Demo@1234

2>admin:
admin@careconnect.io
Demo@1234

3>user:
alice.nguyen@example.com
Demo@1234

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Database Schema](#5-database-schema)
6. [State Management](#6-state-management)
7. [Real-Time Communication](#7-real-time-communication)
8. [Feature Modules](#8-feature-modules)
9. [Security Architecture](#9-security-architecture)
10. [Caching Strategy](#10-caching-strategy)
11. [Error Handling](#11-error-handling)
12. [File Upload Pipeline](#12-file-upload-pipeline)
13. [External Integrations](#13-external-integrations)
14. [Deployment Architecture](#14-deployment-architecture)

---

## 1. System Overview

**CareConnect** is a full-stack medical communication and prescription monitoring platform designed for medical ward operations. It enables patients, surveyors, and administrators to:

- **Discover nearby users** on an interactive map via GPS-based proximity search
- **Communicate** via real-time 1-on-1 and group chat with media sharing
- **Monitor prescription health** using AI-powered symptom analysis and diagnostic imagery (VITALS)
- **Track ward visits** with GPS-verified visit logging
- **Analyze operations** through comprehensive dashboards and sentiment analysis
- **Use voice** via Speech-to-Text and Text-to-Speech (ElevenLabs)

### Core Roles

| Role               | Primary Actions                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Patient (user)**  | Share location, chat with surveyors, upload prescription photos for symptom analysis, view prescription health |
| **Surveyor/Admin** | View patient locations, log ward visits, monitor prescription health trends, manage users               |
| **Superadmin**     | Full user management, analytics dashboards, system monitoring, activity audit                   |

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌──────────────────┐    HTTP/REST    ┌──────────────────┐    Mongoose    ┌──────────┐
│   Next.js 15     │ ◄────────────► │   Express.js     │ ◄───────────► │ MongoDB  │
│   Client (:3000) │                │   Server (:8080) │               └──────────┘
│                  │    Socket.IO   │                  │    ioredis    ┌──────────┐
│   React 19       │ ◄════════════► │   Socket.IO      │ ◄───────────► │  Redis   │
│   Redux Toolkit  │                │   Server         │               └──────────┘
│   NextAuth v4    │                │                  │    HTTP       ┌──────────┐
└──────────────────┘                │                  │ ◄───────────► │Cloudinary│
                                    │                  │               └──────────┘
                                    │                  │    HTTP       ┌──────────┐
                                    │                  │ ◄───────────► │Sentiment │
                                    │                  │               │ Python   │
                                    └──────────────────┘               │  (:5001) │
                                                                       └──────────┘
```

### 2.2 Monorepo Structure

```
map_and_chat/
├── client/                    # Next.js 15 frontend
│   ├── src/
│   │   ├── app/              # App Router pages (home, dashboard, monitoring, analytics, etc.)
│   │   ├── components/       # React components
│   │   │   ├── Chat/         # Chat, ChatWindow, VoiceRecorder, SentimentIndicator, LazyMedia
│   │   │   ├── Map/          # Map, MapWindow, RouteDisplay, MapSubComponents, mapUtils
│   │   │   ├── Dashboard/    # Admin dashboard widgets (SentimentWidget, index)
│   │   │   ├── Groups/       # GroupCard, GroupDetailModal, GroupModal
│   │   │   ├── Friends/      # FriendsPanel
│   │   │   ├── Weather/      # WeatherWidget
│   │   │   └── UI/           # ErrorBoundary, StyledComponents, NotificationSettings, NetworkBanner, PageSkeletons
│   │   ├── lib/              # api.js (axios + session cache), socket.js, chatCache.js, socketAnalytics.js,
│   │   │                     # pushNotifications.js, rateLimiter.js, logger.js
│   │   └── utils/
│   │       ├── redux/        # store.js, slices (user, chat, message, prescription, group, notification, etc.)
│   │       │   └── thunks/   # userThunks, chatThunks, messageThunks, cropThunks, friendThunks,
│   │       │                 # locationGroupThunks, adminThunks
│   │       ├── hooks/        # useSocket.js, useGlobalSocketNotifications.js, useNetwork.js
│   │       ├── socketNotificationHandler.js  # Socket event → toast + Redux notification wiring
│   │       ├── notificationHandler.js        # NotificationCenter class (event emitter)
│   │       ├── constants.js  # Centralized configuration constants
│   │       └── coordinates.js # GeoJSON ↔ frontend coordinate conversion
│   └── doc/                  # This documentation
├── server/                    # Express.js backend
│   ├── index.js              # Entry point — middleware chain, route registration, graceful shutdown
│   ├── lib/
│   │   ├── redis.js          # Redis client singleton (ioredis)
│   │   ├── socketHandler.js  # Socket.IO event handlers (auth, messaging, location, groups)
│   │   ├── socketAnalyticsHandler.js  # Socket analytics events
│   │   └── logger.js         # Structured logger
│   ├── src/
│   │   ├── controllers/      # userController, chatController, messageController, locationController,
│   │   │                     # monitoringController, visitController, mediaController, analyticsController
│   │   ├── middleware/        # auth, csrf, rateLimiter (Redis), upload (Cloudinary), errorHandler, requestLogger
│   │   ├── models/           # User, Chat, Message, Prescription, Group, Visit, Media, ActivityLog, PushSubscription
│   │   ├── routes/           # userRoutes, chatRoutes, messageRoutes, locationRoutes, cropRoutes,
│   │   │                     # groupRoutes, adminRoutes, analyticsRoutes, friendRoutes, notificationRoutes,
│   │   │                     # monitoringRoutes, mediaRoutes, visitRoutes, speechRoutes
│   │   └── services/         # emailService, locationService, mediaService, pushService,
│   │                         # sentimentService, diseaseDetectionService, satelliteService, elevenLabsService,
│   │                         # activityLogService, tokenBlacklist
│   └── sentiment/            # Python microservice (FastAPI)
│       ├── main.py           # Multilingual sentiment analysis API
│       ├── requirements.txt  # Python dependencies
│       └── setup.sh          # One-click setup script
```

### 2.3 Data Flow Patterns

**REST API Flow:**

```
Component → Redux Thunk → Axios (api.js with JWT + CSRF interceptors) → Express Route
  → authenticate middleware → rateLimiter → Controller → Service → MongoDB/Redis
```

**Real-Time Socket Flow:**

```
Component → useSocket hook → socket.emit() → Server socketHandler
  → JWT-verified socket.userId → Business Logic → MongoDB update → socket.emit/broadcast
```

**Local-First Data Flow (Chat & Messages):**

```
App Start → Restore from localStorage → Render immediately (warm startup)
  → Background sync via REST (incremental: ?since=timestamp) → Merge deltas → Update localStorage
```

---

## 3. Technology Stack

### Frontend

| Technology              | Version     | Purpose                                            |
| ----------------------- | ----------- | -------------------------------------------------- |
| Next.js                 | 15.x        | React framework with App Router, standalone output |
| React                   | 19.x        | UI library                                         |
| Redux Toolkit           | 2.6.x       | State management with createAsyncThunk             |
| MUI (Material UI)       | 7.x         | Component library                                  |
| Leaflet + react-leaflet | 1.9.x / 5.x | Interactive maps                                   |
| leaflet-routing-machine | 3.2.x       | Route display with OSRM                            |
| Socket.IO Client        | 4.8.x       | WebSocket real-time communication                  |
| Axios                   | 1.8.x       | HTTP client with interceptors                      |
| NextAuth                | 4.x         | Authentication (JWT strategy)                      |
| Recharts                | 3.7.x       | Data visualization charts                          |
| emoji-mart              | 5.x         | Emoji picker                                       |

### Backend

| Technology   | Version | Purpose                                  |
| ------------ | ------- | ---------------------------------------- |
| Express.js   | 4.21.x  | Web framework                            |
| Mongoose     | 8.12.x  | MongoDB ODM with GeoJSON support         |
| Socket.IO    | 4.8.x   | WebSocket server                         |
| ioredis      | 5.10.x  | Redis client (caching + rate limiting)   |
| jsonwebtoken | 9.x     | JWT signing/verification                 |
| Cloudinary   | 1.41.x  | Image/video CDN with responsive variants |
| Multer       | 2.x     | Multipart file upload handling           |
| Helmet       | 8.x     | Security headers                         |
| Zod          | 3.24.x  | Schema validation                        |
| Nodemailer   | 7.x     | Email delivery                           |
| web-push     | 3.6.x   | Web Push notifications                   |
| bcryptjs     | 3.x     | Password hashing (10 salt rounds)        |

### Infrastructure

| Service        | Purpose                                                          |
| -------------- | ---------------------------------------------------------------- |
| MongoDB        | Primary database with 2dsphere medical indexes                |
| Redis          | Rate limiting, chat/message caching, sentiment caching           |
| Cloudinary     | Media storage with responsive image/video transformations        |
| Python/FastAPI | Sentiment analysis microservice (spaCy + TextBlob, 15 languages) |

---

## 4. Authentication & Authorization

### 4.1 Auth Flow

```
1. User submits credentials (or OAuth redirect via Google/Facebook)
2. NextAuth checks account lockout (5 failed attempts → 15-min lock)
3. NextAuth checks email verification (credentials users must verify email)
4. NextAuth verifies credentials against Express backend (via INTERNAL_API_KEY)
5. On success: resets login attempts, creates JWT: { userId (MongoDB _id), email, roles }
6. On failure: increments login attempts, locks account after 5 failures
7. JWT stored in NextAuth session (cookie-based, 30-day maxAge, 1-hour JWT expiry)
8. Client attaches JWT as Bearer token via axios request interceptor (cached 60s)
9. Server checks token blacklist, then verifies JWT in `authenticate` middleware → sets req.user
10. Socket.IO verifies JWT in connection middleware → sets socket.userId
```

### 4.2 Email Verification

- Credentials signup generates a SHA-256 verification token (24-hour expiry)
- Verification email sent via Nodemailer (Ethereal fallback in dev)
- Client route `/api/auth/verify-email` proxies to backend and redirects to `/login?verified=true`
- Resend endpoint: `POST /api/users/resend-verification`
- OAuth users (Google/Facebook) are auto-verified on creation

### 4.3 Account Lockout

- Failed login attempts tracked in `loginAttempts` ward on User model
- After 5 consecutive failures → `lockUntil` set to 15 minutes from now
- Lock auto-expires: next login attempt after expiry resets the counter
- Internal endpoint `PATCH /internal/login-attempts/:email` (API-key protected)

### 4.4 Token Lifecycle

- **JWT expiry**: 1 hour
- **Auto-refresh**: NextAuth reissues when within 300 seconds of expiry
- **Token blacklist**: On logout, server adds token to in-memory blacklist (auto-cleaned on expiry)
- **Session cache**: Client caches `getSession()` results for 60 seconds to reduce overhead
- **Socket reconnect**: `useSocket` hook detects token change, force-reconnects
- **Offline token**: HMAC token per session for sendBeacon-based offline status updates

### 4.5 Password Policy

- Minimum 8 characters
- Must include: uppercase letter, lowercase letter, number, special character
- Enforced on: signup, password reset (both client-side and server-side validation)
- Regex: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/`

### 4.6 Role-Based Access

| Role         | Permissions                                                                         |
| ------------ | ----------------------------------------------------------------------------------- |
| `user`       | Chat, map, own prescriptions, own profile, own location history                             |
| `admin`      | All user perms + user management, all location histories, analytics, visit tracking |
| `superadmin` | All admin perms + user deletion, system configuration                               |

### 4.7 Middleware Stack

| Middleware                     | Purpose                                                             |
| ------------------------------ | ------------------------------------------------------------------- |
| `authenticate` / `requireAuth` | Check token blacklist, verify JWT or NextAuth session → sets `req.user` |
| `requireAdmin`                 | Check `roles` includes "admin" or "superadmin"                      |
| `allowInternalOrAuthenticated` | Accept JWT or `INTERNAL_API_KEY` header (for NextAuth server calls) |
| `csrfProtection`               | Double-submit cookie pattern, skips safe methods and sendBeacon     |
| `rateLimiter`                  | Redis-backed INCR+EXPIRE, fails open if Redis down                  |

---

## 5. Database Schema

### User

```
name (String, unique, required)
email (String, unique, lowercase, required)
password (String, bcrypt hash, nullable for social-only)
phone (String)
status ("online" | "offline")
roles ("user" | "admin" | "superadmin", default: "user")
location { type: "Point", coordinates: [lng, lat] }  ← 2dsphere index
profilePic { original, thumbnail, small, medium, large, cloudinaryId, mediaId }
settings { chatNotifications, showReadReceipts, locationSharing, visibleRange,
           allowMessagesFrom, theme, pushNotifications, groupNotifications, cropNotifications }
friends [→User], friendRequests [{ sender, status }]
chats [→Chat], groups [→Group], prescriptions [→Prescription]
address { street, city, state, country, zipCode }
gender, age, dob, relationship, workStatus, bio, interests, education
emailVerified (Boolean, default: false)
emailVerificationToken, emailVerificationExpires (24h)
loginAttempts (Number), lockUntil (Date) — account lockout
resetPasswordToken, resetPasswordExpires
account ("active" | "locked" | "blocked")
```

### Chat

```
participants [→User] (required)
isGroup (Boolean, default: false)
lastMessage (→Message)
unreadMessages (Map<userId, count>)
messages [→Message]
Indexes: participants+updatedAt, participants+isGroup
```

### Message

```
chatId (→Chat, required), senderId (→User, required), receiverIds [→User]
content (String), messageType ("text"|"image"|"video"|"audio"|"voice"|"file"|"document")
media { mediaId, cloudinaryId, mediaType, originalName, mimeType, size,
        urls: { original, thumbnail, small, medium, large }, dimensions, duration }
fileUrl (String, legacy compat)
status ("sent"|"delivered"|"seen"|"failed"), readBy [→User]
replyTo (→Message, validated same-chat), deletedFor [→User]
edited (Boolean), editedAt (Date)
sentiment { score: Number, label: "positive"|"negative"|"neutral", language: String }
Indexes: chatId+createdAt, senderId+createdAt, chatId+status
```

### Prescription

```
ownerId (→User, required, indexed), name (required), dosage, area (Number)
plantedDate (Date), status ("Prescribed"|"Active"|"Completed"|"Archived")
notes (String, max 2000)
location { type: "Point", coordinates: [lng, lat] }  ← 2dsphere index
polygon { type: "Polygon", coordinates: [[[Number]]] }
healthHistory [{ date, vitals, healthStatus, diseaseDetected, confidence, recommendations, source }]
currentHealth { status, lastChecked, vitals }
```

### Visit

```
visitorId (→User, required), farmerId (→User, required), cropId (→Prescription, nullable)
location { type: "Point", coordinates: [lng, lat] }  ← 2dsphere index
gpsVerified (Boolean), proximityDistance (Number)
notes (String), photos [String], duration (Number)
status ("scheduled"|"in-progress"|"completed"|"cancelled")
Indexes: visitorId+createdAt, farmerId+createdAt
```

### Group

```
name (required), pic, bio, createdBy (→User), admins [→User], members [→User]
```

### Media

```
uploadedBy (→User), originalName, mimeType, size, mediaType, context
cloudinaryId, urls { original, thumbnail, small, medium, large, xlarge, videoThumb, videoPreview }
dimensions { width, height }, duration
aiAnalysis { status, result, confidence, details, analyzedAt }
isDeleted (Boolean), deletedAt
```

### ActivityLog

```
actorId (→User), actorEmail, action, entityType, entityId
status ("success"|"failed"), ip, userAgent, metadata (Mixed)
```

---

## 6. State Management

### Redux Store

| Slice            | Key State                                                         | Caching                    |
| ---------------- | ----------------------------------------------------------------- | -------------------------- |
| `userSlice`      | currentUser, allUsers, usersData, searchResults                   | —                          |
| `chatSlice`      | chats, currentChat, syncing, restoredFromCache                    | localStorage (local-first) |
| `messageSlice`   | messages, currentChatId, hasMore, syncing, restoredFromCache      | localStorage (local-first) |
| `cropSlice`      | prescriptions, currentCrop                                                | —                          |
| `groupSlice`     | groups, selectedGroup, userLocation, nearbyUsers, locationHistory | —                          |
| `analyticsSlice` | metrics, userActivity, messageStats, locationStats, groupStats    | —                          |
| `friendSlice`    | friends, requests                                                 | —                          |
| `notificationSlice` | notifications[], unreadCount — in-app notification center      | — (transient)              |
| `adminSlice`     | admin statistics                                                  | —                          |
| `layoutSlice`    | leftComponent, rightComponent, mobileNav                          | —                          |

### Local-First Caching Pattern

```
1. APP STARTUP → restoreCachedChats(userId) → Render from localStorage instantly
2. BACKGROUND SYNC → fetchChats({ force: true }) → Merge server data → Update cache
3. OPEN CHAT → restoreCachedMessages(chatId) → Render cached → fetchMessages({ since: lastTimestamp })
4. NEW MESSAGE (socket) → addMessage reducer → appendCachedMessage() → No refetch
```

Cache keys: `cache:chats:{userId}`, `cache:messages:{chatId}` (last 200 messages)

---

## 7. Real-Time Communication

### Socket.IO Events

| Category      | Client → Server                                                                                                                                                        | Server → Client                                                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Presence**  | `manual-disconnect`                                                                                                                                                    | `user-online`, `user-offline`                                                                                                                             |
| **Rooms**     | `joinRoom`, `leaveRoom`                                                                                                                                                | `userJoined`, `userLeft`                                                                                                                                  |
| **Messaging** | `sendMessage`                                                                                                                                                          | `receiveMessage`, `message:error`, `message-edited`                                                                                                       |
| **Typing**    | `Typing`, `Stop-typing`                                                                                                                                                | `typing`, `stop-typing`                                                                                                                                   |
| **Location**  | `subscribe-to-nearby`, `unsubscribe-from-nearby`, `location-update`                                                                                                    | `nearby-users-update`, `user-location-updated`, `location:error`                                                                                          |
| **Groups**    | `group:create`, `group:update`                                                                                                                                         | `group:created`, `group:updated`, `group:error`                                                                                                           |
| **Analytics** | `analytics:request-metrics`, `analytics:request-user-activity`, `analytics:request-message-stats`, `analytics:request-location-stats`, `analytics:request-group-stats` | `analytics:metrics-updated`, `analytics:user-activity`, `analytics:message-stats`, `analytics:location-stats`, `analytics:group-stats`, `analytics:error` |

### Location Privacy

Location updates broadcast only to nearby subscribers (10km radius via `$near` query), NOT globally.

---

## 8. Feature Modules

### 8.1 Chat System

- 1-on-1 and group chat with real-time delivery
- Message types: text, image, video, audio, voice, file, document
- Cloudinary-hosted media with responsive variants + lazy loading (blur placeholders)
- Reply-to (validated same-chat), edit/delete (sender-only), typing indicators
- Per-participant unread counters, cursor-based pagination, incremental sync
- Sentiment analysis per message (15 languages)

### 8.2 Map & Location

- Leaflet with multiple tile layers (standard, diagnostic, terrain)
- GPS sharing with 10s watch interval, proximity search via `$nearSphere`
- Socket-driven 30s periodic nearby user refresh (no REST polling)
- Route display via Leaflet Routing Machine + OSRM (turn-by-turn, distance, ETA)
- Settings persisted to localStorage

### 8.3 Prescription Monitoring & AI

- **Disease Detection**: Agent Prescription API (free, PNG/JPG up to 50MB)
- **Diagnostic Health**: Sentinel GreenReport Plus (free, 10m Sentinel-2, VITALS time series)
- **Unified Health Reports**: Combines diagnostic + photo analysis
- **Health History Timeline**: Per-prescription tracking with source attribution

### 8.4 Visit Tracking

- GPS-verified visits (auto-verify within 100m of patient)
- Visit logging with notes, photos, duration
- Analytics: counts, GPS verification rates, duration trends

### 8.5 Sentiment Analysis

- Python FastAPI microservice (spaCy + TextBlob)
- 15 languages: English, Urdu, Hindi, Bengali, Pashto, Chinese, French, German, Italian, Japanese, Korean, Russian, Spanish, Swedish, Turkish
- Per-message scoring stored in DB, aggregated per-user/per-chat endpoints with Redis caching

### 8.6 Speech-to-Text / Text-to-Speech

- **STT**: ElevenLabs Scribe API (microphone button in chat)
- **TTS**: ElevenLabs `eleven_multilingual_v2` model ("Listen" button on messages)

### 8.7 Analytics Dashboard

- Metrics: total/active users, messages, chats, prescriptions, groups
- Trends: daily registrations, active users, messages per day
- Location stats, group stats, export (CSV/JSON)

### 8.8 Notification System

**Push Notifications (Web Push API):**
- VAPID-based push via `web-push` library
- Service worker (`sw-push.js`) registered on auth, auto-resubscribed if permission previously granted
- Server-side `sendPushNotification(userId, payload, category)` checks user preferences before sending
- Push triggered by: friend requests, messages (to offline recipients), group add/remove, admin prescription changes
- Notification preferences: `pushNotifications`, `chatNotifications`, `groupNotifications`, `cropNotifications`

**Socket Notifications (Real-Time):**
- `setupSocketEventHandlers(socket, notify)` wired globally via `useGlobalSocketNotifications` hook
- All socket events (message, group, location, connect/disconnect, errors) produce notistack toasts
- Each notification also dispatched to `notificationSlice` for in-app persistence

**In-App Notification Center:**
- Bell icon in AppShell header with unread badge count
- Popover with notification list (type-colored borders, timestamps, dismiss buttons)
- Redux `notificationSlice`: `addNotification`, `dismissNotification`, `markRead`, `markAllRead`, `clearAll`
- Cap at 100 entries, transient (not persisted to localStorage)

**Analytics Notifications:**
- `useAnalyticsSocket` passes `notify` callback to `setupAnalyticsListeners`
- Only errors/warnings shown as toasts (success updates are silent to avoid spam)

### 8.9 Landing Page

- Route: `/` (root) — public, bypasses AppShell
- Auto-redirects authenticated users to `/home` or `/dashboard` based on role
- Sections: sticky glassmorphic navbar, hero with gradient headline, stats strip, 6-card features grid, CTA banner, footer
- Full dark/light mode sync with system MUI theme
- Login/Signup buttons for unauthenticated users, "Go to App" for authenticated
- Animations: `slideInUp`, `fadeIn`, `float`, `Zoom` (all from existing `globals.css` keyframes)

### 8.10 Calendar & Events

- Route: `/calendar` — authenticated users only
- CRUD for events: task, meeting, monitoring, review, reminder
- Events linked to creator and optionally to groups
- Toggle completion, color-coded by type

---

## 9. Security Architecture

| Layer                | Mechanism                                                                         |
| -------------------- | --------------------------------------------------------------------------------- |
| Transport            | HTTPS in production, CORS with explicit origin                                    |
| Authentication       | JWT Bearer tokens (1h expiry), NextAuth session cookies                           |
| Email Verification   | SHA-256 token (24h expiry), required for credentials login, OAuth auto-verified   |
| Account Lockout      | 5 failed attempts → 15-min lock, auto-reset on expiry                             |
| Token Revocation     | In-memory blacklist on logout, checked before JWT verification                    |
| Password Policy      | Min 8 chars with uppercase, lowercase, number, and special character              |
| CSRF                 | Double-submit cookie (auto-retry on first-request failure)                        |
| Rate Limiting        | Redis-backed, survives restarts: auth 10/15min, forgot-pw 3/hr, general 100/15min |
| Input Validation     | Zod schemas (server), react-hook-form patterns (client)                           |
| Injection Prevention | Mongoose parameterized queries, regex escaping (ReDoS-safe)                       |
| XSS                  | Helmet CSP headers, React built-in escaping                                       |
| Passwords            | bcrypt 10 rounds, excluded from all queries (except internal NextAuth)            |
| Socket               | JWT-only userId (client payload ignored), scoped location broadcasts              |
| File Upload          | Type/size validation, Cloudinary processing                                       |

---

## 10. Caching Strategy

### Server-Side (Redis)

| Key Pattern                        | TTL                        | Purpose                  |
| ---------------------------------- | -------------------------- | ------------------------ |
| `rl:{userId\|ip}`                  | Window-based               | Rate limiting counters   |
| `cache:chats:{userId}`             | Invalidated on new message | Chat list                |
| `sentiment:user:{userId}`          | 10 min                     | User sentiment aggregate |
| `sentiment:chat:{chatId}:{userId}` | 5 min                      | Per-chat sentiment       |

### Client-Side (localStorage)

| Key                         | Purpose                    |
| --------------------------- | -------------------------- |
| `cache:chats:{userId}`      | Chat list warm startup     |
| `cache:messages:{chatId}`   | Message history (last 200) |
| `mapSettings`               | Map UI preferences         |
| `userEmail`, `offlineToken` | sendBeacon fallback        |

---

## 11. Error Handling

### Server

```
asyncHandler → errorHandler middleware:
  Mongoose ValidationError → 400 with ward details
  Mongoose CastError → 400 "Invalid ID"
  Mongoose 11000 → 409 "Already exists"
  JWT errors → 401
  Zod errors → 400 with validation issues
  Unknown → 500 (stack logged, not exposed)
```

### Client

- **ErrorBoundary**: Wraps Map, Chat, EmojiPicker dynamic components
- **Axios interceptor**: Auto-retry CSRF 403, auto-signout on 401
- **Redux thunks**: `rejectWithValue` for user-friendly messages
- **Conditional logger**: `logger.log/error/warn` (environment-aware, replaces console.log)

---

## 12. File Upload Pipeline

```
Client validates (type + size) → FormData → Multer (Cloudinary storage) → Cloudinary upload
  → mediaService generates responsive variants:
     Profile: 50×50, 100×100, 200×200, 400×400 (face detection)
     Chat: 150×150, 320px, 640px, 1024px, 1920px
     Video: thumbnail + preview variants
  → Media model saved → URLs returned
```

**Limits**: Chat 25MB, Profile 5MB, Monitoring 50MB, General 50MB
**Formats**: JPG, PNG, WebP, GIF, HEIC, MP4, MOV, AVI, WebM, PDF, DOC(X), XLS(X), PPT(X), TXT

---

## 13. External Integrations

| Service                   | Purpose                       | Auth             | Cost            |
| ------------------------- | ----------------------------- | ---------------- | --------------- |
| Cloudinary                | Media CDN + transformations   | API key/secret   | Free tier: 25GB |
| Agent Prescription                | Prescription symptom analysis        | None             | Free, no caps   |
| Sentinel GreenReport Plus | Diagnostic VITALS / ward health | None             | Free            |
| ElevenLabs                | STT (Scribe) + TTS            | API key          | Free tier       |
| OpenWeatherMap            | Weather data                  | API key          | Free: 1000/day  |
| Google/Facebook OAuth     | Social login                  | Client ID/Secret | Free            |
| OSRM                      | Route calculation             | None             | Free public API |

---

## 14. Deployment

### Required Services

```
MongoDB (:27017) | Redis (:6379) | Next.js (:3000) | Express (:8080) | Sentiment Python (:5001)
```

### Graceful Shutdown

Server handles SIGTERM, SIGINT, uncaughtException:

1. Stop accepting connections → 2. Close Redis → 3. Close MongoDB → 4. Force exit after 10s timeout

### Docker

Client configured with `output: "standalone"` in `next.config.mjs` for containerization.

---

_For API endpoint details, see [API_REFERENCE.md](./API_REFERENCE.md). For setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)._
