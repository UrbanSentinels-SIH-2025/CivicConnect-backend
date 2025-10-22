// backend/seed/seedAdmin.js
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js"; // ✅ relative path corrected
import Admin from "../models/admin.js";
// Load .env manually from backend root (important when running from outside)
dotenv.config({ path: path.resolve("backend/.env") });

const addAdmin = async () => {
  try {
    console.log("🚀 Starting admin seeding script...");

    // 1️⃣ Connect to database
    await connectDB();

    // 2️⃣ Admin details
    const name = "Super Admin";
    const email = "admin@example.com";
    const plainPassword = "admin123";

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 4️⃣ Check existing admin
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("⚠️ Admin with this email already exists!");
      process.exit(0);
    }

    // 5️⃣ Create new admin
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();
    console.log("✅ Admin created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

addAdmin();
