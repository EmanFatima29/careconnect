# Phase 3 — Rating System
**Status: PENDING**
**Depends on: Phase 1 (pharmacy role + ratingSummary field)**
**Priority: Critical**

---

## Goal

Any patient can rate a **doctor** or a **pharmacy** with 1–5 stars and an optional comment. Ratings are averaged and displayed on the user's profile page and on the map popup.

---

## Current State

- No rating model, controller, routes, Redux slice, or UI exists.
- `userModel.js` will have `ratingSummary` after Phase 1 — this phase populates it.
- Map popup has a placeholder for showing rating (added in Phase 2) — this phase wires the data.

---

## Tasks

### 3.1 — Rating Model

**File to create:** `server/src/models/ratingModel.js`

```js
const ratingSchema = new mongoose.Schema({
  ratedUserId:   { type: ObjectId, ref: "User", required: true, index: true },  // doctor or pharmacy
  raterUserId:   { type: ObjectId, ref: "User", required: true },               // patient
  score:         { type: Number, min: 1, max: 5, required: true },
  comment:       { type: String, maxlength: 500, default: "" },
  ratedUserRole: { type: String, enum: ["doctor", "pharmacy"], required: true },
}, { timestamps: true });

// One rating per patient-doctor and patient-pharmacy pair
ratingSchema.index({ ratedUserId: 1, raterUserId: 1 }, { unique: true });
```

### 3.2 — Rating Controller

**File to create:** `server/src/controllers/ratingController.js`

Endpoints:
- `POST /api/ratings` — submit or update a rating (patient only; target must be doctor or pharmacy)
- `GET /api/ratings/:userId` — get all ratings for a user (with pagination)
- `GET /api/ratings/my/:userId` — get the current user's rating for a specific user
- `DELETE /api/ratings/:id` — delete own rating

Logic for `POST`:
1. Verify current user is a patient (or any non-admin, non-self user).
2. Verify target user is a doctor or pharmacy.
3. Upsert the rating (allow updates within 30 days of last rating).
4. Recalculate and update `ratingSummary.averageRating` and `ratingSummary.totalRatings` on the target user using aggregation.

```js
const agg = await Rating.aggregate([
  { $match: { ratedUserId: mongoose.Types.ObjectId(targetId) } },
  { $group: { _id: null, avg: { $avg: "$score" }, count: { $sum: 1 } } },
]);
await User.updateOne(
  { _id: targetId },
  { "ratingSummary.averageRating": agg[0]?.avg || 0,
    "ratingSummary.totalRatings":  agg[0]?.count || 0 }
);
```

### 3.3 — Rating Routes

**File to create:** `server/src/routes/ratingRoutes.js`

```
POST   /api/ratings          → submitRating     (auth required)
GET    /api/ratings/:userId   → getUserRatings   (public)
GET    /api/ratings/my/:userId → getMyRating     (auth required)
DELETE /api/ratings/:id       → deleteRating     (auth required, own rating only)
```

Register in server entry point (`server.js` / `app.js`).

### 3.4 — Rating Redux Slice

**File to create:** `client/src/utils/redux/ratingSlice.js`

State shape:
```js
{
  ratings: [],          // ratings for currently viewed profile
  myRating: null,       // current user's rating for the viewed profile
  loading: false,
  error: null,
}
```

Thunks (in `client/src/utils/redux/thunks/ratingThunks.js`):
- `fetchUserRatings(userId)` — GET ratings for a profile
- `submitRating({ ratedUserId, score, comment })` — POST/PUT
- `fetchMyRating(userId)` — GET own rating for a user
- `deleteRating(ratingId)` — DELETE

Register in `store.js`.

### 3.5 — Rating API Client

**File to create:** `client/src/lib/ratingApi.js`

Thin API wrappers calling the backend rating endpoints.

### 3.6 — Star Rating Component

**File to create:** `client/src/components/Rating/StarRating.jsx`

Interactive 1–5 star component using MUI Rating:
```jsx
import Rating from "@mui/material/Rating";

export function StarRating({ value, onChange, readOnly, size = "small" }) {
  return (
    <Rating
      value={value}
      onChange={(_, v) => onChange?.(v)}
      readOnly={readOnly}
      size={size}
      precision={0.5}
    />
  );
}
```

### 3.7 — Rate User Dialog

**File to create:** `client/src/components/Rating/RateUserDialog.jsx`

A MUI Dialog that:
- Shows the target user's name and current average rating.
- Contains a `StarRating` component.
- Has an optional comment text field (max 500 chars).
- Submit button calls `submitRating` thunk.
- Shows "Update Rating" if the user has already rated.

Triggered from:
- Map popup "Rate" button (Phase 2).
- Profile page "Rate this Doctor/Pharmacy" button (Phase 3.8).

### 3.8 — Profile Page: Rating Section

**File to modify:** `client/src/app/profile/page.js`

For doctor and pharmacy profiles viewed by a patient:
- Show average star rating with total count: `★ 4.3 (28 ratings)`.
- Show "Rate this Doctor/Pharmacy" button → opens `RateUserDialog`.
- Show a list of recent reviews (reviewer name, score, comment, date).
- Own profile: show received ratings in read-only mode.

### 3.9 — Map Popup: Rate Button

**File to modify:** `client/src/components/Map/MapSubComponents.jsx` (UserPopupContent)

For doctor/pharmacy markers viewed by a patient:
- Add "Rate" button below the Chat button.
- Clicking opens `RateUserDialog` inline or navigates to profile with `#rating` anchor.

---

## Files to Create

| File | Purpose |
|------|---------|
| `server/src/models/ratingModel.js` | Rating schema |
| `server/src/controllers/ratingController.js` | Rating CRUD + aggregation |
| `server/src/routes/ratingRoutes.js` | Rating endpoints |
| `client/src/utils/redux/ratingSlice.js` | Rating Redux state |
| `client/src/utils/redux/thunks/ratingThunks.js` | Rating thunks |
| `client/src/lib/ratingApi.js` | Rating API client |
| `client/src/components/Rating/StarRating.jsx` | Star rating widget |
| `client/src/components/Rating/RateUserDialog.jsx` | Rating submission dialog |

## Files to Modify

| File | Change |
|------|--------|
| `client/src/app/profile/page.js` | Add rating section |
| `client/src/components/Map/MapSubComponents.jsx` | Add Rate button in popup |
| `client/src/utils/redux/store.js` | Register ratingSlice |
| Server entry point | Register ratingRoutes |

---

## Acceptance Criteria

- [ ] Patient can rate a doctor (1–5 stars + optional comment)
- [ ] Patient can rate a pharmacy (1–5 stars + optional comment)
- [ ] Rating is stored with unique constraint (one rating per patient-doctor pair)
- [ ] Patient can update their existing rating
- [ ] `ratingSummary` on User document updates after every submit
- [ ] Average rating and total count shown on profile page
- [ ] Average rating shown on map popup (star icon + number)
- [ ] Doctors and pharmacies cannot rate themselves
- [ ] Patients cannot rate other patients
- [ ] Admin can delete any rating
