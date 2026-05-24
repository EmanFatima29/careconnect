# CareConnect — Full System Analysis & Production Roadmap

> **Last Updated**: 2026-03-27

## System Overview

**CareConnect** is a full-stack real-time medical chat application for medical users, built with **Next.js 15 (App Router) + React 19 + MUI v7 + Tailwind** on the frontend and **Express + MongoDB + Socket.IO** on the backend. It features role-based dashboards (Patient/Ward Officer/Admin), 1:1 & group chat, interactive Leaflet maps with nearby user discovery, prescription management, analytics, push notifications, and AI-powered prescription monitoring.

### Recent Additions (March 27, 2026)

- **Notification System**: Push notifications (VAPID/web-push), socket event toasts (notistack), in-app notification center (Redux `notificationSlice` + bell icon popover), preference-based delivery per category
- **Auth Hardening**: Email verification on signup, account lockout (5 attempts/15min), token blacklist on logout, strong password policy (upper+lower+num+special), session caching (60s TTL)
- **Landing Page**: Modern root page with hero, features grid, CTA, full theme sync, auth-aware redirects
- **New Endpoints**: verify-email, resend-verification, validate-reset-token, logout (token blacklist), internal/login-attempts
- **New Models Wards**: emailVerified, emailVerificationToken/Expires, loginAttempts, lockUntil, pushNotifications, groupNotifications, cropNotifications
- **New Services**: tokenBlacklist.js (in-memory JWT revocation)
- **New Hooks**: useGlobalSocketNotifications.js (wires socket events → toasts + Redux)

---

## COMPLETED PHASES

### Phase 1: Core Infrastructure ✅

| Item                                              | Status |
| ------------------------------------------------- | ------ |
| Express server with MongoDB/Mongoose              | Done   |
| Next.js 15 App Router with Turbopack              | Done   |
| NextAuth (Credentials + Google + Facebook)        | Done   |
| JWT-based auth with refresh logic                 | Done   |
| Protected routes via middleware                   | Done   |
| Redux Toolkit store with 8 slices + 5 thunk files | Done   |
| Axios API layer with auto-auth interceptor        | Done   |
| Socket.IO client/server with error recovery       | Done   |
| Environment-based CORS configuration              | Done   |

### Phase 2: User Management ✅

| Item                                         | Status |
| -------------------------------------------- | ------ |
| User registration (credentials + social)     | Done   |
| Login with email/password + social providers | Done   |
| User CRUD API (create, read, update, delete) | Done   |
| User search (name, email, phone, ID)         | Done   |
| Online/offline status tracking               | Done   |
| Role system (user/admin/superadmin)          | Done   |
| Profile page (read-only display)             | Done   |
| `sendBeacon` offline status on tab close     | Done   |

### Phase 3: Real-Time Chat ✅

| Item                                       | Status |
| ------------------------------------------ | ------ |
| 1:1 chat creation with duplicate detection | Done   |
| Real-time messaging via Socket.IO          | Done   |
| Message persistence (MongoDB)              | Done   |
| Chat list / contact list (ChatWindow)      | Done   |
| Message grouping by date                   | Done   |
| Read receipts (sent/delivered/seen)        | Done   |
| Typing indicators                          | Done   |
| Reply-to-message                           | Done   |
| Unread message counters                    | Done   |
| `getOrCreateChat` flow from search & map   | Done   |

### Phase 4: Interactive Map ✅

| Item                                                  | Status |
| ----------------------------------------------------- | ------ |
| Leaflet map with OpenStreetMap tiles                  | Done   |
| Browser geolocation (watchPosition)                   | Done   |
| Location sharing start/stop                           | Done   |
| Nearby users medical query ($nearSphere)              | Done   |
| Adjustable search radius (500m–10km)                  | Done   |
| User markers with popup (avatar, status, distance)    | Done   |
| Map settings drawer (auto-refresh, interval, filters) | Done   |
| Collapsible nearby users sidebar                      | Done   |
| Pulse animation on markers                            | Done   |
| Privacy-aware location queries                        | Done   |

### Phase 5: Group Management ✅

| Item                                                | Status |
| --------------------------------------------------- | ------ |
| Group creation with member selection (Autocomplete) | Done   |
| Group detail modal with member list                 | Done   |
| Add/remove members (admin only)                     | Done   |
| Leave group                                         | Done   |
| Group deletion                                      | Done   |
| Socket.IO group events (create, update)             | Done   |

