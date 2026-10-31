const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const User = require("../models/User");
const StoreSettings = require("../models/StoreSettings");
const { roundCurrency, getSaleStatus, getEffectiveUnitPrice } = require("../utils/pricing");
const sellerAuthMiddleware = require("../middleware/sellerAuthMiddleware");

const getStoreSettings = async () => {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({});
  }
  return settings;
};

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
  if (
    !from ||
    !to ||
    !Number.isFinite(Number(from.lat)) ||
    !Number.isFinite(Number(from.lng)) ||
    !Number.isFinite(Number(to.lat)) ||
    !Number.isFinite(Number(to.lng))
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latDelta = toRadians(Number(to.lat) - Number(from.lat));
  const lngDelta = toRadians(Number(to.lng) - Number(from.lng));
  const lat1 = toRadians(Number(from.lat));
  const lat2 = toRadians(Number(to.lat));

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const buildDeliveryDetails = async (customerLocation) => {
  const settings = await getStoreSettings();
  const distanceKm = calculateDistanceKm(settings.sellerLocation, customerLocation);
  const freeDelivery =
    settings.freeDeliveryEnabled &&
    distanceKm !== null &&
    distanceKm <= (Number(settings.deliveryRadiusKm) || 0);

  return {
    settings,
    distanceKm,
    deliveryCharge: freeDelivery ? 0 : roundCurrency(settings.normalDeliveryCharge || 0),
    isFreeDeliveryApplied: freeDelivery
  };
};

router.get("/checkout-settings", async (req, res) => {
  try {
    const customerLocation = req.query.lat && req.query.lng
      ? {
          lat: Number(req.query.lat),
          lng: Number(req.query.lng)
        }
      : null;

    const { settings, distanceKm, deliveryCharge, isFreeDeliveryApplied } =
      await buildDeliveryDetails(customerLocation);

    res.json({
      success: true,
      checkoutEnabled: settings.checkoutEnabled,
      deliveryMinDays: settings.deliveryMinDays || 3,
      deliveryMaxDays: settings.deliveryMaxDays || 5,
      saleStatus: getSaleStatus(settings),
      flashSaleDiscountPercent: settings.flashSaleDiscountPercent || 0,
      flashSaleCategory: settings.flashSaleCategory || "",
      rewardsEnabled: settings.rewardsEnabled !== false,
      coinRupeeValue: Number(settings.coinRupeeValue) || 0,
      freeDeliveryEnabled: settings.freeDeliveryEnabled,
      deliveryRadiusKm: settings.deliveryRadiusKm,
      sellerLocation: settings.sellerLocation,
      distanceKm,
      deliveryCharge,
      isFreeDeliveryApplied,
      message: !settings.checkoutEnabled
        ? "Checkout is temporarily disabled by admin."
        : isFreeDeliveryApplied
          ? `Free delivery available within ${settings.deliveryRadiusKm} km.`
          : "Normal delivery charges apply."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  const {
    userId,
    items,
    customerName,
    customerMobile,
    deliveryAddress,
    discountAmount,
    couponCode,
    totalAmount,
    customerLocation,
    couponDetails
  } = req.body;

  if (!userId || !items || !items.length) {
    return res.status(400).json({ message: "Missing userId or items" });
  }

  const session = await mongoose.startSession();

  try {
    const settings = await getStoreSettings();
    if (!settings.checkoutEnabled) {
      return res.status(400).json({ message: "Checkout is currently disabled by admin" });
    }

    session.startTransaction();

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    const orderItems = items.map((item) => {
      const product = productMap.get(String(item.productId));
      if (!product || !product.isActive) {
        throw new Error("One or more selected products are no longer available");
      }
      if ((Number(item.quantity) || 0) <= 0) {
        throw new Error("Invalid order quantity");
      }
      if ((Number(product.stock) || 0) < Number(item.quantity)) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const pricing = getEffectiveUnitPrice(product, settings);
      const originalPrice = roundCurrency(product.price || 0);
      const discountedPrice = pricing.effectivePrice;
      const quantity = Number(item.quantity) || 1;

      product.stock = Math.max(0, (Number(product.stock) || 0) - quantity);

      return {
        productId: product._id,
        sku: item.sku || product.sku || "",
        quantity,
        originalPrice,
        discountedPrice,
        lineTotal: roundCurrency(discountedPrice * quantity),
        productSnapshot: {
          _id: product._id,
          name: product.name,
          category: product.category,
          subCategory: product.subCategory,
          brand: product.brand,
          collection: product.collection,
          price: product.price,
          discount: product.discount,
          finalPrice: product.finalPrice,
          flashSalePrice: pricing.flashSaleApplied ? pricing.effectivePrice : null,
          flashSaleApplied: pricing.flashSaleApplied,
          images: product.images,
          sku: product.sku,
          soldBy: product.soldBy,
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          stockAtOrderTime: product.stock + quantity
        }
      };
    });

    for (const product of products) {
      await product.save({ session });
    }

    const normalizedCouponCode = `${couponCode || ""}`.trim().toUpperCase();
    let couponRecord = null;
    if (normalizedCouponCode) {
      couponRecord = await Coupon.findOne({ code: normalizedCouponCode }).session(session);
      if (couponRecord) {
        const now = Date.now();
        if (
          !couponRecord.isActive ||
          couponRecord.usedCount >= couponRecord.usageLimit ||
          (couponRecord.startsAt && now < new Date(couponRecord.startsAt).getTime()) ||
          (couponRecord.endsAt && now > new Date(couponRecord.endsAt).getTime())
        ) {
          throw new Error("Coupon is no longer valid at checkout");
        }
        couponRecord.usedCount += 1;
        await couponRecord.save({ session });
      }
    }

    const subtotalAmount = roundCurrency(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const deliveryDetails = await buildDeliveryDetails(customerLocation || null);
    const discountValue = roundCurrency(discountAmount || 0);
    const computedTotal = roundCurrency(subtotalAmount - discountValue + deliveryDetails.deliveryCharge);

    const newOrder = new Order({
      userId,
      items: orderItems,
      customerName,
      customerMobile,
      deliveryAddress,
      customerLocation: customerLocation || {},
      discountAmount: discountValue,
      couponCode: normalizedCouponCode,
      couponDetails: couponDetails || couponRecord || null,
      subtotalAmount,
      deliveryCharge: deliveryDetails.deliveryCharge,
      isFreeDeliveryApplied: deliveryDetails.isFreeDeliveryApplied,
      totalAmount: totalAmount !== undefined ? roundCurrency(totalAmount) : computedTotal,
      status: "Pending",
      statusHistory: [{ status: "Pending", updatedAt: new Date() }]
    });

    const savedOrder = await newOrder.save({ session });
    await session.commitTransaction();

    const populatedOrder = await Order.findById(savedOrder._id).populate("items.productId");
    console.info("[ADMIN_ORDERS] STATUS_CHANGE_SAVED", { orderId: order.orderId || String(order._id), status });
    res.json(populatedOrder);
  } catch (err) {
    await session.abortTransaction();
    console.log(err);
    res.status(500).json({ message: "Order creation failed", error: err.message || err });
  } finally {
    session.endSession();
  }
});

router.get("/user/:userId", require("../middleware/authMiddleware"), async (req, res) => {
  if (String(req.params.userId) !== String(req.user.id)) return res.status(403).json({ success: false, message: "You may only view your own orders." });
  const { userId } = req.params;
  try {
    const orders = await Order.find({ userId })
      .populate("items.productId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

router.get("/all", sellerAuthMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.productId")
      .populate("userId", "name mobile email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.get("/:userId", require("../middleware/authMiddleware"), async (req, res) => {
  if (String(req.params.userId) !== String(req.user.id)) return res.status(403).json({ success: false, message: "You may only view your own orders." });
  const { userId } = req.params;
  try {
    const orders = await Order.find({ userId })
      .populate("items.productId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

router.put("/status/:orderId", sellerAuthMiddleware, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const allowedStatuses = ["Pending", "Under Consideration", "Under Confirmation", "Processing", "Packing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Payment Verification Pending", "Payment Verified", "Payment Failed"];
  if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Choose a supported order status.", allowedStatuses });

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const previousStatus = order.status;
    order.status = status;
    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({ status, updatedAt: new Date() });
    console.info("[ADMIN_ORDERS] STATUS_CHANGE_REQUEST", { orderId: order.orderId || String(order._id), previousStatus, nextStatus: status, adminId: req.seller?.id || req.seller?._id || null });
    const updatedOrder = await order.save();

    // Manual/admin payment verification uses the same one-time rewards rule as Razorpay capture.
    if (status === "Payment Verified" && order.userId) {
      const rewardClaim = await Order.findOneAndUpdate(
        { _id: order._id, rewardsCreditedAt: null },
        { $set: { rewardsCreditedAt: new Date(), paymentVerifiedAt: new Date() } },
        { new: true }
      );
      if (rewardClaim) {
        const settings = await StoreSettings.findOne();
        if (settings?.rewardsEnabled !== false) {
          const customer = await User.findById(order.userId);
          const purchaseCoins = Math.max(0, Math.floor((Number(order.totalAmount) / 100) * Number(settings?.coinsPer100Spent ?? 5)));
          if (customer && purchaseCoins > 0) await User.updateOne(
            { _id: customer._id },
            { $inc: { rewardCoins: purchaseCoins }, $push: { rewardHistory: { type: "purchase", coins: purchaseCoins, orderId: order.orderId, note: "Coins for an admin-verified payment." } } }
          );
          if (customer?.referredBy && !customer.referralRewardCreditedAt) {
            const referralClaim = await User.findOneAndUpdate(
              { _id: customer._id, referralRewardCreditedAt: null, referredBy: { $ne: null } },
              { $set: { referralRewardCreditedAt: new Date() } },
              { new: true }
            );
            if (referralClaim) {
              const referrerCoins = Math.max(0, Number(settings.referralBonusCoins) || 0);
              const referredCoins = Math.max(0, Number(settings.referredUserBonusCoins) || 0);
              if (referrerCoins > 0) await User.updateOne(
                { _id: referralClaim.referredBy },
                { $inc: { rewardCoins: referrerCoins }, $push: { rewardHistory: { type: "referral", coins: referrerCoins, orderId: order.orderId, note: "Referral reward after your friend's first verified payment." } } }
              );
              if (referredCoins > 0) await User.updateOne(
                { _id: referralClaim._id },
                { $inc: { rewardCoins: referredCoins }, $push: { rewardHistory: { type: "welcome_referral", coins: referredCoins, orderId: order.orderId, note: "Welcome reward for joining through a referral." } } }
              );
            }
          }
          await Order.updateOne({ _id: order._id }, { $set: { rewardsCoinsAwarded: purchaseCoins } });
          console.log("[REWARDS] ADMIN_VERIFIED_ORDER_CREDITED", { orderId: order.orderId, userId: String(order.userId), purchaseCoins });
        }
      }
    }

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate("items.productId")
      .populate("userId", "name mobile email");
    res.json(populatedOrder);
  } catch (err) {
    console.error("[ADMIN_ORDERS] STATUS_CHANGE_FAILED", { orderId, message: err.message });
    res.status(500).json({ success: false, message: "Failed to update status", error: err.message });
  }
});

router.get("/users/all", sellerAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password -recoveryCode").sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
