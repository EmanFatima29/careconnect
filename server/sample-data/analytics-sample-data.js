/**
 * Sample Analytics Data for MongoDB
 * Use this file to seed your MongoDB database with test data
 * Location: /sample-data/analytics-sample-data.json
 *
 * Instructions:
 * 1. Install mongoimport (MongoDB tools)
 * 2. For each collection, run:
 *    mongoimport --db map_and_chat --collection <collection_name> --file <file_name>.json
 *
 * Or use MongoDB Compass to import these files
 */

// 📊 SAMPLE USERS DATA
// File: sample-data/users.json
const USERS_DATA = [
  {
    _id: { $oid: "65f1a1b1c2d3e4f5g6h7i8j9" },
    name: "john_anderson",
    email: "john.anderson@example.com",
    phone: "+14155551234",
    status: "online",
    address: {
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      zipCode: "94105",
    },
    gender: "male",
    age: 32,
    location: {
      type: "Point",
      coordinates: [-122.419, 37.775],
      lastSeen: { $date: "2024-02-15T10:30:00Z" },
    },
    createdAt: { $date: "2024-01-10T08:00:00Z" },
    updatedAt: { $date: "2024-02-15T10:30:00Z" },
  },
  {
    _id: { $oid: "65f1a2b1c2d3e4f5g6h7i8j9" },
    name: "sarah_martinez",
    email: "sarah.martinez@example.com",
    phone: "+14155552345",
    status: "online",
    address: {
      street: "456 Oak Ave",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      zipCode: "94107",
    },
    gender: "female",
    age: 28,
    location: {
      type: "Point",
      coordinates: [-122.408, 37.783],
      lastSeen: { $date: "2024-02-15T10:25:00Z" },
    },
    createdAt: { $date: "2024-01-12T09:15:00Z" },
    updatedAt: { $date: "2024-02-15T10:25:00Z" },
  },
  {
    _id: { $oid: "65f1a3b1c2d3e4f5g6h7i8j9" },
    name: "michael_chen",
    email: "michael.chen@example.com",
    phone: "+14155553456",
    status: "online",
    address: {
      street: "789 Elm St",
      city: "San Jose",
      state: "CA",
      country: "USA",
      zipCode: "95110",
    },
    gender: "male",
    age: 35,
    location: {
      type: "Point",
      coordinates: [-121.886, 37.338],
      lastSeen: { $date: "2024-02-15T10:20:00Z" },
    },
    createdAt: { $date: "2024-01-08T07:45:00Z" },
    updatedAt: { $date: "2024-02-15T10:20:00Z" },
  },
  {
    _id: { $oid: "65f1a4b1c2d3e4f5g6h7i8j9" },
    name: "emily_wilson",
    email: "emily.wilson@example.com",
    phone: "+14155554567",
    status: "offline",
    address: {
      street: "321 Pine Rd",
      city: "Oakland",
      state: "CA",
      country: "USA",
      zipCode: "94601",
    },
    gender: "female",
    age: 26,
    location: {
      type: "Point",
      coordinates: [-122.271, 37.805],
      lastSeen: { $date: "2024-02-15T08:00:00Z" },
    },
    createdAt: { $date: "2024-01-15T06:30:00Z" },
    updatedAt: { $date: "2024-02-15T08:00:00Z" },
  },
  {
    _id: { $oid: "65f1a5b1c2d3e4f5g6h7i8j9" },
    name: "david_johnson",
    email: "david.johnson@example.com",
    phone: "+14155555678",
    status: "online",
    address: {
      street: "654 Birch Ln",
      city: "Berkeley",
      state: "CA",
      country: "USA",
      zipCode: "94702",
    },
    gender: "male",
    age: 31,
    location: {
      type: "Point",
      coordinates: [-122.275, 37.872],
      lastSeen: { $date: "2024-02-15T10:15:00Z" },
    },
    createdAt: { $date: "2024-01-20T05:00:00Z" },
    updatedAt: { $date: "2024-02-15T10:15:00Z" },
  },
  {
    _id: { $oid: "65f1a6b1c2d3e4f5g6h7i8j9" },
    name: "lisa_brown",
    email: "lisa.brown@example.com",
    phone: "+14155556789",
    status: "online",
    address: {
      street: "987 Cedar Dr",
      city: "Palo Alto",
      state: "CA",
      country: "USA",
      zipCode: "94301",
    },
    gender: "female",
    age: 29,
    location: {
      type: "Point",
      coordinates: [-122.166, 37.443],
      lastSeen: { $date: "2024-02-15T10:10:00Z" },
    },
    createdAt: { $date: "2024-02-01T10:00:00Z" },
    updatedAt: { $date: "2024-02-15T10:10:00Z" },
  },
];

