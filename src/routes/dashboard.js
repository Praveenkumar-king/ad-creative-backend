import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Campaign from "../models/Campaign.js";
import User from "../models/User.js";

const router = express.Router();

/* ===============================
   DASHBOARD STATS
=================================*/

router.get("/stats", protect, async (req,res)=>{

  try{

    const user = await User.findById(req.user.id);

    const campaigns = await Campaign.find({
      user:req.user.id
    });

    const adsGenerated = campaigns.length;

    const today = new Date();
    today.setHours(0,0,0,0);

    const adsToday = campaigns.filter(
      c => new Date(c.createdAt) >= today
    ).length;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0,0,0,0);

    const adsMonth = campaigns.filter(
      c => new Date(c.createdAt) >= monthStart
    ).length;

    let toneCount = {};
    let sizeCount = {};

    campaigns.forEach(c=>{
      toneCount[c.tone] = (toneCount[c.tone] || 0) + 1;
      sizeCount[c.size] = (sizeCount[c.size] || 0) + 1;
    });

    const mostUsedTone =
      Object.keys(toneCount).sort((a,b)=>toneCount[b]-toneCount[a])[0] || "-";

    const mostUsedSize =
      Object.keys(sizeCount).sort((a,b)=>sizeCount[b]-sizeCount[a])[0] || "-";

    res.json({
      adsGenerated,
      adsToday,
      adsMonth,
      mostUsedTone,
      mostUsedSize,
      creditsLeft:user.credits
    });

  }catch(err){

    res.status(500).json({
      error:"Failed to load stats"
    });

  }

});

export default router;