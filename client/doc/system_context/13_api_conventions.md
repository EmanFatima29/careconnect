# API Conventions and Patterns

## Overview

This document describes the conventions, patterns, and structural decisions that apply consistently across the CareConnect API. Understanding these conventions allows a developer (or AI assistant) to quickly predict how any endpoint behaves without reading each one individually.

---

## Base URL

```
Development:  http://localhost:8080
Production:   $RENDER_EXTERNAL_URL (Render.com)
```

Client code accesses this via `process.env.NEXT_PUBLIC_API_BASE_URL`.

All API routes are prefixed with `/api`:
```
/api/users
/api/chats
/api/prescriptions
/api/appointments
/api/ratings
/api/doctor
/api/pharmacy
/api/admin
/api/monitoring
/api/location
...
```

---

## Authentication Convention

Every protected endpoint requires:
```
Authorization: Bearer <accessToken>
```

The `accessToken` comes from the NextAuth session:
```js
const session = await getSession();
const headers = session?.accessToken
  ? { Authorization: `Bearer ${session.accessToken}` }
  : {};
```

Additionally, all mutating requests from the browser include the CSRF token:
```
X-CSRF-Token: <value from _csrf cookie>
```

(CSRF is automatically skipped for Bearer token requests, so this is only relevant for cookie-based sessions.)

---

## Response Shape

### Success responses

Most controllers return raw JSON — there is no universal envelope. Common shapes:

**Single resource**:
```json
{ "_id": "...", "name": "...", "..." : "..." }
```

**Paginated list**:
```json
{
  "appointments": [...],
  "total": 142,
  "page":  1,
  "limit": 20
}
```

**Stats/aggregation**:
```json
{
  "totalPatients": 8,
  "prescriptionsThisWeek": 3,
  "averageRating": 4.5,
  "totalRatings": 12,
  "verified": true
}
```

Some older controllers use a response handler wrapper:
```js
// utils/responseHandler.js
sendSuccess(res, data)    → { success: true,  data: ... }
sendError(res, msg, code) → { success: false, error: msg }
```

This pattern is used in the monitoring and visit controllers. The rest return data directly.

### Error responses

```json
{ "error": "Human-readable error message" }
```

HTTP status codes follow REST conventions:
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation failed) |
| 401 | Unauthorized (no token / expired) |
| 403 | Forbidden (wrong role / not owner) |
| 404 | Not Found |
| 409 | Conflict (duplicate, slot taken) |
| 503 | Service Unavailable (external service down) |

---

## Pagination Convention

Paginated endpoints accept:
```
?page=1&limit=20
```

Defaults:
- `page`: 1
- `limit`: 20 (max 100, enforced with `Math.min`)

Pattern used throughout:
```js
const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
const skip  = (page - 1) * limit;
```

---

## Async Handler Wrapper

All controllers use `asyncHandler` from the error handler middleware:

```js
// server/src/middleware/errorHandler.js
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

This means unhandled promise rejections are passed to the global error handler rather than crashing the process. Developers do not need `try/catch` in controllers for unexpected errors — only for intentional error branching.

---

## `req.user` Object

After `authenticate` runs, the following is available on every protected request:

```js
req.user = {
  userId: "64abc...",    // MongoDB _id as string
  roles:  "doctor",      // single string (not array)
  email:  "dr@example.com"
}
```

Always use `req.user.userId` (not `req.user.id` or `req.user._id`) in controllers.

---

## MongoDB ObjectId Handling

When using ObjectIds in queries, always convert string IDs:

```js
new mongoose.Types.ObjectId(doctorId)
```

This is required for aggregation pipeline `$match` stages. For simple `find()` queries, Mongoose handles string-to-ObjectId coercion automatically.

---

## Mongoose `.lean()`

Most read queries use `.lean()` to get plain JS objects instead of Mongoose documents:

```js
Prescription.find({ doctorId }).lean()
```

`.lean()` results:
- Cannot call `.save()` on them
- Slightly faster (no Mongoose overhead)
- Used when the data is only being returned to the client, not modified

---

## Common Select Patterns

Passwords are always excluded:
```js
User.findById(id).select("-password")
```

Profile data for embedding in other documents:
```js
.populate("patientId", "name email profilePic")
.populate("doctorId",  "name email profilePic doctorProfile")
```

---

## Internal API Key

NextAuth needs to verify user credentials with the backend without having a JWT yet. It uses:
```
Header: x-internal-api-key: <INTERNAL_API_KEY>
```

The `allowInternalOrAuthenticated()` middleware on user routes accepts this key or a valid Bearer JWT.

---

## Route File Structure

Each domain has its own route and controller file:

```
routes/doctorRoutes.js     → controllers/doctorController.js
routes/pharmacyRoutes.js   → controllers/pharmacyController.js
routes/appointmentRoutes.js → controllers/appointmentController.js
routes/ratingRoutes.js     → controllers/ratingController.js
routes/adminRoutes.js      → controllers/adminController.js
```

All route files follow the same structure:
```js
import express from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { handler1, handler2 } from "../controllers/domainController.js";

const router = express.Router();

router.get("/endpoint",   authenticate, handler1);
router.post("/endpoint",  authenticate, handler2);

export default router;
```

---

## Client-Side API Wrapper Pattern

All API calls are wrapped in thin functions in `client/src/lib/`:

```js
// client/src/lib/appointmentApi.js
export const apiBookAppointment = async (payload) => {
  const headers = await authHeaders();
  const { data } = await axios.post(`${base()}/api/appointments`, payload, {
    headers,
    withCredentials: true
  });
  return data;
};
```

These are called exclusively from Redux thunks — never directly from components.

---

## `withCredentials: true`

All axios calls include `withCredentials: true` to ensure the browser sends the NextAuth session cookie alongside the Bearer token. This supports the fallback auth path for cookie-based sessions.

---

## Health and Readiness Endpoints

```
GET /health  → { status, db, redis, uptime, timestamp }
GET /ready   → { ready: true/false }
```

`/health` returns 200 if both MongoDB and Redis (if enabled) are connected. Returns 503 if either is down.

These are used by Render.com for deployment health checks and by the self-ping keepalive timer.

---

## Key Conventions Summary

| Convention | Rule |
|-----------|------|
| Auth header | `Authorization: Bearer <token>` on all protected routes |
| `req.user.userId` | Always use this field name in controllers |
| Pagination | `?page=1&limit=20`, max 100 |
| Error format | `{ "error": "message" }` |
| ObjectId conversion | `new mongoose.Types.ObjectId(id)` in aggregations |
| `.lean()` | Use on all read-only queries |
| `asyncHandler` | Wrap every controller function |
| API wrappers | All server calls go through `client/src/lib/*.js` |
| Thunks | All Redux async actions use `createAsyncThunk` with `rejectWithValue` |
