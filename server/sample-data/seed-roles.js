/**
 * ============================================================
 * CareConnect – Roles Seed Script
 * ============================================================
 * Seeds all four core role types with realistic data:
 *   - 1 superadmin  +  1 admin
 *   - 3 doctors     (with doctorProfile, verified: true)
 *   - 3 pharmacies  (with pharmacyProfile, verified: true)
 *   - 6 patients
 *
 * Also seeds related collections:
 *   - prescriptions  (doctor → patient)
 *   - appointments   (patient → doctor, mixed statuses)
 *   - ratings        (patients rating doctors & pharmacies)
 *
 * WARNING: Clears the above collections before inserting.
 * Do NOT run against a production database.
 *
 * Usage:
 *   node sample-data/seed-roles.js
 *   node sample-data/seed-roles.js --force   # skip "are you sure?" check
 *
 * Demo password for every account: Demo@1234
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
import Prescription from "../src/models/prescriptionModel.js";
import Appointment from "../src/models/appointmentModel.js";
import Rating from "../src/models/ratingModel.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const oid = () => new mongoose.Types.ObjectId();
const DEMO_PASSWORD = "Demo@1234";
const PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

// ── Stable IDs ────────────────────────────────────────────────────────────────
const U = {
  superadmin:  oid(),
  admin:       oid(),
  // Doctors
  drCarter:    oid(),
  drAli:       oid(),
  drKhan:      oid(),
  // Pharmacies
  cityMed:     oid(),
  healthPlus:  oid(),
  careZone:    oid(),
  // Patients
  john:        oid(),
  anna:        oid(),
  kevin:       oid(),
  priya:       oid(),
  marcus:      oid(),
  lisa:        oid(),
};

// ── Users ─────────────────────────────────────────────────────────────────────
const users = [
  // ── Admins ──────────────────────────────────────────────────────────────────
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
    age: 40,
    dob: new Date("1984-06-10"),
    bio: "Platform superadmin with full access to all features.",
    interests: "policy, analytics, platform health",
    education: "M.Sc. Information Systems",
    workStatus: "employed",
    relationship: "single",
    accountType: "private",
    address: { street: "1 Admin Plaza", city: "New York", state: "NY", country: "USA", zipCode: "10001" },
    location: { type: "Point", coordinates: [-74.006, 40.7128], lastSeen: new Date() },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: false,
      visibleRange: 10000,
      allowMessagesFrom: "everyone",
      theme: "dark",
    },
    joined: new Date("2024-01-01"),
    lastLogin: new Date(),
    lastSeen: new Date(),
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
    age: 35,
    dob: new Date("1989-03-18"),
    bio: "Community health operations manager.",
    interests: "training, notifications, team management",
    education: "B.A. Health Administration",
    workStatus: "employed",
    relationship: "relationship",
    accountType: "limited",
    address: { street: "22 Control St", city: "Chicago", state: "IL", country: "USA", zipCode: "60601" },
    location: { type: "Point", coordinates: [-87.6298, 41.8781], lastSeen: new Date() },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: false,
      visibleRange: 5000,
      allowMessagesFrom: "friends",
      theme: "light",
    },
    joined: new Date("2024-01-05"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [U.superadmin],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },

  // ── Doctors ──────────────────────────────────────────────────────────────────
  {
    _id: U.drCarter,
    name: "dr_james_carter",
    email: "dr.carter@careconnect.io",
    phone: "+14155551001",
    password: PASSWORD_HASH,
    roles: "doctor",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "male",
    age: 45,
    dob: new Date("1979-08-14"),
    bio: "Board-certified cardiologist with 15 years of clinical experience.",
    interests: "cardiology, preventive care, telehealth",
    education: "M.D. Cardiology – Johns Hopkins University",
    workStatus: "employed",
    relationship: "relationship",
    accountType: "public",
    address: { street: "200 Heartcare Ave", city: "San Francisco", state: "CA", country: "USA", zipCode: "94103" },
    location: { type: "Point", coordinates: [-122.4194, 37.7749], lastSeen: new Date() },
    doctorProfile: {
      specialty: "Cardiology",
      licenseNumber: "CA-DOC-10021",
      experience: 15,
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      availableFrom: "09:00",
      availableTo: "17:00",
      consultationFee: 120,
      verified: true,
    },
    ratingSummary: { averageRating: 0, totalRatings: 0 },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 5000,
      allowMessagesFrom: "everyone",
      theme: "dark",
    },
    joined: new Date("2024-02-01"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.drAli,
    name: "dr_sarah_ali",
    email: "dr.ali@careconnect.io",
    phone: "+14155551002",
    password: PASSWORD_HASH,
    roles: "doctor",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 38,
    dob: new Date("1986-11-25"),
    bio: "Pediatrician committed to compassionate child and family healthcare.",
    interests: "pediatrics, child wellness, vaccination programs",
    education: "M.D. Pediatrics – UCLA School of Medicine",
    workStatus: "employed",
    relationship: "single",
    accountType: "public",
    address: { street: "55 Kidcare Blvd", city: "Los Angeles", state: "CA", country: "USA", zipCode: "90001" },
    location: { type: "Point", coordinates: [-118.2437, 34.0522], lastSeen: new Date() },
    doctorProfile: {
      specialty: "Pediatrics",
      licenseNumber: "CA-DOC-10022",
      experience: 10,
      availableDays: ["Monday", "Wednesday", "Friday"],
      availableFrom: "08:00",
      availableTo: "16:00",
      consultationFee: 90,
      verified: true,
    },
    ratingSummary: { averageRating: 0, totalRatings: 0 },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 4000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-02-10"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.drKhan,
    name: "dr_omar_khan",
    email: "dr.khan@careconnect.io",
    phone: "+14155551003",
    password: PASSWORD_HASH,
    roles: "doctor",
    userType: "friend",
    status: "offline",
    account: "active",
    gender: "male",
    age: 42,
    dob: new Date("1982-04-07"),
    bio: "Internal medicine specialist focusing on chronic disease management.",
    interests: "internal medicine, diabetes care, hypertension",
    education: "M.D. Internal Medicine – University of Chicago",
    workStatus: "employed",
    relationship: "relationship",
    accountType: "public",
    address: { street: "88 Wellness Track", city: "Chicago", state: "IL", country: "USA", zipCode: "60607" },
    location: { type: "Point", coordinates: [-87.6551, 41.8444], lastSeen: new Date() },
    doctorProfile: {
      specialty: "Internal Medicine",
      licenseNumber: "IL-DOC-20031",
      experience: 12,
      availableDays: ["Tuesday", "Thursday", "Saturday"],
      availableFrom: "10:00",
      availableTo: "18:00",
      consultationFee: 100,
      verified: true,
    },
    ratingSummary: { averageRating: 0, totalRatings: 0 },
    settings: {
      chatNotifications: false,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 3000,
      allowMessagesFrom: "friends",
      theme: "dark",
    },
    joined: new Date("2024-02-20"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },

  // ── Pharmacies ───────────────────────────────────────────────────────────────
  {
    _id: U.cityMed,
    name: "citymed_pharmacy",
    email: "citymed@careconnect.io",
    phone: "+14155552001",
    password: PASSWORD_HASH,
    roles: "pharmacy",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "other",
    age: null,
    bio: "Full-service pharmacy offering prescription fulfillment and home delivery.",
    interests: "prescription services, health consultations",
    education: "Licensed Pharmacy – State of California",
    workStatus: "employed",
    relationship: "single",
    accountType: "public",
    address: { street: "300 Market St", city: "San Francisco", state: "CA", country: "USA", zipCode: "94105" },
    location: { type: "Point", coordinates: [-122.3983, 37.7911], lastSeen: new Date() },
    pharmacyProfile: {
      licenseNumber: "CA-PHARM-5501",
      operatingHours: { open: "08:00", close: "22:00" },
      services: ["Prescription Filling", "Home Delivery", "Vaccination", "Health Consultation"],
      verified: true,
    },
    ratingSummary: { averageRating: 0, totalRatings: 0 },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 5000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-03-01"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.healthPlus,
    name: "healthplus_pharmacy",
    email: "healthplus@careconnect.io",
    phone: "+14155552002",
    password: PASSWORD_HASH,
    roles: "pharmacy",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "other",
    age: null,
    bio: "24-hour pharmacy with lab testing and compounding services.",
    interests: "lab tests, compounding, urgent prescriptions",
    education: "Licensed Pharmacy – State of California",
    workStatus: "employed",
    relationship: "single",
    accountType: "public",
    address: { street: "14 Sunset Blvd", city: "Los Angeles", state: "CA", country: "USA", zipCode: "90028" },
    location: { type: "Point", coordinates: [-118.3405, 34.0983], lastSeen: new Date() },
    pharmacyProfile: {
      licenseNumber: "CA-PHARM-5502",
      operatingHours: { open: "00:00", close: "23:59" },
      services: ["24hr Service", "Compounding", "Lab Tests", "Home Delivery"],
      verified: true,
    },
    ratingSummary: { averageRating: 0, totalRatings: 0 },
    settings: {
      chatNotifications: true,
      showReadReceipts: false,
      locationSharing: true,
      visibleRange: 5000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-03-05"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.careZone,
    name: "carezone_pharmacy",
    email: "carezone@careconnect.io",
    phone: "+13125552003",
    password: PASSWORD_HASH,
    roles: "pharmacy",
    userType: "friend",
    status: "offline",
    account: "active",
    gender: "other",
    age: null,
    bio: "Community pharmacy specializing in chronic care medication management.",
    interests: "chronic care, senior medication management",
    education: "Licensed Pharmacy – State of Illinois",
    workStatus: "employed",
    relationship: "single",
    accountType: "public",
    address: { street: "77 Lakeshore Dr", city: "Chicago", state: "IL", country: "USA", zipCode: "60611" },
    location: { type: "Point", coordinates: [-87.6187, 41.8962], lastSeen: new Date() },
    pharmacyProfile: {
      licenseNumber: "IL-PHARM-7701",
      operatingHours: { open: "08:00", close: "20:00" },
      services: ["Chronic Care", "Senior Discounts", "Prescription Filling", "Medication Counseling"],
      verified: true,
    },
    ratingSummary: { averageRating: 0, totalRatings: 0 },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 3000,
      allowMessagesFrom: "everyone",
      theme: "dark",
    },
    joined: new Date("2024-03-10"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },

  // ── Patients ─────────────────────────────────────────────────────────────────
  {
    _id: U.john,
    name: "john_miller",
    email: "john.miller@example.com",
    phone: "+14155553001",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "male",
    age: 52,
    dob: new Date("1972-09-12"),
    bio: "Managing type 2 diabetes with regular cardiology follow-ups.",
    interests: "hiking, nutrition, wellness tracking",
    education: "B.Sc. Business Administration",
    workStatus: "employed",
    relationship: "relationship",
    accountType: "public",
    address: { street: "10 Oakwood St", city: "San Francisco", state: "CA", country: "USA", zipCode: "94110" },
    location: { type: "Point", coordinates: [-122.4102, 37.7598], lastSeen: new Date() },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 2000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-04-01"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.anna,
    name: "anna_rodriguez",
    email: "anna.rodriguez@example.com",
    phone: "+14155553002",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 28,
    dob: new Date("1996-02-14"),
    bio: "Young mother managing her child's health through CareConnect.",
    interests: "child wellness, community health",
    education: "B.A. Nursing",
    workStatus: "freelance",
    relationship: "relationship",
    accountType: "public",
    address: { street: "25 Sunset Ave", city: "Los Angeles", state: "CA", country: "USA", zipCode: "90046" },
    location: { type: "Point", coordinates: [-118.3600, 34.1050], lastSeen: new Date() },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 1500,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-04-05"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.kevin,
    name: "kevin_chen",
    email: "kevin.chen@example.com",
    phone: "+13125553003",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "offline",
    account: "active",
    gender: "male",
    age: 61,
    dob: new Date("1963-07-30"),
    bio: "Retired engineer managing hypertension and cholesterol.",
    interests: "cycling, health monitoring, senior wellness",
    education: "M.Sc. Electrical Engineering",
    workStatus: "unemployed",
    relationship: "relationship",
    accountType: "limited",
    address: { street: "100 Lakeview Dr", city: "Chicago", state: "IL", country: "USA", zipCode: "60614" },
    location: { type: "Point", coordinates: [-87.6473, 41.9228], lastSeen: new Date() },
    settings: {
      chatNotifications: false,
      showReadReceipts: true,
      locationSharing: false,
      visibleRange: 1000,
      allowMessagesFrom: "friends",
      theme: "light",
    },
    joined: new Date("2024-04-10"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.priya,
    name: "priya_patel",
    email: "priya.patel@example.com",
    phone: "+14085553004",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "female",
    age: 33,
    dob: new Date("1991-05-21"),
    bio: "Health-conscious professional tracking iron levels and nutrition.",
    interests: "fitness, nutrition, preventive care",
    education: "B.Sc. Nutrition Science",
    workStatus: "employed",
    relationship: "single",
    accountType: "public",
    address: { street: "45 Silicon Way", city: "San Jose", state: "CA", country: "USA", zipCode: "95110" },
    location: { type: "Point", coordinates: [-121.8863, 37.3382], lastSeen: new Date() },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: true,
      visibleRange: 2000,
      allowMessagesFrom: "everyone",
      theme: "light",
    },
    joined: new Date("2024-04-15"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.marcus,
    name: "marcus_johnson",
    email: "marcus.johnson@example.com",
    phone: "+14155553005",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "online",
    account: "active",
    gender: "male",
    age: 47,
    dob: new Date("1977-12-03"),
    bio: "Managing high cholesterol through medication and lifestyle changes.",
    interests: "community health, diet management",
    education: "B.A. Social Work",
    workStatus: "employed",
    relationship: "complicated",
    accountType: "public",
    address: { street: "33 Bay St", city: "Oakland", state: "CA", country: "USA", zipCode: "94607" },
    location: { type: "Point", coordinates: [-122.2711, 37.8044], lastSeen: new Date() },
    settings: {
      chatNotifications: true,
      showReadReceipts: false,
      locationSharing: true,
      visibleRange: 3000,
      allowMessagesFrom: "everyone",
      theme: "dark",
    },
    joined: new Date("2024-04-20"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
  {
    _id: U.lisa,
    name: "lisa_wong",
    email: "lisa.wong@example.com",
    phone: "+13125553006",
    password: PASSWORD_HASH,
    roles: "patient",
    userType: "friend",
    status: "offline",
    account: "active",
    gender: "female",
    age: 39,
    dob: new Date("1985-10-17"),
    bio: "Managing vitamin B12 deficiency and fatigue with specialist care.",
    interests: "yoga, holistic health, nutrition",
    education: "M.A. Public Health",
    workStatus: "employed",
    relationship: "single",
    accountType: "limited",
    address: { street: "19 Elm St", city: "Evanston", state: "IL", country: "USA", zipCode: "60201" },
    location: { type: "Point", coordinates: [-87.6876, 42.0451], lastSeen: new Date() },
    settings: {
      chatNotifications: true,
      showReadReceipts: true,
      locationSharing: false,
      visibleRange: 1000,
      allowMessagesFrom: "friends",
      theme: "light",
    },
    joined: new Date("2024-04-25"),
    lastLogin: new Date(),
    lastSeen: new Date(),
    story: [],
    socialAccounts: [],
    friends: [],
    friendRequests: [],
    chats: [],
    groups: [],
    prescriptions: [],
  },
];

// ── Prescriptions ─────────────────────────────────────────────────────────────
const P = {
  johnRx:   oid(),
  annaRx:   oid(),
  kevinRx:  oid(),
  priyaRx:  oid(),
  marcusRx: oid(),
  lisaRx:   oid(),
};

const prescriptions = [
  {
    _id: P.johnRx,
    patientId: U.john,
    doctorId: U.drCarter,
    name: "Metformin",
    dosage: "500 mg twice daily",
    duration: 90,
    startDate: new Date("2026-03-01"),
    status: "Active",
    notes: "Take with meals. Monitor blood sugar weekly and report readings.",
    location: { type: "Point", coordinates: [-122.4102, 37.7598] },
    currentHealth: { status: "stable", lastChecked: new Date("2026-05-01"), vitals: 78 },
    healthHistory: [
      {
        date: new Date("2026-03-01"),
        vitals: 72,
        healthStatus: "stable",
        symptomAnalysis: "Elevated blood sugar, starting medication",
        confidence: 0.88,
        recommendations: ["Begin Metformin", "Low-carb diet", "30 min daily walk"],
        source: "diagnostic",
      },
      {
        date: new Date("2026-04-01"),
        vitals: 76,
        healthStatus: "stable",
        symptomAnalysis: "Blood sugar improving",
        confidence: 0.91,
        recommendations: ["Continue Metformin", "Maintain diet"],
        source: "manual",
      },
    ],
  },
  {
    _id: P.annaRx,
    patientId: U.anna,
    doctorId: U.drAli,
    name: "Amoxicillin",
    dosage: "500 mg three times daily",
    duration: 10,
    startDate: new Date("2026-05-10"),
    status: "Active",
    notes: "Complete the full course even if symptoms improve.",
    location: { type: "Point", coordinates: [-118.3600, 34.1050] },
    currentHealth: { status: "healthy", lastChecked: new Date("2026-05-15"), vitals: 92 },
    healthHistory: [
      {
        date: new Date("2026-05-10"),
        vitals: 80,
        healthStatus: "stable",
        symptomAnalysis: "Bacterial throat infection",
        confidence: 0.95,
        recommendations: ["Full antibiotic course", "Rest", "Increase fluids"],
        source: "diagnostic",
      },
    ],
  },
  {
    _id: P.kevinRx,
    patientId: U.kevin,
    doctorId: U.drKhan,
    name: "Lisinopril",
    dosage: "10 mg once daily",
    duration: 180,
    startDate: new Date("2026-01-15"),
    status: "Active",
    notes: "Take in the morning. Avoid potassium supplements unless prescribed.",
    location: { type: "Point", coordinates: [-87.6473, 41.9228] },
    currentHealth: { status: "stable", lastChecked: new Date("2026-05-10"), vitals: 75 },
    healthHistory: [
      {
        date: new Date("2026-01-15"),
        vitals: 65,
        healthStatus: "worsening",
        symptomAnalysis: "High blood pressure 150/95",
        confidence: 0.93,
        recommendations: ["Start Lisinopril", "Salt-restricted diet", "Daily monitoring"],
        source: "diagnostic",
      },
      {
        date: new Date("2026-03-15"),
        vitals: 72,
        healthStatus: "stable",
        symptomAnalysis: "Blood pressure improving: 135/85",
        confidence: 0.90,
        recommendations: ["Continue medication", "Maintain diet"],
        source: "manual",
      },
    ],
  },
  {
    _id: P.priyaRx,
    patientId: U.priya,
    doctorId: U.drCarter,
    name: "Ferrous Sulfate",
    dosage: "325 mg once daily",
    duration: 60,
    startDate: new Date("2026-04-01"),
    status: "Active",
    notes: "Take on an empty stomach with vitamin C for better absorption.",
    location: { type: "Point", coordinates: [-121.8863, 37.3382] },
    currentHealth: { status: "stable", lastChecked: new Date("2026-05-01"), vitals: 84 },
    healthHistory: [
      {
        date: new Date("2026-04-01"),
        vitals: 78,
        healthStatus: "stable",
        symptomAnalysis: "Iron deficiency anemia",
        confidence: 0.87,
        recommendations: ["Start iron supplement", "Iron-rich diet", "Recheck in 8 weeks"],
        source: "diagnostic",
      },
    ],
  },
  {
    _id: P.marcusRx,
    patientId: U.marcus,
    doctorId: U.drAli,
    name: "Atorvastatin",
    dosage: "20 mg once daily at bedtime",
    duration: 120,
    startDate: new Date("2026-02-20"),
    status: "Active",
    notes: "Avoid grapefruit juice. Report any muscle pain immediately.",
    location: { type: "Point", coordinates: [-122.2711, 37.8044] },
    currentHealth: { status: "stable", lastChecked: new Date("2026-05-05"), vitals: 80 },
    healthHistory: [
      {
        date: new Date("2026-02-20"),
        vitals: 74,
        healthStatus: "stable",
        symptomAnalysis: "High LDL cholesterol: 180 mg/dL",
        confidence: 0.92,
        recommendations: ["Start Atorvastatin", "Low-fat diet", "Exercise 4x/week"],
        source: "diagnostic",
      },
    ],
  },
  {
    _id: P.lisaRx,
    patientId: U.lisa,
    doctorId: U.drKhan,
    name: "Cyanocobalamin (Vitamin B12)",
    dosage: "1000 mcg once weekly (injection)",
    duration: 90,
    startDate: new Date("2026-03-10"),
    status: "Active",
    notes: "Monthly lab recheck to monitor B12 levels.",
    location: { type: "Point", coordinates: [-87.6876, 42.0451] },
    currentHealth: { status: "stable", lastChecked: new Date("2026-05-01"), vitals: 82 },
    healthHistory: [
      {
        date: new Date("2026-03-10"),
        vitals: 68,
        healthStatus: "worsening",
        symptomAnalysis: "Severe B12 deficiency: 150 pg/mL",
        confidence: 0.94,
        recommendations: ["Weekly B12 injections", "Dietary changes", "Fatigue monitoring"],
        source: "diagnostic",
      },
      {
        date: new Date("2026-04-10"),
        vitals: 76,
        healthStatus: "stable",
        symptomAnalysis: "B12 rising to 280 pg/mL",
        confidence: 0.92,
        recommendations: ["Continue injections", "Add B12-rich foods"],
        source: "manual",
      },
    ],
  },
];

// ── Appointments ──────────────────────────────────────────────────────────────
const appointments = [
  // John ↔ Dr. Carter (confirmed, upcoming)
  {
    patientId: U.john,
    doctorId: U.drCarter,
    date: new Date("2026-06-05T10:00:00Z"),
    durationMinutes: 30,
    reason: "Monthly cardiology follow-up and blood sugar review.",
    notes: "Patient requests EKG this visit.",
    status: "confirmed",
  },
  // Anna ↔ Dr. Ali (pending, upcoming)
  {
    patientId: U.anna,
    doctorId: U.drAli,
    date: new Date("2026-06-10T09:00:00Z"),
    durationMinutes: 30,
    reason: "Post-antibiotic follow-up to confirm full recovery.",
    notes: "",
    status: "pending",
  },
  // Kevin ↔ Dr. Khan (completed, past)
  {
    patientId: U.kevin,
    doctorId: U.drKhan,
    date: new Date("2026-04-20T11:00:00Z"),
    durationMinutes: 45,
    reason: "Blood pressure check and medication review.",
    notes: "BP reading: 128/82. Medication is working. Continue current dose.",
    status: "completed",
  },
  // Priya ↔ Dr. Carter (cancelled by patient)
  {
    patientId: U.priya,
    doctorId: U.drCarter,
    date: new Date("2026-05-18T14:00:00Z"),
    durationMinutes: 30,
    reason: "Follow-up on iron deficiency treatment.",
    notes: "",
    status: "cancelled",
    cancelledBy: "patient",
    cancelReason: "Family emergency — will reschedule.",
  },
  // Marcus ↔ Dr. Ali (confirmed, upcoming)
  {
    patientId: U.marcus,
    doctorId: U.drAli,
    date: new Date("2026-06-12T15:00:00Z"),
    durationMinutes: 30,
    reason: "Cholesterol level recheck after 3 months on Atorvastatin.",
    notes: "",
    status: "confirmed",
  },
  // Lisa ↔ Dr. Khan (pending, upcoming)
  {
    patientId: U.lisa,
    doctorId: U.drKhan,
    date: new Date("2026-06-08T10:30:00Z"),
    durationMinutes: 30,
    reason: "B12 level check and discuss reducing injection frequency.",
    notes: "",
    status: "pending",
  },
  // John ↔ Dr. Ali (completed, past)
  {
    patientId: U.john,
    doctorId: U.drAli,
    date: new Date("2026-03-15T09:30:00Z"),
    durationMinutes: 30,
    reason: "Seasonal respiratory infection consultation.",
    notes: "Mild upper respiratory infection. Prescribed rest and hydration.",
    status: "completed",
  },
  // Anna ↔ Dr. Khan (no-show, past)
  {
    patientId: U.anna,
    doctorId: U.drKhan,
    date: new Date("2026-04-01T11:00:00Z"),
    durationMinutes: 30,
    reason: "General health checkup.",
    notes: "Patient did not attend.",
    status: "no-show",
  },
];

// ── Ratings ───────────────────────────────────────────────────────────────────
const ratingsData = [
  // Patients rating doctors
  { ratedUserId: U.drCarter, raterUserId: U.john,   score: 5, comment: "Dr. Carter is thorough and always takes time to explain my treatment plan.", ratedUserRole: "doctor" },
  { ratedUserId: U.drCarter, raterUserId: U.priya,  score: 4, comment: "Very professional and knowledgeable. Appointment was slightly delayed.", ratedUserRole: "doctor" },
  { ratedUserId: U.drAli,    raterUserId: U.anna,   score: 5, comment: "Excellent bedside manner. My child loves Dr. Ali!", ratedUserRole: "doctor" },
  { ratedUserId: U.drAli,    raterUserId: U.marcus, score: 5, comment: "Clear communication and great follow-up care.", ratedUserRole: "doctor" },
  { ratedUserId: U.drAli,    raterUserId: U.john,   score: 4, comment: "Good consultation. Wait time was a bit long.", ratedUserRole: "doctor" },
  { ratedUserId: U.drKhan,   raterUserId: U.kevin,  score: 5, comment: "Dr. Khan's guidance helped me control my BP effectively. Highly recommended.", ratedUserRole: "doctor" },
  { ratedUserId: U.drKhan,   raterUserId: U.lisa,   score: 4, comment: "Very helpful. Scheduling was slightly inconvenient.", ratedUserRole: "doctor" },
  // Patients rating pharmacies
  { ratedUserId: U.cityMed,    raterUserId: U.john,   score: 5, comment: "Fast prescription filling and friendly staff.", ratedUserRole: "pharmacy" },
  { ratedUserId: U.healthPlus, raterUserId: U.anna,   score: 4, comment: "24-hour access is a lifesaver. Could improve wait times.", ratedUserRole: "pharmacy" },
  { ratedUserId: U.careZone,   raterUserId: U.kevin,  score: 4, comment: "Great senior discounts and helpful pharmacist on staff.", ratedUserRole: "pharmacy" },
  { ratedUserId: U.cityMed,    raterUserId: U.priya,  score: 5, comment: "Delivery service is excellent. Will keep using!", ratedUserRole: "pharmacy" },
  { ratedUserId: U.careZone,   raterUserId: U.lisa,   score: 5, comment: "Very knowledgeable team and great chronic care support.", ratedUserRole: "pharmacy" },
];

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("ERROR: MONGODB_URI is not set in server/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.\n");

  // Clear collections
  await Promise.all([
    User.deleteMany({}),
    Prescription.deleteMany({}),
    Appointment.deleteMany({}),
    Rating.deleteMany({}),
  ]);
  console.log("Cleared: users, prescriptions, appointments, ratings");

  // Insert users
  await User.insertMany(users);
  console.log(`Inserted users: ${users.length}`);

  // Insert prescriptions and link to patients
  await Prescription.insertMany(prescriptions);
  console.log(`Inserted prescriptions: ${prescriptions.length}`);
  await Promise.all([
    User.updateOne({ _id: U.john },   { $set: { prescriptions: [P.johnRx] } }),
    User.updateOne({ _id: U.anna },   { $set: { prescriptions: [P.annaRx] } }),
    User.updateOne({ _id: U.kevin },  { $set: { prescriptions: [P.kevinRx] } }),
    User.updateOne({ _id: U.priya },  { $set: { prescriptions: [P.priyaRx] } }),
    User.updateOne({ _id: U.marcus }, { $set: { prescriptions: [P.marcusRx] } }),
    User.updateOne({ _id: U.lisa },   { $set: { prescriptions: [P.lisaRx] } }),
  ]);

  // Insert appointments
  await Appointment.insertMany(appointments);
  console.log(`Inserted appointments: ${appointments.length}`);

  // Insert ratings and compute ratingSummary for each doctor/pharmacy
  await Rating.insertMany(ratingsData);
  console.log(`Inserted ratings: ${ratingsData.length}`);

  const ratedIds = [...new Set(ratingsData.map((r) => r.ratedUserId.toString()))];
  await Promise.all(
    ratedIds.map(async (id) => {
      const [agg] = await Rating.aggregate([
        { $match: { ratedUserId: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: null, avg: { $avg: "$score" }, count: { $sum: 1 } } },
      ]);
      if (agg) {
        await User.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { $set: { "ratingSummary.averageRating": Math.round(agg.avg * 10) / 10, "ratingSummary.totalRatings": agg.count } }
        );
      }
    })
  );
  console.log("Updated ratingSummary for doctors and pharmacies.");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
============================================================
  CareConnect – Seeding Complete
============================================================

Demo Password (all accounts): ${DEMO_PASSWORD}

ADMINS
  superadmin@careconnect.io   (superadmin)
  admin@careconnect.io        (admin)

DOCTORS
  dr.carter@careconnect.io    (doctor)  — Cardiology
  dr.ali@careconnect.io       (doctor)  — Pediatrics
  dr.khan@careconnect.io      (doctor)  — Internal Medicine

PHARMACIES
  citymed@careconnect.io      (pharmacy)
  healthplus@careconnect.io   (pharmacy)
  carezone@careconnect.io     (pharmacy)

PATIENTS
  john.miller@example.com     (patient)
  anna.rodriguez@example.com  (patient)
  kevin.chen@example.com      (patient)
  priya.patel@example.com     (patient)
  marcus.johnson@example.com  (patient)
  lisa.wong@example.com       (patient)

============================================================`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
