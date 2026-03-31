import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

import {
  sendVerificationEmail,
  sendResetEmail
} from "../services/emailService.js";

const router = express.Router();

/* ======================================
   SIGNUP
====================================== */

router.post("/signup", async (req, res) => {

  try {

    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required"
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({
        error: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    /* CREATE VERIFICATION TOKEN */

    const token = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    user.verificationToken = hashedToken;
    user.verificationExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const mailRes = await sendVerificationEmail(
      user.email,
      token,
      user.name || "User"
    );

    if (mailRes.demo) {
      return res.json({
        message: "User created (demo mode). Verification token generated."
      });
    }

    res.json({
      message: "Signup successful — verification email sent"
    });

  } catch (err) {

    console.error("Signup Error:", err.message);

    res.status(500).json({
      error: "Server error"
    });

  }

});


/* ======================================
   VERIFY EMAIL
====================================== */

router.get("/verify/:token", async (req, res) => {

  try {

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired verification token"
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;

    await user.save();

    res.json({
      message: "Email verified successfully"
    });

  } catch (err) {

    console.error("Verify Error:", err.message);

    res.status(500).json({
      error: "Server error"
    });

  }

});


/* ======================================
   LOGIN (🔥 FIXED)
====================================== */

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    const genericErr = {
      status: 401,
      body: { error: "Invalid email or password" }
    };

    if (!user)
      return res.status(genericErr.status).json(genericErr.body);


    /* ACCOUNT LOCK */

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        error: "Account locked. Try later"
      });
    }


    const match = await bcrypt.compare(password, user.password);

    if (!match) {

      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      }

      await user.save();

      return res.status(genericErr.status).json(genericErr.body);
    }


    if (!user.isVerified) {
      return res.status(401).json({
        error: "Please verify your email first"
      });
    }


    /* RESET FAILED ATTEMPTS */

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();


    /* 🔐 JWT TOKEN */

    const token = jwt.sign(
      { id: user._id, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );


    /* 📊 LOG ACTIVITY */

    await ActivityLog.create({
      user: user._id,
      action: "login",
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    });


    /* ✅ FINAL RESPONSE (IMPORTANT) */

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        isVerified: user.isVerified
      }
    });

  } catch (err) {

    console.error("Login Error:", err.message);

    res.status(500).json({
      error: "Server error"
    });

  }

});


/* ======================================
   FORGOT PASSWORD
====================================== */

router.post("/forgot-password", async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If the email exists, a reset link has been sent"
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendResetEmail(
      user.email,
      token,
      user.name || "User"
    );

    res.json({
      message: "If the email exists, a reset link has been sent"
    });

  } catch (err) {

    console.error("Forgot Password Error:", err.message);

    res.status(500).json({
      error: "Server error"
    });

  }

});


/* ======================================
   RESET PASSWORD
====================================== */

router.post("/reset-password/:token", async (req, res) => {

  try {

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired token"
      });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Password required"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      message: "Password reset successful"
    });

  } catch (err) {

    console.error("Reset Password Error:", err.message);

    res.status(500).json({
      error: "Server error"
    });

  }

});

export default router;