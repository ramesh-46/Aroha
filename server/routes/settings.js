const express = require("express");
const router = express.Router();
const StoreSettings = require("../models/StoreSettings");
const sellerAuthMiddleware = require("../middleware/sellerAuthMiddleware");
const { getSaleStatus } = require("../utils/pricing");

const normalizeNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getStoreSettings = async () => {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({});
  }
  return settings;
};

router.get("/", async (req, res) => {
  try {
    const settings = await getStoreSettings();
    res.json({
      success: true,
      settings,
      saleStatus: getSaleStatus(settings)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/", sellerAuthMiddleware, async (req, res) => {
  try {
    const settings = await getStoreSettings();
    const fields = [
      "checkoutEnabled",
      "saleBannerMessage",
      "saleImages",
      "saleStartsAt",
      "saleEndsAt",
      "flashSaleDiscountPercent",
      "flashSaleCategory",
      "freeDeliveryEnabled",
      "normalDeliveryCharge"
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    if (req.body.deliveryRadiusKm !== undefined) {
      settings.deliveryRadiusKm = normalizeNumber(req.body.deliveryRadiusKm, settings.deliveryRadiusKm);
    }

    if (req.body.sellerLocation) {
      settings.sellerLocation = {
        lat: normalizeNumber(req.body.sellerLocation.lat),
        lng: normalizeNumber(req.body.sellerLocation.lng)
      };
    }

    settings.updatedAt = new Date();
    await settings.save();

    res.json({
      success: true,
      settings,
      saleStatus: getSaleStatus(settings)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
