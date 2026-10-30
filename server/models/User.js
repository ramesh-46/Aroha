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
  details: { type: String },
  referralCode: { type: String, unique: true, sparse: true, index: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  rewardCoins: { type: Number, default: 0, min: 0 },
  rewardHistory: { type: [rewardEntrySchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
