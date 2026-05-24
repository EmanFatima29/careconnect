/**
 * ============================================================
 * CareConnect – Full MongoDB Seed Script
 * ============================================================
 * This script seeds every major server collection with realistic
 * dummy data using the Mongoose models under server/src/models.
 *
 * Collections seeded:
 *   - users
 *   - groups
 *   - chats
 *   - messages
 *   - prescriptions
 *   - events
 *   - visits
 *   - media
 *   - pushsubscriptions
 *   - activitylogs
 *
 * WARNING: This script clears all seeded collections before inserting.
 * Do not run against a production database.
 * ============================================================
 */

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
  eve: oid(),
  frank: oid(),
};

const G = {
  community: oid(),
  healthTeam: oid(),
  localFarmers: oid(),
};

const C = {
  aliceBob: oid(),
  carolDan: oid(),
  eveFrank: oid(),
  groupCommunity: oid(),
  aliceCarol: oid(),
};

const P = {
  aliceA: oid(),
  bobA: oid(),
  carolA: oid(),
  danA: oid(),
  eveA: oid(),
  frankA: oid(),
};

const E = {
  communityMeeting: oid(),
  monitoringReview: oid(),
  doctorFollowUp: oid(),
};

const V = {
  visitAlice: oid(),
  visitBob: oid(),
  visitCarol: oid(),
};

const M = {
  profileAlice: oid(),
  reportCarol: oid(),
  chatImage: oid(),
};

const S = {
  alicePush: oid(),
  bobPush: oid(),
  carolPush: oid(),
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
    bio: "Platform superadmin with access to all healthcare and monitoring features.",
    interests: "policy, analytics, community support",
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
      visibleRange: 10000,
      allowMessagesFrom: "everyone",
      theme: "dark",
    },
    joined: new Date("2024-01-01"),
    lastLogin: new Date("2026-03-02T08:00:00Z"),
    lastSeen: new Date("2026-03-02T08:00:00Z"),
    story: [],
    socialAccounts: [],
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
    bio: "Community health operations manager.",
    interests: "growth, training, notifications",
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
    story: [],
    socialAccounts: [],
    friends: [U.superadmin],
    friendRequests: [],
    chats: [],
    groups: [G.community, G.healthTeam],
    prescriptions: [],
  },
  {
    _id: U.alice,
    name: "alice_nguyen",
    email: "alice.nguyen@example.com",
    phone: "+14155550101",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 29,
    dob: new Date("1996-11-03"),
    bio: "Organic patient using CareConnect for medication and community support.",
    interests: "outdoor healthcare, preventive wellness",
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
    story: [],
    socialAccounts: [],
    friends: [U.bob, U.carol],
    friendRequests: [{ sender: U.dan, status: "pending" }],
    chats: [C.aliceBob, C.aliceCarol, C.groupCommunity],
    groups: [G.community],
    prescriptions: [P.aliceA],
  },
  {
    _id: U.bob,
    name: "bob_okafor",
    email: "bob.okafor@example.com",
    phone: "+14155550202",
    password: PASSWORD_HASH,
    roles: "doctor",
    userType: "friend",
    status: "offline",
    account: "active",
    gender: "male",
    age: 33,
    dob: new Date("1992-05-18"),
    bio: "Distance healthcare specialist providing rural patient care.",
    interests: "telehealth, diagnostics, patient health",
    education: "M.D. Family Medicine",
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
    story: [],
    socialAccounts: [],
    friends: [U.alice],
    friendRequests: [],
    chats: [C.aliceBob, C.bobDan, C.groupCommunity],
    groups: [G.healthTeam],
    prescriptions: [P.bobA],
  },
  {
    _id: U.carol,
    name: "carol_reyes",
    email: "carol.reyes@example.com",
    phone: "+14155550303",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 27,
    dob: new Date("1998-09-30"),
    bio: "Community patient who tracks prescriptions and wellness-related health.",
    interests: "gardening, local health groups",
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
    story: [],
    socialAccounts: [],
    friends: [U.alice, U.frank],
    friendRequests: [],
    chats: [C.aliceCarol, C.carolDan, C.groupCommunity],
    groups: [G.community, G.localFarmers],
    prescriptions: [P.carolA],
  },
  {
    _id: U.dan,
    name: "dan_petrov",
    email: "dan.petrov@example.com",
    phone: "+14155550404",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "male",
    age: 41,
    dob: new Date("1984-12-07"),
    bio: "Chronic care patient staying connected through prescriptions and visits.",
    interests: "analytics, community health",
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
    story: [],
    socialAccounts: [],
    friends: [U.bob],
    friendRequests: [],
    chats: [C.carolDan, C.bobDan],
    groups: [G.healthTeam],
    prescriptions: [P.danA],
  },
  {
    _id: U.eve,
    name: "eve_kim",
    email: "eve.kim@example.com",
    phone: "+14155550505",
    password: PASSWORD_HASH,
    roles: "doctor",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 31,
    dob: new Date("1992-01-27"),
    bio: "Telehealth provider focused on preventive medicine.",
    interests: "nutrition, community outreach",
    education: "M.D. Internal Medicine",
    workStatus: "employed",
    relationship: "single",
    accountType: "public",
    address: {
      street: "106 Orchard St",
      city: "Berkeley",
      state: "CA",
      country: "USA",
      zipCode: "94704",
    },
    location: {
      type: "Point",
      coordinates: [-122.2727, 37.8715],
      lastSeen: new Date("2026-03-02T09:05:00Z"),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 3000,
      allowMessagesFrom: "friends",
      theme: "light",
    },
    joined: new Date("2024-04-01"),
    lastLogin: new Date("2026-03-02T09:05:00Z"),
    lastSeen: new Date("2026-03-02T09:05:00Z"),
    story: [],
    socialAccounts: [],
    friends: [U.frank],
    friendRequests: [],
    chats: [C.eveFrank, C.groupCommunity],
    groups: [G.community, G.healthTeam],
    prescriptions: [P.eveA],
  },
  {
    _id: U.frank,
    name: "frank_adebayo",
    email: "frank.adebayo@example.com",
    phone: "+14155550606",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "offline",
    account: "active",
    gender: "male",
    age: 36,
    dob: new Date("1988-04-09"),
    bio: "Patient managing long-term prescriptions.",
    interests: "patient health, mobile monitoring",
    education: "B.Sc. Agriculture",
    workStatus: "freelance",
    relationship: "single",
    accountType: "public",
    address: {
      street: "55 Wellness Road",
      city: "Modesto",
      state: "CA",
      country: "USA",
      zipCode: "95350",
    },
    location: {
      type: "Point",
      coordinates: [-120.9876, 37.6391],
      lastSeen: new Date("2026-03-01T20:20:00Z"),
    },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 1500,
      allowMessagesFrom: "everyone",
      theme: "dark",
    },
    joined: new Date("2024-05-01"),
    lastLogin: new Date("2026-03-01T20:20:00Z"),
    lastSeen: new Date("2026-03-01T20:20:00Z"),
    story: [],
    socialAccounts: [],
    friends: [U.carol],
    friendRequests: [],
    chats: [C.eveFrank, C.groupCommunity],
    groups: [G.localFarmers],
    prescriptions: [P.frankA],
  },
];

