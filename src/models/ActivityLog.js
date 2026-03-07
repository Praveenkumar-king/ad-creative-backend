import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({

user:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

action:{
type:String
},

ip:{
type:String
},

userAgent:{
type:String
},

createdAt:{
type:Date,
default:Date.now
}

});

export default mongoose.model("ActivityLog",activitySchema);