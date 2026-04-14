const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SupportQuery = require("../models/SupportQuery");

router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
      query.userId = req.query.userId;
    }
    if (req.query.orderId && mongoose.Types.ObjectId.isValid(req.query.orderId)) {
      query.orderId = req.query.orderId;
    }

    const items = await SupportQuery.find(query)
      .populate("userId", "name mobile email")
      .populate("orderId")
      .sort({ updatedAt: -1 });

    res.json({ success: true, queries: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, orderId, productId, productName, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: "userId and message are required" });
    }

    const doc = await SupportQuery.create({
      userId,
      orderId: orderId || null,
      productId: productId || null,
      productName: productName || "",
      messages: [{ senderType: "user", senderId: userId, message }]
    });

    const populated = await SupportQuery.findById(doc._id)
      .populate("userId", "name mobile email")
      .populate("orderId");

    res.json({ success: true, query: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/:id/reply", async (req, res) => {
  try {
    const { senderType, senderId, message } = req.body;
    if (!message || !["user", "admin"].includes(senderType)) {
      return res.status(400).json({ success: false, message: "Valid senderType and message are required" });
    }

    const query = await SupportQuery.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ success: false, message: "Support query not found" });
    }

    query.messages.push({
      senderType,
      senderId: senderId || null,
      message
    });
    query.status = senderType === "admin" ? "Replied" : "Open";
    await query.save();

    const populated = await SupportQuery.findById(query._id)
      .populate("userId", "name mobile email")
      .populate("orderId");

    res.json({ success: true, query: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
