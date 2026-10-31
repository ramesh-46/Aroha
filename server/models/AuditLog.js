const mongoose = require("mongoose");
const auditLogSchema = new mongoose.Schema({
 userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null,index:true},
 username:{type:String,default:"Unknown",trim:true,maxlength:80,index:true},
 role:{type:String,enum:["user","admin","system"],default:"system",index:true},
 event:{type:String,required:true,trim:true,maxlength:100,index:true},
 level:{type:String,enum:["info","warning","error","security"],default:"info",index:true},
 message:{type:String,default:"",maxlength:1000},
 requestId:{type:String,default:"",maxlength:80}, path:{type:String,default:"",maxlength:200},
 method:{type:String,default:"",maxlength:10}, statusCode:{type:Number,default:null},
 metadata:{type:mongoose.Schema.Types.Mixed,default:{}}, createdAt:{type:Date,default:Date.now,index:true}
},{versionKey:false});
auditLogSchema.index({createdAt:-1,level:1});
auditLogSchema.index({userId:1,createdAt:-1});
module.exports=mongoose.model("AuditLog",auditLogSchema);
