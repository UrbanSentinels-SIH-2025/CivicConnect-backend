import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    picture: { type: String },

    // ✅ Add location as an object with latitude & longitude
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // Optional: mark if first login (can also be handled in JWT)
    firstTime: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
