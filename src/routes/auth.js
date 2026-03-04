// src/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendResetEmail, sendVerificationEmail } from "../services/emailService.js";

const router = express.Router();

// Helper: hash token for storage
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/* ===============================
   SIGNUP (create account + send verification)
=================================*/
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Generate verification token (raw) and store hashed token
    const rawToken = crypto.randomBytes(20).toString("hex");
    user.verificationToken = hashToken(rawToken);
    // expire in 24 hours
    user.verificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // send verification email (or fallback)
    const emailResult = await sendVerificationEmail(user.email, rawToken);

    if (emailResult.sent) {
      res.json({ message: "Signup successful — verification email sent" });
    } else if (emailResult.demo) {
      // demo mode (no API key) -> return raw token so reviewer can click link
      res.json({ message: "Signup (demo): verification token generated", verificationToken: rawToken });
    } else {
      res.json({ message: "Signup created but email sending failed", info: emailResult.error });
    }
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   VERIFY EMAIL (GET)
   Frontend will call /verify/:token (you can also have frontend open it)
=================================*/
router.get("/verify/:token", async (req, res) => {
  try {
    const raw = req.params.token;
    const hashed = hashToken(raw);

    const user = await User.findOne({
      verificationToken: hashed,
      verificationExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired verification token" });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    // Option A: redirect to frontend success page
    const FE = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${FE}/verify-success`);
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   LOGIN (with account lock)
=================================*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    // check lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ error: "Account locked. Try later." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // increment attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 3) {
        // lock for 30 minutes
        user.lockUntil = Date.now() + 30 * 60 * 1000;
        // optionally notify user by email here
      }
      await user.save();
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // success -> reset attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, name: user.name, isVerified: user.isVerified });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   FORGOT PASSWORD
=================================*/
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const rawToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const sendResult = await sendResetEmail(user.email, rawToken);

    if (sendResult.sent) {
      res.json({ message: "Password reset email sent successfully" });
    } else if (sendResult.demo) {
      // demo mode: return token for review/demo
      res.json({ message: "Demo token generated", resetToken: rawToken });
    } else {
      res.status(500).json({ error: "Email sending failed", info: sendResult.error });
    }
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   RESET PASSWORD
=================================*/
router.post("/reset-password/:token", async (req, res) => {
  try {
    const raw = req.params.token;
    const hashed = hashToken(raw);

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    const newPassword = req.body.password;
    if (!newPassword) return res.status(400).json({ error: "Password required" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;