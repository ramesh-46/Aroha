const express = require("express");
const router = express.Router();
const Seller = require("../models/Seller");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || "sellersecret";

// ====== SELLER SIGNUP ======
router.post("/seller-signup", async (req, res) => {
  const {
    name,
    mobile,
    email,
    password,
    recoveryCode,
    gstNumber,
    address,
    companyName,
    contactNumber,
  } = req.body;

  try {
    const existing = await Seller.findOne({ mobile });
    if (existing)
      return res.status(400).json({ success: false, message: "Seller already exists" });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const seller = new Seller({
      name,
      mobile,
      email,
      password: hashedPassword,
      recoveryCode,
      gstNumber,
      address,
      companyName,
      contactNumber,
    });

    await seller.save();
    res.json({ success: true, seller });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ====== SELLER LOGIN ======
router.post("/seller-login", async (req, res) => {
  const { mobile, password } = req.body;
  try {
    const seller = await Seller.findOne({ mobile });
    if (!seller)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: seller._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ success: true, seller, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ====== SELLER RESET PASSWORD ======
router.post("/seller-reset", async (req, res) => {
  const { mobile, email, recoveryCode, newPassword } = req.body;

  if (!mobile || !email || !recoveryCode)
    return res.status(400).json({ success: false, message: "All fields are required!" });

  try {
    const seller = await Seller.findOne({ mobile, email, recoveryCode });
    if (!seller)
      return res.status(400).json({
        success: false,
        message: "Mobile, Email, or Recovery Code is incorrect!",
      });

    if (!newPassword)
      return res.json({
        success: true,
        verified: true,
        message: "Verification successful. Enter new password.",
      });

    seller.password = await bcrypt.hash(newPassword, saltRounds);
    await seller.save();

    res.json({ success: true, updated: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
