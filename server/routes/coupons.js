const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const StoreSettings = require("../models/StoreSettings");
const sellerAuthMiddleware = require("../middleware/sellerAuthMiddleware");
const { getEffectiveUnitPrice, roundCurrency } = require("../utils/pricing");

const generateUniqueCode = (prefix = "") => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}${code}` : code;
};

const getStoreSettings = async () => {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({});
  }
  return settings;
};

const isCouponActiveNow = (coupon) => {
  const now = Date.now();
  if (coupon.startsAt && now < new Date(coupon.startsAt).getTime()) return false;
  if (coupon.endsAt && now > new Date(coupon.endsAt).getTime()) return false;
  return true;
};

const validateCouponForCart = async ({ code, items }) => {
  const normalizedCode = `${code || ""}`.trim().toUpperCase();
  if (!normalizedCode) {
    return { ok: false, status: 400, message: "Coupon code is required" };
  }

  const coupon = await Coupon.findOne({ code: normalizedCode, isActive: true });
  if (!coupon) {
    return { ok: false, status: 404, message: "Invalid or inactive coupon" };
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, status: 400, message: "Coupon usage limit reached" };
  }
  if (!isCouponActiveNow(coupon)) {
    return { ok: false, status: 400, message: "Coupon is not active for the current time window" };
  }

  const settings = await getStoreSettings();
  const validatedItems = [];

  for (const item of items || []) {
    const product = item.productId?.price ? item.productId : await Product.findById(item.productId);
    if (!product) continue;
    const quantity = Number(item.quantity) || 0;
    if (quantity <= 0) continue;
    const pricing = getEffectiveUnitPrice(product, settings);
    validatedItems.push({
      productId: product._id,
      category: product.category,
      quantity,
      unitPrice: pricing.effectivePrice,
      lineTotal: roundCurrency(pricing.effectivePrice * quantity)
    });
  }

  if (validatedItems.length === 0) {
    return { ok: false, status: 400, message: "No eligible items selected for this coupon" };
  }

  const subtotal = roundCurrency(validatedItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const eligibleItems = coupon.category
    ? validatedItems.filter((item) => item.category === coupon.category)
    : validatedItems;
  const eligibleAmount = roundCurrency(eligibleItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const totalQuantity = validatedItems.reduce((sum, item) => sum + item.quantity, 0);

  if (subtotal < (coupon.minOrderValue || 0)) {
    return { ok: false, status: 400, message: `Minimum order value of ₹${coupon.minOrderValue} required.` };
  }
  if (totalQuantity < (coupon.minMembers || 1)) {
    return { ok: false, status: 400, message: `At least ${coupon.minMembers} item(s) required for this coupon.` };
  }
  if (eligibleAmount <= 0) {
    return { ok: false, status: 400, message: "This coupon does not apply to the selected cart items." };
  }

  let discountAmount = coupon.isPercentage
    ? roundCurrency((eligibleAmount * coupon.discountValue) / 100)
    : roundCurrency(coupon.discountValue);

  if (coupon.maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, roundCurrency(coupon.maxDiscountAmount));
  }
  discountAmount = Math.min(discountAmount, eligibleAmount);

  return {
    ok: true,
    coupon,
    settings,
    subtotal,
    eligibleAmount,
    discountAmount
  };
};

router.post("/generate", sellerAuthMiddleware, async (req, res) => {
  try {
    const {
      discountValue,
      isPercentage,
      minOrderValue,
      minMembers,
      usageLimit,
      category,
      maxDiscountAmount,
      startsAt,
      endsAt
    } = req.body;

    const normalizedDiscount = Number(discountValue);
    if (Number.isNaN(normalizedDiscount) || normalizedDiscount <= 0) {
      return res.status(400).json({ success: false, message: "Discount value must be greater than 0" });
    }

    if (isPercentage && normalizedDiscount > 100) {
      return res.status(400).json({ success: false, message: "Percentage coupon cannot exceed 100%" });
    }

    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({ success: false, message: "Coupon end time must be after start time" });
    }

    const prefix = (category || "GEN").replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
    let code = generateUniqueCode(prefix);
    while (await Coupon.findOne({ code })) {
      code = generateUniqueCode(prefix);
    }

    const newCoupon = new Coupon({
      code,
      discountValue: normalizedDiscount,
      isPercentage: Boolean(isPercentage),
      minOrderValue: Number(minOrderValue) || 0,
      minMembers: Number(minMembers) || 1,
      usageLimit: Number(usageLimit) || 100,
      category: category || "",
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      startsAt: startsAt || null,
      endsAt: endsAt || null
    });

    await newCoupon.save();
    res.json({ success: true, coupon: newCoupon });
  } catch (err) {
    console.error("Coupon generating error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", sellerAuthMiddleware, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/apply", async (req, res) => {
  try {
    const result = await validateCouponForCart({
      code: req.body.code,
      items: req.body.items || []
    });

    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      coupon: result.coupon,
      subtotal: result.subtotal,
      eligibleAmount: result.eligibleAmount,
      discountAmount: result.discountAmount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
