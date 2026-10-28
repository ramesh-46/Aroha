const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
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


router.post("/razorpay/log-event", (req, res) => {
  const allowedEvents = new Set([
    "CHECKOUT_OPENED",
    "CHECKOUT_DISMISSED",
    "PAYMENT_FAILED",
    "PAYMENT_HANDLER_CALLED",
    "CLIENT_VERIFICATION_SUCCESS",
    "CLIENT_VERIFICATION_PENDING",
    "CLIENT_VERIFICATION_ERROR",
    "CHECKOUT_START_FAILED"
  ]);
  const { event, orderId, gatewayOrderId, paymentId, details } = req.body || {};
  if (!allowedEvents.has(event) || !orderId) {
    return res.status(400).json({ success: false, error: "Invalid Razorpay event." });
  }
  const safeDetails = details && typeof details === "object" ? {
    code: details.code ? String(details.code).slice(0, 100) : undefined,
    reason: details.reason ? String(details.reason).slice(0, 200) : undefined,
    status: details.status ? String(details.status).slice(0, 50) : undefined,
    message: details.message ? String(details.message).slice(0, 200) : undefined
  } : undefined;
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