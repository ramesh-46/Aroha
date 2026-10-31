const AuditLog=require("../models/AuditLog");
function writeAudit({userId=null,username="Unknown",role="system",event,level="info",message="",requestId="",path="",method="",statusCode=null,metadata={}}){
 const safe={};
 for(const [k,v] of Object.entries(metadata||{})){
  if(/password|token|secret|recovery|authorization|cookie|email|mobile|address|message/i.test(k)) continue;
  if(["string","number","boolean"].includes(typeof v)) safe[k]=typeof v==="string"?v.slice(0,160):v;
 }
 return AuditLog.create({userId,username:String(username||"Unknown").slice(0,80),role,event,message:String(message||"").slice(0,1000),requestId,path,method,statusCode,metadata:safe,level})
  .catch(e=>console.error("[AUDIT_WRITE_FAILED]",{event,message:e.message}));
}
module.exports={writeAudit};
