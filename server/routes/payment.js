const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const StoreSettings = require("../models/StoreSettings");
const Coupon = require("../models/Coupon");
const { roundCurrency, getEffectiveUnitPrice } = require("../utils/pricing");
const { v4: uuidv4 } = require("uuid");
const maskEmail = (value) => { const parts = String(value || "").split("@"); return parts.length === 2 ? parts[0].slice(0, 1) + "***@" + parts[1] : ""; };
const multer = require("multer"); // Import multer
const auth = require("../middleware/authMiddleware");
const { writeAudit } = require("../middleware/activityLogger");

// Configure Multer for memory storage (to handle file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Create a Payment Session and Generate UPI QR Details ---
router.post("/create-session", auth, async (req, res) => {
  const requestId = require("crypto").randomUUID();
  try {
    const { cartItems, addressId, customerLocation = null, couponCode = "", redeemCoins = 0 } = req.body || {};
    const userId = req.user.id;
    const checkoutUser = await User.findById(userId).select("name mobile email addresses address").lean();
    if (!checkoutUser) return res.status(404).json({ success: false, error: "Customer account not found." });
    const selectedAddress = (checkoutUser.addresses || []).find(address => String(address._id) === String(addressId));
    if (!selectedAddress) return res.status(400).json({ success: false, error: "Select a saved delivery address before checkout." });
    const customerDetails = { name: selectedAddress.name || checkoutUser.name, mobile: selectedAddress.mobile || checkoutUser.mobile, address: [selectedAddress.line1, selectedAddress.line2, selectedAddress.landmark, selectedAddress.city, selectedAddress.state, selectedAddress.pincode].filter(Boolean).join(", ") };
  let reservedCoins = 0;
  let reservedUserId = null;
    if (!userId || !Array.isArray(cartItems) || !cartItems.length || !customerDetails?.name || !customerDetails?.mobile || !customerDetails?.address) {
      return res.status(400).json({ success: false, error: "User, items and complete delivery details are required." });
    }
    const settings = await StoreSettings.findOne() || await StoreSettings.create({});
    if (settings.checkoutEnabled === false) return res.status(403).json({ success: false, error: "Checkout is temporarily disabled." });

    const productIds = cartItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const orderItems = [];
    let subtotalAmount = 0;
    let totalQuantity = 0;

    for (const item of cartItems) {
      const product = productMap.get(String(item.productId));
      const quantity = Number(item.quantity);
      if (!product) return res.status(400).json({ success: false, error: "One or more products are unavailable." });
      if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ success: false, error: "Invalid product quantity." });
      if (quantity > Number(product.stock || 0)) return res.status(400).json({ success: false, error: "Only " + product.stock + " units of " + product.name + " are available." });
      const pricing = getEffectiveUnitPrice(product, settings);
      const unitPrice = roundCurrency(pricing.effectivePrice);
      const lineTotal = roundCurrency(unitPrice * quantity);
      subtotalAmount = roundCurrency(subtotalAmount + lineTotal);
      totalQuantity += quantity;
      orderItems.push({
        productId: product._id, sku: product.sku || "", quantity,
        originalPrice: roundCurrency(product.price || 0), discountedPrice: unitPrice, lineTotal,
        productSnapshot: { _id: product._id, name: product.name, brand: product.brand, category: product.category, sku: product.sku, images: product.images, price: product.price, finalPrice: product.finalPrice }
      });
    }

    let discountAmount = 0;
    let couponRecord = null;
    const normalizedCouponCode = String(couponCode || "").trim().toUpperCase();
    if (normalizedCouponCode) {
      couponRecord = await Coupon.findOne({ code: normalizedCouponCode, isActive: true });
      const now = Date.now();
      if (!couponRecord || couponRecord.usedCount >= couponRecord.usageLimit ||
        (couponRecord.startsAt && now < new Date(couponRecord.startsAt).getTime()) ||
        (couponRecord.endsAt && now > new Date(couponRecord.endsAt).getTime())) {
        return res.status(400).json({ success: false, error: "Coupon is invalid, inactive or expired." });
      }
      if (subtotalAmount < Number(couponRecord.minOrderValue || 0)) return res.status(400).json({ success: false, error: "Minimum order value of ₹" + couponRecord.minOrderValue + " is required." });
      if (totalQuantity < Number(couponRecord.minMembers || 1)) return res.status(400).json({ success: false, error: "This coupon requires at least " + couponRecord.minMembers + " item(s)." });
      const eligibleAmount = roundCurrency(orderItems.filter((item) => !couponRecord.category || productMap.get(String(item.productId)).category === couponRecord.category).reduce((sum, item) => sum + item.lineTotal, 0));
      if (eligibleAmount <= 0) return res.status(400).json({ success: false, error: "Coupon does not apply to these products." });
      discountAmount = couponRecord.isPercentage ? roundCurrency(eligibleAmount * Number(couponRecord.discountValue) / 100) : roundCurrency(couponRecord.discountValue);
      if (Number(couponRecord.maxDiscountAmount) > 0) discountAmount = Math.min(discountAmount, Number(couponRecord.maxDiscountAmount));
      discountAmount = Math.min(discountAmount, eligibleAmount);
    }

    const toRadians = (value) => value * Math.PI / 180;
    let deliveryCharge = roundCurrency(settings.normalDeliveryCharge || 0);
    const seller = settings.sellerLocation;
    if (settings.freeDeliveryEnabled && customerLocation && Number.isFinite(Number(customerLocation.lat)) && Number.isFinite(Number(customerLocation.lng)) && Number.isFinite(Number(seller?.lat)) && Number.isFinite(Number(seller?.lng))) {
      const lat1 = toRadians(Number(seller.lat)), lat2 = toRadians(Number(customerLocation.lat));
      const dLat = lat2 - lat1, dLng = toRadians(Number(customerLocation.lng) - Number(seller.lng));
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      const distance = 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      if (distance <= Number(settings.deliveryRadiusKm || 0)) deliveryCharge = 0;
    }
    let rewardDiscount = 0;
    const requestedCoins = Number(redeemCoins) || 0;
    if (!Number.isInteger(requestedCoins) || requestedCoins < 0) return res.status(400).json({ success: false, error: "Invalid reward coin amount." });
    if (requestedCoins > 0) {
      if (settings.rewardsEnabled === false || Number(settings.coinRupeeValue) <= 0) return res.status(400).json({ success: false, error: "Reward coin redemption is currently unavailable." });
      const maxCoinsForOrder = Math.floor(Math.max(0, subtotalAmount - discountAmount + deliveryCharge - 0.01) / Number(settings.coinRupeeValue));
      if (requestedCoins > maxCoinsForOrder) return res.status(400).json({ success: false, error: "You cannot redeem more coins than this order allows." });
      const reservedUser = await User.findOneAndUpdate({ _id: userId, rewardCoins: { $gte: requestedCoins } }, { $inc: { rewardCoins: -requestedCoins }, $push: { rewardHistory: { type: "redeem", coins: -requestedCoins, note: "Reward coins applied to checkout." } } }, { new: true });
      if (!reservedUser) return res.status(400).json({ success: false, error: "Insufficient reward coin balance. Refresh your rewards balance." });
      reservedCoins = requestedCoins;
      reservedUserId = userId;
      rewardDiscount = roundCurrency(requestedCoins * Number(settings.coinRupeeValue));
    }
    const finalAmount = roundCurrency(Math.max(0, subtotalAmount - discountAmount + deliveryCharge - rewardDiscount));
    if (finalAmount <= 0) return res.status(400).json({ success: false, error: "Order total must be greater than zero." });
    const upiId = process.env.UPI_ID;
    if (!upiId) return res.status(503).json({ success: false, error: "UPI payment is not configured." });

    const orderId = "ORDER_" + require("crypto").randomUUID().toUpperCase().slice(0, 8);
    const upiUrl = "upi://pay?pa=" + encodeURIComponent(upiId) + "&pn=AROHA%20HUB&am=" + finalAmount + "&cu=INR";
    const newOrder = new Order({
      orderId, userId, items: orderItems, customerName: customerDetails.name,
      customerMobile: customerDetails.mobile, deliveryAddress: customerDetails.address,
      customerLocation: customerLocation || {}, discountAmount, couponCode: normalizedCouponCode,
      couponDetails: couponRecord, subtotalAmount, deliveryCharge, totalAmount: finalAmount,
      rewardCoinsRedeemed: reservedCoins, rewardDiscountAmount: rewardDiscount,
      status: "Payment Verification Pending", paymentMethod: "UPI QR", upiId, upiUrl
    });
    await newOrder.save();
    await writeAudit({ userId, username: checkoutUser?.name || customerDetails?.name || "Customer", role: "user", event: "checkout.session_created", message: "Checkout session created", requestId, metadata: { orderId, itemCount: orderItems.length, totalQuantity, finalAmount } });
    console.log("[CHECKOUT] SESSION_CREATED", { requestId, orderId, userId: String(userId), itemCount: orderItems.length, totalQuantity, subtotalAmount, discountAmount, deliveryCharge, finalAmount, couponCode: normalizedCouponCode || null });
    return res.json({ success: true, orderId, upiUrl, upiId, amount: finalAmount, customerDetails, orderItems, pricing: { subtotalAmount, discountAmount, deliveryCharge, rewardDiscount, rewardCoinsRedeemed: reservedCoins, totalAmount: finalAmount } });
  } catch (error) {
    if (reservedCoins > 0 && reservedUserId) {
      await User.updateOne({ _id: reservedUserId }, { $inc: { rewardCoins: reservedCoins }, $push: { rewardHistory: { type: "refund", coins: reservedCoins, note: "Checkout session could not be created; reserved coins were returned." } } }).catch(() => {});
    }
    console.error("[CHECKOUT] SESSION_CREATE_FAILED", { requestId, error: error.message });
    return res.status(500).json({ success: false, error: "Could not prepare checkout. Please refresh your cart and try again." });
  }
});

