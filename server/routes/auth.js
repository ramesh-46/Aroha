const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Signup
router.post("/signup", async (req, res) => {
  const { name, mobile, email, password, gender, address, details } = req.body;
  try {
    let user = await User.findOne({ mobile });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ name, mobile, email, password, gender, address, details });
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { mobile, password } = req.body;
  try {
    const user = await User.findOne({ mobile, password });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const { mobile } = req.body;
  const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    const user = await User.findOneAndUpdate({ mobile }, { recoveryCode }, { new: true });
    if (!user) return res.status(400).json({ message: "User not found" });
    res.json({ success: true, recoveryCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.post("/profile/update", async (req, res) => {
  const { mobile, name, email, gender, address, details, password } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { mobile },
      { name, email, gender, address, details, password },
      { new: true }
    );
    if (!user) return res.status(400).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
