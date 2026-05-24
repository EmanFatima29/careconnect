import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Define User Schema directly here since we need it for seeding
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: String, enum: ["patient", "pharmacist", "admin"], default: "patient" },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  createdAt: { type: Date, default: Date.now }
});

// IMPORTANT: This collection name "care" matches your Compass screenshot
const User = mongoose.model("User", userSchema, "care");

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (const a of args) {
    if (!a.startsWith("--")) continue;
    const kv = a.slice(2).split("=");
    const k = kv[0];
    const v = kv.slice(1).join("=") || "true";
    out[k] = v;
  }
  return out;
};

// Batch users data for seeding multiple users at once
const batchUsers = [
  // Patients
  { name: "John Doe", email: "john@example.com", password: "test123", role: "patient", coords: "-74.0060,40.7128" },
  { name: "Sarah Smith", email: "sarah@example.com", password: "test123", role: "patient", coords: "-118.2437,34.0522" },
  { name: "Michael Brown", email: "michael@example.com", password: "test123", role: "patient", coords: "-87.6298,41.8781" },
  { name: "Emily Johnson", email: "emily@example.com", password: "test123", role: "patient", coords: "-95.3698,29.7604" },
  { name: "David Wilson", email: "david@example.com", password: "test123", role: "patient", coords: "-112.0740,33.4484" },
  { name: "Lisa Anderson", email: "lisa@example.com", password: "test123", role: "patient", coords: "-122.4194,37.7749" },
  // new user
   { name: "Eman Fatima", email: "emanwork1952@gmail.com", password: "2022-ag-9000", role: "patient", coords: "-95.3698,29.7204" },
  
  // Pharmacists
  { name: "Dr. Michael Brown", email: "drbrown@careconnect.com", password: "test123", role: "pharmacist", coords: "-74.0060,40.7128" },
  { name: "Dr. Emily Wilson", email: "dremily@careconnect.com", password: "test123", role: "pharmacist", coords: "-118.2437,34.0522" },
  { name: "Dr. James Martinez", email: "drjames@careconnect.com", password: "test123", role: "pharmacist", coords: "-87.6298,41.8781" },
  { name: "Dr. Sarah Johnson", email: "drsarah@careconnect.com", password: "test123", role: "pharmacist", coords: "-95.3698,29.7604" },
  
  // Admins
  { name: "Admin User", email: "admin@careconnect.com", password: "admin123", role: "admin" },
  { name: "Super Admin", email: "superadmin@careconnect.com", password: "super123", role: "admin" }
];

const main = async () => {
  const argv = parseArgs();
  const name = argv.name || argv.n;
  const email = argv.email || argv.e;
  const password = argv.password || argv.p;
  const role = argv.role || "patient";
  const force = argv.force === "true" || argv.force === "1";
  const batch = argv.batch === "true" || argv.batch === "1";
  const coords = argv.coords ? argv.coords.split(",").map(Number) : null;

  // Update this connection string to match your cluster
  // For MongoDB Atlas cluster0, use your connection string
  const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/careconnect";

  try {
    console.log(`[DB] Connecting to: ${MONGO.replace(/:[^:@]*@/, ':****@')}`); // Hide password in logs
    await mongoose.connect(MONGO);
    console.log("[DB] Connected to MongoDB");

    // BATCH MODE: Create multiple users at once
    if (batch) {
      console.log("\n📦 BATCH SEEDING MODE");
      console.log("=".repeat(50));
      
      let created = 0;
      let updated = 0;
      let skipped = 0;
      
      for (const userData of batchUsers) {
        const existing = await User.findOne({ email: userData.email.toLowerCase() });
        
        if (existing && !force) {
          console.log(`⚠️  Skipped: ${userData.email} (already exists, use --force=true to overwrite)`);
          skipped++;
          continue;
        }
        
        const hash = bcrypt.hashSync(userData.password, 10);
        
        const newUserData = {
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: hash,
          roles: userData.role,
        };
        
        // Add coordinates if provided
        if (userData.coords) {
          const [lng, lat] = userData.coords.split(",").map(Number);
          if (lng && lat && Number.isFinite(lng) && Number.isFinite(lat)) {
            newUserData.location = { type: "Point", coordinates: [lng, lat] };
          }
        }
        
        let user;
        if (existing && force) {
          existing.name = newUserData.name;
          existing.password = newUserData.password;
          existing.roles = newUserData.roles;
          if (newUserData.location) existing.location = newUserData.location;
          user = await existing.save();
          console.log(`🔄 Updated: ${user.email} (${user.roles})`);
          updated++;
        } else if (!existing) {
          user = new User(newUserData);
          await user.save();
          console.log(`✨ Created: ${user.email} (${user.roles})`);
          created++;
        }
      }
      
      console.log("\n" + "=".repeat(50));
      console.log("📊 BATCH SEEDING COMPLETE!");
      console.log(`✅ Created: ${created} users`);
      console.log(`🔄 Updated: ${updated} users`);
      console.log(`⚠️  Skipped: ${skipped} users`);
      console.log(`📈 Total users in DB: ${await User.countDocuments()}`);
      
      console.log("\n🔑 TEST LOGIN CREDENTIALS:");
      console.log("-".repeat(40));
      console.log("\n📋 PATIENTS (password: test123):");
      batchUsers.filter(u => u.role === "patient").forEach(u => console.log(`   • ${u.email}`));
      console.log("\n💊 PHARMACISTS (password: test123):");
      batchUsers.filter(u => u.role === "pharmacist").forEach(u => console.log(`   • ${u.email}`));
      console.log("\n👑 ADMINS:");
      batchUsers.filter(u => u.role === "admin").forEach(u => console.log(`   • ${u.email} (password: ${u.password})`));
      
      // Verify data was inserted
      const allUsers = await User.find({});
      console.log("\n📊 VERIFICATION:");
      console.log(`Total documents in 'care' collection: ${allUsers.length}`);
      if (allUsers.length > 0) {
        console.log("Sample document:", JSON.stringify(allUsers[0], null, 2));
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // SINGLE USER MODE (original functionality)
    if (!name || !email || !password) {
      console.error(
        "Usage: node sample-data/seed-create-user.js --name=NAME --email=EMAIL --password=PASS [--role=patient|pharmacist|admin] [--coords=lng,lat] [--force=true]\n" +
        "Or for batch mode: node sample-data/seed-create-user.js --batch=true [--force=true]"
      );
      process.exit(1);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && !force) {
      console.log(`[Seed] User with email ${email} already exists. Use --force=true to overwrite.`);
      await mongoose.connection.close();
      process.exit(0);
    }

    const hash = bcrypt.hashSync(password, 10);

    const userData = {
      name,
      email: email.toLowerCase(),
      password: hash,
      roles: role,
    };

    if (coords && coords.length === 2 && coords.every(Number.isFinite)) {
      userData.location = { type: "Point", coordinates: coords };
    }

    let user;
    if (existing) {
      existing.name = userData.name;
      existing.password = userData.password;
      existing.roles = userData.roles;
      if (userData.location) existing.location = userData.location;
      user = await existing.save();
      console.log(`[Seed] Updated user: ${user.email} (${user._id})`);
    } else {
      user = new User(userData);
      await user.save();
      console.log(`[Seed] Created user: ${user.email} (${user._id})`);
    }

    console.log("[Seed] Done. You can now start the server and log in with the seeded credentials.");
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (err) {
    console.error("[Seed] Error:", err);
    process.exit(1);
  }
};

main();