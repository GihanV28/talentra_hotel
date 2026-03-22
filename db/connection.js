import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection failed:", error.message);
    throw error;
  }
};

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  console.log("MongoDB connection error:", error);
});

export default connectDB;