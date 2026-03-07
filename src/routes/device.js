import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

/* ACTIVE DEVICES */

router.get("/",protect,async(req,res)=>{

const sessions=await ActivityLog
.find({user:req.user.id})
.sort({createdAt:-1})
.limit(5);

res.json(sessions);

});


/* LOGOUT OTHER DEVICES */

router.delete("/logout-others",protect,async(req,res)=>{

await ActivityLog.deleteMany({
user:req.user.id
});

res.json({
message:"Other devices logged out"
});

});

export default router;