import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

/* ======================
   GET USER ACTIVITY
====================== */

router.get("/",protect,async(req,res)=>{

try{

const logs = await ActivityLog
.find({user:req.user.id})
.sort({createdAt:-1})
.limit(20);

res.json(logs);

}catch(err){

res.status(500).json({
error:"Failed to fetch activity"
});

}

});

export default router;