const groups = [
  {
    _id: G.community,
    name: "CareConnect Community",
    pic: "https://example.com/group-community.png",
    bio: "Patients and providers sharing health updates in the local care network.",
    createdBy: U.admin,
    admins: [U.admin, U.bob],
    members: [U.alice, U.bob, U.carol, U.dan, U.eve, U.frank],
  },
  {
    _id: G.healthTeam,
    name: "Health Team",
    pic: "https://example.com/group-healthteam.png",
    bio: "Doctor and admin team coordinating prescriptions and monitoring.",
    createdBy: U.admin,
    admins: [U.admin, U.eve],
    members: [U.admin, U.bob, U.eve],
  },
  {
    _id: G.localFarmers,
    name: "Local Health Circle",
    pic: "https://example.com/group-healthcircle.png",
    bio: "Patients collaborating on preventive care and treatment health.",
    createdBy: U.carol,
    admins: [U.carol],
    members: [U.carol, U.frank],
  },
];

const chats = [
  {
    _id: C.aliceBob,
    participants: [U.alice, U.bob],
    isGroup: false,
    unreadMessages: new Map([[U.alice.toString(), 0], [U.bob.toString(), 1]]),
    messages: [],
  },
  {
    _id: C.carolDan,
    participants: [U.carol, U.dan],
    isGroup: false,
    unreadMessages: new Map([[U.carol.toString(), 0], [U.dan.toString(), 0]]),
    messages: [],
  },
  {
    _id: C.eveFrank,
    participants: [U.eve, U.frank],
    isGroup: false,
    unreadMessages: new Map([[U.eve.toString(), 0], [U.frank.toString(), 2]]),
    messages: [],
  },
  {
    _id: C.aliceCarol,
    participants: [U.alice, U.carol],
    isGroup: false,
    unreadMessages: new Map([[U.alice.toString(), 0], [U.carol.toString(), 0]]),
    messages: [],
  },
  {
    _id: C.groupCommunity,
    participants: [U.alice, U.bob, U.carol, U.dan, U.eve, U.frank],
    isGroup: true,
    unreadMessages: new Map([[U.alice.toString(), 0], [U.bob.toString(), 0], [U.carol.toString(), 0], [U.dan.toString(), 0], [U.eve.toString(), 0], [U.frank.toString(), 0]]),
    messages: [],
  },
];

