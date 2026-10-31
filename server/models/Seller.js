const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  recoveryCode: { type: String, required: true },
  gstNumber: { type: String, required: true },
  address: { type: String, required: true },
  companyName: { type: String, required: true },
  contactNumber: { type: String, required: true },
});

SellerSchema.set("toJSON", { transform: (_doc, ret) => { delete ret.password; delete ret.recoveryCode; delete ret.__v; return ret; } });
SellerSchema.set("toObject", { transform: (_doc, ret) => { delete ret.password; delete ret.recoveryCode; delete ret.__v; return ret; } });
module.exports = mongoose.model("Seller", SellerSchema);
