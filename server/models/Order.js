// server/models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true }
    }
  ],
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  status: { type: String, default: "Pending" },
  statusHistory: [{ status: String, updatedAt: Date }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
