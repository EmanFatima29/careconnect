# CareConnect — System Overview

## Purpose

CareConnect is a **healthcare social platform** that connects patients, doctors, and pharmacies on a real-time map interface. Users can share their location, chat, manage prescriptions, book appointments, and rate healthcare providers. The system is a full-stack web application forked from GeoConnect (an agricultural platform) and re-purposed for healthcare.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  Next.js 15 (App Router)  ·  React 18  ·  MUI v6            │
│  Redux Toolkit + redux-persist  ·  NextAuth.js               │
│  Leaflet (react-leaflet)  ·  Socket.IO client                │
└──────────────────┬──────────────────────────────────────────┘
                   │  HTTP (REST)  +  WebSocket (Socket.IO)
┌──────────────────▼──────────────────────────────────────────┐
│                         SERVER                               │
│  Express.js (Node.js ESM)  ·  Socket.IO server               │
│  Mongoose (MongoDB)  ·  JWT + bcrypt  ·  Cloudinary          │
│  Redis (optional, rate limiting)  ·  Helmet/CORS/CSRF        │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                       DATA LAYER                             │
│  MongoDB Atlas (primary DB)  ·  Redis (token blacklist,      │
│  session cache)  ·  Cloudinary (media/images)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Technology Choices

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend framework | Next.js 15 (App Router) | SSR/SSG, file-based routing, API routes |
| UI library | MUI (Material UI) v6 | Consistent design, theme support, dark mode |
| State management | Redux Toolkit + redux-persist | Predictable state, offline caching for key slices |
| Authentication | NextAuth.js + custom JWT | Credentials + OAuth, JWT for API auth |
| Database | MongoDB + Mongoose | Flexible schema, GeoJSON 2dsphere for maps |
| Real-time | Socket.IO | Bidirectional events for chat, location, notifications |
| Map | Leaflet + react-leaflet | Open-source, tile-layer agnostic, custom markers |
| Media storage | Cloudinary | Responsive image variants, CDN delivery |
| Security | Helmet, CORS, CSRF, bcrypt | Defense-in-depth for the web layer |

---

## User Roles

There are five roles, with a strict priority order used everywhere in the system:

```
superadmin > admin > doctor > pharmacy > patient
```

| Role | Description |
|------|-------------|
| `patient` | Default role. Can view map, prescriptions, chat, book appointments |
| `doctor` | Can manage prescriptions, accept appointments, view patient list |
| `pharmacy` | Can view available prescriptions, manage pharmacy profile |
| `admin` | Platform management: approve doctors/pharmacies, view all stats |
| `superadmin` | Full platform access, inherits admin capabilities |

---

## Request / Response Flow

### Typical REST API call

```
Browser
  → NextAuth session cookie OR Bearer JWT header
  → Express `authenticate` middleware (verifies token, attaches req.user)
  → Optional `requireAdmin` middleware
  → Controller (business logic)
  → Mongoose model (MongoDB)
  → JSON response
```

### Typical real-time event

```
Browser (Socket.IO client)
  → Socket JWT auth middleware (verifies token on connection)
  → Joined user room: `user_${userId}`
  → Event handler in socketHandler.js
  → DB update via Mongoose
  → Socket.IO emit to target room(s)
```

---

## Directory Structure

```
/careconnect
├── client/                  # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── (auth)/      # login, signup, reset-password
│   │   │   ├── dashboard/   # Role-aware dashboard
│   │   │   ├── monitoring/  # Map page
│   │   │   ├── prescriptions/
│   │   │   ├── appointments/
│   │   │   ├── admin/       # Admin-only pages
│   │   │   └── api/         # Next.js API routes (proxy/auth)
│   │   ├── components/      # Reusable React components
│   │   │   ├── Map/         # Leaflet map, markers, popup, sidebar
│   │   │   ├── Chat/        # Chat window, voice recorder
│   │   │   ├── Dashboard/   # Role dashboards, stat cards
│   │   │   ├── Appointments/
│   │   │   ├── Rating/      # Star rating dialog + summary
│   │   │   └── HealthMetrics/
│   │   ├── utils/
│   │   │   ├── redux/       # Store, slices, thunks
│   │   │   └── hooks/       # useSocket, useNetwork, useLocation
│   │   └── lib/             # API wrappers, socket client
│   └── doc/                 # Project documentation
└── server/                  # Express backend
    ├── src/
    │   ├── models/          # Mongoose schemas
    │   ├── controllers/     # Business logic
    │   ├── routes/          # Express route definitions
    │   ├── middleware/      # auth, CSRF, rate limiter, upload
    │   └── services/        # Location, media, symptom, diagnostic
    └── lib/                 # Logger, Redis client, socket handler
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string (required) |
| `NEXTAUTH_SECRET` | JWT signing secret shared with Next.js |
| `PORT` | Server port (default 8080) |
| `ORIGIN_URL` | Production CORS origin |
| `DISABLE_REDIS` | Set `true` to skip Redis |
| `CLOUDINARY_*` | Media upload credentials |
| `INTERNAL_API_KEY` | Secret for NextAuth ↔ server internal calls |

### Client (`client/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL |
| `NEXTAUTH_URL` | NextAuth canonical URL |
| `NEXTAUTH_SECRET` | Must match server |

---

## Data Flow Diagram — User Login

```
1. User submits email + password on /login
2. NextAuth CredentialsProvider.authorize():
   a. Calls server POST /api/users (internal API key)
   b. Server validates password, checks lockout, returns user object
   c. NextAuth issues session JWT (stored in cookie)
3. Client: useSession() or getSession() returns user data
4. API calls: getSession() → Bearer token → server authenticate middleware
5. Socket.IO: connects with accessToken from session JWT → socket auth
```

---

## Security Model Summary

- **Authentication**: JWT (Bearer) for API + NextAuth session cookie for page renders
- **CSRF**: Double-submit cookie pattern — skipped for Bearer JWT calls
- **RBAC**: Middleware checks `req.user.roles` after JWT decode
- **Account lockout**: 5 failed attempts → 15-minute lock
- **Token invalidation**: Redis blacklist for logged-out tokens
- **Password policy**: Min 8 chars, uppercase + lowercase + digit + special char required
- **Rate limiting**: Applied to analytics endpoints and public routes via Redis
- **Helmet**: HTTP security headers (CSP, CORP, etc.)

---

## Related Documents

- [01_user_model_and_roles.md](01_user_model_and_roles.md) — Full user schema and role system
- [02_authentication.md](02_authentication.md) — Auth flow, JWT, NextAuth
- [03_rbac.md](03_rbac.md) — Role-based access control across frontend and backend
- [04_map_system.md](04_map_system.md) — Map, location sharing, real-time markers
- [05_chat_and_messaging.md](05_chat_and_messaging.md) — Chat system, Socket.IO events
- [06_prescriptions.md](06_prescriptions.md) — Prescription CRUD and health history
- [07_rating_system.md](07_rating_system.md) — Ratings for doctors and pharmacies
- [08_appointment_system.md](08_appointment_system.md) — Booking, status lifecycle
- [09_admin_features.md](09_admin_features.md) — Admin dashboard, verification, stats
- [10_realtime_system.md](10_realtime_system.md) — Socket.IO architecture and events
- [11_state_management.md](11_state_management.md) — Redux store, slices, persistence