### Phase 6: Prescription Management ✅

| Item                                                   | Status |
| ------------------------------------------------------ | ------ |
| Prescription CRUD with Zod validation                  | Done   |
| Owner-scoped queries with pagination                   | Done   |
| Status tracking (Prescribed/Active/Completed/Archived) | Done   |
| LocalStorage fallback on API failure                   | Done   |
| Admin override for access                              | Done   |

### Phase 7: Analytics & Admin ✅

| Item                                                              | Status |
| ----------------------------------------------------------------- | ------ |
| KPI dashboard (users, online, messages, location sharing)         | Done   |
| User activity chart (LineChart)                                   | Done   |
| Message stats chart (BarChart)                                    | Done   |
| Location & group distribution (PieChart)                          | Done   |
| Real-time analytics via Socket.IO                                 | Done   |
| CSV/JSON export                                                   | Done   |
| Admin-only stats API (users, prescriptions, chats, activity logs) | Done   |
| Activity logging service                                          | Done   |
| Role-based dashboard (Patient/Ward Officer/Admin)                 | Done   |

### Phase 8: Theme & Design System ✅

| Item                                                 | Status |
| ---------------------------------------------------- | ------ |
| MUI v7 custom theme (medical palette)                | Done   |
| Full dark/light mode with localStorage persistence   | Done   |
| Cross-tab theme sync                                 | Done   |
| Tailwind CSS integration with dark mode              | Done   |
| `StyledComponents.jsx` design system (14 components) | Done   |
| Design tokens (colors, shadows, gradients, spacing)  | Done   |
| Google Fonts (Geist Sans/Mono)                       | Done   |
| AppShell with responsive sidebar navigation          | Done   |

---

## NEXT PHASES NEEDED FOR PRODUCTION

### Phase 9: Security Hardening 🔴 CRITICAL

**Priority: P0 — Must complete before any deployment**

| #    | Task                                  | Detail                                                                                                                      |
| ---- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 9.1  | **Socket.IO authentication**          | Verify JWT on `connection` event — currently userId comes from unauthenticated query param, anyone can impersonate any user |
| 9.2  | **Authorization on chat endpoints**   | `getAllChats` returns every chat in system; `getMessagesByChat`/`deleteChat`/`deleteMessage` have no ownership checks       |
| 9.3  | **Location endpoint userId from JWT** | Location update/start/stop trust `userId` from request body — must derive from `req.user`                                   |
| 9.4  | **Sanitize getUserByEmail**           | Currently public and returns full user object including password hash                                                       |
| 9.5  | **Add Helmet middleware**             | HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)                                                                    |
| 9.6  | **Sanitize request logger**           | Currently logs passwords and tokens to disk in plaintext                                                                    |
| 9.7  | **Fix requireAuth debug leak**        | Error path dumps tokens, cookies, headers into response                                                                     |
| 9.8  | **Unify auth middleware**             | Merge `requireAuth` and `authenticate` into one — two near-identical middlewares cause confusion                            |
| 9.9  | **Input sanitization**                | `searchUser` passes user input directly to regex — potential ReDoS attack                                                   |
| 9.10 | **Rate limiting on auth routes**      | `authRateLimiter` exists but is never applied to login/signup                                                               |
| 9.11 | **CSRF protection**                   | No CSRF tokens on state-changing requests                                                                                   |
| 9.12 | **setUserOffline endpoint**           | Currently public — anyone can set any user offline by email                                                                 |

---

### Phase 10: Code Quality & Technical Debt 🟠 HIGH

**Priority: P1 — Required for maintainability**

