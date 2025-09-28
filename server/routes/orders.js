// server/routes/orders.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// ---------------------------
// 1. Create new order
// ---------------------------
router.post("/", async (req, res) => {
  const { userId, items, customerName, customerMobile, deliveryAddress } = req.body;
  if (!userId || !items || !items.length)
    return res.status(400).json({ message: "Missing userId or items" });

  try {
    const orderItems = items.map(i => ({
      productId: i.productId,
      quantity: i.quantity || 1
    }));

    const newOrder = new Order({
      userId,
      items: orderItems,
      customerName,
      customerMobile,
      deliveryAddress,
      status: "Pending",
      statusHistory: [{ status: "Pending", updatedAt: new Date() }]
    });

    const savedOrder = await newOrder.save();
    const populatedOrder = await Order.findById(savedOrder._id).populate("items.productId");
    res.json(populatedOrder);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Order creation failed", error: err });
  }
});

// ---------------------------
// 2. Get orders for a customer
// ---------------------------
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const orders = await Order.find({ userId })
      .populate("items.productId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch orders", error: err });
  }
});

// ---------------------------
// 3. Get all orders (seller view)
// ---------------------------
router.get("/all", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.productId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// ---------------------------
// 4. Update order status (seller)
// ---------------------------
router.put("/status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "Status required" });

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    order.statusHistory.push({ status, updatedAt: new Date() });
    const updatedOrder = await order.save();

    const populatedOrder = await Order.findById(updatedOrder._id).populate("items.productId");
    res.json(populatedOrder);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

module.exports = router;
