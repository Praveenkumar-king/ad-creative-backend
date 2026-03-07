import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

const storage = multer.diskStorage({

destination:"uploads/avatars",

filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname);
}

});

const upload = multer({storage});

router.post("/upload",protect,upload.single("avatar"),async(req,res)=>{

const user = await User.findById(req.user.id);

user.avatar="/uploads/avatars/"+req.file.filename;

await user.save();

res.json({avatar:user.avatar});

});

export default router;