// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },

  // hashed tokens stored (sha256 hash of token)
  verificationToken: { type: String },
  verificationExpire: { type: Date },

  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },

  // login lock / attempts
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

// virtual: isLocked
userSchema.virtual("isLocked").get(function () {
  if (!this.lockUntil) return false;
  return this.lockUntil > Date.now();
});

export default mongoose.model("User", userSchema);