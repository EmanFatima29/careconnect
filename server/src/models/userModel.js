import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    phone: { type: String, default: null },
    status: { type: String, enum: ["online", "offline"], default: "offline" },

    //ADDRESS FIELDS
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String },
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    age: { type: Number },
    dob: { type: Date },
    relationship: {
      type: String,
      enum: ["single", "relationship", "complicated"],
      default: "single",
    },
    workStatus: {
      type: String,
      enum: ["employed", "unemployed", "freelance"],
      default: "employed",
    },
    bio: { type: String },
    story: { type: Array, required: false, default: [] },
    interests: { type: String },
    education: { type: String },

    // MAP FEATURE
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        default: [0, 0], // Longitude, Latitude
      },
      lastSeen: {
        type: Date,
        default: null,
      },
    },

    // CHAT & GROUP FEATURE
    chatHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Chat history
    chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    prescriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Prescription" }],
    userType: {
      type: String,
      enum: ["friend", "admin", "groupMember", "unknown"],
      default: "friend",
    },
    roles: {
      type: String,
      enum: ["patient", "doctor", "admin", "superadmin"],
      default: "patient",
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        enum: ["friends", "blocked"],
        default: "friends",
        ref: "User",
      },
    ], // Friend list
    friendRequests: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who sent the request
        status: {
          type: String,
          enum: ["pending", "accepted", "declined"],
          default: "pending",
        }, // Request status
      },
    ],
    lastSeen: { type: Date, default: Date.now },

    // OTHER FIELDS
    accountType: {
      type: String,
      enum: ["private", "limited", "public"],
      default: "public",
    },
    joined: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    // SOCIAL ACCOUNTS BY WHICH USER LOGS IN OR ADDED MANUALLY
    socialAccounts: { type: Array, required: false, default: [] },
    password: {
      type: String,
      required: function () {
        return !this.socialAccounts.length;
      },
    }, // Required only if no social login

    // Profile picture with responsive variants
    profilePic: {
      original: { type: String, default: null },
      thumbnail: { type: String, default: null }, // 50x50
      small: { type: String, default: null }, // 100x100
      medium: { type: String, default: null }, // 200x200
      large: { type: String, default: null }, // 400x400
      cloudinaryId: { type: String, default: null },
      mediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },

    // EMAIL VERIFICATION
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },

    // ACCOUNT LOCKOUT
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },

    // PASSWORD RESET
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    account: {
      type: String,
      enum: ["active", "locked", "blocked"],
      default: "active",
    },

    // SETTINGS
    settings: {
      chatNotifications: { type: Boolean, default: true },
      showReadReceipts: { type: Boolean, default: true },
      allowMessagesFrom: {
        type: String,
        enum: ["everyone", "friends", "selected", "no one"],
        default: "everyone",
      },

      locationSharing: { type: Boolean, default: false },
      visibleRange: { type: Number, default: 1000 }, // Range in meters

      // Notification preferences
      pushNotifications: { type: Boolean, default: true },
      groupNotifications: { type: Boolean, default: true },
      prescriptionNotifications: { type: Boolean, default: true },

      theme: { type: String, enum: ["light", "dark"], default: "light" },
    },
  },
  { timestamps: true }, // Adds createdAt and updatedAt automatically
);

// Medical index for nearby user queries
userSchema.index({ "location.coordinates": "2dsphere" });
// Performance indexes (email already indexed via unique:true on the ward)
userSchema.index({ status: 1 }); // Online/offline queries
userSchema.index({ roles: 1 }); // Admin lookups
userSchema.index({ "settings.locationSharing": 1 }); // Nearby user queries filter on this

export default mongoose.model("User", userSchema);
