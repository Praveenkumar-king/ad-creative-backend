import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

/* ==============================
   GET USER AD HISTORY
============================== */

router.get("/", protect, async (req, res) => {

  try {

    const history = await ActivityLog.find({
      user: req.user.id,
      action: "generate_ad"
    })
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(history);

  } catch (err) {

    console.error("History Error:", err.message);

    res.status(500).json({
      error: "Failed to fetch history"
    });

  }

});

export default router;