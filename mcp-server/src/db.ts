import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return console.log("Database already connected");
  }
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};