| #     | Task                              | Detail                                                                                                                                                                                                                         |
| ----- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 10.1  | **Delete dead code**              | Remove: `User.jsx`, `ChatHeader.jsx`, `MessageInput.jsx`, `Chat-old.jsx`, `Map-old.jsx`, `MapEnhanced.jsx`, `MapComplete.jsx`, `Map-refactored.jsx`, `locationSharingComponent.jsx`, `page-old.js`, `old.js`, `fetchedData.js` |
| 10.2  | **Fix React hooks violation**     | `useLocationSocket` called inside `useEffect` in Map.jsx — must move to component top level                                                                                                                                    |
| 10.3  | **Extract Map sub-components**    | Split 1265-line Map.jsx into: `FloatingControls`, `RadiusControls`, `UserPopup`, `NearbyUsersSidebar`, `MapSettingsDrawer`, `MapAutoCenter`                                                                                    |
| 10.4  | **Split ChatWindow.jsx**          | Extract session/socket/data-fetching logic into dedicated hooks                                                                                                                                                                |
| 10.5  | **Remove console.log statements** | 50+ debug statements across production code — replace with configurable logger                                                                                                                                                 |
| 10.6  | **Unify styling paradigm**        | Standardize on MUI + Tailwind approach (currently mixed inconsistently)                                                                                                                                                        |
| 10.7  | **Fix duplicate Redux slices**    | Merge `userSlice` and `usersSlice` — overlapping responsibilities                                                                                                                                                              |
| 10.8  | **Fix receiver slice typo**       | Store key is `reciever` (misspelled) — rename to `receiver`                                                                                                                                                                    |
| 10.9  | **Use asyncHandler wrapper**      | Exists in `errorHandler.js` but zero controllers use it — all have manual try/catch                                                                                                                                            |
| 10.10 | **Standardize response format**   | Only some controllers use `sendSuccess`/`sendError` — most use raw `res.json()`                                                                                                                                                |
| 10.11 | **Remove dead DB code**           | `lib/db.js` contains unused change streams and pasted client-side React code                                                                                                                                                   |
| 10.12 | **Remove unused dependencies**    | `flat` and `multer` are imported but never used                                                                                                                                                                                |

---

### Phase 11: Chat Enhancements 🟡 MEDIUM

**Priority: P2 — Key missing features**

| #     | Task                                    | Detail                                                                                                                            |
| ----- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 11.1  | **Message deletion**                    | Currently stubbed with "coming soon" — implement soft-delete with `deletedFor` array                                              |
| 11.2  | **Emoji picker**                        | Button exists but is non-functional — integrate `emoji-mart` or `@emoji-mart/react`                                               |
| 11.3  | **Image/file sharing**                  | No media message support — implement `multer` upload + `fileUrl` storage (model already supports `messageType: image/video/file`) |
| 11.4  | **Voice messages**                      | Button exists but disabled — implement audio recording + upload                                                                   |
| 11.5  | **Message search**                      | No in-chat search — add text search across messages                                                                               |
| 11.6  | **Message pagination**                  | `getMessagesByChat` returns ALL messages — add cursor-based pagination                                                            |
| 11.7  | **Message editing**                     | No edit capability — add edit with "edited" indicator                                                                             |
| 11.8  | **Chat list with last message preview** | `ChatCard` shows hardcoded text — wire actual `lastMessage` from chat model                                                       |
| 11.9  | **Message virtualization**              | No virtualization for large message lists — integrate `react-virtuoso` or `react-window`                                          |
| 11.10 | **Group chat in Chat UI**               | Group messaging integration in Chat component                                                                                     |

---

### Phase 12: Profile & User Experience 🟡 MEDIUM

**Priority: P2**

| #    | Task                                   | Detail                                                                                  |
| ---- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| 12.1 | **Profile editing**                    | Profile page is read-only — add edit form for name, phone, bio, avatar, interests, etc. |
| 12.2 | **Avatar upload**                      | No profile picture upload — implement with multer + cloud storage (S3/Cloudinary)       |
| 12.3 | **Forgot password flow**               | Login links to `/forgot-password` which doesn't exist — implement email reset flow      |
| 12.4 | **Notification settings**              | Placeholder in profile — wire notification preferences to user `settings`               |
| 12.5 | **Privacy settings UI**                | Placeholder in profile — wire `accountType`, `allowMessagesFrom`, `visibleRange`        |
| 12.6 | **User avatar in AppShell navigation** | Sidebar shows no user avatar or name                                                    |
| 12.7 | **Root page redirect**                 | `/` only shows `<Spinner>` — should redirect to home or `/login` based on auth          |
| 12.8 | **Friend request system**              | Schema has `friendRequests` ward but no UI or API endpoints exist                       |

---

### Phase 13: Notification System 🟡 MEDIUM

**Priority: P2**

