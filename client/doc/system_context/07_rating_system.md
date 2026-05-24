# Rating System

## Overview

CareConnect allows patients to rate doctors and pharmacies on a 1–5 star scale with an optional comment. Ratings are stored in a dedicated `Rating` collection. After each rating write, the system recomputes the average and stores it denormalized on the `User` document (`ratingSummary`) for fast display on the map and sidebar without joins.

---

## Rating Schema (`server/src/models/ratingModel.js`)

```js
{
  ratedUserId:   { type: ObjectId, ref: "User", required: true, index: true },
  raterUserId:   { type: ObjectId, ref: "User", required: true },
  score:         { type: Number, min: 1, max: 5, required: true },
  comment:       { type: String, trim: true, maxlength: 500, default: "" },
  ratedUserRole: { type: String, enum: ["doctor", "pharmacy"], required: true },
  createdAt, updatedAt
}

// Constraint: one rating per rater-ratee pair
ratingSchema.index({ ratedUserId: 1, raterUserId: 1 }, { unique: true });
```

---

## Business Rules

| Rule | Implementation |
|------|---------------|
| Only patients can submit ratings | Controller checks `req.user.roles === "patient"` |
| Only doctors and pharmacies can be rated | Controller checks target user's `roles` |
| Users cannot rate themselves | Controller checks `ratedUserId !== raterUserId` |
| One rating per patient-professional pair | Unique compound index → upsert on submit |
| Rating must be 1–5 | Mongoose min/max + controller validation |
| Comment max 500 chars | Mongoose maxlength |

---

## REST API

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/ratings` | Patient | Submit or update a rating (upsert) |
| `GET` | `/api/ratings/:userId` | Public | Get paginated ratings for a user |
| `GET` | `/api/ratings/my/:userId` | Authenticated | Get current user's rating for a specific user |
| `DELETE` | `/api/ratings/:id` | Patient or Admin | Delete a rating |

---

## Submit Rating — Upsert Flow

```js
// ratingController.submitRating (pseudocode)

1. Validate score is between 1 and 5
2. Fetch target user → confirm roles is "doctor" or "pharmacy"
3. Confirm raterUserId !== ratedUserId
4. Upsert rating:
   Rating.findOneAndUpdate(
     { ratedUserId, raterUserId },
     { $set: { score, comment, ratedUserRole } },
     { upsert: true, new: true }
   )
5. Call recalculateSummary(ratedUserId) ← recomputes averageRating + totalRatings
6. Return updated rating
```

### `recalculateSummary(userId)` — Aggregation

```js
const result = await Rating.aggregate([
  { $match: { ratedUserId: new ObjectId(userId) } },
  { $group: {
    _id: null,
    averageRating: { $avg: "$score" },
    totalRatings:  { $sum: 1 }
  }}
]);

await User.findByIdAndUpdate(userId, {
  "ratingSummary.averageRating": result[0]?.averageRating || 0,
  "ratingSummary.totalRatings":  result[0]?.totalRatings  || 0
});
```

This runs every time a rating is submitted or deleted — it is synchronous within the request cycle, so `ratingSummary` is always up-to-date.

---

## Frontend Components

### `RatingSummary` (`client/src/components/Rating/RatingSummary.jsx`)

Displays the rating panel for a given user (doctor or pharmacy). Used on:
- The profile page (shows the logged-in doctor's/pharmacy's own ratings)
- Can be embedded anywhere a `targetUser` is available

Features:
- Average star rating display (shows `—` if no ratings)
- "Rate this Doctor / Rate this Pharmacy" button (only for eligible patients)
- "Your rating" banner showing current patient's own rating
- Paginated list of all ratings with reviewer avatar, name, date, comment
- Pagination (5 per page)

**Visibility logic**:
```js
const canRate = ["doctor", "pharmacy"].includes(targetRole)
  && currentUserRole === "patient"
  && targetUser._id !== currentUser._id;
```

### `RateUserDialog` (`client/src/components/Rating/RateUserDialog.jsx`)

MUI Dialog opened by the "Rate" button. Contains:
- Doctor/Pharmacy identity card (avatar, name, role chip)
- MUI `<Rating>` component (1–5 stars, hover labels)
- Comment textarea (500 char limit)
- Pre-fills values if the patient has already rated this user
- On submit: dispatches `submitRating` Redux thunk

---

## Redux State — Ratings

```js
// ratingSlice
{
  ratings:     [],      // paginated list of ratings for the current target
  myRating:    null,    // current user's rating for the target (or null)
  total:       0,       // total rating count for pagination
  loading:     false,
  submitting:  false,
  error:       null
}
```

### Key Thunks (`client/src/utils/redux/thunks/ratingThunks.js`)

| Thunk | Action |
|-------|--------|
| `fetchUserRatings({ userId, page, limit })` | Load paginated ratings for a user |
| `fetchMyRating(userId)` | Load current user's rating for a target |
| `submitRating({ ratedUserId, score, comment })` | Upsert a rating |
| `deleteRating(ratingId)` | Delete a rating (own or admin) |

After `submitRating` succeeds, the slice optimistically updates `myRating` and `ratings` in local state.

---

## Map Integration

The `ratingSummary` is included in the nearby users response (`/api/location/nearby`). This allows the map sidebar and popup to display ratings without any additional API call:

```js
// In UserPopupContent (map popup)
{hasRating && (
  <Stack direction="row" spacing={0.5}>
    <StarIcon sx={{ color: "warning.main" }} />
    <Typography>{user.ratingSummary.averageRating.toFixed(1)}</Typography>
    <Typography color="text.secondary">
      ({user.ratingSummary.totalRatings} ratings)
    </Typography>
  </Stack>
)}
```

---

## Delete Rating

A patient can delete their own rating. Admins can delete any rating.

```js
// ratingController.deleteRating
1. Fetch rating by ID
2. Confirm ownership: rating.raterUserId === req.user.userId OR admin
3. Delete rating
4. Call recalculateSummary(rating.ratedUserId) ← keeps average accurate
```

---

## Key Invariants

1. The unique compound index `(ratedUserId, raterUserId)` ensures one rating per pair — submitting again updates the existing rating (upsert)
2. `ratingSummary` on the User document is always recomputed after any rating change — never edited manually
3. If all ratings are deleted, `ratingSummary` resets to `{ averageRating: 0, totalRatings: 0 }`
4. The public `GET /api/ratings/:userId` endpoint requires no authentication — anyone can read ratings
5. `ratedUserRole` is stored on each Rating document for analytics (can query ratings by professional type)
