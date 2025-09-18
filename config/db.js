import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/civicconnect";

    await mongoose.connect(mongoURI); // ✅ no extra options needed in Mongoose v6+

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
