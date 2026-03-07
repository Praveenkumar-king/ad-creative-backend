import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";

const router = express.Router();

/* =========================
   ADMIN CHECK
========================= */

const adminOnly = (req,res,next)=>{

  if(req.user.role !== "admin"){
    return res.status(403).json({
      error:"Admin access only"
    });
  }

  next();

};

/* =========================
   ADMIN DASHBOARD STATS
========================= */

router.get("/stats",protect,adminOnly,async(req,res)=>{

  try{

    const totalUsers = await User.countDocuments();

    const totalCampaigns = await Campaign.countDocuments();

    const activeSubscriptions = await User.countDocuments({
      plan:{ $ne:"Free" },
      planExpire:{ $gt:new Date() }
    });

    const revenue = await User.aggregate([
      {
        $match:{
          plan:{ $ne:"Free" }
        }
      },
      {
        $group:{
          _id:null,
          totalRevenue:{
            $sum:"$credits"
          }
        }
      }
    ]);

    res.json({

      totalUsers,

      totalCampaigns,

      activeSubscriptions,

      revenue: revenue[0]?.totalRevenue || 0

    });

  }catch(err){

    res.status(500).json({
      error:"Admin stats failed"
    });

  }

});

export default router;