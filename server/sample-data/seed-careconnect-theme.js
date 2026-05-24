import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import User from "../src/models/userModel.js";
import Group from "../src/models/groupModel.js";
import Chat from "../src/models/chatModel.js";
import Message from "../src/models/messageModel.js";
import Prescription from "../src/models/prescriptionModel.js";
import Event from "../src/models/eventModel.js";
import Visit from "../src/models/visitModel.js";
import Media from "../src/models/mediaModel.js";
import PushSubscription from "../src/models/pushSubscriptionModel.js";
import ActivityLog from "../src/models/activityLogModel.js";

const oid = () => new mongoose.Types.ObjectId();
const hashPassword = (password) => bcrypt.hashSync(password, 10);
const DEMO_PASSWORD = "Demo@1234";
const PASSWORD_HASH = hashPassword(DEMO_PASSWORD);

const U = {
  superadmin: oid(),
  admin: oid(),
  alice: oid(),
  bob: oid(),
  carol: oid(),
  dan: oid(),
};

const G = {
  pharmacySupport: oid(),
  patientCommunity: oid(),
  providerTeam: oid(),
};

const C = {
  aliceBob: oid(),
  aliceCarol: oid(),
  providerTeam: oid(),
};

const P = {
  aliceRx: oid(),
  danRx: oid(),
};

const V = {
  visitAlice: oid(),
  visitDan: oid(),
};