// 💬 SAMPLE MESSAGES DATA
// File: sample-data/messages.json
const MESSAGES_DATA = [
  {
    _id: { $oid: "66f1a1b1c2d3e4f5g6h7i8j9" },
    senderId: { $oid: "65f1a1b1c2d3e4f5g6h7i8j9" },
    receiverId: { $oid: "65f1a2b1c2d3e4f5g6h7i8j9" },
    chatId: { $oid: "67f1a1b1c2d3e4f5g6h7i8j9" },
    text: "Hey there! How are you doing?",
    seen: true,
    deleted: false,
    createdAt: { $date: "2024-02-15T10:35:00Z" },
    updatedAt: { $date: "2024-02-15T10:35:00Z" },
  },
  {
    _id: { $oid: "66f1a2b1c2d3e4f5g6h7i8j9" },
    senderId: { $oid: "65f1a2b1c2d3e4f5g6h7i8j9" },
    receiverId: { $oid: "65f1a1b1c2d3e4f5g6h7i8j9" },
    chatId: { $oid: "67f1a1b1c2d3e4f5g6h7i8j9" },
    text: "Doing great! Ready to meet up?",
    seen: true,
    deleted: false,
    createdAt: { $date: "2024-02-15T10:36:00Z" },
    updatedAt: { $date: "2024-02-15T10:36:00Z" },
  },
  {
    _id: { $oid: "66f1a3b1c2d3e4f5g6h7i8j9" },
    senderId: { $oid: "65f1a3b1c2d3e4f5g6h7i8j9" },
    receiverId: { $oid: "65f1a4b1c2d3e4f5g6h7i8j9" },
    chatId: { $oid: "67f1a2b1c2d3e4f5g6h7i8j9" },
    text: "Sure! Let me share my location",
    seen: false,
    deleted: false,
    createdAt: { $date: "2024-02-15T10:37:00Z" },
    updatedAt: { $date: "2024-02-15T10:37:00Z" },
  },
  {
    _id: { $oid: "66f1a4b1c2d3e4f5g6h7i8j9" },
    senderId: { $oid: "65f1a5b1c2d3e4f5g6h7i8j9" },
    receiverId: { $oid: "65f1a6b1c2d3e4f5g6h7i8j9" },
    chatId: { $oid: "67f1a3b1c2d3e4f5g6h7i8j9" },
    text: "Meeting tomorrow at 2 PM?",
    seen: true,
    deleted: false,
    createdAt: { $date: "2024-02-14T15:00:00Z" },
    updatedAt: { $date: "2024-02-14T15:00:00Z" },
  },
  {
    _id: { $oid: "66f1a5b1c2d3e4f5g6h7i8j9" },
    senderId: { $oid: "65f1a6b1c2d3e4f5g6h7i8j9" },
    receiverId: { $oid: "65f1a5b1c2d3e4f5g6h7i8j9" },
    chatId: { $oid: "67f1a3b1c2d3e4f5g6h7i8j9" },
    text: "Sounds good! See you then",
    seen: true,
    deleted: false,
    createdAt: { $date: "2024-02-14T15:05:00Z" },
    updatedAt: { $date: "2024-02-14T15:05:00Z" },
  },
];

// 👥 SAMPLE GROUPS DATA
// File: sample-data/groups.json
const GROUPS_DATA = [
  {
    _id: { $oid: "68f1a1b1c2d3e4f5g6h7i8j9" },
    name: "Bay Area Meetup",
    description: "Local meetup group for friends in the Bay Area",
    admin: { $oid: "65f1a1b1c2d3e4f5g6h7i8j9" },
    members: [
      { $oid: "65f1a1b1c2d3e4f5g6h7i8j9" },
      { $oid: "65f1a2b1c2d3e4f5g6h7i8j9" },
      { $oid: "65f1a3b1c2d3e4f5g6h7i8j9" },
      { $oid: "65f1a5b1c2d3e4f5g6h7i8j9" },
    ],
    createdAt: { $date: "2024-01-05T12:00:00Z" },
    updatedAt: { $date: "2024-02-15T10:00:00Z" },
  },
  {
    _id: { $oid: "68f1a2b1c2d3e4f5g6h7i8j9" },
    name: "Tech Enthusiasts",
    description: "Group for tech lovers to share ideas and projects",
    admin: { $oid: "65f1a3b1c2d3e4f5g6h7i8j9" },
    members: [
      { $oid: "65f1a3b1c2d3e4f5g6h7i8j9" },
      { $oid: "65f1a5b1c2d3e4f5g6h7i8j9" },
      { $oid: "65f1a6b1c2d3e4f5g6h7i8j9" },
    ],
    createdAt: { $date: "2024-01-10T14:30:00Z" },
    updatedAt: { $date: "2024-02-15T09:45:00Z" },
  },
  {
    _id: { $oid: "68f1a3b1c2d3e4f5g6h7i8j9" },
    name: "Weekend Warriors",
    description: "Group for weekend activity planning",
    admin: { $oid: "65f1a2b1c2d3e4f5g6h7i8j9" },
    members: [
      { $oid: "65f1a2b1c2d3e4f5g6h7i8j9" },
      { $oid: "65f1a4b1c2d3e4f5g6h7i8j9" },
      { $oid: "65f1a1b1c2d3e4f5g6h7i8j9" },
    ],
    createdAt: { $date: "2024-02-01T11:00:00Z" },
    updatedAt: { $date: "2024-02-14T16:20:00Z" },
  },
];

