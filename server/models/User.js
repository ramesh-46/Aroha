const mongoose = require("mongoose");
const rewardEntrySchema = new mongoose.Schema({ type: String, coins: Number, orderId: String, note: String, createdAt: { type: Date, default: Date.now } }, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },  // plain text as per your requirement
  recoveryCode: { type: String },
  gender: { type: String },
  address: { type: String },
  addresses: { type: [{ label: { type: String, default: "Home", trim: true, maxlength: 30 }, name: { type: String, required: true, trim: true, maxlength: 80 }, mobile: { type: String, required: true, trim: true, maxlength: 20 }, line1: { type: String, required: true, trim: true, maxlength: 160 }, line2: { type: String, trim: true, maxlength: 160 }, landmark: { type: String, trim: true, maxlength: 100 }, city: { type: String, required: true, trim: true, maxlength: 80 }, state: { type: String, required: true, trim: true, maxlength: 80 }, pincode: { type: String, required: true, trim: true, maxlength: 12 }, isDefault: { type: Boolean, default: false } }], default: [] },
  details: { type: String },
  referralCode: { type: String, unique: true, sparse: true, index: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  referralRewardCreditedAt: { type: Date, default: null },
  rewardCoins: { type: Number, default: 0, min: 0 },
  rewardHistory: { type: [rewardEntrySchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

userSchema.set("toJSON", { transform: (_doc, ret) => { delete ret.password; delete ret.recoveryCode; delete ret.__v; return ret; } });
userSchema.set("toObject", { transform: (_doc, ret) => { delete ret.password; delete ret.recoveryCode; delete ret.__v; return ret; } });
module.exports = mongoose.model("User", userSchema);
