# CareConnect – Database Seed Guide

## What the seed script does

`seed-db.js` **clears** and repopulates these MongoDB collections:

| Collection      | Documents | Notes                                                      |
| --------------- | --------- | ---------------------------------------------------------- |
| `users`         | 8         | 1 superadmin · 1 admin · 6 regular users                   |
| `groups`        | 3         | Each with correct `createdBy`, `admins[]`, `members[]`     |
| `chats`         | 6         | 5 direct · 1 group chat; `unreadMessages` Map included     |
| `messages`      | 27        | Correct `chatId`, `receiverIds`, `content`, `status` wards |
| `prescriptions` | 12        | 2 per regular user; correct `ownerId`                      |
| `activitylogs`  | 18        | Correct `actorId`, `actorEmail`, `action`, `entityType`    |

**Demo password for every account: `Demo@1234`**

---

## Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas connection string
- `server/.env` file with `MONGODB_URI` set (see example below)

```env
# server/.env  (minimum required)
MONGODB_URI=mongodb://localhost:27017/MapAndChatCollection
NEXTAUTH_SECRET=your-secret-here
```

---

## Method 1 — Run the seed script (recommended)

Run this from the **project root** (`map_and_chat/`):

```bash
node sample-data/seed-db.js
```

For a full-schema dataset that also seeds events, visits, media, and push subscriptions:

```bash
node sample-data/seed-db-full.js
```

The scripts use ES Modules (`import`). Make sure `server/package.json`
has `"type": "module"` (it already does).

Expected output:

```
🌱  CareConnect – seeding database …

✓  Connected to MongoDB
   users        : 8 inserted
   groups       : 3 inserted
   prescriptions        : 12 inserted
   messages     : 27 inserted
   chats        : 6 inserted
   activitylogs : 18 inserted

✅  Seeding complete!
────────────────────────────────────────
Demo login credentials (all accounts):
  Password : Demo@1234
  Accounts :
    superadmin@careconnect.io  (superadmin)
    admin@careconnect.io       (admin)
    alice.nguyen@example.com  (user)
    ...
────────────────────────────────────────

✓  Disconnected
```

---

## Method 2 — `mongoimport` (JSON files only)

The `sample-data/` folder also contains standalone JSON files (`users.json`,
`messages.json`, etc.). You can import them individually with `mongoimport`.

```bash
# Example – import users
mongoimport \
  --uri "mongodb://localhost:27017/MapAndChatCollection" \
  --collection users \
  --file sample-data/users.json \
  --jsonArray \
  --drop
```

> ⚠ `mongoimport` does **not** hash passwords and does not cross-link
> ObjectIds the way the seed script does. Use Method 1 for a fully wired
> dataset.

---

## Method 3 — MongoDB Atlas

1. Open **Atlas → Database → Browse Collections → Load Sample Dataset**
   (gives you generic data, not this app's schema).

2. **Or** use the seed script with an Atlas URI:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/MapAndChatCollection
```

Then run `node sample-data/seed-db.js` as usual.

---

## Demo accounts quick reference

| Email                     | Password  | Role       |
| ------------------------- | --------- | ---------- |
| superadmin@careconnect.io | Demo@1234 | superadmin |
| admin@careconnect.io      | Demo@1234 | admin      |
| alice.nguyen@example.com  | Demo@1234 | user       |
| bob.okafor@example.com    | Demo@1234 | user       |
| carol.reyes@example.com   | Demo@1234 | user       |
| dan.petrov@example.com    | Demo@1234 | user       |
| eve.kim@example.com       | Demo@1234 | user       |
| frank.adebayo@example.com | Demo@1234 | user       |

---

## Troubleshooting

| Error                                           | Fix                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `MONGODB_URI not found`                         | Create/check `server/.env`                                          |
| `Cannot find module '../server/src/models/...'` | Run from project root, not from `sample-data/`                      |
| `MongoServerError: E11000 (duplicate key)`      | Script already ran; it clears collections automatically on next run |
| `SyntaxError: Cannot use import statement`      | Make sure `server/package.json` has `"type": "module"`              |