const messages = [
  {
    chatId: C.aliceBob,
    senderId: U.bob,
    receiverIds: [U.alice],
    content: "Hi Alice, your prescription refill is ready for pickup.",
    status: "delivered",
    sentiment: { score: 0.4, label: "positive", language: "en" },
  },
  {
    chatId: C.aliceBob,
    senderId: U.alice,
    receiverIds: [U.bob],
    content: "Thanks! I can collect it this afternoon.",
    status: "seen",
    sentiment: { score: 0.5, label: "positive", language: "en" },
  },
  {
    chatId: C.carolDan,
    senderId: U.carol,
    receiverIds: [U.dan],
    content: "Dan, do you want to join the local health meeting tomorrow?",
    status: "sent",
    sentiment: { score: 0.2, label: "neutral", language: "en" },
  },
  {
    chatId: C.eveFrank,
    senderId: U.eve,
    receiverIds: [U.frank],
    content: "Frank, your monitoring report suggests stable vitals.",
    status: "delivered",
    sentiment: { score: 0.6, label: "positive", language: "en" },
  },
  {
    chatId: C.aliceCarol,
    senderId: U.alice,
    receiverIds: [U.carol],
    content: "Carol, I updated the prescription schedule in my profile.",
    status: "seen",
    sentiment: { score: 0.1, label: "neutral", language: "en" },
  },
  {
    chatId: C.groupCommunity,
    senderId: U.frank,
    receiverIds: [U.alice, U.bob, U.carol, U.dan, U.eve],
    content: "Reminder: community check-in at 5 PM today.",
    status: "sent",
    sentiment: { score: 0.3, label: "positive", language: "en" },
  },
];

const prescriptions = [
  {
    _id: P.aliceA,
    patientId: U.alice,
    doctorId: U.bob,
    name: "Iron Supplement",
    dosage: "1 tablet daily",
    duration: 30,
    startDate: new Date("2026-02-20"),
    status: "Active",
    notes: "Take with food and drink plenty of water.",
    location: { type: "Point", coordinates: [-122.287, 38.297] },
    currentHealth: { status: "stable", lastChecked: new Date("2026-03-01"), vitals: 82 },
    healthHistory: [
      { date: new Date("2026-02-20"), vitals: 80, healthStatus: "stable", symptomAnalysis: "normal", confidence: 0.9, recommendations: ["Continue medication"], source: "manual" },
    ],
  },
  {
    _id: P.bobA,
    patientId: U.bob,
    doctorId: U.eve,
    name: "Blood Pressure Control",
    dosage: "5 mg twice daily",
    duration: 60,
    startDate: new Date("2026-02-15"),
    status: "Active",
    notes: "Monitor daily and report any dizziness.",
    location: { type: "Point", coordinates: [-119.772, 36.737] },
    currentHealth: { status: "stable", lastChecked: new Date("2026-03-01"), vitals: 75 },
  },
  {
    _id: P.carolA,
    patientId: U.carol,
    doctorId: U.bob,
    name: "Vitamin D",
    dosage: "2 capsules daily",
    duration: 45,
    startDate: new Date("2026-02-25"),
    status: "Active",
    notes: "Use after breakfast.",
    location: { type: "Point", coordinates: [-121.494, 38.581] },
    currentHealth: { status: "healthy", lastChecked: new Date("2026-03-01"), vitals: 88 },
  },
  {
    _id: P.danA,
    patientId: U.dan,
    doctorId: U.eve,
    name: "Aspirin",
    dosage: "81 mg once daily",
    duration: 90,
    startDate: new Date("2026-02-10"),
    status: "Active",
    notes: "Take every morning.",
    location: { type: "Point", coordinates: [-119.018, 35.373] },
    currentHealth: { status: "stable", lastChecked: new Date("2026-02-28"), vitals: 77 },
  },
  {
    _id: P.eveA,
    patientId: U.eve,
    doctorId: U.admin,
    name: "Probiotic Formula",
    dosage: "1 capsule daily",
    duration: 30,
    startDate: new Date("2026-02-28"),
    status: "Active",
    notes: "Keep at room temperature.",
  },
  {
    _id: P.frankA,
    patientId: U.frank,
    doctorId: U.bob,
    name: "Omega 3",
    dosage: "1 capsule daily",
    duration: 60,
    startDate: new Date("2026-02-20"),
    status: "Active",
    notes: "Take with meal.",
    location: { type: "Point", coordinates: [-120.9876, 37.6391] },
  },
];

