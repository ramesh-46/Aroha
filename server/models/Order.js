
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
  // --- Existing Fields ---
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
  status: {
    type: String,
    default: "Pending",
    enum: [
      "Pending",
      "Payment Verification Pending",
      "Payment Verified",
      "Payment Failed",
      "Shipped",
      "Delivered",
      "Cancelled"
    ]
  },
  statusHistory: [{ status: String, updatedAt: Date }],
  createdAt: { type: Date, default: Date.now },

  // --- New Fields for UPI QR Payment ---
  orderId: { type: String, required: true, unique: true }, // Unique order ID for tracking
  paymentMethod: {
    type: String,
    default: "UPI QR",
    enum: ["UPI QR", "COD", "Online", "Other"]
  },
  upiId: { type: String, default: "" }, // UPI ID used for payment (e.g., 9550354436@superyes)
  upiUrl: { type: String, default: "" }, // UPI QR URL (e.g., upi://pay?pa=9550354436@superyes&am=500&cu=INR)
  transactionId: { type: String, default: "" }, // UPI transaction ID from user
  ocrData: {
    transactionId: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    upiApp: { type: String, default: "" }, // e.g., PhonePe, Google Pay
    date: { type: String, default: "" }, // Date/Time from OCR
    receiverUpi: { type: String, default: "" } // Receiver UPI ID from OCR
  },
  screenshot: { type: String, default: "" }, // URL or path to uploaded payment screenshot
  paymentVerifiedAt: { type: Date, default: null }, // Timestamp when admin verifies payment
  paymentVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null } // Admin who verified
});

module.exports = mongoose.model("Order", orderSchema);











// // server/models/Order.js
// const mongoose = require("mongoose");

// const orderItemSchema = new mongoose.Schema({
//   productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
//   sku: { type: String },
//   quantity: { type: Number, required: true },
//   productSnapshot: {
//     type: mongoose.Schema.Types.Mixed,
//     default: null
//   },
//   originalPrice: { type: Number, default: 0 },
//   discountedPrice: { type: Number, default: 0 },
//   lineTotal: { type: Number, default: 0 }
// }, { _id: true });

// const orderSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   items: [orderItemSchema],
//   customerName: { type: String, required: true },
//   customerMobile: { type: String, required: true },
//   deliveryAddress: { type: String, required: true },
//   customerLocation: {
//     lat: { type: Number, default: null },
//     lng: { type: Number, default: null },
//     label: { type: String, default: "" }
//   },
//   discountAmount: { type: Number, default: 0 },
//   couponCode: { type: String, default: "" },
//   couponDetails: {
//     type: mongoose.Schema.Types.Mixed,
//     default: null
//   },
//   subtotalAmount: { type: Number, default: 0 },
//   deliveryCharge: { type: Number, default: 0 },
//   isFreeDeliveryApplied: { type: Boolean, default: false },
//   totalAmount: { type: Number, default: 0 },
//   status: { type: String, default: "Pending" },
//   statusHistory: [{ status: String, updatedAt: Date }],
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model("Order", orderSchema);
