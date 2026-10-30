const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const StoreSettings = require("../models/StoreSettings");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer"); // Import multer

// Configure Multer for memory storage (to handle file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Create a Payment Session and Generate UPI QR Details ---
router.post("/create-session", async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      customerDetails,
      couponCode = "",
      discountAmount = 0,
      deliveryCharge = 0,
      totalAmount
    } = req.body;

    // 1. Validate required fields
    if (!userId || !cartItems || !customerDetails) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, cartItems, or customerDetails"
      });
    }

    // 2. Validate customerDetails
    if (!customerDetails.name || !customerDetails.mobile || !customerDetails.address) {
      return res.status(400).json({
        success: false,
        error: "Missing customer details: name, mobile, or address"
      });
    }

    // 3. Recalculate total amount from cartItems
    let calculatedTotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          error: `Product ${product?.name || item.productId} is unavailable`
        });
      }

      const unitPrice = item.discountedPrice || item.originalPrice || product.finalPrice || product.price;
      calculatedTotal += unitPrice * item.quantity;

      orderItems.push({
        productId: item.productId,
        sku: item.sku || product.sku || "",
        quantity: item.quantity,
        originalPrice: item.originalPrice || product.price,
        discountedPrice: unitPrice,
        lineTotal: unitPrice * item.quantity
      });
    }

    // 4. Apply discounts and delivery charges
    const finalAmount = Math.round(
      calculatedTotal - (discountAmount || 0) + (deliveryCharge || 0)
    );

    // 5. Validate frontend total matches backend calculation
    if (finalAmount !== totalAmount) {
      return res.status(400).json({
        success: false,
        error: `Amount mismatch: Frontend (${totalAmount}) vs Backend (${finalAmount})`
      });
    }

    // 6. Generate a unique order ID
    const orderId = `ORDER_${uuidv4().toUpperCase().slice(0, 8)}`;

    // 7. Get UPI ID from .env
    const upiId = process.env.UPI_ID;
    if (!upiId) {
      return res.status(500).json({
        success: false,
        error: "UPI_ID not configured in .env"
      });
    }

    // 8. Generate UPI QR URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=AROHA HUB&am=${finalAmount}&cu=INR`;

    // 9. Create a temporary order
    const newOrder = new Order({
      orderId,
      userId,
      items: orderItems,
      customerName: customerDetails.name,
      customerMobile: customerDetails.mobile,
      deliveryAddress: customerDetails.address,
      customerLocation: customerDetails.location || null,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || "",
      subtotalAmount: calculatedTotal,
      deliveryCharge: deliveryCharge || 0,
      totalAmount: finalAmount,
      status: "Payment Verification Pending",
      paymentMethod: "UPI QR",
      upiId,
      upiUrl
    });
    await newOrder.save();

    // 10. Return payment session details
    res.json({
      success: true,
      orderId,
      upiUrl,
      upiId,
      amount: finalAmount,
      customerDetails,
      orderItems: orderItems
    });

  } catch (err) {
    console.error("Payment session error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to create payment session",
      details: err.message
    });
  }
});

// --- Verify Payment and Update Order Status ---
// NOTE: We add 'upload.single("screenshot")' here to handle the file
router.post("/verify-payment", upload.single("screenshot"), async (req, res) => {
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
    const order = await Order.findOne({ orderId });
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


router.post("/razorpay/create-order", async (req, res) => {
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
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, error: "Aroha order not found." });
    if (!Number.isFinite(order.totalAmount) || order.totalAmount <= 0) return res.status(400).json({ success: false, error: "Invalid order amount." });
    if (order.status === "Payment Verified") return res.status(409).json({ success: false, error: "Order is already paid." });

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
    console.log("[Razorpay]", requestId, "ORDER_CREATED", { orderId: order.orderId, gatewayOrderId: gatewayOrder.id, amountPaise: gatewayOrder.amount });
    res.json({ success: true, keyId, razorpayOrderId: gatewayOrder.id, amount: gatewayOrder.amount, currency: gatewayOrder.currency, name: order.customerName, mobile: order.customerMobile, arohaOrderId: order.orderId });
  } catch (err) {
    console.error("[Razorpay]", requestId, "Create-order error", err.message);
    res.status(500).json({ success: false, error: "Unable to create Razorpay order." });
  }
});

router.post("/razorpay/verify-payment", async (req, res) => {
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
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, error: "Aroha order not found." });
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

      console.log("[Razorpay]", requestId, "PAYMENT_CAPTURED", { orderId, gatewayOrderId: payment.order_id, paymentId: payment.id, amountPaise: payment.amount });
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


router.post("/razorpay/log-event", async (req, res) => {
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
    return res.status(400).json({ success: false, error: "Invalid Razorpay event." });
  }
  const safeDetails = details && typeof details === "object" ? {
    code: details.code ? String(details.code).slice(0, 100) : undefined,
    reason: details.reason ? String(details.reason).slice(0, 200) : undefined,
    status: details.status ? String(details.status).slice(0, 50) : undefined,
    message: details.message ? String(details.message).slice(0, 200) : undefined
  } : undefined;
  if (event === "PAYMENT_FAILED") {
    try {
      const order = await Order.findOne({ orderId: String(orderId) });
      if (order && order.status !== "Payment Verified") {
        order.status = "Payment Failed";
        order.paymentFailureReason = safeDetails?.reason || safeDetails?.message || safeDetails?.code || "Payment was not completed.";
        await order.save();
      }
    } catch (error) {
      console.error("[Razorpay] Could not record failed payment", error.message);
    }
  }
  console.log("[Razorpay][CLIENT_EVENT]", {
    event,
    orderId: String(orderId).slice(0, 80),
    gatewayOrderId: gatewayOrderId ? String(gatewayOrderId).slice(0, 80) : undefined,
    paymentId: paymentId ? String(paymentId).slice(0, 80) : undefined,
    details: safeDetails,
    at: new Date().toISOString()
  });
  return res.json({ success: true });
});

module.exports = router;