// --- Verify Payment and Update Order Status ---
// NOTE: We add 'upload.single("screenshot")' here to handle the file
router.post("/verify-payment", auth, upload.single("screenshot"), async (req, res) => {
  try {
    // Multer parses text fields into req.body and file into req.file
    const { orderId, transactionId, ocrData } = req.body;
    const screenshotFile = req.file; 

    // 1. Validate required fields
    if (!orderId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: orderId or transactionId"
      });
    }

    // 2. Fetch the order
    const order = await Order.findOne({ orderId, userId: req.user.id });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    // 3. Validate OCR data (amount must match order amount)
    // Note: ocrData comes in as a string from FormData, so we parse it
    let parsedOcrData = {};
    try {
        parsedOcrData = typeof ocrData === 'string' ? JSON.parse(ocrData) : ocrData;
    } catch (e) {
        console.log("OCR data parsing failed, using empty object");
    }

    if (parsedOcrData && parsedOcrData.amount && parsedOcrData.amount !== order.totalAmount) {
      return res.status(400).json({
        success: false,
        error: `OCR amount (${parsedOcrData.amount}) does not match order amount (${order.totalAmount})`
      });
    }

    // 4. Check for duplicate transaction ID
    const existingOrder = await Order.findOne({ transactionId });
    if (existingOrder && existingOrder.orderId !== orderId) {
      return res.status(400).json({
        success: false,
        error: "Duplicate transaction ID used in another order"
      });
    }

    // 5. Update order with payment details
    order.transactionId = transactionId;
    order.ocrData = parsedOcrData || {};
    
    // If you want to save the actual image buffer to DB (ensure your schema supports Buffer or Base64)
    // For now, we just mark that a screenshot was uploaded
    order.screenshotUploaded = true; 
    order.status = "Payment Verification Pending";
    order.paymentVerifiedAt = null;
    order.paymentVerifiedBy = null;

    await order.save();

    res.json({
      success: true,
      message: "Payment details submitted. Awaiting verification.",
      orderId: order.orderId
    });

  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment",
      details: err.message
    });
  }
});


