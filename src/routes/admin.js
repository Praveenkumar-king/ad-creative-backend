import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";

const router = express.Router();

/* ADMIN CHECK */

const adminOnly = (req,res,next)=>{

if(req.user.role !== "admin"){
 return res.status(403).json({error:"Admin only"});
}

next();

};

/* GET ALL USERS */

router.get("/users",protect,adminOnly,async(req,res)=>{

const users = await User.find().select("-password");

res.json(users);

});

/* GET ALL CAMPAIGNS */

router.get("/campaigns",protect,adminOnly,async(req,res)=>{

const campaigns = await Campaign.find()
.populate("user","name email");

res.json(campaigns);

});

export default router;