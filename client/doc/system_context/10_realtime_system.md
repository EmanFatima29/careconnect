# Real-Time System (Socket.IO)

## Overview

CareConnect uses Socket.IO for all real-time communication: location broadcasting, chat messages, online/offline status, and notifications. The server maintains one persistent WebSocket connection per authenticated user. The client manages this connection through a singleton socket instance and a `useSocket` React hook.

---

## Connection Architecture

```
Client (browser)
  └── socket.js (singleton Socket.IO client)
         ↑ auth: { token: session.accessToken }
         │
    WebSocket (ws://)
         │
Server (Express HTTP server + Socket.IO server)
  └── lib/socketHandler.js
         ├── JWT auth middleware on connection
         ├── User room: user_<userId>
         └── Event handlers
```

### Server Setup (`server/index.js`)

```js
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

global.io = io;           // accessible anywhere in the server
handleSocket(io);         // registers all event handlers
setupAnalyticsHandlers(io);  // analytics-specific socket events
```

The `global.io` pattern allows any controller or service to emit events without importing Socket.IO directly.

### Client Setup (`client/src/lib/socket.js`)

A singleton is created once and reused across the application:

```js
const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL, {
  auth: { token: accessToken },      // JWT from NextAuth session
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

---

## Authentication on Connect

When a Socket.IO connection is established, the server middleware runs before any event is processed:

```js
// socketHandler.js — auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token"));

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    socket.userId = decoded.id || decoded.sub;
    socket.userRoles = decoded.roles;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});
```

---

## User Rooms

On connection, every authenticated user is automatically joined to their personal room:

```js
socket.join(`user_${socket.userId}`);
```

This room is used as the delivery target for all messages, notifications, and location updates directed at a specific user. A single user can have multiple active sockets (e.g., multiple browser tabs) — all receive the same room events.

---

## Event Reference

### Client → Server

| Event | Payload | Handler |
|-------|---------|---------|
| `sendMessage` | `{ chatId, senderId, content, type, receiverIds }` | Validates, saves message, emits to receivers |
| `joinRoom` | `{ roomId }` | Joins a named Socket.IO room |
| `leaveRoom` | `{ roomId }` | Leaves a named room |
| `manual-disconnect` | — | Updates user status to "offline", clears location |
| `update-location` | `{ userId, latitude, longitude }` | Updates DB, broadcasts to nearby users |
| `subscribe-nearby` | `{ userId, radius }` | Subscribes to nearby user updates |
| `unsubscribe-nearby` | — | Unsubscribes from nearby user stream |

### Server → Client

| Event | Payload | Sent to |
|-------|---------|---------|
| `receiveMessage` | Full message object | `user_<receiverId>` for each recipient |
| `user-online` | `{ userId }` | Broadcast to interested clients |
| `user-offline` | `{ userId }` | Broadcast to interested clients |
| `location-update` | `{ userId, coordinates }` | Nearby users |
| `location-stopped` | `{ userId }` | Nearby users (user stopped sharing) |
| `nearby-users` | Array of nearby user objects | `user_<userId>` |
| `notification` | Notification object | `user_<userId>` |

---

## `sendMessage` — Detailed Handler

The most complex event handler validates thoroughly before any DB write:

```js
socket.on("sendMessage", async (data) => {
  const { chatId, senderId, content, type, receiverIds } = data;

  // 1. Validate ObjectId formats
  if (!isValidObjectId(chatId) || !isValidObjectId(senderId)) {
    return socket.emit("error", { message: "Invalid IDs" });
  }

  // 2. Confirm sender is a participant in this chat
  const chat = await Chat.findById(chatId);
  if (!chat?.participants.map(String).includes(senderId)) {
    return socket.emit("error", { message: "Not a participant" });
  }

  // 3. Parse receivers (handles string or array)
  const receivers = Array.isArray(receiverIds)
    ? receiverIds
    : [receiverIds].filter(Boolean);

  // 4. Validate message type
  const VALID_TYPES = ["text", "image", "video", "audio", "file"];
  if (!VALID_TYPES.includes(type)) {
    return socket.emit("error", { message: "Invalid type" });
  }

  // 5. Save to DB
  const message = await Message.create({ chatId, sender: senderId, content, type });

  // 6. Update chat metadata
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
    $inc: Object.fromEntries(receivers.map(id => [`unreadMessages.${id}`, 1]))
  });

  // 7. Emit to each receiver's room
  receivers.forEach(receiverId => {
    io.to(`user_${receiverId}`).emit("receiveMessage", message);
  });
});
```

---

## Online / Offline Status

### On connect

```js
await User.findByIdAndUpdate(socket.userId, {
  status: "online",
  lastSeen: new Date()
});
io.emit("user-online", { userId: socket.userId });
```

### On disconnect

```js
socket.on("disconnect", async () => {
  await User.findByIdAndUpdate(socket.userId, {
    status: "offline",
    lastSeen: new Date()
  });
  io.emit("user-offline", { userId: socket.userId });
});
```

### `manual-disconnect` event

Used when the user explicitly signs out — triggers the same offline update before the socket closes.

---

## Location Broadcasting Flow

```
1. Client: navigator.geolocation.watchPosition()
2. Client: socket.emit("update-location", { userId, latitude, longitude })
3. Server: locationService.updateUserLocation()
   → db.User.updateOne({ location.coordinates: [lng, lat] })
   → io.to(`user_${userId}`).emit("location-updated", { coordinates })