router.post("/razorpay/create-order", auth, async (req, res) => {
  const crypto = require("crypto");
  const requestId = crypto.randomUUID();
  try {
    const { orderId } = req.body || {};
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      console.error("[Razorpay]", requestId, "API keys are missing");
      return res.status(503).json({ success: false, error: "Razorpay is not configured on the server." });
    }
    if (!orderId) return res.status(400).json({ success: false, error: "orderId is required." });
    const order = await Order.findOne({ orderId, userId: req.user.id });
    if (!order) return res.status(404).json({ success: false, error: "Aroha order not found for this account." });
    if (!Number.isFinite(order.totalAmount) || order.totalAmount <= 0) return res.status(400).json({ success: false, error: "Invalid order amount." });
    if (order.status === "Payment Verified") return res.status(409).json({ success: false, error: "Order is already paid." });
    if (order.rewardsRefundedAt) return res.status(409).json({ success: false, error: "Reward coins for this checkout were returned. Please create a new checkout." });

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64"), "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(order.totalAmount * 100), currency: "INR", receipt: String(order.orderId).slice(0, 40), notes: { arohaOrderId: order.orderId } })
    });
    const gatewayOrder = await response.json();
    if (!response.ok || !gatewayOrder.id) {
      console.error("[Razorpay]", requestId, "Order creation failed", response.status, gatewayOrder.error?.code || "gateway_error");
      return res.status(502).json({ success: false, error: "Razorpay could not create the payment order." });
    }
    order.razorpayOrderId = gatewayOrder.id;
    order.paymentMethod = "Online";
    await order.save();
    const checkoutCustomer = await User.findById(order.userId).select("name email").lean();
    console.log("[Razorpay]", requestId, "ORDER_CREATED", { username: checkoutCustomer?.name || order.customerName || "Customer", userId: String(order.userId), userEmail: checkoutCustomer?.email || null, orderId: order.orderId, gatewayOrderId: gatewayOrder.id, paymentId: null, amountPaise: gatewayOrder.amount });
    res.json({ success: true, keyId, razorpayOrderId: gatewayOrder.id, amount: gatewayOrder.amount, currency: gatewayOrder.currency, name: order.customerName, mobile: order.customerMobile, arohaOrderId: order.orderId });
  } catch (err) {
    console.error("[Razorpay]", requestId, "Create-order error", err.message);
    res.status(500).json({ success: false, error: "Unable to create Razorpay order." });
  }
});

