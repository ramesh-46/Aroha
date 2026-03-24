const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountValue: { type: Number, required: true },
  isPercentage: { type: Boolean, default: false },
  category: { type: String, default: "" }, // targeted category
  minOrderValue: { type: Number, default: 0 }, // minimum amount to redeem it
  minMembers: { type: Number, default: 1 }, // min members to redeem it
  usageLimit: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Coupon", couponSchema);
