const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const SupportQuery = require("../models/SupportQuery");
const Order = require("../models/Order");
const auth = require("../middleware/authMiddleware");
const sellerAuth = require("../middleware/sellerAuthMiddleware");
const { writeAudit } = require("../middleware/activityLogger");

const validId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));
const cleanMessage = (value) => typeof value === "string" ? value.trim().slice(0, 3000) : "";

router.get("/", async (req, res, next) => {
  if (req.headers.authorization?.startsWith("Bearer ")) return auth(req, res, () => {
    SupportQuery.find({ userId: req.user.id }).sort({ updatedAt: -1 }).limit(50)
      .populate("orderId", "orderId status createdAt")
      .then(queries => res.json({ success: true, queries }))
      .catch(next);
  });
  return sellerAuth(req, res, () => {
    const filter = {};
    if (req.query.status && ["Open", "Replied", "Closed"].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.userId && validId(req.query.userId)) filter.userId = req.query.userId;
    if (req.query.orderId && validId(req.query.orderId)) filter.orderId = req.query.orderId;
    SupportQuery.find(filter).sort({ updatedAt: -1 }).limit(Math.min(100, Math.max(1, Number(req.query.limit) || 50)))
      .populate("userId", "name mobile email")
      .populate("orderId", "orderId status createdAt")
      .then(queries => res.json({ success: true, queries }))
      .catch(next);
  });
});

router.post("/", auth, async (req, res) => {
  const message = cleanMessage(req.body.message);
  const orderId = req.body.orderId;
  if (!message) return res.status(400).json({ success: false, message: "A message is required." });
  if (message.length > 3000) return res.status(413).json({ success: false, message: "Message is too long." });
  if (!validId(orderId)) return res.status(400).json({ success: false, message: "A valid order is required." });
  try {
    const order = await Order.findOne({ _id: orderId, userId: req.user.id }).select("_id orderId");
    if (!order) return res.status(404).json({ success: false, message: "Order not found for this account." });
    const doc = await SupportQuery.create({
      userId: req.user.id, orderId: order._id,
      productId: validId(req.body.productId) ? req.body.productId : null,
      productName: String(req.body.productName || "").trim().slice(0, 120),
      messages: [{ senderType: "user", senderId: req.user.id, message }]
    });
    const user = await require("../models/User").findById(req.user.id).select("name");
    await writeAudit({ userId: req.user.id, username: user?.name || "Customer", role: "user", event: "support.ticket_created", message: "Customer opened order support ticket", metadata: { orderId: order.orderId, ticketId: String(doc._id) } });
    const populated = await SupportQuery.findById(doc._id).populate("orderId", "orderId status createdAt");
    return res.status(201).json({ success: true, query: populated });
  } catch (error) {
    console.error("[SUPPORT] TICKET_CREATE_FAILED", { userId: req.user.id, message: error.message });
    return res.status(500).json({ success: false, message: "Unable to create support ticket." });
  }
});

router.post("/:id/reply", async (req, res, next) => {
  const message = cleanMessage(req.body.message);
  if (!message) return res.status(400).json({ success: false, message: "A message is required." });
  if (message.length > 3000) return res.status(413).json({ success: false, message: "Message is too long." });
  const admin = req.headers.authorization?.startsWith("Bearer ") && !req.body.senderType ? false : false;
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const jwt = require("jsonwebtoken");
  const secret = process.env.JWT_SECRET;
  let decoded = null;
  if (secret && token) { try { decoded = jwt.verify(token, secret); } catch (_) {} }
  if (!decoded?.id) return res.status(401).json({ success: false, message: "Sign in to reply." });
  const isAdmin = req.body.senderType === "admin";
  const execute = async () => {
    try {
      if (!validId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ticket ID." });
      const ticket = await SupportQuery.findById(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
      if (!isAdmin && String(ticket.userId) !== String(decoded.id)) return res.status(403).json({ success: false, message: "You cannot access this ticket." });
      if (isAdmin && !req.seller) return res.status(403).json({ success: false, message: "Admin access required." });
      if (ticket.status === "Closed" && !isAdmin) return res.status(409).json({ success: false, message: "This ticket is closed." });
      ticket.messages.push({ senderType: isAdmin ? "admin" : "user", senderId: decoded.id, message });
      ticket.status = isAdmin ? "Replied" : "Open";
      await ticket.save();
      const User = require("../models/User");
      const user = await User.findById(ticket.userId).select("name");
      await writeAudit({ userId: isAdmin ? null : decoded.id, username: isAdmin ? "Admin" : user?.name || "Customer", role: isAdmin ? "admin" : "user", event: "support.message_sent", message: "Message added to support ticket", metadata: { ticketId: String(ticket._id), senderType: isAdmin ? "admin" : "user" } });
      const populated = await SupportQuery.findById(ticket._id).populate("userId", "name mobile email").populate("orderId", "orderId status createdAt");
      return res.json({ success: true, query: populated });
    } catch (error) {
      console.error("[SUPPORT] REPLY_FAILED", { ticketId: req.params.id, message: error.message });
      return res.status(500).json({ success: false, message: "Unable to send reply." });
    }
  };
  if (isAdmin) return sellerAuth(req, res, execute);
  return auth(req, res, execute);
});

router.patch("/:id/status", sellerAuth, async (req, res) => {
  if (!validId(req.params.id) || !["Open", "Replied", "Closed"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid ticket or status." });
  const ticket = await SupportQuery.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true }).populate("userId", "name mobile email").populate("orderId", "orderId status");
  if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
  await writeAudit({ role: "admin", username: "Admin", event: "support.ticket_status_changed", message: "Support ticket status changed", metadata: { ticketId: String(ticket._id), status: ticket.status } });
  return res.json({ success: true, query: ticket });
});

module.exports = router;