// 📝 SAMPLE ACTIVITY LOG DATA
// File: sample-data/activityLogs.json
const ACTIVITY_LOGS_DATA = [
  {
    _id: { $oid: "69f1a1b1c2d3e4f5g6h7i8j9" },
    userId: { $oid: "65f1a1b1c2d3e4f5g6h7i8j9" },
    action: "login",
    description: "User logged in",
    metadata: { ip: "192.168.1.1", device: "desktop" },
    createdAt: { $date: "2024-02-15T10:30:00Z" },
  },
  {
    _id: { $oid: "69f1a2b1c2d3e4f5g6h7i8j9" },
    userId: { $oid: "65f1a2b1c2d3e4f5g6h7i8j9" },
    action: "message_sent",
    description: "User sent a message",
    metadata: { chatId: "67f1a1b1c2d3e4f5g6h7i8j9" },
    createdAt: { $date: "2024-02-15T10:35:00Z" },
  },
  {
    _id: { $oid: "69f1a3b1c2d3e4f5g6h7i8j9" },
    userId: { $oid: "65f1a3b1c2d3e4f5g6h7i8j9" },
    action: "location_shared",
    description: "User shared their location",
    metadata: { coordinates: [-122.419, 37.775] },
    createdAt: { $date: "2024-02-15T10:37:00Z" },
  },
  {
    _id: { $oid: "69f1a4b1c2d3e4f5g6h7i8j9" },
    userId: { $oid: "65f1a5b1c2d3e4f5g6h7i8j9" },
    action: "group_joined",
    description: "User joined a group",
    metadata: { groupId: "68f1a1b1c2d3e4f5g6h7i8j9" },
    createdAt: { $date: "2024-02-15T10:40:00Z" },
  },
  {
    _id: { $oid: "69f1a5b1c2d3e4f5g6h7i8j9" },
    userId: { $oid: "65f1a6b1c2d3e4f5g6h7i8j9" },
    action: "profile_updated",
    description: "User updated their profile",
    metadata: { wards: ["bio", "interests"] },
    createdAt: { $date: "2024-02-14T14:00:00Z" },
  },
  {
    _id: { $oid: "69f1a6b1c2d3e4f5g6h7i8j9" },
    userId: { $oid: "65f1a4b1c2d3e4f5g6h7i8j9" },
    action: "login",
    description: "User logged in",
    metadata: { ip: "192.168.1.5", device: "mobile" },
    createdAt: { $date: "2024-02-14T12:00:00Z" },
  },
  {
    _id: { $oid: "69f1a7b1c2d3e4f5g6h7i8j9" },
    userId: { $oid: "65f1a1b1c2d3e4f5g6h7i8j9" },
    action: "message_sent",
    description: "User sent a message",
    metadata: { chatId: "67f1a1b1c2d3e4f5g6h7i8j9" },
    createdAt: { $date: "2024-02-13T15:00:00Z" },
  },
];

/**
 * IMPORT INSTRUCTIONS
 *
 * Method 1: Using MongoDB Compass
 * 1. Open MongoDB Compass
 * 2. Connect to your database
 * 3. Right-click on each collection → Import JSON
 * 4. Select the corresponding JSON data
 * 5. Import
 *
 * Method 2: Using mongoimport Command
 * ```bash
 * # Users collection
 * mongoimport --db map_and_chat --collection users --file sample-data/users.json --jsonArray
 *
 * # Messages collection
 * mongoimport --db map_and_chat --collection messages --file sample-data/messages.json --jsonArray
 *
 * # Groups collection
 * mongoimport --db map_and_chat --collection groups --file sample-data/groups.json --jsonArray
 *
 * # Activity Logs collection
 * mongoimport --db map_and_chat --collection activitylogs --file sample-data/activitylogs.json --jsonArray
 * ```
 *
 * Method 3: Using MongoDB Shell
 * ```javascript
 * // Connect to MongoDB
 * mongosh
 *
 * // Switch to database
 * use map_and_chat
 *
 * // Insert users
 * db.users.insertMany([...USERS_DATA])
 *
 * // Insert messages
 * db.messages.insertMany([...MESSAGES_DATA])
 *
 * // Insert groups
 * db.groups.insertMany([...GROUPS_DATA])
 *
 * // Insert activity logs
 * db.activitylogs.insertMany([...ACTIVITY_LOGS_DATA])
 * ```
 *
 * Method 4: Using Node.js Script
 * See: sample-data/seed-db.js
 */

module.exports = {
  USERS_DATA,
  MESSAGES_DATA,
  GROUPS_DATA,
  ACTIVITY_LOGS_DATA,
};