| #    | Task                           | Detail                                                                                      |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| 13.1 | **Install notistack**          | `notificationHandler.js` references it but the package is not installed                     |
| 13.2 | **Toast notifications**        | Wire `SocketNotificationManager` to UI snackbar/toast — currently falls back to console.log |
| 13.3 | **In-app notification center** | No notification bell/drawer — add persistent notification list                              |
| 13.4 | **Push notifications**         | No browser push notification support — implement Service Worker + Web Push API              |
| 13.5 | **Email notifications**        | No email integration for offline users — add via SendGrid/Nodemailer                        |
| 13.6 | **Notification preferences**   | Allow users to configure which events trigger notifications                                 |

---

### Phase 14: Map & Location Improvements 🟡 MEDIUM

**Priority: P2**

| #    | Task                             | Detail                                                                                 |
| ---- | -------------------------------- | -------------------------------------------------------------------------------------- |
| 14.1 | **"Start Chat" from map**        | Map marker popup has chat button that is a noop `() => {}` — wire to `getOrCreateChat` |
| 14.2 | **Fix nearby users coordinates** | Socket handler uses hardcoded `[0, 0]` instead of user's actual location               |
| 14.3 | **Location history**             | Controller is misnamed — implement actual location history tracking                    |
| 14.4 | **Geofencing alerts**            | Alert when nearby users enter/leave radius                                             |
| 14.5 | **Map layer switching**          | Add diagnostic/terrain/hybrid map layers                                               |
| 14.6 | **Cluster markers**              | Add marker clustering for areas with many users                                        |
| 14.7 | **Fix location.city ward**       | Analytics groups by `location.city` which doesn't exist in User schema                 |

---

### Phase 15: Monitoring & AI Features 🟢 LOWER

**Priority: P3 — Enhancement**

| #    | Task                                | Detail                                                                       |
| ---- | ----------------------------------- | ---------------------------------------------------------------------------- |
| 15.1 | **Server-side image upload**        | Monitoring page is UI-only with simulated progress — implement actual upload |
| 15.2 | **Cloud storage integration**       | S3/Cloudinary for images                                                     |
| 15.3 | **AI prescription health analysis** | Integrate TensorFlow.js or external ML API for symptom analysis              |
| 15.4 | **Image gallery from DB**           | Store and retrieve uploaded monitoring images                                |
| 15.5 | **Weather integration**             | Referenced in old dashboard — add weather API (OpenWeatherMap)               |

---

### Phase 16: Production Infrastructure 🔴 CRITICAL

**Priority: P0 — Required for deployment**

| #     | Task                         | Detail                                                                                                           |
| ----- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 16.1  | **Fix metadata/SEO**         | `metdata.js` exists but isn't imported; `"use client"` layout can't export static metadata — restructure for SEO |
| 16.2  | **Add database indexes**     | No index on `Message.chatId`, `Message.senderId` — poor query performance at scale                               |
| 16.3  | **Graceful shutdown**        | No SIGTERM/SIGINT handler — connections/DB not cleaned up                                                        |
| 16.4  | **Log rotation**             | Request logger writes unbounded JSONL file — add log rotation                                                    |
| 16.5  | **Redis for rate limiting**  | In-memory Map rate limiter won't work in clustered deployments                                                   |
| 16.6  | **Environment validation**   | No startup check for required env vars (DB URI, JWT secret, OAuth keys)                                          |
| 16.7  | **Health check endpoint**    | No `/health` or `/ready` endpoint for load balancers                                                             |
| 16.8  | **Cascade deletes**          | User deletion doesn't clean up messages, chats, groups, prescriptions                                            |
| 16.9  | **API response compression** | No `compression` middleware                                                                                      |
| 16.10 | **Docker containerization**  | No Dockerfile or docker-compose for consistent deployment                                                        |
| 16.11 | **CI/CD pipeline**           | No GitHub Actions/GitLab CI for automated testing & deployment                                                   |
| 16.12 | **next.config.mjs**          | Config is empty `{}` — add image domains, security headers, output options                                       |

---

### Phase 17: Testing 🟠 HIGH

**Priority: P1**

