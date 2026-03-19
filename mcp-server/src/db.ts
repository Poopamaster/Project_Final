import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return console.log("Database already connected");
  }

  if (!process.env.MONGO_URI) {
    console.error("❌ หา MONGO_URI ไม่เจอ! เช็ค Environment Variables ด่วน!");
    throw new Error("MONGO_URI is missing"); // โยน Error กลับไปหา MCP แทนการดับโปรแกรม
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected in MCP Server!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
};