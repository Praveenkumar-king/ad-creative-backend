import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendResetEmail } from "../services/emailService.js";

const router = express.Router();

/* ===============================
   🔐 SIGNUP
=================================*/
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      name: user.name
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ===============================
   🔐 LOGIN
=================================*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      name: user.name
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ===============================
   🔑 FORGOT PASSWORD (Brevo Email)
=================================*/
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Send email via Brevo
    await sendResetEmail(user.email, resetToken);

    res.json({
      message: "Password reset email sent successfully"
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: error.message });
  }
});


/* ===============================
   🔁 RESET PASSWORD
=================================*/
router.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    user.password = hashedPassword;
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