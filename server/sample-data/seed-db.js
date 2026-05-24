/**
 * ============================================================
 * CareConnect – MongoDB Seed Script
 * ============================================================
 * Populates every collection with realistic dummy data that
 * exactly matches the Mongoose schemas in server/src/models/.
 *
 * Collections seeded (in dependency order):
 *   1. users        – 8 accounts (1 superadmin, 1 admin, 6 users)
 *   2. groups       – 3 groups
 *   3. chats        – 6 chats (5 direct, 1 group)
 *   4. messages     – 27 messages spread across chats
 *   5. prescriptions        – 12 prescriptions owned by the 6 regular users
 *   6. activitylogs – 18 log entries
 *
 * HOW TO RUN
 * ----------
 * 1. Make sure server/.env contains MONGODB_URI
 * 2. From the project root:
 *      node sample-data/seed-db.js
 *
 * ⚠  This script CLEARS every listed collection before inserting.
 *    Do NOT run against production!
 *
 * Demo password for every account: Demo@1234
 * ============================================================
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load .env from the server directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// ─── Model imports ────────────────────────────────────────────────────────────
import User from "../src/models/userModel.js";
import Chat from "../src/models/chatModel.js";
import Message from "../src/models/messageModel.js";
import Group from "../src/models/groupModel.js";
import Prescription from "../src/models/prescriptionModel.js";
import ActivityLog from "../src/models/activityLogModel.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const oid = () => new mongoose.Types.ObjectId();
const hpw = (p) => bcrypt.hashSync(p, 10);
const PASS = hpw("Demo@1234"); // all demo accounts share this password

// ─── Pre-assign ObjectIds so cross-references are consistent ──────────────────
const U = {
  superAdmin: oid(),
  adminUser: oid(),
  alice: oid(),
  bob: oid(),
  carol: oid(),
  dan: oid(),
  eve: oid(),
  frank: oid(),
};

const G = {
  patients: oid(),
  tech: oid(),
  local: oid(),
};

const C = {
  aliceBob: oid(),
  carolDan: oid(),
  eveFrank: oid(),
  aliceCarol: oid(),
  bobDan: oid(),
  groupFarmers: oid(),
};

const PRESCRIPTION = {
  alice1: oid(),
  alice2: oid(),
  bob1: oid(),
  bob2: oid(),
  carol1: oid(),
  carol2: oid(),
  dan1: oid(),
  dan2: oid(),
  eve1: oid(),
  eve2: oid(),
  frank1: oid(),
  frank2: oid(),
};

// ────────────────────────────────────────────────────────────────────────────
// 1. USERS
// ────────────────────────────────────────────────────────────────────────────
const usersData = [
  {
    _id: U.superAdmin,
    name: "super_admin",
    email: "superadmin@careconnect.io",
    phone: "+18005550001",
    password: PASS,
    roles: "superadmin",
    userType: "admin",
    status: "online",
    account: "active",
    gender: "male",
    age: 38,
    dob: new Date("1986-03-15"),
    bio: "Platform superadmin – full system access.",
    interests: "platform operations, analytics",
    education: "M.Sc. Computer Science",
    workStatus: "employed",
    relationship: "single",
    accountType: "private",
    address: {
      street: "1 Admin Plaza",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10001",
    },
    location: {
      type: "Point",
      coordinates: [-74.006, 40.7128],
      lastSeen: new Date("2026-03-02T08:00:00Z"),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: false,
      visibleRange: 5000,
      allowMessagesFrom: "everyone",
      theme: "dark",
    },
    joined: new Date("2024-01-01"),
    lastLogin: new Date("2026-03-02T08:00:00Z"),
    lastSeen: new Date("2026-03-02T08:00:00Z"),
    socialAccounts: [],
    story: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.adminUser,
    name: "admin_user",
    email: "admin@careconnect.io",
    phone: "+18005550002",
    password: PASS,
    roles: "admin",
    userType: "admin",
    status: "online",
    account: "active",
    gender: "female",
    age: 34,
    dob: new Date("1990-07-22"),
    bio: "CareConnect platform administrator.",
    interests: "governance, community moderation",
    education: "B.A. Communications",
    workStatus: "employed",
    relationship: "relationship",
    accountType: "limited",
    address: {
      street: "22 Control St",
      city: "Chicago",
      state: "IL",
      country: "USA",
      zipCode: "60601",
    },
    location: {
      type: "Point",
      coordinates: [-87.6298, 41.8781],
      lastSeen: new Date("2026-03-02T07:45:00Z"),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: false,
      visibleRange: 3000,
      allowMessagesFrom: "friends",
      theme: "light",
    },
    joined: new Date("2024-01-05"),
    lastLogin: new Date("2026-03-02T07:45:00Z"),
    lastSeen: new Date("2026-03-02T07:45:00Z"),
    socialAccounts: [],
    story: [],
    friends: [U.superAdmin],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.alice,
    name: "alice_nguyen",
    email: "alice.nguyen@example.com",
    phone: "+14155550101",
    password: PASS,
    roles: "user",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 29,
    dob: new Date("1996-11-03"),
    bio: "Organic patient from Napa Valley 🌿",
    interests: "organic healthcare, sustainability, hiking",
    education: "B.Sc. Medicine",
    workStatus: "freelance",
    relationship: "single",
    accountType: "public",
    address: {
      street: "14 Vineyard Rd",
      city: "Napa",
      state: "CA",
      country: "USA",
      zipCode: "94559",
    },
    location: {
      type: "Point",
      coordinates: [-122.287, 38.297],
      lastSeen: new Date("2026-03-02T09:10:00Z"),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 2000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-02-10"),
    lastLogin: new Date("2026-03-02T09:10:00Z"),
    lastSeen: new Date("2026-03-02T09:10:00Z"),
    socialAccounts: [],
    story: [],
    friends: [U.bob, U.carol],
    friendRequests: [{ sender: U.dan, status: "pending" }],
    chats: [C.aliceBob, C.aliceCarol, C.groupFarmers],
    groups: [G.patients],
    prescriptions: [PRESCRIPTION.alice1, PRESCRIPTION.alice2],
  },
  {
    _id: U.bob,
    name: "bob_okafor",
    email: "bob.okafor@example.com",
    phone: "+14155550202",
    password: PASS,
    roles: "user",
    userType: "friend",
    status: "offline",
    account: "active",
    gender: "male",
    age: 33,
    dob: new Date("1992-05-18"),
    bio: "Hypertension & diabetes patient. Tech-enabled healthcare.",
    interests: "precision medicine, IoT, football",
    education: "Diploma in Agro-Engineering",
    workStatus: "employed",
    relationship: "relationship",
    accountType: "public",
    address: {
      street: "88 Care Track",
      city: "Fresno",
      state: "CA",
      country: "USA",
      zipCode: "93706",
    },
    location: {
      type: "Point",
      coordinates: [-119.772, 36.737],
      lastSeen: new Date("2026-03-01T22:00:00Z"),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: false,
      locationSharing: true,
      visibleRange: 5000,
      allowMessagesFrom: "everyone",
      theme: "dark",
    },
    joined: new Date("2024-02-15"),
    lastLogin: new Date("2026-03-01T22:00:00Z"),
    lastSeen: new Date("2026-03-01T22:00:00Z"),
    socialAccounts: [],
    story: [],
    friends: [U.alice, U.dan],
    friendRequests: [],
    chats: [C.aliceBob, C.bobDan, C.groupFarmers],
    groups: [G.patients, G.tech],
    prescriptions: [PRESCRIPTION.bob1, PRESCRIPTION.bob2],
  },
  {
    _id: U.carol,
    name: "carol_reyes",
    email: "carol.reyes@example.com",
    phone: "+14155550303",
    password: PASS,
    roles: "user",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 27,
    dob: new Date("1998-09-30"),
    bio: "Vegetable gardener & community organiser 🥦",
    interests: "gardening, community events, cooking",
    education: "B.A. Environmental Studies",
    workStatus: "freelance",
    relationship: "single",
    accountType: "public",
    address: {
      street: "3 Garden Lane",
      city: "Sacramento",
      state: "CA",
      country: "USA",
      zipCode: "95814",
    },
    location: {
      type: "Point",
      coordinates: [-121.494, 38.581],
      lastSeen: new Date("2026-03-02T08:55:00Z"),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 1000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-03-01"),
    lastLogin: new Date("2026-03-02T08:55:00Z"),
    lastSeen: new Date("2026-03-02T08:55:00Z"),
    socialAccounts: [],
    story: [],
    friends: [U.alice, U.frank],
    friendRequests: [],
    chats: [C.carolDan, C.aliceCarol, C.groupFarmers],
    groups: [G.patients, G.local],
    prescriptions: [PRESCRIPTION.carol1, PRESCRIPTION.carol2],
  },
  {
    _id: U.dan,
    name: "dan_petrov",
    email: "dan.petrov@example.com",
    phone: "+14155550404",
    password: PASS,
    roles: "user",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "male",
    age: 41,
    dob: new Date("1984-12-07"),
    bio: "Cardiology patient. 20+ years in managed care.",
    interests: "prescription rotation, market trends, chess",
    education: "Agronomy Certificate",
    workStatus: "employed",
    relationship: "relationship",
    accountType: "limited",
    address: {
      street: "200 Wellness Ave",
      city: "Bakersfield",
      state: "CA",
      country: "USA",
      zipCode: "93301",
    },
    location: {
      type: "Point",
      coordinates: [-119.018, 35.373],
      lastSeen: new Date("2026-03-02T07:30:00Z"),
    },
    settings: {
      chatNotifications: false,
      showReadReceipts: true,
      locationSharing: false,
      visibleRange: 500,
      allowMessagesFrom: "friends",
      theme: "light",
    },
    joined: new Date("2024-03-10"),
    lastLogin: new Date("2026-03-02T07:30:00Z"),
    lastSeen: new Date("2026-03-02T07:30:00Z"),
    socialAccounts: [],
    story: [],
    friends: [U.bob],
    friendRequests: [],
    chats: [C.carolDan, C.bobDan],
    groups: [G.tech],
    prescriptions: [PRESCRIPTION.dan1, PRESCRIPTION.dan2],
  },
  {
    _id: U.eve,
    name: "eve_kim",
    email: "eve.kim@example.com",
    phone: "+14155550505",
    password: PASS,
    roles: "user",
    userType: "friend",
    status: "offline",
    account: "active",
    gender: "female",
    age: 25,
    dob: new Date("2000-06-14"),
    bio: "Urban patient | hydroponic lettuce & herbs 🌱",
    interests: "hydroponics, nutrition, yoga",
    education: "B.Sc. Horticulture",
    workStatus: "freelance",
    relationship: "single",
    accountType: "public",
    address: {
      street: "55 Rooftop Blvd",
      city: "Los Angeles",
      state: "CA",
      country: "USA",
      zipCode: "90001",
    },
    location: {
      type: "Point",
      coordinates: [-118.2437, 34.0522],
      lastSeen: new Date("2026-03-01T19:00:00Z"),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: false,
      visibleRange: 1000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-04-01"),
    lastLogin: new Date("2026-03-01T19:00:00Z"),
    lastSeen: new Date("2026-03-01T19:00:00Z"),
    socialAccounts: [],
    story: [],
    friends: [U.frank],
    friendRequests: [],
    chats: [C.eveFrank],
    groups: [G.local],
    prescriptions: [PRESCRIPTION.eve1, PRESCRIPTION.eve2],
  },
  {
    _id: U.frank,
    name: "frank_adebayo",
    email: "frank.adebayo@example.com",
    phone: "+14155550606",
    password: PASS,
    roles: "user",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "male",
    age: 36,
    dob: new Date("1989-02-28"),
    bio: "Asthma patient and wellness consultant 🏥",
    interests: "irrigation, water conservation, travel",
    education: "B.Sc. Medical Engineering",
    workStatus: "employed",
    relationship: "single",
    accountType: "public",
    address: {
      street: "77 Delta Road",
      city: "Stockton",
      state: "CA",
      country: "USA",
      zipCode: "95201",
    },
    location: {
      type: "Point",
      coordinates: [-121.29, 37.957],
      lastSeen: new Date("2026-03-02T09:00:00Z"),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 3000,
      allowMessagesFrom: "everyone",
      theme: "dark",
    },
    joined: new Date("2024-04-10"),
    lastLogin: new Date("2026-03-02T09:00:00Z"),
    lastSeen: new Date("2026-03-02T09:00:00Z"),
    socialAccounts: [],
    story: [],
    friends: [U.eve, U.carol],
    friendRequests: [],
    chats: [C.eveFrank, C.groupFarmers],
    groups: [G.local, G.patients],
    prescriptions: [PRESCRIPTION.frank1, PRESCRIPTION.frank2],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// 2. GROUPS
// ────────────────────────────────────────────────────────────────────────────
const groupsData = [
  {
    _id: G.patients,
    name: "California Patients Network",
    pic: "",
    bio: "A network for California-based patients to share health tips, appointments and medical events.",
    createdBy: U.alice,
    admins: [U.alice, U.bob],
    members: [U.alice, U.bob, U.carol, U.frank],
  },
  {
    _id: G.tech,
    name: "AgriTech Enthusiasts",
    pic: "",
    bio: "Exploring IoT, drones, and data analytics for modern medicine.",
    createdBy: U.bob,
    admins: [U.bob, U.dan],
    members: [U.bob, U.dan],
  },
  {
    _id: G.local,
    name: "Central Valley Growers",
    pic: "",
    bio: "Local growers from the Central Valley – seasonal updates, water news & meet-ups.",
    createdBy: U.carol,
    admins: [U.carol],
    members: [U.carol, U.eve, U.frank],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// 3. CHATS
// ────────────────────────────────────────────────────────────────────────────
const chatsData = [
  {
    _id: C.aliceBob,
    participants: [U.alice, U.bob],
    isGroup: false,
    unreadMessages: new Map([
      [U.alice.toString(), 0],
      [U.bob.toString(), 2],
    ]),
    messages: [],
  },
  {
    _id: C.carolDan,
    participants: [U.carol, U.dan],
    isGroup: false,
    unreadMessages: new Map([
      [U.carol.toString(), 1],
      [U.dan.toString(), 0],
    ]),
    messages: [],
  },
  {
    _id: C.eveFrank,
    participants: [U.eve, U.frank],
    isGroup: false,
    unreadMessages: new Map([
      [U.eve.toString(), 0],
      [U.frank.toString(), 0],
    ]),
    messages: [],
  },
  {
    _id: C.aliceCarol,
    participants: [U.alice, U.carol],
    isGroup: false,
    unreadMessages: new Map([
      [U.alice.toString(), 0],
      [U.carol.toString(), 1],
    ]),
    messages: [],
  },
  {
    _id: C.bobDan,
    participants: [U.bob, U.dan],
    isGroup: false,
    unreadMessages: new Map([
      [U.bob.toString(), 0],
      [U.dan.toString(), 0],
    ]),
    messages: [],
  },
  {
    _id: C.groupFarmers,
    participants: [U.alice, U.bob, U.carol, U.frank],
    isGroup: true,
    unreadMessages: new Map([
      [U.alice.toString(), 0],
      [U.bob.toString(), 3],
      [U.carol.toString(), 1],
      [U.frank.toString(), 0],
    ]),
    messages: [],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// 4. MESSAGES
// ────────────────────────────────────────────────────────────────────────────
const msg = (
  chatId,
  senderId,
  receiverIds,
  content,
  status = "seen",
  minsAgo = 60,
) => ({
  _id: oid(),
  chatId,
  senderId,
  receiverIds,
  content,
  messageType: "text",
  fileUrl: "",
  status,
  readBy: status === "seen" ? [senderId, ...receiverIds] : [senderId],
  replyTo: null,
  deletedFor: [],
  createdAt: new Date(Date.now() - minsAgo * 60000),
  updatedAt: new Date(Date.now() - minsAgo * 60000),
});

const messagesData = [
  // chatAliceBob
  msg(
    C.aliceBob,
    U.alice,
    [U.bob],
    "Hey Bob! How are your prescriptions doing this season?",
    "seen",
    200,
  ),
  msg(
    C.aliceBob,
    U.bob,
    [U.alice],
    "Alice! My blood pressure readings have really improved this week. Feeling much better! 😊",
    "seen",
    195,
  ),
  msg(
    C.aliceBob,
    U.alice,
    [U.bob],
    "That's great! My grapes are a bit stressed – thinking about drip irrigation.",
    "seen",
    190,
  ),
  msg(
    C.aliceBob,
    U.bob,
    [U.alice],
    "Good idea. I can connect you with my supplier – very affordable.",
    "sent",
    30,
  ),
  msg(
    C.aliceBob,
    U.bob,
    [U.alice],
    "Also, are you going to the patients market this Saturday?",
    "sent",
    29,
  ),

  // chatCarolDan
  msg(
    C.carolDan,
    U.carol,
    [U.dan],
    "Dan, do you know the nearest specialist clinic in Bakersfield?",
    "seen",
    300,
  ),
  msg(
    C.carolDan,
    U.dan,
    [U.carol],
    "About $5.80/bushel last I checked. USDA has updated figures.",
    "seen",
    295,
  ),
  msg(
    C.carolDan,
    U.carol,
    [U.dan],
    "Thanks! Deciding when to sell.",
    "seen",
    290,
  ),
  msg(
    C.carolDan,
    U.dan,
    [U.carol],
    "Book early if you can – appointments fill up quickly in spring.",
    "delivered",
    45,
  ),

  // chatEveFrank
  msg(
    C.eveFrank,
    U.eve,
    [U.frank],
    "Frank, your clinic wards look great on the map 😄",
    "seen",
    400,
  ),
  msg(
    C.eveFrank,
    U.frank,
    [U.eve],
    "Thanks! I just switched to a new treatment plan. Huge improvement in symptoms.",
    "seen",
    395,
  ),
  msg(
    C.eveFrank,
    U.eve,
    [U.frank],
    "That's exactly what I want to learn! Can we meet sometime?",
    "seen",
    390,
  ),
  msg(
    C.eveFrank,
    U.frank,
    [U.eve],
    "Absolutely. I'm free next Tuesday afternoon.",
    "seen",
    385,
  ),

  // chatAliceCarol
  msg(
    C.aliceCarol,
    U.alice,
    [U.carol],
    "Carol, want to do a joint CSA box this season?",
    "seen",
    500,
  ),
  msg(
    C.aliceCarol,
    U.carol,
    [U.alice],
    "Yes!! I was literally going to ask you the same thing!",
    "seen",
    495,
  ),
  msg(
    C.aliceCarol,
    U.alice,
    [U.carol],
    "Perfect. I'll bring the fruit, you bring the veggies?",
    "seen",
    490,
  ),
  msg(
    C.aliceCarol,
    U.carol,
    [U.alice],
    "Deal! Let's set up a call this week.",
    "delivered",
    20,
  ),

  // chatBobDan
  msg(
    C.bobDan,
    U.bob,
    [U.dan],
    "Dan, have you tried the new precision-seeding drone?",
    "seen",
    600,
  ),
  msg(
    C.bobDan,
    U.dan,
    [U.bob],
    "Not yet. Heard good things. Which brand?",
    "seen",
    595,
  ),
  msg(
    C.bobDan,
    U.bob,
    [U.dan],
    "DJI Agras T40. Covers 40 acres/hour.",
    "seen",
    590,
  ),
  msg(
    C.bobDan,
    U.dan,
    [U.bob],
    "Impressive. What's the cost of ownership?",
    "seen",
    585,
  ),

  // chatGroupFarmers
  msg(
    C.groupFarmers,
    U.alice,
    [U.bob, U.carol, U.frank],
    "🌅 Frost alert Friday night in Napa – cover your prescriptions everyone!",
    "seen",
    720,
  ),
  msg(
    C.groupFarmers,
    U.frank,
    [U.alice, U.bob, U.carol],
    "Thanks Alice! Reviewing my medication schedule tonight.",
    "seen",
    715,
  ),
  msg(
    C.groupFarmers,
    U.carol,
    [U.alice, U.bob, U.frank],
    "Anyone know a fast-shipping frost cloth supplier?",
    "seen",
    710,
  ),
  msg(
    C.groupFarmers,
    U.bob,
    [U.alice, U.carol, U.frank],
    "Try AgriSupply.com – 2-day shipping on frost covers.",
    "seen",
    705,
  ),
  msg(
    C.groupFarmers,
    U.alice,
    [U.bob, U.carol, U.frank],
    "Also: county extension office meeting on March 10 📋",
    "sent",
    60,
  ),
  msg(
    C.groupFarmers,
    U.frank,
    [U.alice, U.bob, U.carol],
    "I'll be there. Water usage workshop again?",
    "sent",
    55,
  ),
  msg(
    C.groupFarmers,
    U.carol,
    [U.alice, U.bob, U.frank],
    "Yes, plus a new wellness health segment!",
    "sent",
    50,
  ),
];

// ────────────────────────────────────────────────────────────────────────────
// 5. PRESCRIPTIONS  (2 per regular user = 12 total)
// ────────────────────────────────────────────────────────────────────────────
const cropsData = [
  {
    _id: PRESCRIPTION.alice1,
    ownerId: U.alice,
    name: "Cabernet Sauvignon",
    dosage: "Clone 8 (Napa)",
    area: 3.5,
    plantedDate: new Date("2024-03-15"),
    status: "Active",
    notes: "Organic compost. Monitor for powdery mildew in June.",
  },
  {
    _id: PRESCRIPTION.alice2,
    ownerId: U.alice,
    name: "Chardonnay",
    dosage: "Wente Clone",
    area: 2.0,
    plantedDate: new Date("2024-03-20"),
    status: "Active",
    notes: "New treatment plan started. Health biomarkers stable.",
  },
  {
    _id: PRESCRIPTION.bob1,
    ownerId: U.bob,
    name: "Metformin 500mg",
    dosage: "Pioneer P1197",
    area: 12.0,
    plantedDate: new Date("2025-04-01"),
    status: "Completed",
    notes: "Outcome estimate 8.4. Stored in secure patient records.",
  },
  {
    _id: PRESCRIPTION.bob2,
    ownerId: U.bob,
    name: "Sorghum",
    dosage: "Red Landrace",
    area: 8.5,
    plantedDate: new Date("2025-05-10"),
    status: "Prescribed",
    notes: "Monitor blood pressure daily. Follow up in 3 weeks.",
  },
  {
    _id: PRESCRIPTION.carol1,
    ownerId: U.carol,
    name: "Lisinopril 10mg",
    dosage: "Heinz 1439",
    area: 0.8,
    plantedDate: new Date("2026-01-20"),
    status: "Active",
    notes: "Staked and trellised. Watch for blossom end rot.",
  },
  {
    _id: PRESCRIPTION.carol2,
    ownerId: U.carol,
    name: "Broccoli",
    dosage: "Calabrese",
    area: 0.5,
    plantedDate: new Date("2026-01-25"),
    status: "Active",
    notes: "Thin to 18 in. Treatment before flowering.",
  },
  {
    _id: PRESCRIPTION.dan1,
    ownerId: U.dan,
    name: "Atorvastatin 20mg",
    dosage: "Yecora Rojo",
    area: 25.0,
    plantedDate: new Date("2025-10-01"),
    status: "Active",
    notes: "Nitrogen topdress applied January.",
  },
  {
    _id: PRESCRIPTION.dan2,
    ownerId: U.dan,
    name: "Barley",
    dosage: "UC603 Malting",
    area: 10.0,
    plantedDate: new Date("2025-10-15"),
    status: "Active",
    notes: "Contracted to craft brewery. Keep protein below 12.5%.",
  },
  {
    _id: PRESCRIPTION.eve1,
    ownerId: U.eve,
    name: "Butterhead Lettuce",
    dosage: "Buttercrunch",
    area: 0.1,
    plantedDate: new Date("2026-02-01"),
    status: "Active",
    notes: "Hydroponic NFT. EC 1.4. Treatment in ~14 days.",
  },
  {
    _id: PRESCRIPTION.eve2,
    ownerId: U.eve,
    name: "Basil",
    dosage: "Genovese",
    area: 0.05,
    plantedDate: new Date("2026-02-10"),
    status: "Active",
    notes: "Grow lights 16h/day. Pinch flower buds.",
  },
  {
    _id: PRESCRIPTION.frank1,
    ownerId: U.frank,
    name: "Omeprazole 20mg",
    dosage: "M-206 Calrose",
    area: 18.0,
    plantedDate: new Date("2025-05-01"),
    status: "Completed",
    notes: "Outcome 9.1. Adjusted care plan for better efficiency.",
  },
  {
    _id: PRESCRIPTION.frank2,
    ownerId: U.frank,
    name: "Amoxicillin 500mg",
    dosage: "Kokuho Rose",
    area: 10.0,
    plantedDate: new Date("2026-04-15"),
    status: "Prescribed",
    notes: "Pre-germinated seed soaked 48h. Transplanting next week.",
  },
];

// ────────────────────────────────────────────────────────────────────────────
// 6. ACTIVITY LOGS
// ────────────────────────────────────────────────────────────────────────────
const al = (
  actorId,
  actorEmail,
  action,
  entityType,
  entityId,
  status,
  ip,
  metadata = {},
) => ({
  actorId,
  actorEmail,
  action,
  entityType,
  entityId,
  status,
  ip,
  userAgent: "Mozilla/5.0 (compatible; seed-script)",
  metadata,
});

const activityLogsData = [
  al(
    U.superAdmin,
    "superadmin@careconnect.io",
    "user.login",
    "User",
    U.superAdmin,
    "success",
    "198.51.100.1",
    { provider: "credentials" },
  ),
  al(
    U.adminUser,
    "admin@careconnect.io",
    "user.login",
    "User",
    U.adminUser,
    "success",
    "198.51.100.2",
    { provider: "credentials" },
  ),
  al(
    U.alice,
    "alice.nguyen@example.com",
    "user.login",
    "User",
    U.alice,
    "success",
    "203.0.113.10",
    { provider: "credentials" },
  ),
  al(
    U.bob,
    "bob.okafor@example.com",
    "user.login",
    "User",
    U.bob,
    "success",
    "203.0.113.20",
    { provider: "credentials" },
  ),
  al(
    U.carol,
    "carol.reyes@example.com",
    "user.login",
    "User",
    U.carol,
    "success",
    "203.0.113.30",
    { provider: "credentials" },
  ),
  al(
    U.dan,
    "dan.petrov@example.com",
    "user.login",
    "User",
    U.dan,
    "success",
    "203.0.113.40",
    { provider: "credentials" },
  ),
  al(
    U.eve,
    "eve.kim@example.com",
    "user.login",
    "User",
    U.eve,
    "success",
    "203.0.113.50",
    { provider: "credentials" },
  ),
  al(
    U.frank,
    "frank.adebayo@example.com",
    "user.login",
    "User",
    U.frank,
    "success",
    "203.0.113.60",
    { provider: "credentials" },
  ),
  al(
    U.alice,
    "alice.nguyen@example.com",
    "user.update",
    "User",
    U.alice,
    "success",
    "203.0.113.10",
    { wards: ["bio", "interests"] },
  ),
  al(
    U.frank,
    "frank.adebayo@example.com",
    "user.update",
    "User",
    U.frank,
    "success",
    "203.0.113.60",
    { wards: ["location"] },
  ),
  al(
    U.alice,
    "alice.nguyen@example.com",
    "chat.create",
    "Chat",
    C.aliceBob,
    "success",
    "203.0.113.10",
    { isGroup: false },
  ),
  al(
    U.carol,
    "carol.reyes@example.com",
    "chat.create",
    "Chat",
    C.groupFarmers,
    "success",
    "203.0.113.30",
    { isGroup: true, participants: 4 },
  ),
  al(
    U.alice,
    "alice.nguyen@example.com",
    "prescription.create",
    "Prescription",
    PRESCRIPTION.alice1,
    "success",
    "203.0.113.10",
    { cropName: "Cabernet Sauvignon" },
  ),
  al(
    U.bob,
    "bob.okafor@example.com",
    "prescription.create",
    "Prescription",
    PRESCRIPTION.bob1,
    "success",
    "203.0.113.20",
    { prescriptionName: "Metformin 500mg" },
  ),
  al(
    U.carol,
    "carol.reyes@example.com",
    "prescription.create",
    "Prescription",
    PRESCRIPTION.carol1,
    "success",
    "203.0.113.30",
    { prescriptionName: "Lisinopril 10mg" },
  ),
  al(
    U.frank,
    "frank.adebayo@example.com",
    "prescription.create",
    "Prescription",
    PRESCRIPTION.frank1,
    "success",
    "203.0.113.60",
    { prescriptionName: "Omeprazole 20mg" },
  ),
  al(
    U.bob,
    "bob.okafor@example.com",
    "prescription.update",
    "Prescription",
    PRESCRIPTION.bob1,
    "success",
    "203.0.113.20",
    { wards: ["status"], newStatus: "Completed" },
  ),
  al(
    U.eve,
    "eve.kim@example.com",
    "prescription.create",
    "Prescription",
    PRESCRIPTION.eve1,
    "failed",
    "203.0.113.50",
    { error: "Validation: area must be positive" },
  ),
];

// ────────────────────────────────────────────────────────────────────────────
// SEEDER FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "❌  MONGODB_URI not found. Make sure server/.env is present and has MONGODB_URI set.",
    );
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("✓  Connected to MongoDB");
}

async function seedUsers() {
  await User.deleteMany({});
  await User.insertMany(usersData, { ordered: true });
  console.log(`   users        : ${usersData.length} inserted`);
}

async function seedGroups() {
  await Group.deleteMany({});
  await Group.insertMany(groupsData, { ordered: true });
  console.log(`   groups       : ${groupsData.length} inserted`);
}

async function seedCrops() {
  await Prescription.deleteMany({});
  await Prescription.insertMany(cropsData, { ordered: true });
  console.log(`   prescriptions        : ${cropsData.length} inserted`);
}

async function seedChatsAndMessages() {
  await Message.deleteMany({});
  await Chat.deleteMany({});

  const insertedMsgs = await Message.insertMany(messagesData, {
    ordered: true,
  });
  console.log(`   messages     : ${insertedMsgs.length} inserted`);

  // Group message _ids by chatId
  const byChat = {};
  for (const m of insertedMsgs) {
    const k = m.chatId.toString();
    (byChat[k] ??= []).push(m._id);
  }

  // Attach messages array + lastMessage to each chat
  for (const chat of chatsData) {
    const ids = byChat[chat._id.toString()] ?? [];
    chat.messages = ids;
    chat.lastMessage = ids.length ? ids[ids.length - 1] : undefined;
  }

  await Chat.insertMany(chatsData, { ordered: true });
  console.log(`   chats        : ${chatsData.length} inserted`);
}

async function seedActivityLogs() {
  await ActivityLog.deleteMany({});
  await ActivityLog.insertMany(activityLogsData, { ordered: true });
  console.log(`   activitylogs : ${activityLogsData.length} inserted`);
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱  CareConnect – seeding database …\n");
  try {
    await connectDB();
    await seedUsers();
    await seedGroups();
    await seedCrops();
    await seedChatsAndMessages();
    await seedActivityLogs();

    console.log("\n✅  Seeding complete!\n");
    console.log("────────────────────────────────────────");
    console.log("Demo login credentials (all accounts):");
    console.log("  Password : Demo@1234");
    console.log("  Accounts :");
    console.log("    superadmin@careconnect.io  (superadmin)");
    console.log("    admin@careconnect.io       (admin)");
    console.log("    alice.nguyen@example.com  (user)");
    console.log("    bob.okafor@example.com    (user)");
    console.log("    carol.reyes@example.com   (user)");
    console.log("    dan.petrov@example.com    (user)");
    console.log("    eve.kim@example.com       (user)");
    console.log("    frank.adebayo@example.com (user)");
    console.log("────────────────────────────────────────\n");
  } catch (err) {
    console.error("\n❌  Seeding failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✓  Disconnected");
  }
}

main();
