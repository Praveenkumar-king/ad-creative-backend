// src/index.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";

import generateRoute from "./routes/generate.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import changePasswordRoutes from "./routes/changePassword.js";
import avatarRoutes from "./routes/avatar.js";
import paymentRoutes from "./routes/payment.js";
import campaignRoutes from "./routes/campaign.js";
import userRoutes from "./routes/user.js";
import deleteAccountRoutes from "./routes/deleteAccount.js";
import activityRoutes from "./routes/activity.js";
import adminRoutes from "./routes/admin.js";
import adminDashboardRoutes from "./routes/adminDashboard.js";

import User from "./models/User.js";

dotenv.config();
connectDB();

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());
app.use(cookieParser());

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-ad-creative.netlify.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

/* =========================
   STATIC FILES (IMAGES)
========================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   ROUTES
========================= */

app.use("/api/generate", generateRoute);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/change-password", changePasswordRoutes);
app.use("/api/avatar", avatarRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/campaign", campaignRoutes);
app.use("/api/user", userRoutes);
app.use("/api/account", deleteAccountRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);

/* =========================
   ROOT
========================= */

app.get("/", (req, res) => {
  res.send("Ad Creative Backend Running 🚀");
});

/* =========================
   CLEANUP JOB (EVERY HOUR)
========================= */

setInterval(async () => {
  try {

    await User.updateMany(
      { resetPasswordExpire: { $lt: Date.now() } },
      { $unset: { resetPasswordToken: "", resetPasswordExpire: "" } }
    );

    await User.updateMany(
      { verificationExpire: { $lt: Date.now() } },
      { $unset: { verificationToken: "", verificationExpire: "" } }
    );

  } catch (err) {

    console.error("Cleanup job error:", err.message);

  }
}, 1000 * 60 * 60);

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});