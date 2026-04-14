const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema({
  checkoutEnabled: { type: Boolean, default: true },
  saleBannerMessage: {
    type: String,
    default: "Live sale is on now. Grab the best prices before the timer ends."
  },
  saleImages: {
    type: [String],
    default: []
  },
  saleStartsAt: { type: Date, default: null },
  saleEndsAt: { type: Date, default: null },
  flashSaleDiscountPercent: { type: Number, default: 0 },
  flashSaleCategory: { type: String, default: "" },
  freeDeliveryEnabled: { type: Boolean, default: false },
  sellerLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  deliveryRadiusKm: { type: Number, default: 15 },
  normalDeliveryCharge: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
