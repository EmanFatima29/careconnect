# CareConnect — System Context Documentation

This directory contains standalone reference documents designed to give a complete understanding of the CareConnect system to any developer or AI assistant starting fresh on the codebase.

Each document is self-contained and covers one architectural domain in depth.

---

## Document Index

| File | Scope |
|------|-------|
| [00_system_overview.md](00_system_overview.md) | Architecture, tech stack, directory structure, environment variables, security model summary |
| [01_user_model_and_roles.md](01_user_model_and_roles.md) | Full MongoDB User schema, all fields, role sub-documents (doctorProfile, pharmacyProfile), indexes, signup flow |
| [02_authentication.md](02_authentication.md) | NextAuth.js + JWT dual-layer auth, CSRF protection, session object, password policy, account lockout, logout |
| [03_rbac.md](03_rbac.md) | Role-based access control at server middleware, RoleGuard component, and conditional UI rendering; full permission table |
| [04_map_system.md](04_map_system.md) | Leaflet map, role-colored markers, location sharing, nearby users query, popup content, admin monitoring map |
| [05_chat_and_messaging.md](05_chat_and_messaging.md) | Chat and Message schemas, Socket.IO events, unread counts, media messages, groups, sentiment analysis |
| [06_prescriptions.md](06_prescriptions.md) | Prescription schema, status lifecycle, health history log, doctor assignment, pharmacy interaction, Redux state |
| [07_rating_system.md](07_rating_system.md) | Rating schema, upsert flow, aggregation-backed ratingSummary, RatingSummary/RateUserDialog components, RBAC rules |
| [08_appointment_system.md](08_appointment_system.md) | Appointment schema, booking flow, status lifecycle, RBAC transition rules, conflict detection, Redux state |
| [09_admin_features.md](09_admin_features.md) | Admin dashboard, professional verification workflow, healthcare stats, user management, activity logs, monitoring map |
| [10_realtime_system.md](10_realtime_system.md) | Socket.IO architecture, connection auth, user rooms, all events (client↔server), location flow, useSocket hook |
| [11_state_management.md](11_state_management.md) | Redux store, all 12 slices, persistence whitelist, thunk pattern, optimistic updates, Providers setup |
| [12_health_services.md](12_health_services.md) | Symptom checker (rule-based), vitals assessment (threshold-based), REST endpoints, SymptomChecker UI component |
| [13_api_conventions.md](13_api_conventions.md) | Base URL, auth headers, response shapes, pagination, asyncHandler, req.user, ObjectId handling, client API wrappers |

---

## How to Use These Documents

**For understanding a specific feature**: Read the document for that domain directly. Each document stands alone.

**For understanding data flow**: Start with [00_system_overview.md](00_system_overview.md), then trace through [02_authentication.md](02_authentication.md) → [03_rbac.md](03_rbac.md) → the domain document.

**For understanding who can do what**: [03_rbac.md](03_rbac.md) has the complete permission table.

**For adding a new feature**: Read [13_api_conventions.md](13_api_conventions.md) for the patterns to follow, then [11_state_management.md](11_state_management.md) for the Redux pattern.

**For understanding the real-time system**: [10_realtime_system.md](10_realtime_system.md) covers all Socket.IO events.

---

## Key System Facts (Quick Reference)

- **Roles**: `patient` (default), `doctor`, `pharmacy`, `admin`, `superadmin`
- **Role stored as**: single string on `User.roles` — use `coerceRoles()` to normalize
- **Priority**: admin > doctor > pharmacy > patient (used in `inferRole()`)
- **Auth**: NextAuth session cookie for pages + Bearer JWT for API calls (same `NEXTAUTH_SECRET`)
- **Location**: stored as `[longitude, latitude]` (GeoJSON order, not [lat, lng])
- **Verified flag**: doctors and pharmacies with `verified: false` are invisible on the patient map
- **Rating**: patients only, doctors and pharmacies only; recomputes `ratingSummary` on User after every change
- **Appointments**: patients book, doctors confirm/complete; conflict check before creation
- **Prescriptions**: belong to a patient; doctorId is optional; healthHistory is append-only
- **Socket rooms**: every user joins `user_<userId>` on connect
- **Redux persistence**: user, chat, prescription, group, friend, layout slices only
