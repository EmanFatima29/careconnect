# Authentication System

## Overview

CareConnect uses a **dual-layer authentication** system:

1. **NextAuth.js** — manages the client-side session (cookie-based), handles the login/logout lifecycle and OAuth
2. **Custom JWT middleware** — validates Bearer tokens on every backend API request

Both layers share the same `NEXTAUTH_SECRET` for JWT signing, so a token issued by NextAuth can be verified directly by the Express server.

---

## Authentication Flow

### Credential Login (Email + Password)

```
1. User submits /login form
   ↓
2. NextAuth CredentialsProvider.authorize() is called
   ↓
3. authorize() makes an internal server call:
   POST /api/users  (with INTERNAL_API_KEY header)
   → server validates password, checks lockout, returns user JSON
   ↓
4. NextAuth issues a signed session JWT stored in an HttpOnly cookie
   (Cookie name: next-auth.session-token)
   ↓
5. Client receives session via useSession() or getSession()
   → session.user = { id, name, email, roles, accessToken, ... }
   ↓
6. API calls attach the accessToken as Bearer:
   Authorization: Bearer <accessToken>
```

### OAuth Login (Google, etc.)

```
1. User clicks "Sign in with Google"
   ↓
2. NextAuth redirects to Google OAuth
   ↓
3. Google redirects back with authorization code
   ↓
4. NextAuth exchanges code for profile
   ↓
5. NextAuth upserts user in the backend (social account + emailVerified: true)
   ↓
6. Session issued — same flow as credential login from step 4
```

---

## Backend Auth Middleware — `server/src/middleware/auth.js`

### `authenticate` (alias: `verifyToken`, `requireAuth`)

This is the primary auth guard applied to all protected routes.

```js
// Pseudocode of the middleware
async function authenticate(req, res, next) {
  // 1. Try Bearer token from Authorization header
  const token = req.headers.authorization?.split(" ")[1];

  // 2. Fallback: NextAuth session cookie
  if (!token) {
    token = decodeNextAuthCookie(req.cookies["next-auth.session-token"]);
  }

  if (!token) return res.status(401).json({ error: "No token" });

  // 3. Check token blacklist (Redis — for logged-out tokens)
  if (await isBlacklisted(token)) return res.status(401).json({ error: "Token revoked" });

  // 4. Verify JWT signature + expiry
  const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);

  // 5. Attach user info to req
  req.user = {
    userId: decoded.id || decoded.sub,
    roles:  decoded.roles || "patient",
    email:  decoded.email,
  };

  next();
}
```

### `requireAdmin`

Called after `authenticate`. Checks that `req.user.roles` is `"admin"` or `"superadmin"`.

```js
function requireAdmin(req, res, next) {
  const roles = normalizeRoles(req.user?.roles);
  if (!isAdminRoles(roles)) return res.status(403).json({ error: "Admin access required" });
  next();
}
```

### `normalizeRoles(roles)`

Converts any roles value to a consistent array:
- `null` → `["patient"]`
- `"doctor"` → `["doctor"]`
- `["admin"]` → `["admin"]`

---

## CSRF Protection — `server/src/middleware/csrf.js`

Uses the **double-submit cookie pattern**:

| Aspect | Detail |
|--------|--------|
| Cookie | `_csrf` (HttpOnly: false, so JS can read it) |
| Header | `X-CSRF-Token` (client must send this on mutations) |
| Applies to | POST, PUT, PATCH, DELETE |
| Exempt | GET, HEAD, OPTIONS |
| Exempt | Requests with Bearer token (JWT is CSRF-immune by design) |
| Exempt | Requests with `INTERNAL_API_KEY` header |
| Exempt | `navigator.sendBeacon` calls |

When a CSRF token doesn't exist yet, the server sets a random 32-byte hex cookie with a 24-hour TTL.

**Why Bearer is exempt**: CSRF attacks rely on the browser automatically sending cookies. A Bearer token in the `Authorization` header cannot be set by a cross-origin form, so it's inherently CSRF-safe.

---

## Session Object (Client Side)

After login, `useSession()` returns:

```js
session = {
  user: {
    id:          "64abc...",       // MongoDB _id
    name:        "Dr. Smith",
    email:       "dr@example.com",
    roles:       "doctor",
    image:       "https://...",    // profile pic URL
    accessToken: "eyJ...",         // JWT for API calls
    emailVerified: true,
  },
  expires: "2026-06-23T..."
}
```

The `accessToken` inside the session is passed to all API calls:

```js
// Pattern used throughout all thunks and API wrappers
const session = await getSession();
const headers = session?.accessToken
  ? { Authorization: `Bearer ${session.accessToken}` }
  : {};
```

---

## Email Verification

New credential accounts start with `emailVerified: false`. The server sends a verification email with a signed token. The user clicks the link → `GET /api/users/verify-email?token=...` → sets `emailVerified: true`.

Social accounts (OAuth) bypass this — they are auto-verified on creation.

---

## Password Policy and Account Lockout

**Password regex** (enforced at signup and password change):
```
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/
```
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (`!@#$%^&*`)

**Account lockout**:
- After 5 failed attempts: `lockUntil = Date.now() + 15 minutes`
- During lockout: all login attempts return 403 with lock expiry time
- On success: `loginAttempts` resets to 0, `lockUntil` cleared

---

## Logout

```
POST /api/users/logout
Authorization: Bearer <token>
```

The server adds the token to the Redis blacklist (TTL = token remaining lifetime). All subsequent requests with that token receive 401.

On the client, `next-auth/react` `signOut()` clears the session cookie and redirects to `/login`.

---

## Internal API Key

NextAuth's CredentialsProvider needs to call the backend to validate credentials. Rather than using a user JWT (which doesn't exist yet during login), it uses a shared secret:

```
Header: x-internal-api-key: <INTERNAL_API_KEY>
```

The `allowInternalOrAuthenticated()` middleware on `userRoutes` accepts either this key or a valid Bearer token.

---

## Token Lifecycle

```
[Issue]   → NextAuth signs JWT on successful login
[Use]     → Bearer header on every API request
[Refresh] → NextAuth handles session refresh (configurable TTL)
[Revoke]  → POST /logout → token added to Redis blacklist
[Expire]  → JWT exp claim enforced server-side
```

---

## Key Files

| File | Role |
|------|------|
| `server/src/middleware/auth.js` | Core JWT verification + role checks |
| `server/src/middleware/csrf.js` | CSRF double-submit cookie |
| `client/src/app/api/auth/[...nextauth]/route.js` | NextAuth configuration |
| `client/src/lib/api.js` | Axios instance with auth headers |
| `client/src/utils/redux/thunks/userThunks.js` | Login/logout Redux thunks |