router.post("/razorpay/verify-payment", auth, async (req, res) => {
  const crypto = require("crypto");
  const requestId = crypto.randomUUID();
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      console.error("[Razorpay]", requestId, "API keys are missing during verification");
      return res.status(503).json({ success: false, error: "Razorpay is not configured on the server." });
    }
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ success: false, error: "Missing payment verification fields." });
    const order = await Order.findOne({ orderId, userId: req.user.id });
    if (!order) return res.status(404).json({ success: false, error: "Aroha order not found for this account." });
    if (order.razorpayOrderId !== razorpay_order_id) return res.status(400).json({ success: false, error: "Gateway order does not match Aroha order." });

    const expected = crypto.createHmac("sha256", keySecret).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(String(razorpay_signature), "hex");
    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      console.warn("[Razorpay]", requestId, "INVALID_SIGNATURE", { orderId });
      return res.status(400).json({ success: false, error: "Payment signature is invalid." });
    }

    const response = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(razorpay_payment_id), {
      headers: { Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64") }
    });
    const payment = await response.json();
    if (!response.ok || !payment.id) {
      console.error("[Razorpay]", requestId, "Payment lookup failed", response.status, payment.error?.code || "gateway_error");
      return res.status(502).json({ success: false, error: "Unable to confirm payment with Razorpay." });
    }
    if (payment.order_id !== razorpay_order_id || payment.amount !== Math.round(order.totalAmount * 100) || payment.currency !== "INR") {
      console.error("[Razorpay]", requestId, "AMOUNT_OR_ORDER_MISMATCH", { orderId, paymentId: payment.id });
      return res.status(400).json({ success: false, error: "Payment amount or order does not match." });
    }
    order.razorpayPaymentId = payment.id;
    order.transactionId = payment.id;
    if (payment.status === "captured") {
      order.status = "Payment Verified";
      order.paymentVerifiedAt = new Date();
      await order.save();

      // Credit coins only after Razorpay confirms a captured payment.
      const rewardClaim = await Order.findOneAndUpdate(
        { _id: order._id, rewardsCreditedAt: null },
        { $set: { rewardsCreditedAt: new Date() } },
        { new: true }
      );
      if (rewardClaim && order.userId) {
        if (order.couponCode) await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
        const settings = await StoreSettings.findOne();
        if (settings?.rewardsEnabled !== false) {
          const coins = Math.max(0, Math.floor((Number(order.totalAmount) / 100) * Number(settings?.coinsPer100Spent ?? 5)));
          const customer = await User.findById(order.userId);
          if (customer && coins > 0) {
            await User.updateOne(
              { _id: customer._id },
              { $inc: { rewardCoins: coins }, $push: { rewardHistory: { type: "purchase", coins, orderId: order.orderId, note: "Coins for a captured payment." } } }
            );
          }

          // A referral is rewarded once, after the referred customer's first captured payment.
          // Keep referredBy intact so the referral remains visible in both accounts.
          if (customer?.referredBy && !customer.referralRewardCreditedAt) {
            const referralClaim = await User.findOneAndUpdate(
              { _id: customer._id, referralRewardCreditedAt: null, referredBy: { $ne: null } },
              { $set: { referralRewardCreditedAt: new Date() } },
              { new: true }
            );
            if (referralClaim) {
              const referrerCoins = Math.max(0, Number(settings.referralBonusCoins) || 0);
              const referredCoins = Math.max(0, Number(settings.referredUserBonusCoins) || 0);
              if (referrerCoins > 0) {
                await User.updateOne(
                  { _id: referralClaim.referredBy },
                  { $inc: { rewardCoins: referrerCoins }, $push: { rewardHistory: { type: "referral", coins: referrerCoins, orderId: order.orderId, note: "Referral reward: your friend completed their first paid order." } } }
                );
              }
              if (referredCoins > 0) {
                await User.updateOne(
                  { _id: referralClaim._id },
                  { $inc: { rewardCoins: referredCoins }, $push: { rewardHistory: { type: "welcome_referral", coins: referredCoins, orderId: order.orderId, note: "Welcome reward for joining through a referral." } } }
                );
              }
              console.log("[REWARDS] REFERRAL_BONUSES_CREDITED", { orderId: order.orderId, referrerUserId: String(referralClaim.referredBy), referredUserId: String(referralClaim._id), referrerCoins, referredCoins });
            }
          }
          order.rewardsCoinsAwarded = coins;
          await order.save();
        }
      }

      // Clear this user's cart only after Razorpay confirms captured payment.
      if (order.userId) {
        const cart = await Cart.findOne({ userId: order.userId });
        if (cart && Array.isArray(cart.items) && cart.items.length) {
          const beforeCount = cart.items.length;
          for (const orderedItem of (order.items || [])) {
            const orderedProductId = String(orderedItem.productId?._id || orderedItem.productId || "");
            let remainingQuantity = Number(orderedItem.quantity || 0);
            for (let index = cart.items.length - 1; index >= 0 && remainingQuantity > 0; index--) {
              const cartItem = cart.items[index];
              if (String(cartItem.productId?._id || cartItem.productId || "") !== orderedProductId) continue;
              const cartQuantity = Number(cartItem.quantity || 0);
              if (cartQuantity <= remainingQuantity) {
                remainingQuantity -= cartQuantity;
                cart.items.splice(index, 1);
              } else {
                cartItem.quantity = cartQuantity - remainingQuantity;
                remainingQuantity = 0;
              }
            }
          }
          await cart.save();
          console.log("[Cart] CART_ITEMS_REMOVED_AFTER_PAYMENT", { orderId, userId: String(order.userId), itemCountBefore: beforeCount, itemCountAfter: cart.items.length });
        } else {
          console.log("[Cart] CART_ALREADY_EMPTY_AFTER_PAYMENT", { orderId });
        }
      } else {
        console.warn("[Cart] CART_NOT_CLEARED_USER_ID_MISSING", { orderId });
      }

      const paymentLogUser = await User.findById(order.userId).select("email").lean();
      console.log("[Razorpay]", requestId, "PAYMENT_CAPTURED", { orderId, userEmail: maskEmail(paymentLogUser?.email), gatewayOrderId: payment.order_id, paymentId: payment.id, amountPaise: payment.amount });
      return res.json({ success: true, paid: true, orderId: order.orderId, message: "Payment verified successfully." });
    }
    order.status = "Payment Verification Pending";
    await order.save();
    console.log("[Razorpay]", requestId, "PAYMENT_NOT_CAPTURED", { orderId, paymentId: payment.id, status: payment.status });
    return res.status(202).json({ success: true, paid: false, paymentStatus: payment.status, message: "Payment is not captured yet." });
  } catch (err) {
    console.error("[Razorpay]", requestId, "Verification error", err.message);
    res.status(500).json({ success: false, error: "Payment verification failed." });
  }
});