const events = [
  {
    _id: E.communityMeeting,
    title: "Community Care Meetup",
    description: "Monthly patient and provider meeting for updates and support.",
    date: new Date("2026-03-10"),
    time: "16:00",
    duration: "1 hour",
    type: "meeting",
    color: "#2e7d32",
    completed: false,
    creatorId: U.admin,
    groupId: G.community,
  },
  {
    _id: E.monitoringReview,
    title: "Prescriptions Review",
    description: "Health team reviews patient vitals and medication plans.",
    date: new Date("2026-03-12"),
    time: "10:00",
    duration: "45 min",
    type: "review",
    color: "#1976d2",
    completed: false,
    creatorId: U.bob,
    groupId: G.healthTeam,
  },
  {
    _id: E.doctorFollowUp,
    title: "Follow-up Consultation",
    description: "Telehealth follow-up for patient Dan on his new prescription plan.",
    date: new Date("2026-03-13"),
    time: "14:30",
    duration: "30 min",
    type: "meeting",
    color: "#ff9800",
    completed: false,
    creatorId: U.eve,
    groupId: null,
  },
];

const visits = [
  {
    _id: V.visitAlice,
    visitorId: U.alice,
    farmerId: U.bob,
    cropId: P.aliceA,
    location: { type: "Point", coordinates: [-122.287, 38.297] },
    gpsVerified: true,
    proximityDistance: 12,
    notes: "On-site check of medication adherence.",
    photos: ["https://example.com/visit-alice-1.jpg"],
    duration: 40,
    status: "completed",
  },
  {
    _id: V.visitBob,
    visitorId: U.bob,
    farmerId: U.eve,
    cropId: P.bobA,
    location: { type: "Point", coordinates: [-119.772, 36.737] },
    gpsVerified: true,
    proximityDistance: 8,
    notes: "Follow-up visit for blood pressure control.",
    photos: ["https://example.com/visit-bob-1.jpg"],
    duration: 35,
    status: "completed",
  },
  {
    _id: V.visitCarol,
    visitorId: U.carol,
    farmerId: U.bob,
    cropId: P.carolA,
    location: { type: "Point", coordinates: [-121.494, 38.581] },
    gpsVerified: false,
    proximityDistance: 4,
    notes: "Community pickup and prescription review.",
    photos: ["https://example.com/visit-carol-1.jpg"],
    duration: 25,
    status: "completed",
  },
];

const media = [
  {
    _id: M.profileAlice,
    uploadedBy: U.alice,
    originalName: "alice-profile.png",
    mimeType: "image/png",
    size: 120000,
    mediaType: "image",
    context: "profile",
    relatedTo: { model: "User", id: U.alice },
    urls: {
      original: "https://example.com/media/alice-original.png",
      thumbnail: "https://example.com/media/alice-thumb.png",
      small: "https://example.com/media/alice-small.png",
      medium: "https://example.com/media/alice-medium.png",
      large: "https://example.com/media/alice-large.png",
    },
    dimensions: { width: 400, height: 400 },
    aiAnalysis: { status: "completed", result: "healthy", confidence: 0.98, details: { faceDetected: true }, analyzedAt: new Date() },
  },
  {
    _id: M.reportCarol,
    uploadedBy: U.carol,
    originalName: "report-carol.pdf",
    mimeType: "application/pdf",
    size: 340000,
    mediaType: "document",
    context: "prescription",
    relatedTo: { model: "Prescription", id: P.carolA },
    urls: { original: "https://example.com/media/report-carol.pdf" },
  },
  {
    _id: M.chatImage,
    uploadedBy: U.eve,
    originalName: "checkin-photo.jpg",
    mimeType: "image/jpeg",
    size: 260000,
    mediaType: "image",
    context: "chat",
    relatedTo: { model: "Message", id: oid() },
    urls: {
      original: "https://example.com/media/chat-image.jpg",
      thumbnail: "https://example.com/media/chat-image-thumb.jpg",
      small: "https://example.com/media/chat-image-small.jpg",
    },
    dimensions: { width: 1080, height: 720 },
  },
];

