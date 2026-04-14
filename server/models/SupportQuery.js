const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema({
  senderType: {
    type: String,
    enum: ["user", "admin"],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const supportQuerySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  productName: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Open", "Replied", "Closed"],
    default: "Open"
  },
  messages: {
    type: [supportMessageSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("SupportQuery", supportQuerySchema);
