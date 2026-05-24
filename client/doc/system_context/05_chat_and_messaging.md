# Chat and Messaging System

## Overview

CareConnect provides real-time 1-on-1 and group messaging using Socket.IO. Messages are persisted to MongoDB. The system tracks unread counts per recipient, supports media attachments, voice recordings, and has sentiment analysis integration.

---

## Data Models

### Chat Model

```js
// server/src/models/chatModel.js
{
  participants:    [{ type: ObjectId, ref: "User" }],
  isGroup:         { type: Boolean, default: false },
  groupName:       String,
  groupAdmin:      ObjectId,
  lastMessage:     { type: ObjectId, ref: "Message" },
  unreadMessages:  [{
    userId:  ObjectId,
    count:   Number
  }],
  createdAt, updatedAt
}
```

### Message Model

```js
// server/src/models/messageModel.js
{
  chatId:    { type: ObjectId, ref: "Chat", required: true, index: true },
  sender:    { type: ObjectId, ref: "User", required: true },
  content:   String,
  type:      { type: String, enum: ["text","image","video","audio","file"], default: "text" },
  mediaUrl:  String,          // Cloudinary URL for media messages
  readBy:    [ObjectId],      // Users who have read this message
  sentiment: {
    label:  String,           // "positive", "negative", "neutral"
    score:  Number            // confidence 0–1
  },
  createdAt, updatedAt
}
```

---

## Architecture

```
Sender (Client)
    │
    ├── Socket.IO emit: "sendMessage" { chatId, senderId, content, type, receiverIds }
    │
    ▼
Server: socketHandler.js
    │
    ├── Validate: chatId and senderId are valid ObjectIds
    ├── Confirm: senderId is a participant in chat
    ├── Parse: receiverIds (handles string or array)
    ├── Validate: message type and content
    │
    ├── Save to MongoDB: new Message({ chatId, sender, content, type })
    ├── Update Chat.lastMessage = message._id
    ├── Increment unreadMessages for each receiver
    │
    └── Emit "receiveMessage" to each receiver's room: user_<receiverId>
```

---

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `sendMessage` | `{ chatId, senderId, content, type, receiverIds }` | Send a new message |
| `joinRoom` | `{ roomId }` | Join a Socket.IO room |
| `leaveRoom` | `{ roomId }` | Leave a room |
| `manual-disconnect` | — | Graceful disconnect (updates status to offline) |
| `update-location` | `{ userId, latitude, longitude }` | Broadcast new location |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `receiveMessage` | Message object | New message arrived |
| `location-update` | `{ userId, coordinates }` | Another user moved |
| `user-online` | `{ userId }` | A user came online |
| `user-offline` | `{ userId }` | A user went offline |
| `nearby-users` | `[users]` | Updated list of nearby users |
| `notification` | Notification object | General notification |

---

## Chat REST API

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/chats` | Get all chats for current user |
| `POST` | `/api/chats` | Create or open a 1-on-1 chat |
| `GET` | `/api/messages/:chatId` | Get message history for a chat |
| `PATCH` | `/api/chats/:chatId/read` | Mark messages as read (clears unread count) |

---

## Unread Count Tracking

When a message is sent:

```js
// socketHandler.js
for (const receiverId of receiverIds) {
  await Chat.updateOne(
    { _id: chatId, "unreadMessages.userId": receiverId },
    { $inc: { "unreadMessages.$.count": 1 } }
  );
}
```

When a user opens a chat:
```js
// PATCH /api/chats/:chatId/read
await Chat.updateOne(
  { _id: chatId, "unreadMessages.userId": currentUserId },
  { $set: { "unreadMessages.$.count": 0 } }
);
```

The unread count badge is displayed in the sidebar next to each chat.

---

## Media Messages

Media files (images, audio) are uploaded to Cloudinary before sending:

```
1. User selects file in ChatWindow
2. Client uploads file → POST /api/media/upload
3. Cloudinary returns secure URL + public_id
4. Client sends socket message with:
   { type: "image", mediaUrl: "https://res.cloudinary.com/...", content: "" }
```

Voice messages are recorded client-side (MediaRecorder API) in `VoiceRecorder.jsx`, converted to blob, uploaded as audio, then sent as type `"audio"`.

---

## Sentiment Analysis

Incoming messages are analyzed for sentiment in real-time (displayed as a subtle indicator in the chat):

- `positive` → green tint
- `negative` → red tint
- `neutral` → no indicator

The sentiment label and score are stored on the Message document (`sentiment.label`, `sentiment.score`).

The `SentimentWidget` on the admin dashboard shows platform-wide sentiment distribution across all recent messages.

---

## Groups

Groups are multi-participant chats with `isGroup: true`. They have:
- A `groupName` and optional avatar
- A `groupAdmin` (creator or promoted member)
- All standard messaging capabilities

Group routes: `GET/POST/PATCH /api/groups`

The groups page (`/groups`) allows creating, joining, and managing groups.

---

## Redux State — Chat and Messages

```js
// store.js slices
chat:    chatSlice     // { chats, currentChat, loading, error }
message: messageSlice  // { messages, loading, hasMore }
```

**Persisted**: `chat` slice (offline caching of chat list)
**Not persisted**: `message` slice (too large, loaded fresh per chat)

### Key thunks

| Thunk | Action |
|-------|--------|
| `fetchChats()` | Load all chats for current user |
| `getOrCreateChat(userId)` | Open or create a 1-on-1 chat |
| `fetchMessages(chatId)` | Load message history |
| `sendMessage(payload)` | REST fallback (Socket.IO is primary) |

---

## `useSocket` Hook (`client/src/utils/hooks/useSocket.js`)

The primary interface for real-time events on the client:

```js
const { on, emit } = useSocket();

// Subscribe to incoming messages
const cleanup = on("receiveMessage", (msg) => {
  dispatch(addMessage(msg));
});

// Emit a message
emit("sendMessage", { chatId, senderId, content, type, receiverIds });
```

`on()` returns a cleanup function — always call it in `useEffect` return to avoid memory leaks.

---

## `allowMessagesFrom` Setting

Users can restrict who can message them:

| Value | Behavior |
|-------|---------|
| `"everyone"` | Any user can initiate a chat |
| `"friends"` | Only friends can message |
| `"no one"` | No new messages accepted |

Enforced in the chat creation controller — attempting to create a chat with a restricted user returns 403.

---

## Key Files

| File | Purpose |
|------|---------|
| `server/lib/socketHandler.js` | All Socket.IO event handlers |
| `server/src/models/chatModel.js` | Chat schema |
| `server/src/models/messageModel.js` | Message schema |
| `server/src/controllers/chatController.js` | REST chat endpoints |
| `server/src/controllers/messageController.js` | REST message endpoints |
| `client/src/components/Chat/Chat.jsx` | Chat container component |
| `client/src/components/Chat/ChatWindow.jsx` | Active conversation view |
| `client/src/lib/socket.js` | Socket.IO client singleton |
| `client/src/utils/hooks/useSocket.js` | React hook for socket events |