const users = [
  {
    _id: U.superadmin,
    name: "super_admin",
    email: "superadmin@careconnect.io",
    phone: "+18005550001",
    password: PASSWORD_HASH,
    roles: "superadmin",
    userType: "admin",
    status: "online",
    account: "active",
    gender: "male",
    age: 38,
    dob: new Date("1986-03-15"),
    bio: "CareConnect platform administrator overseeing the AI-powered healthcare network.",
    interests: "platform operations, security, compliance",
    education: "M.Sc. Health Informatics",
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
      lastSeen: new Date(),
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
    lastLogin: new Date(),
    lastSeen: new Date(),
    socialAccounts: [],
    story: [],
    friends: [U.admin],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.admin,
    name: "admin_user",
    email: "admin@careconnect.io",
    phone: "+18005550002",
    password: PASSWORD_HASH,
    roles: "admin",
    userType: "admin",
    status: "online",
    account: "active",
    gender: "female",
    age: 34,
    dob: new Date("1990-07-22"),
    bio: "Community health operations manager for CareConnect.",
    interests: "analytics, service quality, alerts",
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
      lastSeen: new Date(),
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
    lastLogin: new Date(),
    lastSeen: new Date(),
    socialAccounts: [],
    story: [],
    friends: [U.superadmin],
    friendRequests: [],
    chats: [],
    groups: [G.pharmacySupport, G.providerTeam],
    prescriptions: [],
  },
  {
    _id: U.alice,
    name: "alice_patient",
    email: "alice.patient@example.com",
    phone: "+14155550101",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 29,
    dob: new Date("1996-11-03"),
    bio: "Patient using CareConnect to manage prescriptions and talk with pharmacists.",
    interests: "wellness, AI health tips, fast pharmacy access",
    education: "B.Sc. Biology",
    workStatus: "freelance",
    relationship: "single",
    accountType: "public",
    address: {
      street: "14 Wellness Way",
      city: "Napa",
      state: "CA",
      country: "USA",
      zipCode: "94559",
    },
    location: {
      type: "Point",
      coordinates: [-122.287, 38.297],
      lastSeen: new Date(),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 2500,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-02-10"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    socialAccounts: [],
    story: [],
    friends: [U.bob, U.carol],
    friendRequests: [],
    chats: [C.aliceBob, C.aliceCarol, C.providerTeam],
    groups: [G.patientCommunity],
    prescriptions: [P.aliceRx],
  },
  {
    _id: U.bob,
    name: "bob_pharmacist",
    email: "bob.pharmacist@example.com",
    phone: "+14155550202",
    password: PASSWORD_HASH,
    roles: "admin",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "male",
    age: 41,
    dob: new Date("1983-09-14"),
    bio: "Pharmacist helping patients refill prescriptions and understand care plans.",
    interests: "medication management, pharmacy operations",
    education: "Pharm.D.",
    workStatus: "employed",
    relationship: "married",
    accountType: "limited",
    address: {
      street: "88 Pharmacy Lane",
      city: "San Jose",
      state: "CA",
      country: "USA",
      zipCode: "95134",
    },
    location: {
      type: "Point",
      coordinates: [-121.8863, 37.3382],
      lastSeen: new Date(),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: false,
      locationSharing: false,
      visibleRange: 2000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-03-15"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    socialAccounts: [],
    story: [],
    friends: [U.alice],
    friendRequests: [],
    chats: [C.aliceBob, C.providerTeam],
    groups: [G.pharmacySupport],
    prescriptions: [],
  },
  {
    _id: U.carol,
    name: "carol_provider",
    email: "carol.provider@example.com",
    phone: "+14155550303",
    password: PASSWORD_HASH,
    roles: "doctor",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 36,
    dob: new Date("1988-04-20"),
    bio: "Healthcare provider coordinating care, prescriptions, and telehealth follow-ups.",
    interests: "AI healthcare, patient triage, telemedicine",
    education: "M.D. Family Medicine",
    workStatus: "employed",
    relationship: "married",
    accountType: "limited",
    address: {
      street: "33 Clinic Blvd",
      city: "Oakland",
      state: "CA",
      country: "USA",
      zipCode: "94607",
    },
    location: {
      type: "Point",
      coordinates: [-122.2711, 37.8044],
      lastSeen: new Date(),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 4000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-04-20"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    socialAccounts: [],
    story: [],
    friends: [U.alice],
    friendRequests: [],
    chats: [C.aliceCarol, C.providerTeam],
    groups: [G.providerTeam],
    prescriptions: [P.aliceRx, P.danRx],
  },
  {
    _id: U.dan,
    name: "dan_patient",
    email: "dan.patient@example.com",
    phone: "+14155550404",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "offline",
    account: "active",
    gender: "male",
    age: 54,
    dob: new Date("1969-12-11"),
    bio: "Patient tracking chronic medication and using CareConnect for reminders.",
    interests: "health coaching, digital care tools",
    education: "High School Diploma",
    workStatus: "retired",
    relationship: "married",
    accountType: "public",
    address: {
      street: "59 Oak Street",
      city: "Sacramento",
      state: "CA",
      country: "USA",
      zipCode: "95814",
    },
    location: {
      type: "Point",
      coordinates: [-121.4944, 38.5816],
      lastSeen: new Date(),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: false,
      locationSharing: false,
      visibleRange: 1500,
      allowMessagesFrom: "friends",
      theme: "dark",
    },
    joined: new Date("2024-05-12"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    socialAccounts: [],
    story: [],
    friends: [U.alice],
    friendRequests: [],
    chats: [C.aliceBob, C.providerTeam],
    groups: [G.patientCommunity],
    prescriptions: [P.danRx],
  },
];

const groups = [
  {
    _id: G.pharmacySupport,
    name: "Pharmacy Support",
    pic: "https://example.com/group-pharmacy-support.png",
    bio: "Pharmacists and patients working together to manage medications.",
    createdBy: U.admin,
    admins: [U.admin, U.bob],
    members: [U.bob, U.alice, U.dan],
  },
  {
    _id: G.patientCommunity,
    name: "Patient Community",
    pic: "https://example.com/group-patient-community.png",
    bio: "A support group to discuss symptoms, prescriptions, and nearby pharmacy options.",
    createdBy: U.alice,
    admins: [U.alice],
    members: [U.alice, U.dan],
  },
  {
    _id: G.providerTeam,
    name: "Provider Team",
    pic: "https://example.com/group-provider-team.png",
    bio: "CareConnect providers collaborating on patient treatment plans.",
    createdBy: U.carol,
    admins: [U.carol],
    members: [U.carol, U.bob, U.admin],
  },
];

const chats = [
  {
    _id: C.aliceBob,
    participants: [U.alice, U.bob],
    isGroup: false,
  },
  {
    _id: C.aliceCarol,
    participants: [U.alice, U.carol],
    isGroup: false,
  },
  {
    _id: C.providerTeam,
    participants: [U.carol, U.bob, U.admin],
    isGroup: true,
  },
];

const messages = [
  {
    chatId: C.aliceBob,
    senderId: U.bob,
    receiverIds: [U.alice],
    content: "Hi Alice, your prescription refill is ready for pickup at the nearest pharmacy.",
    messageType: "text",
    status: "sent",
    sentiment: { score: 0.6, label: "positive", language: "en" },
  },
  {
    chatId: C.aliceBob,
    senderId: U.alice,
    receiverIds: [U.bob],
    content: "Thanks! Can you recommend a pharmacy that can deliver today?",
    messageType: "text",
    status: "sent",
    sentiment: { score: 0.2, label: "neutral", language: "en" },
  },
  {
    chatId: C.aliceCarol,
    senderId: U.carol,
    receiverIds: [U.alice],
    content: "Alice, I adjusted your medication schedule for morning and evening doses.",
    messageType: "text",
    status: "sent",
    sentiment: { score: 0.4, label: "positive", language: "en" },
  },
  {
    chatId: C.providerTeam,
    senderId: U.bob,
    receiverIds: [U.carol, U.admin],
    content: "I shared the prescription review notes; please confirm the refill timeline.",
    messageType: "text",
    status: "sent",
    sentiment: { score: 0.3, label: "positive", language: "en" },
  },
];

const prescriptions = [
  {
    _id: P.aliceRx,
    patientId: U.alice,
    doctorId: U.carol,
    name: "Metformin 500mg",
    dosage: "1 tablet twice a day",
    duration: 30,
    startDate: new Date("2026-03-01"),
    status: "Active",
    notes: "Monitor blood sugar levels and report any dizziness.",
    location: {
      type: "Point",
      coordinates: [-122.287, 38.297],
    },
    healthHistory: [
      {
        date: new Date("2026-03-02"),
        vitals: 110,
        healthStatus: "stable",
        symptomAnalysis: "Patient reports mild fatigue but good adherence.",
        confidence: 0.82,
        recommendations: ["Continue current dose", "Schedule follow-up in two weeks"],
        source: "manual",
      },
    ],
    currentHealth: {
      status: "stable",
      lastChecked: new Date("2026-03-02"),
      vitals: 110,
    },
  },
  {
    _id: P.danRx,
    patientId: U.dan,
    doctorId: U.carol,
    name: "Lisinopril 10mg",
    dosage: "1 tablet daily",
    duration: 60,
    startDate: new Date("2026-02-20"),
    status: "Active",
    notes: "Use CareConnect to request lab review before refill.",
    location: {
      type: "Point",
      coordinates: [-121.4944, 38.5816],
    },
    healthHistory: [
      {
        date: new Date("2026-03-01"),
        vitals: 125,
        healthStatus: "healthy",
        symptomAnalysis: "Blood pressure is within target range.",
        confidence: 0.88,
        recommendations: ["Keep daily tracking", "Update if symptoms change"],
        source: "manual",
      },
    ],
    currentHealth: {
      status: "healthy",
      lastChecked: new Date("2026-03-01"),
      vitals: 125,
    },
  },
];

const events = [
  {
    title: "Telehealth Follow-Up",
    description: "Provider follow-up call to review medication adherence and symptoms.",
    date: new Date("2026-03-10"),
    time: "14:00",
    duration: "30 min",
    type: "meeting",
    color: "#1976d2",
    completed: false,
    creatorId: U.carol,
    groupId: null,
  },
  {
    title: "Prescription Refill Reminder",
    description: "Reminder to request the next month’s refill through CareConnect.",
    date: new Date("2026-03-15"),
    time: "09:00",
    duration: "10 min",
    type: "reminder",
    color: "#388e3c",
    completed: false,
    creatorId: U.alice,
    groupId: G.patientCommunity,
  },
];

const visits = [
  {
    _id: V.visitAlice,
    visitorId: U.alice,
    farmerId: U.carol,
    cropId: P.aliceRx,
    location: { type: "Point", coordinates: [-122.287, 38.297] },
    gpsVerified: true,
    proximityDistance: 10,
    notes: "In-person medication review with provider.",
    photos: ["https://example.com/visit-alice-1.jpg"],
    duration: 40,
    status: "completed",
  },
  {
    _id: V.visitDan,
    visitorId: U.dan,
    farmerId: U.carol,
    cropId: P.danRx,
    location: { type: "Point", coordinates: [-121.4944, 38.5816] },
    gpsVerified: true,
    proximityDistance: 7,
    notes: "Prescription refill consultation and pharmacy pickup plan.",
    photos: ["https://example.com/visit-dan-1.jpg"],
    duration: 30,
    status: "completed",
  },
];

const media = [
  {
    _id: oid(),
    uploadedBy: U.alice,
    originalName: "prescription-alice.pdf",
    mimeType: "application/pdf",
    size: 204800,
    mediaType: "document",
    context: "prescription",
    relatedTo: { model: "Prescription", id: P.aliceRx },
    urls: { original: "https://example.com/prescription-alice.pdf" },
  },
  {
    _id: oid(),
    uploadedBy: U.bob,
    originalName: "delivery-guide.jpg",
    mimeType: "image/jpeg",
    size: 128000,
    mediaType: "image",
    context: "chat",
    relatedTo: { model: "Message", id: null },
    urls: { original: "https://example.com/delivery-guide.jpg", thumbnail: "https://example.com/delivery-guide-thumb.jpg" },
  },
];

const pushSubscriptions = [
  {
    _id: oid(),
    userId: U.alice,
    subscription: {
      endpoint: "https://push.example.com/alice/123",
      keys: { p256dh: "abc123", auth: "auth123" },
    },
    userAgent: "Mozilla/5.0",
    active: true,
  },
  {
    _id: oid(),
    userId: U.bob,
    subscription: {
      endpoint: "https://push.example.com/bob/456",
      keys: { p256dh: "def456", auth: "auth456" },
    },
    userAgent: "Mozilla/5.0",
    active: true,
  },
];

const activityLogs = [
  {
    actorId: U.admin,
    actorEmail: "admin@careconnect.io",
    action: "created_user",
    entityType: "User",
    entityId: U.alice,
    status: "success",
    ip: "127.0.0.1",
    userAgent: "Seed Script",
    metadata: { note: "Seeded patient account." },
  },
  {
    actorId: U.bob,
    actorEmail: "bob.pharmacist@example.com",
    action: "sent_message",
    entityType: "Message",
    entityId: null,
    status: "success",
    ip: "127.0.0.1",
    userAgent: "Seed Script",
    metadata: { note: "Seeded pharmacist chat." },
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Chat.deleteMany({}),
    Message.deleteMany({}),
    Prescription.deleteMany({}),
    Event.deleteMany({}),
    Visit.deleteMany({}),
    Media.deleteMany({}),
    PushSubscription.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);
  console.log("Cleared collections.");

  await User.insertMany(users);
  await Group.insertMany(groups);
  await Chat.insertMany(chats);
  await Message.insertMany(messages);
  await Prescription.insertMany(prescriptions);
  await Event.insertMany(events);
  await Visit.insertMany(visits);
  await Media.insertMany(media);
  await PushSubscription.insertMany(pushSubscriptions);
  await ActivityLog.insertMany(activityLogs);

  await User.updateOne({ _id: U.alice }, { $set: { chats: [C.aliceBob, C.aliceCarol, C.providerTeam], groups: [G.patientCommunity], prescriptions: [P.aliceRx] } });
  await User.updateOne({ _id: U.bob }, { $set: { chats: [C.aliceBob, C.providerTeam], groups: [G.pharmacySupport], prescriptions: [] } });
  await User.updateOne({ _id: U.carol }, { $set: { chats: [C.aliceCarol, C.providerTeam], groups: [G.providerTeam], prescriptions: [P.aliceRx, P.danRx] } });
  await User.updateOne({ _id: U.dan }, { $set: { chats: [C.providerTeam], groups: [G.patientCommunity], prescriptions: [P.danRx] } });

  console.log("Seed completed.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
