// promotion.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const User = require("../models/User");
const sellerAuthMiddleware = require("../middleware/sellerAuthMiddleware");

const router = express.Router();

// ===== Session folder path =====
const sessionPath = path.join(__dirname, "../.wwebjs_auth/promotionClient");

// ===== Helper: Delete session folder =====
const deleteSession = () => {
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log("✅ WhatsApp session deleted");
  }
};

// ===== WhatsApp Client Setup =====
let qrCodeString = "";
let connectedInfo = null;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "promotionClient" }),
});

// Delete old session on server start
deleteSession();

client.on("qr", (qr) => {
  console.log("QR RECEIVED - scan to login WhatsApp");
  qrcode.generate(qr, { small: true });
  qrCodeString = qr; // store QR for frontend
  connectedInfo = null; // reset connected info until logged in
});

client.on("ready", async () => {
  console.log("WhatsApp Client Ready");
  qrCodeString = ""; // QR used, reset
  try {
    const me = client.info.me;
    const number = me?.number?._serialized || "Unknown number";
    const name = me?.pushname || me?.user || "Unknown user";
    connectedInfo = { name, number };
  } catch (err) {
    console.error("Failed to get WhatsApp info:", err);
    connectedInfo = { name: "Unknown user", number: "Unknown number" };
  }
});

client.on("auth_failure", (msg) => {
  console.log("❌ WhatsApp auth failed:", msg);
});

client.initialize();

// ===== Routes =====

// 1. Get QR for frontend
router.get("/qr", (req, res) => {
  if (connectedInfo) return res.json({ success: true, message: "Already connected", info: connectedInfo });
  if (!qrCodeString) return res.json({ success: false, message: "QR not ready yet" });
  res.json({ success: true, qr: qrCodeString });
});

// 2. Get WhatsApp session info (name + number)
router.get("/session-info", (req, res) => {
  if (!connectedInfo) return res.json({ success: false, message: "Not connected" });
  res.json({ success: true, info: connectedInfo });
});

// 3. Get all users
router.get("/all-users", sellerAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, { _id: 0, name: 1, mobile: 1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 4. Send promotion
router.post("/send-promotion", sellerAuthMiddleware, async (req, res) => {
  const { message, users } = req.body;
  if (!message || !users || users.length === 0)
    return res.status(400).json({ success: false, message: "Message or users missing" });

  if (!connectedInfo || !client.info?.me)
    return res.status(400).json({ success: false, message: "WhatsApp not connected" });

  let sentCount = 0;
  for (const user of users) {
    try {
      const number = user.mobile.replace(/\D/g, "");
      const chatId = number + "@c.us";
      await client.sendMessage(chatId, message);
      sentCount++;
    } catch (err) {
      console.error(`Failed to send to ${user.mobile}:`, err.message);
    }
  }

  // After sending, reset session → require new scan next time
  deleteSession();
  qrCodeString = "";
  connectedInfo = null;
  await client.destroy();
  client.initialize(); // re-initialize client for new session

  res.json({ success: true, message: "Promotion sent", sentCount });
});

// 5. Logout route (delete session manually)
router.post("/logout", sellerAuthMiddleware, async (req, res) => {
  try {
    deleteSession();
    qrCodeString = "";
    connectedInfo = null;
    await client.destroy();
    client.initialize(); // ready for new QR scan
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to logout" });
  }
});

module.exports = router;
