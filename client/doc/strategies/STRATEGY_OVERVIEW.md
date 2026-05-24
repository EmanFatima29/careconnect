# CareConnect — Strategy Overview
**FYP Project | Inspired by GeoConnect**
**Last updated: 2026-05-24**

---

## Project Summary

CareConnect is a healthcare social platform inspired by GeoConnect (an agricultural social platform). It allows four types of users — **patients, doctors, pharmacies, and admins** — to interact on a map-based interface, chat, form groups, and manage health-related data.

The base codebase is a direct fork of GeoConnect, with domain-specific layers (prescriptions, health metrics, symptom analysis) added on top. Many GeoConnect features are already adapted and functional; CareConnect-specific features are partially or not yet implemented.

---

## User Roles

| Role | Status | Description |
|------|--------|-------------|
| `patient` | Implemented | Default user role — can view map, prescriptions, chat, groups |
| `doctor` | Partial | Role exists in model; doctor-specific features not built |
| `admin` / `superadmin` | Implemented | Dashboard, user management, logs, monitoring |
| `pharmacy` | **MISSING** | Role not yet in user model; pharmacy features not built |

---

## Feature Status Matrix

### Inherited from GeoConnect (Done / Adapted)

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication (JWT + NextAuth) | Done | Login, signup, verify email, forgot/reset password |
| User Profile | Done | Name, bio, address, gender, age, profile pic |
| Real-time Socket.IO | Done | Location updates, chat, notifications |
| Map (Leaflet) | Done | Location sharing, nearby users, route display |
| Chat (1-on-1) | Done | Text, voice recorder, media, sentiment indicator |
| Groups | Done | Create/join groups, group chat |
| Admin Dashboard | Done | User management, activity logs, monitoring map |
| Analytics | Done | Charts, stats |
| Calendar | Done | Basic calendar page |
| Push Notifications | Done | Web push, socket notifications |
| Media Upload | Done | Cloudinary integration, responsive profile pics |
| Sentiment Analysis | Done | Chat message sentiment tagging |
| Rate Limiting / CSRF / Auth Middleware | Done | Security middleware in place |

### CareConnect-Specific (Partial / In Progress)

| Feature | Status | Notes |
|---------|--------|-------|
| Prescriptions (CRUD) | Partial | Model, controller, routes, UI exist; doctor-assigned prescriptions incomplete |
| Health Metrics | Partial | HealthMetricsCard, PatientHealthChart, `/api/health-metrics` route exist |
| Symptom Analysis Service | Partial | Service file exists but calls a placeholder external API |
| Diagnostic Service | Partial | Adapted from GeoConnect satellite service; needs full healthcare rework |
| Dashboard (patient view) | Partial | PatientHealthChart, HealthMetricsCard done; doctor/pharmacy views missing |

### CareConnect-Specific (PENDING — Not Built)

| Feature | Priority | Phase |
|---------|----------|-------|
| Pharmacy role in user model | Critical | Phase 1 |
| Doctor profile fields (specialty, license, availability) | Critical | Phase 1 |
| Pharmacy profile fields (license, hours, services) | Critical | Phase 1 |
| Role-based map markers (patient/doctor/pharmacy icons with role label) | Critical | Phase 2 |
| Map filter by role | High | Phase 2 |
| Rating model (rate doctors & pharmacies) | Critical | Phase 3 |
| Rating UI (star rating component on profile & map popup) | Critical | Phase 3 |
| Rating display (average rating on map markers/sidebar) | High | Phase 3 |
| Doctor dashboard (patient list, pending prescriptions) | High | Phase 4 |
| Doctor profile page (specialty, availability, ratings) | High | Phase 4 |
| Pharmacy dashboard (services, fulfilled prescriptions) | High | Phase 5 |
| Pharmacy profile page | High | Phase 5 |
| Pharmacy-specific sidebar menu | High | Phase 5 |
| Appointment system (book with doctor) | Medium | Phase 6 |
| Appointment calendar integration | Medium | Phase 6 |
| Health records extension (lab reports, diagnoses) | Medium | Phase 7 |
| Admin: approve/reject doctor & pharmacy registrations | High | Phase 8 |
| Admin monitoring map showing all roles | High | Phase 8 |
| Admin: role-based user stats in dashboard | Medium | Phase 8 |

---

## Implementation Phases

| Phase | Name | Status | Doc |
|-------|------|--------|-----|
| 1 | Foundation — Role System & Profiles | Pending | [phase-01-foundation.md](phase-01-foundation.md) |
| 2 | Map — Role-Based Markers & Filters | Pending | [phase-02-map-role-markers.md](phase-02-map-role-markers.md) |
| 3 | Rating System | Pending | [phase-03-rating-system.md](phase-03-rating-system.md) |
| 4 | Doctor Features | Pending | [phase-04-doctor-features.md](phase-04-doctor-features.md) |
| 5 | Pharmacy Features | Pending | [phase-05-pharmacy-features.md](phase-05-pharmacy-features.md) |
| 6 | Appointment System | Pending | [phase-06-appointment-system.md](phase-06-appointment-system.md) |
| 7 | Health Records Extension | Pending | [phase-07-health-records.md](phase-07-health-records.md) |
| 8 | Admin Dashboard Enhancements | Pending | [phase-08-admin-enhancements.md](phase-08-admin-enhancements.md) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, MUI (Material UI), Redux Toolkit |
| Map | Leaflet / react-leaflet |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | NextAuth.js + JWT |
| Media | Cloudinary |
| Notifications | Web Push API |
| Validation | Zod |

---

## Key Files Reference

| File | Role |
|------|------|
| `server/src/models/userModel.js` | User schema — roles, location, settings |
| `server/src/models/prescriptionModel.js` | Prescription schema |
| `client/src/utils/roleUtils.js` | Role inference helpers |
| `client/src/components/SidebarNav.jsx` | Role-based navigation menus |
| `client/src/components/Map/Map.jsx` | Main map component |
| `client/src/components/Map/mapUtils.js` | Map icons and helpers |
| `server/src/controllers/prescriptionController.js` | Prescription CRUD |
| `server/src/services/sentimentService.js` | Sentiment analysis |
| `server/src/services/symptomAnalysisService.js` | Symptom analysis (placeholder) |