router.post("/razorpay/log-event", auth, async (req, res) => {
  const allowedEvents = new Set([
    "CHECKOUT_OPENED",
    "CHECKOUT_DISMISSED",
    "PAYMENT_FAILED",
    "PAYMENT_HANDLER_CALLED",
    "CLIENT_VERIFICATION_SUCCESS",
    "CLIENT_VERIFICATION_PENDING",
    "CLIENT_VERIFICATION_ERROR",
    "CHECKOUT_START_FAILED",
    "CHECKOUT_START_REQUESTED"
  ]);
  let eventBody = req.body || {};
  if (typeof eventBody === "string") {
    try { eventBody = JSON.parse(eventBody); }
    catch (_) { return res.status(400).json({ success: false, error: "Invalid event payload." }); }
  }
  const { event, orderId, gatewayOrderId, paymentId, details } = eventBody;
  if (!allowedEvents.has(event) || !orderId) {
    console.warn("[Razorpay][CLIENT_EVENT_INVALID]", { userId: String(req.user.id), event: String(event || "missing").slice(0, 80), hasOrderId: Boolean(orderId), hasGatewayOrderId: Boolean(gatewayOrderId), hasPaymentId: Boolean(paymentId), at: new Date().toISOString() });
    return res.status(400).json({ success: false, error: "Invalid Razorpay event. A valid order ID is required." });
  }
  const safeDetails = details && typeof details === "object" ? {
    code: details.code ? String(details.code).slice(0, 100) : undefined,
    reason: details.reason ? String(details.reason).slice(0, 200) : undefined,
    status: details.status ? String(details.status).slice(0, 50) : undefined,
    message: details.message ? String(details.message).slice(0, 200) : undefined
  } : undefined;
  if (event === "PAYMENT_FAILED" || event === "CHECKOUT_DISMISSED") {
    try {
      const failureReason = safeDetails?.reason || safeDetails?.message || safeDetails?.code || (event === "CHECKOUT_DISMISSED" ? "Checkout was closed before payment." : "Payment was not completed.");
      const failedOrder = await Order.findOneAndUpdate(
        { orderId: String(orderId), userId: req.user.id, status: { $ne: "Payment Verified" } },
        { $set: { status: "Payment Failed", paymentFailureReason: failureReason } },
        { new: true }
      );
      if (failedOrder?.rewardCoinsRedeemed > 0 && !failedOrder.rewardsRefundedAt) {
        const refundClaim = await Order.findOneAndUpdate(
          { _id: failedOrder._id, rewardsRefundedAt: null, rewardCoinsRedeemed: { $gt: 0 } },
          { $set: { rewardsRefundedAt: new Date() } },
          { new: true }
        );
        if (refundClaim) {
          await User.updateOne(
            { _id: refundClaim.userId },
            { $inc: { rewardCoins: refundClaim.rewardCoinsRedeemed }, $push: { rewardHistory: { type: "refund", coins: refundClaim.rewardCoinsRedeemed, orderId: refundClaim.orderId, note: "Reward coins returned because payment failed." } } }
          );
          console.log("[REWARDS] CHECKOUT_COINS_REFUNDED", { orderId: refundClaim.orderId, userId: String(refundClaim.userId), coins: refundClaim.rewardCoinsRedeemed });
        }
      }
    } catch (error) {
      console.error("[Razorpay] Could not record failed payment", error.message);
    }
  }
  const eventOrder = await Order.findOne({ orderId: String(orderId), userId: req.user.id }).select("userId orderId razorpayOrderId razorpayPaymentId transactionId").lean().catch(() => null);
  const eventUser = eventOrder?.userId ? await User.findById(eventOrder.userId).select("name email").lean().catch(() => null) : null;
  const resolvedPaymentId = paymentId || eventOrder?.razorpayPaymentId || eventOrder?.transactionId || null;
  console.log("[Razorpay][CLIENT_EVENT]", {
    event,
    username: eventUser?.name || "Customer",
    userId: String(req.user.id),
    userEmail: eventUser?.email || null,
    orderId: eventOrder?.orderId || String(orderId),
    gatewayOrderId: gatewayOrderId || eventOrder?.razorpayOrderId || null,
    paymentId: resolvedPaymentId,
    details: safeDetails,
    at: new Date().toISOString()
  });
  return res.json({ success: true });
});

module.exports = router;