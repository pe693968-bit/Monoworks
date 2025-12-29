import mongoose from "mongoose";

export const connectDb = async () => {
  if (mongoose.connection.readyState >= 1) return;

  if (!process.env.MONGO_URL) {
    throw new Error("❌ MONGO_URL not found in .env.local");
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
};
