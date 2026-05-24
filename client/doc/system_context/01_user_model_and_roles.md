# User Model and Roles

## Overview

Every person in CareConnect is a **User** document in MongoDB. A single `User` model handles all five roles. Role-specific sub-documents (`doctorProfile`, `pharmacyProfile`) are conditionally populated at signup and stored inline on the same document.

---

## Mongoose Schema — `server/src/models/userModel.js`

### Core Identity Fields

```js
name:   { type: String, required: true, trim: true }
email:  { type: String, required: true, unique: true, lowercase: true }
phone:  { type: String, trim: true, default: "" }
gender: { type: String, enum: ["male", "female", "other", ""] }
age:    { type: Number, min: 0 }
dob:    { type: Date }
bio:    { type: String, maxlength: 500 }
```

### Address

```js
address: {
  street, city, state, country, zipCode  // all String, optional
}
```

### Roles

```js
roles: {
  type: String,
  enum: ["patient", "doctor", "admin", "superadmin", "pharmacy"],
  default: "patient"
}
```

> **Important**: `roles` is stored as a **single string**, not an array. The field is named `roles` for historical reasons. Helper utilities (`coerceRoles`, `inferRole`) always normalize it to an array internally before comparison.

### Status and Location

```js
status:   { type: String, enum: ["online", "offline"], default: "offline" }
lastSeen: { type: Date }

location: {
  type:        { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], default: [0, 0] }  // [longitude, latitude]
}
```

The `location.coordinates` field uses MongoDB GeoJSON format: **[longitude, latitude]**. A `2dsphere` index is applied for geospatial queries.

### Profile Picture

```js
profilePic: {
  cloudinaryId: String,
  thumbnail: String,   // ~50px  URL
  small:     String,   // ~150px URL
  medium:    String,   // ~400px URL
  large:     String,   // ~800px URL
}
```

The `getProfilePicUrl(user, size)` utility on the client selects the appropriate variant.

### Authentication & Security

```js
password:                  String   // bcrypt hash, omitted from responses
emailVerified:             { type: Boolean, default: false }
emailVerificationToken:    String
resetPasswordToken:        String
resetPasswordTokenExpiry:  Date
loginAttempts:             { type: Number, default: 0 }
lockUntil:                 Date     // null = not locked
socialAccounts:            [{ provider, id, email }]
```

**Account lockout**: After 5 failed login attempts, `lockUntil` is set to `Date.now() + 15 minutes`. Locked accounts receive a 403 response without any token.

### Social/Friend Graph

```js
friends:        [{ type: ObjectId, ref: "User" }]
friendRequests: [{
  sender: ObjectId,
  status: { type: String, enum: ["pending", "accepted", "rejected"] }
}]
chats:  [ObjectId]   // Chat IDs this user participates in
groups: [ObjectId]   // Group IDs
```

### User Settings

```js
settings: {
  chatNotifications:    { type: Boolean, default: true }
  showReadReceipts:     { type: Boolean, default: true }
  allowMessagesFrom:    { type: String, enum: ["everyone","friends","no one"], default: "everyone" }
  locationSharing:      { type: Boolean, default: false }
  visibleRange:         { type: Number, default: 10 }   // km
  pushNotifications:    { type: Boolean, default: true }
}
accountType: { type: String, enum: ["public","limited","private"], default: "public" }
```

---

## Role-Specific Sub-Documents

### `doctorProfile` — set when `roles === "doctor"`

```js
doctorProfile: {
  specialty:       String      // e.g. "Cardiology"
  licenseNumber:   String
  experience:      Number      // years
  availableDays:   [String]    // e.g. ["Monday", "Wednesday"]
  availableFrom:   String      // "09:00"
  availableTo:     String      // "17:00"
  consultationFee: Number      // in local currency
  verified:        { type: Boolean, default: false }
}
```

`verified: false` means the doctor is not yet visible on the public map. An admin must approve them via `PATCH /api/admin/verify/:userId`.

### `pharmacyProfile` — set when `roles === "pharmacy"`

```js
pharmacyProfile: {
  licenseNumber:   String
  operatingHours: {
    open:  String   // "08:00"
    close: String   // "22:00"
  }
  services: [String]   // e.g. ["24hr", "delivery", "compounding"]
  verified: { type: Boolean, default: false }
}
```

### `ratingSummary` — denormalized rating cache (doctors and pharmacies)

```js
ratingSummary: {
  averageRating: { type: Number, default: 0 }
  totalRatings:  { type: Number, default: 0 }
}
```

This is recomputed by the rating controller every time a rating is submitted or deleted, using a MongoDB `$group` aggregation. It is stored here for fast reads on the map without needing a join.

---

## Role Priority and Inference

```js
// client/src/utils/roleUtils.js

export function inferRole(roles) {
  const arr = coerceRoles(roles);
  if (arr.some(r => r === "admin" || r === "superadmin")) return "admin";
  if (arr.some(r => r === "doctor"))   return "doctor";
  if (arr.some(r => r === "pharmacy")) return "pharmacy";
  return "patient";
}
```

The priority order is: **admin > doctor > pharmacy > patient**.

Helper booleans: `isAdmin(roles)`, `isDoctor(roles)`, `isPharmacy(roles)`, `isPatient(roles)`.

`coerceRoles(roles)` normalizes any input (null / string / array) to a string array: `["patient"]`, `["doctor"]`, etc.

---

## Signup — Role Assignment

**Allowed signup roles**: `["patient", "doctor", "pharmacy"]`. Admin roles cannot be self-assigned; they must be set by an existing admin.

```
POST /api/users
Body: {
  name, email, password,
  roles: "doctor",               // optional, defaults to "patient"
  doctorProfile: { specialty, licenseNumber },   // if roles === "doctor"
  pharmacyProfile: { licenseNumber, operatingHours }  // if roles === "pharmacy"
}
```

The `userController.createUser` handler:
1. Validates email uniqueness (409 Conflict if taken)
2. Hashes password with bcrypt
3. Sets `emailVerified: false` for credential accounts
4. Saves `doctorProfile.verified: false` or `pharmacyProfile.verified: false`
5. Returns created user (password field excluded)

---

## MongoDB Indexes

| Index | Field | Type | Purpose |
|-------|-------|------|---------|
| Geospatial | `location.coordinates` | 2dsphere | Nearby users queries |
| Status | `status` | ascending | Filter online users |
| Role | `roles` | ascending | Role-based queries |
| Location sharing | `settings.locationSharing` | ascending | Map visibility filter |
| Doctor verified | `doctorProfile.verified` | ascending | Admin verification queries |
| Pharmacy verified | `pharmacyProfile.verified` | ascending | Admin verification queries |
| Compound | `roles + settings.locationSharing` | compound | Efficient nearby user lookup |

---

## Key Invariants

1. `roles` is a **string**, not an array — always run through `coerceRoles()` before comparison
2. `location.coordinates` order is **[longitude, latitude]** (GeoJSON), not [lat, lon]
3. Doctors and pharmacies with `verified: false` are excluded from map results and should be treated as invisible to patients
4. `ratingSummary` is a **denormalized cache** — the source of truth is the `Rating` collection
5. Passwords are **never** returned in API responses (`.select("-password")` is applied)
