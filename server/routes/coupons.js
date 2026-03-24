const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");

// Generate unique coupon code
const generateUniqueCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create new coupon
router.post("/generate", async (req, res) => {
  try {
    const { discountValue, isPercentage, minOrderValue, minMembers, usageLimit, category } = req.body;
    let code = generateUniqueCode();
    
    // Ensure uniqueness
    while (await Coupon.findOne({ code })) {
      code = generateUniqueCode();
    }

    const newCoupon = new Coupon({
      code,
      discountValue: discountValue || 10,
      isPercentage: isPercentage || false,
      minOrderValue: minOrderValue || 0,
      minMembers: minMembers || 1,
      usageLimit: usageLimit || 100,
      category: category || ""
    });

    await newCoupon.save();
    res.json({ success: true, coupon: newCoupon });
  } catch (err) {
    console.error("Coupon generating error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all coupons
router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete coupon
router.delete("/:id", async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Apply coupon
router.post("/apply", async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code, isActive: true });
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or inactive coupon" });
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    }
    
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