| #    | Task                          | Detail                                                            |
| ---- | ----------------------------- | ----------------------------------------------------------------- |
| 17.1 | **Backend unit tests**        | Zero tests — add Jest tests for controllers, services, middleware |
| 17.2 | **Backend integration tests** | API endpoint testing with supertest                               |
| 17.3 | **Frontend component tests**  | React Testing Library for Chat, Map, Groups, Dashboard            |
| 17.4 | **E2E tests**                 | Cypress or Playwright for login → chat → map flows                |
| 17.5 | **Socket.IO tests**           | Test real-time event flows                                        |
| 17.6 | **Load testing**              | Artillery or k6 for performance benchmarking                      |

---

### Phase 18: Accessibility & Responsive Polish 🟡 MEDIUM

**Priority: P2**

| #    | Task                        | Detail                                                                        |
| ---- | --------------------------- | ----------------------------------------------------------------------------- |
| 18.1 | **SearchBar ARIA**          | No `role="listbox"`, no keyboard navigation in dropdown                       |
| 18.2 | **Chat message list ARIA**  | No `role="log"`, `aria-live` for new messages                                 |
| 18.3 | **Map controls ARIA**       | Map controls lack screen reader support                                       |
| 18.4 | **Color contrast audit**    | Verify WCAG AA compliance across light/dark themes                            |
| 18.5 | **Mobile-first refinement** | Test and fix layout on small screens (< 375px)                                |
| 18.6 | **Keyboard navigation**     | Full keyboard nav for chat, map controls, modals                              |
| 18.7 | **Skip navigation links**   | No skip-to-content links                                                      |
| 18.8 | **Footer accessibility**    | Social links missing `aria-label`, `target="_blank"` missing `rel="noopener"` |

---

## Recommended Execution Order

```
Phase 9  (Security)         ████████████ P0 — IMMEDIATE
Phase 16 (Infrastructure)   ████████████ P0 — IMMEDIATE
Phase 10 (Tech Debt)        ██████████── P1 — Week 1-2
Phase 17 (Testing)          ██████████── P1 — Week 2-3
Phase 11 (Chat Features)    ████████──── P2 — Week 3-4
Phase 12 (Profile/UX)       ████████──── P2 — Week 4-5
Phase 13 (Notifications)    ██████────── P2 — Week 5-6
Phase 14 (Map/Location)     ██████────── P2 — Week 5-6
Phase 18 (Accessibility)    ██████────── P2 — Week 6-7
Phase 15 (Monitoring/AI)    ████──────── P3 — Week 7-8
```

---

## Summary Score

| Area                             | Score    | Notes                                                         |
| -------------------------------- | -------- | ------------------------------------------------------------- |
| **Authentication**               | 9/10     | 3-provider + JWT refresh — just unify middleware              |
| **Chat**                         | 6/10     | Core works — missing media, emoji, delete, pagination         |
| **Map**                          | 7/10     | Feature-rich — needs code cleanup + bug fixes                 |
| **Groups**                       | 5/10     | Basic CRUD — missing edit, permissions, group chat            |
| **Prescriptions**                | 8/10     | Best-implemented module — Zod, pagination, ownership          |
| **Analytics**                    | 7/10     | Charts + real-time — fix `location.city` bug                  |
| **Dashboard**                    | 7/10     | Role-based rendering — solid foundation                       |
| **Theme/UI**                     | 8/10     | Dual theme + design system — unify styling                    |
| **Security**                     | 3/10     | Critical gaps — socket auth, authorization, data leaks        |
| **Testing**                      | 0/10     | Zero tests of any kind                                        |
| **DevOps**                       | 1/10     | No Docker, CI/CD, health checks, log rotation                 |
| **Overall Production Readiness** | **~45%** | Core features work but security & infrastructure are blocking |

Completed: _Generate phase report_ (5/5)

The full analysis covers **8 completed phases** and **10 next phases** needed. The two blocking priorities for production are **Phase 9 (Security)** and **Phase 16 (Infrastructure)** — the system has critical vulnerabilities like unauthenticated Socket.IO, missing authorization checks on chat/message endpoints, and data leaks. After those, **Phase 10 (Tech Debt)** and **Phase 17 (Testing)** should follow since there are zero tests and significant dead/duplicated code (4 near-identical Map files, commented-out components). The feature gaps (chat media, emoji, profile editing, notifications, monitoring AI) are well-scoped for subsequent sprints.

Would you like me to start implementing any specific phase?
