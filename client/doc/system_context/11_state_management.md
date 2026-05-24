# State Management (Redux)

## Overview

CareConnect uses **Redux Toolkit** for global client state, combined with **redux-persist** to cache selected slices in `localStorage` between page reloads. All async server interactions go through Redux async thunks, which follow a consistent pattern across the codebase.

---

## Store Configuration (`client/src/utils/redux/store.js`)

```js
const rootReducer = combineReducers({
  layout:       layoutReducer,       // sidebar open/closed, theme preference
  user:         userReducer,         // currentUser, allUsers, loading, error
  chat:         chatReducer,         // chats list, currentChat
  message:      messageReducer,      // messages for current chat
  group:        groupReducer,        // groups, nearbyUsers (for map)
  analytics:    analyticsReducer,    // analytics charts data
  prescription: prescriptionReducer, // prescriptions array
  admin:        adminReducer,        // admin stats, logs
  friend:       friendReducer,       // friends, friendRequests
  notification: notificationReducer, // notification list
  rating:       ratingReducer,       // ratings, myRating, total
  appointment:  appointmentReducer,  // appointments array
});
```

### Persistence Configuration

```js
const persistConfig = {
  key: "careconnect",
  storage: localStorage,
  whitelist: ["user", "chat", "prescription", "group", "friend", "layout"],
  // Excluded: message, analytics, admin, notification, rating, appointment
};
```

**Persisted** (survive page refresh):
- `user` — current user profile and users list (avoids re-fetch on every page)
- `chat` — chat list (avoids flash on navigation)
- `prescription` — prescription list
- `group` / `friend` — social graph
- `layout` — sidebar state, theme toggle

**Not persisted** (fetched fresh every session):
- `message` — too large, changes frequently
- `admin` — admin stats are time-sensitive
- `analytics` — large data, always needs fresh data
- `notification` — real-time state
- `rating` — context-specific (per target user)
- `appointment` — always fresh to avoid stale status

---

## Slice Reference

### `userSlice`

```js
{
  currentUser:  null | UserObject,   // the logged-in user's profile
  allUsers:     [],                  // all users (loaded for admin/map)
  loading:      false,
  error:        null
}
```

Key thunks: `fetchCurrentUser()`, `fetchAllUsers()`, `updateUserProfile(data)`

### `chatSlice`

```js
{
  chats:        [],     // Chat[] for current user
  currentChat:  null,   // active chat being viewed
  loading:      false,
  error:        null
}
```

Key thunks: `fetchChats()`, `getOrCreateChat(userId)`

### `messageSlice`

```js
{
  messages: [],      // Message[] for currentChat
  loading:  false,
  hasMore:  true     // pagination flag
}
```

Key thunks: `fetchMessages(chatId)`, `sendMessage(payload)`

### `prescriptionSlice`

```js
{
  prescriptions: [],
  loading:       false,
  error:         null
}
```

Key thunks: `fetchPrescriptions()`, `createPrescription(data)`, `updatePrescription({ id, data })`, `deletePrescription(id)`

### `groupSlice`

```js
{
  groups:      [],      // groups the user belongs to
  nearbyUsers: [],      // users near current location (for map)
  userLocation: null,   // current user's [lat, lng]
  loading:     false
}
```

Key thunks: `fetchGroups()`, `updateUserLocation(coords)`, `getNearbyUsers(radius)`

### `adminSlice`

```js
{
  userStats:         null,
  prescriptionStats: null,
  chatStats:         null,
  activityLogs:      null,
  loading:           false,
  error:             null
}
```

Key thunks: `fetchUserStats()`, `fetchPrescriptionStats()`, `fetchChatStats()`, `fetchActivityLogs({ limit })`

### `ratingSlice`

```js
{
  ratings:    [],     // paginated ratings for target user
  myRating:   null,   // current user's rating for target
  total:      0,
  loading:    false,
  submitting: false,
  error:      null
}
```

Key thunks: `fetchUserRatings({ userId, page, limit })`, `fetchMyRating(userId)`, `submitRating(payload)`, `deleteRating(id)`

`clearRatings()` action: resets slice to initial state when navigating away from a profile.

### `appointmentSlice`

```js
{
  appointments: [],
  total:        0,
  loading:      false,
  submitting:   false,
  error:        null
}
```

Key thunks: `fetchMyAppointments(params)`, `bookAppointment(payload)`, `updateAppointmentStatus({ id, status, cancelReason })`

### `friendSlice`

```js
{
  friends:        [],
  friendRequests: [],
  loading:        false,
  error:          null
}
```

Key thunks: `fetchFriends()`, `sendFriendRequest(userId)`, `respondToRequest({ requestId, action })`

### `notificationSlice`

```js
{
  notifications: [],
  unreadCount:   0,
  loading:       false
}
```

Key thunks: `fetchNotifications()`, `markNotificationRead(id)`

### `layoutSlice`

```js
{
  sidebarOpen: true,
  darkMode:    false   // also managed by ThemeContext
}
```

Actions: `setSidebarOpen(bool)`, `toggleDarkMode()`

---

## Thunk Pattern

All async thunks follow this consistent pattern:

```js
// Example: fetchMyAppointments
export const fetchMyAppointments = createAsyncThunk(
  "appointment/fetchMy",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await apiGetMyAppointments(params);   // thin API wrapper
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);
```

All API wrappers (`client/src/lib/*.js`) follow this pattern:

```js
async function apiGetMyAppointments(params) {
  const session = await getSession();
  const headers = session?.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};
  const { data } = await axios.get(`${base}/api/appointments`, { headers, params, withCredentials: true });
  return data;
}
```

---

## Extra Reducers Pattern

Each slice handles the three async states:

```js
builder
  .addCase(fetchMyAppointments.pending,   (s) => { s.loading = true; s.error = null; })
  .addCase(fetchMyAppointments.fulfilled, (s, a) => {
    s.loading = false;
    s.appointments = a.payload.appointments;
    s.total = a.payload.total;
  })
  .addCase(fetchMyAppointments.rejected,  (s, a) => {
    s.loading = false;
    s.error = a.payload || a.error.message;
  });
```

---

## Providers (`client/src/app/Providers.jsx`)

The root layout wraps the entire app in:

```jsx
<SessionProvider>     // NextAuth session context
  <ReduxProvider store={persistedStore}>  // Redux + redux-persist
    <PersistGate loading={null} persistor={persistor}>
      <ThemeProvider>  // MUI theme + dark mode
        {children}
      </ThemeProvider>
    </PersistGate>
  </ReduxProvider>
</SessionProvider>
```

`PersistGate` delays rendering until the persisted state has been rehydrated from localStorage.

---

## Key Invariants

1. **Never mutate state directly** — all state updates go through slice reducers or Immer-powered `createSlice`
2. **`rejectWithValue`** — always used in thunks to pass error messages to the rejected handler (avoids serialization issues with Error objects)
3. **Optimistic updates** — `bookAppointment`, `submitRating` prepend/update local state immediately on success, before the next fetch
4. **`clearRatings()`** — must be called when navigating away from a user's profile to reset stale rating data
5. **Persisted slices** — when the persisted state is stale (e.g., after server data changes), components dispatch thunks with `{ force: true }` to bypass cache
6. **SSR-safe storage** — a no-op storage implementation is used server-side to prevent localStorage access during Next.js SSR