4. Server: for each nearby user → io.to(`user_<nearbyId>`).emit("nearby-users", updatedList)
```

**Important**: Real-time location updates flow through Socket.IO, but the initial nearby-users fetch on map load goes through REST (`GET /api/location/nearby`).

---

## `useSocket` React Hook (`client/src/utils/hooks/useSocket.js`)

This hook wraps the socket singleton and provides React-friendly `on` and `emit` functions:

```js
const { on, emit } = useSocket();

// Subscribe to an event (auto-cleanup on unmount)
useEffect(() => {
  const cleanup = on("receiveMessage", (msg) => {
    dispatch(addMessage(msg));
  });
  return cleanup;
}, [on, dispatch]);

// Emit an event
emit("sendMessage", { chatId, content, ... });
```

`on()` returns a cleanup function that removes the listener — always return it from `useEffect` to prevent memory leaks and duplicate listeners.

---

## `useLocationSocket` Hook

A specialized hook for the map component that manages the subscribe/unsubscribe lifecycle for nearby users:

```js
const { subscribeToNearby, unsubscribeFromNearby } = useLocationSocket();
```

---

## Analytics Handlers (`server/lib/socketAnalyticsHandler.js`)

A separate handler registered alongside the main socket handler. Processes analytics events (page views, feature usage) emitted from the client and stores aggregated data for the admin analytics dashboard.

---

## Dashboard Real-Time Updates

The dashboard listens for status events to refresh data without a full page reload:

```js
// dashboard/page.js
const cleanupOnline  = on("user-online",  debounce(() => dispatch(fetchAllUsers({ force: true })), 2000));
const cleanupOffline = on("user-offline", debounce(() => dispatch(fetchAllUsers({ force: true })), 2000));
const cleanupMessage = on("receiveMessage", debounce(() => dispatch(fetchChats({ force: true })), 1000));
```

Debouncing prevents rapid-fire refetches when multiple users change status simultaneously.

---

## Key Files

| File | Purpose |
|------|---------|
| `server/lib/socketHandler.js` | All Socket.IO event handlers, user rooms, status updates |
| `server/lib/socketAnalyticsHandler.js` | Analytics socket events |
| `client/src/lib/socket.js` | Singleton Socket.IO client instance |
| `client/src/utils/hooks/useSocket.js` | React hook for socket events |
| `client/src/utils/hooks/useLocationSocket.js` | Location-specific socket hook |

---

## Key Invariants

1. Every authenticated user joins `user_<userId>` on connect — this is the primary delivery channel
2. `global.io` makes the Socket.IO server accessible to any controller without circular imports
3. The socket connection authenticates via JWT (`socket.handshake.auth.token`) — same secret as REST API
4. `manual-disconnect` must be emitted before `signOut()` to ensure offline status is set
5. Location coordinates in socket events use `[longitude, latitude]` order (GeoJSON), consistent with DB storage
