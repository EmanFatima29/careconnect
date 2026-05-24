# CareConnect — API & Socket Events Reference

> Developer guidance for all REST endpoints and Socket.IO events.
> **Base URL**: `http://localhost:8080` (configurable via `NEXT_PUBLIC_API_BASE_URL`)
> **Auth**: Most endpoints require `Authorization: Bearer <JWT>` header.
> **Last Updated**: 2026-03-27

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Endpoints](#2-user-endpoints)
3. [Chat Endpoints](#3-chat-endpoints)
4. [Message Endpoints](#4-message-endpoints)
5. [Location Endpoints](#5-location-endpoints)
6. [Prescription Endpoints](#6-prescription-endpoints)
7. [Group Endpoints](#7-group-endpoints)
8. [Friend Endpoints](#8-friend-endpoints)
9. [Media Endpoints](#9-media-endpoints)
10. [Monitoring Endpoints](#10-monitoring-endpoints)
11. [Visit Endpoints](#11-visit-endpoints)
12. [Speech Endpoints](#12-speech-endpoints)
13. [Analytics Endpoints](#13-analytics-endpoints)
14. [Admin Endpoints](#14-admin-endpoints)
15. [Notification Endpoints](#15-notification-endpoints)
16. [Socket.IO Events](#16-socketio-events)
17. [Error Responses](#17-error-responses)
18. [Rate Limits](#18-rate-limits)

---

## 1. Authentication

All authenticated requests require:
```
Authorization: Bearer <JWT>
```

State-changing requests (POST/PUT/PATCH/DELETE) also require CSRF:
```
X-CSRF-Token: <value from _csrf cookie>
```

The CSRF cookie is set automatically on first response. If the first POST fails with 403 CSRF, the client axios interceptor auto-retries after fetching the cookie via GET /health.

---

## 2. User Endpoints

Base: `/api/users`

### `POST /` — Create User (Signup)
**Auth**: None (rate-limited: 10/15min). Password must include uppercase, lowercase, number, and special character (min 8 chars). On credentials signup, a verification email is sent automatically. OAuth users are auto-verified.
```json
// Request
{ "name": "John", "email": "john@example.com", "password": "Pass@1234", "phone": "+923001234567", "socialAccounts": "google" }

// Response 201
{ "success": true, "data": { "_id": "...", "name": "John", "email": "john@example.com", "emailVerified": false }, "message": "User created successfully" }

// Response 409
{ "success": false, "message": "User already exists. Please log in." }

// Response 400 (weak password)
{ "error": "Password must be at least 8 characters with uppercase, lowercase, number, and special character" }
```

### `GET /` — Get All Users
**Auth**: JWT required
- Regular users receive: `name, email, profilePic, status, lastSeen, _id`
- Admins receive: all wards except `password, __v, resetPasswordToken, resetPasswordExpires`
```json
// Response 200
{ "success": true, "data": [{ "_id": "...", "name": "John", "email": "john@example.com", "status": "online" }], "statusCode": 200 }
```

### `GET /profile` — Get Current User (from JWT)
**Auth**: JWT required
```json
// Response 200
{ "success": true, "data": { "_id": "...", "name": "...", "email": "...", "friends": [...], "chats": [...], "prescriptions": [...], "pendingRequestsCount": 2 } }
```

### `GET /email/:email` — Get User by Email
**Auth**: JWT or INTERNAL_API_KEY
- Internal calls (INTERNAL_API_KEY) receive password hash for NextAuth credential verification
- JWT calls receive `-password` wards

### `GET /id/:_id` — Get User by ID
**Auth**: JWT required. Returns user without password/resetToken wards.

### `GET /name/:name` — Get User by Name
**Auth**: JWT required.

### `GET /phone/:phone` — Get User by Phone
**Auth**: JWT required.

### `GET /search?query=...` — Search Users
**Auth**: JWT required. Max query length: 100 chars. Returns up to 10 results.
```json
// Response 200
[{ "_id": "...", "name": "John", "email": "john@example.com" }]
```

### `PATCH /me` — Update Own Profile
**Auth**: JWT required. Supports multipart/form-data for profile picture upload.
```
Wards: name, phone, bio, education, interests, gender, dob, relationship, workStatus, address, settings
File: profilePic (ward name)
```

### `PATCH /:email` — Update User by Email
**Auth**: JWT required. Self-update or admin only.
```json
// Request
{ "name": "New Name", "settings": { "locationSharing": true, "showSentiment": true } }

// Response 200
{ "success": true, "updatedUser": {...}, "updatedFields": ["name", "settings"] }
```

### `DELETE /:_id` — Delete User (Cascade)
**Auth**: JWT + Admin required. Cascades: messages, chats, groups, prescriptions.

### `POST /status-offline` — Set User Offline (sendBeacon)
**Auth**: HMAC token (mandatory). No JWT (sendBeacon can't send headers).
```json
// Request
{ "email": "john@example.com", "status": "offline", "lastSeen": "2026-03-23T10:00:00Z", "token": "<HMAC sha256>" }
```

### `POST /forgot-password` — Request Password Reset
**Auth**: None (rate-limited: 3/hour)
```json
{ "email": "john@example.com" }
// Always returns 200 (prevents email enumeration)
{ "message": "If an account with that email exists, a reset link has been sent." }
```

### `POST /reset-password/:token` — Reset Password
**Auth**: None (rate-limited: 10/15min). Password must include uppercase, lowercase, number, and special character (min 8 chars).
```json
{ "password": "NewPass@123" }
// Response 200
{ "message": "Password has been reset successfully" }
// Response 400 (weak password)
{ "error": "Password must be at least 8 characters with uppercase, lowercase, number, and special character" }
```

### `GET /verify-email?token=...` — Verify Email Address
**Auth**: None. Token is sent via email on signup.
```json
// Response 200
{ "message": "Email verified successfully. You can now log in." }
// Response 400
{ "error": "Invalid or expired verification link" }
```

### `POST /resend-verification` — Resend Verification Email
**Auth**: None (rate-limited: 10/15min). Always returns 200 to prevent enumeration.
```json
{ "email": "john@example.com" }
// Response 200
{ "message": "If the account exists and is unverified, a new link has been sent." }
```

### `GET /validate-reset-token/:token` — Validate Reset Token
**Auth**: None. Used by the reset-password form to verify the token before showing the form.
```json
// Response 200
{ "valid": true }
// Response 400
{ "valid": false, "error": "Invalid or expired reset token" }
```

### `POST /logout` — Logout (Blacklist Token)
**Auth**: JWT required. Blacklists the current token server-side so it cannot be reused.
```json
// Response 200
{ "message": "Logged out successfully" }
```

### `PATCH /internal/login-attempts/:email` — Update Login Attempts (Internal Only)
**Auth**: `INTERNAL_API_KEY` header required. Used by NextAuth to track failed login attempts and account lockout.
```json
{ "loginAttempts": 3, "lockUntil": "2026-03-27T10:15:00.000Z" }
// Response 200
{ "success": true }
```

---

## 3. Chat Endpoints

Base: `/api/chats`

### `POST /` — Create Chat
**Auth**: JWT required
```json
{ "participants": ["userId1", "userId2"], "isGroup": false }
```

### `POST /get-or-create-chat` — Get or Create 1:1 Chat
**Auth**: JWT required
```json
{ "currentUserId": "...", "searchedUserId": "..." }
// Response 200
{ "chat": { "_id": "...", "participants": [...], "lastMessage": {...} } }
```

### `GET /` — Get All User Chats
**Auth**: JWT required
```json
// Response 200
[{ "_id": "...", "participants": [...], "lastMessage": {...}, "unreadMessages": { "userId": 3 }, "updatedAt": "..." }]
```

### `GET /:id` — Get Chat by ID
**Auth**: JWT required

### `POST /:id/mark-read` — Mark Chat as Read
**Auth**: JWT required. Resets unread counter for the authenticated user.

### `DELETE /:id` — Delete Chat
**Auth**: JWT required

---

## 4. Message Endpoints

Base: `/api/messages`

### `POST /` — Create Message (with optional media)
**Auth**: JWT required. Supports multipart/form-data for file upload.
```
Body wards: chatId, content, senderId, receiverIds (JSON string), messageType, replyTo
File ward: file (optional, max 25MB)

// Response 201
{ "_id": "...", "chatId": "...", "senderId": "...", "content": "Hello", "messageType": "text",
  "media": { "mediaId": "...", "urls": { "original": "...", "thumbnail": "..." } },
  "sentiment": { "score": 0.5, "label": "positive", "language": "english" },
  "status": "sent", "createdAt": "..." }
```

**Side effects**: Emits `receiveMessage` to chat room, invalidates Redis chat cache, sends push notifications to offline recipients.

### `GET /chat/:chatId` — Get Messages (Paginated)
**Auth**: JWT required. Must be chat participant.
```
Query params:
  limit=50        (max 100)
  before=<msgId>  (cursor-based pagination — older messages)
  since=<ISO>     (incremental sync — newer messages only)

// Response 200
{ "messages": [...], "hasMore": true }
```

### `GET /sentiment/:userId` — Get User Sentiment
**Auth**: JWT required. Cached in Redis (10 min TTL).
```json
{ "score": 0.35, "label": "positive", "messageCount": 87 }
```

### `GET /sentiment/:userId/chat/:chatId` — Get Chat-Specific Sentiment
**Auth**: JWT required. Cached in Redis (5 min TTL).

### `PUT /:id` — Edit Message
**Auth**: JWT required. Sender only.
```json
{ "content": "Updated message text" }
```

### `DELETE /:id` — Delete Message (Soft)
**Auth**: JWT required. Sender only. Adds userId to `deletedFor` array.

---

## 5. Location Endpoints

Base: `/api/location`

### `POST /start` — Start Location Sharing
**Auth**: JWT required. Sets `settings.locationSharing: true`.
```json
// Response 200
{ "success": true, "isSharing": true }
```

### `POST /stop` — Stop Location Sharing
**Auth**: JWT required. Resets coordinates to `[0, 0]`.

### `POST /update` — Update Location
**Auth**: JWT required. Coordinates in GeoJSON order `[longitude, latitude]`.
```json
{ "coordinates": [73.0479, 33.6844] }
```

### `GET /nearby` — Get Nearby Users
**Auth**: JWT required. Uses JWT userId (not query param).
```
Query: ?radius=5000

// Response 200
{ "success": true, "count": 3, "users": [{ "id": "...", "name": "...", "coordinates": [73.04, 33.68], "profilePic": {...}, "status": "online" }] }
```

### `GET /history/:userId` — Get Location History
**Auth**: JWT required. Authorization check: own data or admin only.

---

## 6. Prescription Endpoints

Base: `/api/prescriptions`

### `GET /` — List All Prescriptions
### `GET /user/:userId` — Get Prescriptions by User
### `GET /:id` — Get Prescription by ID
### `POST /` — Create Prescription
```json
{ "name": "Wheat", "dosage": "HD-2967", "area": 5.5, "plantedDate": "2026-03-01", "ownerId": "..." }
```
### `PATCH /:id` — Update Prescription
### `DELETE /:id` — Delete Prescription

All require JWT authentication.

---

## 7. Group Endpoints

Base: `/api/groups`

### `POST /` — Create Group
### `GET /` — Get All Groups
### `GET /name/:name` — Get Group by Name
### `GET /:groupId` — Get Group by ID
### `POST /exit` — Leave Group
### `POST /addGroupToHistory` — Add Group to History

All require JWT authentication.

---

## 8. Friend Endpoints

Base: `/api/friends`

### `GET /` — Get Friends List
### `GET /requests` — Get Friend Requests
### `POST /request` — Send Friend Request
```json
{ "recipientId": "..." }
```
### `POST /accept` — Accept Friend Request
```json
{ "requestId": "..." }
```
### `POST /decline` — Decline Friend Request
### `DELETE /:friendId` — Remove Friend

All require JWT authentication.

---

## 9. Media Endpoints

Base: `/api/media`

### `POST /upload` — Upload Single File
**Auth**: JWT required. Multipart/form-data with ward name `file`. Max 50MB.
```json
// Response 201
{ "success": true, "media": { "_id": "...", "urls": { "original": "...", "thumbnail": "..." }, "mediaType": "image" } }
```

### `POST /upload-multiple` — Upload Multiple Files
**Auth**: JWT required. Ward name `files`, max 10 files.

### `GET /` — List User Media
**Auth**: JWT required.
```
Query: ?context=profile|chat|monitoring|prescription|group|general
```

### `DELETE /:mediaId` — Soft-Delete Media
**Auth**: JWT required. Sets `isDeleted: true`.

---

## 10. Monitoring Endpoints

Base: `/api/monitoring`

### `POST /upload` — Upload Monitoring Image
**Auth**: JWT required. Multipart/form-data, ward `image`. Max 50MB.

### `GET /images` — Get Monitoring Images
**Auth**: JWT required.

### `POST /analyze-disease/:cropId` — Analyze Prescription Disease
**Auth**: JWT required. Uses Agent Prescription API (free).
```json
// Response 200
{ "success": true, "analysis": { "disease": "Leaf Blight", "confidence": 0.87, "treatment": "Apply fungicide..." },
  "prescription": { "_id": "...", "currentHealth": {...}, "healthHistory": [...] } }
```

### `GET /diagnostic/:cropId` — Get Diagnostic Health Data
**Auth**: JWT required. Uses Sentinel GreenReport Plus (free).
```json
// Response 200
{ "success": true, "diagnostic": { "currentNDVI": 0.72, "historicalAverage": 0.68, "healthStatus": "healthy",
  "precipitationDeviation": -5, "anomalyDetected": false } }
```

### `GET /health-report/:cropId` — Get Unified Health Report
**Auth**: JWT required. Combines diagnostic + symptom analysis.
```json
{ "success": true, "report": { "cropId": "...", "diagnostic": {...}, "diseaseHistory": [...],
  "recommendation": "Ward health is normal. Continue regular monitoring." } }
```

---

## 11. Visit Endpoints

Base: `/api/visits`

### `POST /` — Create Visit
**Auth**: JWT required. Auto-verifies GPS if within 100m of patient.
```json
{ "farmerId": "...", "cropId": "...", "latitude": 33.68, "longitude": 73.04,
  "notes": "Ward inspection", "photos": ["url1"], "duration": 45 }

// Response 201
{ "success": true, "visit": { "_id": "...", "gpsVerified": true, "proximityDistance": 45.2 } }
```

### `GET /` — Get All Visits
**Auth**: JWT required.
```
Query: ?farmerId=...&cropId=...&startDate=...&endDate=...&page=1&limit=20
```

### `GET /:id` — Get Visit by ID
### `GET /analytics` — Get Visit Analytics
```json
{ "success": true, "analytics": { "totalVisits": 120, "gpsVerified": 95, "averageDuration": 38,
  "visitsByMonth": [...], "topVisitors": [...] } }
```

---

## 12. Event Endpoints

Base: `/api/events`

### `GET /` — Get Events
**Auth**: JWT required.
```
Query: ?startDate=...&endDate=...&groupId=...
```

### `POST /` — Create Event
**Auth**: JWT required.
```json
{ "title": "Ward Inspection", "date": "2026-04-01", "time": "09:00", "duration": "2 hours", "type": "monitoring", "color": "#2e7d32" }
```

### `PATCH /:id` — Update Event
**Auth**: JWT required. Creator or admin only.

### `PATCH /:id/toggle` — Toggle Event Completion
**Auth**: JWT required.

### `DELETE /:id` — Delete Event
**Auth**: JWT required. Creator or admin only.

---

## 13. Speech Endpoints

Base: `/api/speech`

### `POST /stt` — Speech-to-Text
**Auth**: JWT required. Rate-limited: 20/15min. Multipart/form-data, ward `audio`.
```json
// Request: audio file (WAV, MP3, WebM, etc.)
// Optional body: { "language": "en" }

// Response 200
{ "success": true, "text": "Hello, how are the prescriptions today?", "language": "en", "confidence": 0.95 }
```

### `POST /tts` — Text-to-Speech
**Auth**: JWT required. Rate-limited: 20/15min.
```json
// Request
{ "text": "The prescriptions look healthy", "voiceId": "21m00Tcm4TlvDq8ikWAM" }

// Response: audio/mpeg binary stream
```

---

## 13. Analytics Endpoints

Base: `/api/analytics` (rate-limited: 50/15min)

### `GET /metrics` — Get KPI Summary
```json
{ "totalUsers": 150, "activeUsers": 45, "totalMessages": 12500, "totalChats": 89, "totalCrops": 67, "totalGroups": 12 }
```

### `GET /user-activity?days=7` — User Activity Trends
### `GET /messages?days=7` — Message Statistics
### `GET /location-stats` — Location Sharing Stats
### `GET /groups` — Group Statistics
### `GET /export?format=csv&dateRange=7days` — Export Data

All require JWT authentication.

---

## 14. Admin Endpoints

Base: `/api/admin` (JWT + Admin role required)

### `GET /stats/users` — User Statistics
### `GET /stats/prescriptions` — Prescription Summaries
### `GET /stats/chats` — Chat Usage Stats
### `GET /activity-logs` — Activity Logs

---

## 15. Notification Endpoints

Base: `/api/notifications`

### `GET /vapid-public-key` — Get VAPID Public Key
**Auth**: None (public).

### `POST /subscribe` — Subscribe to Push Notifications
**Auth**: JWT required.
```json
{ "subscription": { "endpoint": "https://...", "keys": { "p256dh": "...", "auth": "..." } } }
```

### `DELETE /unsubscribe` — Unsubscribe
**Auth**: JWT required.

---

## 16. Socket.IO Events

### Connection
```javascript
// Client → Server: connect with JWT
const socket = io(SOCKET_URL, { auth: { token: jwtToken } });
```

### Presence

| Event | Direction | Payload |
|-------|-----------|---------|
| `user-online` | Server → All | `userId` (string) |
| `user-offline` | Server → All | `{ userId, lastSeen }` |
| `manual-disconnect` | Client → Server | *(no payload — userId from JWT)* |

### Rooms

| Event | Direction | Payload |
|-------|-----------|---------|
| `joinRoom` | Client → Server | `roomId` (string) |
| `leaveRoom` | Client → Server | `roomId` (string) |
| `userJoined` | Server → Room | `{ userId, roomId }` |
| `userLeft` | Server → Room | `{ userId, roomId }` |

### Messaging

| Event | Direction | Payload |
|-------|-----------|---------|
| `sendMessage` | Client → Server | `{ chatId, content, senderId, timestamp, status }` |
| `receiveMessage` | Server → Room | `{ _id, chatId, senderId, receiverIds, content, messageType, fileUrl, media, status, replyTo, createdAt }` |
| `message:error` | Server → Client | `{ error }` |
| `message-edited` | Server → Room | `{ messageId, content, editedAt }` |

### Typing

| Event | Direction | Payload |
|-------|-----------|---------|
| `Typing` | Client → Server | `{ chatId, senderId }` |
| `typing` | Server → Room (excl. sender) | `{ chatId, senderId }` |
| `Stop-typing` | Client → Server | `{ chatId, senderId }` |
| `stop-typing` | Server → Room (excl. sender) | `{ chatId, senderId }` |

### Location

| Event | Direction | Payload |
|-------|-----------|---------|
| `subscribe-to-nearby` | Client → Server | `(userId, radius)` — userId ignored (JWT used) |
| `nearby-users-update` | Server → Client | `[{ _id, name, email, location, status, profilePic }]` (every 30s) |
| `unsubscribe-from-nearby` | Client → Server | *(no payload)* |
| `location-update` | Client → Server | `{ latitude, longitude }` |
| `user-location-updated` | Server → Nearby Users | `{ userId, latitude, longitude, timestamp }` |
| `location:error` | Server → Client | `{ error, details }` |

### Groups

| Event | Direction | Payload |
|-------|-----------|---------|
| `group:create` | Client → Server | `{ name, members: [userIds] }` |
| `group:created` | Server → Members | `{ group, createdBy }` |
| `group:update` | Client → Server | `{ groupId, updates }` |
| `group:updated` | Server → Members | `{ group, updatedBy }` |
| `group:error` | Server → Client | `{ error, details }` |

### Analytics

| Event | Direction | Payload |
|-------|-----------|---------|
| `analytics:request-metrics` | Client → Server | *(none)* |
| `analytics:metrics-updated` | Server → Client | `{ totalUsers, activeUsers, totalMessages, ... }` |
| `analytics:request-user-activity` | Client → Server | `{ days: 7 }` |
| `analytics:user-activity` | Server → Client | `[{ date, registrations, activeUsers }]` |
| `analytics:request-message-stats` | Client → Server | `{ days: 7 }` |
| `analytics:message-stats` | Server → Client | `{ daily: [...], byType: {...} }` |
| `analytics:request-location-stats` | Client → Server | *(none)* |
| `analytics:location-stats` | Server → Client | `{ activeSharers, avgDistance }` |
| `analytics:request-group-stats` | Client → Server | *(none)* |
| `analytics:group-stats` | Server → Client | `{ total, avgSize, activity }` |
| `analytics:error` | Server → Client | `{ error }` |

---

## 17. Error Responses

### Standard Error Format
```json
{ "success": false, "error": "Error message", "message": "Human-readable details" }
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request — validation failed, missing wards |
| 401 | Unauthorized — missing or invalid JWT |
| 403 | Forbidden — insufficient role, CSRF failure, or HMAC invalid |
| 404 | Not found |
| 409 | Conflict — duplicate resource |
| 429 | Rate limit exceeded (includes `Retry-After` header) |
| 500 | Internal server error |

### Zod Validation Error
```json
{ "error": "Validation failed", "issues": [{ "ward": "email", "message": "Invalid email" }] }
```

---

## 18. Rate Limits

| Scope | Limit | Headers |
|-------|-------|---------|
| General API | 100 / 15 min | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |
| Auth endpoints | 10 / 15 min | Same |
| Forgot password | 3 / hour | Same |
| Analytics | 50 / 15 min | Same |
| Export | 5 / hour | Same |
| Speech (STT/TTS) | 20 / 15 min | Same |

When exceeded:
```json
// 429 Too Many Requests
{ "success": false, "error": "Too many requests", "message": "Rate limit exceeded. Max 10 requests per 15 minutes", "retryAfter": 542 }
```

---

*For system architecture details, see [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md). For setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).*
