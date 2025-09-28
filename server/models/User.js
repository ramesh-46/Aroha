const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  mobile: { type: String, required: true, unique: true },
  email: { type: String },
  password: { type: String, required: true },  // plain text as per your requirement
  recoveryCode: { type: String },
  gender: { type: String },
  address: { type: String },
  details: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