const pushSubscriptions = [
  {
    _id: S.alicePush,
    userId: U.alice,
    subscription: {
      endpoint: "https://push.example.com/alice/endpoint",
      keys: { p256dh: "alice-p256dh", auth: "alice-auth" },
    },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    active: true,
  },
  {
    _id: S.bobPush,
    userId: U.bob,
    subscription: {
      endpoint: "https://push.example.com/bob/endpoint",
      keys: { p256dh: "bob-p256dh", auth: "bob-auth" },
    },
    userAgent: "Mozilla/5.0 (Android 11; Mobile)",
    active: true,
  },
  {
    _id: S.carolPush,
    userId: U.carol,
    subscription: {
      endpoint: "https://push.example.com/carol/endpoint",
      keys: { p256dh: "carol-p256dh", auth: "carol-auth" },
    },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0)",
    active: true,
  },
];

const activityLogs = [
  {
    actorId: U.admin,
    actorEmail: "admin@careconnect.io",
    action: "created_group",
    entityType: "Group",
    entityId: G.community,
    status: "success",
    ip: "203.0.113.5",
    userAgent: "Mozilla/5.0",
    metadata: { groupName: "CareConnect Community" },
  },
  {
    actorId: U.bob,
    actorEmail: "bob.okafor@example.com",
    action: "sent_message",
    entityType: "Message",
    entityId: oid(),
    status: "success",
    ip: "203.0.113.10",
    userAgent: "Mozilla/5.0",
    metadata: { chat: "alice-bob" },
  },
  {
    actorId: U.eve,
    actorEmail: "eve.kim@example.com",
    action: "created_prescription",
    entityType: "Prescription",
    entityId: P.eveA,
    status: "success",
    ip: "203.0.113.12",
    userAgent: "Mozilla/5.0",
    metadata: { patient: "eve_kim" },
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

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

  const insertedUsers = await User.insertMany(users);
  const insertedGroups = await Group.insertMany(groups);
  const insertedChats = await Chat.insertMany(chats);

  const messageDocs = messages.map((message) => ({
    _id: oid(),
    ...message,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const insertedMessages = await Message.insertMany(messageDocs);

  const updatedChats = insertedChats.map((chat) => {
    const chatMessages = messageDocs.filter((msg) => msg.chatId.equals(chat._id));
    return {
      _id: chat._id,
      messages: chatMessages.map((msg) => msg._id),
      lastMessage: chatMessages.length ? chatMessages[chatMessages.length - 1]._id : null,
    };
  });
  await Promise.all(
    updatedChats.map((chat) => Chat.updateOne({ _id: chat._id }, { $set: chat }))
  );

  await Prescription.insertMany(prescriptions);
  await Event.insertMany(events);
  await Visit.insertMany(visits);
  await Media.insertMany(media);
  await PushSubscription.insertMany(pushSubscriptions);
  await ActivityLog.insertMany(activityLogs);

  // update user references for chats, groups, prescriptions
  await Promise.all([
    User.updateOne({ _id: U.alice }, { $set: { chats: [C.aliceBob, C.aliceCarol, C.groupCommunity], groups: [G.community], prescriptions: [P.aliceA] } }),
    User.updateOne({ _id: U.bob }, { $set: { chats: [C.aliceBob, C.bobDan, C.groupCommunity], groups: [G.healthTeam], prescriptions: [P.bobA] } }),
    User.updateOne({ _id: U.carol }, { $set: { chats: [C.carolDan, C.aliceCarol, C.groupCommunity], groups: [G.community, G.localFarmers], prescriptions: [P.carolA] } }),
    User.updateOne({ _id: U.dan }, { $set: { chats: [C.carolDan, C.bobDan], groups: [G.healthTeam], prescriptions: [P.danA] } }),
    User.updateOne({ _id: U.eve }, { $set: { chats: [C.eveFrank, C.groupCommunity], groups: [G.community, G.healthTeam], prescriptions: [P.eveA] } }),
    User.updateOne({ _id: U.frank }, { $set: { chats: [C.eveFrank, C.groupCommunity], groups: [G.localFarmers], prescriptions: [P.frankA] } }),
    User.updateOne({ _id: U.admin }, { $set: { groups: [G.community, G.healthTeam] } }),
    User.updateOne({ _id: U.superadmin }, { $set: { groups: [], chats: [], prescriptions: [] } }),
  ]);

  console.log("Seeding complete.");
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
