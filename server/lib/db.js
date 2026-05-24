import mongoose from "mongoose";

/**
 * Connect to MongoDB using the provided URI.
 * The primary connection is managed in server/index.js.
 * This helper is kept for optional standalone use.
 */
export const connectToDB = async (MONGO_URL) => {
  try {
    const connection = await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB:", connection.connection.host);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};
