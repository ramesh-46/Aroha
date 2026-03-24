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

module.exports = mongoose.model("Seller", SellerSchema);
