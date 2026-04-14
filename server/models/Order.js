// server/models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  sku: { type: String },
  quantity: { type: Number, required: true },
  productSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  originalPrice: { type: Number, default: 0 },
  discountedPrice: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  deliveryAddress: { type: String, required: true },
  customerLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    label: { type: String, default: "" }
  },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: "" },
  couponDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  subtotalAmount: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  isFreeDeliveryApplied: { type: Boolean, default: false },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, default: "Pending" },
  statusHistory: [{ status: String, updatedAt: Date }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
